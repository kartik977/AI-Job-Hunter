import "server-only";
import OpenAI from "openai";

export function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
