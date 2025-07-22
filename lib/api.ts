export async function checkEligibility(patientJSON: string): Promise<string> {
  // patientJSON should be a JSON string like: '{"age": 58, "disease": "breast cancer", ...}'
  console.log('Sending patient data:', patientJSON);
  
  // Create AbortController for client-side timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 320000); // 320 seconds (5 minutes 20 seconds)
  
  try {
    const res = await fetch("/api/eligibility", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input_value: patientJSON, // This should be the JSON string of patient data
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      
      // Handle specific error codes with user-friendly messages
      if (res.status === 504) {
        throw new Error(`Analysis Timeout: ${errorData.error || 'The analysis is taking longer than expected. Please try again.'}`);
      } else if (res.status === 503) {
        throw new Error(`Service Unavailable: ${errorData.error || 'The AI service is temporarily unavailable. Please try again in a few moments.'}`);
      } else {
        throw new Error(`API Error (${res.status}): ${errorData.details || errorData.error || 'Unknown error occurred'}`);
      }
    }

    const data = await res.json();
    return data.result ?? JSON.stringify(data);
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout: The analysis is taking too long. Please try again.');
    }
    
    // Re-throw the error if it's already a user-friendly message
    throw error;
  }
}