"use strict";
(() => {
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const slides=$$('.slide');
  const paper='https://doi.org/10.1038/s41586-022-05172-4';
  const strassenPaper='https://link.springer.com/article/10.1007/BF02165411';
  const nvidia='https://docs.nvidia.com/deeplearning/performance/dl-performance-matrix-multiplication/';
  const gpuSource='https://docs.nvidia.com/deeplearning/performance/dl-performance-gpu-background/index.html';
  const flash='https://arxiv.org/abs/2205.14135';
  const evolve='https://arxiv.org/abs/2506.13131';
  const evolveBlog='https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/';
  const notes=[
    {text:'开场可以问：同一道矩阵乘法，答案已经确定，计算过程还有没有改进空间？\n今天从大家熟悉的行乘列出发，介绍经典算法、GPU 的执行方式，以及 AI 参与算法发现的例子。封面上的 64、49、47 都是后面同一道 4×4 题目所需的标量乘法次数。47 次有模 2 条件，后面单独解释。',action:'停留约 30 秒，介绍主题后翻页。',sources:[paper]},
    {text:'矩阵可以表示图像中的像素、图形中的坐标，也可以表示神经网络的输入和权重。科学计算还经常需要求解线性方程组。\n这里的关键是：矩阵计算属于基础操作，会在许多任务中反复出现。因此，一个底层操作的改进可能影响很多上层应用。后面会区分数学上少做运算和机器实际跑得快。',action:'用听众熟悉的图像或神经网络举一个例子即可。',sources:[paper,nvidia]},
    {text:'先请大家看 A 的第一行与 B 的第一列。1 乘 5 得到 5，2 乘 7 得到 14，再相加得到 19。输出矩阵里的每一个格子都用同样的方法。\n这里共有 4 个输出格子，每个需要 2 次乘法，所以是 8 次乘法。另外需要 4 次加法。我们先关注乘法次数，因为接下来会看到算法如何重新组织这些乘法。',action:'点击播放。建议在第一格完成后暂停，再说明其他格子重复相同动作。',sources:[nvidia]},
    {text:'Strassen 在 1969 年发现，两个 2×2 矩阵相乘只需要 7 次标量乘法。关键是先对输入做加减法，计算 7 个中间乘积，再把这些乘积加减组合成最终答案。\n这里展示实际数值，例如第一项先算 1+4 和 5+8，再相乘得到 65。某些中间结果会在多个输出中复用。这个经典版本需要 18 次加减法，因此小矩阵上不一定更快，优势要结合递归与实现来看。',action:'播放七步。强调无需现场背完七条公式，只需理解中间结果可以复用。',sources:[strassenPaper,paper]},
    {text:'把 4×4 矩阵切成四个 2×2 小块，外层可以像处理一个 2×2 矩阵那样，用 7 次块乘法来计算。每次 2×2 块乘法又可以用 7 次标量乘法完成。\n所以两层一共是 7 乘 7，得到 49 次。直接算法有 16 个输出，每个 4 次乘法，所以需要 64 次。这里比较的是标量乘法次数，额外加减法没有消失。',action:'指着不同颜色的四块解释外层，再指着块里的数字解释内层。',sources:[strassenPaper,paper]},
    {text:'GPU 是图形处理器，现在也广泛用于适合并行的数值计算。大矩阵可以切成小块，交给很多小组同时处理。\n这个演示把 16 个独立任务交给一个小组，或者四个小组。理想情况下，四组在 4 轮完成，而逐个处理需要 16 轮。现实中还存在调度和通信，CPU 也能并行。GPU 的优势需要足够多且适合拆开的任务。Tensor Cores 可以理解为专门处理矩阵块乘法与累加的计算单元。',action:'播放后，在右边 4 轮完成时短暂停顿。说明这不是实际硬件测速。',sources:[gpuSource,nvidia]},
    {text:'计算也会等待数据。可以用做菜的调料来类比：如果调料在远处，每次用都去取，会浪费很多搬运。先拿到手边，再重复使用，通常更高效。\n本例有 8 份数据，每份用 4 次。反复取是 32 趟，每份只取一次是 8 趟。FlashAttention 把注意力计算分块，减少 GPU 显存和片上存储之间的读写。这里的 32 和 8 是教学假设，不是论文的实测加速比。',action:'播放搬运。提示观众观察右边的计数在 8 停下，数据继续在手边复用。',sources:[flash,nvidia]},
    {text:'前面的 Strassen 是人设计的算法。AlphaTensor 尝试用强化学习帮助搜索新的矩阵乘法算法，论文发表于 2022 年 Nature。\n寻找算法时，需要决定怎样线性组合输入、让组合后的数相乘，以及把中间乘积加到哪些输出。最终必须与矩阵乘法完全一致，同时希望乘法更少。可以把它理解成：神经网络判断哪些动作更有希望，树搜索往前探索，再用反馈不断改进选择。发现出来的是适用范围内通用的计算规则。',action:'按从左到右的顺序解释三步，不需要介绍寄存器或神经网络结构。',sources:[paper]},
    {text:'在比较 47 次方案前，需要统一运算规则。模 2 只保留除以 2 的余数，结果是 0 或 1。例如 1+1=2，2 除以 2 的余数是 0，所以模 2 中写成 1+1=0。\nAlphaTensor 的 4×4、47 次结果属于这个规则。它不能直接拿来计算任意实数 4×4 矩阵。接下来三种算法都使用相同的模 2 规则，因此最终答案可以公平比较。',action:'可以问听众 1+1+1 在模 2 下是多少，答案是 1。',sources:[paper]},
    {text:'这是同一道 4×4 题目，三列都使用相同的输入 A 和 B。紫色与绿色标出本步从 A 和 B 选取的数字，橙色标出本步贡献到哪些输出。每拍展示一次标量乘法。\n直接算法按行乘列，逐项累加。Strassen 对输入进行分块组合，用两层递归完成 49 次乘法。AI 列实际使用作者公开的 47 项模 2 分解，将若干输入先按模 2 相加，再相乘，并把结果复用到不同输出。\n动画到 47 步时 AI 路径结束，到 49 步时 Strassen 结束，到 64 步时直接算法结束。最后三种结果必须一致。加法、搬运与硬件开销没有按时间计入，所以不能把动画的结束先后当成实测运行速度。',action:'先单步两三次，解释输入高亮与输出贡献。再选快速播放到终点。可用范围菜单单独演示 AI 路径，或换一道题核对结果。建议留 3 分钟。',sources:[paper,'https://github.com/google-deepmind/alphatensor/tree/'+globalThis.ALPHATENSOR_47.commit+'/algorithms']},
    {text:'真实 AlphaTensor 使用矩阵乘法张量来描述算法发现问题。为了直观，可以把它看成一张记录剩余计算关系的表。\n每加入一个中间乘积，就从目标计算关系里扣掉它的贡献。某一步可能同时解决一些关系，也引入需要抵消的贡献，因此中途未归零的数量可能增加。只有最后所有关系都归零，算法才完整正确。\n本页使用已知的七步 Strassen 路径讲解原理，没有运行 AlphaTensor，也不表示真实搜索只尝试了七步。',action:'单步第一步，指出非零格子可能变多。然后播放到全部归零。',sources:[paper]},
    {text:'表里有两个不同的成果。第一行是 4×4 模 2 矩阵，比较基线是 Strassen 两层递归的 49 次，AlphaTensor 找到 47 次。\n第二行是 4×5 与 5×5 在普通实数下相乘。直接方法需要 100 次乘法，但此前更好的算法已经降到 80 次，AlphaTensor 进一步达到 76 次。讲论文时必须把输入尺寸、运算规则和比较基线一起说明。',action:'强调 80 是已经优化过的基线，避免说成直接算法只有 80 次。',sources:[paper]},
    {text:'2025 年的 AlphaEvolve 把大语言模型提出代码、自动验证与进化搜索结合起来。数学方面，团队找到 4×4 复数矩阵用 48 次标量乘法的算法。这个复数设定与模 2 下的 47 次不同，不能只比较数字大小。\n工程方面，团队报告某个矩阵乘法内核提速 23%，对应整体 Gemini 训练时间减少约 1%。这个例子说明，局部计算更快，整体收益还取决于这部分原先占用了多少时间。',action:'分别指出左边是数学运算次数，右边是工程中的局部与整体性能。',sources:[evolve,evolveBlog]},
    {text:'到这里需要区分两个问题。算法研究可能关注尽量减少标量乘法次数，工程研究则需要测量给定硬件和输入下真正用了多少时间。\n额外的加减法、临时结果、显存读写、并行利用率，以及数值误差，都会影响实际效果。所以发现更少乘法的算法很有价值，但是否更适合某个应用，还要做正确性和性能评估。',action:'可问观众：如果少两次乘法，却多搬很多数据，是否仍然划算？',sources:[nvidia,paper]},
    {text:'回到开场问题：同一道计算题，即使答案固定，计算路径仍然可能改进。Strassen 和 AlphaTensor 展示了重新组合步骤来减少乘法，GPU 展示并行执行，FlashAttention 展示减少数据搬运。\n今天最重要的结论是，AI 已经可以参与基础算法的发现与优化，而评价一种方法还需要明确适用条件和衡量标准。可以在这一页接受提问。',action:'总结后停顿，邀请听众讨论怎样定义计算方法更好。',sources:[paper,flash]},
    {text:'这些是本次演讲的主要来源，均为原论文或官方资料。可点击标题打开原文。AlphaTensor 47 次方案使用作者开源仓库的数据，来源提交版本及 Apache 2.0 许可已嵌入 HTML。\n如果听众希望继续阅读，先看 AlphaTensor 团队的图文介绍，再读原论文和 NVIDIA 矩阵乘法指南。',action:'参考资料页可以留在屏幕上，便于问答时查阅。',sources:[paper,strassenPaper,nvidia,gpuSource,flash,evolve,evolveBlog]}
  ];
  let current=0;
  const demos=new Map();
  const cells=(values)=>values.map(v=>`<span class="cell">${v}</span>`).join('');
  function demo(id,max,render,interval=900){
    const object={id,max,cursor:0,interval,timer:null,render,
      stop(){if(this.timer!==null)clearInterval(this.timer);this.timer=null;this.sync();},
      sync(){const button=$(`[data-play="${id}"]`);button.textContent=this.timer?'暂停':this.cursor>=this.max?'再播放':button.dataset.original;button.setAttribute('aria-pressed',String(this.timer!==null));},
      paint(){this.render(this.cursor);this.sync();},
      reset(){this.stop();this.cursor=0;this.paint();},
      next(){this.stop();if(this.cursor>=this.max)this.cursor=0;this.cursor++;this.paint();},
      play(){if(this.timer){this.stop();return;}if(this.cursor>=this.max)this.cursor=0;this.cursor++;this.paint();if(this.cursor<this.max)this.timer=setInterval(()=>{this.cursor++;this.paint();if(this.cursor>=this.max)this.stop();},this.interval);this.sync();},
      finish(){this.stop();this.cursor=this.max;this.paint();}
    };
    const play=$(`[data-play="${id}"]`);play.dataset.original=play.textContent;
    play.addEventListener('click',()=>object.play());$(`[data-step="${id}"]`).addEventListener('click',()=>object.next());$(`[data-reset="${id}"]`).addEventListener('click',()=>object.reset());
    demos.set(id,object);object.paint();return object;
  }
  const a2=[1,2,3,4],b2=[5,6,7,8],c2=[19,22,43,50];
  $('#basic-a').innerHTML=cells(a2);$('#basic-b').innerHTML=cells(b2);$('#basic-c').innerHTML=cells(['?','?','?','?']);
  demo('basic',12,n=>{
    const out=n?Math.floor((n-1)/3):0,row=Math.floor(out/2),col=out%2,phase=n?(n-1)%3:0;
    $$('#basic-a .cell').forEach((e,i)=>{e.classList.toggle('a-lit',n>0&&Math.floor(i/2)===row);e.classList.toggle('active',n>0&&i===row*2+Math.min(phase,1));});
    $$('#basic-b .cell').forEach((e,i)=>{e.classList.toggle('b-lit',n>0&&i%2===col);e.classList.toggle('active',n>0&&i===Math.min(phase,1)*2+col);});
    $$('#basic-c .cell').forEach((e,i)=>{e.textContent=n>=(i+1)*3?c2[i]:'?';e.classList.toggle('output-lit',n>0&&i===out);});
    const first=a2[row*2]*b2[col],second=a2[row*2+1]*b2[2+col];
    $('#basic-equation').textContent=n===0?'1 × 5 + 2 × 7 = 19':phase===0?`${a2[row*2]} × ${b2[col]} = ${first}`:phase===1?`${a2[row*2+1]} × ${b2[2+col]} = ${second}`:`${first} + ${second} = ${c2[out]}`;
    $('#basic-caption').textContent=n===0?'动画会依次突出用到的那一行与那一列':phase===2?`得到 C 的第 ${row+1} 行第 ${col+1} 列${n===12?'，全部完成':''}`:`第 ${row+1} 行与第 ${col+1} 列，先计算第 ${phase+1} 对数字`;
  },1000);
  const strassenTerms=[['(1+4)(5+8)',65],['(3+4) × 5',35],['1 × (6−8)',-2],['4 × (7−5)',8],['(1+2) × 8',24],['(3−1)(5+6)',22],['(2−4)(7+8)',-30]];
  $('#strassen-products').innerHTML=strassenTerms.map((x,i)=>`<div class="strassen-product"><span>M${i+1}</span><p>${x[0]}</p><b>?</b></div>`).join('');
  demo('strassen',7,n=>{
    $$('.strassen-product').forEach((e,i)=>{e.classList.toggle('current',n===i+1);e.querySelector('b').textContent=n>i?strassenTerms[i][1]:'?';});
    $('#strassen-answer').textContent=n===7?'[19, 22; 43, 50]':`已计算 ${n} / 7 项`;
    $('#strassen-caption').textContent=n===7?'C₁₁ = M₁ + M₄ − M₅ + M₇ = 19，其他格子也可用这些中间乘积还原。':'M 表示可复用的中间结果。这里沿用上一页的 A 与 B。';
  },850);
  $('#block-matrix').innerHTML=Array.from({length:16},(_,i)=>`<span class="cell block-${Math.floor(i/8)*2+Math.floor(i%4/2)}">${i+1}</span>`).join('');
  for(const id of ['gpu-serial','gpu-parallel'])$('#'+id).innerHTML=Array.from({length:16},(_,i)=>`<span>${String(i+1).padStart(2,'0')}</span>`).join('');
  demo('gpu',16,n=>{
    $$('#gpu-serial>span').forEach((e,i)=>{e.classList.toggle('done',i<n);e.classList.toggle('current',n>0&&i===n-1);});
    $$('#gpu-parallel>span').forEach((e,i)=>{e.classList.toggle('done',i<Math.min(16,n*4));e.classList.toggle('current',n>0&&n<=4&&i>=(n-1)*4&&i<n*4);});
    $('#gpu-serial-label').textContent=`${n} / 16 轮`;$('#gpu-parallel-label').textContent=`${Math.min(n,4)} / 4 轮`;
    $('#gpu-caption').textContent=n>=4?'右边在第 4 轮完成，左边需要 16 轮完成':'并行计算需要足够多、能够分开的任务';
  },450);
  demo('memory',32,n=>{
    $('#memory-naive').textContent=n;$('#memory-reuse').textContent=Math.min(n,8);
    for(const [id,moving] of [['package-naive',n>0],['package-reuse',n>0&&n<=8]]){const e=$('#'+id);e.classList.remove('travel');if(moving){void e.offsetWidth;e.classList.add('travel');}}
  },300);
  const math=globalThis.MatrixCompareMath;
  const methods=[{id:'direct',name:'直接行乘列',total:64,terms:math.directTerms()},{id:'strassen',name:'Strassen 两层分块',total:49,terms:math.strassenTerms()},{id:'alpha',name:'AlphaTensor 优化',total:47,terms:globalThis.ALPHATENSOR_47.terms}];
  let a4=[1,0,1,1,0,1,1,0,1,1,0,1,0,0,1,1],b4=[1,1,0,1,0,1,1,0,1,0,1,1,1,0,0,1],mode='all';
  const traces={};
  const smallMatrix=values=>values.map(v=>`<span>${v}</span>`).join('');
  $('#talk-comparison').innerHTML=methods.map(m=>`<div class="comparison-method ${m.id}" id="talk-method-${m.id}"><h3>${m.name}</h3><div class="method-counter"><b id="talk-count-${m.id}">0</b><span>/ ${m.total} 次</span></div><div class="method-progress"><i id="talk-progress-${m.id}"></i></div><div class="method-inputs"><div><span>输入 A</span><div class="small-matrix" id="talk-a-${m.id}">${smallMatrix(a4)}</div></div><b>×</b><div><span>输入 B</span><div class="small-matrix" id="talk-b-${m.id}">${smallMatrix(b4)}</div></div></div><div class="method-equation" id="talk-equation-${m.id}">? × ? = ?</div><p class="method-caption" id="talk-caption-${m.id}">准备第一步</p><div class="method-output"><div><span id="talk-output-label-${m.id}">输出累计 C</span><div class="small-matrix" id="talk-c-${m.id}">${smallMatrix(Array(16).fill(0))}</div></div><p id="talk-output-note-${m.id}">当前为中间状态，仍需继续累加。</p></div></div>`).join('');
  const rebuild=()=>methods.forEach(m=>{traces[m.id]=math.trace(m.terms,a4,b4);});rebuild();
  function updateGrid(id,values,mask,kind){$$(id+'>span').forEach((e,i)=>{e.textContent=values[i];for(const c of ['a','b','c'])e.classList.toggle(c+'-on',kind===c&&!!mask?.[i]);});}
  const comparison=demo('compare',64,frame=>{
    let finished=0;
    const target=math.multiply(a4,b4);
    for(const m of methods){
      const selected=mode==='all'||mode===m.id,n=selected?Math.min(frame,m.total):0;
      const term=n?m.terms[n-1]:null,step=n?traces[m.id][n-1]:null,complete=n===m.total;
      if(complete)finished++;
      const wrapper=$('#talk-method-'+m.id);wrapper.classList.toggle('inactive',!selected);wrapper.classList.toggle('complete',complete);
      $('#talk-count-'+m.id).textContent=n;$('#talk-progress-'+m.id).style.width=`${100*n/m.total}%`;
      updateGrid('#talk-a-'+m.id,a4,term?.u,'a');updateGrid('#talk-b-'+m.id,b4,term?.v,'b');updateGrid('#talk-c-'+m.id,step?.accumulator||Array(16).fill(0),term?.w,'c');
      $('#talk-equation-'+m.id).textContent=step?`${step.left} × ${step.right} = ${step.product}`:'? × ? = ?';
      $('#talk-caption-'+m.id).textContent=!term?'先按输入组合，再做一次标量乘法':m.id==='direct'?`第 ${term.row+1} 行与第 ${term.col+1} 列，第 ${term.k+1} 对数字`:m.id==='strassen'?`外层第 ${term.outer+1} 个组合，内层第 ${term.inner+1} 次乘法`:`A 取 ${term.u.filter(Boolean).length} 格、B 取 ${term.v.filter(Boolean).length} 格，先按模 2 相加`;
      $('#talk-output-label-'+m.id).textContent=complete?'最终答案 C':'输出累计 C';
      const correct=complete&&step.accumulator.every((x,i)=>x===target[i]);
      $('#talk-output-note-'+m.id).textContent=correct?'已完成，结果与直接算法一致':term?`本步把 ${step.product} 加到 ${term.w.filter(Boolean).length} 个输出格子`:'当前为中间状态，仍需继续累加。';
    }
    $('#comparison-status').textContent=mode!=='all'?`${methods.find(m=>m.id===mode).name}单独演示，统一采用模 2 规则。`:finished===3?'三种最终结果完全相同，乘法次数分别是 64、49、47。':finished?`${finished===1?'AlphaTensor 已完成':'AlphaTensor 与 Strassen 已完成'}，其余路径继续计算。`:'统一采用模 2 运算。每列内部使用相同的 A 与 B。';
  },400);
  $('#compare-mode').addEventListener('change',e=>{comparison.stop();mode=e.target.value;comparison.max=mode==='all'?64:methods.find(m=>m.id===mode).total;comparison.reset();});
  $('#compare-tempo').addEventListener('change',e=>{const playing=!!comparison.timer;comparison.stop();comparison.interval=Number(e.target.value);if(playing)comparison.play();});
  $('#compare-finish').addEventListener('click',()=>comparison.finish());
  $('#compare-random').addEventListener('click',()=>{a4=Array.from({length:16},()=>Math.round(Math.random()));b4=Array.from({length:16},()=>Math.round(Math.random()));rebuild();comparison.reset();});
  const factor2=[[[1,0,0,1],[1,0,0,1],[1,0,0,1]],[[0,0,1,1],[1,0,0,0],[0,0,1,-1]],[[1,0,0,0],[0,1,0,-1],[0,1,0,1]],[[0,0,0,1],[-1,0,1,0],[1,0,1,0]],[[1,1,0,0],[0,0,0,1],[-1,1,0,0]],[[-1,0,1,0],[1,1,0,0],[0,0,0,1]],[[0,1,0,-1],[0,0,1,1],[1,0,0,0]]];
  $('#talk-tensor').innerHTML=Array.from({length:4},(_,i)=>`<div><h3>输出 C${Math.floor(i/2)+1}${i%2+1}</h3><div class="tensor-grid">${Array(16).fill('<span>0</span>').join('')}</div></div>`).join('');
  demo('tensor',7,n=>{
    const residual=Array(64).fill(0);
    for(let o=0;o<4;o++)for(let k=0;k<2;k++)residual[o*16+(Math.floor(o/2)*2+k)*4+k*2+o%2]=1;
    for(let s=0;s<n;s++)for(let o=0;o<4;o++)for(let a=0;a<4;a++)for(let b=0;b<4;b++)residual[o*16+a*4+b]-=factor2[s][0][a]*factor2[s][1][b]*factor2[s][2][o];
    const remaining=residual.filter(x=>x!==0).length;
    $$('.tensor-grid>span').forEach((e,i)=>{e.textContent=residual[i];e.classList.toggle('positive',residual[i]>0);e.classList.toggle('negative',residual[i]<0);});
    $$('.tensor-grid').forEach(e=>e.classList.toggle('done',remaining===0));
    $('#tensor-count').textContent=`${n} / 7`;$('#tensor-remaining').textContent=remaining;
    $('#tensor-caption').textContent=remaining===0?'所有关系归零，七个中间乘积恰好重建矩阵乘法。':'中途可能出现更多非零格子，最终必须全部归零。';
  },1200);

  function resize(){
    const notesVisible=!$('#notes-panel').hidden&&innerWidth>750;
    const cinema=document.body.classList.contains('cinema');
    const width=innerWidth-(notesVisible?360:0),height=innerHeight-(cinema?0:105);
    $('#viewport').style.right=notesVisible?'360px':'0';
    document.documentElement.style.setProperty('--scale',Math.max(.1,Math.min((width-20)/1440,(height-16)/810)));
  }
  function duration(seconds){return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
  function renderNotes(){
    const note=notes[current];
    $('#notes-content').innerHTML=`<div class="notes-time">第 ${current+1} 页，建议 ${duration(Number(slides[current].dataset.seconds))}，全场 20:00</div><div class="notes-body"></div><div class="notes-action"></div><div class="notes-sources">参考来源${note.sources.map((url,i)=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${i+1}. ${url}</a>`).join('')}</div>`;
    $('.notes-body').textContent=note.text;$('.notes-action').textContent=note.action;
  }
  function go(index,updateHash=true){
    demos.forEach(d=>d.stop());
    current=Math.max(0,Math.min(slides.length-1,index));
    slides.forEach((slide,i)=>{const active=i===current;slide.classList.toggle('active',active);slide.setAttribute('aria-hidden',String(!active));slide.inert=!active;});
    $('#slide-count').textContent=`${String(current+1).padStart(2,'0')} / ${slides.length}`;$('#slide-title').textContent=slides[current].dataset.title;
    $('#deck-progress').style.width=`${100*(current+1)/slides.length}%`;
    $('#previous').disabled=current===0;$('#next').disabled=current===slides.length-1;
    $('#announcement').textContent=`第 ${current+1} 页：${slides[current].dataset.title}`;
    $$('#overview-grid>button').forEach((button,i)=>{button.classList.toggle('current',i===current);button.setAttribute('aria-current',i===current?'page':'false');});
    renderNotes();if(updateHash&&location.hash!==`#slide=${current+1}`){try{history.replaceState(null,'',`#slide=${current+1}`);}catch{location.hash=`slide=${current+1}`;}}
  }
  $('#overview-grid').innerHTML=slides.map((slide,i)=>`<button data-jump="${i}"><span>${String(i+1).padStart(2,'0')}</span><strong>${slide.dataset.title}</strong><small>建议 ${duration(Number(slide.dataset.seconds))}</small></button>`).join('');
  $$('[data-jump]').forEach(button=>button.addEventListener('click',()=>{$('#overview-dialog').close();go(Number(button.dataset.jump));}));
  $('#previous').addEventListener('click',()=>go(current-1));$('#next').addEventListener('click',()=>go(current+1));
  function toggleNotes(){const panel=$('#notes-panel');panel.hidden=!panel.hidden;$('#notes-button').setAttribute('aria-pressed',String(!panel.hidden));resize();}
  $('#notes-button').addEventListener('click',toggleNotes);$('#notes-close').addEventListener('click',toggleNotes);
  $('#overview-button').addEventListener('click',()=>{$('#overview-dialog').showModal();});
  $('#help-button').addEventListener('click',()=>$('#help-dialog').showModal());
  $$('[data-close]').forEach(button=>button.addEventListener('click',()=>$('#'+button.dataset.close).close()));
  $$('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}}));
  let nativeFullscreen=false;
  function setCinema(enabled){document.body.classList.toggle('cinema',enabled);resize();}
  async function fullscreen(){
    if(document.fullscreenElement){await document.exitFullscreen();setCinema(false);return;}
    if(document.body.classList.contains('cinema')){setCinema(false);return;}
    try{await document.documentElement.requestFullscreen();nativeFullscreen=true;setCinema(true);}catch{setCinema(true);}
  }
  $('#fullscreen-button').addEventListener('click',fullscreen);
  $('#exit-cinema').addEventListener('click',fullscreen);
  let elapsed=0,timer=null,started=0;
  function paintClock(){const value=elapsed+(timer?Date.now()-started:0);$('#elapsed').textContent=duration(Math.floor(value/1000)).padStart(5,'0');$('#timer-button').classList.toggle('running',!!timer);}
  function toggleTimer(){if(timer){elapsed+=Date.now()-started;clearInterval(timer);timer=null;}else{started=Date.now();timer=setInterval(paintClock,500);}paintClock();}
  $('#timer-button').addEventListener('click',toggleTimer);$('#timer-reset').addEventListener('click',()=>{if(timer)clearInterval(timer);timer=null;elapsed=0;paintClock();});
  function blackout(){const overlay=$('#blackout');overlay.hidden=!overlay.hidden;demos.forEach(d=>d.stop());}
  $('#blackout').addEventListener('click',blackout);
  document.addEventListener('keydown',event=>{
    if(event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input,select,textarea'))return;
    if($$('dialog').some(d=>d.open))return;
    const key=event.key.toLowerCase();
    if(key==='b'){event.preventDefault();blackout();return;}
    if(!$('#blackout').hidden){if(key==='escape')blackout();return;}
    if(['arrowright','arrowdown','pagedown','arrowleft','arrowup','pageup','home','end'].includes(key)||(key===' '&&!event.target.closest('button,a,summary'))){event.preventDefault();if(['arrowright','arrowdown','pagedown',' '].includes(key))go(current+1);else if(['arrowleft','arrowup','pageup'].includes(key))go(current-1);else go(key==='home'?0:slides.length-1);return;}
    if(key==='f'){event.preventDefault();fullscreen();}else if(key==='n'){event.preventDefault();toggleNotes();}else if(key==='o'){event.preventDefault();$('#overview-dialog').showModal();}else if(key==='t'){event.preventDefault();toggleTimer();}else if(key==='r'){event.preventDefault();const button=slides[current].querySelector('[data-reset]');if(button)demos.get(button.dataset.reset).reset();}else if(key==='escape'){if(document.body.classList.contains('cinema'))fullscreen();else if(!$('#notes-panel').hidden)toggleNotes();}
  });
  let pointerStart=null;
  $('#viewport').addEventListener('pointerdown',event=>{if(event.pointerType==='touch'&&!event.target.closest('button,select,a'))pointerStart={x:event.clientX,y:event.clientY};});
  $('#viewport').addEventListener('pointerup',event=>{if(!pointerStart)return;const dx=event.clientX-pointerStart.x,dy=event.clientY-pointerStart.y;pointerStart=null;if(Math.abs(dx)>75&&Math.abs(dx)>Math.abs(dy)*1.5)go(current+(dx<0?1:-1));});
  window.addEventListener('resize',resize);document.addEventListener('fullscreenchange',()=>{if(nativeFullscreen&&!document.fullscreenElement){nativeFullscreen=false;setCinema(false);}resize();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)demos.forEach(d=>d.stop());});
  window.addEventListener('hashchange',()=>{const match=location.hash.match(/^#slide=(\d+)$/);if(match)go(Number(match[1])-1,false);});
  const initial=location.hash.match(/^#slide=(\d+)$/);go(initial?Number(initial[1])-1:0);resize();
})();
