import "server-only";
import mammoth from "mammoth";

const MAX_BYTES = 5 * 1024 * 1024;

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (buffer.length > MAX_BYTES) {
    throw new Error("File exceeds 5MB limit");
  }

  if (mimeType === "application/pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = result.text?.trim();
    if (!text) {
      throw new Error("Could not extract text from PDF. Try a text-based PDF.");
    }
    return text;
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    if (!result.value?.trim()) {
      throw new Error("Could not extract text from DOCX.");
    }
    return result.value;
  }

  throw new Error("Unsupported file type. Upload PDF or DOCX.");
}

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
