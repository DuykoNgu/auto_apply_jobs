import { INFERRED, JOBS, USER_SKILLS } from '@/lib/demo/data';
import { matchFor, type DemoState } from '@/lib/demo/store';
import type { Job } from '@/lib/types';

export function filteredJobs(s: DemoState) {
  return JOBS.filter(j => {
    if (s.filter.chance !== 'all' && String(matchFor(s, j).chance) !== s.filter.chance) return false;
    if (s.filter.skill) { const k = s.filter.skill.split(' / ')[0]; if (![...j.req, ...j.nice].includes(k)) return false; }
    return true;
  }).sort((a, b) => matchFor(s, b).score - matchFor(s, a).score);
}

type SkillState = 'met' | 'inferred' | 'missing' | 'unclear';
export const ST: Record<SkillState, [string, 'ok' | 'warn' | 'bad']> = { met: ['Có', 'ok'], inferred: ['Suy ra', 'warn'], missing: ['Thiếu', 'bad'], unclear: ['Chưa rõ', 'warn'] };

/** AI margin notes per JD paragraph. */
export function insights(j: Job) {
  const st = (s: string): SkillState => USER_SKILLS.includes(s) ? 'met' : INFERRED[s] ? 'inferred' : 'missing';
  const rows = [...j.req.map(s => ({ s, st: st(s), p: 'p3' })), ...j.nice.map(s => ({ s, st: st(s), p: 'p4' }))];
  if (j.extra) rows.push({ s: 'Scrum', st: 'unclear', p: 'p5' });
  return rows;
}

export function companyMark(name: string) {
  const cleaned = name.replace(/^Công ty\s+/i, '').trim();
  const parts = cleaned.replace(/\bVN\b/gi, '').trim().replace(/([a-zà-ỹ])([A-Z])/g, '$1 $2').split(/\s+/).filter(Boolean);
  const mark = parts.map(w => w[0]).join('').slice(0, 2);
  return (mark.length > 1 ? mark : cleaned.slice(0, 2)).toUpperCase();
}
export const companyTone = (name: string) => [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 4;
