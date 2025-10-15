// Session and trace management
const STORAGE_KEYS = {
  SESSION_ID: 'sidehive_session_id',
  FORM_STATE: 'sidehive_form_state',
  STEP_STATE: 'sidehive_step_state',
  SELECTED_GENERATIONS: 'sidehive_selected_generation_ids',
  DRAFT_BUSINESS_ID: 'sidehive_draft_business_id',
  CONTEXT: 'sidehive_context',
};

export function getSessionId(): string {
  const params = new URLSearchParams(window.location.search);
  let sessionId = params.get('sid') || localStorage.getItem(STORAGE_KEYS.SESSION_ID);
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
    
    // Update URL with session ID
    const newParams = new URLSearchParams(window.location.search);
    newParams.set('sid', sessionId);
    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }
  
  return sessionId;
}

// Onboarding state management
export interface OnboardingFormState {
  idea?: any;
  aboutYou?: any;
  vibes?: string[];
  audiences?: string[];
  businessIdentity?: any;
  products?: any[];
  generatedPosts?: any[];
}

export function saveFormState(formData: OnboardingFormState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FORM_STATE, JSON.stringify(formData));
  } catch (error) {
    console.error('Failed to save form state:', error);
  }
}

export function getFormState(): OnboardingFormState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FORM_STATE);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get form state:', error);
    return null;
  }
}

export function saveStepState(step: string | number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STEP_STATE, String(step));
  } catch (error) {
    console.error('Failed to save step state:', error);
  }
}

export function getStepState(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.STEP_STATE);
  } catch (error) {
    console.error('Failed to get step state:', error);
    return null;
  }
}

export function saveSelectedGenerations(generationIds: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_GENERATIONS, JSON.stringify(generationIds));
  } catch (error) {
    console.error('Failed to save selected generations:', error);
  }
}

export function getSelectedGenerations(): string[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SELECTED_GENERATIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get selected generations:', error);
    return [];
  }
}

export function saveDraftBusinessId(businessId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DRAFT_BUSINESS_ID, businessId);
  } catch (error) {
    console.error('Failed to save draft business ID:', error);
  }
}

export function getDraftBusinessId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.DRAFT_BUSINESS_ID);
  } catch (error) {
    console.error('Failed to get draft business ID:', error);
    return null;
  }
}

export function saveContext(context: any): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONTEXT, JSON.stringify(context));
  } catch (error) {
    console.error('Failed to save context:', error);
  }
}

export function getContext(): any {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CONTEXT);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get context:', error);
    return null;
  }
}

export function clearOnboardingState(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Failed to clear onboarding state:', error);
  }
}

export function generateTraceId(): string {
  // Generate nanoid-style ID (10 chars, URL-safe)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 10; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

export function getTelemetryHeaders(): Record<string, string> {
  return {
    'X-Session-Id': getSessionId(),
    'X-Trace-Id': generateTraceId(),
    'X-Env': import.meta.env.MODE || 'production',
  };
}
