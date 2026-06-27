import "dotenv/config";
import { MongoClient } from "mongodb";

const MONGO_URL = process.env.MONGO_URL!;

async function main() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db();

  console.log("Fetching latest 10 call events...");
  const events = await db.collection("call_events")
    .find()
    .sort({ receivedAt: -1 })
    .limit(10)
    .toArray();

  console.log(JSON.stringify(events, null, 2));
  await client.close();
}

main().catch(console.error);
