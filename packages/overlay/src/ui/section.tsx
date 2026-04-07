/**
 * Panel layout primitives.
 *
 * Section  — collapsible group with header label + optional action
 * Row      — universal horizontal container, optional shared label
 * Field    — label-above-input pair, used inside Row
 * RowAction — button on the right edge of a Row
 */

import type { ReactNode } from "react";

export function Section({ label, gap, action, children }: { label: string; gap?: number; action?: ReactNode; children?: ReactNode }) {
  return (
    <div className="retune-section">
      <div className="retune-section-header">
        <span className="retune-section-title">{label}</span>
        {action}
      </div>
      {children && (
        <div className="retune-section-body" style={gap != null ? { gap } : undefined}>
          {children}
        </div>
      )}
    </div>
  );
}

export function Row({ label, children }: { label?: string; children: ReactNode }) {
  if (label) {
    return (
      <div className="retune-row-group">
        <div className="retune-group-label-inline">{label}</div>
        {children}
      </div>
    );
  }
  return (
    <div className="retune-section-row">
      <div className="retune-row">
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="retune-field">
      <span className="retune-field-label">{label}</span>
      {children}
    </div>
  );
}

export function RowAction({ onClick, active, children }: { onClick: () => void; active?: boolean; children: ReactNode }) {
  return (
    <button className={`retune-row-action${active ? " active" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

/** @deprecated Use Row with label prop instead */
export const RowGroup = Row;

/** @deprecated Use Row label prop instead */
export function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div className="retune-group-label">{children}</div>
  );
}
