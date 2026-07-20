import type { ReactNode } from "react";

export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section aria-modal="true" className="modal" onMouseDown={(event) => event.stopPropagation()} role="dialog">
        <div className="modal-title"><div><span>NEW RECORD</span><h2>{title}</h2></div><button aria-label="닫기" onClick={onClose}>×</button></div>
        {children}
      </section>
    </div>
  );
}
