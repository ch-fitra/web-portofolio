import { z } from "zod";
export const uuid = z.uuid();
export const webUrl = z.union([
  z.literal(""),
  z.url().refine((v) => /^https?:\/\//.test(v), "Use an HTTP(S) URL"),
]);
const text = z.string().trim().max(20000);
const short = z.string().trim().max(300);
export const mediaId = z.union([uuid, z.literal("")]);
const content = {
  text: text.default(""),
  title: short.default(""),
  mediaId: mediaId.default(""),
  mediaIds: z.array(uuid).max(20).default([]),
  caption: short.default(""),
  url: webUrl.default(""),
  source: short.default(""),
  items: z.array(short).max(30).default([]),
};
export const blockSchema = z
  .object({
    id: uuid,
    type: z.enum([
      "text",
      "heading",
      "image",
      "image-pair",
      "gallery",
      "video",
      "diagram",
      "code",
      "quote",
      "feature",
      "stack",
      "metric",
      "cta",
      "divider",
    ]),
    ...content,
  })
  .superRefine((v, ctx) => {
    if (v.type === "metric" && !v.source)
      ctx.addIssue({
        code: "custom",
        message: "Metrics require a verifiable source",
        path: ["source"],
      });
    if (
      v.type === "video" &&
      !/^https:\/\/(www\.youtube-nocookie\.com\/embed\/[\w-]+|player\.vimeo\.com\/video\/\d+)$/.test(
        v.url,
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Use a YouTube privacy-enhanced embed or Vimeo embed URL",
        path: ["url"],
      });
    if (["image", "diagram"].includes(v.type) && !v.mediaId)
      ctx.addIssue({
        code: "custom",
        message: "Select an image",
        path: ["mediaId"],
      });
  });
export const chapterSchema = z.object({
  id: uuid,
  title: short.min(1),
  visible: z.boolean().default(true),
  blocks: z.array(blockSchema).max(60),
});
export const projectSchema = z
  .object({
    title: short.min(1),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(120),
    summary: text.max(600),
    category: short,
    role: short,
    collaboration: z.enum(["Personal", "Team", "Client", "Academic"]),
    context: text,
    contribution: text,
    stack: z.array(short).max(30),
    tags: z.array(short).max(30).default([]),
    timeframe: short.default(""),
    team: text.default(""),
    coverId: mediaId.default(""),
    sourceUrl: webUrl.default(""),
    demoUrl: webUrl.default(""),
    demoVerified: z.boolean().default(false),
    status: z.enum(["draft", "published", "archived"]),
    featured: z.boolean(),
    order: z.number().int().min(0).max(9999),
    seoTitle: short.default(""),
    seoDescription: short.max(600).default(""),
    locale: z.enum(["en", "id"]).default("en"),
    chapters: z.array(chapterSchema).max(30),
  })
  .superRefine((v, ctx) => {
    if (
      v.status === "published" &&
      (!v.contribution.trim() ||
        !v.context.trim() ||
        !v.summary.trim() ||
        !v.chapters.some((c) => c.visible && c.blocks.length))
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Publishing requires summary, context, personal contribution and a visible chapter.",
      });
  });
export type ProjectInput = z.infer<typeof projectSchema>;
export type Project = ProjectInput & { id: string; updated_at: string };
export type Block = z.infer<typeof blockSchema>;
export const profileSchema = z.object({
  name: short.min(1),
  handle: short.min(1),
  role: short.min(1),
  headline: short.min(1),
  intro: text,
  about: text,
  location: short,
  availability: short,
  homePortraitId: mediaId,
  aboutPortraitId: mediaId,
  homePosition: z.number().min(0).max(100),
  aboutPosition: z.number().min(0).max(100),
  resumeId: mediaId,
  email: z.union([z.email(), z.literal("")]),
  github: webUrl,
  linkedin: webUrl,
  headlineId: short.default(""),
  introId: text.default(""),
  aboutId: text.default(""),
  capabilities: z.array(z.object({ title: short, description: text })).max(12),
});
export type Profile = z.infer<typeof profileSchema>;
export const settingsSchema = z.object({
  title: short.min(1),
  description: text.max(600),
  privacy: text.min(1),
  locale: z.enum(["en", "id"]),
  theme: z.enum(["system", "dark", "light"]),
  motion: z.enum(["system", "full", "reduced"]),
  contactHeading: short,
  contactIntro: text,
  footer: short,
  retentionDays: z.number().int().min(1).max(3650),
});
export type Settings = z.infer<typeof settingsSchema>;
export const recordSchema = z.object({
  name: short.min(1),
  category: short,
  summary: text,
  visible: z.boolean(),
  order: z.number().int().min(0).max(9999),
  projectIds: z.array(uuid).max(30).default([]),
  issuer: short.default(""),
  issued: short.default(""),
  expiry: short.default(""),
  credentialId: short.default(""),
  credentialUrl: webUrl.default(""),
  mediaId: mediaId.default(""),
  certificateType: z
    .enum(["Certification", "Course Completion"])
    .default("Certification"),
});
export type ContentRecord = z.infer<typeof recordSchema> & {
  id: string;
  kind: "skill" | "certification";
};
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  type: z.enum(["hiring", "freelance"]),
  message: z.string().trim().min(20).max(5000),
  budget: short.default(""),
  timeline: short.default(""),
  consent: z.literal(true),
  website: z.string().max(0),
});
export const defaultProfile: Profile = {
  name: "Chairul Fitra Ramadhan",
  handle: "ch-fitra",
  role: "AI Developer",
  headline: "Intelligent software.\nThoughtfully engineered.",
  intro:
    "Building AI-powered applications, full-stack systems, and useful automation. Explore the thinking behind the work.",
  about:
    "I’m Chairul Fitra Ramadhan. This is a space for the software I build, the decisions behind it, and what I learn along the way.",
  location: "",
  availability: "Let’s start a conversation",
  homePortraitId: "",
  aboutPortraitId: "",
  homePosition: 50,
  aboutPosition: 50,
  resumeId: "",
  email: "",
  github: "https://github.com/ch-fitra",
  linkedin: "https://www.linkedin.com/in/chfitra",
  headlineId: "Perangkat lunak cerdas.\nDirancang dengan saksama.",
  introId:
    "Membangun aplikasi berbasis AI, sistem full-stack, dan otomasi yang bermanfaat.",
  aboutId:
    "Saya Chairul Fitra Ramadhan. Di sini saya membagikan karya, keputusan teknis, dan hal yang saya pelajari.",
  capabilities: [],
};
export const defaultSettings: Settings = {
  title: "ch-fitra — AI Developer",
  description:
    "The work and thinking of Chairul Fitra Ramadhan. AI-powered applications, full-stack engineering, and intelligent automation.",
  privacy:
    "Contact details are used only to respond to your inquiry. Messages are stored privately on this website’s server for up to 180 days. Contact the owner to request deletion. No advertising trackers are installed. Optional email notifications share your inquiry with the configured email provider. This site does not operate an AI chat assistant.",
  locale: "en",
  theme: "system",
  motion: "system",
  contactHeading: "Good things start\nwith a conversation.",
  contactIntro:
    "Have a role, an idea, or a technical challenge in mind? Tell me a little about it.",
  footer: "Built with intention. Always evolving.",
  retentionDays: 180,
};
