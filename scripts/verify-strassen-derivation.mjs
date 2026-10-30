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
const notebook=JSON.parse(fs.readFileSync('alphatensor_demo.ipynb','utf8'));
const sampleCode=notebook.cells[3].source.join('');
const sampleA=JSON.parse(sampleCode.match(/^A = (\[[^\n]+\])/m)[1]);
const sampleB=JSON.parse(sampleCode.match(/^B = (\[[^\n]+\])/m)[1]);
const a2=[sampleA[0],sampleA[1],sampleA[4],sampleA[5]];
const b2=[sampleB[0],sampleB[1],sampleB[4],sampleB[5]];
const mod2=value=>((value%2)+2)%2;
const sampleProducts=products.map(product=>mod2(product.left.reduce((sum,weight,i)=>sum+weight*a2[i],0))*mod2(product.right.reduce((sum,weight,i)=>sum+weight*b2[i],0)));
assert.deepEqual(Array.from(sampleProducts),[0,1,0,1,1,0,1]);
const sampleOutput=Object.values(outputs).map(output=>mod2(output.combination.reduce((sum,[index,sign])=>sum+sign*sampleProducts[index],0)));
assert.deepEqual(sampleOutput,[1,1,0,1]);
const html=fs.readFileSync('presentation/slides.template.html','utf8');
const timing=[...html.matchAll(/data-seconds="(\d+)"/g)].map(match=>Number(match[1]));
assert.equal(timing.length,16);
assert.equal(timing.reduce((sum,x)=>sum+x),825);
console.log('PASS: seven product expansions, four reconstruction identities, all cancellation pairs, 16 slides / 13:45.');
