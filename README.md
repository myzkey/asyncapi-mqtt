# asyncapi-mqtt

`asyncapi-mqtt` is an **Orval for AsyncAPI** style CLI that generates a type-safe TypeScript MQTT client from an AsyncAPI 3.x document.

The MVP focuses on MQTT, JSON payloads, `mqtt.js`, and runtime payload validation with Ajv.

## Install

```bash
cargo install --path .
```

Generated TypeScript code expects these runtime dependencies in your application:

```bash
npm install mqtt ajv
npm install -D typescript @types/node
```

## Quick Start

```bash
asyncapi-mqtt generate ./asyncapi.yaml
```

This creates:

```text
generated/
  client.ts
  types.ts
```

You can choose another output directory:

```bash
asyncapi-mqtt generate ./asyncapi.yaml --output ./src/generated/mqtt
```

## AsyncAPI Example

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

`sendTelemetry` is matched to the `telemetry` message by convention. Explicit operation messages are also supported via `message` or `messages`.

## Generated Code Example

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

Subscribe operations are generated under `client.subscribe`:

```ts
const unsubscribe = client.subscribe.receiveCommand(
  { droneId: "001" },
  (payload) => {
    console.log(payload);
  },
);

unsubscribe();
```

## MVP Scope

Supported:

- AsyncAPI 3.x
- MQTT operations only
- TypeScript generation
- `mqtt.js`
- JSON payloads
- `send` operations as `client.publish.*`
- `receive` operations as `client.subscribe.*`
- Channel topic parameters such as `drones/{droneId}/telemetry`
- JSON Schema to TypeScript for common schema shapes
- Ajv runtime validation
- Basic MQTT QoS from MQTT bindings

Not yet supported:

- Kafka, AMQP, WebSocket, NATS
- Plugin system
- GUI or VSCode extension
- Full JSON Schema coverage
- Multi-file AsyncAPI reference resolution

## Project Layout

```text
src/
  cli.rs
  error.rs
  parser/
    asyncapi.rs
  ir/
    mod.rs
  generator/
    typescript/
      mod.rs
  utils.rs
examples/
  basic/
  drone/
```

The generator intentionally converts AsyncAPI into an intermediate representation before rendering TypeScript. This keeps the TypeScript generator isolated from AsyncAPI-specific parsing details and leaves room for future Python, Go, or Rust generators.
