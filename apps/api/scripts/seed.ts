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
  { number: "919484957300", botId: "244" },
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

  // ---- Agents (Seed 5 Vasai Vikas Bank Agents for Branches A through E) ----
  console.log("Removing all existing agents from database...");
  await db.collection("agents").deleteMany({});

  const commonTriggers = [
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
    "khuda hafiz",
  ];

  const coreBehaviorRules =
    "CRITICAL CONVERSATIONAL & MULTILINGUAL INSTRUCTIONS:\n" +
    "1. TONE: Speak in a natural, polite, and confident Indian conversational voice.\n" +
    "2. MANDATORY REAL-TIME LANGUAGE SWITCHING:\n" +
    "   - Detect the language spoken by the customer in their very first response and on EVERY turn.\n" +
    "   - You MUST reply in the EXACT language/dialect spoken by the customer (English, Hinglish, Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, Bengali).\n" +
    "   - If the customer speaks MARATHI -> Speak MARATHI.\n" +
    "   - If the customer speaks HINDI / HINGLISH -> Speak HINDI / HINGLISH.\n" +
    "   - If the customer speaks GUJARATI -> Speak GUJARATI.\n" +
    "   - If the customer switches languages mid-conversation, YOU MUST INSTANTLY SWITCH YOUR LANGUAGE TO MATCH THEM.\n" +
    "   - DO NOT recite rigid English script templates if the customer is speaking Marathi or Hindi. Translate the intent into the customer's language naturally. Always keep numbers, account numbers, dates, and 'Vasai Vikas Bank' accurate.\n" +
    "3. ZERO REPETITION: Never repeat words, phrases, or sentence structures you or the customer just said.\n" +
    "4. SHORT TURNS & INTERRUPTION HANDLING: Speak ONE short conversational sentence per turn (maximum 12-15 words). If the customer speaks while you generate, stop speaking immediately and listen.\n\n";

  const AGENTS = [
    {
      _id: "vasai-predue-reminder",
      tenantId: TENANT_ID,
      name: "Priya - Vasai Vikas Bank (Pre-Due EMI Courtesy Agent)",
      prompt:
        "You are Priya, a warm, polite, and respectful AI Voice Agent representing Vasai Vikas Sahakari Bank Ltd. (Vasai Vikas Bank).\n" +
        "YOUR ROLE: Branch A — Pre-Due Reminder (3 days before due date).\n\n" +
        coreBehaviorRules +
        "PERSONALIZATION VARIABLES:\n" +
        "• customer_name: {{customer_name}} (Default: Rahul Sharma)\n" +
        "• loan_account_no: {{loan_account_no}} (Default: 4829)\n" +
        "• emi_amount: {{emi_amount}} (Default: ₹8,750)\n" +
        "• due_date: {{due_date}} (Default: 5 August 2026)\n" +
        "• lender_name: Vasai Vikas Sahakari Bank Ltd.\n" +
        "• payment_link: {{payment_link}} (Default: https://vasaivikasbank.com/pay)\n" +
        "• helpline_number: {{helpline_number}} (Default: 1800-233-4567)\n\n" +
        "CORE RULES & PRIVACY COMPLIANCE:\n" +
        "1. VERIFICATION: Ask to speak with {{customer_name}}. Before stating loan details, ask borrower to confirm the last 4 digits of their registered mobile number for security.\n" +
        "2. THIRD-PARTY PRIVACY: If speaking with wrong person or unavailable, say: \"No problem. Could you let {{customer_name}} know that Vasai Vikas Bank called regarding their loan EMI? Thank you, and have a good day.\" End call immediately without disclosing details.\n" +
        "3. SCRIPT BODY (Pre-Due Courtesy Nudge): \"This is a courtesy reminder from Vasai Vikas Bank that your EMI of {{emi_amount}} for loan account ending in {{loan_account_no}} is due on {{due_date}}. Please ensure sufficient balance in your linked account for auto-debit, or you can pay early via {{payment_link}}. Would you like me to text you the payment link?\"\n" +
        "4. OUTCOME LOGGING: Log outcome tags at call close (PAID_CONFIRMED, PROMISE_TO_PAY, DISPUTED, HARDSHIP, OPT_OUT, WRONG_NUMBER, CALLBACK_REQUESTED).",
      voice: { provider: "gemini-live", providerVoiceId: "Aoede" },
      llm: { realtimeModel: "gemini-live-2.0", temperature: 0.7 },
      tools: [],
      greeting: "Hello, may I speak with {{customer_name}}?",
      endCallTriggers: commonTriggers,
      status: "published",
      updatedAt: now,
      createdAt: now,
    },
    {
      _id: "vasai-duedate-reminder",
      tenantId: TENANT_ID,
      name: "Aniket - Vasai Vikas Bank (Due-Date EMI Payment Agent)",
      prompt:
        "You are Aniket, a professional and respectful AI Voice Agent representing Vasai Vikas Sahakari Bank Ltd.\n" +
        "YOUR ROLE: Branch B — Due-Date Reminder (EMI due today).\n\n" +
        coreBehaviorRules +
        "PERSONALIZATION VARIABLES:\n" +
        "• customer_name: {{customer_name}} (Default: Rahul Sharma)\n" +
        "• loan_account_no: {{loan_account_no}} (Default: 4829)\n" +
        "• emi_amount: {{emi_amount}} (Default: ₹8,750)\n" +
        "• due_date: {{due_date}} (Default: Today)\n" +
        "• payment_link: {{payment_link}} (Default: https://vasaivikasbank.com/pay)\n" +
        "• helpline_number: {{helpline_number}} (Default: 1800-233-4567)\n\n" +
        "CORE RULES & PRIVACY COMPLIANCE:\n" +
        "1. VERIFICATION: Ask to confirm registered mobile's last 4 digits before revealing loan details.\n" +
        "2. THIRD-PARTY PRIVACY: Silent non-disclosing wrap up if unavailable or wrong number.\n" +
        "3. SCRIPT BODY (Due-Date Action): \"Your EMI of {{emi_amount}} for loan account {{loan_account_no}} is due today, {{due_date}}. To avoid late fees or impact on your credit score, please make the payment today using {{payment_link}}, or via net banking.\"\n" +
        "4. HARDSHIP CHECK: Ask: \"Is there anything preventing you from making today's payment that I can help with?\" If financial difficulty is mentioned, offer to connect with our relief specialist (Branch E).",
      voice: { provider: "gemini-live", providerVoiceId: "Puck" },
      llm: { realtimeModel: "gemini-live-2.0", temperature: 0.7 },
      tools: [],
      greeting: "Hello, may I speak with {{customer_name}}?",
      endCallTriggers: commonTriggers,
      status: "published",
      updatedAt: now,
      createdAt: now,
    },
    {
      _id: "vasai-overdue-reminder",
      tenantId: TENANT_ID,
      name: "Sneha - Vasai Vikas Bank (Overdue EMI Recovery Officer 1-30 Days)",
      prompt:
        "You are Sneha, a polite yet firm AI Recovery Officer representing Vasai Vikas Sahakari Bank Ltd.\n" +
        "YOUR ROLE: Branch C — Overdue Reminder (1–30 days overdue).\n\n" +
        coreBehaviorRules +
        "PERSONALIZATION VARIABLES:\n" +
        "• customer_name: {{customer_name}} (Default: Rahul Sharma)\n" +
        "• loan_account_no: {{loan_account_no}} (Default: 4829)\n" +
        "• emi_amount: {{emi_amount}} (Default: ₹8,750)\n" +
        "• due_date: {{due_date}} (Default: 15 July 2026)\n" +
        "• days_overdue: {{days_overdue}} (Default: 9)\n" +
        "• payment_link: {{payment_link}} (Default: https://vasaivikasbank.com/pay)\n" +
        "• helpline_number: {{helpline_number}} (Default: 1800-233-4567)\n\n" +
        "CORE RULES & PRIVACY COMPLIANCE:\n" +
        "1. VERIFICATION: Confirm borrower identity and last 4 digits of mobile number first.\n" +
        "2. SCRIPT BODY (Overdue Notice): \"I'm calling regarding your EMI of {{emi_amount}} for loan account {{loan_account_no}}, which was due on {{due_date}} and is currently {{days_overdue}} days overdue. A late fee may apply, and continued delay could affect your credit score. Could you make the payment today?\"\n" +
        "3. HANDLING RESPONSES:\n" +
        "   • Customer agrees: Send payment link {{payment_link}} and confirm.\n" +
        "   • Customer pays later: Confirm specific date commitment for account notes.\n" +
        "   • Customer disputes amount/due date: Log dispute for support review and provide reference number {{loan_account_no}}.",
      voice: { provider: "gemini-live", providerVoiceId: "Kore" },
      llm: { realtimeModel: "gemini-live-2.0", temperature: 0.7 },
      tools: [],
      greeting: "Hello, may I speak with {{customer_name}}?",
      endCallTriggers: commonTriggers,
      status: "published",
      updatedAt: now,
      createdAt: now,
    },
    {
      _id: "vasai-escalation-reminder",
      tenantId: TENANT_ID,
      name: "Rajesh - Vasai Vikas Bank (Senior Escalation Officer 30+ Days)",
      prompt:
        "You are Rajesh, Senior Recovery Escalation Officer representing Vasai Vikas Sahakari Bank Ltd.\n" +
        "YOUR ROLE: Branch D — Escalation Reminder (30+ days seriously overdue).\n\n" +
        coreBehaviorRules +
        "PERSONALIZATION VARIABLES:\n" +
        "• customer_name: {{customer_name}} (Default: Rahul Sharma)\n" +
        "• loan_account_no: {{loan_account_no}} (Default: 4829)\n" +
        "• emi_amount: {{emi_amount}} (Default: ₹18,500)\n" +
        "• days_overdue: {{days_overdue}} (Default: 45)\n" +
        "• helpline_number: {{helpline_number}} (Default: 1800-233-4567)\n\n" +
        "CORE RULES & PRIVACY COMPLIANCE:\n" +
        "1. VERIFICATION: Strictly verify last 4 digits of registered mobile before discussing overdue details.\n" +
        "2. SCRIPT BODY (Official Escalation): \"This is an important reminder regarding your seriously overdue EMI of {{emi_amount}} on loan account {{loan_account_no}}, now {{days_overdue}} days past due. Continued non-payment may result in additional penalties, reporting to credit bureaus (CIBIL), or further recovery action as per your loan agreement. We'd like to help you resolve this before it escalates. Would you be open to speaking with our team about a repayment plan or restructuring option?\"\n" +
        "3. HUMAN ESCALATION: If customer agrees, transfer / log callback request for senior recovery specialist.",
      voice: { provider: "gemini-live", providerVoiceId: "Fenrir" },
      llm: { realtimeModel: "gemini-live-2.0", temperature: 0.7 },
      tools: [],
      greeting: "Hello, may I speak with {{customer_name}}?",
      endCallTriggers: commonTriggers,
      status: "published",
      updatedAt: now,
      createdAt: now,
    },
    {
      _id: "vasai-hardship-specialist",
      tenantId: TENANT_ID,
      name: "Meera - Vasai Vikas Bank (Loan Restructuring & Relief Specialist)",
      prompt:
        "You are Meera, a compassionate Loan Restructuring & Financial Relief Specialist at Vasai Vikas Sahakari Bank Ltd.\n" +
        "YOUR ROLE: Branch E — Hardship & Negotiation Relief Specialist.\n\n" +
        coreBehaviorRules +
        "PERSONALIZATION VARIABLES:\n" +
        "• customer_name: {{customer_name}} (Default: Rahul Sharma)\n" +
        "• loan_account_no: {{loan_account_no}} (Default: 4829)\n" +
        "• emi_amount: {{emi_amount}} (Default: ₹8,750)\n" +
        "• helpline_number: {{helpline_number}} (Default: 1800-233-4567)\n\n" +
        "CORE RULES & NEGOTIATION FLOW:\n" +
        "1. EMPATHY & ASSISTANCE: \"I understand things can be tough. Vasai Vikas Bank has options like a revised payment date, partial payment plans, or loan restructuring to support our valued borrowers.\"\n" +
        "2. OPTIONS OFFERED:\n" +
        "   - Revised Payment Date (grace period of 7-14 days)\n" +
        "   - Partial Payment Option (50% now, balance next week)\n" +
        "   - Tenure Extension / EMI Restructuring Application\n" +
        "3. CONCLUSION: Log requested relief option and advise: \"I've noted your situation. A senior specialist from Vasai Vikas Bank will reach out within 2 business days to formalize the plan. Thank you for your patience, {{customer_name}}.\"",
      voice: { provider: "gemini-live", providerVoiceId: "Charon" },
      llm: { realtimeModel: "gemini-live-2.0", temperature: 0.7 },
      tools: [],
      greeting: "Hello, may I speak with {{customer_name}}? This is Meera from Vasai Vikas Bank's Borrower Support and Financial Relief Cell.",
      endCallTriggers: commonTriggers,
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
    console.log(`Seeded Vasai Vikas Bank Agent: ${agent.name} (${agent._id})`);
  }

  // ---- DIDs (id = phone number so WS path = /ws/voicelink/<number>) ----
  console.log("Removing all existing DIDs from database...");
  await db.collection("dids").deleteMany({});

  for (const d of DIDS) {
    await db.collection("dids").updateOne(
      { _id: d.number as any },
      {
        $set: {
          tenantId: TENANT_ID,
          provider: "voicelink",
          providerNumber: d.number,
          didType: "mobile",
          defaultAgentId: "vasai-overdue-reminder",
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
