"use strict";
(() => {
  // Letters denote 2x2 subblocks of the same 4x4 input, with products kept
  // in left-input/right-input order. Coefficients can therefore be checked
  // without assuming commutative matrix multiplication.
  const products=[
    {label:'M₁',formula:'(a + d)(e + h)',left:[1,0,0,1],right:[1,0,0,1],expansion:[['ae',1],['ah',1],['de',1],['dh',1]]},
    {label:'M₂',formula:'(c + d)e',left:[0,0,1,1],right:[1,0,0,0],expansion:[['ce',1],['de',1]]},
    {label:'M₃',formula:'a(f − h)',left:[1,0,0,0],right:[0,1,0,-1],expansion:[['af',1],['ah',-1]]},
    {label:'M₄',formula:'d(g − e)',left:[0,0,0,1],right:[-1,0,1,0],expansion:[['dg',1],['de',-1]]},
    {label:'M₅',formula:'(a + b)h',left:[1,1,0,0],right:[0,0,0,1],expansion:[['ah',1],['bh',1]]},
    {label:'M₆',formula:'(c − a)(e + f)',left:[-1,0,1,0],right:[1,1,0,0],expansion:[['ce',1],['cf',1],['ae',-1],['af',-1]]},
    {label:'M₇',formula:'(b − d)(g + h)',left:[0,1,0,-1],right:[0,0,1,1],expansion:[['bg',1],['bh',1],['dg',-1],['dh',-1]]}
  ];
  const outputs={
    r:{combination:[[0,1],[3,1],[4,-1],[6,1]],cancellations:['ah','de','dh','dg','bh'],result:[['ae',1],['bg',1]]},
    s:{combination:[[2,1],[4,1]],result:[['af',1],['bh',1]]},
    t:{combination:[[1,1],[3,1]],result:[['ce',1],['dg',1]]},
    u:{combination:[[0,1],[1,-1],[2,1],[5,1]],cancellations:['ae','ah','de','ce','af'],result:[['cf',1],['dh',1]]}
  };
  globalThis.StrassenLesson={products,outputs};
})();
