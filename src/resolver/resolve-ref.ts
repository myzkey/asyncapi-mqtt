import { AsyncApiMqttError } from "../errors.js";
import type { AsyncApiDocument } from "../model/asyncapi.js";

export function resolveLocalRef<T>(
  document: AsyncApiDocument,
  reference: string,
  expectedPrefix: "#/channels/" | "#/messages/",
): T {
  if (!reference.startsWith(expectedPrefix)) {
    throw new AsyncApiMqttError(`Unsupported reference ${reference}`);
  }

  const name = decodePointerSegment(reference.slice(expectedPrefix.length));
  const collection = expectedPrefix === "#/channels/" ? document.channels : document.messages;
  const value = collection?.[name];

  if (!value) {
    throw new AsyncApiMqttError(`Missing ${expectedPrefix === "#/channels/" ? "channel" : "message"} ${name}`);
  }

  return value as T;
}

function decodePointerSegment(segment: string): string {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}
