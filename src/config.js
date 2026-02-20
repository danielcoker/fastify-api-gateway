const environments = {
  production: [
    { prefix: "/afmauth", upstream: "http://afmauth-service-production:3000" },
  ],

  staging: [
    { prefix: "/afmauth", upstream: "http://afmauth-service-staging:3000" },
  ],
};

const env = process.env.GATEWAY_ENV ?? "production";

if (!environments[env]) {
  console.error(`[gateway] Unknown GATEWAY_ENV="${env}". Valid values: ${Object.keys(environments).join(", ")}`);
  process.exit(1);
}

export const routes = environments[env];
export const activeEnv = env;
