export type KanbanTag = {
  label: string;
  className: string;
};

export type KanbanCardData = {
  id: string;
  title: string;
  tag?: KanbanTag;
  progress?: number;
  completed?: boolean;
};

export type KanbanColumnData = {
  id: string;
  title: string;
  cards: KanbanCardData[];
};

