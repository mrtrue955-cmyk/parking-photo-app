import * as FileSystem from 'expo-file-system/legacy';
import type { PhotoFiles } from '../services/ports';

const DIR = `${FileSystem.documentDirectory}parking/`;

async function ensureDir() {
  await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => {});
}

export const photoFiles: PhotoFiles = {
  async save(tempUri, id) {
    await ensureDir();
    const name = `${id}.jpg`;
    await FileSystem.copyAsync({ from: tempUri, to: DIR + name });
    return name;
  },
  async remove(name) {
    await FileSystem.deleteAsync(DIR + name, { idempotent: true });
  },
  async exists(name) {
    return (await FileSystem.getInfoAsync(DIR + name)).exists;
  },
  uriFor(name) {
    return DIR + name;
  },
};
