#!/usr/bin/env node
import fs from 'node:fs/promises';
import fss from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'tablet', width: 768, height: 1024, mobile: false },
  { name: 'mobile', width: 375, height: 812, mobile: true },
];

const CATEGORIES = {
  hero: { label: 'Hero / First Impression', max: 15 },
  services: { label: 'Leistungen / Substanz', max: 10 },
  trust: { label: 'Vertrauen / Proof', max: 15 },
  conversion: { label: 'Conversion / CTA', max: 20 },
  mobile: { label: 'Mobile UX', max: 15 },
  images: { label: 'Bilder / Authentizität', max: 10 },
  copy: { label: 'Copy / Natürlichkeit', max: 10 },
  technical: { label: 'Technik / Hygiene', max: 5 },
};

// Output language: English by default. Use --lang de (or WQS_LANG=de) for the original German texts.
let LANG = process.env.WQS_LANG === 'de' ? 'de' : 'en';
const DE_EN = [
  // blockers
  [/Keine H1 gefunden\./g, 'No H1 found.'],
  [/Kein klarer Kontaktweg gefunden\./g, 'No clear way to contact the business found.'],
  [/(\d+) tote oder leere Links, darunter möglicherweise CTAs\./g, '$1 dead or empty links, possibly including calls to action.'],
  [/Mobile horizontaler Scroll erkannt\./g, 'Horizontal scroll detected on mobile.'],
  [/Kontaktformular ohne erkennbaren Fallback oder alternative Kontaktmöglichkeit\./g, 'Contact form without a visible fallback or alternative way to contact.'],
  [/Placeholder\/interne Labels erkannt: /g, 'Placeholder/internal labels found: '],
  [/(\d+) AI-generierte Dateinamen sichtbar\./g, '$1 AI-generated file names visible.'],
  [/(\d+) interne HTTP-Links liefern Fehlerstatus\./g, '$1 internal links return an error status.'],
  [/(\d+) kaputte Bilder\./g, '$1 broken images.'],
  // improvements
  [/Lokalen Bezug im Hero oder Kontaktbereich sichtbarer machen\./g, 'Make the local reference more visible in the hero or contact area.'],
  [/FAQ mit echten Einwänden ergänzen\./g, 'Add an FAQ that answers real objections.'],
  [/Optional: mobilen Floating-Call-Button ergänzen\./g, 'Optional: add a floating call button on mobile.'],
  [/LocalBusiness JSON-LD ergänzen\./g, 'Add LocalBusiness JSON-LD.'],
  [/prefers-reduced-motion für Animationen ergänzen\./g, 'Add prefers-reduced-motion handling for animations.'],
  [/CSS `transition: all` vermeiden, gezielt transform\/opacity animieren\./g, 'Avoid CSS `transition: all`; animate transform/opacity specifically.'],
  [/Pure #000\/#fff durch getönte Neutrals ersetzen\./g, 'Replace pure #000/#fff with tinted neutrals.'],
  [/(\d+) Bilder ohne alt-Attribut ergänzen\./g, 'Add alt text to $1 images.'],
  [/(\d+) kleine mobile Tap Targets prüfen\./g, 'Check $1 small mobile tap targets.'],
  [/(\d+) Linkcheck-Warnungen manuell prüfen\./g, 'Check $1 link-check warnings manually.'],
  [/Lighthouse Performance (\d+)\/100 prüfen: meist große Bilder, Canvas\/Animationen oder blockierendes JavaScript\./g, 'Check Lighthouse performance ($1/100): usually large images, canvas/animations or blocking JavaScript.'],
  [/Lighthouse Accessibility (\d+)\/100 verbessern\./g, 'Improve Lighthouse accessibility ($1/100).'],
  [/Lighthouse SEO (\d+)\/100 verbessern\./g, 'Improve Lighthouse SEO ($1/100).'],
  // strengths
  [/Hero hat klare H1 und CTA im ersten Viewport\./g, 'Hero has a clear H1 and a CTA in the first viewport.'],
  [/Bildbasis\/Galerie vorhanden und lädt fehlerfrei\./g, 'Image base/gallery present and loads without errors.'],
  [/Direkte Kontakt-CTA vorhanden\./g, 'Direct contact call to action present.'],
  [/Lokales strukturiertes Schema vorhanden\./g, 'Local structured data present.'],
  [/Copy ohne offensichtliche AI-\/Platzhalter-Tells\./g, 'Copy without obvious AI/placeholder tells.'],
  [/HTTP-Linkcheck ohne Fehlerstatus\./g, 'HTTP link check without error status.'],
  [/Lighthouse Accessibility\/SEO im grünen Bereich\./g, 'Lighthouse accessibility/SEO in the green.'],
  [/Seite hinter Bot-Schutz oder Browser-Prüfung; die echte Website wurde nicht bewertet\./g, 'Page is behind bot protection or a browser check; the real site was not assessed.'],
  [/Nicht bewertet: Seite durch Bot-Schutz blockiert\./g, 'Not assessed: page blocked by bot protection.'],
  // delivery
  [/Nicht ausliefern, Blocker zuerst beheben\./g, 'Do not deliver; fix the blockers first.'],
  [/Vorzeigbar, kleinere Verbesserungen möglich\./g, 'Presentable; minor improvements possible.'],
  [/Vor Kundenvorlage verbessern\./g, 'Improve before showing to a client.'],
  // feature matrix
  [/H1 vorhanden/g, 'H1 present'], [/(\d+) H1 gefunden/g, '$1 H1 found'], [/„|“/g, '"'],
  [/Klarer lokaler Bezug/g, 'Clear local anchor'], [/Ort\/Region sichtbar/g, 'Place/region visible'], [/Kein klarer Ortsbezug erkannt/g, 'No clear local reference found'],
  [/CTA im ersten Viewport/g, 'CTA in first viewport'], [/Handlungsaufforderung oben sichtbar/g, 'Call to action visible above the fold'], [/Kein klarer CTA im ersten Viewport erkannt/g, 'No clear CTA in the first viewport'],
  [/Telefon-Link/g, 'Phone link'], [/tel: vorhanden/g, 'tel: link present'], [/kein tel: Link/g, 'no tel: link'],
  [/WhatsApp vorhanden/g, 'WhatsApp present'], [/nicht vorhanden/g, 'not present'],
  [/(\d+) Formular\(e\), Labels ok/g, '$1 form(s), labels ok'], [/(\d+) Formular\(e\), Labels prüfen/g, '$1 form(s), labels need checking'], [/kein Formular/g, 'no form'],
  [/Formular-Fallback/g, 'Form fallback'], [/Fallback\/Alternative erkennbar/g, 'fallback/alternative found'], [/Formular ohne erkennbare Alternative/g, 'form without a visible alternative'],
  [/FAQ\/Fragenbereich erkennbar/g, 'FAQ section found'], [/kein FAQ erkannt/g, 'no FAQ found'],
  [/Galerie\/Projekte\/Bildstrecke/g, 'Gallery/projects/image set'], [/(\d+) Bilder\b/g, '$1 images'],
  [/Typen: /g, 'Types: '], [/nicht erkannt/g, 'not detected'], [/kein Schema/g, 'no schema'],
  [/lokales Schema vorhanden/g, 'local schema present'],
  [/(\d+) kaputte Bilder/g, '$1 broken images'], [/(\d+) tote\/leere Links/g, '$1 dead/empty links'],
  [/Mobile horizontaler Scroll/g, 'Mobile horizontal scroll'], [/kein horizontaler Scroll/g, 'no horizontal scroll'],
  [/mobiler Call-Button erkannt/g, 'mobile call button found'], [/prefers-reduced-motion vorhanden/g, 'prefers-reduced-motion present'], [/nicht gefunden/g, 'not found'],
  [/Animationen \/ Effekte/g, 'Animations / effects'], [/@keyframes gefunden/g, '@keyframes found'],
  [/Impeccable CSS-Bans/g, 'CSS anti-patterns'], [/keine Treffer/g, 'no matches'], [/AI-\/Placeholder-Tells/g, 'AI/placeholder tells'], [/AI-Dateinamen/g, 'AI file names'],
  [/HTTP-Linkcheck/g, 'HTTP link check'], [/(\d+) geprüft, (\d+) kaputt, (\d+) Warnungen/g, '$1 checked, $2 broken, $3 warnings'],
  [/Kontaktformular/g, 'Contact form'],
  // category labels
  [/Leistungen \/ Substanz/g, 'Services / Substance'], [/Vertrauen \/ Proof/g, 'Trust / Proof'], [/Bilder \/ Authentizität/g, 'Images / Authenticity'],
  [/Copy \/ Natürlichkeit/g, 'Copy / Naturalness'], [/Technik \/ Hygiene/g, 'Technical hygiene'],
  // report
  [/\*\*Ziel:\*\*/g, '**Target:**'], [/\*\*Datum:\*\*/g, '**Date:**'], [/## Ergebnis/g, '## Result'], [/\*\*Gesamt:\*\*/g, '**Total:**'], [/\*\*Urteil:\*\*/g, '**Verdict:**'], [/\*\*Lieferstatus:\*\*/g, '**Delivery status:**'],
  [/\| Bereich \| Score \| Max \|/g, '| Area | Score | Max |'], [/## Blocker\n/g, '## Blockers\n'], [/- Keine\./g, '- None.'], [/## Wichtigste Verbesserungen/g, '## Top improvements'],
  [/- Keine dringenden Verbesserungen\./g, '- No urgent improvements.'], [/## Stärken/g, '## Strengths'], [/- Keine automatisch hervorgehobenen Stärken\./g, '- No automatically highlighted strengths.'],
  [/\| Feature \| Status \| Hinweis \|/g, '| Feature | Status | Note |'], [/#### Performance-Diagnose/g, '#### Performance diagnosis'], [/\| Metrik \| Wert \| Score \|/g, '| Metric | Value | Score |'],
  [/\| Ursache \| Lighthouse-Hinweis \| Bytes \| Mainthread \| Top Asset\/Node \|/g, '| Cause | Lighthouse hint | Bytes | Main thread | Top asset/node |'],
  [/\| Kategorie \| Score \|/g, '| Category | Score |'], [/Lighthouse Fehler: /g, 'Lighthouse error: '], [/Nicht ausgeführt\./g, 'Not run.'], [/nicht ausgeführt/g, 'not run'],
  [/\| Typ \| Status \| Text \| URL \| Fehler \|/g, '| Type | Status | Text | URL | Error |'], [/\| intern \|/g, '| internal |'], [/\| extern \|/g, '| external |'],
  [/Geprüft: (\d+), Fehler: (\d+), Warnungen: (\d+)/g, 'Checked: $1, errors: $2, warnings: $3'],
  [/Kurzauftrag: Screenshots auf visuelle Qualität, AI-Slop, mobile CTA-Störung, Bildauthentizität und lokalen Vertrauensaufbau prüfen\./g, 'Short brief: review the screenshots for visual quality, AI slop, mobile CTA interference, image authenticity and local trust.'],
  [/Nicht erzeugt\./g, 'Not generated.'], [/## Technische Checks/g, '## Technical checks'], [/## Hinweise/g, '## Notes'],
  [/- V2 kombiniert DOM-\/CSS-\/Browser-Checks mit HTTP-Linkcheck, optionalem Lighthouse und Vision-Review-Pack\./g, '- V2 combines DOM/CSS/browser checks with an HTTP link check, optional Lighthouse and a vision review pack.'],
  [/- Vision-Pack ist bewusst ein Prüfpaket: die finale Geschmacksbewertung erfolgt durch ein Vision-Modell oder einen Menschen, nicht durch erfundene Bildscores\./g, '- The vision pack is deliberately a review kit: the final judgement of taste is made by a vision model or a person, not by invented image scores.'],
  [/- Blocker überschreiben den Score\. Eine schöne Seite mit kaputtem CTA bleibt nicht lieferbar\./g, '- Blockers override the score. A beautiful page with a broken CTA is not deliverable.'],
  // vision brief
  [/## Prüfauftrag/g, '## Review brief'], [/Bewerte die Website als lokale Handwerker-\/Dienstleister-Seite\. Prüfe knapp und konkret:/g, 'Judge the website as a local trades or service business site. Be brief and concrete:'],
  [/1\. Hero: Lesbarkeit, Hierarchie, CTA-Sichtbarkeit, erster Eindruck\./g, '1. Hero: readability, hierarchy, CTA visibility, first impression.'],
  [/2\. Mobile: Navigation, Tap Targets, Floating CTA, horizontales Scroll-Risiko\./g, '2. Mobile: navigation, tap targets, floating CTA, risk of horizontal scroll.'],
  [/3\. Bilder: authentisch vs\. Stock\/AI-Slop, Bezug zum Gewerk, Vertrauen\./g, '3. Images: authentic vs. stock/AI slop, relation to the trade, trust.'],
  [/4\. Copy: natürlich, konkret, lokal, keine Agentur-\/KI-Phrasen\./g, '4. Copy: natural, concrete, local, no agency or AI phrases.'],
  [/5\. Conversion: findet ein echter Kunde schnell Telefon, WhatsApp, Formular und nächste Schritte\?/g, '5. Conversion: can a real customer quickly find phone, WhatsApp, form and next steps?'],
  [/6\. Blocker: alles, was Auslieferung verhindern sollte\./g, '6. Blockers: anything that should stop delivery.'],
  [/## Erwartete Antwortstruktur/g, '## Expected answer structure'], [/- Visueller Score 0-20/g, '- Visual score 0-20'], [/- Blocker ja\/nein/g, '- Blockers yes/no'],
  [/- 3 stärkste Punkte/g, '- 3 strongest points'], [/- 3 wichtigste Korrekturen/g, '- 3 most important fixes'], [/- Mobile Urteil in einem Satz/g, '- Mobile verdict in one sentence'],
  // history, ranking, compare
  [/# Website Quality Rangliste \(Projekt-Ebene\)/g, '# Website Quality Ranking (by project)'], [/Projekte: (\d+)/g, 'Projects: $1'], [/Bestes Projekt:/g, 'Best project:'], [/Schwächstes Projekt:/g, 'Weakest project:'],
  [/\| Projekt \| Runs \| Best \| Worst \| Latest \| Avg \| Perf \| Avg Blocker \| Block-Rate \|/g, '| Project | Runs | Best | Worst | Latest | Avg | Perf | Avg blockers | Blocker rate |'],
  [/Datei: /g, 'File: '], [/\| Datum \| Projekt \| Score \| Urteil \| Blocker \| Perf \| URL \|/g, '| Date | Project | Score | Grade | Blockers | Perf | URL |'],
  [/# Website Quality Vergleich/g, '# Website Quality Comparison'], [/\| Bereich \| Alt \| Neu \| Delta \|/g, '| Area | Old | New | Delta |'], [/\*\*Gesamt\*\*/g, '**Total**'],
  [/## Alt\n/g, '## Old\n'], [/## Neu\n/g, '## New\n'], [/- Blocker: (\d+)/g, '- Blockers: $1'],
];
function tr(str) {
  if (LANG === 'de' || typeof str !== 'string') return str;
  let out = str;
  for (const [re, rep] of DE_EN) out = out.replace(re, rep);
  return out;
}
const GRADE_EN = { 'sehr stark': 'very strong', 'gut': 'good', 'brauchbar': 'usable', 'schwach': 'weak', 'neu bauen': 'rebuild', 'nicht bewertet': 'not assessed' };
function trGrade(g) { return LANG === 'de' ? g : (GRADE_EN[g] || g); }
// Translate console output and Markdown files at the boundary, so the analysis code stays untouched.
const _log = console.log;
console.log = (...a) => _log(...a.map(x => typeof x === 'string' ? tr(x) : x));
const _writeFile = fs.writeFile;
fs.writeFile = (p, d, ...r) => _writeFile(p, (typeof d === 'string' && /\.md$/i.test(String(p))) ? tr(d) : d, ...r);

const PLACEHOLDER_PATTERNS = [
  /lorem ipsum/i, /\[company name\]/i, /\[todo\]/i, /TODO:/i, /direction\s+[abc]/i,
  /designrichtung/i, /hero section/i, /section\s+\d/i, /qualität steht (bei uns )?an erster stelle/i,
  /maßgeschneiderte lösungen/i, /willkommen auf unserer website/i, /zögern sie nicht/i,
  /welcome to our (web)?site/i, /don'?t hesitate to/i, /tailor-?made solutions/i, /quality is our (top )?priority/i
];
const AI_FILE_PATTERNS = [/Gemini_Generated_Image/i, /DALL[-_ ]?E/i, /Midjourney/i, /StableDiffusion/i, /AI[-_ ]?Generated/i];
const LOCAL_TERMS = [/Düsseldorf/i, /Köln/i, /Leverkusen/i, /Berlin/i, /Hamburg/i, /München/i, /NRW/i, /Stadtteil/i, /Region/i, /vor Ort/i,
  /\bnear you\b/i, /\bin your area\b/i, /\bserving\b/i, /\bbased in\b/i, /\blocally owned\b/i, /\bcounty\b/i, /\bneighbou?rhood\b/i,
  /\b\d{5}\s+[A-ZÄÖÜ][a-zäöüß]+/, /\b[A-Z]{2}\s+\d{5}\b/, /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/];
const SERVICE_TERMS = [/Leistung/i, /Service/i, /Angebot/i, /Sanierung/i, /Renovierung/i, /Reparatur/i, /Montage/i, /Beratung/i, /Notdienst/i, /Wartung/i,
  /\bservices?\b/i, /\brepairs?\b/i, /\binstallation\b/i, /\bmaintenance\b/i, /\brenovation\b/i, /\bemergency\b/i, /\bquotes?\b/i, /\bestimates?\b/i, /\bconsultation\b/i, /\bwhat we do\b/i, /\bour work\b/i];
const TRUST_TERMS = [/Bewertung/i, /Rezension/i, /Google/i, /Meister/i, /zertifiziert/i, /Jahre/i, /Erfahrung/i, /Referenz/i, /Projekt/i, /Kunden/i, /Inhaber/i, /Team/i, /Garantie/i, /regional/i,
  /\breviews?\b/i, /\btestimonials?\b/i, /\brated\b/i, /\bcertified\b/i, /\blicen[sc]ed\b/i, /\binsured\b/i, /\byears\b/i, /\bexperience\b/i, /\breferences?\b/i, /\bprojects?\b/i, /\bcustomers?\b/i, /\bowner\b/i, /\bwarranty\b/i, /\bguarantee\b/i, /\bfamily[- ]owned\b/i];

function usage() {
  console.log(`website-quality-scorer 0.3.1\n\nUsage:\n  website-quality-scorer audit <url-or-path> [--out <dir>] [--name <label>] [--project <name>] [--history <jsonl>] [--lighthouse] [--no-links]\n  website-quality-scorer compare <old-url-or-path> <new-url-or-path> [--out <dir>] [--lighthouse] [--no-links]\n  website-quality-scorer history <jsonl> [--limit <n>] [--mode raw|rank]\n\nOutputs Markdown + JSON reports, screenshots, link checks, Lighthouse performance diagnosis, optional benchmark history and a vision-review pack. Uses local Chromium.`);
}

function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const opts = { _: [], links: true, lighthouse: false };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--out') opts.out = rest[++i];
    else if (a === '--name') opts.name = rest[++i];
    else if (a === '--project') opts.project = rest[++i];
    else if (a === '--history') opts.history = rest[++i];
    else if (a === '--limit') opts.limit = Number(rest[++i]);
    else if (a === '--mode') opts.mode = rest[++i];
    else if (a === '--lang') LANG = rest[++i] === 'de' ? 'de' : 'en';
    else if (a === '--lighthouse') opts.lighthouse = true;
    else if (a === '--no-lighthouse') opts.lighthouse = false;
    else if (a === '--links') opts.links = true;
    else if (a === '--no-links') opts.links = false;
    else opts._.push(a);
  }
  return { cmd, opts };
}

async function resolveTarget(input) {
  if (/^https?:\/\//i.test(input)) return { input, url: input, kind: 'url', root: null };
  const abs = path.resolve(input);
  const st = await fs.stat(abs).catch(() => null);
  if (!st) throw new Error(`Target not found: ${input}`);
  let file = abs;
  let root = st.isDirectory() ? abs : path.dirname(abs);
  if (st.isDirectory()) {
    const candidates = ['index.html', 'dist/index.html', 'public/index.html'];
    const found = candidates.map(c => path.join(abs, c)).find(p => fss.existsSync(p));
    if (!found) throw new Error(`No index.html found in ${abs}`);
    file = found;
  }
  return { input, url: pathToFileURL(file).href, kind: 'file', root };
}

function findChromium() {
  const candidates = [process.env.CHROME_PATH, '/snap/bin/chromium', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].filter(Boolean);
  for (const c of candidates) if (fss.existsSync(c)) return c;
  throw new Error('Chromium not found. Set CHROME_PATH.');
}

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); }
  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const c = new CDP(ws);
    ws.onmessage = ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && c.pending.has(msg.id)) {
        const { resolve, reject } = c.pending.get(msg.id); c.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      }
    };
    return c;
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  close() { try { this.ws.close(); } catch {} }
}

async function launchChrome() {
  const chrome = findChromium();
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wqs-chrome-'));
  const args = ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--remote-debugging-port=0', `--user-data-dir=${userDataDir}`, 'about:blank'];
  const proc = spawn(chrome, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  const wsUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Chromium DevTools timeout')), 10000);
    proc.stderr.on('data', d => {
      stderr += d.toString();
      const m = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (m) { clearTimeout(timer); resolve(m[1]); }
    });
    proc.on('exit', code => reject(new Error(`Chromium exited early: ${code}\n${stderr}`)));
  });
  const pageWsUrl = await getPageWebSocket(wsUrl);
  const cdp = await CDP.connect(pageWsUrl);
  return { proc, cdp, userDataDir };
}

async function getPageWebSocket(browserWsUrl) {
  const u = new URL(browserWsUrl);
  const base = `http://${u.host}`;
  for (let i = 0; i < 20; i++) {
    const list = await fetch(`${base}/json/list`).then(r => r.json()).catch(() => []);
    const page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
    if (page) return page.webSocketDebuggerUrl;
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('No Chromium page DevTools endpoint found');
}

async function browserCollect(cdp, target, outDir) {
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  const consoleMessages = [];
  cdp.ws.onmessage = ((old) => (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.method === 'Runtime.consoleAPICalled') consoleMessages.push({ type: msg.params.type, text: msg.params.args?.map(a => a.value || a.description || '').join(' ') });
    if (msg.id && cdp.pending.has(msg.id)) {
      const { resolve, reject } = cdp.pending.get(msg.id); cdp.pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  })();

  const shots = [];
  const evals = {};
  for (const vp of DEFAULT_VIEWPORTS) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: vp.mobile });
    await cdp.send('Page.navigate', { url: target.url });
    await waitForLoad(cdp);
    await cdp.send('Runtime.evaluate', { expression: 'window.scrollTo(0,0)' });
    await new Promise(r => setTimeout(r, 800));
    const shotPath = path.join(outDir, `${vp.name}-${vp.width}.png`);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await fs.writeFile(shotPath, Buffer.from(shot.data, 'base64'));
    shots.push({ ...vp, path: shotPath });
    const data = await cdp.send('Runtime.evaluate', { expression: `(${pageProbe.toString()})(${JSON.stringify(vp.name)})`, returnByValue: true, awaitPromise: true });
    evals[vp.name] = data.result.value;
  }
  return { screenshots: shots, consoleMessages, evals };
}

async function waitForLoad(cdp) {
  for (let i = 0; i < 80; i++) {
    const r = await cdp.send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true }).catch(() => null);
    if (r?.result?.value === 'complete') return;
    await new Promise(r => setTimeout(r, 100));
  }
}

