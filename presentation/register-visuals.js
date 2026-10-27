"use strict";
(() => {
  const $=selector=>document.querySelector(selector),$$=selector=>[...document.querySelectorAll(selector)];
  const text=(x,y,value,kind='')=>`<text x="${x}" y="${y}" class="${kind}">${value}</text>`;
  const path=(d,high=false,pulse=false)=>`<path d="${d}" class="circuit-wire ${high?'signal-high':''} ${pulse?'signal-pulse':''}"/>`;
  const svg=body=>`<svg viewBox="0 0 920 360" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
  function transistor(on){
    return svg(`<rect x="120" y="150" width="690" height="165" rx="12" class="silicon-substrate"/><rect x="180" y="150" width="130" height="65" rx="4" class="doped-region"/><rect x="620" y="150" width="130" height="65" rx="4" class="doped-region"/><rect x="310" y="125" width="310" height="20" class="gate-oxide"/><rect x="310" y="78" width="310" height="45" rx="3" class="metal-gate ${on?'gate-on':''}"/>${path('M245 150 V40 H180')}${path('M685 150 V40 H750')}${path('M465 78 V70 M465 32 V25',on)}${text(100,40,'源极 S')}${text(750,40,'漏极 D')}${text(465,62,`栅极 G = ${on?1:0}`,'svg-center signal-label')}${text(245,190,'n⁺','svg-center')}${text(685,190,'n⁺','svg-center')}${text(465,278,'p 型硅衬底','svg-center')}${text(465,337,'绝缘氧化层隔开栅极与硅；栅极电场控制下方通道','svg-center svg-small')}${on?`<rect x="310" y="151" width="310" height="17" class="conducting-channel"/>${path('M310 159 H620',true,true)}<path d="M365 123 V148 M465 123 V148 M565 123 V148" class="electric-field"/>`:text(465,192,'通道未形成','svg-center svg-small')}${path('M620 135 H850 V112')}${text(850,100,'氧化层','svg-center svg-small')}`);
  }
  // Physical cross-section icons are deliberately simplified and labelled.
  function mosTile(x,y,p,on){
    return `<g transform="translate(${x} ${y})"><rect x="10" y="30" width="140" height="47" rx="4" class="silicon-substrate"/><rect x="17" y="30" width="30" height="26" class="doped-region ${p?'p-region':''}"/><rect x="113" y="30" width="30" height="26" class="doped-region ${p?'p-region':''}"/><rect x="47" y="25" width="66" height="5" class="gate-oxide"/><rect x="47" y="8" width="66" height="17" class="metal-gate ${on?'gate-on':''}"/>${on?'<rect x="47" y="31" width="66" height="6" class="conducting-channel"/>':''}${text(80,69,p?'p 管':'n 管','svg-center svg-tiny')}${text(32,49,p?'p⁺':'n⁺','svg-center svg-tiny')}${text(128,49,p?'p⁺':'n⁺','svg-center svg-tiny')}</g>`;
  }
  function transistorGroup(x,y,input,label){
    const output=1-input;
    return `<g><rect x="${x-35}" y="${y-35}" width="235" height="240" rx="12" class="storage-group-outline"/>${text(x+80,y-49,label,'svg-center svg-small')}${mosTile(x,y,true,!input)}${mosTile(x,y+90,false,!!input)}${path(`M${x+32} ${y+30} V${y-17} H${x+135}`,!input)}${text(x+135,y-22,'电源 1','svg-center svg-tiny')}${path(`M${x+32} ${y+120} V${y+190} H${x+105}`,!!input)}${text(x+135,y+196,'地 0','svg-center svg-tiny')}${path(`M${x+128} ${y+30} H${x+175} V${y+120} H${x+128}`,!!output)}${path(`M${x+175} ${y+95} H${x+200}`,!!output)}${path(`M${x-25} ${y+95} H${x-15} V${y+8} H${x+80}`,!!input)}${path(`M${x-15} ${y+95} V${y+98} H${x+80}`,!!input)}</g>`;
  }
  function storageDiagram(state){
    const q=state.q,other=1-q;
    return svg(`${transistorGroup(215,70,other,'晶体管组 A')}${transistorGroup(600,70,q,'晶体管组 B')}${path('M415 165 H575',!!q)}${path('M800 165 H850 V318 H158 V165 H190',!!other)}${text(480,205,`A 侧 ${q}`,'svg-center signal-label')}${text(830,205,`B 侧 ${other}`,'svg-center svg-small')}${text(485,38,`存储 ${q}`,'svg-center signal-label')}${text(465,350,'两组互相连接，作为一个整体固定状态','svg-center svg-small')}`);
  }
  function memoryCell(x,y,value,highlight){
    return `<g><rect x="${x}" y="${y}" width="67" height="84" rx="8" class="small-memory-cell ${highlight?'memory-cell-active':''}"/><g transform="translate(${x+6} ${y+7}) scale(.15)">${mosTile(0,0,true,value===1)}${mosTile(0,85,false,value===0)}${mosTile(170,0,true,value===0)}${mosTile(170,85,false,value===1)}${path('M160 60 H170 M330 140 V190 H0 V80')}</g>${text(x+33,y+73,String(value),'svg-center memory-digit')}</g>`;
  }
  function additionDiagram(frame){
    const {a,b,processed}=frame,current=frame.phase==='add'?frame.column:-1,saved=frame.phase==='saved';
    const trace=globalThis.HardwareLesson.additionTrace(a,b,4);
    let body=text(460,20,`寄存器 A：${bits(a)}    ＋    寄存器 B：${bits(b)}`,'svg-center svg-small');
    for(let i=0;i<4;i++){
      const bit=3-i,x=155+i*190,active=current===bit,done=bit<processed;
      body+=text(x-30,43,`A${bit}`,'svg-center svg-tiny')+text(x+45,43,`B${bit}`,'svg-center svg-tiny');
      body+=memoryCell(x-63,50,(a>>bit)&1,active)+memoryCell(x+12,50,(b>>bit)&1,active);
      body+=path(`M${x-30} 134 V187`,!!((a>>bit)&1),active)+path(`M${x+45} 134 V187`,!!((b>>bit)&1),active);
      body+=`<rect x="${x-70}" y="187" width="155" height="82" rx="9" class="addition-unit ${active?'addition-unit-active':''}"/>${text(x+8,210,'加法电路','svg-center svg-small')}`;
      // Show the constituent device type and the adder's function; do not
      // invent a transistor-level netlist inside this functional block.
      body+=`<g transform="translate(${x-63} 217) scale(.16)">${mosTile(0,0,true,true)}${mosTile(0,80,false,true)}</g>`;
      body+=text(x+28,244,done?`${trace[bit+1].left} + ${trace[bit+1].right} + ${trace[bit+1].carryIn}`:'输入 + 进位','svg-center svg-tiny');
      if(bit<3){const carry=trace[bit+1].carryOut,known=processed>bit;body+=path(`M${x-70} 236 H${x-105}`,known&&!!carry,active)+`<path d="M${x-98} 230 L${x-106} 236 L${x-98} 242" class="carry-arrow"/>`+text(x-88,225,known?String(carry):'?','svg-center svg-tiny');}
      else body+=path(`M${x-70} 236 H45 V296`,processed===4&&!!trace[4].carryOut,active);
      body+=path(`M${x+8} 269 V298`,done&&!!((frame.result>>bit)&1),active);
      body+=`<rect x="${x-26}" y="298" width="68" height="40" rx="7" class="result-memory ${saved?'result-saved':''}"/>`+text(x+8,326,done?String((frame.result>>bit)&1):'?','svg-center memory-digit');
    }
    body+=path('M900 236 H810',false,current===0)+text(878,221,'进位 0','svg-center svg-tiny');
    body+=`<rect x="17" y="298" width="56" height="40" rx="7" class="result-memory ${saved?'result-saved':''}"/>`+text(45,326,processed===4?String(trace[4].carryOut):'?','svg-center memory-digit');
    body+=text(460,357,saved?`保存结果：${(a+b).toString(2).padStart(4,'0')}₂ = ${a+b}`:'下方是结果存储组；右侧低位的进位向左传递','svg-center svg-small');
    return svg(body);
  }
  const bits=value=>value.toString(2).padStart(4,'0');
  const transistorFrames=[
    {heading:'输入低电平，开关关闭',description:'源极和漏极之间没有形成导电通道。你可以先把它想成一条断开的路。',status:'栅极 0 · 通道断开',render:()=>transistor(false)},
    {heading:'输入高电平，开关打开',description:'栅极电场让下方形成导电通道，源极和漏极之间可以导通。后面的电路，就是把许多这样的开关连接起来。',status:'栅极 1 · 通道导通',render:()=>transistor(true)}
  ];
  function mount({demo}){
    const physicsDemo=demo('physics',1,n=>{
      const frame=transistorFrames[n];$('#physical-stage').innerHTML=frame.render();$('#physical-stage').setAttribute('aria-label',frame.heading+'。'+frame.description);$('#physics-heading').textContent=frame.heading;$('#physics-description').textContent=frame.description;$('#physics-status').textContent=frame.status;$('#physics-progress').textContent=`${n+1} / 2 个画面`;
      $$('[data-physics-level]').forEach(button=>{const selected=Number(button.dataset.physicsLevel)===n;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
    },1600);
    $$('[data-physics-level]').forEach(button=>button.addEventListener('click',()=>{physicsDemo.stop();physicsDemo.cursor=Number(button.dataset.physicsLevel);physicsDemo.paint();}));
    const model=globalThis.RegisterPhysics;
    const storageCases=[1,0].map(value=>model.transition(model.transition(model.initial(),{type:'write',value}),{type:'hold'}));
    const storageDemo=demo('storage',1,n=>{
      const stored=storageCases[n];
      $('#storage-stage').innerHTML=storageDiagram(stored);
      $('#storage-stage').setAttribute('aria-label',`存储 ${stored.q}：晶体管组 A 为 ${stored.q}，晶体管组 B 为 ${1-stored.q}，两组作为一个整体固定状态。`);
      $('#storage-heading').textContent=`存储 ${stored.q}`;
      $('#storage-description').textContent=`A 侧为 ${stored.q}，B 侧为 ${1-stored.q}。两组互相连接，作为一个整体保持这一组合，表示存储 ${stored.q}。持续供电时，这个状态保持不变。`;
      $('#storage-status').textContent=`整体保存：${stored.q}`;
      $('#storage-progress').textContent=`案例 ${n+1} / 2`;
      $$('[data-store-bit]').forEach(button=>{const selected=Number(button.dataset.storeBit)===stored.q;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
    },2000);
    $$('[data-store-bit]').forEach(button=>button.addEventListener('click',()=>{storageDemo.stop();storageDemo.cursor=Number(button.dataset.storeBit)===1?0:1;storageDemo.paint();}));
    let addA=3,addB=3,frames=model.additionFrames(addA,addB);
    const additionDemo=demo('simple-add',5,n=>{
      const frame=frames[n];$('#addition-stage').innerHTML=additionDiagram(frame);$('#simple-add-inputs').textContent=`寄存器 A 保存 ${bits(addA)}，B 保存 ${bits(addB)}，也就是计算 ${addA} + ${addB}`;
      const explanation=n===0?{heading:'先把两个数存好',description:'每个小格子是一组存储电路。四个小格子并排，保存一个四位二进制数。加法电路还没有开始处理。',status:`${addA} + ${addB} · 等待计算`}:n===5?{heading:'结果送入新的存储组',description:`加法电路得到 ${addA+addB}，把结果保存起来。原来的 A、B 仍在各自的寄存器里，读出来计算不会把它们清空。`,status:`${(addA+addB).toString(2).padStart(4,'0')}₂ = ${addA+addB}`}:{heading:`从右往左，计算第 ${frame.column+1} 位`,description:`这一位：${frame.left} + ${frame.right} + 进位 ${frame.carryIn} = ${frame.left+frame.right+frame.carryIn}。本位写 ${(frame.result>>frame.column)&1}，向左传递进位 ${frame.carryOut}。`,status:`本位 ${(frame.result>>frame.column)&1} · 向左进 ${frame.carryOut}`};
      $('#simple-add-heading').textContent=explanation.heading;$('#simple-add-description').textContent=explanation.description;$('#simple-add-status').textContent=explanation.status;$('#simple-add-progress').textContent=`${n} / 5 步`;
      $('#addition-stage').setAttribute('aria-label',`${addA} 加 ${addB}，${explanation.heading}。${explanation.description}`);
    },1700);
    $$('[data-add-case]').forEach(button=>button.addEventListener('click',()=>{[addA,addB]=button.dataset.addCase.split(',').map(Number);frames=model.additionFrames(addA,addB);additionDemo.reset();}));
  }
  globalThis.RegisterVisuals={mount};
})();
