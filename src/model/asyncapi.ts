export type JsonSchema = Record<string, unknown>;

export type RefObject = {
  $ref: string;
};

export type RefOr<T> = RefObject | T;

export type AsyncApiDocument = {
  asyncapi: string;
  channels?: Record<string, Channel>;
  operations?: Record<string, Operation>;
  messages?: Record<string, Message>;
};

export type Channel = {
  address: string;
  messages?: Record<string, RefOr<Message>>;
  bindings?: Record<string, unknown>;
};

export type Operation = {
  action: string;
  channel?: RefOr<Channel>;
  message?: RefOr<Message>;
  messages?: RefOr<Message>[];
  bindings?: Record<string, unknown>;
};

export type Message = {
  payload?: JsonSchema;
};

export function isRefObject(value: unknown): value is RefObject {
  return isRecord(value) && typeof value.$ref === "string";
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
