import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context=vm.createContext({});
vm.runInContext(fs.readFileSync('presentation/hardware-lesson.js','utf8'),context);
vm.runInContext(fs.readFileSync('presentation/register-physics.js','utf8'),context);
const {initial,transition,storageFrames,additionFrames}=context.RegisterPhysics;
for(const old of [0,1])for(const value of [0,1]){
  const before={q:old,input:null,writing:false};
  const written=transition(before,{type:'write',value});
  assert.equal(written.q,value);
  assert.equal(written.writing,true);
  assert.equal(before.q,old,'write does not mutate the prior state');
  const held=transition(written,{type:'hold'});
  assert.equal(held.q,value,'removing the write signal preserves the stored bit');
  assert.equal(held.input,null);
  assert.equal(held.writing,false);
  assert.equal(transition(held,{type:'hold'}).q,value,'repeated hold preserves the bit');
}
assert.deepEqual(Array.from(storageFrames(),state=>state.q),[0,1,1,0,0]);
assert.equal(initial().q,0);
for(let a=0;a<16;a++)for(let b=0;b<16;b++){
  const frames=additionFrames(a,b);
  assert.equal(frames.length,6);
  assert.equal(frames[0].phase,'stored');
  assert.equal(frames[5].phase,'saved');
  assert.equal(frames[5].result,a+b);
  assert.equal(frames[5].a,a,'reading leaves operand A unchanged');
  assert.equal(frames[5].b,b,'reading leaves operand B unchanged');
  for(let i=1;i<=4;i++)assert.equal(frames[i].column,i-1);
}
console.log('PASS: write 0/1 and retain after removing input; all 256 four-bit additions, including final carry; operands preserved.');
