// Matching score + interview chance, following docs/09-algorithms.md §3–4.
// The real thing runs in src/backend (matching.service); this demo copy lets the UI recompute live while the CV is edited.
import { BASE_SENTENCES, INFERRED, USER_SKILLS } from './data';
import type { Job, Match, Sentence } from '@/lib/types';

export const WEIGHTS = { skill: 40, semantic: 20, experience: 25, location: 15 };
export const FACTORS = [
  { key: 'skill', k: 'Kỹ năng theo phả hệ', max: WEIGHTS.skill, why: 'Kỹ năng trong CV, kể cả kỹ năng suy ra, so với yêu cầu của JD.' },
  { key: 'semantic', k: 'Tương đồng ngữ nghĩa', max: WEIGHTS.semantic, why: 'Nội dung kinh nghiệm của bạn giống mô tả công việc tới đâu.' },
  { key: 'experience', k: 'Kinh nghiệm', max: WEIGHTS.experience, why: 'Số tháng làm việc liên quan so với mức JD yêu cầu.' },
  { key: 'location', k: 'Địa điểm', max: WEIGHTS.location, why: 'Khoảng cách và hình thức làm việc so với nơi bạn chọn.' },
] as const;

const REQ_WEIGHT = { must: 2, nice: 1 };
const INFER_CREDIT = 0.9; // depth 1
const SKILL_GATE_CAP = 39;
export const CHANCE_HIGH_MIN = 75, CHANCE_MEDIUM_MIN = 50;
export const CHANCE = ['Thấp', 'Trung bình', 'Cao'];

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Whole-skill mention: "SQL" must not match inside "MySQL". */
const mentions = (text: string, skill: string) => new RegExp(`(^|[^\\p{L}\\p{N}])${esc(skill)}(?![\\p{L}\\p{N}])`, 'iu').test(text);

/** credit(skill) for the base CV (facts) or for a tailored CV (its sentences). */
function creditFn(cv?: Sentence[]) {
  if (!cv) return (s: string) => USER_SKILLS.includes(s) ? 1 : INFERRED[s] ? INFER_CREDIT : 0;
  const direct = cv.filter(x => x.origin !== 'inferred').map(x => x.text).join('\n');
  const all = cv.map(x => x.text).join('\n');
  return (s: string) => mentions(direct, s) ? 1
    : mentions(all, s) || (INFERRED[s] && mentions(all, INFERRED[s])) ? INFER_CREDIT : 0;
}

// ponytail: semantic should be cosine(cv_embedding, job_embedding); without embeddings in the demo we scale the job's
// stored semantic factor by how much of the JD vocabulary the CV still covers. Replace with the API's value.
const words = (t: string) => new Set(t.toLowerCase().split(/[^\p{L}\p{N}.]+/u).filter(w => w.length >= 3));
function coverage(cvText: string, j: Job) {
  const jd = words([j.title, ...j.req, ...j.nice, j.extra ?? '', 'REST API backend dịch vụ test tự động'].join(' '));
  const cv = words(cvText);
  return [...jd].filter(w => cv.has(w)).length / jd.size;
}
const BASE_TEXT = BASE_SENTENCES.map(x => x.text).join('\n');

export function matchOf(j: Job, cv?: Sentence[]): Match {
  const credit = creditFn(cv);
  const reqs = [...j.req.map(s => [s, REQ_WEIGHT.must] as const), ...j.nice.map(s => [s, REQ_WEIGHT.nice] as const)];
  const total = reqs.reduce((a, [, w]) => a + w, 0);
  const skill = total ? reqs.reduce((a, [s, w]) => a + w * credit(s), 0) / total : 1;

  const semBase = j.f[1] / WEIGHTS.semantic;
  const semantic = cv ? Math.min(1, semBase * coverage(cv.map(x => x.text).join('\n'), j) / coverage(BASE_TEXT, j)) : semBase;
  const factors = [skill, semantic, j.f[2] / WEIGHTS.experience, j.f[3] / WEIGHTS.location];
  const points = FACTORS.map((f, i) => f.max * factors[i]);

  let score = Math.round(points.reduce((a, b) => a + b, 0));
  if (skill === 0) score = Math.min(score, SKILL_GATE_CAP);

  const missing = j.req.filter(s => credit(s) === 0), reasons: string[] = [];
  const baseChance = score >= CHANCE_HIGH_MIN ? 2 : score >= CHANCE_MEDIUM_MIN ? 1 : 0;
  let chance = baseChance;
  if (missing.length) { chance--; reasons.push(`thiếu yêu cầu bắt buộc ${missing.join(', ')}`); }
  if (j.comp === 'high') { chance--; reasons.push('cạnh tranh cao'); }
  const credits = Object.fromEntries(reqs.map(([s]) => [s, credit(s)]));
  return { points, score, chance: Math.max(0, chance), baseChance, missing, reasons, credits };
}

// Self-check against docs/09-algorithms.md §9 (row 1): MUST REST API, Node.js, SQL, Git · NICE Docker → skill 0.867.
if (process.env.NODE_ENV !== 'production') {
  const ex = { req: ['REST API', 'Node.js', 'SQL', 'Git'], nice: ['Docker'], f: [0, 16, 20, 15], comp: 'normal' } as unknown as Job;
  const m = matchOf(ex);
  console.assert(Math.abs(m.points[0] / 40 - 7.8 / 9) < 1e-9 && m.score === 86 && m.chance === 2, 'matchOf drifted from docs/09 §9', m);
}
