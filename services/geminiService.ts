/**
 * Communicates with the backend service to transform an image.
 * This function sends the image data to a secure backend endpoint `/api/transform`.
 * The API key is used in the backend, never in the frontend code.
 *
 * @param base64ImageData The base64 encoded string of the image.
 * @param mimeType The MIME type of the image.
 * @returns A promise that resolves to the base64 encoded string of the transformed image, received from your backend.
 */
export const transformImage = async (base64ImageData: string, mimeType: string): Promise<string> => {
  // The Vercel serverless function is located at /api/transform.
  // When deployed, calls to this relative path will be routed correctly.
  const functionUrl = '/api/transform';

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64ImageData,
        mimeType: mimeType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Anfrage fehlgeschlagen mit Status ${response.status}`);
    }

    const data = await response.json();

    if (data.image) {
      return data.image;
    } else {
      throw new Error(data.message || 'Das Backend hat kein Bild zurückgegeben.');
    }

  } catch (error) {
    console.error("Error calling backend service:", error);
    if (error instanceof Error) {
      throw new Error(`Service-Fehler: ${error.message}`);
    }
    throw new Error('Ein unbekannter Fehler ist bei der Bildtransformation aufgetreten.');
  }
};