import * as MediaLibrary from 'expo-media-library/legacy';
import { GalleryPermissionDeniedError, type Gallery } from '../services/ports';

export const gallery: Gallery = {
  async save(uri) {
    const permission = await MediaLibrary.requestPermissionsAsync(true);
    if (!permission.granted) throw new GalleryPermissionDeniedError();
    await MediaLibrary.saveToLibraryAsync(uri);
  },
};