function pageProbe(viewportName) {
  const q = s => Array.from(document.querySelectorAll(s));
  const text = document.body?.innerText || '';
  const links = q('a').map(a => ({ text: (a.innerText || a.getAttribute('aria-label') || '').trim(), href: a.getAttribute('href') || '', rect: rect(a) }));
  const imgs = q('img').map(img => ({ src: img.getAttribute('src') || '', alt: img.getAttribute('alt'), complete: img.complete, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, rect: rect(img) }));
  const forms = q('form').map(f => ({ action: f.getAttribute('action') || '', method: f.getAttribute('method') || '', fields: qIn(f, 'input, textarea, select').length, labels: qIn(f, 'label').length, buttons: qIn(f, 'button, input[type=submit]').map(b => (b.innerText || b.value || '').trim()) }));
  const headings = q('h1,h2,h3,h4').map(h => ({ tag: h.tagName, text: h.innerText.trim(), rect: rect(h), fontSize: parseFloat(getComputedStyle(h).fontSize) }));
  const buttons = q('a,button,input,select,textarea').filter(el => isVisible(el)).map(el => ({ tag: el.tagName, text: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim(), href: el.getAttribute('href') || '', rect: rect(el), fontSize: parseFloat(getComputedStyle(el).fontSize) }));
  const sections = q('main section, section, article').map(s => ({ tag: s.tagName, id: s.id || '', cls: s.className || '', text: s.innerText.trim().slice(0, 220), rect: rect(s) }));
  const styles = q('style, link[rel="stylesheet"]').map(s => s.tagName === 'STYLE' ? s.textContent : s.href);
  const scripts = q('script').map(s => s.src || s.textContent.slice(0, 100));
  const jsonLd = q('script[type="application/ld+json"]').map(s => s.textContent);
  const meta = {
    title: document.title || '',
    description: document.querySelector('meta[name="description"]')?.content || '',
    robots: document.querySelector('meta[name="robots"]')?.content || '',
    lang: document.documentElement.lang || '',
    canonical: document.querySelector('link[rel="canonical"]')?.href || '',
    ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
    ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
  };
  const cssText = Array.from(document.styleSheets).map(sheet => { try { return Array.from(sheet.cssRules).map(r => r.cssText).join('\n'); } catch { return ''; } }).join('\n');
  return {
    viewportName,
    url: location.href,
    text,
    meta,
    headings,
    links,
    imgs,
    forms,
    buttons,
    sections,
    jsonLd,
    styles,
    scripts,
    cssText: cssText.slice(0, 250000),
    metrics: {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
      horizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      bodyFontSize: parseFloat(getComputedStyle(document.body).fontSize),
      imgCount: q('img').length,
      linkCount: q('a').length,
      formCount: q('form').length,
      sectionCount: q('main section, section').length,
    }
  };
  function qIn(root, sel) { return Array.from(root.querySelectorAll(sel)); }
  function rect(el) { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom) }; }
  function isVisible(el) { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; }
}

