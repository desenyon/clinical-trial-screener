// /pages/api/eligibility.ts
import { NextApiRequest, NextApiResponse } from 'next';

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

  try {
    const response = await fetch("http://4.240.113.235:7860/api/v1/run/ecd763a7-feff-4753-b05a-b012a395874e", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "sk-ev5D6gLGc3IMF1-lZMlhaWsizk3H2LbnIha36bDQS1I",
        "Connection": "keep-alive",
        "Accept": "application/json"
      },
      body: JSON.stringify(requestPayload),
    });

    const responseText = await response.text();
    console.log('Langflow response status:', response.status);

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
    console.error('API Error:', error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
