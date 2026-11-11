// ADKH House: deterministic, tileable procedural flooring. No geometry changes.
export const FLOOR_PATTERN_TYPES=Object.freeze(['wide','plank','herringbone','chevron']);
export function floorRepeatForRoom(width,depth,metresPerTile=2.4){
  if(![width,depth,metresPerTile].every(v=>Number.isFinite(v)&&v>0))throw Error('Invalid room size');
  return [width/metresPerTile,depth/metresPerTile];
}
export function drawFloorPattern(ctx,kind,color,size=1024){
  if(!FLOOR_PATTERN_TYPES.includes(kind))throw Error('Invalid floor pattern');
  ctx.fillStyle=color;ctx.fillRect(0,0,size,size);
  let seed=913;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
  const grain=(x,y,w,h,vertical=false)=>{
    ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
    for(let n=0;n<12;n++){
      ctx.strokeStyle='rgba(62,39,22,'+(0.025+rnd()*.055)+')';
      ctx.lineWidth=.45+rnd()*.65;ctx.beginPath();
      if(vertical){const xx=x+3+rnd()*Math.max(1,w-6);ctx.moveTo(xx,y);ctx.bezierCurveTo(xx+3,y+h*.33,xx-3,y+h*.66,xx,y+h)}
      else {const yy=y+3+rnd()*Math.max(1,h-6);ctx.moveTo(x,yy);ctx.bezierCurveTo(x+w*.33,yy+2,x+w*.66,yy-2,x+w,yy)}
      ctx.stroke();
    }
    ctx.restore();
  };
  const rect=(x,y,w,h,vertical=false)=>{
    ctx.fillStyle=rnd()>.5?'rgba(255,245,220,.045)':'rgba(67,44,25,.035)';
    ctx.fillRect(x+.8,y+.8,w-1.6,h-1.6);
    grain(x+2,y+2,Math.max(1,w-4),Math.max(1,h-4),vertical);
    ctx.strokeStyle='rgba(58,43,30,.21)';ctx.lineWidth=1.5;ctx.strokeRect(x+.75,y+.75,w-1.5,h-1.5);
  };
  if(kind==='wide'||kind==='plank'){
    const h=kind==='wide'?128:80,step=kind==='wide'?340:260;
    for(let row=0,y=0;y<size;row++,y+=h){
      const off=-(row%3)*step/3;
      for(let x=off-step;x<size+step;x+=step)rect(x,y,step,h);
    }
  } else if(kind==='herringbone'){
    // Orthogonal 90-degree timber boards arranged in a repeating interlocking L rhythm.
    const s=size/8;
    for(let y=-2*s;y<size+2*s;y+=2*s)
      for(let x=-2*s;x<size+2*s;x+=2*s){
        const shift=((Math.round(y/(2*s))&1)?s:0);
        rect(x+shift,y,2*s,s,false);
        rect(x+shift,y+s,s,2*s,true);
      }
  }else{
    // Chevron: true mitred V joins with two mirrored angled parquet pieces.
    const h=size/8,half=size/8;
    ctx.lineWidth=1.5;ctx.strokeStyle='rgba(58,43,30,.22)';
    for(let row=-2;row<11;row++){
      const top=row*h;
      for(let x=-2*half;x<size+2*half;x+=2*half){
        for(const side of [-1,1]){
          const mid=x+half,edge=x+half+side*half;
          ctx.beginPath();
          ctx.moveTo(mid,top+h*.5);ctx.lineTo(edge,top);
          ctx.lineTo(edge,top+h*.5);ctx.lineTo(mid,top+h);
          ctx.closePath();
          ctx.fillStyle=rnd()>.5?'rgba(255,245,220,.055)':'rgba(66,41,26,.045)';
          ctx.fill();ctx.stroke();
        }
      }
    }
  }
}
export function createFloorMap(THREE,renderer,{color='#D6B48D',pattern='wide',cover='engineered',width=5,depth=5}={}){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas 2D unavailable');
  drawFloorPattern(ctx,pattern,color,1024);
  if(cover==='laminate'||cover==='lvt'){ctx.fillStyle='rgba(255,255,255,.035)';ctx.fillRect(0,0,1024,1024)}
  const tex=new THREE.CanvasTexture(canvas);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(...floorRepeatForRoom(width,depth,pattern==='wide'?3.0:pattern==='plank'?2.4:2.2));
  tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  tex.minFilter=THREE.LinearMipmapLinearFilter;
  tex.magFilter=THREE.LinearFilter;
  return tex;
}
