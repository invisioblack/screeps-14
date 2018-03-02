import { Process } from 'os/Process';

export class MinerProcess extends Process {
  image: ImageType = MINER_PROCESS;
  context!: Context[MINER_PROCESS];
}

declare global {
  const MINER_PROCESS = 'tower_repairer';
  type MINER_PROCESS = 'tower_repairer';
  type MinerContext = BlankContext & {
    roomName: string;
  };
}
