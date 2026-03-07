// Phase mapping for different project categories
// These must match the exact category names from src/data/categories.ts
export interface PhaseConfig {
  phases: string[];
}

export const PHASE_MAPPING: Record<string, PhaseConfig> = {
  "Writing & Content Creation": {
    phases: ["Drafting", "Refinement", "Finalization"]
  },
  "Graphic Design & Visual Arts": {
    phases: ["Drafting", "Refinement", "Finalization"]
  },
  "Web Development & Programming": {
    phases: ["Discovery", "Design", "Development", "Testing", "Finalization", "Support"]
  },
  "Digital Marketing": {
    phases: ["Discovery", "Drafting", "Refinement", "Finalization", "Support"]
  },
  "Business, Finance & Management": {
    phases: ["Discovery", "Drafting", "Refinement", "Finalization", "Support"]
  },
  "Data & Analytics": {
    phases: ["Discovery", "Drafting", "Refinement", "Finalization", "Support"]
  },
  "Video, Audio & Multimedia": {
    phases: ["Discovery", "Drafting", "Refinement", "Finalization", "Support"]
  },
  "AI, Automation & Tech Tools": {
    phases: ["Discovery", "Drafting", "Refinement", "Testing", "Finalization", "Support"]
  },
  "IT & Technical Support": {
    phases: ["Discovery", "Drafting", "Refinement", "Finalization", "Support"]
  },
  "Translation & Linguistic Services": {
    phases: ["Discovery", "Drafting", "Refinement", "Finalization"]
  },
  "Education & Training": {
    phases: ["Discovery", "Drafting", "Refinement", "Finalization", "Support"]
  },
  "E-commerce & Product Work": {
    phases: ["Discovery", "Drafting", "Refinement", "Finalization", "Support"]
  },
  "Lifestyle, Creative & Miscellaneous": {
    phases: ["Discovery", "Drafting", "Refinement", "Finalization"]
  },
  "Administrative & Support": {
    phases: ["Discovery", "Drafting", "Refinement", "Finalization"]
  },
  "Medical Writing & Documentation": {
    phases: ["Discovery", "Drafting", "Refinement", "Testing", "Finalization", "Support"]
  },
  "Telehealth & Virtual Care": {
    phases: ["Discovery", "Drafting", "Refinement", "Finalization", "Support"]
  },
  "Biomedical & Scientific Research": {
    phases: ["Discovery", "Drafting", "Refinement", "Testing", "Finalization", "Support"]
  },
  "Pharmaceutical & Regulatory Services": {
    phases: ["Discovery", "Drafting", "Refinement", "Testing", "Finalization", "Support"]
  },
  "Health Informatics & Digital Health": {
    phases: ["Discovery", "Drafting", "Refinement", "Testing", "Finalization", "Support"]
  },
  "Public Health & Epidemiology": {
    phases: ["Discovery", "Drafting", "Refinement", "Finalization", "Support"]
  },
  "Health Coaching & Patient Support": {
    phases: ["Discovery", "Drafting", "Refinement", "Finalization"]
  },
  "Medical Administrative & Support Roles": {
    phases: ["Discovery", "Drafting", "Refinement", "Finalization"]
  },
  "Medical Illustration & Visualization": {
    phases: ["Discovery", "Drafting", "Refinement", "Finalization", "Support"]
  },
  "Medical Marketing & Consulting": {
    phases: ["Discovery", "Drafting", "Refinement", "Finalization", "Support"]
  },
  "AI & Tech in Healthcare": {
    phases: ["Discovery", "Drafting", "Refinement", "Testing", "Finalization", "Support"]
  },
  "Medical Education & Training": {
    phases: ["Discovery", "Drafting", "Refinement", "Finalization", "Support"]
  }
};

// Default phases if category is not found
export const DEFAULT_PHASES = ["Discovery", "Drafting", "Refinement", "Finalization"];

// Get phases for a given category
export const getPhasesForCategory = (category: string | null): string[] => {
  if (!category) return DEFAULT_PHASES;
  return PHASE_MAPPING[category]?.phases || DEFAULT_PHASES;
};
