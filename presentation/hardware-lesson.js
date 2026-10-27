"use strict";
(() => {
  function additionTrace(a,b,width=4){
    let carry=0,result=0;
    const frames=[{column:-1,carryIn:0,carryOut:0,result:0,complete:false}];
    for(let column=0;column<width;column++){
      const carryIn=carry,left=(a>>column)&1,right=(b>>column)&1,total=left+right+carryIn;
      carry=total>>1;result|=(total&1)<<column;
      frames.push({column,left,right,carryIn,carryOut:carry,result:result+(column===width-1?carry*2**width:0),complete:column===width-1});
    }
    return frames;
  }
  const multiplicationPartials=(a,b,width=4)=>Array.from({length:width},(_,i)=>((b>>i)&1)*a*2**i);
  globalThis.HardwareLesson={additionTrace,multiplicationPartials};
})();
