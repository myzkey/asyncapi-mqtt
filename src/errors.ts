export class AsyncApiMqttError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AsyncApiMqttError";
  }
}
