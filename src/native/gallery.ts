import * as MediaLibrary from 'expo-media-library';
import type { Gallery } from '../services/ports';

export const gallery: Gallery = {
  async save(uri) {
    const permission = await MediaLibrary.requestPermissionsAsync(true);
    if (!permission.granted) throw new Error('Gallery permission denied');
    await MediaLibrary.saveToLibraryAsync(uri);
  },
};
