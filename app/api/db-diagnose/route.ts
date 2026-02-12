import { NextResponse } from "next/server";
import { resolve } from "dns/promises";
import { createConnection } from "net";

/**
 * Deep connectivity diagnostic for RDS.
 * Tests DNS -> TCP -> SSL -> Postgres layer by layer.
 */
export async function GET() {
  const host = process.env.RDS_HOST || "";
  const port = parseInt(process.env.RDS_PORT || "5432");
  const database = process.env.RDS_DATABASE || "crazygels";
  const user = process.env.RDS_USER || "admin_crazygels";
  const hasPassword = !!process.env.RDS_PASSWORD;
  const sslSetting = process.env.RDS_SSL ?? "(not set, defaults to require)";

  const steps: Array<{
    step: string;
    status: "pass" | "fail" | "skip";
    detail: string;
    ms?: number;
  }> = [];

  // ── Step 1: Env vars ──
  const envIssues: string[] = [];
  if (!host) envIssues.push("RDS_HOST is empty");
  if (!hasPassword) envIssues.push("RDS_PASSWORD is empty");
  steps.push({
    step: "Environment Variables",
    status: envIssues.length ? "fail" : "pass",
    detail: envIssues.length
      ? envIssues.join("; ")
      : `host=${host}, port=${port}, db=${database}, user=${user}, ssl=${sslSetting}`,
  });

  if (!host) {
    return NextResponse.json({ steps }, { status: 500 });
  }

  // ── Step 2: DNS resolution ──
  const dnsStart = Date.now();
  try {
    const addresses = await resolve(host);
    steps.push({
      step: "DNS Resolution",
      status: "pass",
      detail: `${host} -> ${addresses.join(", ")}`,
      ms: Date.now() - dnsStart,
    });
  } catch (e) {
    steps.push({
      step: "DNS Resolution",
      status: "fail",
      detail: `Cannot resolve ${host}: ${e instanceof Error ? e.message : String(e)}`,
      ms: Date.now() - dnsStart,
    });
    return NextResponse.json({ steps }, { status: 500 });
  }

  // ── Step 3: Raw TCP connection ──
  const tcpStart = Date.now();
  const tcpResult = await new Promise<{ ok: boolean; detail: string }>((res) => {
    const timeout = setTimeout(() => {
      socket.destroy();
      res({
        ok: false,
        detail: `TCP connection to ${host}:${port} timed out after 10s. Port 5432 is not reachable — check VPC security group inbound rules, NACLs, and subnet route tables.`,
      });
    }, 10_000);

    const socket = createConnection({ host, port }, () => {
      clearTimeout(timeout);
      socket.destroy();
      res({ ok: true, detail: `TCP connected to ${host}:${port}` });
    });

    socket.on("error", (err) => {
      clearTimeout(timeout);
      res({
        ok: false,
        detail: `TCP error: ${err.message}. The port is not reachable.`,
      });
    });
  });
  steps.push({
    step: "TCP Connection (port 5432)",
    status: tcpResult.ok ? "pass" : "fail",
    detail: tcpResult.detail,
    ms: Date.now() - tcpStart,
  });

  if (!tcpResult.ok) {
    steps.push({
      step: "Troubleshooting",
      status: "fail",
      detail: [
        "The TCP handshake failed. This means the network cannot reach port 5432 on your RDS. Possible causes:",
        "1. Security group inbound rules: Must have a rule for port 5432 with source 0.0.0.0/0 (or your IP). Check BOTH security groups if two are assigned.",
        "2. Subnet route table: The subnet must have a route to an Internet Gateway (0.0.0.0/0 -> igw-xxxxx). Go to VPC > Subnets > find the subnet for us-east-1d > check its Route Table.",
        "3. Network ACLs: The subnet's NACL must allow inbound AND outbound on port 5432.",
        "4. The 'default' security group you have assigned may only allow inbound from itself (self-referencing rule). Create a new security group with an explicit port 5432 inbound rule.",
      ].join("\n"),
    });
    return NextResponse.json({ steps }, { status: 500 });
  }

  // ── Step 4: Postgres connection (via the postgres library) ──
  const pgStart = Date.now();
  try {
    // Create a fresh, isolated connection for testing
    const postgres = (await import("postgres")).default;
    const testSql = postgres({
      host,
      port,
      database,
      username: user,
      password: process.env.RDS_PASSWORD,
      ssl: process.env.RDS_SSL === "false" ? false : { rejectUnauthorized: false },
      max: 1,
      idle_timeout: 5,
      connect_timeout: 15,
    });

    const [result] = await testSql`SELECT current_database() as db, current_user as usr, version() as ver`;
    await testSql.end();

    steps.push({
      step: "PostgreSQL Handshake",
      status: "pass",
      detail: `Connected! db=${result.db}, user=${result.usr}, ${result.ver?.split(",")[0]}`,
      ms: Date.now() - pgStart,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    let pgHint = "";
    if (msg.includes("password authentication")) {
      pgHint = "Wrong password or user. Check RDS_USER and RDS_PASSWORD.";
    } else if (msg.includes("does not exist")) {
      pgHint = `Database "${database}" does not exist. Your RDS default database is likely "postgres". Set RDS_DATABASE=postgres in your .env.local.`;
    } else if (msg.includes("SSL") || msg.includes("ssl") || msg.includes("TLS")) {
      pgHint = "SSL/TLS handshake failed. Try setting RDS_SSL=false in .env.local.";
    } else if (msg.includes("timeout")) {
      pgHint = "Postgres handshake timed out after TCP connected. Likely an SSL negotiation issue. Try RDS_SSL=false.";
    }

    steps.push({
      step: "PostgreSQL Handshake",
      status: "fail",
      detail: `${msg}${pgHint ? ` | Hint: ${pgHint}` : ""}`,
      ms: Date.now() - pgStart,
    });
  }

  // ── Step 5: Also try with database=postgres if default failed ──
  if (database !== "postgres" && steps.some((s) => s.step === "PostgreSQL Handshake" && s.status === "fail" && s.detail.includes("does not exist"))) {
    const pg2Start = Date.now();
    try {
      const postgres = (await import("postgres")).default;
      const testSql2 = postgres({
        host,
        port,
        database: "postgres",
        username: user,
        password: process.env.RDS_PASSWORD,
        ssl: process.env.RDS_SSL === "false" ? false : { rejectUnauthorized: false },
        max: 1,
        idle_timeout: 5,
        connect_timeout: 15,
      });
      const [result] = await testSql2`SELECT current_database() as db`;
      await testSql2.end();
      steps.push({
        step: "Fallback: database=postgres",
        status: "pass",
        detail: `Connected with database="postgres" instead of "${database}". Update RDS_DATABASE=postgres in your .env.local.`,
        ms: Date.now() - pg2Start,
      });
    } catch {
      steps.push({
        step: "Fallback: database=postgres",
        status: "fail",
        detail: "Also failed with database=postgres.",
        ms: Date.now() - pg2Start,
      });
    }
  }

  const allPassed = steps.every((s) => s.status !== "fail");
  return NextResponse.json({ steps }, { status: allPassed ? 200 : 500 });
}
