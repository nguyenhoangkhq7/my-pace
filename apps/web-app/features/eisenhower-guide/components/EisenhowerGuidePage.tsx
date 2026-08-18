"use client";

import { EisenhowerHero } from "./EisenhowerHero";
import { EisenhowerMatrixGrid } from "./EisenhowerMatrixGrid";
import { EisenhowerSimulator } from "./EisenhowerSimulator";
import { MyPaceWorkflowSection } from "./MyPaceWorkflowSection";
import { EisenhowerPrinciplesSection } from "./EisenhowerPrinciplesSection";

export function EisenhowerGuidePage() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 pb-16 pt-2 animate-fade-in">
      <EisenhowerHero />
      <EisenhowerMatrixGrid />
      <EisenhowerSimulator />
      <MyPaceWorkflowSection />
      <EisenhowerPrinciplesSection />
    </div>
  );
}
