import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patientData, eligibilityResult } = req.body;

  // Clean and format the eligibility result for better PDF display
  const cleanEligibilityResult = eligibilityResult
    .replace(/^\s*\)\s*$/gm, '') // Remove standalone parentheses
    .replace(/^\s*\)\s*NCT/gm, 'NCT') // Fix broken NCT numbers
    .replace(/\)\s*NCT/g, ' NCT') // Fix inline NCT formatting
    .trim();

  try {
    // Try to use html-pdf-node for server-side PDF generation
    let pdf;
    try {
      const htmlPdf = require('html-pdf-node');
      
      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Clinical Trial Eligibility Report</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            font-size: 14px;
          }
          h1 { 
            color: #2563eb; 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 10px; 
            margin-bottom: 30px;
            font-size: 28px;
          }
          h2 { 
            color: #1e40af; 
            margin-top: 30px; 
            margin-bottom: 15px;
            font-size: 20px;
          }
          h3 {
            color: #374151;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 16px;
          }
          .patient-info { 
            background: #f8fafc; 
            padding: 20px; 
            border-left: 5px solid #2563eb; 
            margin: 20px 0; 
            border-radius: 5px;
          }
          .patient-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
          }
          .patient-item {
            padding: 8px 0;
          }
          .result { 
            background: #ffffff; 
            padding: 25px; 
            border: 2px solid #e2e8f0;
            border-radius: 8px; 
            margin: 20px 0; 
          }
          .lab-values { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 12px; 
            margin: 15px 0; 
          }
          .lab-item { 
            background: white; 
            padding: 12px; 
            border-radius: 6px; 
            border: 1px solid #d1d5db; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .timestamp { 
            color: #64748b; 
            font-size: 12px; 
            text-align: right; 
            margin-top: 40px; 
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          }
          .analysis-content { 
            white-space: pre-wrap; 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            border: 1px solid #e2e8f0;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.5;
            overflow-wrap: break-word; 
          }
          .page-break { 
            page-break-before: always; 
          }
          @media print {
            body { margin: 0; }
            .page-break { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        <h1>📋 Clinical Trial Eligibility Report</h1>
        
        <div class="patient-info">
          <h2>Patient Information</h2>
          <div class="patient-grid">
            <div class="patient-item"><strong>Age:</strong> ${patientData.age || 'N/A'}</div>
            <div class="patient-item"><strong>Disease:</strong> ${patientData.disease || 'N/A'}</div>
            <div class="patient-item"><strong>Stage:</strong> ${patientData.stage || 'N/A'}</div>
            <div class="patient-item"><strong>Geography:</strong> ${patientData.geography || 'N/A'}</div>
          </div>
          
          <h3>Laboratory Values</h3>
          <div class="lab-values">
            ${Object.entries(patientData.labs || {}).map(([key, value]) => 
              `<div class="lab-item"><strong>${key}:</strong> ${value}</div>`
            ).join('')}
          </div>
        </div>
        
        <div class="result">
          <h2>🎯 Clinical Trial Eligibility Analysis</h2>
          <div class="analysis-content">${cleanEligibilityResult}</div>
        </div>
        
        <div class="timestamp">
          Generated on: ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
      `;

      const options = { 
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      };
      const file = { content: htmlContent };
      
      pdf = await htmlPdf.generatePdf(file, options);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="eligibility-report.pdf"');
      res.setHeader('Content-Length', pdf.length);
      
      return res.status(200).send(pdf);
      
    } catch (pdfError) {
      console.log('PDF generation failed, falling back to HTML:', pdfError);
      
      // Fallback to HTML download with same clean content
      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Clinical Trial Eligibility Report</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            font-size: 14px;
          }
          h1 { 
            color: #2563eb; 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 10px; 
            margin-bottom: 30px;
            font-size: 28px;
          }
          h2 { 
            color: #1e40af; 
            margin-top: 30px; 
            margin-bottom: 15px;
            font-size: 20px;
          }
          h3 {
            color: #374151;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 16px;
          }
          .patient-info { 
            background: #f8fafc; 
            padding: 20px; 
            border-left: 5px solid #2563eb; 
            margin: 20px 0; 
            border-radius: 5px;
          }
          .patient-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
          }
          .patient-item {
            padding: 8px 0;
          }
          .result { 
            background: #ffffff; 
            padding: 25px; 
            border: 2px solid #e2e8f0;
            border-radius: 8px; 
            margin: 20px 0; 
          }
          .lab-values { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 12px; 
            margin: 15px 0; 
          }
          .lab-item { 
            background: white; 
            padding: 12px; 
            border-radius: 6px; 
            border: 1px solid #d1d5db; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .timestamp { 
            color: #64748b; 
            font-size: 12px; 
            text-align: right; 
            margin-top: 40px; 
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          }
          .analysis-content { 
            white-space: pre-wrap; 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            border: 1px solid #e2e8f0;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.5;
            overflow-wrap: break-word; 
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <h1>📋 Clinical Trial Eligibility Report</h1>
        
        <div class="patient-info">
          <h2>Patient Information</h2>
          <div class="patient-grid">
            <div class="patient-item"><strong>Age:</strong> ${patientData.age || 'N/A'}</div>
            <div class="patient-item"><strong>Disease:</strong> ${patientData.disease || 'N/A'}</div>
            <div class="patient-item"><strong>Stage:</strong> ${patientData.stage || 'N/A'}</div>
            <div class="patient-item"><strong>Geography:</strong> ${patientData.geography || 'N/A'}</div>
          </div>
          
          <h3>Laboratory Values</h3>
          <div class="lab-values">
            ${Object.entries(patientData.labs || {}).map(([key, value]) => 
              `<div class="lab-item"><strong>${key}:</strong> ${value}</div>`
            ).join('')}
          </div>
        </div>
        
        <div class="result">
          <h2>🎯 Clinical Trial Eligibility Analysis</h2>
          <div class="analysis-content">${cleanEligibilityResult}</div>
        </div>
        
        <div class="timestamp">
          Generated on: ${new Date().toLocaleString()}
        </div>
        
        <script>
          // Auto-print when opened
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 1000);
          };
        </script>
      </body>
      </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', 'attachment; filename="eligibility-report.html"');
      
      return res.status(200).send(htmlContent);
    }
    
  } catch (error) {
    console.error('Report generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate report',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
