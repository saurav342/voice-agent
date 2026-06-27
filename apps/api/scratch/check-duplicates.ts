import "dotenv/config";
import { MongoClient } from "mongodb";

const MONGO_URL = process.env.MONGO_URL!;

async function main() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db();

  console.log("--- CALLS COLLECTION ---");
  const calls = await db.collection("calls")
    .find()
    .sort({ createdAt: -1 })
    .toArray();

  for (const call of calls) {
    console.log(`_id: ${call._id} | providerCallId: ${call.providerCallId} | status: ${call.status} | dir: ${call.direction} | recordingUrl: ${call.recordingUrl || "NONE"} | createdAt: ${call.createdAt}`);
    const transcript = await db.collection("transcripts").findOne({ callId: call._id });
    const transcriptByProviderId = await db.collection("transcripts").findOne({ callId: call.providerCallId });
    console.log(`   Transcript by _id: ${transcript ? "YES (summary: " + (transcript.summary || "none") + ")" : "NO"}`);
    console.log(`   Transcript by providerCallId: ${transcriptByProviderId ? "YES" : "NO"}`);
  }

  await client.close();
}

main().catch(console.error);
