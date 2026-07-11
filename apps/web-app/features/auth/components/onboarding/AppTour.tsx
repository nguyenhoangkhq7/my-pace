"use client";

import React, { useEffect, useState } from "react";
import { Joyride, STATUS, Step } from "react-joyride";
import { useOnboardingStore } from "../../store/onboarding.store";
import { useTranslation } from "@/hooks/use-translation";

export function AppTour() {
  const { isTourActive, tourStepIndex, setTourStep, completeOnboarding } = useOnboardingStore();
  const { t } = useTranslation();

  // Define steps
  const steps: Step[] = [
    {
      target: ".tour-new-task-btn",
      content: (
        <div>
          <h3 className="font-bold text-lg mb-1 text-foreground">{t.onboarding.tour.newTaskTitle}</h3>
          <p className="text-muted-foreground">{t.onboarding.tour.newTaskDesc}</p>
        </div>
      ),
      styles: { tooltipFooter: { display: "none" } }, // Action: User must click the New Task button
    },
    {
      target: ".tour-urgent-important",
      content: (
        <div>
          <h3 className="font-bold text-lg mb-1 text-foreground">{t.onboarding.tour.urgentImportantTitle}</h3>
          <p className="text-muted-foreground">{t.onboarding.tour.urgentImportantDesc}</p>
        </div>
      ),

    },
    {
      target: ".tour-save-task-btn",
      content: (
        <div>
          <h3 className="font-bold text-lg mb-1 text-foreground">{t.onboarding.tour.saveTaskTitle}</h3>
          <p className="text-muted-foreground">{t.onboarding.tour.saveTaskDesc}</p>
        </div>
      ),
      styles: { tooltipFooter: { display: "none" } }, // Action: User must click Save Task
    },
    {
      target: ".tour-plan-my-day-btn",
      content: (
        <div>
          <h3 className="font-bold text-lg mb-1 text-foreground">{t.onboarding.tour.planMyDayTitle}</h3>
          <p className="text-muted-foreground">{t.onboarding.tour.planMyDayDesc}</p>
        </div>
      ),
      styles: { tooltipFooter: { display: "none" } }, // Action: User must click Plan My Day
    },
    {
      target: ".tour-schedule-area",
      content: (
        <div>
          <h3 className="font-bold text-lg mb-1 text-foreground">{t.onboarding.tour.scheduleTitle}</h3>
          <p className="text-muted-foreground">{t.onboarding.tour.scheduleDesc}</p>
        </div>
      ),
      styles: { tooltipFooter: { display: "none" } }, // Action: User must click a schedule button
    },
    {
      target: ".tour-focus-nav",
      content: (
        <div>
          <h3 className="font-bold text-lg mb-1 text-foreground">{t.onboarding.tour.focusTitle}</h3>
          <p className="text-muted-foreground">{t.onboarding.tour.focusDesc}</p>
        </div>
      ),

    }
  ];

  const handleJoyrideCallback = (data: any) => {
    console.log("JOYRIDE EVENT:", data);
    const { status, type, index, action } = data;
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED || action === "close") {
      completeOnboarding();
    } else if (type === "step:after" || type === "error:target_not_found") {
      if (action === "next") {
        setTourStep(index + 1);
      }
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  
  console.log("AppTour Render. isTourActive:", isTourActive, "tourStepIndex:", tourStepIndex, "mounted:", mounted);

  if (!mounted || !isTourActive) return null;

  return (
    <Joyride
      steps={steps}
      run={isTourActive}
      stepIndex={tourStepIndex}
      onEvent={handleJoyrideCallback}
      continuous={true}
      options={{
        skipBeacon: true,
        zIndex: 10000,
        primaryColor: 'hsl(var(--primary))',
        textColor: 'hsl(var(--foreground))',
        overlayColor: 'rgba(0, 0, 0, 0.6)',
        overlayClickAction: false,
        dismissKeyAction: false,
      }}
      styles={{
        options: {
          arrowColor: 'hsl(var(--card))',
          backgroundColor: 'hsl(var(--card))',
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          overlayColor: 'rgba(0, 0, 0, 0.75)',
        },
        tooltip: {
          backgroundColor: 'hsl(var(--card))',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid hsl(var(--border))',
        },
        tooltipContainer: {
          textAlign: "left",
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          borderRadius: '8px',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          marginRight: '10px',
        }
      } as any}
    />
  );
}
