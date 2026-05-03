"use client";
import React from 'react';
import { ChevronLeft, Printer } from 'lucide-react';
import Link from 'next/link';

export default function TermsOfServicePage() {
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
              Terms of Service
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
            <p className="font-bold not-italic text-black dark:text-white text-sm uppercase tracking-widest">Notice to User:</p>
            <p>
              Please read these Terms of Service carefully. They constitute a legally binding agreement between you and Quadkubes Technology Studio Private Limited. By accessing or using the Sakshya Platform, you agree to be bound by these Terms. If you do not agree, do not use the Platform.
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              1. Parties and Agreement
            </h2>
            <div className="space-y-4 text-justify">
              <p>
                1.1 These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and Quadkubes Technology Studio Private Limited ("Company", "we", "our", or "us"), a company incorporated under the Companies Act, 2013 (CIN: U74999CT2022PTC013202), with registered office at Plot No. 143, Raheja Green Pirda, Pirda-2, Raipur, Chattisgarh, India - 492012.
              </p>
              <p>
                1.2 By creating an account, accessing, or using the Sakshya website (sakshya.io), mobile application, APIs, or any related services (collectively, the "Platform"), you agree to be bound by these Terms and our Privacy Policy.
              </p>
              <p>
                1.3 If you are using the Platform on behalf of an organisation, you represent and warrant that you have authority to bind that organisation to these Terms.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              2. Eligibility
            </h2>
            <div className="space-y-4">
              <p>2.1 To use the Platform, you must meet the following criteria:</p>
              <ul className="list-disc pl-8 space-y-1">
                <li>Be at least 18 years of age.</li>
                <li>Have the legal capacity to enter into a binding contract under Indian law.</li>
                <li>Not be barred from using the Platform under any applicable law.</li>
                <li>Organisations must be duly incorporated or registered.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              3. Account Registration and Security
            </h2>
            <div className="space-y-4">
              <p>
                3.1 <strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your credentials. Notify us immediately at security@sakshya.io upon becoming aware of any unauthorised use.
              </p>
              <p>
                3.2 <strong>Single Account:</strong> Each individual or organisation may maintain only one active account. Circumventing restrictions via multiple accounts is prohibited.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              4. Platform Services and Disclaimers
            </h2>
            <div className="space-y-4">
              <p>
                4.1 <strong>AI Accuracy:</strong> AI-extracted data may contain errors. Sakshya AI extraction is designed to assist, not to replace human verification for critical decisions. You are solely responsible for verifying the accuracy of extracted data.
              </p>
              <p>
                4.2 <strong>Privacy Mode:</strong> On-device analysis is provided for sensitive documents. Such documents never leave your device and are not accessible by Sakshya.
              </p>
              <p>
                4.3 <strong>Availability:</strong> We target 99.5% uptime. Scheduled maintenance will be communicated with at least 24 hours' notice.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              5. User Obligations
            </h2>
            <div className="space-y-4 text-justify">
              <p>
                5.1 You agree to use the Platform only for lawful purposes. You represent that you have all necessary rights and consents to upload content to the Platform.
              </p>
              <p>
                5.2 <strong>Prohibited Activities:</strong> You must not upload illegal content, reverse engineer the platform, use automated bots without authorisation, or attempt to gain unauthorised access to other users' data.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              6. Fees and Payments
            </h2>
            <div className="space-y-4">
              <p>6.1 Pricing is as described on sakshya.io/pricing. Fees are quoted in INR.</p>
              <p>6.2 <strong>Refunds:</strong> Monthly fees are non-refundable. Annual plan fees are refundable on a pro-rata basis if cancelled within 30 days of payment.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              10. Limitation of Liability
            </h2>
            <div className="bg-zinc-900 text-zinc-400 p-6 rounded-lg font-mono text-[11px] leading-relaxed uppercase tracking-tight">
              <p className="text-white font-bold mb-2 tracking-wide text-xs">DISCLAIMER OF WARRANTIES:</p>
              "THE PLATFORM IS PROVIDED 'AS IS' WITHOUT WARRANTY OF ANY KIND. SAKSHYA'S TOTAL LIABILITY SHALL NOT EXCEED THE GREATER OF FEES PAID IN THE PRECEDING 3 MONTHS OR INR 10,000. IN NO EVENT SHALL WE BE LIABLE FOR CONSEQUENTIAL LOSS."
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-bold text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 uppercase tracking-wide">
              12. Dispute Resolution
            </h2>
            <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-4">
              <p className="text-sm font-bold uppercase tracking-tight">Legal Matters:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">Arbitration</p>
                  <p className="text-zinc-500">Seat: Raipur, Chhattisgarh</p>
                  <p className="mt-2 text-zinc-500">legal@sakshya.io</p>
                </div>
                <div className="text-zinc-500 italic">
                  Governed by the laws of India. Subject to the arbitration clause, the courts at Raipur shall have exclusive jurisdiction.
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-8 sm:p-12 border-t border-zinc-100 dark:border-zinc-800 text-center text-[10px] text-zinc-400 font-mono uppercase tracking-[0.2em]">
          End of Terms of Service • Quadkubes Technology Studio Private Limited
        </div>

      </div>

      <div className="max-w-4xl mx-auto mt-8 flex justify-center gap-6 text-[10px] font-bold text-zinc-400 uppercase tracking-widest print:hidden">
        <Link href="/legal/privacy-policy" className="hover:text-black dark:hover:text-white transition-colors">Privacy Policy</Link>
        <Link href="/legal/data-processing-agreement" className="hover:text-black dark:hover:text-white transition-colors">Data Processing Agreement</Link>
      </div>
    </div>
  );
}