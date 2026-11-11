"""Generate Microsoft Edge neural speech and embed it in the bilingual script."""

import argparse
import asyncio
import base64
from dataclasses import dataclass
from hashlib import sha256
from html import escape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
from uuid import uuid4

import edge_tts

ROOT = Path(__file__).resolve().parents[2]
DOCUMENT = ROOT / 'docs/15分钟中英对照演讲稿.html'
CACHE = ROOT / '.cache/speech-tts'
RESOURCES = Path(__file__).resolve().parent
VOICES = {
    'en': ('en-US-AriaNeural', '-15%'),
    'zh-CN': ('zh-CN-XiaoxiaoNeural', '-5%'),
}


@dataclass
class Paragraph:
    start: int
    end: int
    slide: int
    language: str
    text: str


class ScriptParser(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.line_offsets = [0]
        for match in re.finditer('\n', source):
            self.line_offsets.append(match.end())
        self.paragraphs = []
        self.pair_depth = 0
        self.slide = 0
        self.current = None
        self.parts = []
        self.feed(source)

    def source_offset(self):
        line, column = self.getpos()
        return self.line_offsets[line - 1] + column

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if tag == 'section' and 'data-slide' in attributes:
            self.slide = int(attributes['data-slide'])
        if tag == 'div':
            if self.pair_depth:
                self.pair_depth += 1
            elif 'pair' in attributes.get('class', '').split():
                self.pair_depth = 1
        if tag == 'p' and self.pair_depth:
            self.current = {
                'start': self.source_offset(),
                'slide': self.slide,
                'language': attributes['lang'],
                'original': attributes.get('data-speech-original'),
            }
            self.parts = []

    def handle_data(self, text):
        if self.current is not None:
            self.parts.append(text)

    def handle_endtag(self, tag):
        if tag == 'p' and self.current is not None:
            item = self.current
            text = item['original'] if item['original'] is not None else ''.join(self.parts)
            self.paragraphs.append(Paragraph(
                item['start'], self.source_offset() + len('</p>'), item['slide'],
                item['language'], text.strip(),
            ))
            self.current = None
        if tag == 'div' and self.pair_depth:
            self.pair_depth -= 1


def sentences(text, language):
    if language == 'zh-CN':
        return re.findall(r'[^。！？]+[。！？]?', text)
    return re.split(r'(?<=[.!?])\s+', text)


def speech_text(text, language):
    text = text.replace('AlphaTensor', 'Alpha Tensor')
    if language == 'zh-CN':
        text = text.replace('Strassen', '斯特拉森')
        digits = str.maketrans('₀₁₂₃₄₅₆₇₈₉', '零一二三四五六七八九')
        text = re.sub(r'([A-Za-z])([₀-₉]+)',
                      lambda match: match[1] + ' ' + match[2].translate(digits), text)
        text = text.replace('4×4', '四乘四').replace('×', '乘')
    return text


def make_lines(paragraphs):
    lines = []
    positions = {}
    for paragraph in paragraphs:
        key = (paragraph.slide, paragraph.language)
        paragraph_number = positions.get(key, 0) + 1
        positions[key] = paragraph_number
        language_id = 'en' if paragraph.language == 'en' else 'zh'
        for number, text in enumerate(sentences(paragraph.text, paragraph.language), 1):
            text = text.strip()
            if not text:
                continue
            voice, rate = VOICES[paragraph.language]
            spoken = speech_text(text, paragraph.language)
            fingerprint = sha256(f'{voice}\n{rate}\n{spoken}'.encode()).hexdigest()[:24]
            lines.append({
                'id': f's{paragraph.slide:02d}-{language_id}-p{paragraph_number:02d}-l{number:02d}',
                'slide': paragraph.slide,
                'language': paragraph.language,
                'paragraph': paragraph_number,
                'text': text,
                'spokenText': spoken,
                'voice': voice,
                'rate': rate,
                'hash': fingerprint,
            })
    return lines


def duration(filename):
    result = subprocess.run([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', str(filename),
    ], check=True, capture_output=True, text=True)
    value = float(result.stdout.strip())
    if value <= 0:
        raise ValueError('Generated audio has no duration')
    return round(value, 3)


async def generate(lines):
    CACHE.mkdir(parents=True, exist_ok=True)
    available = {voice['ShortName'] for voice in await edge_tts.list_voices()}
    if not {voice for voice, rate in VOICES.values()} <= available:
        raise RuntimeError('A configured Microsoft voice is unavailable')
    completed = 0
    semaphore = asyncio.Semaphore(3)

    async def generate_line(line):
        nonlocal completed
        async with semaphore:
            filename = CACHE / (line['hash'] + '.mp3')
            if not filename.exists():
                for attempt in range(4):
                    temporary = CACHE / f"{line['hash']}.{uuid4().hex}.part.mp3"
                    try:
                        voice = edge_tts.Communicate(
                            line['spokenText'], line['voice'], rate=line['rate'],
                            connect_timeout=15, receive_timeout=45,
                        )
                        await voice.save(str(temporary))
                        duration(temporary)
                        temporary.replace(filename)
                        break
                    except Exception as error:
                        temporary.unlink(missing_ok=True)
                        if attempt == 3:
                            raise RuntimeError(f"Synthesis failed for {line['id']}") from error
                        await asyncio.sleep(2 ** attempt)
            line['duration'] = duration(filename)
            line['audio'] = 'data:audio/mpeg;base64,' + base64.b64encode(filename.read_bytes()).decode()
            completed += 1
            if completed % 10 == 0 or completed == len(lines):
                print(f'Generated {completed}/{len(lines)} sentence clips', flush=True)

    await asyncio.gather(*(generate_line(line) for line in lines))


def render(source, paragraphs, lines):
    lookup = {}
    for line in lines:
        lookup.setdefault((line['slide'], line['language'], line['paragraph']), []).append(line)
    positions = {}
    replacements = []
    for paragraph in paragraphs:
        key = (paragraph.slide, paragraph.language)
        number = positions.get(key, 0) + 1
        positions[key] = number
        pieces = []
        for line in lookup[(paragraph.slide, paragraph.language, number)]:
            label = '播放本句' if paragraph.language == 'zh-CN' else 'Play this sentence'
            pieces.append(
                f'<span class="speech-line" id="{line["id"]}">'
                f'<button class="line-play" type="button" data-speech-id="{line["id"]}" '
                f'aria-label="{label}" aria-pressed="false" title="{label}">▶</button>'
                f'<span class="line-text">{escape(line["text"])}</span></span>'
            )
        rendered = (f'<p lang="{paragraph.language}" class="speech-paragraph" '
                    f'data-speech-original="{escape(paragraph.text, quote=True)}">'
                    + ''.join(pieces) + '</p>')
        replacements.append((paragraph.start, paragraph.end, rendered))
    for start, end, replacement in reversed(replacements):
        source = source[:start] + replacement + source[end:]
    for name in ['CONTROLS', 'STYLE', 'DATA', 'PLAYER']:
        source = re.sub(rf'<!--SPEECH_{name}:START-->.*?<!--SPEECH_{name}:END-->\n?',
                        '', source, flags=re.S)
    controls = (RESOURCES / 'controls.html').read_text()
    style = '<style>' + (RESOURCES / 'player.css').read_text() + '</style>'
    payload = {'provider': 'Microsoft Edge online neural TTS', 'lines': lines}
    data = ('<script type="application/json" id="speech-audio-data">'
            + json.dumps(payload, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
            + '</script>')
    player = '<script>' + (RESOURCES / 'player.js').read_text().replace('</script', '<\\/script') + '</script>'
    source = source.replace('</head>', f'<!--SPEECH_STYLE:START-->{style}<!--SPEECH_STYLE:END-->\n</head>', 1)
    source = source.replace('<section class="script-section"',
                            f'<!--SPEECH_CONTROLS:START-->{controls}<!--SPEECH_CONTROLS:END-->\n<section class="script-section"', 1)
    source = source.replace('</body>', f'<!--SPEECH_DATA:START-->{data}<!--SPEECH_DATA:END-->\n'
                            f'<!--SPEECH_PLAYER:START-->{player}<!--SPEECH_PLAYER:END-->\n</body>', 1)
    return source


async def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--limit', type=int, help='Generate only this many clips to test synthesis')
    args = parser.parse_args()
    source = DOCUMENT.read_text()
    paragraphs = ScriptParser(source).paragraphs
    if not paragraphs or {paragraph.slide for paragraph in paragraphs} != set(range(1, 22)):
        raise RuntimeError('Expected bilingual speech paragraphs for all 21 slides')
    lines = make_lines(paragraphs)
    if args.limit is not None:
        await generate(lines[:args.limit])
        return
    print(f'Synthesizing {len(lines)} sentences from {len(paragraphs)} paragraphs', flush=True)
    await generate(lines)
    # Re-read after generation so retries retain any accompanying document updates.
    source = DOCUMENT.read_text()
    current_paragraphs = ScriptParser(source).paragraphs
    if [(p.slide, p.language, p.text) for p in current_paragraphs] != [
        (p.slide, p.language, p.text) for p in paragraphs
    ]:
        raise RuntimeError('Script text changed during generation. Rerun to synthesize the updated text.')
    output = render(source, current_paragraphs, lines)
    temporary = CACHE / f'script-{uuid4().hex}.tmp.html'
    temporary.write_text(output)
    temporary.replace(DOCUMENT)
    manifest = [{key: value for key, value in line.items() if key != 'audio'} for line in lines]
    (CACHE / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    for language in VOICES:
        subset = [line for line in lines if line['language'] == language]
        seconds = sum(line['duration'] for line in subset)
        print(f'{language}: {len(subset)} clips, {seconds:.1f} seconds', flush=True)
    print(f'Embedded all audio in {DOCUMENT.name} ({DOCUMENT.stat().st_size / 1024 / 1024:.1f} MiB)', flush=True)


if __name__ == '__main__':
    asyncio.run(main())
