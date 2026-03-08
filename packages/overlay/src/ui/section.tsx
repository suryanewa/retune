/**
 * Section layout primitives for the property panel.
 * Mirrors the portfolio editor's SectionWrapper/SectionBody/SectionRow pattern.
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

export function Row({ children }: { children: ReactNode }) {
  return (
    <div className="retune-section-row">
      <div className="retune-row">
        {children}
      </div>
    </div>
  );
}

/** Groups multiple rows with equal vertical and horizontal gaps */
export function RowGroup({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="retune-row-group">
      {label && <div className="retune-group-label-inline">{label}</div>}
      {children}
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

export function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div className="retune-group-label">{children}</div>
  );
}
