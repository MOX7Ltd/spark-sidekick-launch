/**
 * Product and Idea Lab types for the assist-and-upload model
 */

export type ProductType = 'digital' | 'course' | 'service' | 'physical';
export type ProductStatus = 'draft' | 'published';
export type GenerationSource = 'ai-auto' | 'manual' | 'idea-lab';

export interface IdeaCard {
  title: string;
  type: ProductType;
  promise: string;
  who: string;
  what_to_upload: string[];
  listing_copy: {
    subtitle: string;
    benefits: string[];
    faq: string[];
    seo_keywords: string[];
  };
  price_band: {
    low: number;
    mid: number;
    high: number;
  };
  fulfillment_notes: string;
  risk_flags: ('claims' | 'regulated' | 'shipping' | 'returns')[];
  next_step_checklist: string[];
  score: {
    effort: number;
    value: number;
    fit: number;
  };
}

export interface FulfillmentSpec {
  digital: {
    files: string[];
    external_links: string[];
  };
  course: {
    syllabus: string[];
    lessons: Array<{ title: string; url: string }>;
  };
  service: {
    scope: string;
    intake_url: string;
    booking_url?: string;
    delivery_sla_days: number;
  };
  physical: {
    photos: string[];
    options: string[];
    weight_grams: number | null;
    shipping_profile_id: string | null;
  };
}

export interface Product {
  id: string;
  user_id: string;
  title: string;
  // subtitle?: string;  // NOT IN DB - combine into description
  description: string;
  // description_md?: string;  // NOT IN DB
  // audience?: string;  // NOT IN DB
  type?: ProductType;
  status?: ProductStatus;
  generation_source?: GenerationSource;
  
  price?: number;  // Numeric in DB
  // price_cents?: number;  // NOT IN DB
  // currency?: string;  // NOT IN DB
  
  visible: boolean;
  
  // media?: string[];  // NOT IN DB
  // tags?: string[];  // NOT IN DB
  
  fulfillment?: Partial<FulfillmentSpec[ProductType]>;
  
  // seo?: {  // NOT IN DB
  //   keywords: string[];
  //   excerpt: string;
  // };
  
  // Legacy fields
  format?: string;
  asset_url?: string;
  asset_status?: string;
  asset_version?: number;
  legacy_pdf_url?: string;
  
  created_at: string;
  updated_at: string;
}

export interface IdeaLab {
  id: string;
  owner_id: string;
  input_text: string;
  ideas_json: IdeaCard[];
  created_at: string;
}

// Fulfillment spec for validation and checklist generation (not a type export)
export const FULFILLMENT_SPEC: Record<ProductType, { required: string[]; shape: any }> = {
  digital: {
    required: ['files', 'external_links'],
    shape: { files: [], external_links: [] }
  },
  course: {
    required: ['syllabus', 'lessons'],
    shape: { syllabus: [], lessons: [] }
  },
  service: {
    required: ['scope', 'intake_url'],
    shape: { scope: '', intake_url: '', booking_url: '', delivery_sla_days: 7 }
  },
  physical: {
    required: ['photos'],
    shape: { photos: [], options: [], weight_grams: null, shipping_profile_id: null }
  }
} as const;
