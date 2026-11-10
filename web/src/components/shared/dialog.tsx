"use client";

import { useEffect, useId, useRef } from "react";

export function Dialog({ title, kind = "methods", onClose, children }: {
  title: string; kind?: "methods" | "coverage" | "ask"; onClose: () => void; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog ref={ref} aria-labelledby={titleId} className={`dialog dialog-${kind}`}
      onCancel={onClose} onClose={(event) => { if (!event.currentTarget.open) onClose(); }}
      onPointerDown={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}>
      <div className="dialog-heading">
        <h2 id={titleId}>{title}</h2>
        <button className="text-button" type="button" onClick={onClose}>Close</button>
      </div>
      {children}
    </dialog>
  );
}
