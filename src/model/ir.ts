import type { JsonSchema } from "./asyncapi.js";

export type Action = "send" | "receive";

export type ClientSpec = {
  operations: OperationSpec[];
};

export type OperationSpec = {
  name: string;
  action: Action;
  topic: TopicSpec;
  payloadTypeName: string;
  payloadSchema: JsonSchema;
  qos?: 0 | 1 | 2;
};

export type TopicSpec = {
  template: string;
  parameters: TopicParameter[];
};

export type TopicParameter = {
  name: string;
};
