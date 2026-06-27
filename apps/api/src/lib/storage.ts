import { createLogger } from "./logger.js";

const log = createLogger("storage");

/**
 * Downloads a call recording from VoiceLink and uploads it to Supabase Storage.
 *
 * @param callId The unique identifier of the call (used as the filename).
 * @param recordingUrl The URL to download the recording file from.
 * @returns The public URL of the uploaded recording on Supabase, or the original recording URL if configuration is missing or upload fails.
 */
export async function uploadRecordingToSupabase(
  callId: string,
  recordingUrl: string
): Promise<string> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucketName = process.env.SUPABASE_BUCKET || "recordings";

  if (!supabaseUrl || !serviceRoleKey) {
    log.info("Supabase storage not configured. Using original recording URL.");
    return recordingUrl;
  }

  try {
    log.info({ callId, recordingUrl }, "Downloading recording from VoiceLink");
    const downloadRes = await fetch(recordingUrl);
    if (!downloadRes.ok) {
      throw new Error(`Failed to download recording: ${downloadRes.status} ${downloadRes.statusText}`);
    }

    const contentType = downloadRes.headers.get("content-type") || "audio/mpeg";
    const arrayBuffer = await downloadRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filename = `${callId}.mp3`;
    log.info({ filename, bucketName }, "Uploading recording to Supabase Storage");

    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${filename}`;

    let uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: buffer,
    });

    let isBucketNotFound = uploadRes.status === 404;
    if (uploadRes.status === 400) {
      try {
        const bodyText = await uploadRes.clone().text();
        const errJson = JSON.parse(bodyText);
        if (
          errJson.error === "Bucket not found" ||
          errJson.message === "Bucket not found" ||
          errJson.statusCode === "404"
        ) {
          isBucketNotFound = true;
        }
      } catch {}
    }

    // If bucket does not exist, try to create it and retry upload
    if (isBucketNotFound) {
      log.info({ bucketName }, "Bucket not found. Attempting to create bucket");
      const createBucketUrl = `${supabaseUrl}/storage/v1/bucket`;
      const createBucketRes = await fetch(createBucketUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: bucketName,
          name: bucketName,
          public: true,
        }),
      });

      if (createBucketRes.ok || createBucketRes.status === 409) {
        log.info({ bucketName }, "Bucket created successfully or already exists. Retrying upload...");
        // Retry upload
        uploadRes = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "Content-Type": contentType,
            "x-upsert": "true",
          },
          body: buffer,
        });
      } else {
        const createBucketErr = await createBucketRes.text();
        throw new Error(`Failed to create bucket: ${createBucketRes.status} ${createBucketErr}`);
      }
    }

    if (!uploadRes.ok) {
      const uploadErr = await uploadRes.text();
      throw new Error(`Failed to upload to Supabase: ${uploadRes.status} ${uploadErr}`);
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filename}`;
    log.info({ publicUrl }, "Successfully uploaded recording to Supabase Storage");
    return publicUrl;
  } catch (err) {
    log.error({ err, callId, recordingUrl }, "Failed to copy recording to Supabase. Falling back to original URL.");
    return recordingUrl;
  }
}
