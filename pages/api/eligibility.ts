// /pages/api/eligibility.ts
import { NextApiRequest, NextApiResponse } from 'next';

// Increase the timeout for this API route
export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  maxDuration: 300, // 5 minutes max
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API Route called with method:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const inputValue = typeof req.body.input_value === 'string'
    ? req.body.input_value
    : JSON.stringify(req.body.input_value);

  console.log('Processing input:', inputValue);

  const requestPayload = {
    output_type: "text",
    input_type: "text",
    tweaks: {
      "TextInput-xNjgs": {
        input_value: inputValue
      }
    },
    stream: false
  };
  
  console.log('Sending to Langflow...');

  // Create AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('Request timeout, aborting...');
    controller.abort();
  }, 280000); // 280 seconds (20 seconds before Vercel timeout)

  try {
    const response = await fetch("http://4.240.113.235:7860/api/v1/run/ecd763a7-feff-4753-b05a-b012a395874e", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "sk-ev5D6gLGc3IMF1-lZMlhaWsizk3H2LbnIha36bDQS1I",
        "Connection": "close", // Changed from keep-alive to close
        "Accept": "application/json",
        "User-Agent": "Clinical-Trial-Screener/1.0"
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal, // Add abort signal
    });

    clearTimeout(timeoutId); // Clear timeout if request succeeds

    const responseText = await response.text();
    console.log('Langflow response status:', response.status);
    console.log('Response length:', responseText.length);

    if (responseText.includes("<!doctype html") || responseText.includes("<html")) {
      return res.status(502).json({
        error: "Langflow returned HTML instead of JSON. Check your endpoint or flow config.",
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: "External API error",
        details: responseText,
      });
    }

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
    } catch {
      return res.status(502).json({
        error: "Invalid JSON from Langflow",
      });
    }

    // Log the full response for debugging only if needed
    // console.log('Full Langflow response:', JSON.stringify(jsonResponse, null, 2));

    // Handle the new response format - check multiple possible paths
    let result = null;
    
    // Try different response structures
    if (jsonResponse.outputs && jsonResponse.outputs.length > 0) {
      const firstOutput = jsonResponse.outputs[0];
      if (firstOutput.outputs && firstOutput.outputs.length > 0) {
        const nestedOutput = firstOutput.outputs[0];
        result = nestedOutput.results?.text?.text || 
                 nestedOutput.results?.text?.data?.text || 
                 nestedOutput.results?.message?.text ||
                 nestedOutput.results?.text || 
                 nestedOutput.message?.text ||
                 nestedOutput.text ||
                 nestedOutput.data?.text;
      }
    }
    
    // Fallback options
    if (!result) {
      result = jsonResponse.result || 
               jsonResponse.message || 
               jsonResponse.text ||
               jsonResponse.data?.text;
    }
    
    // If still no result, check if outputs is empty and provide helpful message
    if (!result) {
      if (jsonResponse.outputs && jsonResponse.outputs.length === 0) {
        result = "The Langflow returned an empty response. This might indicate an issue with the flow configuration or the input data format.";
      } else if (jsonResponse.outputs && jsonResponse.outputs[0]?.outputs?.length === 0) {
        result = "The Langflow flow completed but produced no output. Please check your flow configuration.";
      } else {
        result = `Unexpected response structure: ${JSON.stringify(jsonResponse)}`;
      }
    }

    console.log('Extracted result:', result);
    return res.status(200).json({ result: String(result) });
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout in case of error
    
    console.error('API Error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return res.status(504).json({
          error: "Request timeout - Analysis is taking longer than expected. Please try again.",
          details: "The AI analysis timed out after 4.5 minutes. This may be due to high server load."
        });
      }
      
      if ((error as any).code === 'UND_ERR_SOCKET' || error.message?.includes('socket')) {
        return res.status(503).json({
          error: "Connection error - Unable to reach the AI analysis service",
          details: "The connection was closed by the remote server. Please try again in a few moments."
        });
      }
      
      if (error.message?.includes('fetch failed')) {
        return res.status(503).json({
          error: "Network error - Unable to connect to AI service",
          details: "There may be a temporary network issue. Please try again."
        });
      }
    }

    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
}
