import "dotenv/config";
import { MongoClient } from "mongodb";

const MONGO_URL = process.env.MONGO_URL!;
const TENANT_ID = "vaani-tenant";

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
  },
];

async function main() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db();
  const now = new Date();

  console.log("Removing all existing agents from database...");
  await db.collection("agents").deleteMany({});

  console.log("Seeding voice agents...");

  for (const agent of AGENTS) {
    await db.collection("agents").updateOne(
      { _id: agent._id as any },
      {
        $set: {
          ...agent,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );
    console.log(`Seeded agent: ${agent.name} (${agent._id})`);
  }

  await client.close();
  console.log("Seeding completed successfully.");
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
