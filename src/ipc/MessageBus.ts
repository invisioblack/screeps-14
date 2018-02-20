import { Logger } from 'utils/Logger';
export class MessageBus {
  public messages: {[type: string]: any[]} = {};

  sendMessage<T extends MessageType>(type: T, message: Message[T]) {
    if (!this.messages[type]) this.messages[type] = [];
    this.messages[type].push(message);
  }

  receiveMessages<T extends MessageType>(type: T): Message[T][] | undefined {
    const messages = this.messages[type];
    if (this.messages[type]) delete this.messages[type];
    return messages;
  }
}
