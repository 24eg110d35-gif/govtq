import { DigitalToken } from '../types/queue';

export interface PicnieStatus {
  isConfigured: boolean;
  apiKeyPresent: boolean;
  endpoint: string;
  statusMessage: string;
}

export interface OcrExtractedData {
  documentType: 'Aadhaar Card' | 'PAN Card' | 'Voter ID' | 'Passport' | 'Utility Bill' | 'Other Official ID';
  citizenName: string;
  documentNumber: string;
  issuingAuthority: string;
  confidenceScore: number;
  extractedAddress?: string;
  disclaimer: string;
}

export const PicnieService = {
  // Check API status
  getStatus(): PicnieStatus {
    // Client-safe check of whether backend has keys or if in demo fallback
    return {
      isConfigured: false, // Default until user sets PICNIE_API_KEY in .env
      apiKeyPresent: false,
      endpoint: 'https://api.picnie.com/v1',
      statusMessage: 'Picnie API Key not configured in server environment. Using high-fidelity SmartGov print and client OCR fallback.',
    };
  },

  // Document OCR simulation / integration
  async scanSupportingDocument(file: { name: string; size: number; type: string }): Promise<OcrExtractedData> {
    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|pdf)$/i)) {
      throw new Error('Unsupported file format. Please upload JPG, PNG, or PDF files only.');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File exceeds the 10 MB limit for government document upload.');
    }

    // Simulate processing delay of 1.2s
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Realistic document extraction heuristics based on file name or default civic samples
    const lowerName = file.name.toLowerCase();
    let docType: OcrExtractedData['documentType'] = 'Aadhaar Card';
    let docNumber = 'CID-9041-8821';
    let authority = 'Unique Identification Authority of India (UIDAI)';
    let extractedName = 'Anjali Sharma';
    let address = 'Flat 402, Kaveri Heights, 5th Cross, Gandhi Road, Sector 4';

    if (lowerName.includes('pan')) {
      docType = 'PAN Card';
      docNumber = 'ABCPS8192K';
      authority = 'Income Tax Department, Govt of India';
    } else if (lowerName.includes('passport')) {
      docType = 'Passport';
      docNumber = 'Z9821445';
      authority = 'Consular Passport and Visa Division (CPV)';
    } else if (lowerName.includes('voter') || lowerName.includes('epic')) {
      docType = 'Voter ID';
      docNumber = 'EPIC-8829104';
      authority = 'Election Commission of India';
    } else if (lowerName.includes('bill') || lowerName.includes('tax') || lowerName.includes('electric')) {
      docType = 'Utility Bill';
      docNumber = 'BESCOM-RR-481920';
      authority = 'State Electricity & Water Supply Board';
    }

    return {
      documentType: docType,
      citizenName: extractedName,
      documentNumber: docNumber,
      issuingAuthority: authority,
      confidenceScore: 94.8,
      extractedAddress: address,
      disclaimer: 'Notice: OCR extraction retrieves legible text only. It does not certify legal validity or official document authenticity.',
    };
  },

  // Trigger high-fidelity print or PDF view
  triggerPrintReceipt(token: DigitalToken) {
    if (typeof window !== 'undefined') {
      window.print();
    }
  },
};
