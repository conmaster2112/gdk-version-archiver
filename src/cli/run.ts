import {ArgumentLike, StringTypeValidator} from 'con-utils/cli';
import {ENVIRONMENT_INFO, ROOT, TAG} from './root';
import {TAGS_FOLDER_PATH} from '../constants';

const RUN = ROOT.createAction('run', 'Start new minecraft instance from tag or mirror version id', [
   new ArgumentLike('package-name', {
      defaultValue: '',
      validator: new StringTypeValidator(),
      description: 'Minecraft GDK Installation Mirror Id if empty then tag is used'
   })
]);

RUN.action = async (_, packageName) => {
   ENVIRONMENT_INFO(_);
   Bun.spawn({
      cmd: [TAGS_FOLDER_PATH + '\\' + _.getValue(TAG) + '\\Minecraft.Windows.exe'],
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore']
   }).unref();
};
