export const config = {
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://catraca:catraca@127.0.0.1:5432/catraca',
  sessionSecret: process.env.SESSION_SECRET ?? 'catraca-dev-session-secret',
  partnerApiKey: process.env.PARTNER_API_KEY ?? 'partner_key_catraca_dev',
  port: Number(process.env.PORT ?? 3000),
};
