import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import { EventEmitter } from "node:events";
import { MongoMemoryServer } from "mongodb-memory-server";

import { connectDb, closeDb, getDb } from "../../src/db/connection.js";
import { CallSession } from "../../src/voice-engine/session-manager.js";
import { FakeRealtimeProvider } from "../../src/adapters/llm/fake.js";
import type { RealtimeProvider } from "../../src/adapters/llm/types.js";

let mongo: MongoMemoryServer;

class MockWebSocket extends EventEmitter {
  readonly OPEN = 1;
  readyState = 1;
  sent: string[] = [];
  send(data: string): void {
    this.sent.push(data);
  }
  close(): void {
    this.readyState = 3;
    this.emit("close");
  }
}

interface TestProvider extends RealtimeProvider {
  __emitText(text: string): void;
  __emitTurnEnd(): void;
  __emitUserTranscript(text: string, finished: boolean): void;
}

function makeTestProvider(): TestProvider {
  let onAudioCb: ((f: Buffer) => void) | undefined;
  let onTextCb: ((delta: string) => void) | undefined;
  let onTurnEndCb: (() => void) | undefined;
  let onUserTranscriptCb: ((text: string, finished: boolean) => void) | undefined;

  return {
    async connect() {},
    sendAudio() {},
    sendText() {},
    onAudio(cb) { onAudioCb = cb; },
    onText(cb) { onTextCb = cb; },
    onTurnEnd(cb) { onTurnEndCb = cb; },
    onUserTranscript(cb) { onUserTranscriptCb = cb; },
    onError() {},
    async close() {},
    __emitText(text: string) { onTextCb?.(text); },
    __emitTurnEnd() { onTurnEndCb?.(); },
    __emitUserTranscript(text: string, finished: boolean) { onUserTranscriptCb?.(text, finished); },
  };
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri(), "voiceplatform-transcript-test");
});

afterAll(async () => {
  await closeDb();
  await mongo.stop();
});

beforeEach(async () => {
  await getDb().collection("transcripts").deleteMany({});
});

describe("CallSession transcript persistence", () => {
  it("saves transcripts incrementally when user or assistant turns complete", async () => {
    const socket = new MockWebSocket();
    const provider = makeTestProvider();
    const session = new CallSession(socket as unknown as any, {
      callId: "call-1",
      tenantId: "tenant-1",
      provider,
    });

    await session.start();

    // 1. Simulate user speaking
    provider.__emitUserTranscript("Hello there", false);
    provider.__emitUserTranscript("Hello there, how are you?", true);

    // Wait for async db calls to complete
    await new Promise((r) => setTimeout(r, 50));

    let transcript = await getDb().collection("transcripts").findOne({ callId: "call-1" });
    expect(transcript).not.toBeNull();
    expect(transcript?.turns).toHaveLength(1);
    expect(transcript?.turns[0]).toMatchObject({
      role: "user",
      text: "Hello there, how are you?",
    });

    // 2. Simulate agent responding
    provider.__emitText("I ");
    provider.__emitText("am doing ");
    provider.__emitText("great!");
    provider.__emitTurnEnd();

    await new Promise((r) => setTimeout(r, 50));

    transcript = await getDb().collection("transcripts").findOne({ callId: "call-1" });
    expect(transcript?.turns).toHaveLength(2);
    expect(transcript?.turns[1]).toMatchObject({
      role: "assistant",
      text: "I am doing great!",
    });

    await session.close();
  });
});
