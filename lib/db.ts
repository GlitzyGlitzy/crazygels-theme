import postgres from "postgres";

const sslMode = process.env.RDS_SSL === "false" ? false : "require";

const sql = postgres({
  host: process.env.RDS_HOST,
  port: parseInt(process.env.RDS_PORT || "5432"),
  database: process.env.RDS_DATABASE || "crazygels",
  username: process.env.RDS_USER || "admin_crazygels",
  password: process.env.RDS_PASSWORD,
  ssl: sslMode
    ? { rejectUnauthorized: false }
    : false,
  max: 5,
  idle_timeout: 30,
  connect_timeout: 30,
  max_lifetime: 60 * 5,
});

export default sql;
