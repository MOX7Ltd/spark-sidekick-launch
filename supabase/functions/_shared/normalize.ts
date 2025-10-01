export interface NormalizedInput {
  vibes: string[];
  audiences: string[];
  products: string[];
  aboutYou: any;
  appliedDefaults: string[];
}

export function normalizeOnboardingInput(input: any): NormalizedInput {
  const appliedDefaults: string[] = [];
  
  let vibes = input.vibes;
  if (!vibes || !Array.isArray(vibes) || vibes.length === 0) {
    vibes = ['Friendly'];
    appliedDefaults.push('vibes');
  }
  
  let audiences = input.audiences;
  if (!audiences || !Array.isArray(audiences) || audiences.length === 0) {
    audiences = ['General'];
    appliedDefaults.push('audiences');
  }
  
  const products = Array.isArray(input.products) ? input.products : [];
  if (!input.products || input.products.length === 0) {
    appliedDefaults.push('products');
  }
  
  const aboutYou = input.aboutYou || {};
  if (!input.aboutYou) {
    appliedDefaults.push('aboutYou');
  }
  
  return {
    vibes,
    audiences,
    products,
    aboutYou,
    appliedDefaults
  };
}

export function shouldIncludeName(aboutYou: any): { includeFirst: boolean; includeLast: boolean; firstName?: string; lastName?: string } {
  const includeFirst = aboutYou?.includeFirstName === true && aboutYou?.firstName;
  const includeLast = aboutYou?.includeLastName === true && aboutYou?.lastName;
  
  return {
    includeFirst,
    includeLast,
    firstName: includeFirst ? aboutYou.firstName : undefined,
    lastName: includeLast ? aboutYou.lastName : undefined
  };
}
