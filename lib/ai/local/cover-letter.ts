import type { ResumeContent } from "@/types/resume";
import { extractKeywords } from "@/lib/ai/local/keywords";

export function generateCoverLetterLocal(
  resume: ResumeContent,
  jobDescription: string,
  company: string,
  title: string
) {
  const keywords = extractKeywords(jobDescription, 8);
  const name = resume.contact.name ?? "Applicant";
  const skills = resume.skills.slice(0, 6).join(", ") || keywords.join(", ");

  const content = `Dear Hiring Manager,

I am writing to apply for the ${title} position at ${company}. With experience across ${skills}, I am confident I can contribute to your team from day one.

In my recent roles, I have focused on delivering measurable outcomes and collaborating cross-functionally. The job description emphasizes ${keywords.slice(0, 4).join(", ")}, which align closely with my background.

I would welcome the opportunity to discuss how my skills match your needs. Thank you for your time and consideration.

Sincerely,
${name}`;

  return { content, tone: "professional" };
}
