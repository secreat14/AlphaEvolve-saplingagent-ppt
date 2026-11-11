import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.resolve(root, process.argv[2] || '..');
const read = filename => fs.readFileSync(path.join(root, filename), 'utf8');
const license = '<!-- Project source license and notice\n' + read('LICENSE') + '\n' + read('NOTICE') + '\n-->\n';
const presentation = read('矩阵与AI-20分钟演讲.html');
const notebook = read('alphatensor_demo.ipynb');
JSON.parse(notebook);
let script = read('docs/15分钟中英对照演讲稿.html');
if (!script.includes('id="speech-audio-data"')) {
  throw new Error('Generate the voiced script before exporting classroom files');
}

script = script.replaceAll('../矩阵与AI-20分钟演讲.html', './矩阵与AI演讲.html')
  .replace('href="references.html"', 'href="./矩阵与AI演讲.html#slide=21" target="presentation" rel="noopener"')
  .replace('href="../alphatensor_demo.ipynb"', 'href="./alphatensor_demo.ipynb" download')
  .replace('</footer>',
    '<p>换设备时，将两份 HTML 和 alphatensor_demo.ipynb 放在同一个文件夹。正文音频已内嵌，可离线播放。</p>' +
    '<p>Demo 用 Jupyter 或 VS Code 的 Notebook 功能打开，选择 Python 3，并从上到下运行。先在所选 Python 环境安装依赖，运行 <code>python -m pip install numpy matplotlib</code>。</p>' +
    '<p lang="en">Keep both HTML files and alphatensor_demo.ipynb in the same folder. All speech audio is included. Open the notebook in Jupyter or VS Code, select Python 3, install NumPy and Matplotlib, and run the cells from top to bottom.</p></footer>');

const files = new Map([
  ['矩阵与AI演讲.html', presentation],
  ['15分钟中英对照演讲稿.html', script],
  ['alphatensor_demo.ipynb', notebook],
]);
for (const html of [presentation, script]) {
  if (/(?:file:\/\/|\/Users\/|\/home\/|[A-Z]:\\)/.test(html)) {
    throw new Error('The export contains a device-specific absolute path');
  }
  const markup = html.replace(/<(script|style)\b([^>]*)>[\s\S]*?<\/\1>/gi, '<$1$2></$1>');
  for (const match of markup.matchAll(/\b(?:href|src|poster)="([^"]*)"/g)) {
    const reference = match[1];
    if (!reference || /^(?:https?:|data:|#)/.test(reference)) continue;
    const filename = decodeURIComponent(reference.split('#')[0]).replace(/^\.\//, '');
    if (!files.has(filename)) throw new Error(`Export dependency is outside the three-file delivery: ${reference}`);
  }
}

fs.mkdirSync(destination, {recursive: true});
for (const [filename, content] of files) {
  const output = filename.endsWith('.html')
    ? content.replace('<!doctype html>', '<!doctype html>\n' + license)
    : content;
  fs.writeFileSync(path.join(destination, filename), output);
  console.log(`Exported ${filename}`);
}
