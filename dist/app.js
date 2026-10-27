"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const players = [];
const state = { a: [1, 2, 3, 4], b: [5, 6, 7, 8], matrix: 0, strassen: 0, gpu: 0, memory: 0, tensor: 0, workers: 4 };
const fmt = (n) => n < 0 ? `(${n})` : String(n);
const product = (a, b) => [a[0]*b[0]+a[1]*b[2], a[0]*b[1]+a[1]*b[3], a[2]*b[0]+a[3]*b[2], a[2]*b[1]+a[3]*b[3]];

// Exact rank-one factors for the seven-multiplication Strassen identity.
// Each multiplication is (u · A) (v · B), contributing w to the four outputs.
const factors = [
  { u:[1,0,0,1], v:[1,0,0,1], w:[1,0,0,1], label:"(a+d)(e+h)" },
  { u:[0,0,1,1], v:[1,0,0,0], w:[0,0,1,-1], label:"(c+d)e" },
  { u:[1,0,0,0], v:[0,1,0,-1], w:[0,1,0,1], label:"a(f−h)" },
  { u:[0,0,0,1], v:[-1,0,1,0], w:[1,0,1,0], label:"d(g−e)" },
  { u:[1,1,0,0], v:[0,0,0,1], w:[-1,1,0,0], label:"(a+b)h" },
  { u:[-1,0,1,0], v:[1,1,0,0], w:[0,0,0,1], label:"(c−a)(e+f)" },
  { u:[0,1,0,-1], v:[0,0,1,1], w:[1,0,0,0], label:"(b−d)(g+h)" }
];
const dot = (a,b) => a.reduce((sum,x,i) => sum+x*b[i], 0);
function strassenValues(a,b) { return factors.map(f => dot(f.u,a)*dot(f.v,b)); }
function reconstruct(values) { return Array.from({length:4}, (_,o) => values.reduce((sum,x,i) => sum+x*factors[i].w[o],0)); }
function targetTensor() {
  const t = Array(64).fill(0);
  for (let o=0;o<4;o++) for(let k=0;k<2;k++) t[o*16+(Math.floor(o/2)*2+k)*4+k*2+o%2] = 1;
  return t;
}
function residualTensor(steps) {
  const t=targetTensor();
  for(let s=0;s<steps;s++) for(let o=0;o<4;o++) for(let a=0;a<4;a++) for(let b=0;b<4;b++) t[o*16+a*4+b]-=factors[s].w[o]*factors[s].u[a]*factors[s].v[b];
  return t;
}

function makePlayer({button,next,reset,advance,resetState,isDone,label,interval=1000}) {
  let timer=null;
  const playButton=$(button);
  const setLabel=()=>{ playButton.textContent=timer ? "Ⅱ 暂停" : isDone() ? "↻ 再播放一次" : label; playButton.setAttribute("aria-pressed",String(!!timer)); };
  const stop=()=>{ if(timer!==null) clearInterval(timer); timer=null; setLabel(); };
  const step=()=>{ if(isDone()){stop();return;} advance(); if(isDone())stop(); else setLabel(); };
  const restart=()=>{stop();resetState();setLabel();};
  playButton.addEventListener("click",()=>{
    if(timer){stop();return;}
    if(isDone())resetState();
    step();
    if(!isDone()) timer=setInterval(step,interval);
    setLabel();
  });
  $(next).addEventListener("click",()=>{stop();if(isDone())resetState();step();});
  $(reset).addEventListener("click",restart);
  const player={stop,restart,refresh:setLabel};players.push(player);setLabel();return player;
}

