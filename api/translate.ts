/* eslint-disable import/no-default-export */
/* eslint-disable no-console */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // preflight запрос
  if (req.method === 'OPTIONS') {
    res.status(200).end();

    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });

    return;
  }

  const { texts, apiKey } = req.body;

  if (!texts || !apiKey) {
    res.status(400).json({ error: 'Missing texts or apiKey in request body' });

    return;
  }

  try {
    const response = await fetch(
      'https://translate.api.cloud.yandex.net/translate/v2/translate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Api-Key ${apiKey}`
        },
        body: JSON.stringify({
          texts: Array.isArray(texts) ? texts : [texts],
          targetLanguageCode: 'ru'
        })
      }
    );

    console.log('Yandex API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();

      res.status(response.status).json({
        error: `Yandex API Error: ${response.status}`,
        details: errorText
      });

      return;
    }

    const data = await response.json();
    console.log('Translation successful');

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Translation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
