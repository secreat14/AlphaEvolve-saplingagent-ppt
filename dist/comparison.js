"use strict";
(() => {
  const section=document.querySelector('#compare4');
  if(!section)return;
  const find=s=>section.querySelector(s);
  const all=s=>[...section.querySelectorAll(s)];
  const math=globalThis.MatrixCompareMath;
  const methods=[
    {id:'direct',title:'传统算法',subtitle:'直接行乘列',total:64,terms:math.directTerms(),color:'olive'},
    {id:'strassen',title:'经典计算机算法',subtitle:'Strassen · 两层分块',total:49,terms:math.strassenTerms(),color:'purple'},
    {id:'alpha',title:'AI 优化算法',subtitle:'AlphaTensor · 作者公开方案',total:47,terms:globalThis.ALPHATENSOR_47.terms,color:'teal'}
  ];
  let a=[1,0,1,1,0,1,1,0,1,1,0,1,0,0,1,1];
  let b=[1,1,0,1,0,1,1,0,1,0,1,1,1,0,0,1];
  let timer=null,mode='all',duration=400;
  const cursors={direct:0,strassen:0,alpha:0};
  const traces={};
  const matrixHTML=(values,editable=false,name='')=>values.map((value,i)=>editable?
    `<button class="compare-bit" data-input="${name}" data-cell="${i}" aria-label="4×4 矩阵 ${name.toUpperCase()} 第 ${Math.floor(i/4)+1} 行第 ${i%4+1} 列，点击切换 0 或 1" aria-pressed="${value===1}">${value}</button>`:
    `<span class="compare-cell">${value}</span>`).join('');
  find('#compare-input-a').innerHTML=matrixHTML(a,true,'a');
  find('#compare-input-b').innerHTML=matrixHTML(b,true,'b');
  const blank=Array(16).fill(0);
  find('#compare-cards').innerHTML=methods.map(m=>`<article class="compare-card ${m.color}" id="compare-card-${m.id}">
    <div class="compare-card-kicker"><span>${m.title}</span><span class="compare-finish" id="compare-finish-${m.id}">待开始</span></div>
    <h3>${m.subtitle}</h3><div class="compare-counter"><b id="compare-count-${m.id}">0</b><span>/ ${m.total} 次乘法</span></div>
    <progress id="compare-progress-${m.id}" max="${m.total}" value="0" aria-label="${m.title}乘法进度"></progress>
    <div class="compare-input-pair"><div><span class="compare-matrix-label">从 A 选数字</span><div class="compare-mini-grid" id="compare-a-${m.id}">${matrixHTML(a)}</div></div><span class="compare-times">×</span><div><span class="compare-matrix-label">从 B 选数字</span><div class="compare-mini-grid" id="compare-b-${m.id}">${matrixHTML(b)}</div></div></div>
    <div class="compare-current"><span id="compare-operation-${m.id}">准备好第一步</span><strong id="compare-equation-${m.id}">? × ? = ?</strong><small id="compare-path-${m.id}">高亮格子表示本步用到的输入。</small></div>
    <div class="compare-output-row"><div><span class="compare-matrix-label" id="compare-output-label-${m.id}">C 的过程累计</span><div class="compare-mini-grid compare-output-grid" id="compare-output-${m.id}">${matrixHTML(blank)}</div></div><p id="compare-explain-${m.id}">每做一次乘法，就把贡献加到对应输出。中途的数字还不是最终答案。</p></div>
    <details class="compare-detail"><summary>本步具体用了哪些数字？</summary><div><p id="compare-formula-${m.id}">开始后会显示本步的完整计算式。</p><p id="compare-destination-${m.id}"></p></div></details>
    <button class="button secondary compare-solo" data-solo="${m.id}">▶ 单独播放这条路径</button>
  </article>`).join('');
  function selected(){return mode==='all'?methods:methods.filter(m=>m.id===mode);}
  function done(){return selected().every(m=>cursors[m.id]===m.total);}
  function syncPlay(){
    find('#compare-play').textContent=timer?'Ⅱ 暂停动画':done()?'↻ 重新播放':'▶ 播放三种过程';
    if(mode!=='all'&&!timer&&!done())find('#compare-play').textContent='▶ 播放所选算法';
    find('#compare-play').setAttribute('aria-pressed',String(!!timer));
    all('[data-solo]').forEach(button=>{
      const playing=!!timer&&mode===button.dataset.solo;
      const method=methods.find(m=>m.id===button.dataset.solo);
      button.setAttribute('aria-pressed',String(playing));
      button.textContent=playing?'Ⅱ 暂停这条路径':cursors[method.id]===method.total?'↻ 重新播放这条路径':'▶ 单独播放这条路径';
    });
  }
  function stop(){if(timer!==null)clearInterval(timer);timer=null;syncPlay();}
  function rebuild(){methods.forEach(m=>{traces[m.id]=math.trace(m.terms,a,b);});}
  function sourceNames(coefficients,letter){return coefficients.flatMap((n,i)=>n?[`${letter}[${Math.floor(i/4)+1},${i%4+1}]`]:[]);}
  function expression(coefficients,values){return coefficients.flatMap((n,i)=>n?[String(values[i])]:[]).join(' + ')||'0';}
  function paintCells(selector,values,mask,kind){
    all(`${selector} .compare-cell`).forEach((cell,i)=>{
      cell.textContent=values[i];cell.classList.toggle('input-lit',!!mask?.[i]);
      cell.classList.toggle('input-a-lit',kind==='a'&&!!mask?.[i]);cell.classList.toggle('input-b-lit',kind==='b'&&!!mask?.[i]);
    });
  }
  function renderMethod(m){
    const k=cursors[m.id],isComplete=k===m.total;
    const term=k?m.terms[k-1]:null,step=k?traces[m.id][k-1]:null;
    const card=find(`#compare-card-${m.id}`);
    card.classList.toggle('is-complete',isComplete);card.classList.toggle('is-selected',mode===m.id);
    find(`#compare-count-${m.id}`).textContent=k;
    find(`#compare-progress-${m.id}`).value=k;
    find(`#compare-finish-${m.id}`).textContent=isComplete?'✓ 计算完成':k?'正在计算':'待开始';
    paintCells(`#compare-a-${m.id}`,a,term?.u,'a');paintCells(`#compare-b-${m.id}`,b,term?.v,'b');
    paintCells(`#compare-output-${m.id}`,step?.accumulator||blank,term?.w,'output');
    find(`#compare-output-label-${m.id}`).textContent=isComplete?'最终答案 C':'C 的过程累计';
    find(`#compare-operation-${m.id}`).textContent=k?`第 ${k} 次标量乘法`:'准备好第一步';
    find(`#compare-equation-${m.id}`).textContent=step?`${step.left} × ${step.right} = ${step.product}`:'? × ? = ?';
    let path='高亮格子表示本步用到的输入。';
    let explain='每做一次乘法，就把贡献加到对应输出。中途的数字还不是最终答案。';
    if(term&&m.id==='direct'){
      path=`第 ${term.row+1} 行 × 第 ${term.col+1} 列，第 ${term.k+1} 对数字。`;
      explain=`将 ${step.product} 加到 C[${term.row+1},${term.col+1}]。这个格子需要 4 个乘积，共有 16 个格子：16 × 4 = 64。`;
    }else if(term&&m.id==='strassen'){
      path=`外层第 ${term.outer+1} 个组合，内层第 ${term.inner+1} 次乘法。`;
      explain=`先把 4×4 切成四块 2×2，再应用两层 Strassen。每层 7 个组合，所以一共 7 × 7 = 49 次乘法。`;
    }else if(term){
      path=`先将 A 的 ${term.u.filter(Boolean).length} 个格子相加，B 的 ${term.v.filter(Boolean).length} 个格子相加，再乘一次。`;
      explain=`把这个中间乘积复用到 ${term.w.filter(Boolean).length} 个输出格子。作者公开方案一共有 47 个这样的乘积。`;
    }
    if(isComplete)explain=`${m.total} 次乘法全部完成。下方 4×4 结果已与直接算法核对一致。`;
    find(`#compare-path-${m.id}`).textContent=path;find(`#compare-explain-${m.id}`).textContent=explain;
    find(`#compare-formula-${m.id}`).textContent=term?`(${sourceNames(term.u,'A').join(' + ')}) × (${sourceNames(term.v,'B').join(' + ')}) = (${expression(term.u,a)}) × (${expression(term.v,b)}) = ${step.left} × ${step.right} = ${step.product}。每个括号内先按模 2 相加。`:'开始后会显示本步的完整计算式。';
    find(`#compare-destination-${m.id}`).textContent=term?`这一步把结果按模 2 加到：${sourceNames(term.w,'C').join('、')}。`:'';
  }
  function render(){
    methods.forEach(renderMethod);
    const target=math.multiply(a,b);
    find('#compare-target').innerHTML=matrixHTML(target);
    all('[data-input]').forEach(button=>{const value=(button.dataset.input==='a'?a:b)[Number(button.dataset.cell)];button.textContent=value;button.setAttribute('aria-pressed',String(value===1));});
    const finished=methods.filter(m=>cursors[m.id]===m.total);
    const verified=finished.every(m=>traces[m.id].at(-1).accumulator.every((x,i)=>x===target[i]));
    const status=find('#compare-global-status');
    if(finished.length===3){status.textContent=verified?'✓ 三种结果完全相同：64 次 → 49 次 → 47 次乘法。':'计算校验出现差异，请重置。';status.classList.toggle('verified',verified);}
    else{status.classList.remove('verified');status.textContent=finished.length?`${finished.map(m=>m.id==='alpha'?'AlphaTensor':m.id==='strassen'?'Strassen':'直接算法').join('、')}已完成；其他路径继续计算。`:'点击矩阵里的 0 / 1 可以修改题目。每一拍显示一次标量乘法。';}
    syncPlay();
  }
  function advance(){selected().forEach(m=>{cursors[m.id]=Math.min(m.total,cursors[m.id]+1);});render();if(done())stop();}
  function reset(onlySelected=false){stop();(onlySelected?selected():methods).forEach(m=>{cursors[m.id]=0;});render();}
  function play(){
    if(timer){stop();return;}
    if(done())reset(true);
    advance();if(!done())timer=setInterval(advance,duration);syncPlay();
  }
  find('#compare-play').addEventListener('click',play);
  find('#compare-next').addEventListener('click',()=>{stop();if(done())reset(true);advance();});
  find('#compare-reset').addEventListener('click',()=>reset());
  find('#compare-finish').addEventListener('click',()=>{stop();methods.forEach(m=>{cursors[m.id]=m.total;});render();});
  find('#compare-mode').addEventListener('change',event=>{stop();mode=event.target.value;render();});
  find('#compare-speed').addEventListener('change',event=>{const playing=timer!==null;stop();duration=Number(event.target.value);if(playing&&!done()){timer=setInterval(advance,duration);syncPlay();}});
  all('[data-solo]').forEach(button=>button.addEventListener('click',()=>{
    const samePlaying=timer&&mode===button.dataset.solo;stop();mode=button.dataset.solo;find('#compare-mode').value=mode;render();if(!samePlaying)play();
  }));
  all('[data-input]').forEach(button=>button.addEventListener('click',()=>{
    const values=button.dataset.input==='a'?a:b;values[Number(button.dataset.cell)]^=1;rebuild();reset();
  }));
  find('#compare-random').addEventListener('click',()=>{a=Array.from({length:16},()=>Math.round(Math.random()));b=Array.from({length:16},()=>Math.round(Math.random()));rebuild();reset();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('pagehide',stop);
  rebuild();render();
})();
