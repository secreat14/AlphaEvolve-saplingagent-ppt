"use strict";
(() => {
  // Ideal digital model: setup/hold time and propagation delay are discussed
  // in the speaker notes. EN is implemented with a data mux, not a gated clock.
  const initial=()=>({d:3,q:0,clock:0,enable:1,read:null,captured:false,event:'ready'});
  function transition(state,event){
    const next={...state,captured:false,event:event.type};
    if(event.type==='data')next.d=event.value&15;
    if(event.type==='enable')next.enable=event.value?1:0;
    if(event.type==='clock'){
      next.clock=event.value?1:0;
      if(state.clock===0&&next.clock===1&&state.enable){next.q=state.d;next.captured=true;}
    }
    if(event.type==='read')next.read=state.q;
    return next;
  }
  const script=[
    [{type:'clock',value:1}],
    [{type:'data',value:12}],
    [{type:'clock',value:0}],
    [{type:'enable',value:0},{type:'clock',value:1}],
    [{type:'clock',value:0},{type:'enable',value:1}],
    [{type:'clock',value:1}],
    [{type:'data',value:5}],
    [{type:'read'}]
  ];
  function scriptedFrames(){
    let state=initial();const frames=[state];
    for(const events of script){for(const event of events)state=transition(state,event);frames.push(state);}
    return frames;
  }
  globalThis.RegisterPhysics={initial,transition,scriptedFrames};
})();
