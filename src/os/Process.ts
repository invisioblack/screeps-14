import { Kernel } from "os/Kernel";
import { Logger } from "utils/Logger";

export class Process {
  completed = false;
  context: any;
  name: string;
  image: ImageType = NOOP_PROCESS;
  suspend: number | boolean = false;

  constructor(private kernel: Kernel, entry: SerializedProcess) {
    this.name = entry.name;
    this.context = entry.context || {};
    this.suspend = entry.suspend || false;
  }

  run() {
    Logger.error(`Run method not implemented for process [${this.name}]`);
  }

  fork<T extends ImageType>(name: string, image: T, context?: Context[T], delay?: number) {
    // Logger.debug(`Forking process [${name}]`);
    this.kernel.launchProcess(name, image, context, delay);
  }

  sendMessage<T extends MessageType>(type: T, message: Message[T]) {
    this.kernel.bus.sendMessage(type, message);
  }

  receiveMessages<T extends MessageType>(type: T) {
    return this.kernel.bus.receiveMessages(type);
  }
}

export interface SerializedProcess {
  name: string;
  image: string;
  context: any;
  suspend: number | boolean;
}
