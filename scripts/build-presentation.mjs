import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
let html=read('presentation/slides.template.html');
const escapeScript=text=>text.replace(/<\/script/gi,'<\\/script');
html=html.replace('/*__CSS__*/',()=>read('presentation/slides.css'))
  .replace('/*__DATA__*/',()=>escapeScript(read('dist/alpha47.js')))
  .replace('/*__MATH__*/',()=>escapeScript(read('dist/comparison-math.js')))
  .replace('/*__DERIVATION__*/',()=>escapeScript(read('presentation/strassen-derivation.js')))
  .replace('/*__HARDWARE__*/',()=>escapeScript(read('presentation/hardware-lesson.js')))
  .replace('/*__PHYSICS__*/',()=>escapeScript(read('presentation/register-physics.js')))
  .replace('/*__REGISTER_VISUALS__*/',()=>escapeScript(read('presentation/register-visuals.js')))
  .replace('/*__APP__*/',()=>escapeScript(read('presentation/slides.js')))
  .replace('<!--__LICENSE__-->',()=>`<!-- AlphaTensor public factorization data: Apache License 2.0.\n${read('dist/alphatensor-LICENSE.txt').replace(/-->/g,'-- >')}\n-->`);
if(/\/\*__(?:CSS|DATA|MATH|DERIVATION|HARDWARE|PHYSICS|REGISTER_VISUALS|APP)__\*\//.test(html))throw new Error('Unreplaced inline content marker');
const output=path.join(root,'dist/slides.html');
fs.writeFileSync(output,html);
console.log(output);
