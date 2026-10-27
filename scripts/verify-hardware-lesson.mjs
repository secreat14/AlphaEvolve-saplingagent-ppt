import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context=vm.createContext({});
vm.runInContext(fs.readFileSync('presentation/hardware-lesson.js','utf8'),context);
const {registerTrace,additionTrace,multiplicationPartials}=context.HardwareLesson;
for(let a=0;a<16;a++)for(let b=0;b<16;b++){
  const trace=additionTrace(a,b,4);
  assert.equal(trace.at(-1).result,a+b);
  for(const frame of trace.slice(1)){
    const total=frame.left+frame.right+frame.carryIn;
    assert.equal(frame.carryOut,Math.floor(total/2));
    assert.equal((frame.result>>frame.column)&1,total%2);
  }
  assert.equal(multiplicationPartials(a,b,4).reduce((sum,x)=>sum+x,0),a*b);
}
const a=[1,0,1,1,0,1,1,0,1,1,0,1,0,0,1,1];
const b=[1,1,0,1,0,1,1,0,1,0,1,1,1,0,0,1];
const frames=registerTrace(a,b);
assert.equal(frames.length,10);
assert.equal(frames.at(-1).sum,3);
assert.equal(frames.at(-1).stored,true);
for(let k=0;k<4;k++){
  assert.equal(frames[2*k+1].phase,'load');
  assert.equal(frames[2*k+1].left,a[k]);
  assert.equal(frames[2*k+1].right,b[k*4]);
  assert.equal(frames[2*k+2].phase,'compute');
  assert.equal(frames[2*k+2].sum,frames[2*k+1].sum+a[k]*b[k*4]);
}
const js=fs.readFileSync('presentation/slides.js','utf8');
const notes=JSON.parse(js.match(/const notes=(\[.*?\n\]);/s)[1]);
const html=fs.readFileSync('presentation/slides.template.html','utf8');
const sections=[...html.matchAll(/<section class="slide\b.*?<\/section>/gs)].map(m=>m[0]);
assert.equal(notes.length,sections.length);
assert.equal(sections.length,26);
for(let i=1;i<=5;i++)assert.ok(sections[i].includes(`硬件入门 ${i} / 5`));
assert.ok(sections[7].includes('4×4矩阵乘法的基本动作'));
assert.ok(sections[8].includes('Strassen第一步'));
assert.equal(notes[1].sources.some(s=>s.includes('registers')),true);
console.log('PASS: all 256 four-bit addition/multiplication pairs, register data path, hardware-first slide order, 26 matching speaker notes.');
