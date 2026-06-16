"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ScrollSection = {
  id: string;
  label: string;
  percentage: number;
  top: number;
};

export function ScrollIndicator() {
  const [sections, setSections] = useState<ScrollSection[]>([]);
  const [opacity, setOpacity] = useState(0);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const progressFillRef = useRef<HTMLDivElement>(null);

  const calculateSections = useCallback(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-section]"));
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    if (elements.length === 0 || maxScroll <= 0) return;

    const nextSections = elements.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const label = element.dataset.scrollSection ?? "";

      return {
        id: element.id,
        label,
        percentage: elements.length > 1 ? index / (elements.length - 1) : 0,
        top: rect.top + window.scrollY,
      };
    });

    setSections(nextSections.filter((section) => section.id && section.label));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(calculateSections, 250);

    window.addEventListener("resize", calculateSections);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", calculateSections);
    };
  }, [calculateSections]);

  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      if (maxScroll <= 0) return;

      let nextOpacity = 1;
      if (sections.length > 2) {
        const topFadeEnd = sections[1].top;
        const bottomFadeStart = sections[sections.length - 2].top;
        const bottomFadeDistance = maxScroll - bottomFadeStart;

        if (scrollY < topFadeEnd && topFadeEnd > 0) {
          const progress = Math.max(0, Math.min(1, scrollY / topFadeEnd));
          nextOpacity = 1 - (1 - progress) ** 3;
        } else if (scrollY > bottomFadeStart && bottomFadeDistance > 0) {
          const progress = Math.max(0, Math.min(1, (maxScroll - scrollY) / bottomFadeDistance));
          nextOpacity = 1 - (1 - progress) ** 3;
        }
      }

      setOpacity(nextOpacity);

      if (sections.length <= 1) {
        progressFillRef.current?.style.setProperty("height", `${Math.max(0, Math.min(1, scrollY / maxScroll)) * 100}%`);
        return;
      }

      const finalReachableIndex = sections.reduce((lastIndex, section, index) => (section.top <= maxScroll ? index : lastIndex), 0);
      let scrollPosition = scrollY;

      if (finalReachableIndex < sections.length - 1 && scrollY >= sections[finalReachableIndex].top) {
        const segmentStart = sections[finalReachableIndex].top;
        const segmentEnd = maxScroll;
        const targetEnd = sections[sections.length - 1].top;
        const progress = segmentEnd > segmentStart ? (scrollY - segmentStart) / (segmentEnd - segmentStart) : 1;
        scrollPosition = segmentStart + progress * (targetEnd - segmentStart);
      }

      let overallProgress = 0;
      if (scrollPosition >= sections[sections.length - 1].top) {
        overallProgress = 1;
      } else {
        let index = 0;
        for (let i = 0; i < sections.length - 1; i += 1) {
          if (scrollPosition >= sections[i].top) index = i;
        }

        const currentTop = sections[index].top;
        const nextTop = sections[index + 1].top;
        const sectionProgress = nextTop > currentTop ? (scrollPosition - currentTop) / (nextTop - currentTop) : 0;
        overallProgress = (index + Math.max(0, Math.min(1, sectionProgress))) / (sections.length - 1);
      }

      if (scrollY <= 100) {
        overallProgress *= scrollY / 100;
      }

      progressFillRef.current?.style.setProperty("height", `${overallProgress * 100}%`);

      let nextActiveIndex = 0;
      for (let i = 0; i < sections.length; i += 1) {
        if (scrollY >= sections[i].top - 50) nextActiveIndex = i;
      }
      if (scrollY >= maxScroll - 50) nextActiveIndex = sections.length - 1;

      setActiveSectionIndex(nextActiveIndex);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [sections]);

  function handleMarkerClick(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (sections.length === 0) return null;

  return (
    <nav
      aria-label="Scroll progress indicator"
      className="scroll-indicator"
      style={{
        opacity,
        pointerEvents: opacity < 0.1 ? "none" : "auto",
      }}
    >
      <div className="scroll-indicator-track">
        <div className="scroll-indicator-track-bg" />
        <div ref={progressFillRef} className="scroll-indicator-progress" style={{ height: "0%" }} />

        <div className="scroll-indicator-markers">
          {sections.map((section, index) => {
            const isActive = index === activeSectionIndex;
            const isPassed = index < activeSectionIndex || (activeSectionIndex === sections.length - 1 && index === sections.length - 1);

            return (
              <button
                key={section.id}
                type="button"
                className="scroll-indicator-marker"
                style={{
                  top: `${section.percentage * 100}%`,
                  transform:
                    index === 0
                      ? "translateX(-16px)"
                      : index === sections.length - 1
                        ? "translateY(-100%) translateX(-16px)"
                        : "translateY(-50%) translateX(-16px)",
                }}
                onClick={() => handleMarkerClick(section.id)}
                aria-label={`Scroll to ${section.label}`}
                aria-current={isActive ? "location" : undefined}
              >
                <span className={`scroll-indicator-label ${isActive ? "active" : ""}`}>{section.label}</span>
                <span className={`scroll-indicator-tick ${isActive ? "active" : ""} ${isPassed ? "passed" : "future"}`} />
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
