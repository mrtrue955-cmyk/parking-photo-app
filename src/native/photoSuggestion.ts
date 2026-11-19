import { suggestLocationNote } from '../domain/locationSuggestion';
import type { LevelStyle } from '../domain/levelStyle';
import type { Locale } from '../i18n/translations';
import { recognizeTextLines } from './textRecognition';

/**
 * The single entry point the Capture screen uses to get a note suggestion for a photo.
 * Never rejects. A future opt-in cloud provider can be added behind this function.
 */
export async function suggestNoteFromPhoto(
  photoUri: string,
  locale: Locale = 'vi',
  levelStyle: LevelStyle = 'B',
): Promise<string | null> {
  try {
    return suggestLocationNote(await recognizeTextLines(photoUri), locale, levelStyle);
  } catch (error) {
    console.warn('Failed to suggest a note from the photo', error);
    return null;
  }
}
