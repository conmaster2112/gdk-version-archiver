import { Command, CommandLine, Flag, StringTypeValidator, ValueFlag } from 'con-utils/cli';
import { description } from '../../package.json';
import { ACCENT, LOG, SET_VERBOSE, DIM } from '../logger';
import { PREFERRED_PATH } from '../constants';

export const ROOT = CommandLine.createGroup('>.', description);

const VERBOSE = new Flag("verbose", {
   description: "Shows LOG messages", long: "verbose"
});
export const TAG = new ValueFlag("tag", {
   defaultValue: "current",
   description: "Environment Tag under this instance operates, archiving performs tag redirection of this name",
   validator: new StringTypeValidator,
   long: "tag"
});
ROOT.flags.add(VERBOSE, TAG);
ROOT.onFlags = (options) => {
   if (options.getValue(VERBOSE)) SET_VERBOSE(true);
};
type Defined<T> = T extends undefined | null ? never : T extends undefined | (infer R) ? R : never;
export const ENVIRONMENT_INFO = (options: Parameters<Defined<Command["onFlags"]>>[0]) => {
   LOG(`-----------------------\n`);
   LOG(`DATA:  ${ACCENT(PREFERRED_PATH)}\n`);
   LOG(`TAG:   ${ACCENT(options.getValue(TAG))} ${options.getValue(TAG) === TAG.defaultValue ? "(default)" : ""}\n`);
   LOG(`-----------------------\n`);
}