import { describe, expect, it } from "vitest";
import {
  getOpenUIResponse,
  getStreamingOpenUIResponse,
  isOpenUI,
} from "./OpenUIRenderer";

describe("isOpenUI", () => {
  it("detects OpenUI code in an explicit openui fence", () => {
    expect(isOpenUI("```openui\nroot = Stack()\n```")).toBe(true);
  });

  it("detects OpenUI code in an explicit genui fence", () => {
    expect(isOpenUI("```genui\nroot = Stack()\n```")).toBe(true);
  });

  it("extracts the fenced response without the markdown wrapper", () => {
    expect(getOpenUIResponse("```openui\nroot = Stack()\n```")).toBe(
      "root = Stack()",
    );
  });

  it("rejects markdown content", () => {
    expect(isOpenUI("# Root\n\n```openui\nroot = Stack()\n```")).toBe(false);
  });

  it("rejects bare OpenUI code without an explicit fence", () => {
    expect(isOpenUI("root = Stack()")).toBe(false);
  });

  it("rejects fenced content without a root assignment", () => {
    expect(isOpenUI("```openui\nStack()\n```")).toBe(false);
  });

  it("rejects empty or missing content", () => {
    expect(isOpenUI("")).toBe(false);
    expect(isOpenUI(null)).toBe(false);
    expect(isOpenUI(undefined)).toBe(false);
  });
});

describe("getStreamingOpenUIResponse", () => {
  it("returns completed response for a full fenced block", () => {
    const result = getStreamingOpenUIResponse(
      "```openui\nroot = Stack()\n```",
      false,
    );
    expect(result).toEqual({ response: "root = Stack()", isStreaming: false });
  });

  it("returns completed response even when pending is true and fence is closed", () => {
    const result = getStreamingOpenUIResponse(
      "```openui\nroot = Stack()\n```",
      true,
    );
    expect(result).toEqual({ response: "root = Stack()", isStreaming: false });
  });

  it("returns streaming response for an open fence with root assignment", () => {
    const result = getStreamingOpenUIResponse(
      "```openui\nroot = Stack([callout])\ncallout = Call",
      true,
    );
    expect(result).not.toBeNull();
    expect(result!.isStreaming).toBe(true);
    expect(result!.response).toContain("root = Stack([callout])");
    expect(result!.response).toContain("callout = Call");
  });

  it("returns null for an open fence without root assignment yet", () => {
    const result = getStreamingOpenUIResponse("```openui\n", true);
    expect(result).toBeNull();
  });

  it("returns null for an open fence when not pending (stream ended without closing)", () => {
    const result = getStreamingOpenUIResponse(
      "```openui\nroot = Stack()\ncallout = Call",
      false,
    );
    expect(result).toBeNull();
  });

  it("returns null for non-openui content", () => {
    expect(getStreamingOpenUIResponse("Hello world", true)).toBeNull();
    expect(getStreamingOpenUIResponse("", true)).toBeNull();
    expect(getStreamingOpenUIResponse(null, true)).toBeNull();
  });
});
