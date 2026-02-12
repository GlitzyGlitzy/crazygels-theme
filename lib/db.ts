import postgres from "postgres";

/**
 * Database connection with fallback:
 * 1. DATABASE_URL (Neon, Supabase, or any Postgres connection string)
 * 2. POSTGRES_URL (Vercel Postgres)
 * 3. RDS_* env vars (AWS RDS individual params)
 */
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const sql = connectionString
  ? postgres(connectionString, {
      ssl: { rejectUnauthorized: false },
      max: 5,
      idle_timeout: 30,
      connect_timeout: 30,
      max_lifetime: 60 * 5,
    })
  : postgres({
      host: process.env.RDS_HOST,
      port: parseInt(process.env.RDS_PORT || "5432"),
      database: process.env.RDS_DATABASE || "crazygels",
      username: process.env.RDS_USER || "admin_crazygels",
      password: process.env.RDS_PASSWORD,
      ssl: process.env.RDS_SSL === "false"
        ? false
        : { rejectUnauthorized: false },
      max: 5,
      idle_timeout: 30,
      connect_timeout: 30,
      max_lifetime: 60 * 5,
    });

export default sql;
