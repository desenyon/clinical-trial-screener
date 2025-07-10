// pages/index.tsx
import { useState, useRef } from "react";
import { checkEligibility } from "../lib/api";

export default function Home() {
  const nameRef = useRef<HTMLInputElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);
  const genderRef = useRef<HTMLSelectElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const diagnosisRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [labValues, setLabValues] = useState(`{
  "WBC": 5.2,
  "Hemoglobin": 13.8,
  "Platelets": 250,
  "Creatinine": 1.0
}`);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setOutput(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOutput(null);
    setError(null);
    setLoading(true);

    try {
      let inputPayload = "";

      if (file) {
        const text = await file.text();
        inputPayload = text;
      } else {
        const labJSON = JSON.parse(labValues);
        const formData = {
          name: nameRef.current?.value,
          age: parseInt(ageRef.current?.value || "0"),
          gender: genderRef.current?.value,
          location: locationRef.current?.value,
          diagnosis: diagnosisRef.current?.value,
          stage: stageRef.current?.value,
          labs: labJSON,
        };
        inputPayload = JSON.stringify(formData);
      }

      const result = await checkEligibility(inputPayload);
      setOutput(result);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-gray-900 font-sans px-4 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow p-8 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center text-2xl">
            📋
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              Clinical Trial Eligibility Screener
            </h1>
            <p className="text-slate-500">
              AI-powered matching system for clinical trial enrollment
            </p>
          </div>
        </div>

        {/* Main Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-8">
          <h2 className="text-xl font-semibold mb-6">Patient Information</h2>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 bg-slate-50 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition mb-6">
            <div className="text-4xl text-slate-400 mb-2">📄</div>
            <p className="text-slate-500 mb-2">
              Upload patient medical records (PDF, HL7 FHIR, JSON, or text)
            </p>
            <label className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded cursor-pointer">
              Choose File
              <input
                type="file"
                accept=".pdf,.txt,.json,.xml,.hl7"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {file && (
              <div className="mt-4 text-blue-700 text-sm">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          <div className="text-center text-slate-400 font-medium relative my-8">
            <span className="relative z-10 px-4 bg-white">OR</span>
            <div className="absolute left-0 top-1/2 w-full border-t border-slate-200 -z-0" />
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="font-medium text-sm text-gray-700 mb-1">
                Patient Name
              </label>
              <input ref={nameRef} type="text" className="form-input" />
            </div>
            <div className="flex flex-col">
              <label className="font-medium text-sm text-gray-700 mb-1">
                Age
              </label>
              <input
                ref={ageRef}
                type="number"
                defaultValue={58}
                className="form-input"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-medium text-sm text-gray-700 mb-1">
                Gender
              </label>
              <select ref={genderRef} className="form-select">
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="font-medium text-sm text-gray-700 mb-1">
                Location
              </label>
              <input
                ref={locationRef}
                type="text"
                defaultValue="CA, USA"
                className="form-input"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-medium text-sm text-gray-700 mb-1">
                Primary Diagnosis
              </label>
              <input
                ref={diagnosisRef}
                type="text"
                defaultValue="breast cancer"
                className="form-input"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-medium text-sm text-gray-700 mb-1">
                Disease Stage
              </label>
              <input
                ref={stageRef}
                type="text"
                defaultValue="IIIA"
                className="form-input"
              />
            </div>
            <div className="flex flex-col col-span-1 md:col-span-2">
              <label className="font-medium text-sm text-gray-700 mb-1">
                Laboratory Values (JSON)
              </label>
              <textarea
                rows={6}
                className="form-textarea font-mono"
                value={labValues}
                onChange={(e) => setLabValues(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full py-3 text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:shadow-lg rounded-lg font-semibold transition"
          >
            {loading ? "Checking..." : "🔍 Check Eligibility"}
          </button>
        </form>

        {/* Output */}
        {output && (
          <div className="bg-white rounded-xl shadow p-6 mt-8">
            <h3 className="text-lg font-bold mb-2">📄 Eligibility Result</h3>
            <pre className="whitespace-pre-wrap text-sm text-slate-700">
              {output}
            </pre>

            <div className="mt-4 space-y-2">
              <a
                href="http://74.225.219.71/report.pdf"
                download="eligibility_report.pdf"
                className="text-blue-600 hover:underline block"
              >
                ⬇️ Download Eligibility Report (PDF)
              </a>
              <a
                href="http://74.225.219.71/output.json"
                download="fhir_export.json"
                className="text-blue-600 hover:underline block"
              >
                📁 Download FHIR Data (JSON)
              </a>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded mt-4 shadow">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
