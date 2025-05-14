export abstract class Handler {
  abstract handler(data: any): Promise<any>;
}
