<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **ExamMaster** (7246 symbols, 11314 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/ExamMaster/context` | Codebase overview, check index freshness |
| `gitnexus://repo/ExamMaster/clusters` | All functional areas |
| `gitnexus://repo/ExamMaster/processes` | All execution flows |
| `gitnexus://repo/ExamMaster/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |
| Work in the Services area (248 symbols) | `.claude/skills/generated/services/SKILL.md` |
| Work in the Admin area (159 symbols) | `.claude/skills/generated/admin/SKILL.md` |
| Work in the Scripts area (134 symbols) | `.claude/skills/generated/scripts/SKILL.md` |
| Work in the Student area (88 symbols) | `.claude/skills/generated/student/SKILL.md` |
| Work in the Components area (71 symbols) | `.claude/skills/generated/components/SKILL.md` |
| Work in the Cluster_229 area (61 symbols) | `.claude/skills/generated/cluster-229/SKILL.md` |
| Work in the Cluster_230 area (42 symbols) | `.claude/skills/generated/cluster-230/SKILL.md` |
| Work in the Middleware area (14 symbols) | `.claude/skills/generated/middleware/SKILL.md` |
| Work in the Registration area (12 symbols) | `.claude/skills/generated/registration/SKILL.md` |
| Work in the Cluster_233 area (8 symbols) | `.claude/skills/generated/cluster-233/SKILL.md` |
| Work in the Controllers area (8 symbols) | `.claude/skills/generated/controllers/SKILL.md` |
| Work in the Cluster_231 area (7 symbols) | `.claude/skills/generated/cluster-231/SKILL.md` |
| Work in the Cluster_232 area (6 symbols) | `.claude/skills/generated/cluster-232/SKILL.md` |
| Work in the Cluster_234 area (6 symbols) | `.claude/skills/generated/cluster-234/SKILL.md` |
| Work in the Cluster_20 area (5 symbols) | `.claude/skills/generated/cluster-20/SKILL.md` |
| Work in the Cluster_237 area (4 symbols) | `.claude/skills/generated/cluster-237/SKILL.md` |
| Work in the Cluster_21 area (3 symbols) | `.claude/skills/generated/cluster-21/SKILL.md` |

<!-- gitnexus:end -->
