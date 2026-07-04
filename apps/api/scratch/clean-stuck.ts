import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

const MONGO_URL = process.env.MONGO_URL!;

async function main() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db();

  console.log("Fetching all calls...");
  const calls = await db.collection("calls")
    .find()
    .sort({ createdAt: -1 })
    .toArray();

  console.log(`Found ${calls.length} calls. Reconciling duplicates...`);

  const toDelete: string[] = [];
  const processed = new Set<string>();

  for (const call of calls) {
    if (processed.has(call._id.toString())) continue;

    // Look for duplicates (same destination, direction, and created within 30 seconds of each other)
    const duplicates = calls.filter(c => 
      c._id.toString() !== call._id.toString() &&
      c.toNumber === call.toNumber &&
      Math.abs(new Date(c.createdAt).getTime() - new Date(call.createdAt).getTime()) < 30 * 1000
    );

    if (duplicates.length > 0) {
      const allGroup = [call, ...duplicates];
      // Find the one with transcripts, or completed, or longest duration
      let bestCall = allGroup[0];
      for (const candidate of allGroup) {
        // Check if candidate has transcript
        const transcript = await db.collection("transcripts").findOne({ 
          $or: [
            { callId: candidate._id.toString() },
            { callId: new ObjectId(candidate._id.toString()) }
          ]
        });
        if (transcript) {
          bestCall = candidate;
          break;
        }
        if (candidate.status === "completed" && bestCall.status !== "completed") {
          bestCall = candidate;
        }
      }

      console.log(`Reconciling group for ${call.toNumber} @ ${call.createdAt}:`);
      console.log(`  Best Call: ID=${bestCall._id} status=${bestCall.status}`);

      for (const candidate of allGroup) {
        const candidateIdStr = candidate._id.toString();
        if (candidateIdStr === bestCall._id.toString()) {
          processed.add(candidateIdStr);
          continue;
        }

        // Merge any transcripts to the bestCall
        const transcript = await db.collection("transcripts").findOne({ 
          $or: [
            { callId: candidateIdStr },
            { callId: new ObjectId(candidateIdStr) }
          ]
        });
        if (transcript) {
          console.log(`  Moving transcript from ${candidateIdStr} to ${bestCall._id}`);
          await db.collection("transcripts").updateOne(
            { _id: transcript._id },
            { $set: { callId: bestCall._id.toString(), updatedAt: new Date() } }
          );
        }

        console.log(`  Marking duplicate for deletion: ID=${candidateIdStr} status=${candidate.status}`);
        toDelete.push(candidateIdStr);
        processed.add(candidateIdStr);
      }
    }
  }

  if (toDelete.length > 0) {
    console.log(`Deleting ${toDelete.length} duplicate call records...`);
    const deleteResult = await db.collection("calls").deleteMany({
      _id: { $in: toDelete }
    });
    console.log(`Deleted ${deleteResult.deletedCount} calls.`);
  } else {
    console.log("No duplicate calls found to delete.");
  }

  // Ensure all transcripts have string callIds to match our queries
  const transcripts = await db.collection("transcripts").find().toArray();
  for (const ts of transcripts) {
    if (ts.callId instanceof ObjectId) {
      console.log(`Converting transcript ${ts._id} callId from ObjectId to string: ${ts.callId.toString()}`);
      await db.collection("transcripts").updateOne(
        { _id: ts._id },
        { $set: { callId: ts.callId.toString() } }
      );
    }
  }

  await client.close();
  console.log("Cleanup done.");
}

main().catch(console.error);
