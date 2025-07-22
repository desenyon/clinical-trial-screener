import { useState, useRef, useEffect } from "react";
import { checkEligibility } from "../lib/api";
import removeMarkdown from "remove-markdown";

export default function Home() {
  const nameRef = useRef<HTMLInputElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);
  const genderRef = useRef<HTMLSelectElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const diagnosisRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLInputElement>(null);

  const [labValues, setLabValues] = useState(`{
  "WBC": 5.2,
  "Hemoglobin": 13.8,
  "Platelets": 250,
  "Creatinine": 1.0
}`);
  const [output, setOutput] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);

  // Timer effect for loading screen
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingTime(0);
      interval = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  const handleFHIRDownload = async () => {
    try {
      const response = await fetch('/api/generate-fhir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientData: patientData,
          eligibilityResult: output,
          trials: [] // Empty since we removed parsed trials
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'clinical-trial-eligibility.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to generate FHIR bundle');
      }
    } catch (error) {
      console.error('Error downloading FHIR bundle:', error);
    }
  };

  const downloadPDF = async () => {
    if (!output || !patientData) return;
    
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientData,
          eligibilityResult: output,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/pdf')) {
        // Handle PDF response
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'eligibility-report.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Handle HTML response
        const htmlContent = await response.text();
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'eligibility-report.html';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('PDF download failed:', err);
      setError('Failed to download PDF report');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOutput(null);
    setError(null);
    setLoading(true);

    try {
      let inputPayload = "";

      const labJSON = JSON.parse(labValues);
      const formData = {
        age: parseInt(ageRef.current?.value || "0"),
        disease: diagnosisRef.current?.value,
        labs: labJSON,
        stage: stageRef.current?.value,
        geography: locationRef.current?.value,
      };
      inputPayload = JSON.stringify(formData);
      setPatientData(formData); // Store for PDF generation

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
    <main className="min-h-screen bg-slate-50 text-gray-900 font-sans px-4 py-10 relative">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center">
            <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">Analyzing Patient Data</h3>
            <p className="text-slate-600">AI is checking trial eligibility...</p>
            <p className="text-sm text-slate-500 mt-2">Time elapsed: {loadingTime}s</p>
            <p className="text-sm text-slate-400">Average wait time: ~300 seconds</p>
            
            {/* Progress indicator based on 300 second average */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>0s</span>
                <span>{Math.min(loadingTime, 300)}s / 300s</span>
              </div>
              <div className="bg-slate-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-1000 ${
                    loadingTime < 240 ? 'bg-blue-500' : 
                    loadingTime < 300 ? 'bg-yellow-500' : 
                    'bg-orange-500'
                  }`}
                  style={{width: Math.min((loadingTime / 300) * 100, 100) + '%'}}
                ></div>
              </div>
            </div>
            
            {/* Status messages based on time elapsed */}
            {loadingTime < 60 && (
              <p className="text-sm text-blue-600 mt-3">🔍 Initializing analysis...</p>
            )}
            {loadingTime >= 60 && loadingTime < 180 && (
              <p className="text-sm text-blue-600 mt-3">⚡ Processing clinical data...</p>
            )}
            {loadingTime >= 180 && loadingTime < 300 && (
              <p className="text-sm text-yellow-600 mt-3">🧠 AI matching trials...</p>
            )}
            {loadingTime >= 300 && loadingTime < 400 && (
              <p className="text-sm text-orange-600 mt-3">⏳ Almost complete...</p>
            )}
            {loadingTime >= 400 && (
              <p className="text-sm text-red-600 mt-3">⚠️ Taking longer than expected</p>
            )}
          </div>
        </div>
      )}
      
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

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-8">
          <h2 className="text-xl font-semibold mb-6">Patient Information</h2>

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
                Geography/Location
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
                Disease/Primary Diagnosis
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
            <h3 className="text-lg font-bold mb-4">📄 Eligibility Analysis Results</h3>
            
            {/* Structured Raw Output - Moved to top */}
            <details className="mb-6" open>
              <summary className="cursor-pointer font-medium text-slate-700 hover:text-slate-900 flex items-center gap-2 mb-3">
                <span>📋</span> View Full Analysis Text
              </summary>
              <div className="mt-3 p-4 bg-slate-50 rounded-lg max-h-96 overflow-y-auto border">
                <div 
                  className="text-sm text-slate-700"
                  dangerouslySetInnerHTML={{
                    __html: output
                      // Remove any standalone parentheses or artifacts first
                      .replace(/^\s*\)\s*$/gm, '')
                      .replace(/^\s*\)\s*NCT/gm, 'NCT')
                      .replace(/\)\s*NCT/g, ' NCT')
                      
                      // Format numbered trial headers
                      .replace(/^(\d+)\.\s(.+?)\s*\(NCT:\s*(NCT\d{8})\)/gm, 
                        '<div class="mt-6 pt-4 border-t-2 border-blue-200 first:mt-0 first:pt-0 first:border-t-0">' +
                        '<div class="flex items-center justify-between mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">' +
                        '<div><span class="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold mr-3">$1</span>' +
                        '<strong class="text-slate-800 text-base">$2</strong></div>' +
                        '<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-mono border border-blue-300">$3</span>' +
                        '</div>')
                      
                      // Format Conditions with highlighting
                      .replace(/^\s*Conditions:\s*(.+?)(?=\s*Explanation:)/gm, 
                        '<div class="ml-4 mb-3 p-3 bg-orange-50 border-l-4 border-orange-400 rounded-r">' +
                        '<div class="flex items-start gap-3">' +
                        '<span class="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">CONDITIONS</span>' +
                        '<span class="text-slate-700">$1</span></div></div>')
                      
                      // Format Explanations with highlighting  
                      .replace(/^\s*Explanation:\s*(.+?)(?=\n\d+\.|$)/gm,
                        '<div class="ml-4 mb-4 p-3 bg-green-50 border-l-4 border-green-400 rounded-r">' +
                        '<div class="flex items-start gap-3">' +
                        '<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">EXPLANATION</span>' +
                        '<span class="text-slate-700">$1</span></div></div>')
                      
                      // Clean up any remaining artifacts
                      .replace(/\n\s*\)/g, '')
                      .replace(/\)\s*\n/g, '\n')
                      
                      // Convert remaining line breaks
                      .replace(/\n\n/g, '</div><br>')
                      .replace(/\n/g, ' ')
                      
                      // Close any remaining open divs
                      + '</div>'
                  }}
                />
              </div>
            </details>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadPDF}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
              >
                📄 Download PDF Report
              </button>
              
              <button
                onClick={handleFHIRDownload}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
              >
                📦 Download FHIR Bundle
              </button>
            </div>

            <details className="mt-4 text-sm text-slate-400">
              <summary className="cursor-pointer">Show unformatted markdown output</summary>
              <pre className="mt-2 text-xs bg-slate-100 p-3 rounded overflow-x-auto">{output}</pre>
            </details>
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
