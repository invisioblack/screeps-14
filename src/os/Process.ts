import { Kernel } from 'os/Kernel';

export class Process {
  completed = false;
  context: any;
  name: string;
  image: ImageType = NOOP_PROCESS;
  parent: string;
  suspend: number | boolean = false;

  constructor(private kernel: Kernel, entry: SerializedProcess) {
    this.name = entry.name;
    this.context = entry.context || {};
    this.parent = entry.parent;
    this.suspend = entry.suspend || false;
  }

  run() {
    console.log(`Run method not implemented for process [${this.name}]`);
  }

  fork<T extends ImageType>(name: string, image: T, context?: Context[T], delay?: number) {
    this.kernel.launchProcess(name, image, context, delay);
  }

  sendMessage<T extends MessageType>(process: string, type: T, message: Message[T], interrupt: boolean = false) {
    this.kernel.bus.sendMessage(process, type, message, interrupt);
  }

  sendMessageToParent<T extends MessageType>(type: T, message: Message[T]) {
    this.kernel.bus.sendMessage(this.parent!, type, message);
  }

  sendMessageToChildren<T extends MessageType>(type: T, message: Message[T]) {
    for (const child of this.kernel.getChildren(this.name)) {
      this.kernel.bus.sendMessage(child.name, type, message);
    }
  }

  receiveMessages() {
    return this.kernel.bus.receiveMessages(this.name);
  }
}

export interface SerializedProcess {
  name: string;
  image: string;
  context: any;
  parent: string;
  suspend: number | boolean;
}
