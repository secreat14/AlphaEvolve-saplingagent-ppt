"use strict";
(() => {
  function registerTrace(a,b){
    const frames=[{phase:'ready',k:0,left:null,right:null,product:null,sum:0,stored:false}];
    let sum=0;
    for(let k=0;k<4;k++){
      const left=a[k],right=b[k*4];
      frames.push({phase:'load',k,left,right,product:null,sum,stored:false});
      const product=left*right;sum+=product;
      frames.push({phase:'compute',k,left,right,product,sum,stored:false});
    }
    frames.push({...frames.at(-1),phase:'store',stored:true});
    return frames;
  }
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
  globalThis.HardwareLesson={registerTrace,additionTrace,multiplicationPartials};
})();
