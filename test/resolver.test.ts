import { describe, expect, it } from "vitest";
import { parseDocument } from "../src/parser/parse-document.js";
import { resolveLocalRef } from "../src/resolver/resolve-ref.js";
import { resolveOperationChannel } from "../src/resolver/resolve-operation.js";
import { resolveOperationMessage } from "../src/resolver/resolve-message.js";
import { toClientSpec } from "../src/resolver/to-client-spec.js";
import { droneYaml } from "./fixtures/documents.js";

describe("resolver", () => {
  const document = parseDocument(droneYaml);

  it("resolves channel refs", () => {
    expect(resolveLocalRef(document, "#/channels/telemetry", "#/channels/")).toMatchObject({
      address: "drones/{droneId}/telemetry",
    });
  });

  it("resolves message refs", () => {
    expect(resolveLocalRef(document, "#/messages/command", "#/messages/")).toMatchObject({
      payload: expect.objectContaining({ type: "object" }),
    });
  });

  it("resolves operation channels", () => {
    const operation = document.operations?.sendTelemetry;
    expect(operation).toBeDefined();
    expect(resolveOperationChannel(document, "sendTelemetry", operation!)).toMatchObject({
      address: "drones/{droneId}/telemetry",
    });
  });

  it("resolves operation messages", () => {
    const operation = document.operations?.receiveCommand;
    const channel = resolveOperationChannel(document, "receiveCommand", operation!);
    expect(resolveOperationMessage(document, "receiveCommand", operation!, channel).payload?.required).toEqual([
      "command",
    ]);
  });

  it("fails for unresolved refs", () => {
    expect(() => resolveLocalRef(document, "#/channels/missing", "#/channels/")).toThrow(/Missing channel/);
  });

  it("builds client specs with topic parameters and qos", () => {
    const spec = toClientSpec(document);
    expect(spec.operations).toHaveLength(2);
    expect(spec.operations.find((operation) => operation.name === "sendTelemetry")).toMatchObject({
      qos: 2,
      topic: { parameters: [{ name: "droneId" }] },
    });
    expect(spec.operations.find((operation) => operation.name === "receiveCommand")).toMatchObject({ qos: 1 });
  });
});
