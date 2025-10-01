export interface NormalizedInput {
  idea: string;
  vibes: string[];
  audiences: string[];
  products: any[];
  aboutYou: {
    firstName: string;
    lastName: string;
    expertise: string;
    motivation?: string;
    includeFirstName: boolean;
    includeLastName: boolean;
  };
  bannedWords: string[];
  rejectedNames: string[];
  regenerateNamesOnly: boolean;
  appliedDefaults: string[];
}

export function normalizeOnboardingInput(input: any): NormalizedInput {
  const appliedDefaults: string[] = [];
  
  // Handle backwards compat: audience (single string) → audiences[]
  let audiences = Array.isArray(input.audiences)
    ? input.audiences
    : (input.audience ? [input.audience] : null);
  
  if (!audiences || audiences.length === 0) {
    audiences = ['General'];
    appliedDefaults.push('audiences');
  }
  
  // Handle backwards compat: tone (single string) → vibes[]
  let vibes = Array.isArray(input.vibes)
    ? input.vibes
    : (input.tone ? [input.tone] : (input.styleCategory ? [input.styleCategory] : null));
  
  if (!vibes || vibes.length === 0) {
    vibes = ['friendly'];
    appliedDefaults.push('vibes');
  }
  
  // Products
  const products = Array.isArray(input.products) ? input.products : [];
  if (!input.products || input.products.length === 0) {
    appliedDefaults.push('products');
  }
  
  // AboutYou normalization
  const aboutYou = input.aboutYou ?? {
    firstName: input.firstName ?? "",
    lastName: input.lastName ?? "",
    expertise: input.experience ?? input.expertise ?? "",
    motivation: input.motivation ?? "",
    includeFirstName: input.includeFirstName ?? false,
    includeLastName: input.includeLastName ?? false,
  };
  
  if (!input.aboutYou) {
    appliedDefaults.push('aboutYou');
  }
  
  // Name preferences
  const bannedWords = Array.isArray(input.bannedWords) ? input.bannedWords : [];
  const rejectedNames = Array.isArray(input.rejectedNames) ? input.rejectedNames : [];
  
  // Add unchecked name parts to bannedWords
  if (!aboutYou.includeFirstName && aboutYou.firstName) {
    bannedWords.push(...aboutYou.firstName.split(/\s+/));
  }
  if (!aboutYou.includeLastName && aboutYou.lastName) {
    bannedWords.push(...aboutYou.lastName.split(/\s+/));
  }
  
  return {
    idea: input.idea ?? "",
    vibes,
    audiences,
    products,
    aboutYou,
    bannedWords,
    rejectedNames,
    regenerateNamesOnly: input.regenerateNamesOnly ?? false,
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
