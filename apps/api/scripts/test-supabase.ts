import "dotenv/config";
import { uploadRecordingToSupabase } from "../src/lib/storage.js";

async function main() {
  console.log("Starting Supabase storage upload test...");
  console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
  console.log("SUPABASE_BUCKET:", process.env.SUPABASE_BUCKET || "recordings");
  console.log("SUPABASE_SERVICE_ROLE_KEY has length:", process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0);

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables are missing!");
    process.exit(1);
  }

  // Use a public test audio URL from MDN
  const sampleAudioUrl = "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3";
  const mockCallId = `test-call-${Date.now()}`;

  console.log(`Downloading and uploading MDN CC0 audio sample to Supabase with callId: ${mockCallId}`);
  const resultUrl = await uploadRecordingToSupabase(mockCallId, sampleAudioUrl);

  console.log("\n==========================================");
  if (resultUrl && resultUrl.startsWith("http") && !resultUrl.includes("mozilla.net")) {
    console.log("SUCCESS: Recording uploaded to Supabase Storage!");
    console.log("Public URL:", resultUrl);

    // Let's verify if the uploaded file is publicly accessible
    console.log("Verifying public accessibility...");
    const verifyRes = await fetch(resultUrl, { method: "HEAD" });
    if (verifyRes.ok) {
      console.log(`Verification status: ${verifyRes.status} OK (File is readable!)`);
    } else {
      console.warn(`Verification status: ${verifyRes.status} ${verifyRes.statusText} (Public access might be disabled or still propagating)`);
    }
  } else {
    console.error("FAILURE: Result URL points to the fallback or is invalid.");
    console.error("Result URL:", resultUrl);
    process.exit(1);
  }
  console.log("==========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Unhandled test script exception:", err);
    process.exit(1);
  });
