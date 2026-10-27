import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context=vm.createContext({});
vm.runInContext(fs.readFileSync('presentation/strassen-derivation.js','utf8'),context);
const {products,outputs}=context.StrassenLesson;
const normalize=entries=>Object.fromEntries(Object.entries(entries).filter(([,value])=>value!==0).sort(([a],[b])=>a.localeCompare(b)));
const polynomial=terms=>normalize(terms.reduce((out,[term,value])=>{out[term]=(out[term]||0)+value;return out;},{}));
const expected={r:{ae:1,bg:1},s:{af:1,bh:1},t:{ce:1,dg:1},u:{cf:1,dh:1}};

for(const product of products){
  const expanded=[];
  for(let i=0;i<4;i++)for(let j=0;j<4;j++)if(product.left[i]*product.right[j])expanded.push(['abcd'[i]+'efgh'[j],product.left[i]*product.right[j]]);
  assert.deepEqual(polynomial(product.expansion),polynomial(expanded),`${product.label}: expansion preserves product order`);
}
for(const [name,output] of Object.entries(outputs)){
  const terms=output.combination.flatMap(([index,sign])=>products[index].expansion.map(([term,value])=>[term,value*sign]));
  assert.deepEqual(polynomial(terms),normalize(expected[name]),`${name}: reconstructed block matches ordinary multiplication`);
  assert.deepEqual(polynomial(output.result),normalize(expected[name]));
  if(output.cancellations){
    for(const cancelled of output.cancellations){
      const pair=terms.filter(([term])=>term===cancelled);
      assert.equal(pair.length,2,`${name}: exactly two occurrences for ${cancelled}`);
      assert.equal(pair[0][1]+pair[1][1],0,`${name}: opposite signs cancel`);
    }
    const survivors=terms.filter(([term])=>!output.cancellations.includes(term));
    assert.deepEqual(polynomial(survivors),normalize(expected[name]),`${name}: uncancelled terms are the target`);
  }
}
const html=fs.readFileSync('presentation/slides.template.html','utf8');
const timing=[...html.matchAll(/data-seconds="(\d+)"/g)].map(match=>Number(match[1]));
assert.equal(timing.length,26);
assert.equal(timing.reduce((sum,x)=>sum+x),1200);
console.log('PASS: seven product expansions, four reconstruction identities, all cancellation pairs, 26 slides / 20 minutes.');
