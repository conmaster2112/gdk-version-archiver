import {ENVIRONMENT_INFO, ROOT, TAG} from './root';
import {ACCENT, ERROR, INFO, LOG} from '../logger';
import {PREFERRED_PATH} from '../constants';

const LIST = ROOT.createAction('list', 'List your installations', []);

LIST.action = async (_) => {
   ENVIRONMENT_INFO(_);
   INFO(`----------------------------\n`);
   INFO(`MIRRORS:\n`);
   for await (const folder of new Bun.Glob('*').scan({
      cwd: PREFERRED_PATH + '\\mirrors',
      onlyFiles: false
   })) {
      INFO(`  ${ACCENT(folder)}\n`);
   }
   INFO(`\n`);
   INFO(`TAGS:\n`);
   for await (const folder of new Bun.Glob('*').scan({
      cwd: PREFERRED_PATH + '\\tags',
      onlyFiles: false
   })) {
      INFO(`  ${ACCENT(folder)}\n`);
   }
   INFO(`\n`);
   INFO(`----------------------------\n`);
};
