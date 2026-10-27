"use strict";
(() => {
  const $=selector=>document.querySelector(selector),$$=selector=>[...document.querySelectorAll(selector)];
  const number=value=>Number(value).toLocaleString('en-US');
  const coordinate=(prefix,i)=>`${prefix}[${Math.floor(i/4)+1},${i%4+1}]`;
  function grid(id,values,mask=[],kind='input'){
    $('#'+id).innerHTML=values.map((value,i)=>`<span class="${mask[i]?`ai-${kind}-lit`:''}">${value}</span>`).join('');
  }
  function mount({demo,math,methods,getInputs}){
    const model=globalThis.AiFocusModel,terms=globalThis.ALPHATENSOR_47.terms;
    let termIndex=1,checkCell='all';
    const recipe=demo('ai-recipe',4,n=>{
      const {a,b}=getInputs(),term=terms[termIndex],value=model.step(term,a,b);
      grid('ai-recipe-a',a,n>=1?term.u:[]);grid('ai-recipe-b',b,n>=2?term.v:[]);
      grid('ai-recipe-delta',n===4?value.delta:Array(16).fill(0),n===4?term.w:[],'output');
      const formula=(name,vector,values,result)=>`${name} = (${model.support(vector).map(i=>coordinate(name==='α'?'A':'B',i)).join(' + ')}) mod 2 = (${model.support(vector).map(i=>values[i]).join(' + ')}) mod 2 = ${result}`;
      $('#ai-recipe-intro').textContent=`作者公开方案的第 ${termIndex+1} 步：先组合输入，再做 1 次乘法，分配到 ${model.support(term.w).length} 个输出格子。`;
      $('#ai-left-expression').textContent=n>=1?formula('α',term.u,a,value.left):'① 从 A 中选择并组合元素';
      $('#ai-right-expression').textContent=n>=2?formula('β',term.v,b,value.right):'② 从 B 中选择并组合元素';
      $('#ai-product-expression').textContent=n>=3?`③ p = α × β = ${value.left} × ${value.right} = ${value.product}${n===4?' → '+model.support(term.w).map(i=>coordinate('C',i)).join('、')+' 各加 '+value.product:''}`:'③ 两个组合相乘，再分配本步贡献';
      $('#ai-recipe-progress').textContent=`${n} / 4`;
      $$('[data-ai-term]').forEach(button=>button.classList.toggle('selected',Number(button.dataset.aiTerm)===termIndex));
    },1600);
    $$('[data-ai-term]').forEach(button=>button.addEventListener('click',()=>{termIndex=Number(button.dataset.aiTerm);recipe.reset();}));
    const searchCaptions=[
      '先定义什么才是正确的 4×4 矩阵乘法，再搜索实现它的计算路径。',
      '目标涵盖全部输入之间的正确乘法关系，不只针对眼前这两个数字矩阵。',
      '一个动作同时决定：A 如何组合、B 如何组合、乘积贡献到哪些输出。',
      '把这一步的贡献从目标中扣除，继续匹配剩余的乘法关系。',
      '全部关系匹配，才是正确配方；再比较步数。AlphaTensor 找到适用于模 2 的 47 步方案。'
    ];
    demo('ai-search',4,n=>{$$('#ai-search-flow>div').forEach((element,i)=>element.classList.toggle('active',i===n-1));$('#ai-search-caption').textContent=searchCaptions[n];},2100);
    function numeric(){
      const {a,b}=getInputs(),expected=math.multiply(a,b);
      const mask=Array(16).fill(0);if(checkCell!=='all')mask[Number(checkCell)]=1;
      const row=checkCell==='all'?0:Math.floor(Number(checkCell)/4),col=checkCell==='all'?0:Number(checkCell)%4;
      grid('ai-numeric-a',a,checkCell==='all'?[]:a.map((_,i)=>Number(Math.floor(i/4)===row)));
      grid('ai-numeric-b',b,checkCell==='all'?[]:b.map((_,i)=>Number(i%4===col)));
      grid('ai-numeric-c',expected,mask,'output');
      const products=Array.from({length:4},(_,k)=>`${a[row*4+k]}×${b[k*4+col]}`),ordinary=Array.from({length:4},(_,k)=>a[row*4+k]*b[k*4+col]).reduce((sum,value)=>sum+value,0);
      $('#ai-numeric-equation').textContent=checkCell==='all'?'全部 16 格逐一核对：三种算法的最终结果一致。':`${coordinate('C',row*4+col)} = (${products.join(' + ')}) mod 2 = ${ordinary} mod 2 = ${expected[row*4+col]}`;
      $('#ai-numeric-checks').innerHTML=methods.map(method=>{const computed=model.evaluate(method.terms,a,b),correct=computed.result.every((value,i)=>value===expected[i]);return `<div><span>${method.name}</span><b>${correct?'16 / 16 格一致 ✓':'存在不一致'}</b><small>${computed.counts.multiplications} 次乘法</small></div>`;}).join('');
    }
    $$('[data-check-cell]').forEach(button=>button.addEventListener('click',()=>{checkCell=button.dataset.checkCell;numeric();}));
    const stats=methods.map(method=>({...method,...model.count(method.terms)}));
    $('#ai-savings-bars').innerHTML=stats.map(item=>`<div><span>${item.id==='strassen'?'Strassen':item.name}</span><div><i style="width:${100*item.multiplications/64}%" class="${item.id==='alpha'?'ai-best':''}"></i></div><b>${item.multiplications} 次</b></div>`).join('');
    function repeat(){
      const repetitions=Number($('#ai-repeat-count').value);$('#ai-repeat-label').textContent=number(repetitions);
      $('#ai-repeat-summary').innerHTML=`<span>直接算法 <b>${number(64*repetitions)}</b> 次</span><span>AI <b>${number(47*repetitions)}</b> 次</span><strong>节省 ${number(17*repetitions)} 次乘法</strong>`;
    }
    $('#ai-repeat-count').addEventListener('input',repeat);repeat();
    $('#ai-cost-table-body').innerHTML=stats.map(item=>`<tr><td>${item.id==='strassen'?'Strassen（展平）':item.name}</td><td>${item.multiplications}</td><td>${item.inputXor}</td><td>${item.outputXor}</td><td>${item.xor}</td></tr>`).join('');
    function weighted(){
      const weight=Number($('#ai-multiply-cost').value),values=stats.map(item=>model.weighted(item,weight)),largest=Math.max(...values),minimum=Math.min(...values);
      $('#ai-cost-weight').textContent=weight;
      $('#ai-weighted-costs').innerHTML=stats.map((item,i)=>`<div class="${values[i]===minimum?'best-cost':''}"><span>${item.id==='strassen'?'Strassen（展平）':item.name}</span><div><i style="width:${100*values[i]/largest}%"></i></div><b>${number(values[i])} 单位</b></div>`).join('');
      const winners=stats.filter((_,i)=>values[i]===minimum).map(item=>item.id==='strassen'?'Strassen':item.name).join('、');
      $('#ai-cost-verdict').textContent=`按这个假设，${winners}的算术成本最低。AI 比直接法少 17 乘、多 292 XOR；是否划算取决于两者的实际成本。`;
    }
    $('#ai-multiply-cost').addEventListener('input',weighted);$$('[data-ai-cost]').forEach(button=>button.addEventListener('click',()=>{$('#ai-multiply-cost').value=button.dataset.aiCost;weighted();}));weighted();numeric();
    return {refresh(){recipe.paint();numeric();}};
  }
  globalThis.AiFocusVisuals={mount};
})();
