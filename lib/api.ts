export async function checkEligibility(patientJSON: string): Promise<string> {
  // patientJSON should be a JSON string like: '{"age": 58, "disease": "breast cancer", ...}'
  console.log('Sending patient data:', patientJSON);
  
  const res = await fetch("/api/eligibility", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input_value: patientJSON, // This should be the JSON string of patient data
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(`Eligibility API Error: ${res.status} - ${errorData.details || errorData.error || 'Unknown error'}`);
  }

  const data = await res.json();
  return data.result ?? JSON.stringify(data);
}