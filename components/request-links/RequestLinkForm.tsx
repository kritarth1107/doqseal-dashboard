"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export type RequirementDraft = {
  requirementId?: string;
  label: string;
  description: string;
  allowedExtensions: string;
  required: boolean;
};

export type SettingsDraft = {
  collectName: boolean;
  requireEmail: boolean;
  requireMobile: boolean;
  verifyEmail: boolean;
  verifyMobile: boolean;
};

export type RequestLinkFormValues = {
  title: string;
  description: string;
  requirements: RequirementDraft[];
  settings: SettingsDraft;
  projectId: string;
  expiresAt: string;
  status?: string;
};

type Props = {
  initial: RequestLinkFormValues;
  projects: { projectId: string; name: string }[];
  submitLabel: string;
  onSubmit: (values: RequestLinkFormValues) => Promise<void>;
};

export function RequestLinkForm({
  initial,
  projects,
  submitLabel,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<RequestLinkFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateReq = (index: number, patch: Partial<RequirementDraft>) => {
    setValues((prev) => ({
      ...prev,
      requirements: prev.requirements.map((r, i) =>
        i === index ? { ...r, ...patch } : r
      ),
    }));
  };

  const addReq = () => {
    setValues((prev) => ({
      ...prev,
      requirements: [
        ...prev.requirements,
        {
          label: "",
          description: "",
          allowedExtensions: "pdf,jpg,png",
          required: true,
        },
      ],
    }));
  };

  const removeReq = (index: number) => {
    setValues((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Basics</h2>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-600">Title</span>
          <input
            required
            value={values.title}
            onChange={(e) => setValues({ ...values, title: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            placeholder="Vendor onboarding pack"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-600">Description</span>
          <textarea
            value={values.description}
            onChange={(e) =>
              setValues({ ...values, description: e.target.value })
            }
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            placeholder="Shown to the person uploading"
          />
        </label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600">
              Attach to project (optional)
            </span>
            <select
              value={values.projectId}
              onChange={(e) =>
                setValues({ ...values, projectId: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value="">Document Drive only</option>
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600">
              Expires at (optional)
            </span>
            <input
              type="datetime-local"
              value={values.expiresAt}
              onChange={(e) =>
                setValues({ ...values, expiresAt: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </label>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Document requirements
          </h2>
          <button
            type="button"
            onClick={addReq}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563eb]"
          >
            <Plus className="w-3.5 h-3.5" /> Add slot
          </button>
        </div>
        {values.requirements.map((req, index) => (
          <div
            key={index}
            className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/50"
          >
            <div className="flex gap-2">
              <input
                required
                value={req.label}
                onChange={(e) => updateReq(index, { label: e.target.value })}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                placeholder="Document title (e.g. Passport)"
              />
              {values.requirements.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeReq(index)}
                  className="p-2 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <input
              value={req.description}
              onChange={(e) =>
                updateReq(index, { description: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              placeholder="Optional help text"
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs text-slate-500">
                  Allowed extensions (comma-separated)
                </span>
                <input
                  value={req.allowedExtensions}
                  onChange={(e) =>
                    updateReq(index, { allowedExtensions: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  placeholder="pdf,jpg,png"
                />
              </label>
              <label className="flex items-center gap-2 mt-5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={req.required}
                  onChange={(e) =>
                    updateReq(index, { required: e.target.checked })
                  }
                />
                Required
              </label>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Identity & verification
        </h2>
        {(
          [
            ["collectName", "Collect name"],
            ["requireEmail", "Require email"],
            ["requireMobile", "Require mobile"],
            ["verifyEmail", "Verify email with OTP"],
            ["verifyMobile", "Verify mobile with OTP"],
          ] as const
        ).map(([key, label]) => (
          <label
            key={key}
            className="flex items-center gap-2 text-sm text-slate-700"
          >
            <input
              type="checkbox"
              checked={values.settings[key]}
              onChange={(e) =>
                setValues({
                  ...values,
                  settings: {
                    ...values.settings,
                    [key]: e.target.checked,
                  },
                })
              }
            />
            {label}
          </label>
        ))}
        <p className="text-xs text-slate-500">
          Mobile OTP sends only when MSG91 SMS is configured on the backend.
        </p>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2.5 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] disabled:opacity-60"
      >
        {saving ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

export function toApiPayload(values: RequestLinkFormValues) {
  return {
    title: values.title.trim(),
    description: values.description.trim() || undefined,
    requirements: values.requirements.map((r) => ({
      requirementId: r.requirementId,
      label: r.label.trim(),
      description: r.description.trim() || undefined,
      allowedExtensions: r.allowedExtensions
        .split(",")
        .map((e) => e.trim().replace(/^\./, ""))
        .filter(Boolean),
      required: r.required,
    })),
    settings: values.settings,
    projectId: values.projectId || null,
    expiresAt: values.expiresAt
      ? new Date(values.expiresAt).toISOString()
      : null,
  };
}

export const emptyFormValues = (): RequestLinkFormValues => ({
  title: "",
  description: "",
  requirements: [
    {
      label: "",
      description: "",
      allowedExtensions: "pdf,jpg,png",
      required: true,
    },
  ],
  settings: {
    collectName: true,
    requireEmail: true,
    requireMobile: false,
    verifyEmail: false,
    verifyMobile: false,
  },
  projectId: "",
  expiresAt: "",
});
