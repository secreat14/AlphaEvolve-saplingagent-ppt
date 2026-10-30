# AI project entry point

@rules/README.md

Before development, modification, commits, tests, deployment or documentation work, read `rules/README.md` in full and follow its task routing.

Before the first substantive modification, provide the rules-reading receipt defined there. Before every final conversational reply and before committing, provide the eight-field completion-review receipt. Receipts report results; they do not request approval.

Also read:

1. `FINAL_GOAL.md`
2. `TODO.md`
3. `AI_TASKS.md`
4. Task-related Markdown in the relevant service directory.

## Project-specific notes

- Project goal: complete and maintain the 14-slide, approximately 12-minute Chinese presentation “AI 如何发现更快的矩阵乘法”.
- Presentation source lives in `presentation/`; build with `node scripts/build-presentation.mjs`.
- Generated presentation outputs are `dist/slides.html`, `矩阵与AI-20分钟演讲.html`, and `front/public/presentation/index.html`. Do not edit generated copies independently.
- Mathematical and structural checks are in `scripts/verify-*.mjs`.
- The presentation remains embedded in the Saplingagent application while the right-side AI chat stays available.
- Keep citations, licenses, speaker notes, accessibility, offline use, and the distinction between operation counts and real runtime.
- The publication target is `https://github.com/secreat14/AlphaEvolve-saplingagent-ppt.git`; verify the configured remote before every push.
- This customer repository publishes only `main`; do not create or push feature/release branches unless the user explicitly changes that instruction.
- Do not commit credentials, conversations, runtime data, logs, dependencies, caches, native application bundles or generated frontend build output.
- In particular, never commit the current AI configuration under `local-secrets/`, including `connections.json`, `auth.json`, API keys, login tokens or runtime service tokens.
