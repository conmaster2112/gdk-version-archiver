import { ROOT } from './root';
import './instruction';
import './archive';
import './list';
import './run';
import { CommandLine } from 'con-utils/cli';
import { ENSURE_FOLDERS } from '../constants';

await ENSURE_FOLDERS().catch(_ => null);
CommandLine.run(Bun.argv, ROOT);
