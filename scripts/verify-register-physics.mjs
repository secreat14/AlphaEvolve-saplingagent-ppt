import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context=vm.createContext({});
vm.runInContext(fs.readFileSync('presentation/register-physics.js','utf8'),context);
const {initial,transition,scriptedFrames}=context.RegisterPhysics;
let scenarios=0;
for(let d=0;d<16;d++)for(let q=0;q<16;q++)for(const enable of [0,1])for(const clock of [0,1])for(const nextClock of [0,1]){
  const before={d,q,enable,clock,read:null};
  const after=transition(before,{type:'clock',value:nextClock});
  const shouldWrite=clock===0&&nextClock===1&&enable===1;
  assert.equal(after.q,shouldWrite?d:q,'only enabled rising edges update Q');
  assert.equal(after.captured,shouldWrite);
  assert.equal(before.q,q,'transition does not mutate its input');
  const changedData=transition(before,{type:'data',value:d^15});
  assert.equal(changedData.q,q,'data changes never directly update Q');
  const changedEnable=transition(before,{type:'enable',value:1-enable});
  assert.equal(changedEnable.q,q,'EN changes never directly update Q');
  const read=transition(before,{type:'read'});
  assert.equal(read.read,q);
  assert.equal(read.q,q,'read is nondestructive');
  scenarios++;
}
const frames=scriptedFrames();
assert.equal(frames.length,9);
assert.deepEqual(Array.from(frames,state=>state.q),[0,3,3,3,3,3,12,12,12]);
assert.equal(frames.at(-1).d,5);
assert.equal(frames.at(-1).read,12);
assert.equal(initial().clock,0);
assert.equal(initial().q,0);
console.log(`PASS: ${scenarios} clock/data/enable combinations, nondestructive read, 9 scripted register states.`);
