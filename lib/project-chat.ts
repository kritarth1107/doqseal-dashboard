import { getProjectDocuments } from "@/lib/document-store";
import { isPrescriptionExtraction } from "@/lib/demo-extraction";
import { isPrescriptionProject, isTrfProject } from "@/lib/project-config";
import { projects } from "@/lib/mock-data";
import { ExtractedDocument, StoredDocument } from "@/types/extraction";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatDocumentRef = {
  id: string;
  patientName: string;
  filename: string;
  status: string;
  href: string;
};

export type ProjectChatResult = {
  reply: string;
  documents?: ChatDocumentRef[];
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function docRef(doc: StoredDocument): ChatDocumentRef {
  const patient = doc.extractedJson?.patient;
  return {
    id: doc.id,
    patientName: patient?.name || "Unknown patient",
    filename: doc.originalFilename,
    status: doc.status,
    href: `/projects/${doc.projectId}/documents/${doc.id}`,
  };
}

function formatTrfReport(data: ExtractedDocument): string {
  return [
    `Here is the extracted **Test Request Form report** for **${data.patient.name}**.`,
    "",
    "**Patient details**",
    `- Age / sex: ${data.patient.age} years, ${data.patient.gender}`,
    `- Contact: ${data.patient.contact}`,
    `- Patient code: ${data.patient.patient_code} · Type: ${data.patient.patient_type}`,
    `- Address: ${data.patient.address}`,
    "",
    "**Referral & clinical**",
    `- Referred by: ${data.referral.referred_by}`,
    `- Clinical history: ${data.referral.clinical_history}`,
    "",
    "**Visit & receipt**",
    `- Receipt: ${data.visit.rec_number}`,
    `- Date: ${data.visit.date} at ${data.visit.time}`,
    `- IPD/OPD: ${data.visit.ipd_opd} · Bill type: ${data.visit.bill_type}`,
    "",
    "**Imaging requested**",
    ...data.tests.requested.map((test) => `- ${test}`),
    "",
    "**Billing**",
    `- Amount: ${data.billing.currency} ${data.billing.net.toLocaleString("en-IN")} (${data.billing.amount_in_words})`,
    `- Paid: ${data.billing.paid} · Balance: ${data.billing.balance.toLocaleString("en-IN")}`,
    "",
    "Centre stamp, medical officer stamp, and superintendent stamp are all **verified** on this TRF.",
  ].join("\n");
}

function formatPrescriptionReport(data: ExtractedDocument): string {
  const rx = data.prescription!;
  const lines = [
    `Here is the **medical prescription** for **${data.patient.name}**.`,
    "",
    "**Consultant**",
    `- ${rx.prescriber} · ${rx.registration_no}`,
    `- Visit: ${data.visit.date} at ${data.visit.time} · ${data.visit.rec_number}`,
    "",
    "**Assessment**",
    rx.diagnosis,
    "",
    "**Clinical notes**",
    data.referral.clinical_history,
  ];

  if (rx.medications.length > 0) {
    lines.push("", "**Medications prescribed**");
    rx.medications.forEach((med, idx) => {
      lines.push(
        `${idx + 1}. **${med.name}** — ${med.dosage} for ${med.duration}. ${med.instructions}.`
      );
    });
  }

  lines.push("", "**Advice**", rx.advice, "", "Prescriber signature is **verified**.");

  return lines.join("\n");
}

function formatMedicationSummary(docs: StoredDocument[]): string {
  const blocks = docs.flatMap((doc) => {
    const data = doc.extractedJson as ExtractedDocument;
    if (!data.prescription) return [];

    if (data.prescription.medications.length > 0) {
      return [
        `**${data.patient.name}** · ${data.prescription.prescriber}`,
        "",
        ...data.prescription.medications.map(
          (med, idx) =>
            `${idx + 1}. **${med.name}** — ${med.dosage} for ${med.duration}. ${med.instructions}.`
        ),
        "",
      ];
    }

    if (data.tests.requested.length > 0) {
      return [
        `**${data.patient.name}** · ${data.prescription.prescriber}`,
        "",
        "This case sheet advises **investigations** (no oral medications listed):",
        ...data.tests.requested.map((test) => `- ${test}`),
        "",
      ];
    }

    return [];
  });

  return [
    "Here is what was extracted for **Afsana Pinjari** from indexed prescriptions:",
    "",
    ...blocks,
    "Ask for the full case sheet report for vitals, complaints, and consultant details.",
  ].join("\n");
}

function formatPatientReport(doc: StoredDocument): string {
  const data = doc.extractedJson;
  if (!data) {
    return `The file **${doc.originalFilename}** is still being processed. Extraction usually completes in about **45 seconds** — ask again shortly.`;
  }

  if (isPrescriptionExtraction(data)) {
    return formatPrescriptionReport(data);
  }

  return formatTrfReport(data);
}

function buildProjectContext(docs: StoredDocument[], projectName: string): string {
  const completed = docs.filter((d) => d.status === "completed" && d.extractedJson);
  const processing = docs.filter((d) => d.status === "processing");

  const patientLines = completed.map((doc) => {
    const p = doc.extractedJson!.patient;
    return `- ${p.name} (${p.age}/${p.gender}) · ${doc.originalFilename}`;
  });

  return [
    `**${projectName}**`,
    `- Uploaded: ${docs.length} · Processing: ${processing.length} · Indexed: ${completed.length}`,
    patientLines.length ? `\n**Patients in index:**\n${patientLines.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function matchesPatientName(query: string, name: string): boolean {
  const q = normalize(query);
  const tokens = normalize(name)
    .split(" ")
    .filter((t) => t.length > 2);
  return tokens.some((token) => q.includes(token)) || q.includes("afsana") || q.includes("pinjari");
}

function isMedicationQuery(q: string): boolean {
  return (
    q.includes("medication") ||
    q.includes("medicine") ||
    q.includes("drug") ||
    q.includes("dosage") ||
    q.includes("dose") ||
    q.includes("tablet") ||
    q.includes("prescribed")
  );
}

function isPrescriptionIntentQuery(q: string): boolean {
  if (q.includes("trf") || q.includes("test request form")) return false;
  return (
    q.includes("medical prescription") ||
    q.includes("prescription") ||
    q.includes("case sheet") ||
    isMedicationQuery(q)
  );
}

function isTrfReportQuery(q: string): boolean {
  if (isPrescriptionIntentQuery(q)) return false;
  return (
    q.includes("report") ||
    q.includes("show me") ||
    q.includes("trf") ||
    q.includes("test request") ||
    q.includes("billing") ||
    q.includes("receipt") ||
    (q.includes("extract") && q.includes("afsana"))
  );
}

function isPrescriptionLookup(q: string): boolean {
  return isPrescriptionIntentQuery(q) && matchesPatientName(q, "Afsana Pinjari");
}

async function getCompletedPrescriptionDocs(): Promise<StoredDocument[]> {
  return (await getProjectDocuments("p-medical-prescription")).filter(
    (d) => d.status === "completed" && d.extractedJson
  );
}

async function getCompletedTrfDocs(): Promise<StoredDocument[]> {
  return (await getProjectDocuments("p-test-request")).filter(
    (d) => d.status === "completed" && d.extractedJson
  );
}

function pickPrescriptionDoc(docs: StoredDocument[], q: string): StoredDocument | undefined {
  return (
    docs.find(
      (doc) =>
        doc.extractedJson?.prescription && matchesPatientName(q, doc.extractedJson.patient.name)
    ) ??
    docs.find((doc) => doc.extractedJson?.prescription) ??
    docs[0]
  );
}

function capabilitiesReply(projectId: string, projectName: string): string {
  if (isPrescriptionProject(projectId)) {
    return [
      `I'm your assistant for the **${projectName}** project.`,
      "",
      "I can help with prescriptions for **Afsana Pinjari**, including:",
      "- Full prescription reports",
      "- Medications, dosages, and duration",
      "- Consultant, diagnosis, and advice",
      "",
      "Try: *Medical Prescription for Afsana Pinjari* or *List medications and dosages*.",
    ].join("\n");
  }

  return [
    `I'm your assistant for the **${projectName}** project.`,
    "",
    "I can help with **Medical Prescription** and **Test Request Form** data for **Afsana Pinjari**.",
    "",
    "Ask from any project context:",
    "- *Medical Prescription for Afsana Pinjari* → medications, consultant, diagnosis",
    "- *Show me the report of Afsana Pinjari* → TRF, imaging, billing",
    "",
    "Uploads live in their respective projects (~45 seconds to extract).",
  ].join("\n");
}

