# Classroom Notebook demo

## Responsibility

Maintain the runnable `alphatensor_demo.ipynb` classroom companion and validate it against the current slide data. `scripts/export-classroom.mjs` copies it beside the presentation and voiced script in the parent classroom-material folder, preserving the downloaded bytes and saved outputs. The script footer includes a same-folder Notebook download link and dependency instructions.

## Source

Downloaded from the configured repository with `git fetch origin main` and `git show origin/main:alphatensor_demo.ipynb` on 2026-11-10. Remote main was `6f4ecc89588fcd84b87403b9ee08024e6b6775e0`. The task is `TASK-20261110-002`, executed by Codex. Provenance is also recorded in `presentation/REFERENCES.md`.

The Notebook has 12 cells, including six Python cells. It contains the complete 47 factor triples and saved results, including the cost-model chart. The code uses NumPy for independent reference checks and Matplotlib for the chart. Notebook data loading is self-contained.

## Runtime and validation environment

- Runtime is Python 3.13.15 in the project-local `.venv/`.
- Dependencies are pinned in `presentation/notebook-demo/requirements.txt`.
- NumPy and Matplotlib are demo runtime dependencies. nbformat, nbclient, ipykernel and nbconvert support isolated execution, structural validation and HTML preview inspection.
- Validation artifacts, relocated demo files, Jupyter state and Matplotlib caches are stored under Git-ignored `.cache/notebook-demo/`.
- Node dependencies, Docker and application service APIs are inapplicable to this module.

Install the project validation dependencies from the project root.

```bash
UV_CACHE_DIR=.cache/uv uv pip install --python .venv/bin/python -r presentation/notebook-demo/requirements.txt
node scripts/export-classroom.mjs
node scripts/export-classroom.mjs classroom
```

The tracked `classroom/` directory is the downloadable GitHub copy of the same three files, named `matrix_ai_presentation.html`, `bilingual_speech_script.html` and `alphatensor_demo.ipynb`. `docs/3分钟Notebook演示讲稿.html` provides the companion six-part English demonstration transcript from upstream main.

For classroom use on another device, open the exported Notebook in Jupyter or VS Code, select a Python 3 kernel, install `numpy` and `matplotlib` in that kernel's environment and run all cells in order. The first algorithm cell defines the factor data used by later cells.

## Validation status

All six code cells executed successfully in an isolated copy of the three-file delivery at a path containing Chinese characters and spaces. The 47 factors match `dist/alpha47.js` in order. All 4096 coefficient checks pass, and all algorithms agree with NumPy on 100 random matrix pairs. The saved chart and freshly computed chart were inspected and agree with the cost table. Notebook source and exported bytes remain identical to the downloaded GitHub file.
