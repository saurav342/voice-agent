import { describe, it, expect } from "vitest";
import { EventEmitter } from "node:events";

import { CallSession } from "../../src/voice-engine/session-manager.js";
import type { RealtimeProvider } from "../../src/adapters/llm/types.js";

class FakeWebSocket extends EventEmitter {
  readonly OPEN = 1;
  readyState = 1;
  sent: string[] = [];
  closed = false;
  send(data: string): void {
    this.sent.push(data);
  }
  close(): void {
    this.closed = true;
    this.readyState = 3;
    this.emit("close");
  }
}

interface TestProvider extends RealtimeProvider {
  __emitText(delta: string): void;
  __emitTurnEnd(): void;
}

function makeProvider(): TestProvider {
  let onTextCb: ((d: string) => void) | undefined;
  let onTurnEndCb: (() => void) | undefined;
  return {
    async connect() {},
    sendAudio() {},
    sendText() {},
    onAudio() {},
    onText(cb) {
      onTextCb = cb;
    },
    onTurnEnd(cb) {
      onTurnEndCb = cb;
    },
    onError() {},
    async close() {},
    __emitText(delta: string) {
      onTextCb?.(delta);
    },
    __emitTurnEnd() {
      onTurnEndCb?.();
    },
  };
}

describe("CallSession — End Call Triggers", () => {
  it("initiates hangup when assistant turn matches end call triggers", async () => {
    const socket = new FakeWebSocket();
    const provider = makeProvider();
    const session = new CallSession(socket as unknown as WebSocket, {
      callId: "c1",
      provider,
      endCallTriggers: ["goodbye", "farewell"],
      audioFormat: "passthrough",
    });
    await session.start();

    provider.__emitText("Okay, goodbye then!");
    provider.__emitTurnEnd();

    await new Promise((resolve) => setTimeout(resolve, 1100));

    expect(socket.closed).toBe(true);
  });

  it("does not initiate hangup if assistant turn does not match end call triggers", async () => {
    const socket = new FakeWebSocket();
    const provider = makeProvider();
    const session = new CallSession(socket as unknown as WebSocket, {
      callId: "c2",
      provider,
      endCallTriggers: ["goodbye"],
      audioFormat: "passthrough",
    });
    await session.start();

    provider.__emitText("Hello! How can I help you?");
    provider.__emitTurnEnd();

    await new Promise((resolve) => setTimeout(resolve, 1100));

    expect(socket.closed).toBe(false);
  });

  it("uses default triggers when endCallTriggers config is empty", async () => {
    const socket = new FakeWebSocket();
    const provider = makeProvider();
    const session = new CallSession(socket as unknown as WebSocket, {
      callId: "c3",
      provider,
      audioFormat: "passthrough",
    });
    await session.start();

    provider.__emitText("Talk to you later, bye bye!");
    provider.__emitTurnEnd();

    await new Promise((resolve) => setTimeout(resolve, 1100));

    expect(socket.closed).toBe(true);
  });
});
