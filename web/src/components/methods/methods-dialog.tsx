"use client";

import Link from "next/link";
import { Dialog } from "@/components/shared/dialog";
import { MethodsContent } from "./methods-content";

export function MethodsDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="Data and methods" onClose={onClose}>
      <MethodsContent />
      <Link href="/data-and-methods" onClick={onClose} className="text-link dialog-page-link">Open full page</Link>
    </Dialog>
  );
}
