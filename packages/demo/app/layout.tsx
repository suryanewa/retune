import type { Metadata } from "next";
import { Retune } from "retune";

export const metadata: Metadata = {
  title: "Retune Demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" }}>
        {children}
        <Retune />
      </body>
    </html>
  );
}
