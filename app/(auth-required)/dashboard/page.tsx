"use client";
import React from 'react';
import { 
  FileText, 
  Search, 
  ShieldCheck, 
  Cpu, 
  Clock, 
  ArrowUpRight, 
  MoreVertical, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  Activity,
  ArrowDownRight
} from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const stats = [
    { label: "Total Documents", value: "12,482", icon: FileText, trend: "+12%", trendUp: true, color: "blue" },
    { label: "AI Extractions", value: "8,291", icon: Cpu, trend: "+24%", trendUp: true, color: "lime" },
    { label: "DPDP Compliance", value: "98.2%", icon: ShieldCheck, trend: "+0.5%", trendUp: true, color: "green" },
    { label: "Time Saved", value: "420h", icon: Clock, trend: "+18%", trendUp: true, color: "purple" },
  ];

  const recentDocuments = [
    { id: 1, name: "Vendor_Agreement_Q1.pdf", type: "Contract", status: "Processed", confidence: "99.2%", date: "2 mins ago" },
    { id: 2, name: "Employee_Onboarding_Form.pdf", type: "HR", status: "Review", confidence: "82.5%", date: "15 mins ago" },
    { id: 3, name: "Tax_Invoice_April_2024.pdf", type: "Finance", status: "Processed", confidence: "98.8%", date: "1 hour ago" },
    { id: 4, name: "Compliance_Audit_Report.pdf", type: "Legal", status: "Flagged", confidence: "74.1%", date: "3 hours ago" },
  ];

  const trends = [
    { day: "Mon", count: 45 },
    { day: "Tue", count: 52 },
    { day: "Wed", count: 38 },
    { day: "Thu", count: 65 },
    { day: "Fri", count: 48 },
    { day: "Sat", count: 24 },
    { day: "Sun", count: 18 },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#f9f9f9] p-4 sm:p-8 pt-20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Good morning, Kritarth</h1>
            <p className="text-sm text-gray-500">Here's what's happening with your document intelligence today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Export Report
            </button>
            <Link href="/new" className="px-4 py-2 text-sm font-medium text-black bg-[#2563eb] rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm">
              <Zap className="w-4 h-4" />
              New Extraction
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2 rounded-xl ${
                  stat.color === 'lime' ? 'bg-[#2563eb]/20 text-[#2563eb]' :
                  stat.color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                  stat.color === 'green' ? 'bg-emerald-500/10 text-emerald-500' :
                  'bg-purple-500/10 text-purple-500'
                }`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  stat.trendUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.trend}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[13px] font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Charts Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Extraction Performance</h3>
                <p className="text-xs text-gray-500">Documents processed per day this week</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg text-xs font-medium text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-[#2563eb]"></span>
                  AI Processed
                </div>
              </div>
            </div>
            <div className="p-6 flex-1 flex items-end justify-between gap-2 h-64 mt-4">
              {trends.map((t, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                  <div 
                    className="w-full bg-[#2563eb]/20 rounded-t-lg relative overflow-hidden group-hover:bg-[#2563eb]/30 transition-all cursor-pointer"
                    style={{ height: `${(t.count / 70) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10"></div>
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none">
                      {t.count}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{t.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Card */}
          <div className="bg-[#1a1a1a] text-white rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group shadow-xl">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                  <ShieldCheck className="w-6 h-6 text-[#2563eb]" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">DPDP Compliance</div>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold tracking-tight">Active Engine</h3>
                <p className="text-sm text-gray-400 max-w-[200px]">Enterprise-grade extraction running for India Compliance.</p>
              </div>
            </div>
            
            <div className="mt-8 space-y-4 relative z-10">
              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                <div className="bg-[#2563eb] h-full w-[98%]" />
              </div>
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-gray-400">System Health</span>
                <span className="text-[#2563eb]">Optimized</span>
              </div>
            </div>

            {/* Decorative background element */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#2563eb]/10 rounded-full blur-3xl group-hover:bg-[#2563eb]/20 transition-all duration-500"></div>
          </div>
        </div>

        {/* Recent Documents Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Recent Extractions</h3>
            <Link href="/documents" className="text-xs font-medium text-gray-500 hover:text-[#2563eb] transition-colors">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Document Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Confidence</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentDocuments.map((doc) => (
                  <tr key={doc.id} className="group hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-black">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-gray-500 px-2 py-1 bg-gray-100 rounded-md">{doc.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {doc.status === 'Processed' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : doc.status === 'Review' ? (
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                        )}
                        <span className={`text-xs font-medium ${
                          doc.status === 'Processed' ? 'text-emerald-600' : 
                          doc.status === 'Review' ? 'text-amber-600' : 'text-red-600'
                        }`}>{doc.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 w-24">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-gray-400">{doc.confidence}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1">
                          <div 
                            className={`h-full rounded-full ${
                              parseFloat(doc.confidence) > 90 ? 'bg-emerald-500' : 
                              parseFloat(doc.confidence) > 80 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: doc.confidence }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500">{doc.date}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 text-gray-400 hover:text-black transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}