# Bilingual speaking-script audio

## Responsibility

Generate Microsoft Edge online neural TTS for every spoken sentence in `docs/15分钟中英对照演讲稿.html`. The HTML embeds MP3 data and its player for offline use. The 21 slide sections and original bilingual paragraph text remain the script's source. Stage directions stay in the separate cue blocks.

`build_audio.py` splits the paragraphs into sentences, synthesizes clips, then updates only the speech paragraph markup and four marked resource blocks. On reruns it recovers each paragraph from `data-speech-original`. To change a spoken paragraph, edit that attribute before regenerating, or replace that paragraph with a plain `<p lang="en">` or `<p lang="zh-CN">` containing the revised text. The generated `.line-text` spans mirror that source.

## Voices and playback

- English uses `en-US-AriaNeural` with synthesis rate `-15%` for practice.
- Chinese uses `zh-CN-XiaoxiaoNeural` with synthesis rate `-5%`.
- `player.js` provides sentence playback, highlighted current text, English/Chinese/bilingual queues, pause/resume, stop, playback speed and sentence repeat.
- `player.css` and `controls.html` are embedded by the generator. They support desktop, mobile and printing.
- Generation uses the third-party `edge-tts` client to access Microsoft's Edge online speech service. The dependency is pinned to `7.3.1`.
- Generation sends the sentence text to the online service. The completed HTML plays its embedded clips offline with browser audio support.

## Project environment

- Module directory is `presentation/speech-script/`.
- Generation runtime is Python 3.13.15 in project-local `.venv/`.
- Python dependencies are in `presentation/speech-script/requirements.txt`.
- `ffprobe` from FFmpeg is required on the command path to validate clip durations.
- Temporary MP3 cache and audio-less manifest are in `.cache/speech-tts/`. Cache keys include voice, synthesis rate and spoken text. Failed downloads use temporary files and are retried up to four times. The HTML is replaced atomically after all clips are ready.
- `.venv/` and `.cache/` are Git-ignored. Browser playback has no Python dependency. Node dependencies and Docker are inapplicable to this module.

Run from the repository root with `uv` installed.

```bash
UV_CACHE_DIR=.cache/uv uv venv .venv --python python3
UV_CACHE_DIR=.cache/uv uv pip install --python .venv/bin/python -r presentation/speech-script/requirements.txt
.venv/bin/python presentation/speech-script/build_audio.py
node scripts/verify-script-audio.mjs
```

The first command initializes the project environment when absent. Existing installations can run the install and generation commands directly. Generation checks voice availability online and reuses cached clips for unchanged sentences. `--limit 1` generates a synthesis probe without rewriting the HTML.

## Validation

The static verifier checks embedded MP3 headers, sentence/button coverage, lossless paragraph splitting, playback order and embedded player resources. Expected counts represent the current 255-sentence, 92-paragraph, 21-slide script and should be reviewed after an intentional content change. Browser QA should additionally exercise real audio playback, pause/resume, queue transitions, repeat, speed, rapid selection, offline use and mobile/print layout.

Source provenance is maintained in `REFERENCES.md`. This module does not expose an application service API.

## Portable classroom export

After updating the script or demo, run `node scripts/export-classroom.mjs` from the project root. It writes `matrix_ai_presentation.html`, `bilingual_speech_script.html` and `alphatensor_demo.ipynb` to the parent classroom-material folder, updates companion links to same-folder relative paths and preserves embedded audio and source licenses. Transfer all three exported files for classroom presentation and Notebook demonstration. The HTML footer includes the Notebook's Python dependencies and run order. Run `node scripts/verify-script-audio.mjs ../bilingual_speech_script.html` to validate the exported audio coverage.