async function runLighthouse(target, outDir) {
  if (!/^https?:\/\//i.test(target.url)) return { available: false, skipped: 'Lighthouse needs an HTTP(S) URL.' };
  const lighthousePath = await commandExists('lighthouse');
  if (!lighthousePath) return { available: false, skipped: 'lighthouse command not found.' };
  const jsonPath = path.join(outDir, 'lighthouse.json');
  const args = [target.url, '--quiet', '--chrome-flags=--headless=new --no-sandbox --disable-gpu', '--output=json', `--output-path=${jsonPath}`];
  const startedAt = Date.now();
  const run = await runCommand(lighthousePath, args, { timeoutMs: 180000 });
  if (run.code !== 0) return { available: true, error: run.stderr.slice(-1600) || run.stdout.slice(-1600), jsonPath };
  const raw = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
  const cats = raw.categories || {};
  const pick = k => cats[k]?.score == null ? null : Math.round(cats[k].score * 100);
  const audits = raw.audits || {};
  return {
    available: true, jsonPath, durationMs: Date.now() - startedAt,
    scores: { performance: pick('performance'), accessibility: pick('accessibility'), bestPractices: pick('best-practices'), seo: pick('seo') },
    metrics: {
      lcp: audits['largest-contentful-paint']?.displayValue || null,
      cls: audits['cumulative-layout-shift']?.displayValue || null,
      tbt: audits['total-blocking-time']?.displayValue || null,
      speedIndex: audits['speed-index']?.displayValue || null,
    },
    performanceInsights: extractPerformanceInsights(raw)
  };
}

function extractPerformanceInsights(lhr) {
  const audits = lhr.audits || {};
  const get = id => audits[id] || {};
  const opportunities = ['image-delivery-insight', 'total-byte-weight', 'unused-javascript', 'unminified-javascript', 'render-blocking-insight', 'bootup-time', 'mainthread-work-breakdown', 'unsized-images']
    .map(id => summarizeAudit(id, get(id)))
    .filter(Boolean);
  const criticalMetrics = ['first-contentful-paint', 'largest-contentful-paint', 'speed-index', 'total-blocking-time', 'interactive', 'cumulative-layout-shift']
    .map(id => ({ id, title: get(id).title || id, score: get(id).score, displayValue: get(id).displayValue || null, numericValue: get(id).numericValue || null }))
    .filter(x => x.displayValue || x.numericValue != null);
  const topIssues = opportunities
    .filter(x => (x.score == null || x.score < 0.9) && (x.savingsBytes || x.savingsMs || x.items.length))
    .sort((a,b) => (b.savingsBytes + b.savingsMs) - (a.savingsBytes + a.savingsMs))
    .slice(0, 8);
  return { criticalMetrics, topIssues };
}

function summarizeAudit(id, audit) {
  if (!audit || (!audit.title && !audit.displayValue && !audit.details)) return null;
  const items = (audit.details?.items || []).slice(0, 8).map(item => ({
    url: item.url || null,
    label: item.node?.snippet || item.node?.selector || item.groupLabel || item.source || null,
    wastedBytes: Math.round(item.wastedBytes || 0),
    totalBytes: Math.round(item.totalBytes || item.transferSize || 0),
    wastedMs: Math.round(item.wastedMs || item.blockingTime || item.duration || 0),
  }));
  const savingsBytes = items.reduce((sum, x) => sum + (x.wastedBytes || 0), 0);
  const savingsMs = items.reduce((sum, x) => sum + (x.wastedMs || 0), 0);
  return { id, title: audit.title || id, score: audit.score ?? null, displayValue: audit.displayValue || null, numericValue: audit.numericValue || null, savingsBytes, savingsMs, items };
}

function humanBytes(n) {
  if (!n) return '0 B';
  if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MiB`;
  if (n > 1024) return `${Math.round(n / 1024)} KiB`;
  return `${n} B`;
}

async function checkLinks(data, target) {
  const desktop = data.evals?.desktop;
  if (!desktop?.links?.length || !/^https?:\/\//i.test(target.url)) return { skipped: 'Link check needs HTTP(S) target.', checked: 0, broken: [], warnings: [] };
  const base = new URL(target.url);
  const urls = [...new Map(desktop.links
    .map(l => ({ href: normalizeHttpHref(l.href, base), text: l.text }))
    .filter(x => x.href && /^https?:\/\//i.test(x.href))
    .map(x => [x.href, x])).values()].slice(0, 40);
  const broken = []; const warnings = [];
  await Promise.all(urls.map(async x => {
    const r = await probeUrl(x.href);
    const row = { ...x, ...r, internal: new URL(x.href).host === base.host };
    if (r.status && r.status >= 400) broken.push(row);
    else if (r.error) warnings.push(row);
  }));
  return { checked: urls.length, broken, warnings };
}

function normalizeHttpHref(href, base) {
  if (!href || href === '#') return null;
  if (/^(tel:|mailto:|sms:|whatsapp:|javascript:)/i.test(href)) return null;
  try { const u = new URL(href, base); u.hash = ''; return u.href; } catch { return null; }
}

async function probeUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    if (res.status === 405 || res.status === 403) res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
    return { status: res.status, ok: res.ok, finalUrl: res.url };
  } catch (e) { return { error: e.name === 'AbortError' ? 'timeout' : e.message }; }
  finally { clearTimeout(timer); }
}

async function commandExists(cmd) {
  const run = await runCommand('bash', ['-lc', `command -v ${cmd}`], { timeoutMs: 5000 });
  return run.code === 0 ? run.stdout.trim().split('\n')[0] : null;
}

function runCommand(cmd, args, { timeoutMs = 30000 } = {}) {
  return new Promise(resolve => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    const timer = setTimeout(() => { child.kill('SIGTERM'); resolve({ code: -1, stdout, stderr: `${stderr}\nTIMEOUT` }); }, timeoutMs);
    child.stdout.on('data', d => stdout += d.toString());
    child.stderr.on('data', d => stderr += d.toString());
    child.on('close', code => { clearTimeout(timer); resolve({ code, stdout, stderr }); });
  });
}

async function augmentLocalCss(data, target) {
  if (!target.root) return;
  const desktop = data.evals?.desktop;
  if (!desktop?.styles?.length) return;
  let extra = '';
  for (const href of desktop.styles) {
    if (!href || !String(href).includes('.css')) continue;
    try {
      const u = new URL(href);
      let p;
      if (u.protocol === 'file:') p = fileURLToPath(u);
      else continue;
      p = p.split('?')[0];
      if (!p.startsWith(target.root)) continue;
      extra += '\n/* local css: '+path.relative(target.root, p)+' */\n' + await fs.readFile(p, 'utf8');
    } catch {}
  }
  for (const ev of Object.values(data.evals || {})) ev.cssText = `${ev.cssText || ''}\n${extra}`;
}

function analyze(data, target, extras = {}) {
  const desktop = data.evals.desktop;
  const mobile = data.evals.mobile;
  const allText = desktop.text || '';
  const css = desktop.cssText || '';
  const h1s = desktop.headings.filter(h => h.tag === 'H1');
  const h2s = desktop.headings.filter(h => h.tag === 'H2');
  const imgs = desktop.imgs;
  const links = desktop.links;
  const forms = desktop.forms;
  const buttons = desktop.buttons;
  const jsonLdTypes = parseJsonLd(desktop.jsonLd);

  const features = [];
  const blockers = [];
  const improvements = [];
  const strengths = [];
  const checks = {};

  const addF = (name, status, note) => features.push({ name, status, note });
  const hasTel = links.some(l => /^tel:/i.test(l.href));
  const hasMail = links.some(l => /^mailto:/i.test(l.href));
  const hasWhatsApp = links.some(l => /wa\.me|whatsapp/i.test(l.href));
  const ctaFirst = buttons.some(b => b.rect.top >= 0 && b.rect.top < 720 && /(anrufen|kontakt|angebot|termin|quote|demo|vorbestellen|whatsapp|mail|call|contact|estimate|free|book|appointment|get started|request|schedule|text us|email)/i.test(`${b.text} ${b.href}`));
  const deadLinks = links.filter(l => l.href === '#' || l.href.trim() === '');
  const brokenImages = imgs.filter(i => i.complete && i.naturalWidth === 0);
  const missingAlt = imgs.filter(i => i.alt === null);
  const aiImages = imgs.filter(i => AI_FILE_PATTERNS.some(re => re.test(i.src || '')));
  const localAnchored = LOCAL_TERMS.some(re => re.test(allText));
  const serviceHits = SERVICE_TERMS.filter(re => re.test(allText)).length;
  const trustHits = TRUST_TERMS.filter(re => re.test(allText)).length;
  const hasFaq = /FAQ|Häufige Fragen|Kurz gefragt|Fragen|frequently asked|questions/i.test(allText) || desktop.sections.some(s => /faq/i.test(`${s.id} ${s.cls}`));
  const blockedPage = /(just a moment|checking your browser|verify(ing)? (that )?you are (a )?human|security check|attention required|access denied|wir überprüfen ihren browser|sicherheitsüberprüfung|enable javascript and cookies|are you a robot|captcha)/i.test(`${desktop.meta.title || ''} ${allText}`) && allText.length < 1500;
  const hasGallery = /Galerie|Projekte|Referenzen|gallery|portfolio|projects|our work|before and after|references/i.test(allText) || imgs.length >= 6;
  const hasSchemaLocal = jsonLdTypes.some(t => /LocalBusiness|Florist|HomeAndConstructionBusiness|Store|Restaurant|ProfessionalService/i.test(t));
  const placeholderMatches = PLACEHOLDER_PATTERNS.filter(re => re.test(allText)).map(re => String(re));
  const emDash = /—/.test(allText);
  const gradientText = /background-clip:\s*text|-webkit-background-clip:\s*text/i.test(css);
  const transitionAll = /transition\s*:\s*all/i.test(css);
  const sideStripe = /border-(left|right)\s*:\s*(?:[2-9]|\d{2,})px/i.test(css);
  const pureBlackWhite = /#000(?:000)?\b|#fff(?:fff)?\b/i.test(css);
  const reducedMotion = /prefers-reduced-motion/i.test(css);
  const keyframes = (css.match(/@keyframes\s+/g) || []).length;
  const floatingMobile = mobile.buttons.some(b => b.href?.startsWith('tel:') && b.rect.w >= 44 && b.rect.h >= 44 && b.rect.x > mobile.metrics.clientWidth - 120);
  const smallTaps = mobile.buttons.filter(b => b.rect.w > 0 && b.rect.h > 0 && (b.rect.w < 44 || b.rect.h < 44));
  const formLabelsOk = forms.every(f => f.fields === 0 || f.labels >= Math.min(f.fields, 2));
  const formFallback = forms.length === 0 || hasMail || /mailto:|FormData|window\.location\.href/i.test((desktop.scripts || []).join('\n'));

  checks.h1_count = h1s.length;
  checks.h2_count = h2s.length;
  checks.images_total = imgs.length;
  checks.broken_images = brokenImages.length;
  checks.missing_alt = missingAlt.length;
  checks.dead_links = deadLinks.length;
  checks.forms = forms.length;
  checks.has_tel = hasTel;
  checks.has_mail = hasMail;
  checks.has_whatsapp = hasWhatsApp;
  checks.has_faq = hasFaq;
  checks.has_json_ld = desktop.jsonLd.length > 0;
  checks.has_local_business_schema = hasSchemaLocal;
  checks.horizontal_scroll_mobile = mobile.metrics.horizontalScroll;
  checks.mobile_small_tap_targets = smallTaps.length;
  checks.keyframes = keyframes;
  checks.prefers_reduced_motion = reducedMotion;
  checks.console_messages = data.consoleMessages.length;
  checks.http_links_checked = extras.linkCheck?.checked || 0;
  checks.http_links_broken = extras.linkCheck?.broken?.length || 0;
  checks.http_links_warnings = extras.linkCheck?.warnings?.length || 0;
  checks.lighthouse_performance = extras.lighthouse?.scores?.performance ?? null;
  checks.lighthouse_accessibility = extras.lighthouse?.scores?.accessibility ?? null;
  checks.lighthouse_seo = extras.lighthouse?.scores?.seo ?? null;

  addF('H1 vorhanden', h1s.length === 1 ? '✅' : h1s.length > 1 ? '⚠️' : '❌', `${h1s.length} H1 gefunden${h1s[0]?.text ? `: „${h1s[0].text}“` : ''}`);
  addF('Klarer lokaler Bezug', localAnchored ? '✅' : '⚠️', localAnchored ? 'Ort/Region sichtbar' : 'Kein klarer Ortsbezug erkannt');
  addF('CTA im ersten Viewport', ctaFirst ? '✅' : '⚠️', ctaFirst ? 'Handlungsaufforderung oben sichtbar' : 'Kein klarer CTA im ersten Viewport erkannt');
  addF('Telefon-Link', hasTel ? '✅' : '⚠️', hasTel ? 'tel: vorhanden' : 'kein tel: Link');
  addF('WhatsApp-Link', hasWhatsApp ? '✅' : '—', hasWhatsApp ? 'WhatsApp vorhanden' : 'nicht vorhanden');
  addF('Kontaktformular', forms.length ? '✅' : '—', forms.length ? `${forms.length} Formular(e), Labels ${formLabelsOk ? 'ok' : 'prüfen'}` : 'kein Formular');
  addF('Formular-Fallback', formFallback ? '✅' : '❌', formFallback ? 'Fallback/Alternative erkennbar' : 'Formular ohne erkennbare Alternative');
  addF('FAQ', hasFaq ? '✅' : '⚠️', hasFaq ? 'FAQ/Fragenbereich erkennbar' : 'kein FAQ erkannt');
  addF('Galerie/Projekte/Bildstrecke', hasGallery ? '✅' : '⚠️', `${imgs.length} Bilder`);
  addF('JSON-LD', desktop.jsonLd.length ? '✅' : '⚠️', desktop.jsonLd.length ? `Typen: ${jsonLdTypes.join(', ') || 'nicht erkannt'}` : 'kein Schema');
  addF('LocalBusiness Schema', hasSchemaLocal ? '✅' : '⚠️', hasSchemaLocal ? 'lokales Schema vorhanden' : 'nicht erkannt');
  addF('Broken Images', brokenImages.length === 0 ? '✅' : '❌', `${brokenImages.length} kaputte Bilder`);
  addF('Dead/# Links', deadLinks.length === 0 ? '✅' : '❌', `${deadLinks.length} tote/leere Links`);
  addF('Mobile horizontaler Scroll', mobile.metrics.horizontalScroll ? '❌' : '✅', mobile.metrics.horizontalScroll ? `${mobile.metrics.scrollWidth}px > ${mobile.metrics.clientWidth}px` : 'kein horizontaler Scroll');
  addF('Mobile Floating Call', floatingMobile ? '✅' : '—', floatingMobile ? 'mobiler Call-Button erkannt' : 'nicht erkannt');
  addF('Reduced Motion Support', reducedMotion ? '✅' : '⚠️', reducedMotion ? 'prefers-reduced-motion vorhanden' : 'nicht gefunden');
  addF('Animationen / Effekte', keyframes >= 3 ? '✅' : keyframes > 0 ? '⚠️' : '—', `${keyframes} @keyframes gefunden`);
  addF('Impeccable CSS-Bans', (!gradientText && !transitionAll && !sideStripe) ? '✅' : '⚠️', [gradientText && 'Gradient Text', transitionAll && 'transition: all', sideStripe && 'Side stripe'].filter(Boolean).join(', ') || 'keine Treffer');
  addF('AI-/Placeholder-Tells', (!placeholderMatches.length && !aiImages.length && !emDash) ? '✅' : '⚠️', [...placeholderMatches, aiImages.length ? `${aiImages.length} AI-Dateinamen` : '', emDash ? 'Em Dash' : ''].filter(Boolean).join(', ') || 'keine Treffer');
  addF('HTTP-Linkcheck', !extras.linkCheck ? '—' : extras.linkCheck.broken?.length ? '❌' : extras.linkCheck.warnings?.length ? '⚠️' : '✅', extras.linkCheck ? `${extras.linkCheck.checked || 0} geprüft, ${extras.linkCheck.broken?.length || 0} kaputt, ${extras.linkCheck.warnings?.length || 0} Warnungen` : 'nicht ausgeführt');
  addF('Lighthouse', extras.lighthouse?.scores ? '✅' : extras.lighthouse?.error ? '⚠️' : '—', extras.lighthouse?.scores ? `P${extras.lighthouse.scores.performance} A${extras.lighthouse.scores.accessibility} BP${extras.lighthouse.scores.bestPractices} SEO${extras.lighthouse.scores.seo}` : (extras.lighthouse?.skipped || extras.lighthouse?.error || 'nicht ausgeführt'));

  if (!h1s.length) blockers.push('Keine H1 gefunden.');
  if (!hasTel && !hasMail && !hasWhatsApp && forms.length === 0) blockers.push('Kein klarer Kontaktweg gefunden.');
  if (brokenImages.length) blockers.push(`${brokenImages.length} kaputte Bilder.`);
  if (deadLinks.length) blockers.push(`${deadLinks.length} tote oder leere Links, darunter möglicherweise CTAs.`);
  if (mobile.metrics.horizontalScroll) blockers.push('Mobile horizontaler Scroll erkannt.');
  if (!formFallback) blockers.push('Kontaktformular ohne erkennbaren Fallback oder alternative Kontaktmöglichkeit.');
  if (placeholderMatches.length) blockers.push(`Placeholder/interne Labels erkannt: ${placeholderMatches.join(', ')}`);
  if (aiImages.length) blockers.push(`${aiImages.length} AI-generierte Dateinamen sichtbar.`);
  if (extras.linkCheck?.broken?.some(l => l.internal)) blockers.push(`${extras.linkCheck.broken.filter(l => l.internal).length} interne HTTP-Links liefern Fehlerstatus.`);

  if (!localAnchored) improvements.push('Lokalen Bezug im Hero oder Kontaktbereich sichtbarer machen.');
  if (!hasFaq) improvements.push('FAQ mit echten Einwänden ergänzen.');
  if (!floatingMobile) improvements.push('Optional: mobilen Floating-Call-Button ergänzen.');
  if (!hasSchemaLocal) improvements.push('LocalBusiness JSON-LD ergänzen.');
  if (!reducedMotion && keyframes > 0) improvements.push('prefers-reduced-motion für Animationen ergänzen.');
  if (transitionAll) improvements.push('CSS `transition: all` vermeiden, gezielt transform/opacity animieren.');
  if (pureBlackWhite) improvements.push('Pure #000/#fff durch getönte Neutrals ersetzen.');
  if (missingAlt.length) improvements.push(`${missingAlt.length} Bilder ohne alt-Attribut ergänzen.`);
  if (smallTaps.length) improvements.push(`${smallTaps.length} kleine mobile Tap Targets prüfen.`);
  if (extras.linkCheck?.warnings?.length) improvements.push(`${extras.linkCheck.warnings.length} Linkcheck-Warnungen manuell prüfen.`);
  if (extras.lighthouse?.scores?.performance != null && extras.lighthouse.scores.performance < 50) improvements.push(`Lighthouse Performance ${extras.lighthouse.scores.performance}/100 prüfen: meist große Bilder, Canvas/Animationen oder blockierendes JavaScript.`);
  if (extras.lighthouse?.scores?.accessibility != null && extras.lighthouse.scores.accessibility < 90) improvements.push(`Lighthouse Accessibility ${extras.lighthouse.scores.accessibility}/100 verbessern.`);
  if (extras.lighthouse?.scores?.seo != null && extras.lighthouse.scores.seo < 90) improvements.push(`Lighthouse SEO ${extras.lighthouse.scores.seo}/100 verbessern.`);

  if (h1s.length === 1 && ctaFirst) strengths.push('Hero hat klare H1 und CTA im ersten Viewport.');
  if (imgs.length >= 6 && !brokenImages.length) strengths.push('Bildbasis/Galerie vorhanden und lädt fehlerfrei.');
  if (hasTel || hasWhatsApp) strengths.push('Direkte Kontakt-CTA vorhanden.');
  if (hasSchemaLocal) strengths.push('Lokales strukturiertes Schema vorhanden.');
  if (!placeholderMatches.length && !emDash) strengths.push('Copy ohne offensichtliche AI-/Platzhalter-Tells.');
  if (extras.linkCheck?.checked && !extras.linkCheck.broken?.length) strengths.push('HTTP-Linkcheck ohne Fehlerstatus.');
  if (extras.lighthouse?.scores?.accessibility >= 90 && extras.lighthouse?.scores?.seo >= 90) strengths.push('Lighthouse Accessibility/SEO im grünen Bereich.');

  if (blockedPage) {
    blockers.length = 0; improvements.length = 0; strengths.length = 0;
    blockers.push('Seite hinter Bot-Schutz oder Browser-Prüfung; die echte Website wurde nicht bewertet.');
  }
  checks.blocked_page = blockedPage;
  const categoryScores = {
    hero: score(15, [h1s.length === 1, h1s[0]?.text?.split(/\s+/).length <= 15, localAnchored, ctaFirst, imgs.some(i => i.rect.top < 900 && i.naturalWidth > 0)], [5,2,3,3,2]),
    services: score(10, [serviceHits >= 2, desktop.sections.length >= 6, /Ablauf|Prozess|So kommt|Schritte|process|how it works|our approach|steps|what to expect/i.test(allText), hasFaq], [3,3,2,2]),
    trust: score(15, [trustHits >= 2, localAnchored, hasGallery, imgs.length >= 3, !/\d+\s*(Bewertungen|Reviews)|5\s*Sterne|5\s*stars?/i.test(allText) || /Google|Quelle|Bewertung|source|review|rated/i.test(allText)], [4,3,3,3,2]),
    conversion: score(20, [ctaFirst, hasTel, hasWhatsApp, forms.length > 0 || hasMail, formFallback, deadLinks.length === 0, hasFaq], [4,3,2,3,3,3,2]),
    mobile: score(15, [!mobile.metrics.horizontalScroll, mobile.metrics.bodyFontSize >= 16, smallTaps.length === 0, floatingMobile || hasTel, mobile.headings?.[0]?.rect?.h !== 0], [4,3,3,3,2]),
    images: score(10, [imgs.length >= 3, imgs.length >= 6, brokenImages.length === 0, missingAlt.length === 0, aiImages.length === 0], [2,2,2,2,2]),
    copy: score(10, [!placeholderMatches.length, !emDash, localAnchored, h1s[0]?.text && !/Willkommen|Qualität|Lösung|welcome|quality|solutions?/i.test(h1s[0].text), allText.length > 1200], [2,2,2,2,2]),
    technical: score(5, [desktop.meta.title, desktop.meta.description, desktop.meta.lang, desktop.jsonLd.length, !data.consoleMessages.some(m => m.type === 'error')], [1,1,1,1,1]),
  };
  let total = Math.round(Object.values(categoryScores).reduce((a,b)=>a+b,0));
  const grade = blockedPage ? 'nicht bewertet' : total >= 90 ? 'sehr stark' : total >= 80 ? 'gut' : total >= 70 ? 'brauchbar' : total >= 55 ? 'schwach' : 'neu bauen';
  const delivery = blockedPage ? 'Nicht bewertet: Seite durch Bot-Schutz blockiert.' : blockers.length ? 'Nicht ausliefern, Blocker zuerst beheben.' : total >= 80 ? 'Vorzeigbar, kleinere Verbesserungen möglich.' : 'Vor Kundenvorlage verbessern.';

  return { target: target.input, resolvedUrl: target.url, generatedAt: new Date().toISOString(), version: '0.3.1', total, grade: trGrade(grade), delivery: tr(delivery), categoryScores, features: features.map(f => ({ ...f, name: tr(f.name), note: tr(f.note) })), blockers: blockers.map(tr), improvements: improvements.map(tr), strengths: strengths.map(tr), checks, meta: desktop.meta, screenshots: data.screenshots, lighthouse: extras.lighthouse || null, linkCheck: extras.linkCheck || null, visionPack: extras.visionPack || null, raw: { consoleMessages: data.consoleMessages } };
}

function score(max, bools, weights) { return Math.round(bools.reduce((sum, ok, i) => sum + (ok ? weights[i] : 0), 0) / weights.reduce((a,b)=>a+b,0) * max); }
function parseJsonLd(arr) {
  const types = [];
  for (const s of arr || []) { try { const j = JSON.parse(s); const xs = Array.isArray(j) ? j : [j]; for (const x of xs) { const t = x['@type'] || x.type; if (Array.isArray(t)) types.push(...t); else if (t) types.push(t); } } catch {} }
  return [...new Set(types)];
}

function reportMarkdown(result, compare = null) {
  const rows = Object.entries(CATEGORIES).map(([k,v]) => `| ${v.label} | ${result.categoryScores[k]} | ${v.max} |`).join('\n');
  const feat = result.features.map(f => `| ${f.name} | ${f.status} | ${escapeMd(f.note)} |`).join('\n');
  const blockers = result.blockers.length ? result.blockers.map(x => `- ${x}`).join('\n') : '- Keine.';
  const improvements = result.improvements.length ? result.improvements.map(x => `- ${x}`).join('\n') : '- Keine dringenden Verbesserungen.';
  const strengths = result.strengths.length ? result.strengths.map(x => `- ${x}`).join('\n') : '- Keine automatisch hervorgehobenen Stärken.';
  const shots = result.screenshots.map(s => `- ${s.name}: \`${s.path}\``).join('\n');
  const perfRows = result.lighthouse?.performanceInsights?.topIssues?.length
    ? result.lighthouse.performanceInsights.topIssues.map(x => `| ${escapeMd(x.title)} | ${escapeMd(x.displayValue || '')} | ${humanBytes(x.savingsBytes)} | ${Math.round(x.savingsMs || 0)} ms | ${escapeMd((x.items?.[0]?.url || x.items?.[0]?.label || '').slice(0, 120))} |`).join('\n')
    : '';
  const metricRows = result.lighthouse?.performanceInsights?.criticalMetrics?.length
    ? result.lighthouse.performanceInsights.criticalMetrics.map(x => `| ${escapeMd(x.title)} | ${escapeMd(x.displayValue || String(Math.round(x.numericValue || 0)))} | ${x.score == null ? '—' : Math.round(x.score * 100)} |`).join('\n')
    : '';
  const performanceDetails = perfRows || metricRows ? `\n\n#### Performance-Diagnose\n\n${metricRows ? `| Metrik | Wert | Score |\n|---|---:|---:|\n${metricRows}\n\n` : ''}${perfRows ? `| Ursache | Lighthouse-Hinweis | Bytes | Mainthread | Top Asset/Node |\n|---|---|---:|---:|---|\n${perfRows}` : ''}` : '';
  const lighthouse = result.lighthouse?.scores ? `| Kategorie | Score |\n|---|---:|\n| Performance | ${result.lighthouse.scores.performance} |\n| Accessibility | ${result.lighthouse.scores.accessibility} |\n| Best Practices | ${result.lighthouse.scores.bestPractices} |\n| SEO | ${result.lighthouse.scores.seo} |\n\nMetrics: LCP ${result.lighthouse.metrics?.lcp || '-'}, CLS ${result.lighthouse.metrics?.cls || '-'}, TBT ${result.lighthouse.metrics?.tbt || '-'}  \nJSON: \`${result.lighthouse.jsonPath}\`${performanceDetails}` : (result.lighthouse?.error ? `Lighthouse Fehler: ${escapeMd(result.lighthouse.error)}` : (result.lighthouse?.skipped || 'Nicht ausgeführt.'));
  const linkRows = result.linkCheck?.checked ? (result.linkCheck.broken || []).concat(result.linkCheck.warnings || []).slice(0, 20).map(l => `| ${l.internal ? 'intern' : 'extern'} | ${l.status || '—'} | ${escapeMd(l.text || '')} | ${escapeMd(l.href)} | ${escapeMd(l.error || '')} |`).join('\n') : '';
  const links = result.linkCheck?.checked ? `Geprüft: ${result.linkCheck.checked}, Fehler: ${result.linkCheck.broken.length}, Warnungen: ${result.linkCheck.warnings.length}${linkRows ? `\n\n| Typ | Status | Text | URL | Fehler |\n|---|---:|---|---|---|\n${linkRows}` : ''}` : (result.linkCheck?.skipped || 'Nicht ausgeführt.');
  const vision = result.visionPack?.briefPath ? `Vision-Pack: \`${result.visionPack.briefPath}\`\n\nKurzauftrag: Screenshots auf visuelle Qualität, AI-Slop, mobile CTA-Störung, Bildauthentizität und lokalen Vertrauensaufbau prüfen.` : 'Nicht erzeugt.';
  return `# Website Quality Score\n\n**Ziel:** ${result.target}  \n**URL:** ${result.resolvedUrl}  \n**Datum:** ${result.generatedAt}\n\n## Ergebnis\n\n**Gesamt:** ${result.total}/100  \n**Urteil:** ${result.grade}  \n**Lieferstatus:** ${result.delivery}\n\n## Score Breakdown\n\n| Bereich | Score | Max |\n|---|---:|---:|\n${rows}\n\n## Blocker\n\n${blockers}\n\n## Wichtigste Verbesserungen\n\n${improvements}\n\n## Stärken\n\n${strengths}\n\n## Feature Matrix\n\n| Feature | Status | Hinweis |\n|---|---|---|\n${feat}\n\n## V2 Checks\n\n### Lighthouse\n\n${lighthouse}\n\n### HTTP-Linkcheck\n\n${links}\n\n### Vision Review Pack\n\n${vision}\n\n## Technische Checks\n\n\`\`\`json\n${JSON.stringify(result.checks, null, 2)}\n\`\`\`\n\n## Screenshots\n\n${shots}\n\n## Hinweise\n\n- V2 kombiniert DOM-/CSS-/Browser-Checks mit HTTP-Linkcheck, optionalem Lighthouse und Vision-Review-Pack.\n- Vision-Pack ist bewusst ein Prüfpaket: die finale Geschmacksbewertung erfolgt durch ein Vision-Modell oder einen Menschen, nicht durch erfundene Bildscores.\n- Blocker überschreiben den Score. Eine schöne Seite mit kaputtem CTA bleibt nicht lieferbar.\n`;
}
function escapeMd(s='') { return String(s).replace(/\|/g, '\\|').replace(/\n/g, ' '); }

