// tslint:disable:max-line-length

export class MessageUtil {
  static messages: {[code: number]: string} = {
    '0': 'OK',
    '-1': 'Not owner',
    '-2': 'No path',
    '-3': 'Name exists',
    '-4': 'Busy',
    '-5': 'Not found',
    '-6': 'Not enough energy/resources/extensions',
    '-7': 'Invalid target',
    '-8': 'Full',
    '-9': 'Not in range',
    '-10': 'Invalid args',
    '-11': 'Tired',
    '-12': 'No bodypart',
    '-14': 'RCL not enough',
    '-15': 'GLC not enough'
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
