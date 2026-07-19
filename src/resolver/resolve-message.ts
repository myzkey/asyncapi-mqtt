import { AsyncApiMqttError } from "../errors.js";
import type { AsyncApiDocument, Channel, Message, Operation, RefOr } from "../model/asyncapi.js";
import { isRefObject } from "../model/asyncapi.js";
import { toCamelCase } from "../utils/case.js";
import { resolveLocalRef } from "./resolve-ref.js";

export function resolveOperationMessage(
  document: AsyncApiDocument,
  operationName: string,
  operation: Operation,
  channel: Channel,
): Message {
  if (operation.message) {
    return resolveMessageRef(document, operation.message);
  }

  const firstOperationMessage = operation.messages?.[0];
  if (firstOperationMessage) {
    return resolveMessageRef(document, firstOperationMessage);
  }

  const firstChannelMessage = Object.values(channel.messages ?? {})[0];
  if (firstChannelMessage) {
    return resolveMessageRef(document, firstChannelMessage);
  }

  const inferred = inferMessageName(operationName);
  const inferredMessage = document.messages?.[inferred];
  if (inferredMessage) {
    return inferredMessage;
  }

  const sameNameMessage = document.messages?.[operationName];
  if (sameNameMessage) {
    return sameNameMessage;
  }

  const topLevelMessages = Object.values(document.messages ?? {});
  if (topLevelMessages.length === 1 && topLevelMessages[0]) {
    return topLevelMessages[0];
  }

  throw new AsyncApiMqttError(`Operation ${operationName} has no resolvable payload message`);
}

export function resolveMessageRef(document: AsyncApiDocument, refOrMessage: RefOr<Message>): Message {
  if (isRefObject(refOrMessage)) {
    return resolveLocalRef<Message>(document, refOrMessage.$ref, "#/messages/");
  }

  return refOrMessage;
}

function inferMessageName(operationName: string): string {
  for (const prefix of ["send", "receive", "publish", "subscribe"]) {
    if (operationName.startsWith(prefix)) {
      return toCamelCase(operationName.slice(prefix.length));
    }
  }

  return toCamelCase(operationName);
}
