import { GoogleGenAI, Modality } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

// The API key is securely accessed from Vercel's environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Next.js Route Handler to handle image transformation.
 * This function is triggered by POST requests to /api/transform.
 */
export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = await req.json();

    if (!image || !mimeType) {
      return NextResponse.json({ message: 'Fehlende Bilddaten oder Mime-Typ.' }, { status: 400 });
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
    
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    const newImageBase64 = imagePart?.inlineData?.data;

    if (newImageBase64) {
      return NextResponse.json({ image: newImageBase64 }, { status: 200 });
    } else {
      const errorText = response.text || 'Keine Bilddaten von der API zurückgegeben.';
      console.error("Gemini API did not return an image. Response:", errorText);
      return NextResponse.json({ message: `Bildgenerierung fehlgeschlagen. Antwort des Modells: ${errorText}` }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in /api/transform:', error);
    const message = error instanceof Error ? error.message : 'Ein interner Serverfehler ist aufgetreten.';
    return NextResponse.json({ message }, { status: 500 });
  }
}
