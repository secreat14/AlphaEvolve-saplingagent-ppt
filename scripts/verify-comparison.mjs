import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context=vm.createContext({});
vm.runInContext(fs.readFileSync('dist/alpha47.js','utf8'),context);
vm.runInContext(fs.readFileSync('dist/comparison-math.js','utf8'),context);
const math=context.MatrixCompareMath;
const algorithms=[math.directTerms(),math.strassenTerms(),context.ALPHATENSOR_47.terms];
assert.deepEqual(algorithms.map(x=>x.length),[64,49,47]);

// Check every input basis pair: this covers all 4096 coefficients of the
// bilinear 4x4 multiplication tensor, including output index ordering.
for(let i=0;i<16;i++)for(let j=0;j<16;j++){
  const a=Array(16).fill(0),b=Array(16).fill(0);a[i]=1;b[j]=1;
  const expected=Array(16).fill(0);
  if(i%4===Math.floor(j/4))expected[Math.floor(i/4)*4+j%4]=1;
  for(const terms of algorithms){
    const result=Array.from(math.trace(terms,a,b).at(-1).accumulator);
    assert.deepEqual(result,expected,`basis inputs ${i}, ${j}`);
  }
}

// Reproducible dense and sparse samples additionally verify actual accumulated
// traces, multiplication parity, and agreement on the same user-editable input.
let seed=5130;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let trial=0;trial<1000;trial++){
  const density=trial%3===0?.2:trial%3===1?.8:.5;
  const a=Array.from({length:16},()=>Number(random()<density));
  const b=Array.from({length:16},()=>Number(random()<density));
  const expected=Array(16).fill(0);
  for(let row=0;row<4;row++)for(let col=0;col<4;col++)for(let k=0;k<4;k++)expected[row*4+col]^=a[row*4+k]*b[k*4+col];
  for(const terms of algorithms){
    const trace=math.trace(terms,a,b);
    assert.ok(trace.every(step=>[step.left,step.right,step.product,...step.accumulator].every(x=>x===0||x===1)));
    assert.deepEqual(Array.from(trace.at(-1).accumulator),expected);
  }
}
console.log('PASS: 64/49/47 multiplication counts; all 4096 tensor coefficients for each algorithm; 1000 seeded random 4x4 input pairs.');

// Ordinary arithmetic retains signs rather than reducing factors modulo two.
const ordinaryTerms=math.strassenTerms(true);
for(let trial=0;trial<1000;trial++){
  const a=Array.from({length:16},()=>Math.floor(random()*9)-4);
  const b=Array.from({length:16},()=>Math.floor(random()*9)-4);
  const expected=Array(16).fill(0);
  for(let row=0;row<4;row++)for(let col=0;col<4;col++)for(let k=0;k<4;k++)expected[row*4+col]+=a[row*4+k]*b[k*4+col];
  const recursive=math.strassenRecursive4(a,b);
  // Mathematical zero is identical whether JavaScript represents it as +0 or -0.
  assert.ok(recursive.result.every((x,i)=>x===expected[i]));
  assert.ok(math.multiplyOrdinary(a,b).every((x,i)=>x===expected[i]));
  assert.ok(math.traceOrdinary(ordinaryTerms,a,b).at(-1).accumulator.every((x,i)=>x===expected[i]));
  assert.equal(recursive.multiplications,49);
  assert.equal(recursive.additions,198);
}
const residuals=math.residualFrames(context.ALPHATENSOR_47.terms);
assert.equal(residuals.length,48);
assert.equal(residuals[0].reduce((sum,x)=>sum+x),64);
assert.equal(residuals.at(-1).reduce((sum,x)=>sum+x),0);
console.log('PASS: 1000 signed ordinary 4x4 cases; classic Strassen 49 multiplications and 198 additions; 47-step residual verification.');
