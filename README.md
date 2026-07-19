# asyncapi-mqtt

Generate a type-safe TypeScript MQTT client from an AsyncAPI 3.x document.

`asyncapi-mqtt` is an **Orval for AsyncAPI** style CLI for projects that define MQTT topics and JSON payloads with AsyncAPI, then want a typed MQTT client instead of hand-written `mqtt.js` calls.

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
- YAML and JSON documents
- TypeScript MQTT client generation
- `mqtt.js` based generated runtime
- Type-safe `publish` and `subscribe` APIs
- Topic parameter expansion such as `drones/{droneId}/telemetry`
- JSON Schema to TypeScript type generation for common schema shapes
- Ajv runtime payload validation
- Basic QoS support from MQTT bindings

## Installation

Install the CLI in a Node.js or TypeScript project:

```bash
npm install -D asyncapi-mqtt
```

Generate a client:

```bash
npx asyncapi-mqtt generate ./asyncapi.yaml
```

The generated TypeScript client uses `mqtt.js` and Ajv at runtime. Install these in the application that uses the generated files:

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
npx asyncapi-mqtt generate ./asyncapi.yaml
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
npx asyncapi-mqtt generate ./asyncapi.yaml --output ./src/generated/mqtt
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
npx asyncapi-mqtt generate examples/basic/asyncapi.yaml --output examples/basic/generated
npx asyncapi-mqtt generate examples/drone/asyncapi.yaml --output examples/drone/generated
```

## Development

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Check the local CLI:

```bash
pnpm build
node ./dist/cli.js generate ./examples/basic/asyncapi.yaml
```

Check npm package contents:

```bash
pnpm pack --dry-run
```

Run the tarball smoke test:

```bash
pnpm build
pnpm smoke
```

## Release

The npm package is a single package named `asyncapi-mqtt`.

Before publishing:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm pack --dry-run
```

The publish workflow checks that a `vX.Y.Z` tag matches `package.json` version, then runs lint, typecheck, tests, build, pack dry-run, and `npm publish --provenance`.

For the first publish, make sure the npm user account has permission to publish the unscoped `asyncapi-mqtt` package. If Trusted Publishing is not configured yet, set an `NPM_TOKEN` repository secret with publish permissions.
