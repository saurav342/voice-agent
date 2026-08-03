/**
 * One-command VoiceLink wiring. For each DID the reseller already has a
 * call-routing record for, this creates a WebSocket bot pointing at our
 * public WS URL and routes that DID (inbound + outbound) to the bot.
 *
 * Requires in apps/api/.env: VOICELINK_RESELLER_TOKEN, VOICELINK_API_BASE,
 * WS_BASE_URL (wss://<your-tunnel-host>).
 *
 *   pnpm --filter @voiceplatform/api exec tsx scripts/setup-voicelink.ts
 */
import "dotenv/config";

const BASE = (process.env.VOICELINK_API_BASE || "https://app.voicelink.co.in/api").replace(/\/+$/, "");
const TOKEN = process.env.VOICELINK_RESELLER_TOKEN;
const WS = process.env.WS_BASE_URL;

if (!TOKEN || !WS) {
  console.error("Set VOICELINK_RESELLER_TOKEN and WS_BASE_URL in apps/api/.env first.");
  process.exit(1);
}
const HTTP = WS.replace(/^wss:/, "https:").replace(/^ws:/, "http:");

async function vl<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { authorization: `Bearer ${TOKEN}`, accept: "application/json", "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let j: unknown;
  try { j = JSON.parse(t); } catch { j = t; }
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${t.slice(0, 200)}`);
  return j as T;
}

async function main() {
  const clients = await vl<{ data: { id: number; name: string; dids?: { did_id: number; did_number: number; user_status_label: string }[] }[] }>("GET", "/v1/reseller/clients");
  const client = clients.data?.[0];
  if (!client) throw new Error("no client found on this reseller account");
  console.log(`client: ${client.name} (${client.id})`);

  const activeDids = (client.dids || []).filter(d => d.user_status_label !== "Expired");
  if (!activeDids.length) {
    console.error("No active DIDs found for client.");
    process.exit(1);
  }

  const routingRes = await vl<{ data: { id: number; did_number: number }[] }>("GET", "/v1/call-routing/list");
  const existingRoutings = routingRes.data || [];

  for (const did of activeDids) {
    const num = String(did.did_number);
    const bot = await vl<{ data: { id: number } }>("POST", "/v1/websocket-bot/create", {
      bot_name: `VaaniX AI - ${num}`,
      websocket_url: `${WS}/ws/voicelink/${num}`,
      webhook_url: `${HTTP}/webhooks/voicelink`,
      status: 1,
      client_id: client.id,
    });
    const botId = bot.data?.id;

    const existingRouting = existingRoutings.find(r => String(r.did_number) === num);
    if (existingRouting) {
      await vl("POST", `/v1/call-routing/update/${existingRouting.id}`, {
        for_inbound_call: 3, inbound_websocket_bot_id: botId,
        for_outbound_call: 3, outbound_websocket_bot_id: botId,
        status: 1,
      });
      console.log(`Updated routing for ${num} -> websocket bot ${botId}`);
    } else {
      await vl("POST", "/v1/call-routing/create", {
        did_number: num,
        for_inbound_call: 3, inbound_websocket_bot_id: botId,
        for_outbound_call: 3, outbound_websocket_bot_id: botId,
        status: 1,
        client_id: client.id,
      });
      console.log(`Created routing for ${num} -> websocket bot ${botId}`);
    }
  }
  console.log("Done. Now run scripts/seed.ts, then call from the dashboard.");
}

main().catch((e) => { console.error(e); process.exit(1); });
