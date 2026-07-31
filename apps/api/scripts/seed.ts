/**
 * Seed Kelsa AI tenant + Gemini agent + the two VoiceLink DIDs + login
 * users. Idempotent: upserts by stable ids. Run:
 *   npx tsx scripts/seed.ts
 */
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcrypt";

const MONGO_URL = process.env.MONGO_URL!;
const VOICELINK_CLIENT_ID = 1507; // Saurav Kumar

const TENANT_ID = "vaani-tenant";
const AGENT_ID = "vaani-receptionist";
const DIDS = [
  { number: "919484959291", botId: "244" },
];

const SUPERADMIN = { email: "demo@vaanilabs.co", password: "aicall2026" };
const OWNER = { email: "admin@vaanilabs.co", password: "aicall2026" };

async function main() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db();
  const now = new Date();

  // ---- Tenant ----
  await db.collection("tenants").updateOne(
    { _id: TENANT_ID as any },
    {
      $set: {
        name: "Kelsa AI",
        plan: "scale",
        status: "active",
        telephony: { provider: "voicelink", providerClientId: VOICELINK_CLIENT_ID, walletThresholdNotify: 0 },
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );

  // ---- Agents (Remove existing and seed only Rohan & Aditi) ----
  console.log("Removing all existing agents from database...");
  await db.collection("agents").deleteMany({});

  const AGENTS = [
    {
      _id: "rohan-outbound-loan",
      tenantId: TENANT_ID,
      name: "Rohan (Outbound Loan Agent - Hilsa Insurance)",
      prompt:
        "You are Rohan, an AI outbound loan agent for Hilsa Insurance. Speak in a natural, polite, and confident Indian conversational tone.\n\n" +
        "CORE BEHAVIOR RULES:\n" +
        "• CONTINUOUS MULTILINGUAL ADAPTATION: Dynamically mirror the user's language/dialect (English, Hinglish, Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, Bengali) on EVERY turn. Never lock into a single language permanently.\n" +
        "• ZERO REPETITION: Avoid repeating identical phrases, sentence structures, or words you or the user just said. Keep phrasing fresh.\n" +
        "• INTERRUPTION HANDLING: Speak ONE short sentence at a time. If the customer starts speaking while you generate, stop immediately and listen.\n\n" +
        "CONVERSATION FLOW:\n" +
        "1. Greet, confirm you are speaking with {{name}}, and ask if it’s a good time to talk about their loan enquiry.\n" +
        "2. If busy/not interested: Politely offer a callback or wrap up.\n" +
        "3. If available: Ask one simple question at a time to collect: Loan Type ➔ Required Amount ➔ Income/Turnover ➔ Work/Business Duration ➔ Existing Loans.\n" +
        "4. Explain simply: \"Eligibility and interest rates depend on document verification, credit history, and company policy.\"",
      voice: { provider: "gemini-live", providerVoiceId: "Puck" },
      llm: { realtimeModel: "gemini-live-2.0", temperature: 0.7 },
      tools: [],
      greeting: "Hello! Am I speaking with {{name}}? I'm Rohan calling from Hilsa Insurance regarding your loan enquiry. Is this a good time to talk?",
      endCallTriggers: [
        "goodbye",
        "bye bye",
        "bye-bye",
        "have a great day",
        "have a nice day",
        "talk to you later",
        "talk to you soon",
        "thank you goodbye",
        "dhanyawad",
        "namaste",
      ],
      status: "published",
      updatedAt: now,
      createdAt: now,
    },
    {
      _id: "aditi-recovery-officer",
      tenantId: TENANT_ID,
      name: "Aditi (Recovery Officer - Kelsa Finance)",
      prompt:
        "You are Aditi, an empathetic AI recovery officer for Kelsa Finance. \n" +
        "Customer Data: Name: Rahul Sharma | Overdue EMI: ₹8,750 | Due Date: 15 July 2026 | Days Overdue: 9.\n\n" +
        "CORE BEHAVIOR RULES:\n" +
        "• CONTINUOUS MULTILINGUAL ADAPTATION: Seamlessly match the customer's language on every turn (English, Hinglish, Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, Bengali). Switch languages anytime they do.\n" +
        "• ZERO REPETITION: Never repeat words or phrase fragments you just spoke. Do not echo the user's words back to them unnecessarily.\n" +
        "• STRICT REAL-TIME TURN-TAKING: Limit every turn to 1-2 short conversational sentences maximum. Stop speaking immediately if the customer interrupts.\n\n" +
        "CONVERSATION FLOW:\n" +
        "1. Greet, confirm you are speaking with Rahul Sharma, check if it's a good time, and inform them about the overdue EMI of ₹8,750 from 15 July 2026.\n" +
        "2. If financial difficulty/unawareness is mentioned: Show genuine empathy, stay solution-oriented, and ask for a specific payment commitment date.\n" +
        "3. Payment Assistance: Offer UPI, net banking, or online portal if needed to secure the earliest realistic date.\n" +
        "4. Conclusion: Reconfirm the agreed payment date, thank them, and politely remind them that timely payments help maintain a good credit score.",
      voice: { provider: "gemini-live", providerVoiceId: "Aoede" },
      llm: { realtimeModel: "gemini-live-2.0", temperature: 0.7 },
      tools: [],
      greeting: "Hello! Am I speaking with Rahul Sharma? This is Aditi calling from Kelsa Finance regarding your overdue EMI of ₹8,750 from 15 July 2026. Is now a good time to speak?",
      endCallTriggers: [
        "goodbye",
        "bye bye",
        "bye-bye",
        "have a great day",
        "have a nice day",
        "talk to you later",
        "talk to you soon",
        "thank you goodbye",
        "dhanyawad",
        "namaste",
      ],
      status: "published",
      updatedAt: now,
      createdAt: now,
    },
  ];

  for (const agent of AGENTS) {
    await db.collection("agents").updateOne(
      { _id: agent._id as any },
      { $set: agent },
      { upsert: true }
    );
    console.log(`Seeded agent: ${agent.name} (${agent._id})`);
  }

  // ---- DIDs (id = phone number so WS path = /ws/voicelink/<number>) ----
  for (const d of DIDS) {
    await db.collection("dids").updateOne(
      { _id: d.number as any },
      {
        $set: {
          tenantId: TENANT_ID,
          provider: "voicelink",
          providerNumber: d.number,
          didType: "mobile",
          defaultAgentId: "rohan-outbound-loan",
          providerBotId: d.botId,
          status: "active",
          updatedAt: now,
        },
        $setOnInsert: { assignedAt: now, createdAt: now },
      },
      { upsert: true },
    );
  }

  // ---- Users ----
  async function upsertUser(email: string, password: string, opts: { superadmin: boolean; tenantId: string | null }) {
    const passwordHash = await bcrypt.hash(password, 10);
    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      await db.collection("users").updateOne(
        { email },
        { $set: { passwordHash, isSuperadmin: opts.superadmin, tenantId: opts.tenantId, role: "owner", updatedAt: now } },
      );
    } else {
      await db.collection("users").insertOne({
        _id: new ObjectId().toString() as any,
        email,
        passwordHash,
        role: "owner",
        isSuperadmin: opts.superadmin,
        tenantId: opts.tenantId,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
  await upsertUser(SUPERADMIN.email, SUPERADMIN.password, { superadmin: true, tenantId: null });
  await upsertUser(OWNER.email, OWNER.password, { superadmin: false, tenantId: TENANT_ID });

  // Give the tenant 1,000,000 credits (balance lives in the `credits`
  // collection; the sidebar reads it via getBalance()).
  await db.collection("credits").updateOne(
    { _id: TENANT_ID as any },
    { $set: { tenantId: TENANT_ID, balance: 1_000_000, unit: "minutes", updatedAt: now } },
    { upsert: true },
  );

  console.log(JSON.stringify({
    tenant: TENANT_ID,
    agent: AGENT_ID,
    dids: DIDS.map((d) => d.number),
    superadmin: SUPERADMIN.email,
    owner: OWNER.email,
  }, null, 2));
  await client.close();
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
