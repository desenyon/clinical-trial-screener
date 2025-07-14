export async function checkEligibility(patientJSON: string): Promise<string> {
  const res = await fetch("/api/eligibility", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input_value: patientJSON,
    }),
  });

  if (!res.ok) {
    throw new Error(`Eligibility API Error: ${res.status}`);
  }

  const data = await res.json();
  return data.result ?? JSON.stringify(data);
}