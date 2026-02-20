# API Gateway

Lean internal API gateway built with Fastify + Undici. Receives requests, strips the service prefix, and pipes them to the correct upstream — nothing more.

## How it works

```
api.afmweca.org/afmauth/api/v1/users
        │
        ▼
  [gateway strips /afmauth]
        │
        ▼
  http://afmauth-service:3000/api/v1/users
```

Bodies and response streams are piped directly — nothing is buffered in memory.

---

## Adding a service

Edit `src/config.js` and add an entry to the relevant environment block:

```js
{ prefix: "/afmnewservice", upstream: "http://afmnewservice:3000" },
```

That's it. Restart the gateway.

---

## Environment variables

| Variable       | Default        | Description                              |
|----------------|----------------|------------------------------------------|
| `GATEWAY_ENV`  | `production`   | Which upstream block to use              |
| `PORT`         | `3000`         | Listening port inside the container      |
| `LOG_LEVEL`    | `info`         | Pino log level                           |

---

## Coolify setup

You deploy **two separate gateway services** in Coolify — one for prod, one for staging. They run the same Docker image but with different env vars:

**Production service**
```
GATEWAY_ENV=production
```
Expose via `api.afmweca.org` in Coolify's domain settings.

**Staging service**
```
GATEWAY_ENV=staging
```
Expose via `api-staging.afmweca.org`.

Both images are identical. Only the env var differs.

---

## Local dev

```bash
npm install
node --watch src/server.js
```

---

## Project structure

```
src/
  config.js   – route table (all environments)
  proxy.js    – undici proxy handler
  server.js   – fastify bootstrap
Dockerfile
.env.example
```