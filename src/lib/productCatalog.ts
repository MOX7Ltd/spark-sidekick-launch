// Canonical product families (single source of truth)
// Must match products_type_check constraint in database

export const FAMILIES = [
  "template",     // checklists, notion/canva templates
  "ebook",        // guides, playbooks, PDFs
  "session",      // 1:1, workshop, single live delivery
  "course",       // cohort/mini-course, multi-session
  "email-pack",   // sequences, swipe files
  "video",        // packs of drills/lessons
  "bundle"        // combined offers/kits
] as const;

export type Family = typeof FAMILIES[number];
export const ALLOWED_FAMILIES = new Set<Family>(FAMILIES);

// Synonyms from onboarding, Lab, LLM outputs → canonical family
const SYNONYM_MAP: Record<string, Family> = {
  // generic onboarding buckets
  "digital": "ebook",
  "services": "session",
  "teach": "course",
  "physical": "bundle",

  // specific synonyms
  "checklist": "template",
  "checklist / template": "template",
  "template": "template",
  "notion template": "template",
  "canva template": "template",
  "digital guide": "ebook",
  "guide": "ebook",
  "ebook": "ebook",
  "1:1 session": "session",
  "coaching": "session",
  "consulting": "session",
  "workshop": "session",
  "cohort": "course",
  "mini-course": "course",
  "course": "course",
  "email sequence": "email-pack",
  "email pack": "email-pack",
  "video pack": "video",
  "video": "video",
  "bundle": "bundle",
  "starter kit": "bundle"
};

export function normalizeFamily(input?: string | null): Family | null {
  if (!input) return null;
  const k = input.toString().trim().toLowerCase();
  const mapped = (SYNONYM_MAP[k] ?? k) as Family;
  return ALLOWED_FAMILIES.has(mapped) ? mapped : null;
}

// Display labels, icons, default formats & price bands (for UI hints)
export const FAMILY_META: Record<Family, {
  label: string;
  icon: string;               // lucide icon name
  defaultFormat: "download" | "session" | "course" | "video" | "bundle";
  priceBand: [number, number]; // indicative only
  tooltip: string;
}> = {
  template: { 
    label: "Template", 
    icon: "FileCog", 
    defaultFormat: "download", 
    priceBand: [5, 29],
    tooltip: "Quick wins & actionable guides"
  },
  ebook: { 
    label: "Guide/eBook", 
    icon: "BookOpen", 
    defaultFormat: "download", 
    priceBand: [9, 49],
    tooltip: "In-depth knowledge products"
  },
  session: { 
    label: "Session", 
    icon: "UserRound", 
    defaultFormat: "session", 
    priceBand: [40, 200],
    tooltip: "Personal coaching & consulting"
  },
  course: { 
    label: "Course", 
    icon: "GraduationCap", 
    defaultFormat: "course", 
    priceBand: [25, 149],
    tooltip: "Group learning experiences"
  },
  "email-pack": {
    label: "Email Pack", 
    icon: "Mails", 
    defaultFormat: "download", 
    priceBand: [15, 99],
    tooltip: "Email sequences & newsletters"
  },
  video: { 
    label: "Video Pack", 
    icon: "Clapperboard", 
    defaultFormat: "video", 
    priceBand: [9, 59],
    tooltip: "Video tutorials & courses"
  },
  bundle: { 
    label: "Bundle", 
    icon: "Layers", 
    defaultFormat: "bundle", 
    priceBand: [19, 99],
    tooltip: "Combined resources & tools"
  }
};
