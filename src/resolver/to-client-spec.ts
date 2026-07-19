import { AsyncApiMqttError } from "../errors.js";
import type { AsyncApiDocument } from "../model/asyncapi.js";
import type { Action, ClientSpec, OperationSpec, TopicSpec } from "../model/ir.js";
import { toPascalCase } from "../utils/case.js";
import { resolveOperationChannel } from "./resolve-operation.js";
import { resolveOperationMessage } from "./resolve-message.js";

export function toClientSpec(document: AsyncApiDocument): ClientSpec {
  const operations: OperationSpec[] = [];

  for (const [operationName, operation] of Object.entries(document.operations ?? {})) {
    const action = parseAction(operationName, operation.action);
    const channel = resolveOperationChannel(document, operationName, operation);
    const message = resolveOperationMessage(document, operationName, operation, channel);

    operations.push({
      name: operationName,
      action,
      topic: topicFromAddress(channel.address),
      payloadTypeName: `${toPascalCase(operationName)}Payload`,
      payloadSchema: message.payload ?? {},
      qos: mqttQos(operation.bindings) ?? mqttQos(channel.bindings),
    });
  }

  return { operations };
}

export function topicFromAddress(address: string): TopicSpec {
  return {
    template: address,
    parameters: extractTopicParameters(address).map((name) => ({ name })),
  };
}

export function extractTopicParameters(address: string): string[] {
  const parameters: string[] = [];
  const regex = /\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(address))) {
    const name = match[1];
    if (name && !parameters.includes(name)) {
      parameters.push(name);
    }
  }

  return parameters;
}

function parseAction(operationName: string, action: string): Action {
  if (action === "send" || action === "receive") {
    return action;
  }

  throw new AsyncApiMqttError(`Operation ${operationName} has unsupported action ${action}`);
}

function mqttQos(bindings: unknown): 0 | 1 | 2 | undefined {
  const qos = (bindings as { mqtt?: { qos?: unknown } } | undefined)?.mqtt?.qos;
  return qos === 0 || qos === 1 || qos === 2 ? qos : undefined;
}