async function writeVisionPack(outDir, resultDraft) {
  const briefPath = path.join(outDir, 'vision-brief.md');
  const screenshotLines = (resultDraft.screenshots || []).map(s => `- ${s.name}: ${s.path}`).join('\n');
  const brief = `# Vision Review Pack\n\n## Screenshots\n\n${screenshotLines}\n\n## Prüfauftrag\n\nBewerte die Website als lokale Handwerker-/Dienstleister-Seite. Prüfe knapp und konkret:\n\n1. Hero: Lesbarkeit, Hierarchie, CTA-Sichtbarkeit, erster Eindruck.\n2. Mobile: Navigation, Tap Targets, Floating CTA, horizontales Scroll-Risiko.\n3. Bilder: authentisch vs. Stock/AI-Slop, Bezug zum Gewerk, Vertrauen.\n4. Copy: natürlich, konkret, lokal, keine Agentur-/KI-Phrasen.\n5. Conversion: findet ein echter Kunde schnell Telefon, WhatsApp, Formular und nächste Schritte?\n6. Blocker: alles, was Auslieferung verhindern sollte.\n\n## Erwartete Antwortstruktur\n\n- Visueller Score 0-20\n- Blocker ja/nein\n- 3 stärkste Punkte\n- 3 wichtigste Korrekturen\n- Mobile Urteil in einem Satz\n`;
  await fs.writeFile(briefPath, brief);
  return { briefPath };
}

