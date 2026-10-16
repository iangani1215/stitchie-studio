import type { Metadata } from "next";
import { StitchieEditor } from "./stitchie-editor";

export const metadata: Metadata = {
  title: "stitchie studio — 把回忆缝成作品",
  description: "上传照片，绘制真实棉线刺绣，并保存你的动态刺绣记忆。",
};

export default function Home() {
  return <StitchieEditor />;
}
