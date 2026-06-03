import { describe, it, expect } from "vitest";
import { analyzeResumeLocal } from "@/lib/ai/local/analyze";
import { parseResumeLocal } from "@/lib/ai/local/parse";

describe("local ATS engine", () => {
  it("scores resume against job keywords", () => {
    const resume = parseResumeLocal(`
Jane Doe
jane@email.com
SUMMARY
Software engineer with TypeScript and React experience.
SKILLS
TypeScript, React, Node.js
EXPERIENCE
Engineer | Acme
- Built web apps with React
`);
    const analysis = analyzeResumeLocal(
      resume,
      "We need TypeScript, React, Node.js, and PostgreSQL experience."
    );
    expect(analysis.overall_score).toBeGreaterThan(0);
    expect(analysis.keyword_matches).toContain("typescript");
    expect(analysis.missing_keywords).toContain("postgresql");
  });
});
