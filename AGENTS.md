# Documentation protocol (mandatory, token-lean)

Docs live in /docs. Exactly 3 files. Never create others.

- STATE.md: current truth, max 80 lines. Sections: Stack | Folders | Tables | Routes | Env | Features | Open. EDIT IN PLACE; never append history here.
- LOG.md: append-only, ONE line per change set:
  `N-### | YYYY-MM-DD | tags | files | what+why (<=25 words) | undo: <hint, only if risky>`
  Tags: [SEC] [DB] [FEAT] [FIX] [REFACTOR] [DOC]
- DECISIONS.md: only for choices with real alternatives or gotchas:
  `D## | decision | why | rejected: <alt>` (max 3 lines each)

## Session start
1. Read docs/STATE.md in full.
2. Read only `tail -n 20 docs/LOG.md`. Never read the whole log.
3. Do not re-explore code that STATE.md already describes. Use grep and targeted views.

## During work
- Group edits into change sets. Write ONE LOG line per set, not per file.
- Update only the STATE.md lines affected (targeted edit, never rewrite the file).
- DB changes: numbered SQL file in supabase/migrations/NNN_name.sql. Never edit an applied migration. Update the Tables section of STATE.md.
- If code contradicts STATE.md: trust the code, fix STATE.md, log it as [DOC].

## Never
- No narrative, no apologies, no restating diffs, no per-function essays.
- No printing files back into chat.
- No new feature, refactor, or cleanup beyond the task given.

## Done = all true
1. LOG line written. 2. STATE.md matches reality. 3. Commit message = the LOG line.
Final chat reply max 5 lines: `Done: N-###. Files: ... Human must: ... Risks: ...`
