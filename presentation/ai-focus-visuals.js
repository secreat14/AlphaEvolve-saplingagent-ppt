"use strict";
(() => {
  const $=selector=>document.querySelector(selector),$$=selector=>[...document.querySelectorAll(selector)];
  const number=value=>Number(value).toLocaleString('en-US');
  function mount({methods}){
    const model=globalThis.AiFocusModel;
    const stats=methods.map(method=>({...method,...model.count(method.terms)}));
    const series=model.recursiveSeries(5);
    const width=1120,height=345,left=82,right=42,top=24,bottom=64;
    const plotWidth=width-left-right,plotHeight=height-top-bottom;
    const x=index=>left+index*plotWidth/(series.length-1);
    const y=percent=>top+(100-percent)*plotHeight/100;
    const points=key=>series.map((item,index)=>`${x(index)},${y(item[key])}`).join(' ');
    const yTicks=[0,25,50,75,100].map(value=>`<g><line x1="${left}" y1="${y(value)}" x2="${width-right}" y2="${y(value)}"/><text x="${left-14}" y="${y(value)+5}" text-anchor="end">${value}%</text></g>`).join('');
    const xTicks=series.map((item,index)=>`<g><line x1="${x(index)}" y1="${height-bottom}" x2="${x(index)}" y2="${height-bottom+7}"/><text x="${x(index)}" y="${height-bottom+27}" text-anchor="middle">${number(item.size)}</text></g>`).join('');
    const circles=(key,className)=>series.map((item,index)=>`<circle class="${className}" cx="${x(index)}" cy="${y(item[key])}" r="5"/>`).join('');
    $('#ai-scale-chart').innerHTML=`
      <g class="scale-grid">${yTicks}</g>
      <g class="scale-axis"><line x1="${left}" y1="${top}" x2="${left}" y2="${height-bottom}"/><line x1="${left}" y1="${height-bottom}" x2="${width-right}" y2="${height-bottom}"/>${xTicks}</g>
      <polyline class="scale-line direct" points="${points('directPercent')}"/>
      <polyline class="scale-line strassen" points="${points('strassenPercent')}"/>
      <polyline class="scale-line alpha" points="${points('alphaPercent')}"/>
      ${circles('directPercent','scale-dot direct')}${circles('strassenPercent','scale-dot strassen')}${circles('alphaPercent','scale-dot alpha')}
      <g class="scale-legend"><circle class="direct" cx="${left+20}" cy="${top+20}" r="5"/><text x="${left+33}" y="${top+25}">直接法</text><circle class="strassen" cx="${left+145}" cy="${top+20}" r="5"/><text x="${left+158}" y="${top+25}">Strassen</text><circle class="alpha" cx="${left+300}" cy="${top+20}" r="5"/><text x="${left+313}" y="${top+25}">AlphaTensor</text></g>
      <text class="scale-x-label" x="${left+plotWidth/2}" y="${height-4}" text-anchor="middle">矩阵大小 N（N × N）</text>`;
    const largest=series.at(-1);
    $('#ai-scale-summary').textContent=`N = ${number(largest.size)} 时约为直接法的 ${largest.alphaPercent.toFixed(2)}%，少 ${number(largest.direct-largest.alpha)} 次乘法`;
    $('#ai-cost-table-body').innerHTML=stats.map(item=>`<tr><td>${item.id==='strassen'?'Strassen（展平）':item.name}</td><td>${item.multiplications}</td><td>${item.inputXor}</td><td>${item.outputXor}</td><td>${item.xor}</td></tr>`).join('');
    function weighted(){
      const weight=Number($('#ai-multiply-cost').value),values=stats.map(item=>model.weighted(item,weight)),largestValue=Math.max(...values),minimum=Math.min(...values);
      $('#ai-cost-weight').textContent=weight;
      $('#ai-weighted-costs').innerHTML=stats.map((item,index)=>`<div class="${values[index]===minimum?'best-cost':''}"><span>${item.id==='strassen'?'Strassen（展平）':item.name}</span><div><i style="width:${100*values[index]/largestValue}%"></i></div><b>${number(values[index])} 单位</b></div>`).join('');
      const winners=stats.filter((_,index)=>values[index]===minimum).map(item=>item.id==='strassen'?'Strassen':item.name).join('、');
      $('#ai-cost-verdict').textContent=`按这个假设，${winners}的算术成本最低。AI 比直接法少 17 乘、多 292 XOR；是否划算取决于两者的实际成本。`;
    }
    $('#ai-multiply-cost').addEventListener('input',weighted);
    $$('[data-ai-cost]').forEach(button=>button.addEventListener('click',()=>{$('#ai-multiply-cost').value=button.dataset.aiCost;weighted();}));
    weighted();
  }
  globalThis.AiFocusVisuals={mount};
})();
