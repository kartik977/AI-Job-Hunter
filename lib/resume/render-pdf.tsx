import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { ResumePdfDocument } from "@/lib/resume/pdf-document";
import type { ResumeContent } from "@/types/resume";

export async function renderResumePdf(content: ResumeContent) {
  return renderToBuffer(<ResumePdfDocument content={content} />);
}
