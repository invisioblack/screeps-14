import { Process } from 'os/Process';
import { JobQueueProcess } from 'system/JobQueue';

declare global {
  interface WithRoom extends Process {
    room: Room;
  }

  interface WithCreep extends Process {
    creep: Creep;
  }

  interface WithSource extends Process {
    source: Source;
  }

  interface WithJobQueue extends IProcess {
    jobQueue: JobQueueProcess;
  }
}
