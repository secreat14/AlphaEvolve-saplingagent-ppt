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
    {"text":"全场矩阵案例统一使用 4×4。这里 A 和 B 都只含 0 和 1，但这一页先按普通算术相乘，不取模。第一行与第一列计算为 1×1+0×0+1×1+1×1=3。四个乘积只需要三次加法合并。\n输出有 16 格，每格 4 次乘法、3 次加法，所以总计 64 次乘法和 48 次加法。后面 Strassen 使用同一组输入并还原同一结果。再往后改为模 2 运算时，规则变化会明确说明。","action":"先单步五下，解释左上角的四次乘法与三次加法。随后播放，或点看完整结果。","sources":["https://docs.nvidia.com/deeplearning/performance/dl-performance-matrix-multiplication/"]},
    {"text":"这一页仍计算上一页的 4×4 乘积。Strassen 把整张矩阵切成四个内部块。外层做七组块乘法，每组再递归为七次标量乘法，所以总计 49 次。内部块只是拆解步骤，没有换成另一道输入题。\n算法先用加减法组合输入，再复用中间乘积来还原输出。右边显示当前乘积贡献的累计结果，最后必须与上一页完全一致。\n经典递归到标量的实现需要 198 次加减法：外层预处理 40 次、七组内部计算共 126 次、外层合并 32 次。动画将乘积贡献展开显示，198 指经典递归执行的计数，不是逐项展开后重新计算所有线性组合的计数。","action":"单步观察组号和输出贡献，然后看完整结果。强调减少乘法有增加加法的代价。","sources":["https://math.mit.edu/~djk/18.310/Lecture-Notes/Matrix_Multiplication.html","https://cs-web.bu.edu/faculty/homer/630f21/hw/hw1-ans.pdf","https://doi.org/10.1038/s41586-022-05172-4"]},
    {"text":"为什么要增加加法？因为可以用加减法先组合输入，让一个中间乘积服务多个输出，从而少做一些乘法。这里仍以同一 4×4 为例，直接法为 64 乘和 48 加，经典 Strassen 为 49 乘和 198 加减。\n它省下 15 次乘法，但多了 150 次加减法。若假设每次乘法与加法成本相同，直接法 112 单位、Strassen 247 单位，优化并不划算。若假设乘法成本为加法的 10 倍，两者恰好打平。乘法成本为 20 时，直接法 1328、Strassen 1178 单位。\n这些是教学成本单位，不是现代 CPU 或 GPU 的实测结果，也不表示标量乘法总比加法贵。块乘法内部包含很多标量运算，矩阵规模增长时，减少块乘法可能更有价值。真实效果还要计入访存、融合指令和数值误差。","action":"依次点成本 1、10、20，让听众看到取舍。提问：更少的乘法一定代表更快吗？","sources":["https://math.mit.edu/~djk/18.310/Lecture-Notes/Matrix_Multiplication.html","https://cs-web.bu.edu/faculty/homer/630f21/hw/hw1-ans.pdf","https://docs.nvidia.com/deeplearning/performance/dl-performance-matrix-multiplication/"]},
    {"text":"继续使用 4×4 输出的 16 个格子作为任务。每格需要计算一组行乘列，这 16 个输出可以分工。一个小组逐格做需要 16 轮，四组同时做理想情况下需要四轮。\n这是等耗时独立任务的教学模型，没有统计调度、通信和数据访问，不能当作 CPU 与 GPU 的真实测速。CPU 也可以并行。GPU 的收益需要合适的任务规模与分工方式。","action":"播放后，在右边四轮完成时暂停，指出任务格子是 C11 到 C44。","sources":["https://docs.nvidia.com/deeplearning/performance/dl-performance-matrix-multiplication/","https://docs.nvidia.com/deeplearning/performance/dl-performance-gpu-background/index.html"]},
    {"text":"4×4 的 A 有 16 个元素。计算 A 乘 B 时，A 的每个元素需要参与四个输出列，所以会被使用四次。\n如果每次使用都从远处取，读取 A 共 64 趟。如果先将 A 的 16 个元素拿到手边，并且容量足够，就可以重复使用，只读取 16 趟。这里仅统计 A，不包括 B、输出和其他开销。\nFlashAttention 使用分块减少显存与片上存储之间的读写，但这张 4×4 教学图不是该论文的实测性能。","action":"播放搬运。观察右边在 16 趟停止，而左边继续到 64。","sources":["https://docs.nvidia.com/deeplearning/performance/dl-performance-matrix-multiplication/","https://arxiv.org/abs/2205.14135"]},
    {text:'前面的 Strassen 是人设计的算法。AlphaTensor 尝试用强化学习帮助搜索新的矩阵乘法算法，论文发表于 2022 年 Nature。\n寻找算法时，需要决定怎样线性组合输入、让组合后的数相乘，以及把中间乘积加到哪些输出。最终必须与矩阵乘法完全一致，同时希望乘法更少。可以把它理解成：神经网络判断哪些动作更有希望，树搜索往前探索，再用反馈不断改进选择。发现出来的是适用范围内通用的计算规则。',action:'按从左到右的顺序解释三步，不需要介绍寄存器或神经网络结构。',sources:[paper]},
    {text:'在比较 47 次方案前，需要统一运算规则。模 2 只保留除以 2 的余数，结果是 0 或 1。例如 1+1=2，2 除以 2 的余数是 0，所以模 2 中写成 1+1=0。\nAlphaTensor 的 4×4、47 次结果属于这个规则。它不能直接拿来计算任意实数 4×4 矩阵。接下来三种算法都使用相同的模 2 规则，因此最终答案可以公平比较。',action:'可以问听众 1+1+1 在模 2 下是多少，答案是 1。',sources:[paper]},
    {text:'这是同一道 4×4 题目，三列都使用相同的输入 A 和 B。紫色与绿色标出本步从 A 和 B 选取的数字，橙色标出本步贡献到哪些输出。每拍展示一次标量乘法。\n直接算法按行乘列，逐项累加。Strassen 对输入进行分块组合，用两层递归完成 49 次乘法。AI 列实际使用作者公开的 47 项模 2 分解，将若干输入先按模 2 相加，再相乘，并把结果复用到不同输出。\n动画到 47 步时 AI 路径结束，到 49 步时 Strassen 结束，到 64 步时直接算法结束。最后三种结果必须一致。加法、搬运与硬件开销没有按时间计入，所以不能把动画的结束先后当成实测运行速度。',action:'先单步两三次，解释输入高亮与输出贡献。再选快速播放到终点。可用范围菜单单独演示 AI 路径，或换一道题核对结果。建议留 3 分钟。',sources:[paper,'https://github.com/google-deepmind/alphatensor/tree/'+globalThis.ALPHATENSOR_47.commit+'/algorithms']},
    {"text":"这一页验证作者公开的 4×4、47 次模 2 方案。输出 C 有 16 格，每格可能涉及 A 的 16 个元素与 B 的 16 个元素之间的 256 种乘积关系，所以整个恒等式有 4096 个系数。\n我们把每个输出的 256 个系数压缩成一个统计数，表示还有多少条关系未吻合。初始每格需要四项，16 格共 64 条。逐步加入公开的 47 个组合乘积后，所有 4096 个系数必须吻合。中途关系数可能增加，因为新的贡献还需要被后面的乘积抵消。\n最终全部归零，说明这个恒等式对适用范围内所有输入成立。这是在验证一条已知路径，不是在浏览器训练或运行 AlphaTensor 搜索。","action":"单步一次，解释关系计数可以增加。然后播放或看验证终点，确认总数归零。","sources":["https://doi.org/10.1038/s41586-022-05172-4"]},
    {"text":"表里统一为 A、B、C 都是 4×4，并统一采用模 2 运算。直接算法需要 64 次乘法，Strassen 两层递归需要 49 次，AlphaTensor 的公开方案需要 47 次。\n这里比较乘法次数，同时保持输入尺寸与运算规则一致。47 次的结果不能直接套到任意普通实数矩阵。加法和访存没有包含在这列数字里，实际速度仍然需要测试。","action":"提醒听众检查表头与条件，避免只记住 47 这个数字。","sources":["https://doi.org/10.1038/s41586-022-05172-4"]},
    {"text":"AlphaEvolve 在 2025 年把大语言模型提出代码、自动评估与进化搜索结合起来。这里仍只看 4×4 矩阵：团队找到复数设定下 48 次标量乘法的方案，改进了该设定的 49 次基线。\nAlphaTensor 的 47 次方案属于模 2，AlphaEvolve 的 48 次属于复数。两种运算规则不同，不能仅凭 47 小于 48 就判断哪个成果更好。","action":"先指左边的复数条件，再对照右边的模 2 条件。","sources":["https://arxiv.org/abs/2506.13131","https://doi.org/10.1038/s41586-022-05172-4"]},
    {"text":"为什么研究者愿意用更多矩阵加法换取更少矩阵乘法？用 4×4 就能看到差别：矩阵相加逐格做，一共 16 次标量加法；直接矩阵相乘需要 64 次标量乘法和 48 次加法。一个块乘法内部包含整组行乘列，工作量比一次块相加更多。\n因此减少某些块乘法、用较多块加法做输入组合与结果复用，可能值得。可是经典 Strassen 在这个小尺寸上共需要 198 次加减法，若按等成本计数，反而多做了工作。\n现代硬件可能融合乘加，也会受数据搬运、并行利用率和数值误差影响。应分别说明数学上的运算计数和工程上的实测时间。","action":"把第 5 页的成本模型和这里的块计算逻辑联系起来。","sources":["https://math.mit.edu/~djk/18.310/Lecture-Notes/Matrix_Multiplication.html","https://docs.nvidia.com/deeplearning/performance/dl-performance-matrix-multiplication/"]},
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
  const math=globalThis.MatrixCompareMath;
  const sampleA=[1,0,1,1,0,1,1,0,1,1,0,1,0,0,1,1];
  const sampleB=[1,1,0,1,0,1,1,0,1,0,1,1,1,0,0,1];
  const sampleC=math.multiplyOrdinary(sampleA,sampleB);
  $('#basic-a').innerHTML=cells(sampleA);$('#basic-b').innerHTML=cells(sampleB);$('#basic-c').innerHTML=cells(Array(16).fill('?'));
  const basic=demo('basic',80,n=>{
    const out=n?Math.floor((n-1)/5):0,row=Math.floor(out/4),col=out%4,phase=n?(n-1)%5:0;
    $$('#basic-a .cell').forEach((e,i)=>{e.classList.toggle('a-lit',n>0&&Math.floor(i/4)===row);e.classList.toggle('active',n>0&&phase<4&&i===row*4+phase);});
    $$('#basic-b .cell').forEach((e,i)=>{e.classList.toggle('b-lit',n>0&&i%4===col);e.classList.toggle('active',n>0&&phase<4&&i===phase*4+col);});
    $$('#basic-c .cell').forEach((e,i)=>{e.textContent=n>=(i+1)*5?sampleC[i]:'?';e.classList.toggle('output-lit',n>0&&i===out);});
    const products=Array.from({length:4},(_,k)=>sampleA[row*4+k]*sampleB[k*4+col]);
    $('#basic-equation').textContent=n===0?'1 × 1 + 0 × 0 + 1 × 1 + 1 × 1 = 3':phase<4?`${sampleA[row*4+phase]} × ${sampleB[phase*4+col]} = ${products[phase]}`:`${products.join(' + ')} = ${sampleC[out]}`;
    $('#basic-caption').textContent=n===0?'先看第一行与第一列，得到 C 的左上角':phase===4?`4 个乘积用 3 次加法合并，填入 C[${row+1},${col+1}]${n===80?'，16 格全部完成':''}`:`第 ${row+1} 行与第 ${col+1} 列，计算第 ${phase+1} 对数字`;
    const completed=Math.floor(n/5);$('#basic-work-count').textContent=`${completed*4+Math.min(n%5,4)} / 64 次乘法，${completed*3} / 48 次加法`;
  },350);
  $('#basic-finish').addEventListener('click',()=>basic.finish());
  const realTerms=math.strassenTerms(true),realTrace=math.traceOrdinary(realTerms,sampleA,sampleB);
  const realReference=math.strassenRecursive4(sampleA,sampleB);
  $('#strassen-products').innerHTML=Array.from({length:7},(_,i)=>`<div class="strassen-group"><span>第 ${i+1} 组</span><strong>0 / 7</strong></div>`).join('');
  $('#strassen-output').innerHTML=cells(Array(16).fill(0));
  const strassenDemo=demo('strassen',49,n=>{
    $$('.strassen-group').forEach((e,i)=>{e.classList.toggle('current',n>i*7&&n<=(i+1)*7);e.querySelector('strong').textContent=`${Math.max(0,Math.min(7,n-i*7))} / 7`;});
    const step=n?realTrace[n-1]:null;
    $$('#strassen-output .cell').forEach((e,i)=>{e.textContent=step?step.accumulator[i]:0;e.classList.toggle('output-lit',n>0&&!!realTerms[n-1].w[i]);});
    $('#strassen-product-equation').textContent=step?`${step.left<0?'('+step.left+')':step.left} × ${step.right<0?'('+step.right+')':step.right} = ${step.product}`:'先组合输入，再做一次乘法';
    $('#strassen-answer').textContent=n===49?'结果与直接算法一致':`${n} / 49 次乘法`;
    $('#strassen-output-label').textContent=n===49?'最终答案 C · 4 × 4':'C 的过程累计 · 4 × 4';
    $('#strassen-caption').textContent=n===49?`同一组 4×4 输入得到相同 C。经典递归实际计数为 ${realReference.multiplications} 次乘法、${realReference.additions} 次加减法。`:n?`外层第 ${realTerms[n-1].outer+1} 组，内层第 ${realTerms[n-1].inner+1} 次乘法，乘积贡献可分配到多个输出。`:'高亮表示正在计算哪一组，每组包含 7 次标量乘法';
  },260);
  $('#strassen-finish').addEventListener('click',()=>strassenDemo.finish());
  function updateCost(){
    const m=Number($('#multiply-cost').value),direct=64*m+48,optimized=49*m+198,largest=Math.max(direct,optimized);
    $('#multiply-cost-label').textContent=m;$('#direct-cost-value').textContent=`${direct} 单位`;$('#strassen-cost-value').textContent=`${optimized} 单位`;
    $('#direct-cost-bar').style.width=`${100*direct/largest}%`;$('#strassen-cost-bar').style.width=`${100*optimized/largest}%`;
    $('#cost-model-caption').textContent=m<10?`新增的加法成本超过省下的乘法成本，Strassen 多用 ${optimized-direct} 单位。4×4 并不一定更快。`:m===10?'假设乘法成本为加法的 10 倍时，省下 15 次乘法恰好抵消新增 150 次加法。':`在这个假设下，省下的乘法更值钱：Strassen 少用 ${direct-optimized} 单位。这是成本示意，仍需真实测量。`;
  }
  $('#multiply-cost').addEventListener('input',updateCost);$$('[data-cost]').forEach(button=>button.addEventListener('click',()=>{$('#multiply-cost').value=button.dataset.cost;updateCost();}));updateCost();
  for(const id of ['gpu-serial','gpu-parallel'])$('#'+id).innerHTML=Array.from({length:16},(_,i)=>`<span>C${Math.floor(i/4)+1}${i%4+1}</span>`).join('');
  demo('gpu',16,n=>{
    $$('#gpu-serial>span').forEach((e,i)=>{e.classList.toggle('done',i<n);e.classList.toggle('current',n>0&&i===n-1);});
    $$('#gpu-parallel>span').forEach((e,i)=>{e.classList.toggle('done',i<Math.min(16,n*4));e.classList.toggle('current',n>0&&n<=4&&i>=(n-1)*4&&i<n*4);});
    $('#gpu-serial-label').textContent=`${n} / 16 轮`;$('#gpu-parallel-label').textContent=`${Math.min(n,4)} / 4 轮`;
    $('#gpu-caption').textContent=n>=4?'右边在第 4 轮完成，左边需要 16 轮完成':'并行计算需要足够多、能够分开的任务';
  },450);
  demo('memory',64,n=>{
    $('#memory-naive').textContent=n;$('#memory-reuse').textContent=Math.min(n,16);
    for(const [id,moving] of [['package-naive',n>0],['package-reuse',n>0&&n<=16]]){const e=$('#'+id);e.classList.remove('travel');if(moving){void e.offsetWidth;e.classList.add('travel');}}
  },300);
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
  const residualFrames=math.residualFrames(globalThis.ALPHATENSOR_47.terms);
  $('#talk-tensor').innerHTML=Array.from({length:16},(_,i)=>`<div><span>C${Math.floor(i/4)+1}${i%4+1}</span><strong>4</strong></div>`).join('');
  const tensorDemo=demo('tensor',47,n=>{
    const perOutput=residualFrames[n],remaining=perOutput.reduce((sum,x)=>sum+x,0);
    $$('#talk-tensor>div').forEach((e,i)=>{e.querySelector('strong').textContent=perOutput[i];e.classList.toggle('aligned',perOutput[i]===0);e.classList.toggle('contributed',n>0&&!!globalThis.ALPHATENSOR_47.terms[n-1].w[i]);});
    $('#tensor-count').textContent=`${n} / 47`;$('#tensor-remaining').textContent=remaining;
    $('#tensor-caption').textContent=remaining===0?'4096 个系数全部吻合，公开的 47 项分解通过完整恒等式验证。':'格内数字统计该输出尚未吻合的关系，可能先增后减，最终必须全部归零。';
  },180);
  $('#tensor-finish').addEventListener('click',()=>tensorDemo.finish());

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
