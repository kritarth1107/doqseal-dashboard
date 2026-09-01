"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { OrganisationProfileForm } from "@/components/manage/OrganisationProfileForm";
import { Users, Key, Shield, Plus } from "lucide-react";

export default function OrganisationPage() {
  const cards = [
    {
      title: "Members & roles",
      description: "Invite freelancers and developers. Control who can sign, upload, or use API keys.",
      href: "/manage/members",
      icon: Users,
    },
    {
      title: "API & integrations",
      description: "Issue scoped API keys for contractors building against your document stack.",
      href: "/manage/api-keys",
      icon: Key,
    },
    {
      title: "Compliance",
      description: "DPDP posture, audit evidence, and data processing agreements.",
      href: "/analytics/compliance",
      icon: Shield,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Organisation"
          description="Your B2B workspace for document intelligence, e-sign, and developer access."
          actions={
            <Link
              href="/manage/create-organisation"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New organisation
            </Link>
          }
        />

        <OrganisationProfileForm />

        <div className="grid gap-4 sm:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-[#2563eb]/40 hover:shadow-md transition-all group"
            >
              <card.icon className="w-5 h-5 text-[#2563eb] mb-3" />
              <h3 className="font-semibold text-gray-900 group-hover:text-[#2563eb]">{card.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{card.description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-sm text-amber-900">
          <strong>Owner tip:</strong> Create separate API keys per freelancer with rate limits. Revoke access instantly when a contract ends—without affecting your production keys.
        </div>
      </div>
    </div>
  );
}
