"use client";
import React from 'react';
import { ChevronLeft, Printer } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  const lastUpdated = "1 May 2026";
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
              Privacy Policy
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-zinc-500 font-mono uppercase tracking-wider">
              <span>Quadkubes Technology Studio Private Limited</span>
              <span className="hidden sm:inline">•</span>
              <span>Sakshya Platform</span>
            </div>
            <div className="pt-4 flex flex-wrap gap-x-6 gap-y-2 text-[12px] font-bold text-zinc-400">
              <div className="flex gap-2">EFFECTIVE DATE: <span className="text-zinc-900 dark:text-zinc-100">{lastUpdated}</span></div>
              <div className="flex gap-2">VERSION: <span className="text-zinc-900 dark:text-zinc-100">{version}</span></div>
              <div className="flex gap-2">STATUS: <span className="text-emerald-600 dark:text-emerald-500">OFFICIAL</span></div>
            </div>
          </div>
        </div>

        {/* Document Content */}
        <div className="p-8 sm:p-12 space-y-12 text-zinc-800 dark:text-zinc-300 leading-[1.6] text-[15px] font-serif_disable">
          
          <div className="bg-zinc-50 dark:bg-zinc-800/50 border-l-4 border-zinc-900 dark:border-zinc-100 p-6 space-y-3 italic">
            <p className="font-bold not-italic text-black dark:text-white text-sm uppercase tracking-widest">Important Summary:</p>
            <p>
              Sakshya is built on a zero-knowledge architecture. Documents you mark as sensitive are analysed entirely on your device and never uploaded to our servers. For documents processed on our servers, raw content is handled in ephemeral sandboxes that are destroyed immediately after processing. We do not sell, rent, or share your personal data with any third party for commercial purposes. All data is stored on servers in India on MeitY-empanelled cloud infrastructure.
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              1. About This Policy
            </h2>
            <div className="space-y-4 text-justify">
              <p>
                1.1 This Privacy Policy ("Policy") governs the collection, use, storage, processing, and disclosure of personal data by Quadkubes Technology Studio Private Limited, a company incorporated under the Companies Act, 2013 (CIN: U74999CT2022PTC013202), having its registered office at Plot No. 143, H.No. 143, Raheja Green Pirda, Pirda-2, Raipur, Chattisgarh, India - 492012 ("Sakshya", "we", "our", or "us"), in connection with the Sakshya platform, website (sakshya.io), mobile application, and all related services (collectively, the "Platform").
              </p>
              <p>
                1.2 This Policy is issued in accordance with the Digital Personal Data Protection Act, 2023 ("DPDPA"), the DPDP Rules 2025, the Information Technology Act, 2000, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and all other applicable Indian laws.
              </p>
              <p>
                1.3 By accessing or using the Platform, you ("Data Principal", "User", or "you") consent to the collection and use of your personal data as described in this Policy. If you do not agree to this Policy, please discontinue use of the Platform immediately.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              2. Definitions
            </h2>
            <div className="space-y-4">
              <p>For the purposes of this Policy, the following terms shall have the meanings set out below:</p>
              <div className="space-y-3 pl-4">
                <p><strong>(a) "Personal Data"</strong> means any data about an individual who is identifiable by or in relation to such data, as defined under Section 2(t) of the DPDPA.</p>
                <p><strong>(b) "Sensitive Personal Data"</strong> includes financial data, health and medical data, biometric data, Aadhaar number, PAN, passwords, sexual orientation, and any other data specified under applicable law.</p>
                <p><strong>(c) "Data Fiduciary"</strong> means Sakshya (Quadkubes Technology Studio Private Limited) which determines the purpose and means of processing of personal data.</p>
                <p><strong>(d) "Data Principal"</strong> means the individual to whom personal data relates — the User of the Platform.</p>
                <p><strong>(e) "Data Processor"</strong> means any entity that processes personal data on behalf of a Data Fiduciary.</p>
                <p><strong>(f) "Processing"</strong> means any operation or set of operations performed on personal data, including collection, storage, use, sharing, transfer, or deletion.</p>
                <p><strong>(g) "Privacy Mode"</strong> means the on-device processing feature of Sakshya where sensitive documents are analysed locally without any upload to Sakshya servers.</p>
                <p><strong>(h) "Ephemeral Sandbox"</strong> means a temporary, isolated computing environment provisioned for server-side document processing that is permanently destroyed upon completion of the processing task.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              3. Data We Collect
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="font-bold text-black dark:text-white text-sm">3.1 Data You Provide Directly</p>
                <ul className="list-disc pl-8 space-y-1">
                  <li>Account Registration: Name, email address, mobile number, and password.</li>
                  <li>Profile Information: Organisation name, designation, and address.</li>
                  <li>Documents: Files uploaded for analysis (Privacy Mode documents remain local).</li>
                  <li>Communications: Support requests and feedback.</li>
                  <li>Payment Information: Billing details processed by payment partners.</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-black dark:text-white text-sm">3.2 Data Collected Automatically</p>
                <ul className="list-disc pl-8 space-y-1">
                  <li>Device and Technical Data: Device type, OS, browser version, IP address.</li>
                  <li>Usage Data: Feature interaction, search queries, and click patterns.</li>
                  <li>Log Data: Server logs, error logs, and API call logs.</li>
                  <li>Cookies: Essential session tokens. No third-party marketing trackers.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              4. Legal Basis for Processing
            </h2>
            <div className="space-y-4">
              <p>
                4.1 <strong>Consent (Section 6, DPDPA):</strong> We process personal data with your free, specific, informed, unconditional, and unambiguous consent. Withdrawal of consent can be initiated at privacy@sakshya.io.
              </p>
              <p>
                4.2 <strong>Legitimate Uses (Section 7, DPDPA):</strong> We may process certain personal data without consent for legal obligations, medical emergencies, or state functions under Indian law.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              5. Zero-Knowledge Architecture
            </h2>
            <div className="space-y-4 text-justify">
              <p>
                5.1 <strong>Privacy Mode:</strong> Documents designated as sensitive are processed entirely on the User's device. No raw document data is transmitted to or stored on Sakshya servers.
              </p>
              <p>
                5.2 <strong>Ephemeral Sandboxes:</strong> Server-side processing occurs in isolated containers destroyed immediately upon completion. Raw content exists only in volatile memory.
              </p>
              <p>
                5.3 <strong>Encryption:</strong> All data at rest is encrypted using AES-256-GCM. Document encryption occurs client-side using Web Crypto API prior to transmission.
              </p>
              <p>
                5.4 <strong>Data Residency:</strong> All personal data and documents are stored and processed exclusively on servers located within India on MeitY-empanelled cloud infrastructure.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              6. Your Rights Under DPDPA
            </h2>
            <div className="space-y-4">
              <p>In accordance with the DPDPA, Data Principals possess the following rights:</p>
              <ul className="list-decimal pl-8 space-y-2">
                <li><strong>Right to Access:</strong> Summary of personal data and processing activities.</li>
                <li><strong>Right to Correction & Erasure:</strong> Updating inaccurate data or requesting deletion.</li>
                <li><strong>Right to Grievance Redressal:</strong> Recourse through the Grievance Officer and Data Protection Board.</li>
                <li><strong>Right to Nominate:</strong> Appointment of a representative for data rights.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              7. Data Retention Schedule
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-zinc-200 dark:border-zinc-800 text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800">
                    <th className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 font-bold">Data Category</th>
                    <th className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 font-bold">Retention Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  <tr>
                    <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">Account Credentials</td>
                    <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">Duration of account + 3 years</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">Extracted Metadata</td>
                    <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">Duration of account + 1 year</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">Audit & Share Logs</td>
                    <td className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">7 years (Statutory requirement)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              8. Grievance Redressal
            </h2>
            <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-4">
              <p className="text-sm font-bold uppercase tracking-tight">Grievance Officer Contact Details:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="font-bold">Ankit Nirala</p>
                  <p>Co-founder and CEO</p>
                  <p className="mt-2 text-zinc-500">privacy@sakshya.io</p>
                </div>
                <div className="text-zinc-500 italic">
                  Quadkubes Technology Studio Private Limited,<br />
                  Plot No. 143, Raheja Green Pirda,<br />
                  Raipur, Chhattisgarh - 492012
                </div>
              </div>
              <p className="text-xs text-zinc-400 mt-4">
                Complaints will be addressed within 30 days. Escalation is available to the Data Protection Board of India.
              </p>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-8 sm:p-12 border-t border-zinc-100 dark:border-zinc-800 text-center text-[10px] text-zinc-400 font-mono uppercase tracking-[0.2em]">
          End of Privacy Policy • Quadkubes Technology Studio Private Limited
        </div>

      </div>

      <div className="max-w-4xl mx-auto mt-8 flex justify-center gap-6 text-[10px] font-bold text-zinc-400 uppercase tracking-widest print:hidden">
        <Link href="/legal/terms-of-service" className="hover:text-black dark:hover:text-white transition-colors">Terms of Service</Link>
        <Link href="/legal/data-processing-agreement" className="hover:text-black dark:hover:text-white transition-colors">Data Processing Agreement</Link>
      </div>
    </div>
  );
}