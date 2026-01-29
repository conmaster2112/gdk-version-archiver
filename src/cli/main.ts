import { ROOT } from './root';
import './instruction';
import "./archive";
import "./list";
import "./run";
import { CommandLine } from 'con-utils/cli';

CommandLine.run(Bun.argv, ROOT);