function createMatrix() {
  for(const name of ["a","b"]){
    $("#matrix-"+name).innerHTML=state[name].map((x,i)=>`<input type="number" min="-9" max="9" step="1" value="${x}" aria-label="矩阵 ${name.toUpperCase()} 第 ${Math.floor(i/2)+1} 行第 ${i%2+1} 列" data-index="${i}">`).join("");
    $$("#matrix-"+name+" input").forEach(input=>input.addEventListener("input",()=>{
      const value=Number(input.value);
      state[name][Number(input.dataset.index)]=Number.isFinite(value)?Math.max(-9,Math.min(9,Math.round(value))):0;
      if(input.value!==""&&value!==state[name][Number(input.dataset.index)]) input.value=state[name][Number(input.dataset.index)];
      matrixPlayer.restart();strassenPlayer.restart();
    }));
  }
  $("#matrix-c").innerHTML=Array.from({length:4},(_,i)=>`<button aria-label="查看结果第 ${Math.floor(i/2)+1} 行第 ${i%2+1} 列的计算" data-output="${i}">?</button>`).join("");
  $$("#matrix-c button").forEach(button=>button.addEventListener("click",()=>{matrixPlayer.stop();state.matrix=Number(button.dataset.output)*3+1;renderMatrix();matrixPlayer.refresh();}));
}
function renderMatrix() {
  const t=state.matrix;
  const out=t===0?0:Math.floor((t-1)/3);
  const phase=t===0?0:(t-1)%3;
  const row=Math.floor(out/2),col=out%2;
  const a0=state.a[row*2],a1=state.a[row*2+1],b0=state.b[col],b1=state.b[2+col];
  $$("#matrix-a input").forEach((el,i)=>{
    el.classList.toggle("row-active",t>0&&Math.floor(i/2)===row);
    el.classList.toggle("term-active",t>0&&i===row*2+Math.min(phase,1));
  });
  $$("#matrix-b input").forEach((el,i)=>{
    el.classList.toggle("col-active",t>0&&i%2===col);
    el.classList.toggle("term-active",t>0&&i===Math.min(phase,1)*2+col);
  });
  const answers=product(state.a,state.b);
  $$("#matrix-c button").forEach((el,i)=>{
    const complete=t>=(i+1)*3;
    el.textContent=complete?answers[i]:"?";
    el.classList.toggle("complete",complete);
    el.classList.toggle("answer-active",t>0&&i===out);
  });
  $("#matrix-step-label").textContent=t===0?"准备好了":`步骤 ${t} / 12`;
  $("#matrix-equation").textContent=t===0?`${fmt(a0)} × ${fmt(b0)} + ${fmt(a1)} × ${fmt(b1)} = ${answers[0]}`:phase===0?`${fmt(a0)} × ${fmt(b0)} = ${a0*b0}`:phase===1?`${fmt(a1)} × ${fmt(b1)} = ${a1*b1}`:`${fmt(a0*b0)} + ${fmt(a1*b1)} = ${answers[out]}`;
  $("#matrix-explain").textContent=t===0?"点击“播放过程”，看一行和一列怎样变成一个答案。":phase===0?`取 A 的第 ${row+1} 行、B 的第 ${col+1} 列，先把第一对数字相乘。`:phase===1?"沿着同一行、同一列，继续把第二对数字相乘。":t===12?"把两个乘积相加，得到最后一个格子。4 个答案全部完成！":`把两个乘积相加，填入 C 的第 ${row+1} 行、第 ${col+1} 列。`;
  $("#matrix-count").textContent=t===12?"8 次乘法 + 4 次加法，得到 4 个答案。":"4 个答案，每个都用同样的方法";
}

