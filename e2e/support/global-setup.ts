import { execSync } from "node:child_process";

/**
 * The backend rate-limits sign-ups and sign-ins per IP (10 sign-ups an hour), and every journey
 * signs up its own users from 127.0.0.1. On the isolated e2e database we clear the counters before
 * each run so consecutive runs do not trip the limiter.
 *
 * E2E_PSQL is a psql command reading SQL from stdin for the e2e database; set it to an empty string
 * to skip the reset (e.g. when the limits are raised in the backend environment instead).
 */
const DEFAULT_PSQL = "docker exec -i aero-zenith-flow-dev-postgres-1 psql -U azf -d azf_e2e";

export default function globalSetup() {
  const psql = process.env.E2E_PSQL ?? DEFAULT_PSQL;
  if (!psql) return;
  if (!/e2e/.test(psql)) {
    throw new Error(`E2E_PSQL must target an e2e database, refusing to touch: ${psql}`);
  }
  execSync(psql, {
    input: "delete from rate_limit_counters;",
    stdio: ["pipe", "ignore", "inherit"],
  });
}
