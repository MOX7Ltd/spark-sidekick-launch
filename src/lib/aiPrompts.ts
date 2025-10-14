export const NAME_GEN_HINT = `
If the idea sounds like a service (verb + noun: mow lawns, paint houses, walk dogs),
generate names that fit local small business branding.
If it sounds like a digital or consulting business, adjust accordingly.
`;

export function inferBusinessType(idea: string): 'service' | 'product' | 'education' | 'general' {
  const lower = idea.toLowerCase();
  
  // Service indicators (verb-based activities)
  const serviceKeywords = [
    'mow', 'lawn', 'paint', 'clean', 'wash', 'repair', 'fix', 'install',
    'plumb', 'design', 'photograph', 'walk dogs', 'pet sit', 'babysit',
    'landscap', 'garden', 'handyman', 'electrician', 'carpentry',
    'massage', 'hairdress', 'barber', 'nail', 'spa', 'salon',
    'cater', 'chef', 'cook', 'bake', 'deliver', 'drive', 'moving',
    'event planning', 'wedding', 'party planning'
  ];
  
  // Education/coaching indicators
  const educationKeywords = [
    'teach', 'tutor', 'coach', 'mentor', 'train', 'course', 'lesson',
    'academy', 'school', 'workshop', 'seminar', 'class', 'instruct',
    'online course', 'learn', 'education', 'consulting', 'consult',
    'advise', 'advisor', 'guidance', 'help others learn'
  ];
  
  // Product indicators
  const productKeywords = [
    'sell', 'shop', 'store', 'ecommerce', 'product', 'goods',
    'merchandise', 'retail', 'wholesale', 'handmade', 'craft',
    'digital download', 'ebook', 'template', 'printable'
  ];
  
  // Check in priority order
  if (serviceKeywords.some(keyword => lower.includes(keyword))) {
    return 'service';
  }
  
  if (educationKeywords.some(keyword => lower.includes(keyword))) {
    return 'education';
  }
  
  if (productKeywords.some(keyword => lower.includes(keyword))) {
    return 'product';
  }
  
  return 'general';
}
