export const basicYaml = `
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
      properties:
        latitude:
          type: number
        longitude:
          type: number
`;

export const droneYaml = `
asyncapi: 3.0.0
channels:
  telemetry:
    address: drones/{droneId}/telemetry
  command:
    address: drones/{droneId}/command
    bindings:
      mqtt:
        qos: 1
    messages:
      command:
        $ref: '#/messages/command'
operations:
  sendTelemetry:
    action: send
    channel:
      $ref: '#/channels/telemetry'
    bindings:
      mqtt:
        qos: 2
  receiveCommand:
    action: receive
    channel:
      $ref: '#/channels/command'
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
        meta:
          type: object
          required:
            - status
          properties:
            status:
              type: string
  command:
    payload:
      type: object
      required:
        - command
      properties:
        command:
          type: string
          enum:
            - takeoff
            - land
`;
