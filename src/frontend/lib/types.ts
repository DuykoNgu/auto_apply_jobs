// Domain model the screens work with (view model). Shared by features, demo data and the match formula.
// Wire types from the API will be generated into lib/api-types.ts (openapi-typescript, docs/api/openapi.yaml);
// each feature's api.ts maps them onto these. Component-local types (props, tab ids…) stay next to their component.

export type User = { name: string; email: string; role: string; city: string };

export type Job = {
  id: string; title: string; company: string; loc: string; mode: string; salary: string;
  source: string; posted: string; req: string[]; nice: string[];
  /** Precomputed factor points [skill, semantic, experience, location]; only the last three are used (see match.ts). */
  f: [number, number, number, number];
  comp: 'normal' | 'high'; manual?: boolean; extra?: string;
};
export type Origin = 'original' | 'rewritten' | 'inferred' | 'review';
export type Sentence = { id: string; sec: string; origin: Origin; text: string; orig: string; ev: string[]; note?: string; jd?: string };
export type AppStatus = 'interview' | 'submitted' | 'reminded' | 'rejected';
export type Mail = { out: boolean; from: string; date: string; subj: string; body: string; label?: { t: string; conf: number } };
export type Application = { id: string; jobId: string; status: AppStatus; date: string; to?: string; thread: Mail[]; draft?: string; draftSent?: boolean };
export type LogEntry = { t: string; x: string; you?: boolean };
export type CvField = { k: string; v: string; c: number; src: string; note?: string; ok?: boolean };

/** Live matching result for one job (lib/demo/match.ts, docs/09-algorithms.md §3–4). */
export type Match = { points: number[]; score: number; chance: number; baseChance: number; missing: string[]; reasons: string[]; credits: Record<string, number> };
