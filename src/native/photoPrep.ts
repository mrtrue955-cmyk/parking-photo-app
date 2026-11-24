import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_SIDE_PX = 1600;
const JPEG_QUALITY = 0.8;

/**
 * Re-encodes a camera photo once, upright and downscaled, and returns the temp file.
 * The same file feeds the on-device OCR *and* becomes the stored photo, so a 2–4 MB
 * camera frame never has to be copied or decoded twice.
 */
export async function preparePhoto(photoUri: string): Promise<string> {
  try {
    const context = ImageManipulator.manipulate(photoUri, {
      maxWidth: MAX_SIDE_PX,
      maxHeight: MAX_SIDE_PX,
    });
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
    return saved.uri;
  } catch (error) {
    console.warn('Failed to prepare the photo', error);
    return photoUri;
  }
}
