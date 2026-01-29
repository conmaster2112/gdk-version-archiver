import { mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { exit } from 'node:process';

const { APPDATA, SAVE_DATA_PATH } = import.meta.env;
if (!(SAVE_DATA_PATH || APPDATA)) {
   console.error("Couldn't find path to store the mirrors");
   exit(-1);
}
export const DEFAULT_APPDATA_FOLDER_NAME = 'ConMaster.BedrockArchiver';
export const PREFERRED_PATH = resolve(
   SAVE_DATA_PATH ?? join(APPDATA ?? '.', DEFAULT_APPDATA_FOLDER_NAME, "clients")
);
export const MIRRORS_FOLDER_PATH = join(PREFERRED_PATH, 'mirrors');
export const TAGS_FOLDER_PATH = join(PREFERRED_PATH, 'tags');
export const ENSURE_FOLDERS = async () => {
   await mkdir(PREFERRED_PATH, { recursive: true }).catch((_) => null);
   await mkdir(MIRRORS_FOLDER_PATH).catch((_) => null);
};
