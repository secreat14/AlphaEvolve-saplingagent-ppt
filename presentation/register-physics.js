"use strict";
(() => {
  // Ideal static storage: the write button abstracts the write-driver circuitry.
  const initial=()=>({q:0,input:null,writing:false});
  function transition(state,event){
    if(event.type==='write')return {q:event.value?1:0,input:event.value?1:0,writing:true};
    if(event.type==='hold')return {...state,input:null,writing:false};
    return {...state};
  }
  function storageFrames(){
    let state=initial();const frames=[state];
    for(const event of [{type:'write',value:1},{type:'hold'},{type:'write',value:0},{type:'hold'}]){state=transition(state,event);frames.push(state);}
    return frames;
  }
  function additionFrames(a,b){
    const trace=globalThis.HardwareLesson.additionTrace(a,b,4);
    return [...trace.map((frame,i)=>({...frame,a,b,phase:i?'add':'stored',processed:i})),{...trace.at(-1),a,b,phase:'saved',processed:4}];
  }
  globalThis.RegisterPhysics={initial,transition,storageFrames,additionFrames};
})();
