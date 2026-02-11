import postgres from "postgres";

const sql = postgres({
  host: process.env.RDS_HOST,
  port: parseInt(process.env.RDS_PORT || "5432"),
  database: process.env.RDS_DATABASE || "crazygels",
  username: process.env.RDS_USER || "admin_crazygels",
  password: process.env.RDS_PASSWORD,
  ssl: process.env.RDS_SSL === "false" ? false : "require",
  max: 5,
  idle_timeout: 30,
  connect_timeout: 10,
});

export default sql;
