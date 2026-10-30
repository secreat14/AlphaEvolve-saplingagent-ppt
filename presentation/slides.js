"use strict";
(() => {
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const slides=$$('.slide');
  const paper='https://doi.org/10.1038/s41586-022-05172-4';
  const strassenPaper='https://link.springer.com/article/10.1007/BF02165411';
  const nvidia='https://docs.nvidia.com/deeplearning/performance/dl-performance-matrix-multiplication/';
  const flash='https://arxiv.org/abs/2205.14135';
  const evolve='https://arxiv.org/abs/2506.13131';
  const evolveBlog='https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/';
  const notes=[
  {
    "text": "今天以 AI 算法发现为主线。先用硬件建立加法与乘法的成本直觉，再用同一组 4×4 输入比较直接法、Strassen 与 AlphaTensor。重点是 47 次模 2 方案怎样递归服务更大的矩阵，以及为什么乘法次数优势仍不能直接等同于运行时间优势。",
    "action": "约15秒介绍主题后翻页。",
    "sources": [
      "https://doi.org/10.1038/s41586-022-05172-4"
    ]
  },
  {
    "text": "只解释晶体管这个电控开关。图中保留栅极、绝缘层、源漏和硅衬底。输入低电平时，nMOS 导电通道未形成；输入提高到足够高的电平时，栅极电场让下方形成通道。栅极与硅之间有绝缘层，不能把栅极画成直接往通道灌电的导线。\n这是平面 nMOS 的简化剖面。发光表示电平或信号变化，不是电子轨迹，也不是工艺版图。后面仍用这种物理剖面小图，加上实际的连接线路来解释存储与加法。",
    "action": "点切换开关，观察通道从断开到导通。只需记住：电压可以控制一个微型开关。",
    "sources": [
      "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c3/c3s1/"
    ]
  },
  {
    "text": "2组晶体管互相连接，作为一个整体，用于固定一个状态。\n下面只展示存储1和存储0两个稳定状态。存储1时，A侧是高电平1，B侧是低电平0；存储0时，A侧是0，B侧是1。两侧不是两个独立的存储位，而是互相连接，共同形成一个保存一位数据的整体。\n图中保留晶体管剖面和连接线路，亮色表示高电平。不要把单个晶体管当作完整存储单元。状态保持需要供电。",
    "action": "先展示存储1，再点击存储0，对照两边电平的变化。用一个整体、两个稳定状态来讲清楚。",
    "sources": [
      "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c3/c3s1/",
      "https://computationstructures.org/notes/sequential_logic/notes.html"
    ]
  },
  {
    "text": "先区分两个职责：寄存器用存储电路保存操作数，运算单元里的加法电路执行运算。动画中A和B各保存四位，默认都为0011，也就是十进制3。存储单元仍画为多组晶体管，连接线把它们的输出送到下面的加法单元。\n先把两个数送入电路，再从最低位往高位解释：1+1+0=2，当前位写0，向左进1；下一位1+1+1=3，写1进1；再下一位0+0+1=1，写1不进位；最高位写0。四位结果为0110，也就是6。动画最后会亮起保存结果的存储组。读出操作数不会把原寄存器清空。\n可切换7+1，观察连续进位得到1000，也就是8。逐位顺序只用于解释进位，不是现代处理器实际必须执行这些独立指令。图中加法单元用晶体管小图加功能框表示，省略全部器件接法；框外显示数据与进位的真实功能连接，实际器件数量和版图取决于实现。位宽四位与矩阵4×4的尺寸是不同概念。",
    "action": "播放一次3+3，重点指出右侧最低位的0与向左的进位；再按需要切换7+1。",
    "sources": [
      "https://notes.cs61c.org/content/sds-blocks/adder-subtractor/",
      "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c8/c8s1/",
      "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c3/c3s1/"
    ]
  },
  {
    "text": "这页用2+2=4和2×2=4，让听众先看见输入相同、最终数值结果也相同，再对比通用电路的内部结构。输入2按四位写为0010。寄存器负责存数，运算单元负责计算。\n通用四位加法电路求和与进位，结果完整保留进位时最多五位；本题结果显示00100，即4。通用四位乘法电路可展开为四行部分积：00000000、00000100、00000000、00000000，移位对齐合并后显示00000100，同样是4。最多五位与最多八位描述通用电路的结果宽度，不表示数值4本身需要五位或八位。\n教学重点是：相同的数值答案，不要求相同的计算结构。在同位宽和相近设计目标下，通用整数加法通常使用更少电路资源，因而值得研究用一些加法换取更少乘法。部分积属于内部数据，不一定占用多个程序寄存器。\n这个例子展示通用电路结构，不能证明固定算式2×2实际耗时更长。编译器可能直接把常量算式求值为4，或者把乘2转成移位。现代GPU的浮点乘加还有专用硬件，真实速度需要结合实现测量。",
    "action": "先指出两边都得到4，再播放数据路径。总结：结果相同，通用电路结构与资源开销仍可能不同。",
    "sources": [
      "https://homepage.cs.uiowa.edu/~dwjones/assem/summer18/notes/09muldiv.shtml",
      "https://courses.csail.mit.edu/6.896/spring04/handouts/arithmetic-ckts.pdf",
      "https://docs.nvidia.com/cuda/archive/12.8.0/cuda-c-programming-guide/index.html#arithmetic-instructions"
    ]
  },
  {
    "text": "全场矩阵案例统一从 4×4 开始。这里 A 和 B 都只含 0 和 1，但这一页先按普通算术相乘，不取模。第一行与第一列计算为 1×1+0×0+1×1+1×1=3。四个乘积只需要三次加法合并。\n输出有 16 格，每格 4 次乘法、3 次加法，所以总计 64 次乘法和 48 次加法。后面的三算法动画会在模 2 条件下比较 64、49、47 次乘法，并最终得到相同结果。",
    "action": "只示范左上格的四乘三加，再点看完整结果，快速建立64次基线。",
    "sources": [
      "https://docs.nvidia.com/deeplearning/performance/dl-performance-matrix-multiplication/"
    ]
  },
  {
    "text": "本页的七个公式与笔记本的 S2 模 2 因子逐项对应。取笔记本 4×4 输入 A、B 各自左上角的四个数，组成独立的小题：A 的 a=1、b=0、c=0、d=1；B 的 e=1、f=1、g=0、h=1。这个小题的 C 不是完整 4×4 结果的左上块，因为完整结果还包含其他块的贡献。\n所有结果按模 2 解释，所以 1+1 最终得 0。直接计算四个输出共要八次标量乘法；Strassen 把输入先组合，形成 M1 到 M7 七个乘积。本例的值依次是 0、1、0、1、1、0、1。左上角为 M1+M4+M5+M7，得到 0+1+1+1 模 2 等于 1。其余三格得到 1、0、1，与直接计算一致。\n推广到 4×4 时先分成 2×2 的块，再对外层七个组合各用内层七次标量乘法。下一页动画按外层优先、内层随后这一顺序走完 49 拍，与笔记本 TERMS_49 的 49 项顺序和值一致。这里的独立 2×2 数值例子只是解释七项规则，不是动画中的某一拍。Strassen 在普通算术中也成立，但那时公式里的部分加号须用减号，不能照搬这页的全部加号。",
    "action": "先指 A、B 的数字，再读七个 M 的结果，最后只详细算 C11，并指出 7×7=49。",
    "sources": [
      "https://link.springer.com/article/10.1007/BF02165411"
    ]
  },
  {
    "text": "Strassen 是人设计的经典基线；AlphaTensor 尝试用强化学习帮助搜索新的矩阵乘法算法，论文发表于 2022 年 Nature。\n寻找算法时，需要决定怎样线性组合输入、让组合后的数相乘，以及把中间乘积加到哪些输出。最终必须与矩阵乘法完全一致，同时希望乘法更少。可以把它理解成：神经网络判断哪些动作更有希望，树搜索往前探索，再用反馈不断改进选择。发现出来的是适用范围内通用的计算规则。",
    "action": "按从左到右的顺序解释三步，不需要介绍寄存器或神经网络结构。",
    "sources": [
      "https://doi.org/10.1038/s41586-022-05172-4"
    ]
  },
  {
    "text": "先读与逐拍动画一致的通用公式：Lr 和 Rr 分别把 A、B 中被 0/1 系数选中的数相加并对 2 取余；pr=Lr×Rr；每个输出 co 每收到一项贡献就更新当前累计值并对 2 取余。幻灯片的 i、j、o 从 1 编到 16，与笔记本的 0 到 15 是同一组按行展开的矩阵位置。\n用公开分解的第 2 项实算：A13=A22=A23=1，所以 L2=(1+1+1) mod 2=1；B21=0、B24=0、B34=1，所以 R2=(0+0+1) mod 2=1。p2=1×1=1，按该项的输出权重加到 C14 和 C21，再分别对 2 取余。动画第 2 拍显示 1×1=1。\n全部 47 项完成后，C 的四行分别是 1111、1101、0010、0010，与直接矩阵乘法取模 2 一致。笔记本还检查了 16×16×16=4096 个系数关系，证明这组公开因子对任意二进制 4×4 输入都满足模 2 矩阵乘法。47 次只数标量乘法；输入组合和输出合并的加法仍有成本。这组特定因子不能直接用于普通整数矩阵乘法。",
    "action": "先读通用公式，再计算第 2 项的 L2=1、R2=1、p2=1。下一页单步到 AI 第 2 拍，对照动画的 1×1=1 和两个输出位置。",
    "sources": [
      "https://doi.org/10.1038/s41586-022-05172-4",
      "https://github.com/google-deepmind/alphatensor/tree/1949163da3bef7e3eb268a3ac015fd1c2dbfc767/algorithms"
    ]
  },
  {
    "text": "这是同一道 4×4 题目，三列都使用相同的输入 A 和 B。紫色与绿色标出本步从 A 和 B 选取的数字，橙色标出本步贡献到哪些输出。每拍展示一次标量乘法。\n直接算法按行乘列，逐项累加。Strassen 对输入进行分块组合，用两层递归完成 49 次乘法。AI 列使用作者公开的 47 项模 2 分解。与笔记本一致，AI 输入组合先对 2 取余，再相乘；输出矩阵每拍累计后也对 2 取余。第 2 拍可看到 1×1=1，并高亮 C14、C21。\n动画到 47 步时 AI 路径结束，到 49 步时 Strassen 结束，到 64 步时直接算法结束。最后三种结果必须一致。加法、搬运与硬件开销没有按时间计入，所以不能把动画的结束先后当成实测运行速度。",
    "action": "先单步两三次，解释输入高亮与输出贡献，再快速播放到终点。建议留约两分半。",
    "sources": [
      "https://doi.org/10.1038/s41586-022-05172-4",
      "https://github.com/google-deepmind/alphatensor/tree/1949163da3bef7e3eb268a3ac015fd1c2dbfc767/algorithms"
    ]
  },
  {
    "text": "横轴是方阵大小 N，只取 N=4^k，便于把 4×4 算法递归应用 k 层。每层直接法把乘法数乘 64，Strassen 乘 49，AlphaTensor 的模 2 方案乘 47，所以总数分别为 64^k、49^k、47^k。纵轴把直接法设为 100%，观察另外两条线随矩阵变大而下降。\n例如 N=1024=4^5：直接法需要 1,073,741,824 次标量乘法，AlphaTensor 需要 229,345,007 次，约为直接法的 21.36%，少 78.64%。论文将递归复杂度写为约 O(N^2.778)，优于 Strassen 的约 O(N^2.807) 与直接法 O(N^3)。\n这是模 2 条件下的理论乘法计数。其他尺寸可通过分块或填充处理，但额外的模 2 加法、访存、常数项和硬件实现仍决定实际耗时。",
    "action": "沿横轴从 4 指到 1024，先比较三条线，再用 N=1024 的数字说明理论乘法优势如何累积；最后强调模 2 与非实测边界。",
    "sources": [
      "https://doi.org/10.1038/s41586-022-05172-4",
      "https://github.com/google-deepmind/alphatensor"
    ]
  },
  {
    "text": "这里用统一的直接展开方式计数，所有三种算法都逐项计算输入线性组合，再合并输出，不共享额外的加法中间表达式。所有输出最终对 2 取余。直接算法64次乘法、0次输入加法、48次输出加法；Strassen展平49乘、190次输入加法、128次输出加法，总318；AlphaTensor47乘、202次输入加法、138次输出加法，总340。\n计数规则是k个输入项相加需要k-1次模 2 加法，一个输出的k个贡献合并需要k-1次模 2 加法。首次赋值不算加法，零系数不执行操作。次数不随矩阵中0/1取值变化而消除操作。这些是当前统一展开实现的计数，不是论文宣称的最优加法数。经典递归Strassen可共享中间结果，得到198次加减法，那是另一个实现口径。\n所以AI比展平Strassen少2次乘法，但多22次模 2 加法；乘法成本m、模 2 加法成本1时，需要m>11才在这个模型中更划算。相比直接算法，AI省17乘、多292次模 2 加法，需要m>292/17约17.18。成本20时三者为1328、1298、1280；成本1时为112、367、387。教学模型不等于GPU实测时间，实际要考虑共享优化、精度、访存与专用指令。",
    "action": "先解释乘法变少而模 2 加法增加，再点成本1、20、50，让听众观察不同假设会改变结论。",
    "sources": [
      "https://github.com/google-deepmind/alphatensor",
      "https://doi.org/10.1038/s41586-022-05172-4",
      "https://docs.nvidia.com/deeplearning/performance/dl-performance-matrix-multiplication/"
    ]
  },
  {
    "text": "AlphaEvolve 在 2025 年把大语言模型提出代码、自动评估与进化搜索结合起来。这里仍只看 4×4 矩阵：团队找到复数设定下 48 次标量乘法的方案，改进了该设定的 49 次基线。\nAlphaTensor 的 47 次方案属于模 2，AlphaEvolve 的 48 次属于复数。两种运算规则不同，不能仅凭 47 小于 48 就判断哪个成果更好。\n本页再计算两项：复数条件下49到48，省1次，即1/49约2.04%；相对直接64次是少16次，16/64=25%。这里的标量是复数乘法，不是实数乘法指令，不能把不同数域的47和48直接排序。",
    "action": "先指左边的复数条件，再对照右边的模 2 条件。",
    "sources": [
      "https://arxiv.org/abs/2506.13131",
      "https://doi.org/10.1038/s41586-022-05172-4"
    ]
  },
  {
    "text": "前一页的曲线统计递归后的标量乘法次数，本页成本滑块统计单层 4×4 方案的假设算术单位；它们都不是硬件实测加速比。实际要计入额外的模 2 加法、寄存器与中间结果、访存、融合乘加、矩阵形状、精度和实现。大矩阵让理论乘法优势累积，但是否更快仍需在目标硬件和目标数据类型上测量。",
    "action": "把大矩阵的理论曲线与本页的实现边界联系起来，避免把乘法数直接说成加速比。",
    "sources": [
      "https://math.mit.edu/~djk/18.310/Lecture-Notes/Matrix_Multiplication.html",
      "https://docs.nvidia.com/deeplearning/performance/dl-performance-matrix-multiplication/"
    ]
  },
  {
    "text": "回到开场问题：同一道计算题，即使答案固定，计算路径仍然可能改进。Strassen 和 AlphaTensor 展示了重新组合步骤来减少乘法；递归让一个小矩阵算法服务更大的矩阵；成本模型提醒我们仍要测量实际实现。\n今天最重要的结论是，AI 已经可以参与基础算法的发现与优化，而评价一种方法还需要明确数域、规模、运算计数与真实硬件表现。可以在这一页接受提问。",
    "action": "总结后停顿，邀请听众讨论怎样定义计算方法更好。",
    "sources": [
      "https://doi.org/10.1038/s41586-022-05172-4",
      "https://deepmind.google/blog/discovering-novel-algorithms-with-alphatensor/"
    ]
  },
  {
    "text": "这些是本次演讲的主要来源，均为原论文或官方资料。可点击标题打开原文。AlphaTensor 47 次方案使用作者开源仓库的数据，来源提交版本及 Apache 2.0 许可已嵌入 HTML。\n如果听众希望继续阅读，先看 AlphaTensor 团队的图文介绍，再读原论文和 NVIDIA 矩阵乘法指南。",
    "action": "参考资料页可以留在屏幕上，便于问答时查阅。",
    "sources": [
      "https://doi.org/10.1038/s41586-022-05172-4",
      "https://link.springer.com/article/10.1007/BF02165411",
      "https://docs.nvidia.com/deeplearning/performance/dl-performance-matrix-multiplication/",
      "https://docs.nvidia.com/deeplearning/performance/dl-performance-gpu-background/index.html",
      "https://arxiv.org/abs/2205.14135",
      "https://arxiv.org/abs/2506.13131",
      "https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/",
      "https://homepage.cs.uiowa.edu/~dwjones/assem/summer18/notes/09muldiv.shtml",
      "https://docs.nvidia.com/cuda/archive/13.0.1/cuda-c-best-practices-guide/index.html#registers",
      "https://docs.nvidia.com/cuda/archive/12.8.0/cuda-c-programming-guide/index.html#arithmetic-instructions",
      "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c3/c3s1/",
      "https://computationstructures.org/notes/sequential_logic/notes.html",
      "https://research.nvidia.com/sites/default/files/pubs/2011-06_Energy-efficient-Mechanisms-for/2011_06_NVIDIA_ISCA.pdf",
      "https://notes.cs61c.org/content/sds-blocks/adder-subtractor/"
    ]
  }
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
  globalThis.RegisterVisuals.mount({demo});
  const math=globalThis.MatrixCompareMath;
  const sampleA=[1,0,1,1,0,1,1,0,1,1,0,1,0,0,1,1];
  const sampleB=[1,1,0,1,0,1,1,0,1,0,1,1,1,0,0,1];
  const sampleC=math.multiplyOrdinary(sampleA,sampleB);
  const hardware=globalThis.HardwareLesson;
  const costOperand=2,partials=hardware.multiplicationPartials(costOperand,costOperand,4);
  const additionResult=hardware.additionTrace(costOperand,costOperand,4).at(-1).result;
  const multiplicationResult=partials.reduce((sum,value)=>sum+value,0);
  const resultBits=(value,width,ready)=>Array.from({length:width},(_,i)=>`<span class="${ready?'result-ready':''}">${ready?(value>>(width-1-i))&1:'?'}</span>`).join('');
  demo('binary',5,n=>{
    const additionReady=n>=2,multiplicationReady=n===5;
    $('#cost-adder-unit').classList.toggle('unit-working',n===1);$('#cost-adder-unit').classList.toggle('unit-complete',additionReady);
    $('#cost-add-bits').innerHTML=resultBits(additionResult,5,additionReady);$('#cost-multiply-bits').innerHTML=resultBits(multiplicationResult,8,multiplicationReady);
    $('#cost-add-answer').textContent=additionReady?`= ${additionResult}`:'等待结果';$('#cost-multiply-answer').textContent=multiplicationReady?`= ${multiplicationResult}`:'等待结果';
    $('#partial-table').innerHTML=partials.map((value,i)=>`<div class="partial-row ${i<n?'partial-visible':''} ${i===n-1?'partial-current':''}"><span>部分积 ${i+1} · 移 ${i} 位</span><b>${value.toString(2).padStart(8,'0')}</b></div>`).join('');
    $('#cost-merge-unit').classList.toggle('merge-active',multiplicationReady);
    $('#binary-cost-caption').textContent=n===0?'相同输入、相同结果，观察通用电路内部的不同结构':n===1?'加法电路求和与进位；乘法开始生成内部部分积':n<5?'乘法还要处理更多部分积与对齐线路；这是结构讲解，不是计时':'两边都得到 4；通用乘法电路包含部分积与合并网络，因此值得研究以加法换乘法。';
  },1400);
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
  const methods=[{id:'direct',name:'直接行乘列',total:64,terms:math.directTerms()},{id:'strassen',name:'Strassen 两层分块',total:49,terms:math.strassenTerms()},{id:'alpha',name:'AlphaTensor 优化',total:47,terms:globalThis.ALPHATENSOR_47.terms}];
  let a4=[1,0,1,1,0,1,1,0,1,1,0,1,0,0,1,1],b4=[1,1,0,1,0,1,1,0,1,0,1,1,1,0,0,1],mode='all';
  const traces={};
  const smallMatrix=values=>values.map(v=>`<span>${v}</span>`).join('');
  $('#talk-comparison').innerHTML=methods.map(m=>`<div class="comparison-method ${m.id}" id="talk-method-${m.id}"><h3>${m.name}</h3><div class="method-counter"><b id="talk-count-${m.id}">0</b><span>/ ${m.total} 次</span></div><div class="method-progress"><i id="talk-progress-${m.id}"></i></div><div class="method-inputs"><div><span>输入 A</span><div class="small-matrix" id="talk-a-${m.id}">${smallMatrix(a4)}</div></div><b>×</b><div><span>输入 B</span><div class="small-matrix" id="talk-b-${m.id}">${smallMatrix(b4)}</div></div></div><div class="method-equation" id="talk-equation-${m.id}">? × ? = ?</div><p class="method-caption" id="talk-caption-${m.id}">准备第一步</p><div class="method-output"><div><span id="talk-output-label-${m.id}">输出累计 C</span><div class="small-matrix" id="talk-c-${m.id}">${smallMatrix(Array(16).fill(0))}</div></div><p id="talk-output-note-${m.id}">当前为中间状态，仍需继续累加。</p></div></div>`).join('');
   const rebuild=()=>{methods.forEach(m=>{traces[m.id]=math.trace(m.terms,a4,b4);});};rebuild();
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
       $('#talk-caption-'+m.id).textContent=!term?'先按输入组合，再做一次标量乘法':m.id==='direct'?`第 ${term.row+1} 行与第 ${term.col+1} 列，第 ${term.k+1} 对数字`:m.id==='strassen'?`外层第 ${term.outer+1} 个组合，内层第 ${term.inner+1} 次乘法`:`A 取 ${term.u.filter(Boolean).length} 格、B 取 ${term.v.filter(Boolean).length} 格，输入组合先对 2 取余`;
       $('#talk-output-label-'+m.id).textContent=complete?'最终答案 C':m.id==='alpha'?'输出累计 C（模 2）':'输出累计 C';
      const correct=complete&&step.accumulator.every((x,i)=>x===target[i]);
      $('#talk-output-note-'+m.id).textContent=correct?'已完成，结果与直接算法一致':term?`本步把 ${step.product} 加到 ${term.w.filter(Boolean).length} 个输出格子`:'当前为中间状态，仍需继续累加。';
    }
    $('#comparison-status').textContent=mode!=='all'?`${methods.find(m=>m.id===mode).name}单独演示，统一采用模 2 规则。`:finished===3?'三种最终结果完全相同，乘法次数分别是 64、49、47。':finished?`${finished===1?'AlphaTensor 已完成':'AlphaTensor 与 Strassen 已完成'}，其余路径继续计算。`:'统一采用模 2 运算。每列内部使用相同的 A 与 B。';
  },400);
  $('#compare-mode').addEventListener('change',e=>{comparison.stop();mode=e.target.value;comparison.max=mode==='all'?64:methods.find(m=>m.id===mode).total;comparison.reset();});
  $('#compare-tempo').addEventListener('change',e=>{const playing=!!comparison.timer;comparison.stop();comparison.interval=Number(e.target.value);if(playing)comparison.play();});
  $('#compare-finish').addEventListener('click',()=>comparison.finish());
  $('#compare-random').addEventListener('click',()=>{a4=Array.from({length:16},()=>Math.round(Math.random()));b4=Array.from({length:16},()=>Math.round(Math.random()));rebuild();comparison.reset();});
  globalThis.AiFocusVisuals.mount({methods});

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
    $('#notes-content').innerHTML=`<div class="notes-time">第 ${current+1} 页，建议 ${duration(Number(slides[current].dataset.seconds))}，全场 ${duration(slides.reduce((sum,slide)=>sum+Number(slide.dataset.seconds),0))}</div><div class="notes-body"></div><div class="notes-action"></div><div class="notes-sources">参考来源${note.sources.map((url,i)=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${i+1}. ${url}</a>`).join('')}</div>`;
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
