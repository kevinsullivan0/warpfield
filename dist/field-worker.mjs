import{buildField}from'./scene.mjs?v=8j';
onmessage=e=>{const data=buildField(e.data.velocity,e.data.overlay);postMessage({velocity:e.data.velocity,overlay:e.data.overlay,data},[data.buffer]);};
