import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(
      "http://74.225.219.71/api/v1/run/2867785b-6d38-4cd5-9898-7482297069fc",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input_value: req.body.input_value,
          input_type: "text",
          output_type: "text",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Langflow API Error: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Failed to check eligibility',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}