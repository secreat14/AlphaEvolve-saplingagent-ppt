"use strict";
(() => {
  const support=vector=>vector.flatMap((value,i)=>value?[i]:[]);
  function count(terms){
    const inputXor=terms.reduce((total,term)=>total+Math.max(0,support(term.u).length-1)+Math.max(0,support(term.v).length-1),0);
    const outputXor=Array.from({length:16},(_,i)=>Math.max(0,terms.filter(term=>term.w[i]).length-1)).reduce((total,value)=>total+value,0);
    return {multiplications:terms.length,inputXor,outputXor,xor:inputXor+outputXor};
  }
  function evaluate(terms,a,b){
    const result=Array(16).fill(0),assigned=Array(16).fill(false);
    let inputXor=0,outputXor=0,multiplications=0;
    function combine(vector,values){
      const indices=support(vector);if(!indices.length)return 0;
      let value=values[indices[0]];
      for(const i of indices.slice(1)){value^=values[i];inputXor++;}
      return value;
    }
    for(const term of terms){
      const left=combine(term.u,a),right=combine(term.v,b),product=left*right;multiplications++;
      for(const i of support(term.w)){
        if(assigned[i]){result[i]^=product;outputXor++;}
        else{result[i]=product;assigned[i]=true;}
      }
    }
    return {result,counts:{multiplications,inputXor,outputXor,xor:inputXor+outputXor}};
  }
  function step(term,a,b){
    const left=support(term.u).reduce((value,i)=>value^a[i],0),right=support(term.v).reduce((value,i)=>value^b[i],0),product=left*right;
    return {left,right,product,delta:term.w.map(value=>value?product:0)};
  }
  const saving=(baseline,optimized)=>({saved:baseline-optimized,percent:100*(baseline-optimized)/baseline});
  const weighted=(stats,multiplyCost)=>stats.multiplications*multiplyCost+stats.xor;
  globalThis.AiFocusModel={support,count,evaluate,step,saving,weighted};
})();
