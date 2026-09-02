"use client";

import { OrganisationProfileForm } from "@/components/manage/OrganisationProfileForm";

export default function OrganisationEditPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#0b1220] p-4 sm:p-8 pt-16 sm:pt-20">
      <OrganisationProfileForm />
    </div>
  );
}
