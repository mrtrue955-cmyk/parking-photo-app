import { extractTextFromImage, isSupported } from 'expo-text-extractor';

const TIMEOUT_MS = 5_000;

/**
 * Reads the text lines in a photo on the device. Never rejects: any error, an
 * unsupported device, or a read that takes longer than 5 seconds resolves to [].
 */
export async function recognizeTextLines(photoUri: string): Promise<string[]> {
  try {
    if (!isSupported) return [];
    const result = await Promise.race([
      extractTextFromImage(photoUri),
      new Promise<string[]>((resolve) => setTimeout(() => resolve([]), TIMEOUT_MS)),
    ]);
    return Array.isArray(result)
      ? result.filter((line): line is string => typeof line === 'string')
      : [];
  } catch (error) {
    console.warn('Failed to recognize text in the photo', error);
    return [];
  }
}
