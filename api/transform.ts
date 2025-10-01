import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from '@google/genai';

// The API key is securely accessed from Vercel's environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Vercel Serverless Function to handle image transformation.
 * This function is triggered by requests to /api/transform.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Methode ${req.method} nicht erlaubt` });
  }

  try {
    const { image, mimeType } = req.body;

    if (!image || !mimeType) {
      return res.status(400).json({ message: 'Fehlende Bilddaten oder Mime-Typ.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: image,
              mimeType: mimeType,
            },
          },
          {
            text: 'Transform this product photo into a professional, studio-quality image for an e-commerce website. Replace the background with a clean, light gray studio background (#f0f0f0). Enhance the lighting, color balance, and sharpness to make the product look appealing and high-quality. Do not add any text, watermarks, or other objects.',
          },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    // Safely find the image part in the response using optional chaining
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    const newImageBase64 = imagePart?.inlineData?.data;

    if (newImageBase64) {
      // Success: send the new base64 image string back to the frontend
      res.status(200).json({ image: newImageBase64 });
    } else {
      // Error: No image was returned from the API
      const errorText = response.text || 'Keine Bilddaten von der API zurückgegeben.';
      console.error("Gemini API did not return an image. Response:", errorText);
      res.status(500).json({ message: `Bildgenerierung fehlgeschlagen. Antwort des Modells: ${errorText}` });
    }
    
  } catch (error) {
    console.error('Error in /api/transform:', error);
    const message = error instanceof Error ? error.message : 'Ein interner Serverfehler ist aufgetreten.';
    res.status(500).json({ message });
  }
}