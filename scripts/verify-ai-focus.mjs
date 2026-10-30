import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context=vm.createContext({});
for(const file of ['dist/alpha47.js','dist/comparison-math.js','presentation/ai-focus-model.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
const model=context.AiFocusModel,math=context.MatrixCompareMath;
const methods=[math.directTerms(),math.strassenTerms(),context.ALPHATENSOR_47.terms];
const expectedStats=[
  {multiplications:64,inputXor:0,outputXor:48,xor:48},
  {multiplications:49,inputXor:190,outputXor:128,xor:318},
  {multiplications:47,inputXor:202,outputXor:138,xor:340}
];
for(let method=0;method<3;method++)assert.deepEqual(JSON.parse(JSON.stringify(model.count(methods[method]))),expectedStats[method]);
// The new evaluator counts the XORs it actually executes. Check all basis
// inputs, covering every coefficient and preventing value-dependent pruning.
for(let i=0;i<16;i++)for(let j=0;j<16;j++){
  const a=Array(16).fill(0),b=Array(16).fill(0);a[i]=1;b[j]=1;
  const expected=math.multiply(a,b);
  for(let method=0;method<3;method++){
    const actual=model.evaluate(methods[method],a,b);
    assert.deepEqual(Array.from(actual.result),Array.from(expected));
    assert.deepEqual(JSON.parse(JSON.stringify(actual.counts)),expectedStats[method]);
  }
}
const a=[1,0,1,1,0,1,1,0,1,1,0,1,0,0,1,1],b=[1,1,0,1,0,1,1,0,1,0,1,1,1,0,0,1];
const expected=[1,1,1,1,1,1,0,1,0,0,1,0,0,0,1,0];
for(const terms of methods)assert.deepEqual(Array.from(model.evaluate(terms,a,b).result),expected);
const second=model.step(methods[2][1],a,b);
assert.equal(second.left,1);assert.equal(second.right,1);assert.equal(second.product,1);
assert.deepEqual(Array.from(second.delta),[0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0]);
assert.equal(model.saving(64,47).saved,17);
assert.equal(model.saving(64,47).percent.toFixed(2),'26.56');
assert.equal(model.saving(49,47).percent.toFixed(2),'4.08');
assert.deepEqual(expectedStats.map(stats=>model.weighted(stats,20)),[1328,1298,1280]);
assert.deepEqual(expectedStats.map(stats=>model.weighted(stats,1)),[112,367,387]);
assert.equal(model.weighted(expectedStats[1],11),model.weighted(expectedStats[2],11));
const html=fs.readFileSync('presentation/slides.template.html','utf8');
const titles=[...html.matchAll(/<section class="slide\b[^>]*data-title="([^"]+)"/g)].map(match=>match[1]);
assert.equal(titles.length,21);
assert.equal(titles[7],'传统算法基线：64次与49次');
assert.equal(titles[8],'AlphaTensor 的算法发现');
assert.equal(titles.filter(title=>title.startsWith('Strassen第')).length,0);
console.log('PASS: 64/49/47 counts and 48/318/340 XORs; all tensor coefficients via the counted evaluator; real AI step; identical sample results; percentages and weighted-cost thresholds; 21 AI-focused slides.');
