import { Logger } from 'utils/Logger';

export class MessageBus {
  private messages: {[process: string]: MessageEntry[] } = {};
  private interrupt: {[process: string]: boolean} = {};

  sendMessage<T extends MessageType>(process: string, type: T, message: Message[T], interrupt: boolean = false): void {
    if (!this.messages[process]) this.messages[process] = [];
    this.messages[process]!.push({ type, message });
    this.interrupt[process] = interrupt;
  }

  receiveMessages(process: string): MessageEntry[] {
    const entries = this.messages[process] || [];
    this.messages[process] = [];
    return entries;
  }

  shouldWakeUpProcess(process: string): boolean {
    return this.interrupt[process];
  }

  init(): void {
    Memory.messages = Memory.messages || [];
    this.messages = {};
    for (const entry of Memory.messages) {
      if (!this.messages[entry.process]) this.messages[entry.process] = [];
      this.messages[entry.process].push({ message: entry.message, type: entry.type as MessageType });
    }
  }

  shutdown(): void {
    Memory.messages = [];
    for (const process in this.messages) {
      if (this.messages[process].length === 0) continue;
      for (const message of this.messages[process]) {
        Memory.messages.push(this.serialize(process, message));
      }
    }
    this.messages = {};
    this.interrupt = {};
  }

  private serialize(process: string, entry: MessageEntry): SerializedMessage {
    return {
      process,
      message: entry.message,
      type: entry.type
    };
  }
}

declare global {
  interface MessageEntry {
    message: any;
    type: MessageType;
  }
  interface SerializedMessage {
    message: any;
    process: string;
    type: string;
  }
  interface Memory {
    messages: SerializedMessage[];
  }
}