$("#strassen-tiles").innerHTML=factors.map((f,i)=>`<div class="formula-tile" id="m-${i}"><span class="m-label">M${i+1}</span><div class="m-formula">${f.label}</div><b class="m-value">—</b></div>`).join("");
function renderStrassen(){
  const values=strassenValues(state.a,state.b);
  $("#strassen-map").textContent=`给数字起个短名字：左边 a=${state.a[0]}，b=${state.a[1]}，c=${state.a[2]}，d=${state.a[3]}；右边 e=${state.b[0]}，f=${state.b[1]}，g=${state.b[2]}，h=${state.b[3]}。M 表示一个可以重复使用的中间结果。`;
  factors.forEach((f,i)=>{
    const el=$("#m-"+i);el.classList.toggle("active",state.strassen===i+1);el.classList.toggle("done",state.strassen>i+1);
    el.querySelector(".m-value").textContent=i<state.strassen?values[i]:"—";
  });
  const result=reconstruct(values);
  $("#strassen-output").textContent=state.strassen===7?`[${result[0]}, ${result[1]}; ${result[2]}, ${result[3]}] ✓`:`已算出 ${state.strassen} / 7 个中间乘积`;
  const current=factors[Math.max(0,state.strassen-1)];
  $("#strassen-caption").textContent=state.strassen===0?"按下播放，看看 7 次乘法怎样拼出 4 个答案。":state.strassen===7?"把 M₁…M₇ 按固定公式加减，和直接计算的答案完全相同。展开下方可看组合方式。":`第 ${state.strassen} 次乘法：先分别加减得到 ${dot(current.u,state.a)} 和 ${dot(current.v,state.b)}，再相乘：${fmt(dot(current.u,state.a))} × ${fmt(dot(current.v,state.b))} = ${values[state.strassen-1]}。`;
}

for(const id of ["serial-tasks","parallel-tasks"]) $("#"+id).innerHTML=Array.from({length:16},(_,i)=>`<div class="task">${String(i+1).padStart(2,"0")}</div>`).join("");
function renderGPU(){
  const n=state.gpu,w=state.workers,rounds=Math.ceil(16/w);
  $$("#serial-tasks .task").forEach((el,i)=>{el.classList.toggle("done",i<n);el.classList.toggle("current",n>0&&i===n-1);});
  $$("#parallel-tasks .task").forEach((el,i)=>{el.classList.toggle("done",i<Math.min(16,n*w));el.classList.toggle("current",n>0&&n<=rounds&&i>=(n-1)*w&&i<n*w);});
  $("#serial-round").textContent=`${n} / 16 轮`;
  $("#parallel-round").textContent=`${Math.min(n,rounds)} / ${rounds} 轮`;
  $("#parallel-description").textContent=`每一轮最多完成 ${w} 个任务`;
  $("#gpu-summary").textContent=n===0?"观察右边怎样更早完成。":n>=rounds?`并行方案 ${rounds} 轮完成；逐个处理${n===16?"也已完成，用了 16 轮。":`还完成了 ${n} / 16 个任务。`}`:`第 ${n} 轮：左边完成 ${n} 个，右边完成 ${n*w} 个。`;
}
function animatePackage(id){const e=$(id);e.classList.remove("moving");void e.offsetWidth;e.classList.add("moving");}
function renderMemory(animate=false){
  const n=state.memory;$("#naive-trips").textContent=n;$("#reuse-trips").textContent=Math.min(n,8);
  if(animate){animatePackage("#naive-package");if(n<=8)animatePackage("#reuse-package");}
  $("#memory-summary").textContent=n===0?"计算工作量相同，比较去仓库的次数。":n===32?"同样用数据 32 次：左边拿 32 趟，右边只拿 8 趟。":n>=8?"右边已把 8 份数据放在手边，可以重复使用；左边还在来回取数据。":`正在把数据拿到计算位置。右边每份数据只需要取一次。`;
}

