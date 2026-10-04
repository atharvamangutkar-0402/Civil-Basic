// analysis.js – Node script (plain JavaScript) to compute dataset diversity metrics
const fs = require('fs');
const path = require('path');
const filePath = path.resolve('src/data/researchDataset.ts');
const content = fs.readFileSync(filePath, 'utf8');

// Helper: extract all message strings (msg = `...`)
const msgRegex = /msg\s*=\s*`([^`]+)`/g;
let match;
const messages = [];
while ((match = msgRegex.exec(content)) !== null) {
  messages.push(match[1]);
}

// Extract language for each message (assuming same order as messages array)
const lines = content.split('\n');
const langs = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/msg\s*=/.test(line)) {
    // Locate language within next few lines
    let lang = 'unknown';
    for (let j = i; j < i + 12 && j < lines.length; j++) {
      const m = lines[j].match(/language:\s*'(\w+)'/);
      if (m) { lang = m[1]; break; }
    }
    langs.push(lang);
  }
}

// Normalise a message to a template by replacing variable parts
function normalize(text) {
  return text
    .replace(/Skyline Residency Phase \d+/gi, '<PROJECT>')
    .replace(/\b\d+(?:\.\d+)?\b/g, '<NUM>')
    .replace(/\b(?:bags?|Bag|BAGS?|tons?|Bars?|bars?|cu(?:b|\.?)?\s*meter|cubic[_-]?meter|cubic[_-]?mtr)\b/gi, '<UNIT>')
    .replace(/\b(?:Jindal Steel|Ganesh Concrete|ACC Concrete|ABC Concrete|UltraTech Cement|Shree Traders|XYZ Agency|Star Construction Agency|XYZ Traders|XYZ Agency|Star Construction Agency)\b/gi, '<VENDOR>')
    .replace(/\b(?:today|tomorrow|yesterday)\b/gi, '<DATE>')
    .replace(/\b(?:cement|steel|sand|labour|workers|bags|quantity|rate|price)\b/gi, (m) => m.toLowerCase())
    .replace(/\s+/g, ' ') // collapse spaces
    .trim();
}

const templates = messages.map(normalize);
const uniqueTemplates = new Set(templates);
const totalRecords = messages.length;
const uniqueTemplateCount = uniqueTemplates.size;

// Count near-duplicate groups (templates occurring >1)
const tmplCounts = {};
templates.forEach(t => { tmplCounts[t] = (tmplCounts[t] || 0) + 1; });
let nearDuplicateGroups = 0;
Object.values(tmplCounts).forEach(cnt => { if (cnt > 1) nearDuplicateGroups++; });
const nearDuplicatePct = ((Object.values(tmplCounts).reduce((a,b)=>a+b,0) - uniqueTemplateCount) / totalRecords * 100).toFixed(2);

// Per-language unique pattern counts
const langPatternMap = {};
langs.forEach((lang, idx) => {
  const tmpl = templates[idx];
  if (!langPatternMap[lang]) langPatternMap[lang] = new Set();
  langPatternMap[lang].add(tmpl);
});
const perLanguage = {};
Object.entries(langPatternMap).forEach(([lang, set]) => { perLanguage[lang] = set.size; });

// Multi‑action analysis (category === 'multi_action')
const multiActionRegex = /category:\s*'multi_action'[^]*?groundTruth:\s*{[^]*?intents:\s*\[([^\]]+)\][^]*?actions:\s*\[([^\]]+)\]/g;
let multiCount = 0;
const actionCombos = new Set();
while ((match = multiActionRegex.exec(content)) !== null) {
  const intentsStr = match[1];
  const intents = intentsStr.split(',').map(s => s.trim().replace(/['\"]+/g, ''));
  const comboKey = intents.sort().join('|');
  actionCombos.add(comboKey);
  multiCount++;
}

// Quality issue heuristics
let spellingVariations = 0, abbreviations = 0, informalGrammar = 0, transliteration = 0, codeSwitching = 0, missingInfo = 0, ambiguousRefs = 0;
messages.forEach(msg => {
  const lower = msg.toLowerCase();
  if (/tmt/.test(lower)) spellingVariations++;
  if (/\b(?:rs|inr)\b/.test(lower)) abbreviations++;
  if (/\b(?:aale|zale|pahije|nashta|kharch|kade)\b/.test(lower)) informalGrammar++;
  if (/[\u0900-\u097F]/.test(msg)) transliteration++;
  if (/\b(?:english|marathi|marathi_english|informal)\b/.test(lower) && /\b(?:skyline|project)\b/.test(lower)) codeSwitching++; // crude
  if (/\b(?:missing|none|n\/a)\b/.test(lower)) missingInfo++;
  if (/\b(?:maybe|not sure|could be|or)\b/.test(lower)) ambiguousRefs++;
});

// Detect ground‑truth unit ambiguity (e.g., unit field contains "Tons/Bars")
const gtUnitRegex = /unit:\s*'([^']+)'/g;
let ambiguousUnitCount = 0;
while ((match = gtUnitRegex.exec(content)) !== null) {
  const unitVal = match[1];
  if (unitVal.includes('/') || unitVal.split(' ').length > 1) ambiguousUnitCount++;
}

const report = {
  totalRecords,
  uniqueTemplates: uniqueTemplateCount,
  nearDuplicateGroups,
  nearDuplicatePercentage: nearDuplicatePct + '%',
  perLanguage,
  multiAction: {
    count: multiCount,
    distinctCombinations: actionCombos.size,
    exampleCombinations: Array.from(actionCombos).slice(0,5)
  },
  qualityIssues: {
    spellingVariations,
    abbreviations,
    informalGrammar,
    transliteration,
    codeSwitching,
    missingInfo,
    ambiguousReferences: ambiguousRefs,
    ambiguousUnitCount
  }
};
console.log(JSON.stringify(report, null, 2));