function historySummary(result, { project = null, mdPath = null, jsonPath = null, outDir = null } = {}) {
  return {
    generatedAt: result.generatedAt,
    version: result.version,
    project: project || null,
    target: result.target,
    resolvedUrl: result.resolvedUrl,
    total: result.total,
    grade: result.grade,
    delivery: result.delivery,
    blockers: result.blockers.length,
    blockerTexts: result.blockers,
    lighthouse: result.lighthouse?.scores || null,
    metrics: result.lighthouse?.metrics || null,
    links: result.linkCheck ? { checked: result.linkCheck.checked || 0, broken: result.linkCheck.broken?.length || 0, warnings: result.linkCheck.warnings?.length || 0 } : null,
    categoryScores: result.categoryScores,
    report: mdPath,
    json: jsonPath,
    outDir,
  };
}

function rankHistory(rows) {
  const byProj = {};
  for (const r of rows) {
    const p = r.project || r.target || 'unbekannt';
    if (!byProj[p]) byProj[p] = [];
    byProj[p].push(r);
  }
  const summary = Object.entries(byProj).map(([name, runs]) => {
    const best = runs.reduce((a, b) => a.total >= b.total ? a : b);
    const worst = runs.reduce((a, b) => a.total <= b.total ? a : b);
    const latest = runs.at(-1);
    const avg = Math.round(runs.reduce((s, r) => s + r.total, 0) / runs.length);
    const withPerf = runs.filter(r => r.lighthouse?.performance != null);
    const avgPerf = withPerf.length ? Math.round(withPerf.reduce((s, r) => s + r.lighthouse.performance, 0) / withPerf.length) : null;
    const avgBlockers = Math.round((runs.reduce((s, r) => s + (r.blockers || 0), 0) / runs.length) * 10) / 10;
    const blockRate = Math.round((runs.filter(r => r.blockers > 0).length / runs.length) * 100);
    return { name, runs: runs.length, best: best.total, worst: worst.total, latest: latest.total, avg, avgPerf, avgBlockers, blockRate };
  }).sort((a, b) => b.avg - a.avg);

  const md = summary.map(s => `| ${escapeMd(s.name)} | ${s.runs} | ${s.best} | ${s.worst} | ${s.latest} | ${s.avg} | ${s.avgPerf ?? '—'} | ${s.avgBlockers} | ${s.blockRate}% |`).join('\n');
  const bestOverall = summary.reduce((a, b) => a.best >= b.best ? a : b, summary[0]);
  const worstOverall = summary.reduce((a, b) => a.worst <= b.worst ? a : b, summary[0]);
  console.log(`# Website Quality Rangliste (Projekt-Ebene)\n\nRuns: ${rows.length}  \nProjekte: ${summary.length}\n\nBestes Projekt: ${escapeMd(bestOverall.name)} — ${bestOverall.best}/100\nSchwächstes Projekt: ${escapeMd(worstOverall.name)} — ${worstOverall.worst}/100\n\n| Projekt | Runs | Best | Worst | Latest | Avg | Perf | Avg Blocker | Block-Rate |\n|---|---|---:|---:|---:|---:|---:|---:|---:|\n${md}`);
}

