// tslint:disable:max-line-length

export class MessageUtil {
  static messages: {[code: string]: string} = {
    OK: 'OK',
    ERR_NOT_OWNER: 'Not owner',
    ERR_NO_PATH: 'No path',
    ERR_NAME_EXISTS: 'Name exists',
    ERR_BUSY: 'Busy',
    ERR_NOT_FOUND: 'Not found',
    ERR_NOT_ENOUGH_ENERGY: 'Not enough energy',
    ERR_NOT_ENOUGH_RESOURCES: 'Not enough resourcers',
    ERR_INVALID_TARGET: 'Invalid target',
    ERR_FULL: 'Full',
    ERR_NOT_IN_RANGE: 'Not in range',
    ERR_INVALID_ARGS: 'Invalid args',
    ERR_TIRED: 'Tired',
    ERR_NO_BODYPART: 'No bodypart',
    ERR_NOT_ENOUGH_EXTENSIONS: 'Not enough extensions',
    ERR_RCL_NOT_ENOUGH: 'RCL not enough',
    ERR_GCL_NOT_ENOUGH: 'GLC not enough'
  };

  static getMessage(code: number): string {
    return MessageUtil.messages[code];
  }

  static format = {
    errNotInRange(current: RoomPosition, destination: RoomPosition) {
      return `Current [${current.roomName}] x: ${current.x}, y: ${current.y} Destination [${current.roomName}] x: ${destination.x}, y: ${destination.y}`;
    },
    errUnexpected(code: number) {
      return `Unexpected error: ${MessageUtil.getMessage(code)}`;
    }
  };
}
