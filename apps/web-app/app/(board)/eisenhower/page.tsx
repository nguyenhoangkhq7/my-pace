import { EisenhowerGuidePage } from "@/features/eisenhower-guide";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ma trận Eisenhower | MyPACE",
  description: "Tìm hiểu phương pháp quản lý thời gian và phân loại công việc theo Ma trận Eisenhower cùng MyPACE.",
};

export default function Page() {
  return <EisenhowerGuidePage />;
}
