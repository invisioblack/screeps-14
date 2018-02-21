import {Process} from "../os/Process";

declare global {

  const BUILDER_PROCESS = 'builder';
  type BUILDER_PROCESS = 'builder';

  type BuilderContext = CreepContext & {
    site: string;
  }
}

export class Builder extends Process {
  image: ImageType = BUILDER_PROCESS;
  context!: Context[BUILDER_PROCESS];

  run() {

  }
}
