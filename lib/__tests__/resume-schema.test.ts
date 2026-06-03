import { describe, it, expect } from "vitest";
import { resumeContentSchema } from "@/types/resume";

describe("resumeContentSchema", () => {
  it("parses minimal valid resume", () => {
    const result = resumeContentSchema.safeParse({
      contact: { name: "Jane Doe" },
      experience: [],
      education: [],
      skills: ["TypeScript"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid structure", () => {
    const result = resumeContentSchema.safeParse({ contact: {} });
    expect(result.success).toBe(false);
  });
});
