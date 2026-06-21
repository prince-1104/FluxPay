import { assertFeature } from '@settl/utils';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { getUserPlanLimits } from './subscription.service.js';

export type OcrResult = {
  merchant?: string;
  amount?: number;
  date?: string;
  items?: string[];
  rawText: string;
  confidence: number;
};

export async function scanReceipt(userId: string, imageBase64: string): Promise<OcrResult> {
  const plan = await getUserPlanLimits(userId);
  assertFeature(plan, 'scanReceipts');

  if (!imageBase64) throw new AppError('Image data is required', 400);

  if (!env.googleVisionApiKey) {
    return {
      merchant: 'Sample Merchant (OCR stub)',
      amount: 499,
      date: new Date().toISOString().split('T')[0],
      items: ['Item 1', 'Item 2'],
      rawText: 'OCR stub — configure GOOGLE_VISION_API_KEY for real scanning',
      confidence: 0.85,
    };
  }

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${env.googleVisionApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: imageBase64.replace(/^data:image\/\w+;base64,/, '') },
          features: [{ type: 'TEXT_DETECTION' }],
        }],
      }),
    }
  );

  if (!response.ok) {
    throw new AppError('OCR service failed', 502);
  }

  const data = await response.json() as {
    responses: Array<{ fullTextAnnotation?: { text: string } }>;
  };
  const rawText = data.responses[0]?.fullTextAnnotation?.text ?? '';
  const amountMatch = rawText.match(/(?:total|amount|rs\.?)\s*[:\s]*([\d,]+\.?\d*)/i);

  return {
    rawText,
    amount: amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : undefined,
    confidence: rawText ? 0.9 : 0,
  };
}
