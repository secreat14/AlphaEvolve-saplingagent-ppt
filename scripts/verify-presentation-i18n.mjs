import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const catalogue = JSON.parse(fs.readFileSync('presentation/locales/en.json', 'utf8'));
const template = fs.readFileSync('presentation/slides.template.html', 'utf8');
const application = fs.readFileSync('presentation/slides.js', 'utf8');
const notes = JSON.parse(application.match(/const notes=(\[.*?\n\]);/s)[1]);
const source = fs.readFileSync('presentation/i18n.js', 'utf8')
  .replace('/*__ENGLISH__*/', () => JSON.stringify(catalogue));
const context = vm.createContext({});
vm.runInContext(source, context);
context.PresentationI18n.registerNotes(notes);
const translate = context.PresentationI18n.translate;
const han = /[\u3400-\u9fff]/u;

// Catch a changed slide or label that has not yet received an English translation.
const textOnly = template.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g, '')
  .replace(/<[^>]*>/g, '\n');
const visibleText = textOnly.split('\n').map(text => text.trim()).filter(text => han.test(text));
const labels = [...template.matchAll(/(?:title|aria-label|data-title|content)="([^"]*)"/g)]
  .map(match => match[1]).filter(text => han.test(text));
for (const text of [...visibleText, ...labels].filter(text => text !== '中文')) {
  assert.ok(!han.test(translate(text)), `Missing English message for ${text}`);
}
assert.equal(catalogue.notes.length, notes.length);
for (const note of notes) {
  assert.ok(!han.test(translate(note.text)));
  assert.ok(!han.test(translate(note.action)));
}
for (const [sourceText, englishText] of Object.entries(catalogue.messages)) {
  assert.ok(englishText.trim(), `Empty translation for ${sourceText}`);
  assert.ok(!han.test(englishText), `Chinese remains in English translation for ${sourceText}`);
}

// Dynamic text must work for new numeric values, beyond the initial example.
assert.equal(translate('第 47 项'), 'Term 47');
assert.equal(translate('第 7 项 + 第 13 项'), 'Term 7 + term 13');
assert.equal(translate('第 4 行与第 3 列，第 2 对数字'), 'Row 4, column 3 · Product 2');
assert.equal(translate('外层第 7 个组合，内层第 6 次乘法'), 'Outer group 7 · Inner product 6');
assert.equal(translate('当前只是中间结果；11 / 16 格暂时与目标相同。'),
  'Intermediate result. 11 / 16 entries currently match the target.');
assert.equal(translate('A 取 3 格、B 取 5 格，输入组合先对 2 取余'),
  'Select 3 A entries and 5 B entries. Combine modulo 2.');
assert.equal(translate('第 9 页，建议 0:40，全场 17:30'),
  'Slide 9 · Suggested 0:40 · Total 17:30');
assert.ok(!han.test(translate('3 加 3，结果送入新的存储组。加法电路得到 6，把结果保存起来。原来的 A、B 仍在各自的寄存器里，读出来计算不会把它们清空。')));
assert.equal(translate('1 × 1 = 1'), '1 × 1 = 1');
assert.equal(translate('0 / 47'), '0 / 47');
assert.ok(catalogue.notes[13].text.includes('4096'));
assert.ok(catalogue.notes[13].text.includes('39'));
assert.ok(catalogue.notes[17].text.includes('292/17'));

const generated = fs.readFileSync('dist/slides.html', 'utf8');
assert.ok(generated.includes('id="language-select"'));
assert.ok(!/\/\*__(?:I18N|ENGLISH)__\*\//.test(generated));
for (const file of ['矩阵与AI-20分钟演讲.html', 'front/public/presentation/index.html']) {
  assert.equal(fs.readFileSync(file, 'utf8'), generated);
}
console.log(`PASS: bilingual UI coverage, ${notes.length} English speaker notes, dynamic numeric messages, and identical offline/application HTML.`);