async function appendHistory(historyPath, summary) {
  if (!historyPath) return null;
  const abs = path.resolve(historyPath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.appendFile(abs, `${JSON.stringify(summary)}\n`);
  return abs;
}

async function showHistory(historyPath, limit = 20) {
  const abs = path.resolve(historyPath);
  const text = await fs.readFile(abs, 'utf8');
  const rows = text.split(/\n+/).filter(Boolean).map(line => JSON.parse(line));
  const recent = rows.slice(-Math.max(1, limit || 20));
  const mdRows = recent.map(r => `| ${r.generatedAt?.slice(0,19) || '-'} | ${escapeMd(r.project || '-')} | ${r.total ?? '-'} | ${escapeMd(r.grade || '-')} | ${r.blockers ?? '-'} | ${r.lighthouse?.performance ?? '—'} | ${escapeMd(r.resolvedUrl || r.target || '')} |`).join('\n');
  const best = rows.reduce((a,b) => (a && a.total >= b.total ? a : b), null);
  const latest = rows.at(-1);
  console.log(`# Website Quality History\n\nDatei: \`${abs}\`  \nRuns: ${rows.length}\n\nLatest: ${latest ? `${latest.total}/100 (${latest.grade}), Blocker ${latest.blockers}` : '-'}  \nBest: ${best ? `${best.total}/100 (${best.grade}) ${best.project ? `— ${best.project}` : ''}` : '-'}\n\n| Datum | Projekt | Score | Urteil | Blocker | Perf | URL |\n|---|---|---:|---|---:|---:|---|\n${mdRows}`);
  return rows;
}

async function audit(input, out, name, options = {}) {
  const target = await resolveTarget(input);
  const safeName = (name || path.basename(target.root || new URL(target.url).hostname || 'site') || 'site').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g,'').toLowerCase();
  const outDir = path.resolve(out || path.join(process.cwd(), 'website-quality-reports', `${new Date().toISOString().slice(0,10)}-${safeName}`));
  await fs.mkdir(outDir, { recursive: true });
  const chrome = await launchChrome();
  try {
    const data = await browserCollect(chrome.cdp, target, outDir);
    await augmentLocalCss(data, target);
    const linkCheck = options.links === false ? null : await checkLinks(data, target);
    const lighthouse = options.lighthouse ? await runLighthouse(target, outDir) : { skipped: 'Use --lighthouse to run Lighthouse.' };
    let result = analyze(data, target, { linkCheck, lighthouse });
    const visionPack = await writeVisionPack(outDir, result);
    result = { ...result, visionPack };
    const md = reportMarkdown(result);
    const jsonPath = path.join(outDir, 'report.json');
    const mdPath = path.join(outDir, 'report.md');
    await fs.writeFile(jsonPath, JSON.stringify(result, null, 2));
    await fs.writeFile(mdPath, md);
    const historyPath = await appendHistory(options.history, historySummary(result, { project: options.project || name || safeName, mdPath, jsonPath, outDir }));
    console.log(result.checks?.blocked_page ? 'Score: not assessed (page blocked by bot protection; the real site was not checked)' : `Score: ${result.total}/100 (${result.grade})`);
    console.log(`Report: ${mdPath}`);
    console.log(`JSON:   ${jsonPath}`);
    if (historyPath) console.log(`History: ${historyPath}`);
    if (result.blockers.length) console.log(`Blocker: ${result.blockers.length}`);
    return { result, outDir, mdPath, jsonPath };
  } finally {
    chrome.cdp.close();
    chrome.proc.kill('SIGTERM');
    await fs.rm(chrome.userDataDir, { recursive: true, force: true }).catch(()=>{});
  }
}

