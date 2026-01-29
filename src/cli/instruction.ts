import {ArgumentLike, StringTypeValidator} from 'con-utils/cli';
import {ROOT} from './root';
import {ERROR, LOG} from '../logger';
import {copyFile} from 'node:fs/promises';

const INSTRUCTION = ROOT.createAction('instruction', 'Internal use', [
   new ArgumentLike('data', {
      defaultValue: null,
      validator: new StringTypeValidator(),
      description: 'BASE64 Encoded data'
   })
]);

INSTRUCTION.action = async (_, base64) => {
   let data: INSTRUCTIONS;
   try {
      LOG(`Trying to transform BASE64 to string\n`);
      const RAW = atob(base64);
      LOG(`Parsing as JSON\n`);
      data = JSON.parse(RAW);
      LOG(`Checking data validity\n`);
      if (!Array.isArray(data)) return void ERROR('INVALID INSTRUCTION FORMAT');
      if (typeof data[0] !== 'number' || !(data[0] in InstructionType))
         return void ERROR('INVALID INSTRUCTION FORMAT');
   } catch {
      return void ERROR('INVALID INSTRUCTION FORMAT');
   }
   switch (data[0]) {
      case InstructionType.Copy: {
         const result = await copyFile(data[1], data[2]).then(
            (_) => true,
            (_) => false
         );
         if (!result) {
            setTimeout(() => null, 5000);
            return void ERROR('FAILED TO COPY THIS ITEM: ' + data[1]);
         }
         break;
      }
      default:
         return void ERROR('Unknown instruction');
   }
};

type COPY_INSTRUCTION = [type: InstructionType.Copy, source: string, destination: string];
type INSTRUCTIONS = COPY_INSTRUCTION;
export enum InstructionType {
   Copy = 1
}

export function createCommand<T extends INSTRUCTIONS>(...args: T): [string, string, ...string[]] {
   const [EXECUTABLE, SELF_CLI] = Bun.argv as [string, string];
   return [EXECUTABLE, SELF_CLI, INSTRUCTION.name, btoa(JSON.stringify(args))];
}
