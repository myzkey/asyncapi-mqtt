# asyncapi-mqtt

Generate a type-safe TypeScript MQTT client from an AsyncAPI 3.x document.

`asyncapi-mqtt` is an **Orval for AsyncAPI** style CLI for projects that define MQTT topics and JSON payloads with AsyncAPI, then want a typed client API instead of hand-written `mqtt.js` calls.

```ts
import { createClient } from "./generated/client";

const client = createClient({
  url: "mqtt://localhost:1883",
});

await client.connect();

await client.publish.sendTelemetry(
  { droneId: "001" },
  {
    latitude: 35,
    longitude: 139,
  },
);
```

## Features

- AsyncAPI 3.x input
- MQTT client generation for TypeScript
- `mqtt.js` based runtime
- Type-safe `publish` and `subscribe` APIs
- Topic parameter expansion such as `drones/{droneId}/telemetry`
- JSON Schema to TypeScript type generation
- Ajv runtime payload validation
- Basic QoS support from MQTT bindings

## Installation

Install the generator CLI:

```bash
cargo install asyncapi-mqtt
```

When working from this repository before the package is published:

```bash
cargo install --path .
```

Install the runtime dependencies in the TypeScript application that will use the generated client:

```bash
npm install mqtt ajv
npm install -D typescript @types/node
```

## Quick Start

Create an AsyncAPI file:

```yaml
asyncapi: 3.0.0

channels:
  telemetry:
    address: drones/{droneId}/telemetry

operations:
  sendTelemetry:
    action: send
    channel:
      $ref: '#/channels/telemetry'

messages:
  telemetry:
    payload:
      type: object
      required:
        - latitude
        - longitude
      properties:
        latitude:
          type: number
        longitude:
          type: number
```

Generate the client:

```bash
asyncapi-mqtt generate ./asyncapi.yaml
```

This writes:

```text
generated/
  client.ts
  types.ts
```

Use the generated client:

```ts
import { createClient } from "./generated/client";

const client = createClient({
  url: "mqtt://localhost:1883",
});

await client.connect();

await client.publish.sendTelemetry(
  { droneId: "001" },
  {
    latitude: 35,
    longitude: 139,
  },
);

await client.end();
```

## Output Directory

By default, files are generated into `generated/`.

Use `--output` to choose another directory:

```bash
asyncapi-mqtt generate ./asyncapi.yaml --output ./src/generated/mqtt
```

## Subscribe Example

Given a receive operation:

```yaml
channels:
  command:
    address: drones/{droneId}/command

operations:
  receiveCommand:
    action: receive
    channel:
      $ref: '#/channels/command'

messages:
  command:
    payload:
      type: object
      required:
        - command
      properties:
        command:
          type: string
```

The generated API can be used like this:

```ts
const unsubscribe = client.subscribe.receiveCommand(
  { droneId: "001" },
  (payload, topic) => {
    console.log(topic, payload.command);
  },
);

unsubscribe();
```

## Topic Parameters

Channel addresses may contain `{parameter}` placeholders:

```yaml
channels:
  telemetry:
    address: drones/{droneId}/telemetry
```

The generated method requires matching topic parameters:

```ts
await client.publish.sendTelemetry(
  { droneId: "001" },
  {
    latitude: 35,
    longitude: 139,
  },
);
```

At runtime, this publishes to:

```text
drones/001/telemetry
```

## Runtime Validation

Generated clients validate payloads with Ajv before publishing and after receiving messages.

Disable runtime validation when needed:

```ts
const client = createClient({
  url: "mqtt://localhost:1883",
  validate: false,
});
```

Pass a custom Ajv instance:

```ts
import Ajv from "ajv";
import { createClient } from "./generated/client";

const client = createClient({
  url: "mqtt://localhost:1883",
  ajv: new Ajv({ allErrors: true }),
});
```

## QoS

Basic QoS is read from MQTT bindings when present:

```yaml
operations:
  sendTelemetry:
    action: send
    channel:
      $ref: '#/channels/telemetry'
    bindings:
      mqtt:
        qos: 1
```

You can also override publish options at call time:

```ts
await client.publish.sendTelemetry(
  { droneId: "001" },
  {
    latitude: 35,
    longitude: 139,
  },
  { qos: 2 },
);
```

## Supported AsyncAPI Shape

This MVP supports a focused subset:

- `asyncapi: 3.x`
- `channels`
- `channels.*.address`
- `channels.*.messages`
- `operations`
- `operations.*.action` with `send` or `receive`
- `operations.*.channel`
- `operations.*.message`
- `operations.*.messages`
- top-level `messages`
- JSON Schema payloads
- local refs such as `#/channels/telemetry` and `#/messages/telemetry`

Message resolution order:

1. `operations.*.message`
2. first item in `operations.*.messages`
3. first item in `channels.*.messages`
4. operation name convention such as `sendTelemetry` to `telemetry`
5. the only top-level message when exactly one exists

## Current Limitations

- MQTT only
- JSON payloads only
- Single-file AsyncAPI documents only
- Local `$ref` support only
- Common JSON Schema features only
- No Kafka, AMQP, WebSocket, NATS, GUI, VSCode extension, or plugin system

## Examples

Example AsyncAPI documents are included in:

```text
examples/basic/asyncapi.yaml
examples/drone/asyncapi.yaml
```

Generate them with:

```bash
asyncapi-mqtt generate examples/basic/asyncapi.yaml --output examples/basic/generated
asyncapi-mqtt generate examples/drone/asyncapi.yaml --output examples/drone/generated
```
