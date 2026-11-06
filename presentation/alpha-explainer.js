"use strict";
(() => {
  function mount({demo,a,b}) {
    const $=selector=>document.querySelector(selector);
    const terms=globalThis.ALPHATENSOR_47.terms;
    const math=globalThis.MatrixCompareMath;
    const model=globalThis.AiFocusModel;
    const trace=math.trace(terms,a,b);
    const target=math.multiply(a,b);
    const position=i=>`${Math.floor(i/4)+1}${i%4+1}`;
    function grid(selector,values,{mask=[],tone='a',previous=null}={}) {
      $(selector).innerHTML=values.map((value,i)=>{
        const picked=Boolean(mask[i]),changed=previous!==null&&previous[i]!==value;
        return `<span class="ae-cell ${picked?'picked '+tone:''} ${changed?'changed':''}"><small>${position(i)}</small><b>${value}</b>${changed?`<i>${previous[i]}→${value}</i>`:''}</span>`;
      }).join('');
    }
    const second=terms[1],step=model.step(second,a,b);
    grid('#ae-input-a',a,{mask:second.u,tone:'a'});
    grid('#ae-input-b',b,{mask:second.v,tone:'b'});
    $('#ae-sum-a').textContent=`(${model.support(second.u).map(i=>a[i]).join(' + ')}) mod 2 = ${step.left}`;
    $('#ae-sum-b').textContent=`(${model.support(second.v).map(i=>b[i]).join(' + ')}) mod 2 = ${step.right}`;
    grid('#ae-before',trace[0].accumulator);
    grid('#ae-contribution',step.delta,{mask:second.w,tone:'c'});
    grid('#ae-after',trace[1].accumulator,{mask:second.w,tone:'c',previous:trace[0].accumulator});
    const residuals=math.residualFrames(terms);
    for(const [id,index] of [['#ae-residual-start',0],['#ae-residual-mid',2],['#ae-residual-end',47]]){
      $(id).textContent=residuals[index].reduce((sum,value)=>sum+value,0);
    }
    // The tensor check is input-independent; the slider below is one example.
    let coefficientErrors=0;
    for(let o=0;o<16;o++)for(let i=0;i<16;i++)for(let j=0;j<16;j++){
      const expected=Number(Math.floor(i/4)===Math.floor(o/4)&&j%4===o%4&&i%4===Math.floor(j/4));
      const found=terms.reduce((sum,term)=>sum+term.w[o]*term.u[i]*term.v[j],0)%2;
      if(found!==expected)coefficientErrors++;
    }
    $('#ae-proof-errors').textContent=coefficientErrors;
    const retained=terms.flatMap((term,r)=>term.w[0]&&term.u[1]&&term.v[4]?[r+1]:[]);
    $('#ae-keep-terms').textContent=retained.map(r=>`第 ${r} 项`).join(' + ');
    const cancellation=terms.flatMap((term,r)=>term.w[1]&&term.u[0]&&term.v[8]?[r+1]:[]);
    $('#ae-cancel-terms').textContent=cancellation.map(r=>`第 ${r} 项`).join(' + ');
    grid('#ae-target',target,{tone:'c'});
    const animation=demo('alpha-walk',47,n=>{
      const frame=n?trace[n-1]:null;
      const accumulated=frame?.accumulator||Array(16).fill(0);
      grid('#ae-accumulator',accumulated,{mask:n?terms[n-1].w:[],tone:'c'});
      $('#ae-term-strip').innerHTML=terms.map((_,r)=>`<span class="${r<n?'done':''} ${r===n-1?'current':''}">${r+1}</span>`).join('');
      $('#ae-walk-count').textContent=`${n} / 47`;
      $('#ae-walk-slider').value=String(n);
      $('#ae-walk-formula').textContent=n?`p${n} = ${frame.left} × ${frame.right} = ${frame.product}`:'从 16 个 0 开始累计';
      const matching=accumulated.filter((value,i)=>value===target[i]).length;
      $('#ae-walk-status').textContent=n===47?'47 项完成：16 个输出全部与直接计算相同。':`当前只是中间结果；${matching} / 16 格暂时与目标相同。`;
      $('#ae-walk-status').classList.toggle('complete',n===47);
    },650);
    $('#ae-walk-slider').addEventListener('input',event=>{
      animation.stop();animation.cursor=Number(event.target.value);animation.paint();
    });
    document.querySelectorAll('[data-alpha-frame]').forEach(button=>button.addEventListener('click',()=>{
      animation.stop();animation.cursor=Number(button.dataset.alphaFrame);animation.paint();
    }));
  }
  globalThis.AlphaExplainer={mount};
})();
