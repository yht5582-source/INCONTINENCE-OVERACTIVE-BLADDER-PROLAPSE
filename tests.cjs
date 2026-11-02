const assert = require('assert');
const PF = require('./app.js');
let n = 0; const t = (name, fn) => { fn(); n++; };
const has = (r, part, re) => assert(r[part].some(s => re.test(s.text)), `${part} missing ${re}`);
const srcs = r => ['assess', 'first', 'next', 'caution'].flatMap(k => r[k].map(s => s.src)).join(' ');

t('stress initial → PFMT 3 months, digital check, no surgery yet', () => {
  const r = PF.pathway({ symptom: 'stress' });
  assert.equal(r.tone, 'ok'); has(r, 'first', /至少 3 個月/); has(r, 'assess', /指診/); assert.equal(r.next.length, 0);
});
t('stress persistent → surgery options + urodynamics rule + mesh counselling', () => {
  const r = PF.pathway({ symptom: 'stress', phase: 'conservative' });
  assert.equal(r.tone, 'warn'); has(r, 'next', /colposuspension/); has(r, 'next', /不需常規尿動力學/); has(r, 'next', /永久植入物/); has(r, 'caution', /前陰道壁修補/);
});
t('mixed unknown → direct to predominant, both trainings', () => {
  const r = PF.pathway({ symptom: 'mixed', predominant: 'unknown' });
  has(r, 'first', /3 個月.*6 週/); has(r, 'caution', /尿動力學/);
});
t('mixed stress-predominant adds bladder training', () => { has(PF.pathway({ symptom: 'mixed', predominant: 'stress' }), 'first', /6 週膀胱訓練/); });
t('mixed urge-predominant → OAB route with PFMT', () => {
  const r = PF.pathway({ symptom: 'mixed', predominant: 'urge' });
  assert.match(r.type, /急迫主導/); has(r, 'first', /骨盆底肌訓練/);
});
t('urge initial → bladder training 6 weeks, caffeine, no drugs listed yet', () => {
  const r = PF.pathway({ symptom: 'urge' });
  has(r, 'first', /6 週/); has(r, 'first', /咖啡因/); assert.equal(r.next.length, 0);
});
t('urge conservative → drugs + 4-week review, dementia caution', () => {
  const r = PF.pathway({ symptom: 'urge', phase: 'conservative' });
  has(r, 'next', /β3/); has(r, 'next', /4 週/); has(r, 'caution', /失智/);
});
t('urge medication failure → NICE vs AUA minimally invasive + CISC', () => {
  const r = PF.pathway({ symptom: 'urge', phase: 'medication' });
  assert.equal(r.tone, 'warn'); has(r, 'next', /^AUA/); has(r, 'next', /^NICE.*100 U/); has(r, 'next', /自我導尿/); has(r, 'caution', /transcutaneous/);
});
t('modifiers: nocturia, >75, cognitive, gsm, bmi', () => {
  const r = PF.pathway({ symptom: 'urge', mods: ['nocturia', 'over75', 'cognitive', 'gsm', 'bmi'] });
  has(r, 'caution', /desmopressin/); has(r, 'caution', /6 個月/); has(r, 'caution', /失智指引/); has(r, 'first', /陰道雌激素/); has(r, 'first', /減重/);
});
t('red flags keep pathway but force alert tone', () => {
  const r = PF.pathway({ symptom: 'urge', flags: ['haematuria', 'voiding'] });
  assert.equal(r.tone, 'alert'); assert.equal(r.flags.length, 2); assert(r.first.length > 0); has(r, 'assess', /殘尿/);
});
t('unknown flag ignored', () => { assert.equal(PF.pathway({ symptom: 'stress', flags: ['bogus'] }).flags.length, 0); });
t('prolapse unknown → POP-Q first, no urine dipstick unless urinary', () => {
  const r = PF.pathway({ symptom: 'prolapse' });
  assert.match(r.title, /POP-Q/); assert(!r.assess.some(s => /試紙/.test(s.text)));
  assert(PF.pathway({ symptom: 'prolapse', mods: ['popUrinary'] }).assess.some(s => /試紙/.test(s.text)));
});
t('prolapse stage 2 → 16 weeks + pessary 6-month removal, no surgery at initial', () => {
  const r = PF.pathway({ symptom: 'prolapse', pop: '2' });
  has(r, 'first', /16 週/); has(r, 'first', /每 6 個月/); assert.equal(r.next.length, 0);
});
t('prolapse stage 3 → no PFMT-first, surgery discussion, occult SUI', () => {
  const r = PF.pathway({ symptom: 'prolapse', pop: '3' });
  assert(!r.first.some(s => /16 週/.test(s.text))); has(r, 'next', /手術/); has(r, 'caution', /潛在性 SUI/); assert.equal(r.tone, 'warn');
});
t('prolapse persistent stage 1 → surgery offered', () => { has(PF.pathway({ symptom: 'prolapse', pop: '1', phase: 'conservative' }), 'next', /手術/); });
t('every step carries a source', () => {
  for (const s of ['stress', 'urge', 'mixed', 'prolapse']) for (const ph of ['initial', 'conservative', 'medication']) {
    const r = PF.pathway({ symptom: s, phase: ph, pop: '2', predominant: 'urge', mods: ['cognitive', 'nocturia', 'gsm', 'bmi', 'over75', 'popUrinary'] });
    ['assess', 'first', 'next', 'caution'].forEach(k => r[k].forEach(x => assert(x.src && x.text, `${s}/${ph}/${k}`)));
    assert(r.sources.length && r.sources.every(x => x.href));
  }
});
t('POP-Q staging boundaries', () => {
  const s = (l, tvl = 9, c = 'anterior') => PF.popqStage(l, tvl, c).stage;
  assert.equal(s(-3), 0); assert.equal(s(-2), 1); assert.equal(s(-1), 2); assert.equal(s(1), 2); assert.equal(s(1.5), 3);
  assert.equal(s(6.5), 3); assert.equal(s(7), 4); assert.equal(s(-7, 9, 'apical'), 0); assert.equal(s(-5, 9, 'apical'), 1);
  assert.equal(PF.popqStage(0, 2).stage, null);
});
t('full cases: three, each stage has question and sourced steps', () => {
  assert.equal(PF.FULL.length, 3);
  PF.FULL.forEach(c => c.stages.forEach(s => { assert(s.label && s.q); assert(s.steps.length >= 3); s.steps.forEach(x => assert(x[0] && x[1], c.id + s.label)); }));
});
t('full cases: loaded presets give what the case teaches (cross-check with engine)', () => {
  PF.FULL.forEach(c => c.stages.filter(s => s.preset).forEach(s => {
    const r = PF.pathway(s.preset);
    const all = ['assess', 'first', 'next', 'caution'].flatMap(k => r[k].map(x => x.text)).join(' ');
    assert(s.expect && all.includes(s.expect), `${c.id}/${s.label} missing ${s.expect}`);
    assert.equal(r.flags.length, 0);
  }));
});
t('full case C: POP-Q values give stated stage', () => {
  const p = PF.FULL.find(c => c.popq).popq;
  assert.equal(PF.popqStage(p.lead, p.tvl, p.comp).stage, p.stage);
  assert.equal(p.stage, 3);
});
t('mind map: five branches, every leaf sourced', () => {
  assert.equal(PF.MAP.length, 5);
  PF.MAP.forEach(b => b.groups.forEach(g => { assert(g.items.length); g.items.forEach(x => assert(x[0] && x[1], b.id + g.t)); }));
});
t('teaching data cites only known guidelines', () => {
  const re = /^(NICE|AUA|IUGA|本頁)/;
  PF.FULL.forEach(c => c.stages.forEach(s => s.steps.forEach(x => assert(re.test(x[1]), x[1]))));
  PF.MAP.forEach(b => b.groups.forEach(g => g.items.forEach(x => assert(re.test(x[1]), x[1]))));
});
console.log(`${n} tests passed`);
