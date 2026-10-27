"use strict";
(() => {
  const $=selector=>document.querySelector(selector),$$=selector=>[...document.querySelectorAll(selector)];
  const text=(x,y,value,kind='')=>`<text x="${x}" y="${y}" class="${kind}">${value}</text>`;
  const path=(d,high=false,pulse=false)=>`<path d="${d}" class="circuit-wire ${high?'signal-high':''} ${pulse?'signal-pulse':''}"/>`;
  const svg=body=>`<svg viewBox="0 0 920 360" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
  function transistor(on){
    return svg(`<rect x="120" y="150" width="690" height="165" rx="12" class="silicon-substrate"/><rect x="180" y="150" width="130" height="65" rx="4" class="doped-region"/><rect x="620" y="150" width="130" height="65" rx="4" class="doped-region"/><rect x="310" y="125" width="310" height="20" class="gate-oxide"/><rect x="310" y="78" width="310" height="45" rx="3" class="metal-gate ${on?'gate-on':''}"/>${path('M245 150 V40 H180')}${path('M685 150 V40 H750')}${path('M465 78 V70 M465 32 V25',on)}${text(100,40,'源极 S')}${text(750,40,'漏极 D')}${text(465,62,`栅极 G = ${on?1:0}`,'svg-center signal-label')}${text(245,190,'n⁺','svg-center')}${text(685,190,'n⁺','svg-center')}${text(465,278,'p 型硅衬底','svg-center')}${text(465,337,'绝缘氧化层隔开栅极与硅；栅极电场控制下方通道','svg-center svg-small')}${on?`<rect x="310" y="151" width="310" height="17" class="conducting-channel"/>${path('M310 159 H620',true,true)}<path d="M365 123 V148 M465 123 V148 M565 123 V148" class="electric-field"/>`:text(465,192,'通道未形成','svg-center svg-small')}${path('M620 135 H850 V112')}${text(850,100,'氧化层','svg-center svg-small')}`);
  }
  function inverter(input){
    const output=1-input;
    return svg(`${path('M455 28 V70',!input)}${text(455,20,'电源 VDD','svg-center svg-small')}<rect x="410" y="70" width="90" height="70" rx="7" class="mos-switch ${!input?'switch-on':''}"/>${text(455,112,'pMOS','svg-center svg-small')}${path('M455 140 V190 H740',!!output,!input)}${path('M455 190 V230',!!input)}<rect x="410" y="230" width="90" height="70" rx="7" class="mos-switch ${input?'switch-on':''}"/>${text(455,272,'nMOS','svg-center svg-small')}${path('M455 300 V326',!!input)}${path('M420 326 H490 M430 337 H480 M442 348 H468')}${path('M140 190 H330 V105 H397',!!input)}<circle cx="403" cy="105" r="6" class="gate-bubble"/>${path('M330 190 V265 H410',!!input)}${text(130,170,`输入 A = ${input}`)}${text(750,198,`输出 Y = ${output}`,'signal-label')}${text(550,110,input?'关断':'导通','svg-small')}${text(550,270,input?'导通':'关断','svg-small')}${text(455,205,'●','svg-center svg-small')}${text(170,315,'CMOS 反相器：一个 pMOS + 一个 nMOS','svg-small')}`);
  }
  function inverterSymbol(x,y){return `<path d="M${x} ${y-30} L${x+60} ${y} L${x} ${y+30} Z" class="logic-symbol"/><circle cx="${x+67}" cy="${y}" r="7" class="gate-bubble"/>`;}
  function transmissionGate(x,y,on,label){
    return `<rect x="${x}" y="${y-25}" width="100" height="50" rx="7" class="transmission-gate ${on?'switch-on':''}"/>${text(x+50,y+7,'TG','svg-center')}${text(x+50,y-38,label,'svg-center svg-small')}`;
  }
  function latch(d,enable,q){
    return svg(`${path('M40 170 H140',!!d,!!enable)}${text(40,145,`D = ${d}`)}${transmissionGate(140,170,enable,`输入开关 ${enable?'开':'关'}`)}${path('M240 170 H340',!!q,!!enable)}${inverterSymbol(340,170)}${path('M414 170 H560',!q,!!enable)}${text(485,145,String(1-q),'svg-center signal-label')}${inverterSymbol(560,170)}${path('M634 170 H850',!!q,!!enable)}${text(850,145,`Q = ${q}`,'svg-center signal-label')}${path('M740 170 V292 H540',!!q,!enable)}${transmissionGate(440,292,!enable,`反馈开关 ${enable?'关':'开'}`)}${path('M440 292 H290 V170',!!q,!enable)}${text(460,40,`D 锁存器 · G = ${enable}`,'svg-center')}${text(460,342,'TG 是由 nMOS 与 pMOS 并联形成的受控开关','svg-center svg-small')}`);
  }
  function latchBlock(x,caption,value,open){
    return `<rect x="${x}" y="85" width="230" height="155" rx="12" class="latch-block ${open?'switch-on':''}"/>${text(x+115,117,caption,'svg-center svg-small')}${inverterSymbol(x+35,166)}${inverterSymbol(x+128,166)}${path(`M${x+109} 166 H${x+128}`)}${path(`M${x+207} 166 V212 H${x+22} V166 H${x+35}`,!!value,!open)}${text(x+115,200,String(value),'svg-center signal-label')}`;
  }
  function flipflop(rising){
    return svg(`${text(45,160,'D = 1')}${path('M115 166 H180',true)}${latchBlock(180,'主锁存器 · CLK=0 时开',1,!rising)}${path('M410 166 H530',true,!!rising)}${latchBlock(530,'从锁存器 · CLK=1 时开',rising?1:0,!!rising)}${path('M760 166 H855',!!rising,!!rising)}${text(855,151,`Q = ${rising?1:0}`,'svg-center signal-label')}${path('M80 295 H790',!!rising,!!rising)}${path('M295 295 V260',!!rising)}<circle cx="295" cy="254" r="6" class="gate-bubble"/>${path('M295 248 V240',!rising)}${text(235,274,'¬CLK','svg-small')}${path('M645 295 V240',!!rising)}${text(50,325,rising?'CLK：0 → 1，上升沿把主级保存的值送到 Q':'CLK = 0：主级接收输入，从级仍保持旧 Q','svg-small')}${rising?'<path d="M86 285 V250 H126" class="rising-edge-mark"/>':''}`);
  }
  const physicalFrames=[
    {level:0,name:'晶体管 / TRANSISTOR',heading:'栅极电压，控制导电通道',description:'把晶体管先看成一个电控开关。输入低电平时，这个 nMOS 的源、漏之间还没有形成导电通道。',status:'G = 0 · 关断',render:()=>transistor(false)},
    {level:0,name:'晶体管 / TRANSISTOR',heading:'提高栅极电压，通道形成',description:'绝缘层让栅极和硅保持隔离。栅极的电场使下方形成通道，源、漏之间可以导通。',status:'G = 1 · 导通',render:()=>transistor(true)},
    {level:2,name:'反相器 / INVERTER',heading:'两个互补开关，把 0 变成 1',description:'输入 A = 0：上方 pMOS 导通，下方 nMOS 关断，输出接向电源，被拉到高电平 1。',status:'输入 0 → 输出 1',render:()=>inverter(0)},
    {level:2,name:'反相器 / INVERTER',heading:'输入反过来，输出也反过来',description:'输入 A = 1：上方 pMOS 关断，下方 nMOS 导通，输出接向地，被拉到低电平 0。',status:'输入 1 → 输出 0',render:()=>inverter(1)},
    {level:4,name:'反馈存储 / D LATCH',heading:'打开输入，把一位数据送进去',description:'两个反相器串联后，0/1 会反相两次。输入开关打开、反馈开关关闭时，Q 跟随输入 D。',status:'G = 1 · 写入 D = 1',render:()=>latch(1,1,1)},
    {level:4,name:'反馈存储 / D LATCH',heading:'关闭输入，反馈回路保留旧值',description:'现在 D 改成 0，但输入通路已关闭。Q = 1 经反馈回路回到前端，两个反相器继续恢复这个稳定状态。',status:'G = 0 · D = 0，Q 仍为 1',render:()=>latch(0,0,1)},
    {level:4,name:'反馈存储 / D LATCH',heading:'再次打开输入，才能换成新值',description:'打开输入、断开反馈，新的 0 进入；Q 更新为 0。关上输入后，同一电路也能稳定保持 0。',status:'G = 1 · 写入 D = 0',render:()=>latch(0,1,0)},
    {level:7,name:'时钟采样 / D FLIP-FLOP',heading:'两级锁存，组成一个触发器',description:'主、从锁存器由相反时钟电平控制。CLK = 0 时主级接收 D，从级保持，所以外部 Q 还不更新。',status:'CLK = 0 · 主级 1，从级 0',render:()=>flipflop(false)},
    {level:7,name:'时钟采样 / D FLIP-FLOP',heading:'上升沿到来，Q 更新一次',description:'CLK 从 0 变成 1：主级关闭，从级打开，将刚才保存的值送到 Q。输入再变，Q 也会保持到下次有效采样。',status:'CLK ↑ · Q：0 → 1',render:()=>flipflop(true)}
  ];
  const bits=value=>value.toString(2).padStart(4,'0');
  function registerDiagram(state){
    let body=path('M20 278 H820',!!state.clock,state.event==='clock');
    body+=text(20,308,'CLK · 四个单元共用同一条时钟线','svg-small');
    for(let i=0;i<4;i++){
      const x=25+i*205,d=(state.d>>(3-i))&1,q=(state.q>>(3-i))&1,chosen=state.enable?d:q;
      body+=`<rect x="${x}" y="73" width="175" height="158" rx="12" class="register-bit-cell ${state.captured?'capture-flash':''}"/>${text(x+87,98,`位 ${3-i} · D 触发器`,'svg-center svg-small')}${text(x+74,21,`D${3-i}=${d}`,'svg-center svg-small')}${path(`M${x+74} 26 V38`,!!d)}<path d="M${x+55} 38 H${x+100} V60 H${x+55} Z" class="data-mux"/>${text(x+77,54,'MUX','svg-center svg-tiny')}${path(`M${x+77} 60 V75`,!!chosen,state.captured)}${path(`M${x+175} 167 H${x+188} V48 H${x+100}`,!!q,!state.enable)}${text(x+156,37,'旧 Q','svg-center svg-tiny')}<rect x="${x+15}" y="118" width="61" height="54" rx="5" class="mini-latch ${!state.clock?'mini-open':''}"/><rect x="${x+99}" y="118" width="61" height="54" rx="5" class="mini-latch ${state.clock?'mini-open':''}"/>${text(x+45,140,'主','svg-center svg-small')}${text(x+129,140,'从','svg-center svg-small')}${path(`M${x+23} 156 H${x+67} M${x+107} 156 H${x+151}`)}${path(`M${x+76} 145 H${x+99}`,!!chosen,state.captured)}${text(x+87,213,`Q${3-i} = ${q}`,'svg-center stored-bit')}${path(`M${x+87} 278 V231`,!!state.clock,state.event==='clock')}<path d="M${x+79} 231 L${x+87} 220 L${x+95} 231" class="clock-triangle"/>`;
    }
    return `<svg viewBox="0 0 840 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
  }
  function timingDiagram(history){
    const frames=history.slice(-9),step=110,left=150;
    let body=text(8,20,'CLK','svg-small')+text(8,47,'输入 D','svg-small')+text(8,74,'保存 Q','svg-small');
    let clock='';
    frames.forEach((state,i)=>{
      const x=left+i*step,y=state.clock?7:23;
      clock+=i?` H${x} V${y} H${x+step}`:`M${x} ${y} H${x+step}`;
      body+=text(x+step/2,48,bits(state.d),'svg-center svg-small')+`<rect x="${x+3}" y="55" width="${step-6}" height="27" rx="4" class="timing-q ${state.captured?'timing-capture':''}"/>`+text(x+step/2,75,bits(state.q),'svg-center svg-small');
      if(state.captured)body+=`<path d="M${x} 2 V84" class="timing-edge"/>`;
    });
    return `<svg viewBox="0 0 1240 86" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}${path(clock,true)}</svg>`;
  }
  const scriptCaptions=[
    'D = 0011 已准备好。Q 初始为 0000，等待允许写入的上升沿。',
    '第一次上升沿：EN = 1，四个单元同时写入，Q 从 0000 变成 0011。',
    '只把 D 改成 1100，CLK 仍为 1，没有新上升沿，Q 继续保持 0011。',
    'CLK 从 1 降到 0：下降沿不更新这个正沿触发器的 Q。',
    '关闭 EN 后再产生上升沿：输入选择旧 Q，寄存器仍保持 0011。',
    '时钟回到 0，重新打开 EN，准备在下一个上升沿写入。',
    '第二次有效写入：CLK ↑ 且 EN = 1，Q 更新为 1100，也就是十进制 12。',
    'D 改为 0101，但 Q 仍是 1100。输入值与已保存的值可以不同。',
    '读出的是 Q = 1100，也就是 12。读出不会清空寄存器。'
  ];
  function mount({demo}){
    const physicsDemo=demo('physics',8,n=>{
      const frame=physicalFrames[n];$('#physical-stage').innerHTML=frame.render();
      $('#physical-stage').setAttribute('aria-label',frame.heading+'。'+frame.description);
      $('#physics-level').textContent=frame.name;$('#physics-heading').textContent=frame.heading;$('#physics-description').textContent=frame.description;$('#physics-status').textContent=frame.status;$('#physics-progress').textContent=`${n+1} / 9 个画面`;
      $$('[data-physics-level]').forEach(button=>{const active=Number(button.dataset.physicsLevel)===frame.level;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});
    },2700);
    $$('[data-physics-level]').forEach(button=>button.addEventListener('click',()=>{physicsDemo.stop();physicsDemo.cursor=Number(button.dataset.physicsLevel);physicsDemo.paint();}));
    const model=globalThis.RegisterPhysics,frames=model.scriptedFrames();
    let state=model.initial(),history=[state];
    function renderChip(caption,manual=false){
      $('#chip-input-bits').innerHTML=Array.from({length:4},(_,i)=>{const bit=3-i,value=(state.d>>bit)&1;return `<button data-input-bit="${bit}" aria-label="输入位 ${bit}，当前 ${value}，点击切换" aria-pressed="${!!value}"><small>D${bit}</small><b>${value}</b></button>`;}).join('');
      $('#chip-input-value').textContent=`${bits(state.d)}₂ = ${state.d}`;
      $('#chip-stored-value').textContent=`${bits(state.q)}₂ = ${state.q}`;
      $('#chip-clock-value').textContent=state.clock;$('#chip-clock').textContent=`时钟 ${state.clock} → ${1-state.clock}`;
      $('#chip-enable').textContent=`允许写入 EN = ${state.enable}`;$('#chip-enable').setAttribute('aria-pressed',String(!!state.enable));
      $('#chip-read-value').textContent=state.read===null?'尚未读出':`${bits(state.read)}₂ = ${state.read}`;
      $('.chip-read-panel').classList.toggle('read-active',state.event==='read');
      $('#chip-mode').textContent=state.captured?'正在写入':!state.enable?'禁止写入 · 保持':'保持 · 等待上升沿';
      $('#register-chip-diagram').innerHTML=registerDiagram(state);
      $('#register-timing').innerHTML=timingDiagram(history);
      $('#chip-caption').textContent=caption;
      if(manual)$('#chip-case-progress').textContent='手动探索 · 可随时重播案例';
    }
    const chipDemo=demo('register-chip',8,n=>{state={...frames[n]};history=frames.slice(0,n+1);renderChip(scriptCaptions[n]);$('#chip-case-progress').textContent=`${n} / 8 步`;},1900);
    function interact(event){
      chipDemo.stop();chipDemo.cursor=0;state=model.transition(state,event);history=[...history,state].slice(-9);
      const caption=event.type==='data'?`输入 D 改成 ${bits(state.d)}，已存的 Q 仍为 ${bits(state.q)}。`:event.type==='enable'?`EN = ${state.enable}：${state.enable?'允许下个上升沿写入外部 D':'输入选择旧 Q，后续上升沿继续保持'}。`:event.type==='read'?`读出 Q = ${bits(state.q)}，十进制 ${state.q}。存储单元里的值保持不变。`:state.captured?`CLK ↑ 且 EN = 1：Q 写入 ${bits(state.q)}，十进制 ${state.q}。`:`${state.clock?'CLK ↑，但 EN = 0':'CLK ↓，不是采样沿'}：Q 保持 ${bits(state.q)}。`;
      renderChip(caption,true);
    }
    $('#chip-input-bits').addEventListener('click',event=>{const button=event.target.closest('[data-input-bit]');if(button)interact({type:'data',value:state.d^(1<<Number(button.dataset.inputBit))});});
    $('#chip-enable').addEventListener('click',()=>interact({type:'enable',value:1-state.enable}));
    $('#chip-clock').addEventListener('click',()=>interact({type:'clock',value:1-state.clock}));
    $('#chip-read').addEventListener('click',()=>interact({type:'read'}));
  }
  globalThis.RegisterVisuals={mount};
})();
