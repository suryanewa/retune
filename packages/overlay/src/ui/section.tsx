/**
 * Section layout primitives for the property panel.
 * Mirrors the portfolio editor's SectionWrapper/SectionBody/SectionRow pattern.
 */

import type { ReactNode } from "react";

export function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="composer-section">
      <div className="composer-section-header">
        <span className="composer-section-title">{label}</span>
      </div>
      <div className="composer-section-body">
        {children}
      </div>
    </div>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return (
    <div className="composer-section-row">
      <div className="composer-row">
        {children}
      </div>
    </div>
  );
}

/** Groups multiple rows with equal vertical and horizontal gaps */
export function RowGroup({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="composer-row-group">
      {label && <div className="composer-group-label-inline">{label}</div>}
      {children}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="composer-field">
      <span className="composer-field-label">{label}</span>
      {children}
    </div>
  );
}

export function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div className="composer-group-label">{children}</div>
  );
}
