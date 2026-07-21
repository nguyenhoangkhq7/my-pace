import { Target, Calendar, Clock, Sparkles } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

interface SlidePhilosophyProps {
  onOpenDetail: (title: string, content: string) => void;
}

export function SlidePhilosophy({ onOpenDetail }: SlidePhilosophyProps) {
  const { t } = useTranslation();

  const renderWithKeyword = (text: string, keyword: string, title: string, detail: string) => {
    if (!text || !keyword) return text;
    const parts = text.split(keyword);
    if (parts.length < 2) return text;

    return (
      <>
        {parts[0]}
        <span
          className="font-bold text-primary cursor-pointer hover:underline transition-all"
          onClick={() => onOpenDetail(title, detail)}
        >
          {keyword}
        </span>
        {parts.slice(1).join(keyword)}
      </>
    );
  };

  return (
    <>
      <div className="flex gap-3 items-start bg-muted/30 p-3 rounded-2xl">
        <div className="mt-0.5 p-1.5 bg-blue-500/10 text-blue-500 rounded-xl shrink-0">
          <Target className="w-5 h-5" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground pt-0.5">
          {renderWithKeyword(
            t.onboarding.eisenhower,
            t.onboarding.eisenhowerKeyword,
            t.onboarding.eisenhowerKeyword,
            t.onboarding.eisenhowerDetail
          )}
        </p>
      </div>

      <div className="flex gap-3 items-start bg-muted/30 p-3 rounded-2xl">
        <div className="mt-0.5 p-1.5 bg-purple-500/10 text-purple-500 rounded-xl shrink-0">
          <Calendar className="w-5 h-5" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground pt-0.5">
          {renderWithKeyword(
            t.onboarding.fixedEvents,
            t.onboarding.fixedEventsKeyword,
            t.onboarding.fixedEventsKeyword,
            t.onboarding.fixedEventsDetail
          )}
        </p>
      </div>

      <div className="flex gap-3 items-start bg-muted/30 p-3 rounded-2xl">
        <div className="mt-0.5 p-1.5 bg-green-500/10 text-green-500 rounded-xl shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground pt-0.5">
          {renderWithKeyword(
            t.onboarding.mits,
            t.onboarding.mitsKeyword,
            t.onboarding.mitsKeyword,
            t.onboarding.mitsDetail
          )}
        </p>
      </div>

      <div className="flex gap-3 items-start bg-muted/30 p-3 rounded-2xl">
        <div className="mt-0.5 p-1.5 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground pt-0.5">
          {renderWithKeyword(
            t.onboarding.flow,
            t.onboarding.flowKeyword,
            t.onboarding.flowKeyword,
            t.onboarding.flowDetail
          )}
        </p>
      </div>
    </>
  );
}