$("#tensor-boards").innerHTML=Array.from({length:4},(_,o)=>`<div class="tensor-board"><div class="tensor-board-title">输出 C${Math.floor(o/2)+1}${o%2+1}</div><div class="tensor-grid">${Array.from({length:16},(_,i)=>`<div class="tensor-cell" data-coefficient="${o*16+i}" title="输出 C${Math.floor(o/2)+1}${o%2+1}，${["a","b","c","d"][Math.floor(i/4)]} × ${["e","f","g","h"][i%4]} 的剩余系数">0</div>`).join("")}</div></div>`).join("");
let lastResidual=targetTensor();
function renderTensor(){
  const residual=residualTensor(state.tensor),remaining=residual.filter(x=>x!==0).length;
  $$(".tensor-cell").forEach((el,i)=>{
    el.textContent=residual[i];el.classList.toggle("positive",residual[i]>0);el.classList.toggle("negative",residual[i]<0);
    el.classList.remove("changed");if(lastResidual[i]!==residual[i]){void el.offsetWidth;el.classList.add("changed");}
  });
  $$(".tensor-board").forEach(el=>el.classList.toggle("complete",remaining===0));
  $("#tensor-step").textContent=state.tensor;$("#tensor-residual").textContent=remaining;
  $("#tensor-caption").textContent=state.tensor===0?"一开始有 8 个直接乘积关系。点击下一步，试着用组合乘积完成它们。":state.tensor===7?"全部归零！7 个中间乘积的贡献，恰好重建了完整矩阵乘法。对任意输入，这个恒等式都成立。":`使用 M${state.tensor} = ${factors[state.tensor-1].label}，将贡献分配到对应输出。剩下 ${remaining} 个关系未吻合；中途可以增加，最终必须全部归零。`;
  lastResidual=residual;
}

const matrixPlayer=makePlayer({button:"#matrix-play",next:"#matrix-next",reset:"#matrix-reset",advance:()=>{state.matrix++;renderMatrix();},resetState:()=>{state.matrix=0;renderMatrix();},isDone:()=>state.matrix>=12,label:"▶ 播放过程",interval:1100});
const strassenPlayer=makePlayer({button:"#strassen-play",next:"#strassen-next",reset:"#strassen-reset",advance:()=>{state.strassen++;renderStrassen();},resetState:()=>{state.strassen=0;renderStrassen();},isDone:()=>state.strassen>=7,label:"▶ 看 7 步过程",interval:1050});
const gpuPlayer=makePlayer({button:"#gpu-play",next:"#gpu-next",reset:"#gpu-reset",advance:()=>{state.gpu++;renderGPU();},resetState:()=>{state.gpu=0;renderGPU();},isDone:()=>state.gpu>=16,label:"▶ 一起开始",interval:400});
const memoryPlayer=makePlayer({button:"#memory-play",next:"#memory-next",reset:"#memory-reset",advance:()=>{state.memory++;renderMemory(true);},resetState:()=>{state.memory=0;renderMemory();$$(".transport-track i").forEach(e=>e.classList.remove("moving"));},isDone:()=>state.memory>=32,label:"▶ 看搬运过程",interval:300});
const tensorPlayer=makePlayer({button:"#tensor-play",next:"#tensor-next",reset:"#tensor-reset",advance:()=>{state.tensor++;renderTensor();},resetState:()=>{state.tensor=0;renderTensor();},isDone:()=>state.tensor>=7,label:"▶ 播放搜索思路",interval:1400});

createMatrix();renderMatrix();renderStrassen();renderGPU();renderMemory();renderTensor();
$("#matrix-random").addEventListener("click",()=>{
  state.a=Array.from({length:4},()=>Math.floor(Math.random()*6));state.b=Array.from({length:4},()=>Math.floor(Math.random()*6));
  createMatrix();matrixPlayer.restart();strassenPlayer.restart();
});
$("#gpu-workers").addEventListener("change",event=>{state.workers=Number(event.target.value);gpuPlayer.restart();});
$$('[data-domain]').forEach(button=>button.addEventListener("click",()=>{
  const binary=button.dataset.domain==="binary";
  $$('[data-domain]').forEach(b=>{const selected=b===button;b.classList.toggle("selected",selected);b.setAttribute("aria-pressed",String(selected));});
  $("#arithmetic-answer").textContent=binary?"0":"2";
  $("#arithmetic-description").textContent=binary?"模 2：只保留除以 2 的余数，2 的余数为 0。":"就是我们熟悉的加法：1 + 1 = 2。";
}));

