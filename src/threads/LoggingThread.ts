import { Thread } from 'os/Process';

export class LoggingThread extends Thread {
  state = 'init-bs';

  run(): ThreadResult {
    console.log(`Running inside ${this.process.name} on tick ${Game.time}`);
  }
}
