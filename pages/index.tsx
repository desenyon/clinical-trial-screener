// pages/index.tsx
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [labValues, setLabValues] = useState(`{
  "WBC": 5.2,
  "Hemoglobin": 13.8,
  "Platelets": 250,
  "Creatinine": 1.0
}`);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("🚧 Submission handler is not connected yet.");
  };

  return (
    <main className="min-h-screen bg-slate-50 text-gray-900 font-sans px-4 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow p-8 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center text-2xl">📋</div>
          <div>
            <h1 className="text-3xl font-bold">Clinical Trial Eligibility Screener</h1>
            <p className="text-slate-500">AI-powered matching system for clinical trial enrollment</p>
          </div>
        </div>

        {/* Main Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-8">
          <h2 className="text-xl font-semibold mb-6">Patient Information</h2>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 bg-slate-50 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition mb-6">
            <div className="text-4xl text-slate-400 mb-2">📄</div>
            <p className="text-slate-500 mb-2">Upload patient medical records (PDF, HL7 FHIR, or clinical notes)</p>
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
              <div className="mt-4 text-blue-700 text-sm">{file.name} ({(file.size / 1024).toFixed(1)} KB)</div>
            )}
          </div>

          <div className="text-center text-slate-400 font-medium relative my-8">
            <span className="relative z-10 px-4 bg-white">OR</span>
            <div className="absolute left-0 top-1/2 w-full border-t border-slate-200 -z-0" />
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="font-medium text-sm text-gray-700 mb-1">Patient Name</label>
              <input type="text" className="form-input" placeholder="Enter patient name" />
            </div>
            <div className="flex flex-col">
              <label className="font-medium text-sm text-gray-700 mb-1">Age</label>
              <input type="number" defaultValue={58} className="form-input" />
            </div>
            <div className="flex flex-col">
              <label className="font-medium text-sm text-gray-700 mb-1">Gender</label>
              <select className="form-select">
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="font-medium text-sm text-gray-700 mb-1">Location</label>
              <input type="text" defaultValue="CA, USA" className="form-input" />
            </div>
            <div className="flex flex-col">
              <label className="font-medium text-sm text-gray-700 mb-1">Primary Diagnosis</label>
              <input type="text" defaultValue="breast cancer" className="form-input" />
            </div>
            <div className="flex flex-col">
              <label className="font-medium text-sm text-gray-700 mb-1">Disease Stage</label>
              <input type="text" defaultValue="IIIA" className="form-input" />
            </div>
            <div className="flex flex-col col-span-1 md:col-span-2">
              <label className="font-medium text-sm text-gray-700 mb-1">Laboratory Values (JSON)</label>
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
            className="mt-8 w-full py-3 text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:shadow-lg rounded-lg font-semibold transition"
          >
            🔍 Check Eligibility
          </button>
        </form>
      </div>
    </main>
  );
}
