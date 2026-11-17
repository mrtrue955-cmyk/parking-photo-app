import { suggestLocationNote } from '../domain/locationSuggestion';
import { recognizeTextLines } from './textRecognition';

/**
 * The single entry point the Capture screen uses to get a note suggestion for a photo.
 * Never rejects. A future opt-in cloud provider can be added behind this function.
 */
export async function suggestNoteFromPhoto(photoUri: string): Promise<string | null> {
  try {
    return suggestLocationNote(await recognizeTextLines(photoUri));
  } catch (error) {
    console.warn('Failed to suggest a note from the photo', error);
    return null;
  }
}
