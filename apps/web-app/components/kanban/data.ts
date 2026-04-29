import { KanbanColumnData } from "@/components/kanban/types";

export const kanbanColumns: KanbanColumnData[] = [
  {
    id: "backlog",
    title: "BACKLOG",
    cards: [
      {
        id: "backlog-1",
        title: "Research competitor typography systems",
        tag: { label: "RESEARCH", className: "bg-blue-500/20 text-blue-200" },
      },
      {
        id: "backlog-2",
        title: "Draft initial moodboards for the workspace",
        tag: { label: "DESIGN", className: "bg-amber-500/20 text-amber-200" },
      },
      {
        id: "backlog-3",
        title: "Interview top focus experts",
        tag: { label: "PLANNING", className: "bg-emerald-500/20 text-emerald-200" },
      },
      {
        id: "backlog-4",
        title: "Map competitor onboarding flows",
        tag: { label: "RESEARCH", className: "bg-blue-500/20 text-blue-200" },
      },
    ],
  },
  {
    id: "todo",
    title: "TO-DO",
    cards: [
      {
        id: "todo-1",
        title: "Update technical documentation for API v2",
        tag: { label: "DOCS", className: "bg-sky-500/20 text-sky-200" },
      },
      {
        id: "todo-2",
        title: "Review security protocols for user data",
        tag: { label: "DEV", className: "bg-amber-500/20 text-amber-200" },
      },
      {
        id: "todo-3",
        title: "Refactor CSS variable system",
        tag: { label: "CORE", className: "bg-emerald-500/20 text-emerald-200" },
      },
    ],
  },
  {
    id: "doing",
    title: "DOING",
    cards: [
      {
        id: "doing-1",
        title: "Finalizing dark theme color palette",
        tag: { label: "ACTIVE", className: "bg-blue-500/20 text-blue-200" },
        progress: 62,
      },
      {
        id: "doing-2",
        title: "Implementing kanban drag-and-drop",
        tag: { label: "UI", className: "bg-amber-500/20 text-amber-200" },
      },
      {
        id: "doing-3",
        title: "Onboarding new design system assets",
      },
      {
        id: "doing-4",
        title: "Refining font loading strategy",
      },
    ],
  },
  {
    id: "done",
    title: "DONE",
    cards: [
      {
        id: "done-1",
        title: "Establish focus session flow",
        completed: true,
      },
      {
        id: "done-2",
        title: "Set up project foundation",
        completed: true,
      },
      {
        id: "done-3",
        title: "Stakeholder interview notes",
        completed: true,
      },
    ],
  },
];

