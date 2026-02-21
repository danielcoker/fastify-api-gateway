import { request } from "undici";

/**
 * Builds a Fastify route handler that proxies to the given upstream.
 * The prefix is already stripped from req.url by the time we get here.
 */
export function createProxyHandler(upstream, prefix) {
  return async function proxyHandler(req, reply) {
    const strippedPath = req.url.slice(prefix.length) || "/";
    const targetUrl = upstream + strippedPath;

    // Copy incoming headers, replace host with the upstream host
    const headers = Object.assign({}, req.headers);
    headers["host"] = new URL(upstream).host;

    // x-forwarded-for so upstreams know the real client IP
    const existingXff = headers["x-forwarded-for"];
    headers["x-forwarded-for"] = existingXff
      ? `${existingXff}, ${req.ip}`
      : req.ip;

    let upstreamRes;
    try {
      upstreamRes = await request(targetUrl, {
        method: req.method,
        headers,
        body: req.method !== "GET" && req.method !== "HEAD" ? req.raw : undefined,
        // stream the request body through without buffering
        duplex: "half",
      });
    } catch (err) {
      req.log.error({ err, targetUrl }, "upstream request failed");
      reply.status(502).send({ error: "Bad Gateway", message: err.message });
      return;
    }

    // Stream upstream response headers → client
    reply.status(upstreamRes.statusCode);
    for (const [key, value] of Object.entries(upstreamRes.headers)) {
      // skip headers node/undici manages automatically
      if (key === "transfer-encoding") continue;
      reply.header(key, value);
    }

    // Pipe the body — never buffers the full payload in memory
    return reply.send(upstreamRes.body);
  };
}
