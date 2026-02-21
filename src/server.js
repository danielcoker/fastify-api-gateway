import Fastify from "fastify";
import { routes, activeEnv } from "./config.js";
import { createProxyHandler } from "./proxy.js";

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const HOST = process.env.HOST ?? "0.0.0.0";

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? "info",
  },
  // trust the proxy in front of us (Coolify/Traefik) so req.ip is real
  trustProxy: true,
});

// Register one wildcard route per service prefix
for (const { prefix, upstream } of routes) {
  const wildcardPath = `${prefix}/*`;
  const handler = createProxyHandler(upstream, prefix);

  fastify.route({ method: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"], url: wildcardPath, handler });

  fastify.log.info(`[gateway] ${wildcardPath} → ${upstream}`);
}

// Catch-all for unmatched routes
fastify.setNotFoundHandler((req, reply) => {
  reply.status(404).send({ error: "Not Found", path: req.url });
});

// Startup
try {
  console.log("Routes: ", fastify.printRoutes())
  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.info(`[gateway] env=${activeEnv} listening on ${HOST}:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}