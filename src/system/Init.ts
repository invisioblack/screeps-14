import { Process } from 'os/Process';

export class InitProcess extends Process {
  class = 'init';
  initialState = 'init-bs';
}

declare global {
  type INIT_PROCESS = 'init';
}
