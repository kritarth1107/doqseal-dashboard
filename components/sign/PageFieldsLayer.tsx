"use client";

import { memo, useMemo } from "react";
import type { FieldType, PlacedField, SignatureProfile } from "@/components/sign/types";
import { SELF_SIGNER_ID } from "@/lib/sign/constants";
import { DocumentField } from "@/components/sign/DocumentField";
import type { EditorSigner } from "@/components/sign/EnvelopePdfEditor";

type Props = {
  pageIndex: number;
  pageWidth: number;
  pageHeight: number;
  fields: PlacedField[];
  signers: EditorSigner[];
  activeSignerId: string;
  selectedFieldId: string | null;
  placingType: FieldType | null;
  selfSignature: SignatureProfile | null | undefined;
  onPageClick: (e: React.MouseEvent, pageIndex: number) => void;
  onSelectField: (id: string) => void;
  onRemoveField: (id: string) => void;
  onCommitField: (id: string, patch: Partial<PlacedField>) => void;
  onEditSelfSignature?: () => void;
};

function PageFieldsLayerInner({
  pageIndex,
  pageWidth,
  pageHeight,
  fields,
  signers,
  activeSignerId,
  selectedFieldId,
  placingType,
  selfSignature,
  onPageClick,
  onSelectField,
  onRemoveField,
  onCommitField,
  onEditSelfSignature,
}: Props) {
  const pageFields = useMemo(
    () => fields.filter((f) => f.pageIndex === pageIndex),
    [fields, pageIndex]
  );

  const signerMap = useMemo(() => new Map(signers.map((s) => [s.id, s])), [signers]);

  return (
    <div
      className="absolute inset-0"
      style={{
        width: pageWidth,
        height: pageHeight,
        cursor: placingType ? "crosshair" : "default",
      }}
      onClick={(e) => onPageClick(e, pageIndex)}
      role="presentation"
    >
      {pageFields.map((field) => {
        const signer = signerMap.get(field.signerId);
        return (
          <DocumentField
            key={field.id}
            field={field}
            color={signer?.color ?? "#4F46E5"}
            signerName={signer?.name ?? "Signer"}
            isSelected={selectedFieldId === field.id}
            isActiveSigner={field.signerId === activeSignerId}
            isSelf={field.signerId === SELF_SIGNER_ID}
            selfSignature={field.signerId === SELF_SIGNER_ID ? selfSignature ?? null : null}
            onSelect={() => onSelectField(field.id)}
            onRemove={() => onRemoveField(field.id)}
            onCommit={(patch) => onCommitField(field.id, patch)}
            onEditSignature={field.signerId === SELF_SIGNER_ID ? onEditSelfSignature : undefined}
          />
        );
      })}
    </div>
  );
}

function fieldsEqualForPage(a: PlacedField[], b: PlacedField[], pageIndex: number) {
  const fa = a.filter((f) => f.pageIndex === pageIndex);
  const fb = b.filter((f) => f.pageIndex === pageIndex);
  if (fa.length !== fb.length) return false;
  for (let i = 0; i < fa.length; i++) {
    const x = fa[i];
    const y = fb.find((f) => f.id === x.id);
    if (!y) return false;
    if (
      x.xPercent !== y.xPercent ||
      x.yPercent !== y.yPercent ||
      x.widthPercent !== y.widthPercent ||
      x.heightPercent !== y.heightPercent ||
      x.type !== y.type ||
      x.signerId !== y.signerId
    ) {
      return false;
    }
  }
  return true;
}

function signersEqual(a: EditorSigner[], b: EditorSigner[]) {
  if (a.length !== b.length) return false;
  return a.every((s, i) => s.id === b[i].id && s.color === b[i].color && s.name === b[i].name);
}

export const PageFieldsLayer = memo(PageFieldsLayerInner, (prev, next) => {
  if (prev.pageIndex !== next.pageIndex) return false;
  if (prev.pageWidth !== next.pageWidth || prev.pageHeight !== next.pageHeight) return false;
  if (prev.selectedFieldId !== next.selectedFieldId) return false;
  if (prev.placingType !== next.placingType) return false;
  if (prev.activeSignerId !== next.activeSignerId) return false;
  if (prev.selfSignature !== next.selfSignature) return false;
  if (!signersEqual(prev.signers, next.signers)) return false;
  return fieldsEqualForPage(prev.fields, next.fields, prev.pageIndex);
});
