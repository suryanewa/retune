"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";

type FaqItem = {
  id: string;
  question: string;
  answer: ReactNode;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-tuna",
    question: "What is Tuna?",
    answer: (
      <>
        Tuna is a fork of <a href="https://retune.dev/">Retune</a>, a development overlay for visually editing
        elements in your running app, by <a href="https://x.com/___sujan">Sujan Khadgi</a>, with added features
        and improvements. You make selections, sketches, and comments and tweak spacing, color, typography, and
        layout in the browser, then send a structured diff to your coding agent to apply in source.
      </>
    ),
  },
  {
    id: "retune-differences",
    question: "How is Tuna different from Retune?",
    answer:
      "Tuna keeps Retune's core visual editing overlay and extends it with multi-select workflows, sketch and comment annotations, voice dictation, richer element context, improved coding-agent handoff, a Chrome extension workspace, and refreshed packaging and playground docs.",
  },
  {
    id: "css-knowledge",
    question: "Do I need to know CSS to use Tuna?",
    answer:
      "No. Tuna gives designers and frontend coders familiar visual controls for common UI properties. Knowing CSS helps when reviewing the handoff, but Tuna captures the exact before and after values for your coding agent.",
  },
  {
    id: "frameworks",
    question: "Which stacks does it support?",
    answer:
      "Tuna works with React apps on Next.js, Vite, Remix, and similar setups. It detects Tailwind, CSS Modules, plain CSS, and other stylesheet approaches automatically.",
  },
  {
    id: "tailwind-design-tokens",
    question: "Can I use Tuna with Tailwind or design tokens?",
    answer:
      "Yes. Tuna detects styling context, includes classes and computed styles in the handoff, and can suggest nearby design tokens when a visual value maps cleanly to your system.",
  },
  {
    id: "source-editing",
    question: "Will Tuna edit my source code automatically?",
    answer:
      "Tuna previews changes live in the browser and produces structured context for your coding agent. The agent applies the real source changes, so you can review and keep normal code ownership.",
  },
  {
    id: "finding-elements",
    question: "How does Tuna find the right code?",
    answer:
      "Each change includes a CSS selector, React component path, text content, classes, and optional source hints. Fidelity levels let you send minimal diffs or richer layout context for larger codebases.",
  },
  {
    id: "ai-integration",
    question: "How does AI integration work?",
    answer:
      "Run npx @suryanewa/tuna setup to install the MCP server and skill for Codex, Claude Code, or Cursor. Tuna can also copy structured output to the clipboard if you prefer a manual handoff.",
  },
  {
    id: "production",
    question: "Does it run in production?",
    answer:
      "No. Tuna is meant for local development. Add it to your dev layout and keep it out of production builds.",
  },
];

export function FaqAccordion() {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="faq-list">
      {FAQ_ITEMS.map((item) => {
        const isOpen = openId === item.id;
        const triggerId = `${baseId}-${item.id}-trigger`;
        const panelId = `${baseId}-${item.id}-panel`;

        return (
          <div key={item.id} className={`faq-item${isOpen ? " is-open" : ""}`}>
            <button
              type="button"
              id={triggerId}
              className="faq-trigger"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenId(isOpen ? null : item.id)}
            >
              <span>{item.question}</span>
              <span className="faq-icon" aria-hidden="true" />
            </button>
            <div
              id={panelId}
              className="faq-panel-wrap"
              role="region"
              aria-labelledby={triggerId}
              aria-hidden={!isOpen}
            >
              <div className="faq-panel-inner">
                <p>{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
