import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patientData, eligibilityResult, trials } = req.body;

  try {
    // Create a FHIR Bundle for clinical trial eligibility
    const fhirBundle: any = {
      resourceType: "Bundle",
      id: `eligibility-${Date.now()}`,
      meta: {
        lastUpdated: new Date().toISOString(),
        profile: ["http://hl7.org/fhir/StructureDefinition/Bundle"]
      },
      identifier: {
        system: "http://clinical-trial-screener.com/bundle-id",
        value: `eligibility-${Date.now()}`
      },
      type: "collection",
      timestamp: new Date().toISOString(),
      entry: []
    };

    // Add Patient resource
    const patientResource = {
      fullUrl: "urn:uuid:patient-1",
      resource: {
        resourceType: "Patient",
        id: "patient-1",
        meta: {
          profile: ["http://hl7.org/fhir/StructureDefinition/Patient"]
        },
        identifier: [
          {
            system: "http://clinical-trial-screener.com/patient-id",
            value: "patient-1"
          }
        ],
        active: true,
        birthDate: new Date(new Date().getFullYear() - (patientData.age || 58), 0, 1).toISOString().split('T')[0],
        address: [
          {
            use: "home",
            text: patientData.geography || "Unknown"
          }
        ]
      }
    };

    fhirBundle.entry.push(patientResource);

    // Add Condition resource for the disease
    const conditionResource = {
      fullUrl: "urn:uuid:condition-1",
      resource: {
        resourceType: "Condition",
        id: "condition-1",
        meta: {
          profile: ["http://hl7.org/fhir/StructureDefinition/Condition"]
        },
        clinicalStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
              code: "active",
              display: "Active"
            }
          ]
        },
        verificationStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
              code: "confirmed",
              display: "Confirmed"
            }
          ]
        },
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/condition-category",
                code: "encounter-diagnosis",
                display: "Encounter Diagnosis"
              }
            ]
          }
        ],
        code: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "254837009",
              display: "Malignant neoplasm of breast"
            }
          ],
          text: patientData.disease || "breast cancer"
        },
        subject: {
          reference: "urn:uuid:patient-1"
        },
        recordedDate: new Date().toISOString(),
        stage: [
          {
            summary: {
              text: patientData.stage || "IIIA"
            }
          }
        ]
      }
    };

    fhirBundle.entry.push(conditionResource);

    // Add Observation resources for lab values
    if (patientData.labs) {
      Object.entries(patientData.labs).forEach(([labName, value], index) => {
        const observationResource = {
          fullUrl: `urn:uuid:observation-${index + 1}`,
          resource: {
            resourceType: "Observation",
            id: `observation-${index + 1}`,
            meta: {
              profile: ["http://hl7.org/fhir/StructureDefinition/Observation"]
            },
            status: "final",
            category: [
              {
                coding: [
                  {
                    system: "http://terminology.hl7.org/CodeSystem/observation-category",
                    code: "laboratory",
                    display: "Laboratory"
                  }
                ]
              }
            ],
            code: {
              coding: [
                {
                  system: "http://loinc.org",
                  code: getLoincCode(labName),
                  display: labName
                }
              ],
              text: labName
            },
            subject: {
              reference: "urn:uuid:patient-1"
            },
            effectiveDateTime: new Date().toISOString(),
            valueQuantity: {
              value: parseFloat(value as string),
              unit: getLabUnit(labName)
            }
          }
        };
        fhirBundle.entry.push(observationResource);
      });
    }

    // Add ClinicalImpression for eligibility analysis
    const clinicalImpressionResource = {
      fullUrl: "urn:uuid:clinical-impression-1",
      resource: {
        resourceType: "ClinicalImpression",
        id: "clinical-impression-1",
        meta: {
          profile: ["http://hl7.org/fhir/StructureDefinition/ClinicalImpression"]
        },
        identifier: [
          {
            system: "http://clinical-trial-screener.com/impression-id",
            value: "eligibility-analysis-1"
          }
        ],
        status: "completed",
        code: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "386053000",
              display: "Evaluation procedure"
            }
          ],
          text: "Clinical Trial Eligibility Assessment"
        },
        subject: {
          reference: "urn:uuid:patient-1"
        },
        effectiveDateTime: new Date().toISOString(),
        date: new Date().toISOString(),
        assessor: {
          display: "Clinical Trial Screener AI"
        },
        summary: eligibilityResult.substring(0, 1000) + (eligibilityResult.length > 1000 ? "..." : ""),
        finding: trials ? trials.slice(0, 15).map((trial: any, index: number) => ({
          itemCodeableConcept: {
            coding: [
              {
                system: "http://clinicaltrials.gov",
                code: trial.nctNumber,
                display: trial.title
              }
            ],
            text: trial.title
          },
          basis: trial.explanation
        })) : []
      }
    };

    fhirBundle.entry.push(clinicalImpressionResource);

    res.setHeader('Content-Type', 'application/fhir+json');
    res.setHeader('Content-Disposition', 'attachment; filename="clinical-trial-eligibility.json"');
    
    return res.status(200).json(fhirBundle);
    
  } catch (error) {
    console.error('FHIR generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate FHIR bundle',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Helper functions for LOINC codes and units
function getLoincCode(labName: string): string {
  const loincMap: { [key: string]: string } = {
    'WBC': '6690-2',
    'Hemoglobin': '718-7', 
    'Platelets': '777-3',
    'Creatinine': '2160-0'
  };
  return loincMap[labName] || '33747-0'; // Default to general lab result
}

function getLabUnit(labName: string): string {
  const unitMap: { [key: string]: string } = {
    'WBC': '10*3/uL',
    'Hemoglobin': 'g/dL',
    'Platelets': '10*3/uL', 
    'Creatinine': 'mg/dL'
  };
  return unitMap[labName] || '';
}
