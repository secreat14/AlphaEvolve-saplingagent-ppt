"use strict";
(() => {
  const mod2 = n => ((n % 2) + 2) % 2;
  const core = [
    [[1,0,0,1],[1,0,0,1],[1,0,0,1]],
    [[0,0,1,1],[1,0,0,0],[0,0,1,-1]],
    [[1,0,0,0],[0,1,0,-1],[0,1,0,1]],
    [[0,0,0,1],[-1,0,1,0],[1,0,1,0]],
    [[1,1,0,0],[0,0,0,1],[-1,1,0,0]],
    [[-1,0,1,0],[1,1,0,0],[0,0,0,1]],
    [[0,1,0,-1],[0,0,1,1],[1,0,0,0]]
  ];
  const unit = i => Array.from({length:16},(_,j)=>Number(i===j));
  function directTerms() {
    const terms=[];
    for(let row=0;row<4;row++)for(let col=0;col<4;col++)for(let k=0;k<4;k++)
      terms.push({u:unit(row*4+k),v:unit(k*4+col),w:unit(row*4+col),row,col,k});
    return terms;
  }
  function expand(outer,inner) {
    const result=Array(16).fill(0);
    for(let b=0;b<4;b++)for(let c=0;c<4;c++) {
      const row=2*Math.floor(b/2)+Math.floor(c/2), col=2*(b%2)+c%2;
      result[row*4+col]=mod2(outer[b]*inner[c]);
    }
    return result;
  }
  function strassenTerms() {
    const terms=[];
    for(let outer=0;outer<7;outer++)for(let inner=0;inner<7;inner++)terms.push({
      u:expand(core[outer][0],core[inner][0]),v:expand(core[outer][1],core[inner][1]),
      w:expand(core[outer][2],core[inner][2]),outer,inner
    });
    return terms;
  }
  function multiply(a,b) {
    return Array.from({length:16},(_,i)=>{
      const row=Math.floor(i/4),col=i%4;let sum=0;
      for(let k=0;k<4;k++)sum+=a[row*4+k]*b[k*4+col];
      return mod2(sum);
    });
  }
  function trace(terms,a,b) {
    let accumulator=Array(16).fill(0);
    return terms.map(term=>{
      const left=mod2(term.u.reduce((sum,x,i)=>sum+x*a[i],0));
      const right=mod2(term.v.reduce((sum,x,i)=>sum+x*b[i],0));
      const product=left*right;
      accumulator=accumulator.map((x,i)=>mod2(x+term.w[i]*product));
      return {left,right,product,accumulator:[...accumulator]};
    });
  }
  globalThis.MatrixCompareMath={mod2,directTerms,strassenTerms,multiply,trace};
})();
