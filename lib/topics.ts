export const TOPIC_SECTIONS = [
  'Politics',
  'Courts & Law',
  'Environment',
  'Economy',
  'UP & Bihar',
  'Maharashtra',
];

export const TOPIC_KEYWORDS: Record<string, string[]> = {
  Politics: [
    // English
    'election', 'bjp', 'congress', 'modi', 
    'parliament', 'minister', 'party', 'vote',
    // Hindi
    'चुनाव', 'सरकार', 'नेता', 'विधानसभा',
    'राजनीति', 'मंत्री', 'संसद',
    // Marathi  
    'निवडणूक', 'सरकार', 'आमदार', 'खासदार',
    'मुख्यमंत्री', 'महायुती', 'महाविकास',
    // Malayalam
    'സർക്കാർ', 'തിരഞ്ഞെടുപ്പ്', 'മന്ത്രി',
    // Common names/parties
    'shinde', 'fadnavis', 'thackeray', 
    'mva', 'nda', 'aap', 'dmk', 'aiadmk',
    'jarange', 'जरांगे', 'काँग्रेस'
  ],
  'Courts & Law': [
    'court', 'judge', 'verdict', 'fir', 
    'arrested', 'bail', 'supreme court',
    'high court', 'न्यायालय', 'कोर्ट',
    'न्यायाधीश', 'अटक', 'जामीन',
    'हायकोर्ट', 'सर्वोच्च', 'तलवार',
    'अपात्र', 'निकाल', 'कोടതി', 'ശിക്ഷ',
    'गर्भपात', 'आव्हान', 'न्यायालयाचा'
  ],
  Environment: [
    'flood', 'drought', 'rain', 'climate',
    'बाढ़', 'सूखा', 'पाऊस', 'दुष्काळ',
    'टंचाई', 'पूर', 'उपशा', 'विहीर',
    'monsoon', 'water', 'पाणी', 'जल',
    'pollution', 'river', 'forest'
  ],
  Maharashtra: [
    'maharashtra', 'mumbai', 'pune', 'nagpur',
    'महाराष्ट्र', 'मुंबई', 'पुणे', 'नागपूर',
    'मराठा', 'maratha', 'obc', 'lokmat',
    'जरांगे', 'ठाकरे', 'शिंदे', 'फडणवीस',
    'विदर्भ', 'कोकण', 'मराठवाडा'
  ],
  'South India': [
    'tamil nadu', 'kerala', 'karnataka',
    'andhra', 'telangana', 'chennai',
    'bangalore', 'bengaluru', 'hyderabad', 'dmk',
    'stalin', 'mathrubhumi', 'onmanorama',
    // Malayalam words
    'കേരള', 'മലയാള', 'കോടതി'
  ],
  Health: [
    'hospital', 'disease', 'doctor', 
    'health', 'death', 'dead', 'killed',
    'accident', 'അപകടം', 'മരണം',
    'मृत्यू', 'रुग्णालय', 'आरोग्य'
  ],
  Economy: [
    'economy', 'gdp', 'rbi', 'inflation', 'bank', 'market',
    'tax', 'rupee', 'budget', 'growth', 'finance', 'chip'
  ],
  'UP & Bihar': [
    'up', 'uttar pradesh', 'bihar', 'lucknow', 'patna', 'varanasi', 'prayagraj', 'kanpur', 'बिहार', 'उत्तर प्रदेश'
  ],
};

export function getRegionFromHub(hub: { title?: string }, sourceRegion?: string): string {
  if (sourceRegion && sourceRegion !== 'national') {
    const regionMap: Record<string, string> = {
      maharashtra: 'Maharashtra',
      kerala: 'Kerala',
      'tamil-nadu': 'Tamil Nadu',
      karnataka: 'Karnataka',
      'west-bengal': 'West Bengal',
      gujarat: 'Gujarat',
      punjab: 'Punjab',
      bihar: 'Bihar',
      delhi: 'New Delhi',
      'uttar-pradesh': 'Uttar Pradesh',
    };
    if (regionMap[sourceRegion]) return regionMap[sourceRegion];
  }

  // Fallback: keyword check on title
  const title = (hub.title || '').toLowerCase();
  if (
    title.includes('maharashtr') ||
    title.includes('mumbai') ||
    title.includes('pune') ||
    title.includes('नागपूर') ||
    title.includes('मुंबई') ||
    title.includes('महाराष्ट्र') ||
    title.includes('ठाकरे') ||
    title.includes('शिंदे') ||
    title.includes('जरांगे')
  ) {
    return 'Maharashtra';
  }
  if (
    title.includes('kerala') ||
    title.includes('malayal') ||
    title.includes('കേരള')
  ) {
    return 'Kerala';
  }
  if (
    title.includes('tamil') ||
    title.includes('chennai') ||
    title.includes('stalin')
  ) {
    return 'Tamil Nadu';
  }
  if (
    title.includes('karnataka') ||
    title.includes('bengaluru') ||
    title.includes('bangalore')
  ) {
    return 'Karnataka';
  }
  if (
    title.includes('bihar') ||
    title.includes('बिहार') ||
    title.includes('patna')
  ) {
    return 'Bihar';
  }
  if (
    title.includes('delhi') ||
    title.includes('parliament') ||
    title.includes('supreme court') ||
    title.includes('सर्वोच्च')
  ) {
    return 'New Delhi';
  }

  return 'India';
}

export function getCategoryAndRegion(title: string, sourceRegion?: string): { topic: string; region: string } {
  const lower = title.toLowerCase();
  let topic = 'General';

  for (const [top, kws] of Object.entries(TOPIC_KEYWORDS)) {
    if (kws.some((kw) => lower.includes(kw.toLowerCase()))) {
      topic = top;
      break;
    }
  }

  const region = getRegionFromHub({ title }, sourceRegion);
  return { topic, region };
}
