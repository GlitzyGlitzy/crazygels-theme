import { Pool } from "pg";

const pool = new Pool({
  host: process.env.RDS_HOST,
  port: parseInt(process.env.RDS_PORT || "5432"),
  database: process.env.RDS_DATABASE || "crazygels",
  user: process.env.RDS_USER || "scraper_admin",
  password: process.env.RDS_PASSWORD,
  ssl: process.env.RDS_SSL === "false" ? false : { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export default pool;
