"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const { refreshUser, loading: authLoading } = useAuth();
  const token = params.token as string;

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (authLoading || !token) return;

    async function acceptInvite() {
      try {
        const res = await fetch(`/api/invites/${token}/accept`, { method: "POST" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to accept invite");
        }

        setStatus("success");
        setMessage("You have joined the organisation successfully.");
        toast.success("Invite accepted");
        await refreshUser();
        setTimeout(() => router.push("/dashboard"), 2000);
      } catch (error: unknown) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Failed to accept invite");
      }
    }

    acceptInvite();
  }, [authLoading, token, refreshUser, router]);

  return (
    <div className="flex-1 flex items-center justify-center bg-[#f8fafc] p-4 pt-20">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-[#2563eb] mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Accepting invite…</h1>
            <p className="text-sm text-gray-500">Please wait while we add you to the organisation.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Welcome aboard!</h1>
            <p className="text-sm text-gray-500">{message}</p>
            <p className="text-xs text-gray-400 mt-3">Redirecting to dashboard…</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Could not accept invite</h1>
            <p className="text-sm text-gray-500">{message}</p>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8]"
            >
              <Users className="w-4 h-4" />
              Go to dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
