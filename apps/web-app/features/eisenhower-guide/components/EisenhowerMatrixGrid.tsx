import { useTranslation } from "@/hooks/use-translation";
import { EisenhowerQuadrantCard } from "./EisenhowerQuadrantCard";

export function EisenhowerMatrixGrid() {
  const { t } = useTranslation();
  const guide = t.eisenhowerGuide;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">
          {guide.matrixOverviewTitle}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {guide.matrixOverviewSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EisenhowerQuadrantCard
          quadrant="Q1"
          title={guide.q1Title}
          subtitle={guide.q1Subtitle}
          actionBadge={guide.q1ActionBadge}
          fullDesc={guide.q1FullDesc}
          examples={guide.q1Examples}
          trap={guide.q1Trap}
          myPaceTip={guide.q1MyPaceTip}
        />
        <EisenhowerQuadrantCard
          quadrant="Q2"
          title={guide.q2Title}
          subtitle={guide.q2Subtitle}
          actionBadge={guide.q2ActionBadge}
          fullDesc={guide.q2FullDesc}
          examples={guide.q2Examples}
          trap={guide.q2Trap}
          myPaceTip={guide.q2MyPaceTip}
        />
        <EisenhowerQuadrantCard
          quadrant="Q3"
          title={guide.q3Title}
          subtitle={guide.q3Subtitle}
          actionBadge={guide.q3ActionBadge}
          fullDesc={guide.q3FullDesc}
          examples={guide.q3Examples}
          trap={guide.q3Trap}
          myPaceTip={guide.q3MyPaceTip}
        />
        <EisenhowerQuadrantCard
          quadrant="Q4"
          title={guide.q4Title}
          subtitle={guide.q4Subtitle}
          actionBadge={guide.q4ActionBadge}
          fullDesc={guide.q4FullDesc}
          examples={guide.q4Examples}
          trap={guide.q4Trap}
          myPaceTip={guide.q4MyPaceTip}
        />
      </div>
    </div>
  );
}
