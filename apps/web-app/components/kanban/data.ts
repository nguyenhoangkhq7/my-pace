import { KanbanColumnData } from "@/components/kanban/types";

export const kanbanColumns: KanbanColumnData[] = [
  {
    id: "backlog",
    title: "BACKLOG",
    cards: [
      {
        id: "backlog-1",
        title: "Research competitor typography systems",
        tag: { label: "RESEARCH", className: "bg-[#243147] text-[#b7c7e6]" },
      },
      {
        id: "backlog-2",
        title: "Draft initial moodboards for the workspace",
        tag: { label: "DESIGN", className: "bg-[#2a2f45] text-[#c0c7e6]" },
      },
      {
        id: "backlog-3",
        title: "Interview top focus experts",
        tag: { label: "PLANNING", className: "bg-[#2c3340] text-[#c6d0df]" },
      },
      {
        id: "backlog-4",
        title: "Map competitor onboarding flows",
        tag: { label: "RESEARCH", className: "bg-[#243147] text-[#b7c7e6]" },
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
        tag: { label: "DOCS", className: "bg-[#263041] text-[#b8c2d4]" },
      },
      {
        id: "todo-2",
        title: "Review security protocols for user data",
        tag: { label: "DEV", className: "bg-[#263143] text-[#b8c6de]" },
      },
      {
        id: "todo-3",
        title: "Refactor CSS variable system",
        tag: { label: "CORE", className: "bg-[#2c3340] text-[#c6d0df]" },
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
        tag: { label: "ACTIVE", className: "bg-[#2a3650] text-[#bdd0f0]" },
        progress: 62,
      },
      {
        id: "doing-2",
        title: "Implementing kanban drag-and-drop",
        tag: { label: "UI", className: "bg-[#243147] text-[#b7c7e6]" },
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

