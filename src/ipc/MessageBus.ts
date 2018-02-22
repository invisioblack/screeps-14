import { Logger } from 'utils/Logger';

interface Owner {
  wakeOwner: string;
}
export class MessageBus {
  private lastTickMessages: {[type: string]: any[]} = {};
  public messages: {[type: string]: any[]} = {};
  private _wakeup: string[] | undefined;
  private get wakeup(): string[] {
    if (!this._wakeup) {
      this._wakeup = [];
      for (const msg of Object.keys(this.lastTickMessages)) {
        const owners = this.lastTickMessages[msg] as Owner[];
        if (owners) {
          for (const msg of owners) {
            if (msg && msg.wakeOwner) this._wakeup.push(msg.wakeOwner);
          }
        }
      }
    }

    return this._wakeup!;
  }

  loadMessagesFromLastTick(messages: {[type: string]: any[]}) {
    this.lastTickMessages = messages;
    this.messages = {};
    this._wakeup = undefined;
  }

  shouldWakeUpProcess(name: string): boolean {
    return _.any(this.wakeup, owner => name == owner);
  }

  sendMessage<T extends MessageType>(type: T, message: Message[T]) {
    Logger.debug(`BUS[>> ${type}] Sending.`);
    if (!this.messages[type]) this.messages[type] = [];
    this.messages[type].push(message);
  }

  receiveMessages<T extends MessageType>(type: T): Message[T][] | undefined {
    if (this.lastTickMessages[type]) Logger.debug(`BUS[<< ${type}] Receiving.`);
    return this.lastTickMessages[type];
  }
}
