import { deleteAsync } from 'expo-file-system/legacy';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { extractTextFromImage, isSupported } from 'expo-text-extractor';
import { toTextLines } from '../domain/locationSuggestion';

const TIMEOUT_MS = 5_000;
const MAX_SIDE_PX = 1_600;
const JPEG_QUALITY = 0.9;

/**
 * Re-encodes the photo for OCR: orientation baked into the pixels (the camera keeps portrait
 * photos as sideways pixels plus an EXIF tag, which the OCR library ignores on iOS), longest
 * side at most 1600 px (never upscaled) and JPEG. Falls back to the original URI on any error.
 */
async function prepareImage(photoUri: string): Promise<string> {
  try {
    const context = ImageManipulator.manipulate(photoUri, {
      maxWidth: MAX_SIDE_PX,
      maxHeight: MAX_SIDE_PX,
    });
    const image = await context.renderAsync();
    const saved = await image.saveAsync({
      format: SaveFormat.JPEG,
      compress: JPEG_QUALITY,
    });
    return saved.uri;
  } catch (error) {
    console.warn('Failed to prepare the photo for text recognition', error);
    return photoUri;
  }
}

/**
 * Reads the text lines in a photo on the device. The photo is first re-encoded upright and
 * downscaled in a temporary file (deleted afterwards, the original is never touched). Blocks
 * that hold several lines (Android) are split into single lines. Never rejects: any error, an
 * unsupported device, or a read that takes longer than 5 seconds resolves to [].
 */
export async function recognizeTextLines(photoUri: string): Promise<string[]> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let preparedUri = photoUri;
  try {
    if (!isSupported) return [];
    const result = await Promise.race([
      (async () => {
        preparedUri = await prepareImage(photoUri);
        return extractTextFromImage(preparedUri);
      })(),
      new Promise<string[]>((resolve) => {
        timer = setTimeout(() => resolve([]), TIMEOUT_MS);
      }),
    ]);

    return Array.isArray(result)
      ? toTextLines(result.filter((line): line is string => typeof line === 'string'))
      : [];
  } catch (error) {
    console.warn('Failed to recognize text in the photo', error);
    return [];
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    if (preparedUri !== photoUri) {
      deleteAsync(preparedUri, { idempotent: true }).catch(() => {});
    }
  }
}
