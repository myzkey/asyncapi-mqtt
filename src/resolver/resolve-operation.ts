import { AsyncApiMqttError } from "../errors.js";
import type { Channel, AsyncApiDocument, Operation } from "../model/asyncapi.js";
import { isRefObject } from "../model/asyncapi.js";
import { resolveLocalRef } from "./resolve-ref.js";

export function resolveOperationChannel(
  document: AsyncApiDocument,
  operationName: string,
  operation: Operation,
): Channel {
  if (!operation.channel) {
    throw new AsyncApiMqttError(`Operation ${operationName} is missing a channel reference`);
  }

  if (isRefObject(operation.channel)) {
    return resolveLocalRef<Channel>(document, operation.channel.$ref, "#/channels/");
  }

  return operation.channel;
}
