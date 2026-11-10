import { execFileSync, spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { z } from 'zod';

const skillName = 'let-code-review';
const runsPerCase = z.coerce
  .number()
  .int()
  .min(1)
  .parse(process.env.EVAL_RUNS ?? '3');
const evalDir = import.meta.dirname;
const logDir = path.join(evalDir, 'logs');
const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();

const caseSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  fixture: z.string().optional(),
  shouldTrigger: z.boolean(),
  reportMustMention: z.array(z.string()),
  reportMustNotMention: z.array(z.string()),
});
type EvalCase = z.infer<typeof caseSchema>;

const streamEventSchema = z.object({
  type: z.string(),
  subtype: z.string().nullish(),
  tool_name: z.string().optional(),
  message: z.object({ content: z.array(z.json()) }).optional(),
  result: z.string().optional(),
});
const skillCallSchema = z.object({
  type: z.literal('tool_use'),
  name: z.literal('Skill'),
  input: z.object({ skill: z.string() }),
});

const git = (cwd: string, ...args: readonly string[]): string =>
  execFileSync('git', ['-c', 'user.name=eval', '-c', 'user.email=eval@localhost', ...args], {
    cwd,
    encoding: 'utf8',
  });

function createWorkspace(dir: string, evalCase: EvalCase): void {
  git(repoRoot, 'worktree', 'add', '--detach', dir, 'HEAD');
  cpSync(path.join(repoRoot, '.claude'), path.join(dir, '.claude'), { recursive: true });
  rmSync(path.join(dir, '.claude/skills', skillName, 'evals'), { recursive: true, force: true });
  git(dir, 'add', '-A');
  git(dir, 'commit', '--allow-empty', '--no-verify', '-m', 'eval baseline');
  symlinkSync(path.join(repoRoot, 'node_modules'), path.join(dir, 'node_modules'));
  if (evalCase.fixture) git(dir, 'apply', path.join(evalDir, evalCase.fixture));
}

const parseEvents = (stdout: string): readonly z.infer<typeof streamEventSchema>[] =>
  stdout
    .split('\n')
    .filter((line) => line.startsWith('{'))
    .map((line) => streamEventSchema.safeParse(JSON.parse(line)))
    .flatMap((parsed) => (parsed.success ? [parsed.data] : []));

// A Skill call that was denied permission never loaded the skill, so it does not count.
const loadedSkill = (events: ReturnType<typeof parseEvents>): boolean =>
  events
    .flatMap((event) => event.message?.content ?? [])
    .some((item) => skillCallSchema.safeParse(item).data?.input.skill === skillName) &&
  !events.some((event) => event.subtype === 'permission_denied' && event.tool_name === 'Skill');

function runClaude(
  dir: string,
  evalCase: EvalCase,
): Readonly<{ stdout: string; changed: boolean }> {
  createWorkspace(dir, evalCase);
  const changesBefore = git(dir, 'status', '--porcelain') + git(dir, 'diff', 'HEAD');
  const claude = spawnSync(
    'claude',
    [
      '-p',
      evalCase.prompt,
      '--output-format',
      'stream-json',
      '--verbose',
      '--max-budget-usd',
      '3',
      // Stands in for the user approving the skill; its own allowed-tools govern everything else.
      '--allowedTools',
      `Skill(${skillName})`,
    ],
    { cwd: dir, encoding: 'utf8', timeout: 15 * 60_000, maxBuffer: 64 * 1024 * 1024 },
  );
  const changesAfter = git(dir, 'status', '--porcelain') + git(dir, 'diff', 'HEAD');
  return { stdout: claude.stdout ?? '', changed: changesBefore !== changesAfter };
}

function runOnce(evalCase: EvalCase, run: number): readonly string[] {
  const tempRoot = mkdtempSync(path.join(tmpdir(), 'let-review-eval-'));
  const dir = path.join(tempRoot, 'repo');
  const { stdout, changed } = (() => {
    try {
      return runClaude(dir, evalCase);
    } finally {
      spawnSync('git', ['worktree', 'remove', '--force', dir], { cwd: repoRoot });
      rmSync(tempRoot, { recursive: true, force: true });
    }
  })();
  writeFileSync(path.join(logDir, `${evalCase.id}-${run}.jsonl`), stdout);

  const events = parseEvents(stdout);
  const report = (events.findLast((event) => event.type === 'result')?.result ?? '').toLowerCase();
  const triggered = loadedSkill(events);
  const failures = [
    triggered === evalCase.shouldTrigger
      ? ''
      : `skill invoked: ${triggered}, expected ${evalCase.shouldTrigger}`,
    changed ? 'files changed during a read-only review' : '',
    ...evalCase.reportMustMention.map((text) =>
      report.includes(text.toLowerCase()) ? '' : `report does not mention "${text}"`,
    ),
    ...evalCase.reportMustNotMention.map((text) =>
      report.includes(text.toLowerCase()) ? `report mentions "${text}"` : '',
    ),
  ];
  return failures.filter((failure) => failure !== '');
}

const cases = z
  .array(caseSchema)
  .parse(JSON.parse(readFileSync(path.join(evalDir, 'cases.json'), 'utf8')));
mkdirSync(logDir, { recursive: true });

const results = cases.map((evalCase) => {
  const runs = Array.from({ length: runsPerCase }, (_, run) => runOnce(evalCase, run + 1));
  const passed = runs.filter((failures) => failures.length === 0).length;
  console.log(
    `${passed === runsPerCase ? 'PASS' : 'FAIL'}  ${evalCase.id}  ${passed}/${runsPerCase}`,
  );
  runs.forEach((failures, run) =>
    failures.forEach((failure) => console.log(`      run ${run + 1}: ${failure}`)),
  );
  return passed === runsPerCase;
});

process.exitCode = results.every(Boolean) ? 0 : 1;