export async function generateProjectChatReply(
  projectId: string,
  messages: ChatMessage[]
): Promise<ProjectChatResult> {
  const project = projects.find((p) => p.id === projectId);
  const projectName = project?.name ?? "Project";
  const docs = await getProjectDocuments(projectId);
  const question = [...messages].reverse().find((m) => m.role === "user")?.content?.trim() ?? "";
  const q = normalize(question);

  if (!question) {
    return { reply: capabilitiesReply(projectId, projectName) };
  }

  if (
    q.includes("what can you") ||
    q.includes("how do you work") ||
    q.includes("help") ||
    q === "hi" ||
    q === "hello"
  ) {
    return { reply: capabilitiesReply(projectId, projectName) };
  }

  const completed = docs.filter((d) => d.status === "completed" && d.extractedJson);
  const sample = completed[0]?.extractedJson;

  // Prescription intent — always from Medical Prescription project (any intelligence context)
  if (isPrescriptionIntentQuery(q) && matchesPatientName(q, "Afsana Pinjari")) {
    const rxDocs = await getCompletedPrescriptionDocs();
    const best = pickPrescriptionDoc(rxDocs, q);

    if (!best) {
      return {
        reply:
          "No prescription extracted yet. Upload one in the **Medical Prescription** project for **Afsana Pinjari** (~45 seconds).",
      };
    }

    if (isMedicationQuery(q) && !q.includes("prescription") && !q.includes("show")) {
      return {
        reply: formatMedicationSummary(rxDocs),
        documents: rxDocs.map(docRef),
      };
    }

    return {
      reply: formatPatientReport(best),
      documents: [docRef(best)],
    };
  }

  // Medication queries without patient name
  if (isMedicationQuery(q)) {
    const rxDocs = await getCompletedPrescriptionDocs();
    if (rxDocs.length === 0) {
      return {
        reply:
          "Upload a prescription in the **Medical Prescription** project first — extraction takes ~45 seconds.",
      };
    }
    return {
      reply: formatMedicationSummary(rxDocs),
      documents: rxDocs.map(docRef),
    };
  }

  // TRF report — from Test Request project (any intelligence context)
  if (isTrfReportQuery(q) && matchesPatientName(q, "Afsana Pinjari")) {
    const trfDocs = await getCompletedTrfDocs();
    const best =
      trfDocs.find((doc) => matchesPatientName(q, doc.extractedJson!.patient.name)) ?? trfDocs[0];

    if (!best) {
      return { reply: "No TRF extracted yet. Upload a test request form in the **Test Request Form** project." };
    }

    return {
      reply: formatPatientReport(best),
      documents: [docRef(best)],
    };
  }

  // Legacy project-scoped handlers below use `completed` / `sample`

  if (
    isPrescriptionProject(projectId) &&
    (q.includes("investigation") ||
      q.includes("lab") ||
      q.includes("test") ||
      q.includes("dengue") ||
      q.includes("lft") ||
      q.includes("crp") ||
      q.includes("cxr"))
  ) {
    if (!sample) {
      return { reply: "No case sheets indexed yet. Upload the OPD prescription for **Afsana Pinjari** first." };
    }

    return {
      reply: [
        "**Investigations advised** on indexed case sheets:",
        "",
        ...completed.flatMap((doc) => {
          const data = doc.extractedJson as ExtractedDocument;
          if (!data.tests.requested.length) return [];
          return [
            `**${data.patient.name}** · ${data.prescription?.prescriber}`,
            ...data.tests.requested.map((test) => `- ${test}`),
            "",
          ];
        }),
      ].join("\n"),
      documents: completed.map(docRef),
    };
  }

  if (
    isPrescriptionProject(projectId) &&
    (q.includes("diagnos") || q.includes("advice") || (q.includes("clinical") && !q.includes("history")))
  ) {
    if (!sample?.prescription) {
      return { reply: "No prescription data indexed yet. Upload a prescription for **Afsana Pinjari** first." };
    }

    return {
      reply: completed
        .map((doc) => {
          const data = doc.extractedJson as ExtractedDocument;
          if (!data.prescription) return "";
          return [
            `**${data.patient.name}**`,
            "",
            `- **Diagnosis:** ${data.prescription.diagnosis}`,
            `- **Clinical history:** ${data.referral.clinical_history}`,
            `- **Prescriber:** ${data.prescription.prescriber} (${data.prescription.registration_no})`,
            `- **Advice:** ${data.prescription.advice}`,
          ].join("\n");
        })
        .filter(Boolean)
        .join("\n\n"),
      documents: completed.map(docRef),
    };
  }

  if (
    q.includes("fasting") ||
    q.includes("test request") ||
    q.includes("list test") ||
    q.includes("what test") ||
    (q.includes("clinical") && q.includes("history"))
  ) {
    if (isPrescriptionProject(projectId)) {
      if (!sample?.prescription) {
        return { reply: "No prescriptions indexed yet." };
      }
      return {
        reply: completed
          .map((doc) => {
            const data = doc.extractedJson as ExtractedDocument;
            return `**${data.patient.name}** — Clinical history: *${data.referral.clinical_history}*. Diagnosis: *${data.prescription?.diagnosis}*.`;
          })
          .join("\n\n"),
        documents: completed.map(docRef),
      };
    }

    if (!sample) {
      return {
        reply: "No extracted TRFs yet. Upload a test request form — I'll index tests after extraction (~45 seconds).",
      };
    }

    return {
      reply: [
        "Here are the **requested tests and clinical history** from indexed TRFs:",
        "",
        ...completed.flatMap((doc) => {
          const data = doc.extractedJson as ExtractedDocument;
          return [
            `**${data.patient.name}**`,
            `- Clinical history: ${data.referral.clinical_history}`,
            `- Tests:`,
            ...data.tests.requested.map((test) => `  - ${test}`),
            "",
          ];
        }),
        "CT abdomen/spine studies in this demo do not require fasting unless contrast is specified.",
      ].join("\n"),
      documents: completed.map(docRef),
    };
  }

  if (q.includes("stamp") || q.includes("signature") || q.includes("verification")) {
    if (isPrescriptionProject(projectId)) {
      return {
        reply: [
          "**Prescription verification** for indexed documents:",
          "",
          "- Prescriber signature: **present**",
          "- Doctor registration captured",
          "- Patient linked: **Afsana Pinjari**",
        ].join("\n"),
        documents: completed.map(docRef),
      };
    }

    return {
      reply: [
        "**Stamp & signature verification** on indexed TRFs:",
        "",
        "- Centre stamp: **present**",
        "- Referring doctor signature: **present**",
        "- Medical superintendent stamp: **present**",
        "- Patient signature on receipt: **present**",
      ].join("\n"),
      documents: completed.map(docRef),
    };
  }

  if (q.includes("bill") || q.includes("amount") || q.includes("receipt") || q.includes("paid")) {
    if (isPrescriptionProject(projectId)) {
      return {
        reply:
          "Prescriptions don't include billing. For **Afsana Pinjari's receipt and amounts**, check the **Test Request Form** project.",
      };
    }

    if (!sample) {
      return { reply: "No billing data indexed yet. Upload a TRF with billing receipt." };
    }

    return {
      reply: [
        "**Billing summary** from indexed TRFs:",
        "",
        ...completed.map((doc) => {
          const data = doc.extractedJson as ExtractedDocument;
          return [
            `**${data.patient.name}** · ${data.visit.rec_number}`,
            `- Gross / Net: ${data.billing.currency} ${data.billing.gross.toLocaleString("en-IN")}`,
            `- Paid: ${data.billing.paid} · Balance: ${data.billing.balance.toLocaleString("en-IN")}`,
            `- ${data.billing.amount_in_words}`,
          ].join("\n");
        }),
      ].join("\n\n"),
      documents: completed.map(docRef),
    };
  }

  if (q.includes("summar") || q.includes("overview") || q.includes("status") || q.includes("project")) {
    return {
      reply: [buildProjectContext(docs, projectName), "", project?.description ?? ""].join("\n\n"),
      documents: completed.map(docRef),
    };
  }

  if (docs.some((d) => d.status === "processing")) {
    return {
      reply: [
        `**${docs.filter((d) => d.status === "processing").length} document(s) still processing** (~45 seconds).`,
        "",
        buildProjectContext(docs, projectName),
        "",
        "Ask again once extraction completes.",
      ].join("\n\n"),
    };
  }

  if (completed.length === 0) {
    return {
      reply: [
        `**${projectName}** has no uploaded extractions yet.`,
        "",
        isPrescriptionProject(projectId)
          ? "Upload a prescription — it will be linked to **Afsana Pinjari** after extraction (~45 seconds)."
          : "Upload a TRF — I'll answer from extracted patient, test, and billing fields once processing finishes.",
      ].join("\n"),
    };
  }

  const fallbackHint = isPrescriptionProject(projectId)
    ? "Try: *Show me the prescription of Afsana Pinjari*, *List medications and dosages*, or *What is the diagnosis?*"
    : "Try: *Show me the report of Afsana Pinjari*, *List requested tests*, or *Billing summary*";

  return {
    reply: [`I couldn't match that to a specific field in **${projectName}**.`, "", fallbackHint].join("\n"),
    documents: completed.map(docRef),
  };
}
