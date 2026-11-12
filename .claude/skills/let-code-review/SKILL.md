---
name: let-code-review
description: Review the uncommitted changes in the Let repo against CLAUDE.md and the matching .claude/rules files, and report findings without changing anything. Use when the user asks to review or check their changes before a commit ("review my changes", "is this ready to commit?"). Read-only, never edits, commits or opens a PR.
context: fork
background: false
model: opus
effort: high
allowed-tools: Bash(bash .claude/skills/let-code-review/scripts/diff.sh) Bash(bash .claude/skills/let-code-review/scripts/checks.sh) Bash(git diff *) Bash(git status *) Bash(git log *) Read Grep Glob
disallowed-tools: Edit Write NotebookEdit
---

# Let code review

You review the uncommitted changes below and write a report. You never change a file, stage,
commit or push: the review is evidence for the author, not a fix.

## Iron rule

**No evidence, no finding.** A finding needs all three: the `file:line` in the diff, the rule it
breaks (quoted from `CLAUDE.md` or a rules file), and a concrete failure case (input or state →
wrong result). If you cannot fill in all three, drop it. Report a check as PASS only when its
output in step 2 says so.

## The changes

```!
bash .claude/skills/let-code-review/scripts/diff.sh
```

If the block above says `NO CHANGES`, answer "No uncommitted changes to review." and stop.

## Workflow

1. **Load the rules.** Read `.claude/CLAUDE.md`. Then read each file in `.claude/rules/` whose
   `paths` frontmatter matches a file in the diff. When the diff touches API calls, saves, Route
   Handlers or error states, also read `.claude/skills/error-handling/SKILL.md`.

2. **Collect facts.** Run `bash .claude/skills/let-code-review/scripts/checks.sh` once. Keep its
   output as is. These are facts; everything you think about the diff is a suspicion until step 4.

3. **List suspicions.** Go through the diff hunk by hunk against the loaded rules. Write each
   suspicion with the rule it may break. Look hardest at "Rules that always apply" in `CLAUDE.md`,
   the escape hatches in `code-style.md`, and a test for every changed behaviour.

4. **Verify each suspicion.** For every suspicion, name the innocent explanation (handled by a
   caller, filtered elsewhere, covered by a test, allowed by an exception in the rules) and check
   it by reading the code with Read, Grep or `git diff`. Record the result: **confirmed** or
   **refuted**, with the line that decided it. Drop every refuted one.

5. **Report**, in exactly this format and nothing else:

```markdown
## Code review: <n> findings

### Checks

| Check        | Result                         |
| ------------ | ------------------------------ |
| lint         | PASS / FAIL (first error line) |
| typecheck    | PASS / FAIL (…)                |
| format:check | PASS / FAIL (…)                |
| test         | PASS / FAIL (…)                |

### Findings

1. **<severity: blocker | major | minor>** `path/to/file.ts:42` — <one-sentence problem>
   - Rule: "<quoted rule>" (<source file>)
   - Failure: <input or state → wrong result>
   - Fix: <smallest change that would fix it, described, not applied>

### Dropped suspicions

- `path:line` — <suspicion> — refuted: <the line or fact that refuted it>

### Verdict

Ready to commit / Not ready: <the blockers>
```

Severity: **blocker** breaks a rule that always applies or a failing check; **major** is a bug or
a missing test for changed behaviour; **minor** is style or naming the tools did not catch. With no
findings, write "No findings." under Findings and keep the other sections.
