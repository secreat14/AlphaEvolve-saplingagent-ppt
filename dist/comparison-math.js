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
  function expand(outer,inner,ordinary=false) {
    const result=Array(16).fill(0);
    for(let b=0;b<4;b++)for(let c=0;c<4;c++) {
      const row=2*Math.floor(b/2)+Math.floor(c/2), col=2*(b%2)+c%2;
      result[row*4+col]=ordinary?outer[b]*inner[c]:mod2(outer[b]*inner[c]);
    }
    return result;
  }
  function strassenTerms(ordinary=false) {
    const terms=[];
    for(let outer=0;outer<7;outer++)for(let inner=0;inner<7;inner++)terms.push({
      u:expand(core[outer][0],core[inner][0],ordinary),v:expand(core[outer][1],core[inner][1],ordinary),
      w:expand(core[outer][2],core[inner][2],ordinary),outer,inner
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
  function multiplyOrdinary(a,b) {
    return Array.from({length:16},(_,i)=>Array.from({length:4},(_,k)=>a[Math.floor(i/4)*4+k]*b[k*4+i%4]).reduce((x,y)=>x+y));
  }
  function traceOrdinary(terms,a,b) {
    let accumulator=Array(16).fill(0);
    return terms.map(term=>{
      const left=term.u.reduce((sum,x,i)=>sum+x*a[i],0),right=term.v.reduce((sum,x,i)=>sum+x*b[i],0),product=left*right;
      accumulator=accumulator.map((x,i)=>x+term.w[i]*product);
      return {left,right,product,accumulator:[...accumulator]};
    });
  }
  function strassenRecursive4(a,b) {
    let additions=0,multiplications=0;
    const combine=(x,y,sign=1)=>x.map((value,i)=>{additions++;return value+sign*y[i];});
    function recurse(x,y,n){
      if(n===1){multiplications++;return[x[0]*y[0]];}
      const half=n/2;
      const split=z=>Array.from({length:4},(_,q)=>Array.from({length:half*half},(_,i)=>z[(Math.floor(q/2)*half+Math.floor(i/half))*n+(q%2)*half+i%half]));
      const[A,B,C,D]=split(x),[E,F,G,H]=split(y);
      const m1=recurse(combine(A,D),combine(E,H),half);
      const m2=recurse(combine(C,D),E,half);
      const m3=recurse(A,combine(F,H,-1),half);
      const m4=recurse(D,combine(G,E,-1),half);
      const m5=recurse(combine(A,B),H,half);
      const m6=recurse(combine(C,A,-1),combine(E,F),half);
      const m7=recurse(combine(B,D,-1),combine(G,H),half);
      const blocks=[combine(combine(combine(m1,m4),m5,-1),m7),combine(m3,m5),combine(m2,m4),combine(combine(combine(m1,m2,-1),m3),m6)];
      return Array.from({length:n*n},(_,i)=>{const row=Math.floor(i/n),col=i%n;return blocks[Math.floor(row/half)*2+Math.floor(col/half)][(row%half)*half+col%half];});
    }
    const result=recurse(a,b,4);return {result,additions,multiplications};
  }
  function residualFrames(terms) {
    const coefficients=Array(4096).fill(0);
    for(let row=0;row<4;row++)for(let col=0;col<4;col++)for(let k=0;k<4;k++)coefficients[(row*4+col)*256+(row*4+k)*16+k*4+col]=1;
    const summarize=()=>Array.from({length:16},(_,o)=>coefficients.slice(o*256,(o+1)*256).reduce((sum,x)=>sum+Number(x!==0),0));
    const frames=[summarize()];
    for(const term of terms){for(let o=0;o<16;o++)if(term.w[o])for(let i=0;i<16;i++)if(term.u[i])for(let j=0;j<16;j++)if(term.v[j])coefficients[o*256+i*16+j]^=1;frames.push(summarize());}
    return frames;
  }
  globalThis.MatrixCompareMath={mod2,directTerms,strassenTerms,multiply,trace,multiplyOrdinary,traceOrdinary,strassenRecursive4,residualFrames};
})();
