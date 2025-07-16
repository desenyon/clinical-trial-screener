import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('API Route called with method:', req.method);
  console.log('Request body:', req.body);

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if input_value exists
  if (!req.body?.input_value) {
    console.error('Missing input_value in request body');
    return res.status(400).json({ error: 'Missing input_value in request body' });
  }

  try {
    console.log('Making request to external API...');
    
    // Ensure input_value is a string as the API expects
    let inputValue;
    if (typeof req.body.input_value === 'string') {
      inputValue = req.body.input_value;
    } else {
      // If it's an object, stringify it
      inputValue = JSON.stringify(req.body.input_value);
    }
    
    console.log('Processed input_value:', inputValue);
    
    const response = await fetch(
      "http://74.225.219.71/api/v1/run/2867785b-6d38-4cd5-9898-7482297069fc",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input_value: inputValue,
          input_type: "text",
          output_type: "text",
        }),
      }
    );

    console.log('External API response status:', response.status);
    console.log('External API response headers:', Object.fromEntries(response.headers.entries()));

    // Get the response text first
    const responseText = await response.text();
    console.log('External API response text (first 200 chars):', responseText.substring(0, 200));

    // Check if we got HTML instead of JSON (Langflow web interface)
    if (responseText.includes('<!doctype html') || responseText.includes('<html')) {
      console.error('Received HTML response instead of JSON - API endpoint may be incorrect');
      return res.status(502).json({ 
        error: 'External API configuration error',
        details: 'The API endpoint is returning the Langflow web interface instead of JSON. Please check the endpoint configuration.'
      });
    }

    // Check if the external API returned an error status
    if (!response.ok) {
      console.error('External API returned error status:', response.status);
      return res.status(response.status).json({ 
        error: 'External API error',
        details: responseText || 'Unknown error from external API'
      });
    }

    // Try to parse the response as JSON
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse external API response as JSON:', parseError);
      return res.status(502).json({ 
        error: 'Invalid JSON response from external API',
        details: 'The external API returned invalid JSON'
      });
    }

    console.log('Successfully parsed external API response:', jsonResponse);
    
    // Return the response from the external API
    return res.status(200).json(jsonResponse);

  } catch (error) {
    console.error('Error calling external API:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}