async function compare(a, b, out, options = {}) {
  const baseOut = path.resolve(out || path.join(process.cwd(), 'website-quality-reports', `${new Date().toISOString().slice(0,10)}-compare`));
  const oldRun = await audit(a, path.join(baseOut, 'old'), 'old', options);
  const newRun = await audit(b, path.join(baseOut, 'new'), 'new', options);
  const lines = Object.entries(CATEGORIES).map(([k,v]) => `| ${v.label} | ${oldRun.result.categoryScores[k]} | ${newRun.result.categoryScores[k]} | ${newRun.result.categoryScores[k]-oldRun.result.categoryScores[k] >= 0 ? '+' : ''}${newRun.result.categoryScores[k]-oldRun.result.categoryScores[k]} |`).join('\n');
  const md = `# Website Quality Vergleich\n\n| Bereich | Alt | Neu | Delta |\n|---|---:|---:|---:|\n${lines}\n| **Gesamt** | **${oldRun.result.total}** | **${newRun.result.total}** | **${newRun.result.total-oldRun.result.total >= 0 ? '+' : ''}${newRun.result.total-oldRun.result.total}** |\n\n## Alt\n\n- Report: \`${oldRun.mdPath}\`\n- Blocker: ${oldRun.result.blockers.length}\n\n## Neu\n\n- Report: \`${newRun.mdPath}\`\n- Blocker: ${newRun.result.blockers.length}\n`;
  const mdPath = path.join(baseOut, 'compare.md');
  await fs.writeFile(mdPath, md);
  console.log(`Compare: ${mdPath}`);
}

const { cmd, opts } = parseArgs(process.argv.slice(2));
try {
  if (!cmd || cmd === '--help' || cmd === '-h') usage();
  else if (cmd === 'audit') {
    if (!opts._[0]) throw new Error('audit needs <url-or-path>');
    await audit(opts._[0], opts.out, opts.name, opts);
  } else if (cmd === 'compare') {
    if (!opts._[0] || !opts._[1]) throw new Error('compare needs <old> <new>');
    await compare(opts._[0], opts._[1], opts.out, opts);
  } else if (cmd === 'history') {
    if (!opts._[0]) throw new Error('history needs <jsonl>');
    if (opts.mode === 'rank') {
      const abs = path.resolve(opts._[0]);
      const text = await fs.readFile(abs, 'utf8');
      const rows = text.split(/\n+/).filter(Boolean).map(line => JSON.parse(line));
      rankHistory(rows);
    } else {
      await showHistory(opts._[0], opts.limit || 20);
    }
  } else throw new Error(`Unknown command: ${cmd}`);
} catch (e) {
  console.error(`ERROR: ${e.message}`);
  process.exit(1);
}
