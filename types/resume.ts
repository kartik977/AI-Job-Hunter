import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
});

export const experienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  bullets: z.array(z.string()),
});

export const educationSchema = z.object({
  institution: z.string(),
  degree: z.string().optional(),
  field: z.string().optional(),
  endDate: z.string().optional(),
  details: z.array(z.string()).optional(),
});

export const resumeContentSchema = z.object({
  contact: contactSchema,
  summary: z.string().optional(),
  experience: z.array(experienceSchema),
  education: z.array(educationSchema),
  skills: z.array(z.string()),
  certifications: z.array(z.string()).optional(),
  rawText: z.string().optional(),
});

export type ResumeContent = z.infer<typeof resumeContentSchema>;

export const atsAnalysisSchema = z.object({
  overall_score: z.number().min(0).max(100),
  keyword_matches: z.array(z.string()),
  missing_keywords: z.array(z.string()),
  section_issues: z.array(
    z.object({
      section: z.string(),
      issue: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    })
  ),
  priority_actions: z.array(
    z.object({
      action: z.string(),
      impact: z.enum(["low", "medium", "high"]),
    })
  ),
  summary: z.string(),
});

export type AtsAnalysis = z.infer<typeof atsAnalysisSchema>;

export const optimizeResultSchema = z.object({
  summary: z.string().optional(),
  experience: z.array(experienceSchema).optional(),
  skills: z.array(z.string()).optional(),
  changes_summary: z.string(),
});

export type OptimizeResult = z.infer<typeof optimizeResultSchema>;

export const coverLetterSchema = z.object({
  content: z.string(),
  tone: z.string().optional(),
});

export type CoverLetterResult = z.infer<typeof coverLetterSchema>;
