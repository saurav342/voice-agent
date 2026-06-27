import "dotenv/config";
import { MongoClient } from "mongodb";

const MONGO_URL = process.env.MONGO_URL!;

async function main() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db();

  console.log("Fetching latest 5 calls...");
  const calls = await db.collection("calls")
    .find()
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();

  for (const call of calls) {
    console.log("\n=================================");
    console.log(`Call ID: ${call._id}`);
    console.log(`Direction: ${call.direction}`);
    console.log(`To: ${call.toNumber}`);
    console.log(`Status: ${call.status}`);
    console.log(`Agent ID: ${call.agentId}`);
    console.log(`Created At: ${call.createdAt}`);

    const transcript = await db.collection("transcripts").findOne({ callId: call._id });
    if (transcript) {
      console.log(`Transcript found:`, JSON.stringify(transcript.items || transcript, null, 2));
    } else {
      console.log(`No transcript found for this call.`);
    }

    const recordings = await db.collection("recordings").find({ callId: call._id }).toArray();
    console.log(`Recordings:`, recordings);
  }

  console.log("\nFetching DIDs...");
  const dids = await db.collection("dids").find().toArray();
  for (const did of dids) {
    console.log(`DID: ${did.providerNumber} (ID: ${did._id}) -> defaultAgentId: ${did.defaultAgentId}`);
  }

  console.log("\nFetching Agents...");
  const agents = await db.collection("agents").find().toArray();
  for (const agent of agents) {
    console.log(`Agent: ${agent.name} (ID: ${agent._id})`);
  }

  await client.close();
}

main().catch(console.error);
