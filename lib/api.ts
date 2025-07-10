export async function checkEligibility(patientJSON: string): Promise<string> {
  const res = await fetch(
    "http://74.225.219.71/api/v1/run/2867785b-6d38-4cd5-9898-7482297069fc",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input_value: patientJSON,
        input_type: "text",
        output_type: "text",
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Langflow API Error: ${res.status}`);
  }

  const data = await res.json();
  return data.result ?? JSON.stringify(data);
}
