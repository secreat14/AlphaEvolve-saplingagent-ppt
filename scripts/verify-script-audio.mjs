import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filename = path.resolve(root, process.argv[2] || 'docs/15分钟中英对照演讲稿.html');
const html = fs.readFileSync(filename, 'utf8');
const resources = path.join(root, 'presentation/speech-script');
const embedded = html.match(/<script type="application\/json" id="speech-audio-data">([\s\S]*?)<\/script>/);
assert(embedded, 'Embedded speech audio is missing');
const payload = JSON.parse(embedded[1]);
assert.equal(payload.provider, 'Microsoft Edge online neural TTS');
const lines = payload.lines;
const byId = new Map(lines.map(line => [line.id, line]));
assert.equal(byId.size, lines.length, 'Duplicate audio IDs');
assert.equal(lines.length, 255, 'Update sentence coverage after a deliberate script change');
assert.equal(lines.filter(line => line.language === 'en').length, 144);
assert.equal(lines.filter(line => line.language === 'zh-CN').length, 111);

const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
const normalize = text => text.replace(/\s+/g, '');
const voices = {en: 'en-US-AriaNeural', 'zh-CN': 'zh-CN-XiaoxiaoNeural'};
const buttons = [...html.matchAll(/data-speech-id="([^"]+)"/g)].map(match => match[1]);
assert.equal(buttons.length, lines.length, 'Every sentence needs a playback button');
assert.equal(new Set(buttons).size, lines.length, 'Duplicate playback buttons');
for (const line of lines) {
  assert(buttons.includes(line.id), `Missing button ${line.id}`);
  assert(html.includes(`id="${line.id}"`), `Missing highlighted sentence ${line.id}`);
  assert(html.includes(`<span class="line-text">${escape(line.text)}</span>`), `Text mismatch ${line.id}`);
  assert.equal(line.voice, voices[line.language]);
  assert(line.duration > 0, `Invalid duration ${line.id}`);
  assert(line.audio.startsWith('data:audio/mpeg;base64,'), `Audio must be embedded ${line.id}`);
  const bytes = Buffer.from(line.audio.split(',')[1], 'base64');
  assert(bytes.length > 1000, `Empty audio ${line.id}`);
  assert(bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 255 && (bytes[1] & 224) === 224),
    `Invalid MP3 header ${line.id}`);
}

const paragraphs = [...html.matchAll(/<p lang="([^"]+)" class="speech-paragraph" data-speech-original="([^"]*)">([\s\S]*?)<\/p>/g)];
assert.equal(paragraphs.length, 92, 'Every spoken paragraph must retain its original text');
const covered = [];
for (const [, language, original, content] of paragraphs) {
  const ids = [...content.matchAll(/data-speech-id="([^"]+)"/g)].map(match => match[1]);
  const paragraphLines = ids.map(id => byId.get(id));
  assert(paragraphLines.every(line => line?.language === language), 'Paragraph language mismatch');
  assert.equal(normalize(escape(paragraphLines.map(line => line.text).join(' '))), normalize(original),
    `Sentence split lost paragraph text ${ids[0]}`);
  covered.push(...ids);
}
assert.deepEqual(covered, lines.map(line => line.id), 'Playback order must follow the script');
assert.equal(new Set(lines.map(line => line.slide)).size, 21);

for (const [name, filename, tag] of [['STYLE', 'player.css', 'style'], ['PLAYER', 'player.js', 'script']]) {
  const block = html.match(new RegExp(`<!--SPEECH_${name}:START--><${tag}>([\\s\\S]*?)<\\/${tag}><!--SPEECH_${name}:END-->`));
  assert(block, `Missing ${name} block`);
  assert.equal(block[1], fs.readFileSync(path.join(resources, filename), 'utf8'), `${filename} is out of date`);
  if (tag === 'script') new vm.Script(block[1], {filename});
}
const controls = fs.readFileSync(path.join(resources, 'controls.html'), 'utf8');
assert(html.includes(`<!--SPEECH_CONTROLS:START-->${controls}<!--SPEECH_CONTROLS:END-->`));
console.log('PASS: 255 embedded Microsoft clips, 92 intact paragraphs, 21 slides, playback order and player resources.');
