"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { OrganisationOverview } from "@/components/manage/OrganisationOverview";
import { Users, Key, Shield, Plus } from "lucide-react";

export default function OrganisationPage() {
  const cards = [
    {
      title: "Members & roles",
      description:
        "Invite freelancers and developers. Control who can sign, upload, or use API keys.",
      href: "/manage/members",
      icon: Users,
    },
    {
      title: "API & integrations",
      description:
        "Issue scoped API keys for contractors building against your document stack.",
      href: "/manage/api-keys",
      icon: Key,
    },
    {
      title: "Compliance",
      description:
        "DPDP posture, audit evidence, and data processing agreements.",
      href: "/analytics/compliance",
      icon: Shield,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#0b1220] p-4 sm:p-8 pt-16 sm:pt-20">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Organisation"
          description="Your B2B workspace for document intelligence, e-sign, and developer access."
          actions={
            <Link
              href="/manage/create-organisation"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New organisation
            </Link>
          }
        />

        <OrganisationOverview />

        <div className="grid gap-4 sm:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white dark:bg-zinc-950/60 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-[#2563eb]/40 hover:shadow-md transition-all group"
            >
              <card.icon className="w-5 h-5 text-[#2563eb] mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-zinc-50 group-hover:text-[#2563eb]">
                {card.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                {card.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-8 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-sm text-amber-900 dark:text-amber-100/90">
          <strong>Owner tip:</strong> Create separate API keys per freelancer
          with rate limits. Revoke access instantly when a contract ends—without
          affecting your production keys.
        </div>
      </div>
    </div>
  );
}
