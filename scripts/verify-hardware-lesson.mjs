import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context=vm.createContext({});
vm.runInContext(fs.readFileSync('presentation/hardware-lesson.js','utf8'),context);
const {additionTrace,multiplicationPartials}=context.HardwareLesson;
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
const js=fs.readFileSync('presentation/slides.js','utf8');
const notes=JSON.parse(js.match(/const notes=(\[.*?\n\]);/s)[1]);
const html=fs.readFileSync('presentation/slides.template.html','utf8');
const sections=[...html.matchAll(/<section class="slide\b.*?<\/section>/gs)].map(m=>m[0]);
assert.equal(notes.length,sections.length);
assert.equal(sections.length,14);
for(let i=1;i<=4;i++)assert.ok(sections[i].includes(`硬件入门 ${i} / 4`));
assert.ok(sections[5].includes('4×4矩阵乘法的基本动作'));
assert.ok(sections[6].includes('AlphaTensor 的算法发现'));
assert.ok(sections[1].includes('晶体管：电压控制'));
assert.ok(sections[2].includes('存储：晶体管'));
assert.ok(sections[3].includes('加法：把存好的数'));
assert.equal(/时钟|CLK|锁存|触发器|上升沿/.test(sections.slice(1,4).join('')+notes.slice(1,4).map(x=>x.text).join('')),false);
console.log('PASS: all 256 four-bit addition/multiplication pairs, simple storage/addition lesson, hardware-first slide order, 14 matching speaker notes.');
