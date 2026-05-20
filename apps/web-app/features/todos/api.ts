import { get, del } from "@/lib/fetchClient";
import type { Board, BoardSummary } from "./types";

export async function getAllBoards(): Promise<BoardSummary[]> {
  const res = await get<BoardSummary[]>("boards");
  return res.data;
}

export async function getBoardById(id: number): Promise<Board> {
  const res = await get<Board>(`boards/${id}`);
  return res.data;
}

export async function deleteBoard(id: number): Promise<void> {
  await del(`boards/${id}`);
}
