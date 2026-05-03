"use client";
import React from 'react';
import { ChevronLeft, Printer } from 'lucide-react';
import Link from 'next/link';

export default function DataProcessingAgreementPage() {
  const lastUpdated = "Template — Insert Effective Date on Signing";
  const version = "1.0";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-12 pt-24 custom-scrollbar print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-xl overflow-hidden print:border-none print:shadow-none print:rounded-none">
        
        {/* Document Header */}
        <div className="p-8 sm:p-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex justify-between items-start mb-8 print:hidden">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              RETURN TO DASHBOARD
            </Link>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-black dark:hover:text-white transition-colors border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg"
            >
              <Printer className="w-3.5 h-3.5" />
              PRINT DOCUMENT
            </button>
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight uppercase">
              Data Processing Agreement
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-zinc-500 font-mono uppercase tracking-wider">
              <span>Between [Client Organisation] and Sakshya</span>
            </div>
            <div className="pt-4 flex flex-wrap gap-x-6 gap-y-2 text-[12px] font-bold text-zinc-400">
              <div className="flex gap-2">DATE: <span className="text-zinc-900 dark:text-zinc-100 italic">{lastUpdated}</span></div>
              <div className="flex gap-2">VERSION: <span className="text-zinc-900 dark:text-zinc-100">{version}</span></div>
              <div className="flex gap-2">STATUS: <span className="text-emerald-600 dark:text-emerald-500">OFFICIAL TEMPLATE</span></div>
            </div>
          </div>
        </div>

        {/* Document Content */}
        <div className="p-8 sm:p-12 space-y-12 text-zinc-800 dark:text-zinc-300 leading-[1.6] text-[14px]">
          
          <div className="bg-zinc-50 dark:bg-zinc-800/50 border-l-4 border-zinc-900 dark:border-zinc-100 p-6 space-y-3 italic">
            <p className="font-bold not-italic text-black dark:text-white text-sm uppercase tracking-widest">Purpose:</p>
            <p>
              This Data Processing Agreement ("DPA") governs the processing of personal data by Sakshya as a Data Processor on behalf of enterprise clients acting as Data Fiduciaries under the Digital Personal Data Protection Act, 2023. This DPA is mandatory for all B2B and enterprise clients of Sakshya. It supplements and is incorporated into the applicable Master Service Agreement or Pilot Agreement between the parties.
            </p>
          </div>

          <section className="space-y-6">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              1. Parties
            </h2>
            
            <div className="space-y-6">
              <div>
                <p className="font-bold text-xs uppercase text-zinc-500 mb-3">Data Fiduciary (Client)</p>
                <div className="overflow-x-auto">
                  <table className="w-full border border-zinc-200 dark:border-zinc-800 border-collapse">
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      <tr>
                        <td className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 font-bold w-1/3 border border-zinc-200 dark:border-zinc-800">Full Legal Name</td>
                        <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">[Full Legal Name of Client Organisation]</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 font-bold border border-zinc-200 dark:border-zinc-800">Entity Type</td>
                        <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">[Type of Entity]</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 font-bold border border-zinc-200 dark:border-zinc-800">Registration Number / CIN</td>
                        <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">[CIN / Registration Number]</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 font-bold border border-zinc-200 dark:border-zinc-800">Registered Address</td>
                        <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">[Registered Address]</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="font-bold text-xs uppercase text-zinc-500 mb-3">Data Processor (Sakshya)</p>
                <div className="overflow-x-auto">
                  <table className="w-full border border-zinc-200 dark:border-zinc-800 border-collapse">
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      <tr>
                        <td className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 font-bold w-1/3 border border-zinc-200 dark:border-zinc-800">Full Legal Name</td>
                        <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">Quadkubes Technology Studio Private Limited</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 font-bold border border-zinc-200 dark:border-zinc-800">CIN</td>
                        <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">U74999CT2022PTC013202</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 font-bold border border-zinc-200 dark:border-zinc-800">Registered Address</td>
                        <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">Raipur, Chhattisgarh - 492012</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              2. Recitals
            </h2>
            <div className="space-y-4 text-justify">
              <p>WHEREAS, the Client is a Data Fiduciary as defined under the Digital Personal Data Protection Act, 2023 ("DPDPA"), which determines the purposes and means of processing certain personal data;</p>
              <p>WHEREAS, the Client wishes to engage Sakshya to process certain personal data on its behalf as a Data Processor in connection with the provision of document intelligence, AI extraction, and related services;</p>
              <p>WHEREAS, the Parties wish to set out their respective obligations with respect to the protection of personal data in accordance with the DPDPA, the DPDP Rules 2025, and all applicable law;</p>
            </div>
          </section>

          <section className="space-y-6 text-justify">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              3. Definitions
            </h2>
            <div className="space-y-4 pl-4">
              <p><strong>3.1 "Personal Data"</strong> means any data relating to an identifiable individual as defined under Section 2(t) of the DPDPA that is processed by Sakshya under this DPA on behalf of the Client.</p>
              <p><strong>3.2 "Data Breach"</strong> means any unauthorised access to, acquisition of, disclosure of, use of, loss of, alteration of, or destruction of Personal Data.</p>
              <p><strong>3.3 "Ephemeral Sandbox"</strong> means a temporary, isolated computing environment provisioned for server-side document processing that is permanently destroyed upon completion of the processing task.</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              4. Nature, Purpose, and Scope of Processing
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border border-zinc-200 dark:border-zinc-800 border-collapse text-sm">
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  <tr>
                    <td className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 font-bold w-1/4 border border-zinc-200 dark:border-zinc-800">Subject Matter</td>
                    <td className="px-4 py-3 border border-zinc-200 dark:border-zinc-800">Processing of personal data contained in documents submitted through the Sakshya Platform for AI extraction and audit logging.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 font-bold border border-zinc-200 dark:border-zinc-800">Nature of Processing</td>
                    <td className="px-4 py-3 border border-zinc-200 dark:border-zinc-800">Automated processing including OCR, AI extraction, and ERP cross-verification performed in ephemeral sandboxes.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 font-bold border border-zinc-200 dark:border-zinc-800">Data Subjects</td>
                    <td className="px-4 py-3 border border-zinc-200 dark:border-zinc-800">Patients, employees, customers, and other third parties whose data is in submitted documents.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4 text-justify">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              5. Obligations of Sakshya as Data Processor
            </h2>
            <div className="space-y-4">
              <p>5.1 <strong>Processing on Instruction:</strong> Sakshya shall process Personal Data only on documented instructions from the Client, except where required by law.</p>
              <p>5.2 <strong>Security Measures:</strong> Sakshya shall maintain AES-256-GCM encryption for all Personal Data at rest and TLS 1.3 in transit. All processing occurs in ephemeral sandboxes located exclusively in India on MeitY-empanelled infrastructure.</p>
              <p>5.3 <strong>Data Breach:</strong> Sakshya shall notify the Client within 48 hours of becoming aware of any Data Breach involving Personal Data processed under this DPA.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              7. Data Localisation
            </h2>
            <div className="space-y-4 text-justify">
              <p>
                All Personal Data processed under this DPA shall be stored and processed exclusively on servers located in India. Sakshya warrants that no Personal Data shall be transferred outside India without the Client's prior written consent and compliance with Section 16 of the DPDPA.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              Execution
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border border-zinc-200 dark:border-zinc-800 border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800">
                    <th className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-left">For and on behalf of CLIENT</th>
                    <th className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-left">For Quadkubes Technology Studio Pvt Ltd</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
                  <tr>
                    <td className="px-4 py-8 border border-zinc-200 dark:border-zinc-800">Signature: ___________________________</td>
                    <td className="px-4 py-8 border border-zinc-200 dark:border-zinc-800">Signature: ___________________________</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">Name: ___________________________</td>
                    <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">Name: Ankit Nirala</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">Designation: ___________________________</td>
                    <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">Designation: Co-founder and CEO</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              Schedule A: Categories of Personal Data
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border border-zinc-200 dark:border-zinc-800 border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800">
                    <th className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-left">Category of Data</th>
                    <th className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-left">Data Elements</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  <tr>
                    <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 font-bold">Patient Identification</td>
                    <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">Name, DOB, address, Aadhaar, PAN, etc.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 font-bold">Medical Information</td>
                    <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">Test names, prescriptions, diagnosis codes, physician names.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 font-bold">Financial Data</td>
                    <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">Invoice amounts, billing references, payment terms.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <div className="text-[11px] italic text-zinc-500 text-center pt-8 border-t border-zinc-100 dark:border-zinc-800">
            *This is a template document. Both parties must review, complete all fields, and sign before processing commences.
          </div>

        </div>

        {/* Footer */}
        <div className="p-8 sm:p-12 border-t border-zinc-100 dark:border-zinc-800 text-center text-[10px] text-zinc-400 font-mono uppercase tracking-[0.2em]">
          End of Data Processing Agreement • Quadkubes Technology Studio Private Limited
        </div>

      </div>

      <div className="max-w-4xl mx-auto mt-8 flex justify-center gap-6 text-[10px] font-bold text-zinc-400 uppercase tracking-widest print:hidden">
        <Link href="/legal/privacy-policy" className="hover:text-black dark:hover:text-white transition-colors">Privacy Policy</Link>
        <Link href="/legal/terms-of-service" className="hover:text-black dark:hover:text-white transition-colors">Terms of Service</Link>
      </div>
    </div>
  );
}