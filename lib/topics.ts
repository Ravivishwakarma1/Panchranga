export const TOPIC_SECTIONS = [
  'Politics',
  'Courts & Law',
  'Economy',
  'Environment',
  'Technology',
  'Sports',
  'Health',
  'Fact-Check',
  'Discourse & Civic',
  'UP & Bihar',
  'Maharashtra',
  'South India',
];

export const TOPIC_KEYWORDS: Record<string, string[]> = {
  Politics: [
    // English
    'election', 'bjp', 'congress', 'modi', 'rahul gandhi',
    'parliament', 'minister', 'party', 'vote', 'cabinet', 'lok sabha', 'rajya sabha',
    // Hindi
    'चुनाव', 'सरकार', 'नेता', 'विधानसभा', 'राजनीति', 'मंत्री', 'संसद', 'भाजपा', 'कांग्रेस', 'पीएम मोदी',
    // Marathi  
    'निवडणूक', 'सरकार', 'आमदार', 'खासदार', 'मुख्यमंत्री', 'महायुती', 'महाविकास', 'पवार',
    // Malayalam
    'സർക്കാർ', 'തിരഞ്ഞെടുപ്പ്', 'മന്ത്രി',
    // Telugu
    'ఎన్నికలు', 'రాజకీయాలు', 'ప్రభుత్వం', 'మంత్రి',
    // Tamil
    'தேர்தல்', 'அரசியல்', 'அமைச்சர்', 'முதல்வர்',
    // Gujarati
    'ચૂંટણી', 'સરકાર', 'રાજકારણ', 'મંત્રી',
    // Common names/parties
    'shinde', 'fadnavis', 'thackeray', 
    'mva', 'nda', 'aap', 'dmk', 'aiadmk',
    'jarange', 'जरांगे', 'काँग्रेस'
  ],
  'Courts & Law': [
    'court', 'judge', 'verdict', 'fir', 'police', 'cbi', 'ed',
    'arrested', 'bail', 'supreme court', 'high court', 'sc hearing', 'cji',
    'न्यायालय', 'कोर्ट', 'न्यायाधीश', 'अटक', 'जामीन', 'सुप्रीम कोर्ट', 'हाईकोर्ट',
    'हायकोर्ट', 'सर्वोच्च', 'तलवार', 'अपात्र', 'निकाल', 'कोടതി', 'ശിക്ഷ',
    'తీర్పు', 'కోర్టు', 'நீதிமன்றம்', 'કોર્ટ'
  ],
  Economy: [
    'economy', 'gdp', 'rbi', 'inflation', 'bank', 'market', 'sensex', 'nifty',
    'tax', 'rupee', 'budget', 'growth', 'finance', 'chip', 'stocks', 'trade',
    'अर्थव्यवस्था', 'शेयर बाजार', 'बजट', 'आर्थिक', 'बँक', 'महागाई', 'రిజర్వ్ బ్యాంక్'
  ],
  Environment: [
    'flood', 'drought', 'rain', 'climate', 'pollution', 'river', 'forest', 'monsoon', 'water',
    'बाढ़', 'सूखा', 'पाऊस', 'दुष्काळ', 'टंचाई', 'पूर', 'उपशा', 'विहीर', 'पाणी', 'जल', 'पर्यावरण',
    'വായുമലിനീകരണം', 'മഴ', 'వర్షం'
  ],
  Technology: [
    'technology', 'tech', 'ai', 'artificial intelligence', 'isro', 'space',
    'satellite', 'cyber', 'software', 'chip', 'semiconductor', 'gadgets',
    'smartphone', 'google', 'apple', 'microsoft', 'चंद्रयान', 'इसरो'
  ],
  Sports: [
    'cricket', 'ipl', 'bcci', 'test match', 'odi', 't20', 'wicket', 'century',
    'football', 'fifa', 'hockey', 'olympics', 'medal', 'asian games', 'badminton',
    'विराट', 'रोहित', 'क्रिकेट', 'सामना', 'खेळ'
  ],
  Health: [
    'hospital', 'disease', 'doctor', 'health', 'death', 'dead', 'killed',
    'accident', 'patient', 'virus', 'vaccine', 'medical', 'medicine',
    'अस्पताल', 'डॉक्टर', 'मृत्यू', 'रुग्णालय', 'आरोग्य', 'മരണം', 'ആശുപത്രി'
  ],
  'Fact-Check': [
    'fact check', 'fact-check', 'claim', 'fake news', 'viral video', 'misleading',
    'debunked', 'दावा', 'फैक्ट चेक', 'अफवाह', 'सत्यता', 'पड़ताल'
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
    'കേരള', 'മലയാള', 'ఆంధ్రప్రదేశ్', 'తెలంగాణ'
  ],
  'UP & Bihar': [
    'up', 'uttar pradesh', 'bihar', 'lucknow', 'patna', 'varanasi', 'prayagraj', 'kanpur', 'बिहार', 'उत्तर प्रदेश', 'योगी'
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
      international: 'International',
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

export function getCategoryAndRegion(
  title: string,
  sourceRegion?: string,
  sourceLane?: string,
  sourceName?: string
): { topic: string; region: string } {
  const lower = title.toLowerCase();
  const sName = (sourceName || '').toLowerCase();

  // 1. Fact Checkers priority
  if (
    sName.includes('alt news') ||
    sName.includes('boom live') ||
    sName.includes('factly') ||
    sName.includes('newschecker')
  ) {
    return { topic: 'Fact-Check', region: getRegionFromHub({ title }, sourceRegion) };
  }

  // 2. Keyword match
  let topic = 'General';
  for (const [top, kws] of Object.entries(TOPIC_KEYWORDS)) {
    if (kws.some((kw) => lower.includes(kw.toLowerCase()))) {
      topic = top;
      break;
    }
  }

  // 3. Discourse / Civic fallback
  if (topic === 'General' && sourceLane === 'discourse') {
    topic = 'Discourse & Civic';
  }

  const region = getRegionFromHub({ title }, sourceRegion);
  return { topic, region };
}