const questions=[
  {question:"矩阵相乘时，一个输出格子怎么得到？",options:["左矩阵的一行，与右矩阵的一列，对应相乘再相加。","把两个矩阵同一位置的数字直接相乘。"],answer:0,correct:"对！行乘列得到一个格子。第二种叫逐元素相乘，是另一种操作。",wrong:"再看第一节的高亮：取一行与一列，对应相乘，再相加。"},
  {question:"一个算法乘法次数更少，就一定运行更快吗？",options:["一定，乘法次数决定所有运行时间。","还要看加法、数据搬运和硬件如何执行。"],answer:1,correct:"对！需要结合硬件和实际输入测量运行时间。",wrong:"少做乘法很有价值，但额外加法、搬数据和硬件利用率也会影响速度。"},
  {question:"AlphaTensor 的 47 次乘法结果，可以直接套到任意实数 4 × 4 矩阵吗？",options:["可以，47 次适用于任何运算规则。","这个 47 次结果有模 2 运算的条件。"],answer:1,correct:"对！47 次对应模 2；普通实数与复数运算需要看各自的算法和条件。",wrong:"注意运算规则：模 2 中 1 + 1 = 0，与普通实数不同，算法不能直接照搬。"}
];
const quizAnswers=Array(questions.length).fill(null);
$("#quiz-list").innerHTML=questions.map((q,i)=>`<article class="quiz-card"><h3><span>0${i+1}</span>${q.question}</h3><div class="quiz-options">${q.options.map((option,j)=>`<button data-question="${i}" data-answer="${j}" aria-pressed="false">${option}</button>`).join("")}</div><p class="quiz-feedback" id="feedback-${i}" aria-live="polite"></p></article>`).join("");
$$(".quiz-options button").forEach(button=>button.addEventListener("click",()=>{
  const i=Number(button.dataset.question),answer=Number(button.dataset.answer),q=questions[i];quizAnswers[i]=answer;
  $$(`[data-question="${i}"]`).forEach(b=>{const selected=b===button;b.classList.toggle("correct",selected&&answer===q.answer);b.classList.toggle("wrong",selected&&answer!==q.answer);b.setAttribute("aria-pressed",String(selected));});
  $("#feedback-"+i).textContent=(answer===q.answer?"✓ ":"↳ ")+(answer===q.answer?q.correct:q.wrong);
  const count=questions.filter((q,j)=>quizAnswers[j]===q.answer).length;$("#quiz-score").textContent=`${count} / 3 已理解`;$("#finish-note").hidden=count!==3;
}));

const navLinks=$$(".sidebar nav a");
const observedSections=$$("main section[id]").filter(section=>navLinks.some(link=>link.hash==="#"+section.id));
let scrollPending=false;
function updateReading(){
  const max=document.documentElement.scrollHeight-window.innerHeight;
  $("#reading-progress").style.width=`${max>0?Math.min(100,100*window.scrollY/max):0}%`;
  let active=observedSections[0]?.id;
  for(const section of observedSections)if(section.getBoundingClientRect().top<window.innerHeight*.4)active=section.id;
  navLinks.forEach(link=>{const current=link.hash==="#"+active;link.classList.toggle("active",current);if(current)link.setAttribute("aria-current","location");else link.removeAttribute("aria-current");});
  scrollPending=false;
}
window.addEventListener("scroll",()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateReading);}},{passive:true});
window.addEventListener("resize",updateReading);
document.addEventListener("visibilitychange",()=>{if(document.hidden)players.forEach(p=>p.stop());});
updateReading();

// Pure math exports support independent verification without a browser.
if(typeof globalThis!=="undefined")globalThis.matrixLessonMath={product,strassenValues,reconstruct,residualTensor,factors};
