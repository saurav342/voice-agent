import "dotenv/config";

const BASE = (process.env.VOICELINK_API_BASE || "https://app.voicelink.co.in/api").replace(/\/+$/, "");
const TOKEN = process.env.VOICELINK_RESELLER_TOKEN;

if (!TOKEN) {
  console.error("VOICELINK_RESELLER_TOKEN not set in env.");
  process.exit(1);
}

async function vl(method: string, path: string) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { authorization: `Bearer ${TOKEN}`, accept: "application/json" },
  });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return t; }
}

async function main() {
  console.log("Fetching client list...");
  const clients = await vl("GET", "/v1/reseller/clients");
  console.log("Clients:", JSON.stringify(clients, null, 2));

  console.log("\nFetching call routing list...");
  const routing = await vl("GET", "/v1/call-routing/list");
  console.log("Routing:", JSON.stringify(routing, null, 2));

  console.log("\nFetching websocket bots...");
  const bots = await vl("GET", "/v1/websocket-bot/list");
  console.log("Websocket Bots:", JSON.stringify(bots, null, 2));
}

main().catch(console.error);
