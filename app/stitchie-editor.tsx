"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Pt = { x: number; y: number };
type Stitch = { a: Pt; b: Pt; color: string };
type Ratio = { label: string; sub: string; w: number; h: number };

const RATIOS: Ratio[] = [
  { label: "1:1", sub: "方形", w: 1, h: 1 },
  { label: "4:5", sub: "人像", w: 4, h: 5 },
  { label: "9:16", sub: "手机", w: 9, h: 16 },
  { label: "16:9", sub: "横向", w: 16, h: 9 },
  { label: "A4", sub: "打印", w: 210, h: 297 },
];
const PAPERS = ["#f6f3ec", "#d7d9d8", "#8c9190", "#e9dfca", "#e6bcc6", "#b9d4ee", "#cbcbe3", "#c7d3c9"];

function rgbToHex(h: number, s: number, v: number) {
  s /= 100; v /= 100;
  const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r,g,b]=[c,x,0]; else if(h<120)[r,g,b]=[x,c,0]; else if(h<180)[r,g,b]=[0,c,x];
  else if(h<240)[r,g,b]=[0,x,c]; else if(h<300)[r,g,b]=[x,0,c]; else [r,g,b]=[c,0,x];
  return "#" + [r,g,b].map(n => Math.round((n+m)*255).toString(16).padStart(2,"0")).join("");
}

function threadLine(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, color: string, alpha=1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = "round";
  ctx.shadowColor = "rgba(45,24,16,.36)"; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
  ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
  ctx.shadowColor = "transparent";
  [ -2.4, -1.2, 0, 1.2, 2.4 ].forEach((o,i) => {
    const dx=b.x-a.x, dy=b.y-a.y, l=Math.hypot(dx,dy)||1, ox=-dy/l*o, oy=dx/l*o;
    ctx.strokeStyle = i===2 ? "rgba(255,255,255,.32)" : i%2 ? "rgba(65,18,13,.22)" : "rgba(255,235,224,.14)";
    ctx.lineWidth = i===2 ? .9 : .65; ctx.beginPath(); ctx.moveTo(a.x+ox,a.y+oy); ctx.lineTo(b.x+ox,b.y+oy); ctx.stroke();
  }); ctx.restore();
}

export function StitchieEditor() {
  const canvasRef=useRef<HTMLCanvasElement>(null), fileRef=useRef<HTMLInputElement>(null), animRef=useRef<number>(0);
  const [image,setImage]=useState<HTMLImageElement|null>(null), [ratio,setRatio]=useState(1), [paper,setPaper]=useState(3);
  const [texture,setTexture]=useState(62), [photoScale,setPhotoScale]=useState(74), [rotation,setRotation]=useState(0);
  const [mode,setMode]=useState("photo"), [hue,setHue]=useState(5), [sat,setSat]=useState(82), [bright,setBright]=useState(69);
  const [stitches,setStitches]=useState<Stitch[]>([]), [drawing,setDrawing]=useState(false), [last,setLast]=useState<Pt|null>(null);
  const [playing,setPlaying]=useState(false), [progress,setProgress]=useState(1), [duration,setDuration]=useState(6), [fps,setFps]=useState(12);
  const color=rgbToHex(hue,sat,bright), dims=RATIOS[ratio];

  const draw=useCallback((p=progress) => {
    const c=canvasRef.current; if(!c)return; const ctx=c.getContext("2d")!; const w=c.width,h=c.height;
    ctx.clearRect(0,0,w,h); ctx.fillStyle=PAPERS[paper]; ctx.fillRect(0,0,w,h);
    ctx.save(); ctx.globalAlpha=texture/100*.22;
    for(let i=0;i<950;i++){const x=(i*83)%w,y=(i*137)%h;ctx.fillStyle=i%4?"rgba(85,68,45,.16)":"rgba(255,255,255,.48)";ctx.fillRect(x,y,(i%3)+.5,.7)}
    for(let i=0;i<90;i++){const x=(i*151)%w,y=(i*67)%h;ctx.strokeStyle="rgba(110,89,59,.16)";ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+8,y-4,x+15,y+2);ctx.stroke()}ctx.restore();
    if(image){ctx.save();ctx.translate(w/2,h/2);ctx.rotate(rotation*Math.PI/180);const maxW=w*photoScale/100,maxH=h*photoScale/100,s=Math.min(maxW/image.width,maxH/image.height);ctx.shadowColor="rgba(38,43,41,.18)";ctx.shadowBlur=12;ctx.shadowOffsetY=5;ctx.filter="grayscale(100%) sepia(8%) contrast(92%)";ctx.drawImage(image,-image.width*s/2,-image.height*s/2,image.width*s,image.height*s);ctx.restore()}
    const count=Math.ceil(stitches.length*p); stitches.slice(0,count).forEach(s=>{threadLine(ctx,s.a,s.b,s.color);});
    if(p<1&&count>0){const s=stitches[Math.max(0,count-1)],t=(p*stitches.length)%1,nx=s.a.x+(s.b.x-s.a.x)*t,ny=s.a.y+(s.b.y-s.a.y)*t;ctx.save();ctx.translate(nx,ny);ctx.rotate(Math.atan2(s.b.y-s.a.y,s.b.x-s.a.x)-.65);const g=ctx.createLinearGradient(-36,0,36,0);g.addColorStop(0,"#5c5f5c");g.addColorStop(.45,"#f8f6e9");g.addColorStop(.58,"#777c78");g.addColorStop(1,"#292d2b");ctx.strokeStyle=g;ctx.lineWidth=5;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-34,0);ctx.lineTo(34,0);ctx.stroke();ctx.restore()}
  },[image,paper,texture,photoScale,rotation,stitches,progress]);
  useEffect(()=>draw(),[draw]);

  useEffect(()=>{if(!playing)return;const start=performance.now() - progress*duration*1000;const tick=(now:number)=>{const p=Math.min(1,(now-start)/(duration*1000));setProgress(p);if(p<1)animRef.current=requestAnimationFrame(tick);else setPlaying(false)};animRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(animRef.current)},[playing,duration]);
  const pos=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();return{x:(e.clientX-r.left)*e.currentTarget.width/r.width,y:(e.clientY-r.top)*e.currentTarget.height/r.height}};
  const down=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(mode!=="draw")return;e.currentTarget.setPointerCapture(e.pointerId);setDrawing(true);setLast(pos(e))};
  const move=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(!drawing||!last)return;const q=pos(e);if(Math.hypot(q.x-last.x,q.y-last.y)<24)return;const dx=q.x-last.x,dy=q.y-last.y,l=Math.hypot(dx,dy),nx=-dy/l*8,ny=dx/l*8;const mid={x:(last.x+q.x)/2,y:(last.y+q.y)/2};setStitches(v=>[...v,{a:{x:mid.x-11-nx,y:mid.y-11-ny},b:{x:mid.x+11+nx,y:mid.y+11+ny},color},{a:{x:mid.x-11+nx,y:mid.y+11-ny},b:{x:mid.x+11-nx,y:mid.y-11+ny},color}]);setLast(q);setProgress(1)};
  const load=(f?:File)=>{if(!f)return;const img=new Image();img.onload=()=>setImage(img);img.src=URL.createObjectURL(f)};
  const savePng=()=>{draw(1);const a=document.createElement("a");a.download="stitchie-memory.png";a.href=canvasRef.current!.toDataURL("image/png");a.click()};
  const exportAnimation=()=>{setProgress(0);setPlaying(true);setMode("photo");alert("动态预览已开始。当前浏览器将动画录制为 WebM（画质优于 GIF）；完成后会自动保存。");const c=canvasRef.current!,stream=c.captureStream(fps),rec=new MediaRecorder(stream,{mimeType:"video/webm"}),parts:BlobPart[]=[];rec.ondataavailable=e=>parts.push(e.data);rec.onstop=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(parts,{type:"video/webm"}));a.download="stitchie-process.webm";a.click()};rec.start();setTimeout(()=>rec.stop(),duration*1000+250)};

  return <main className="studio-shell">
    <header className="topbar"><div className="brand"><span className="brand-flower">✿</span><strong>stitchie studio</strong><i>turn your memories<br/>into stitches</i></div><div className="file-actions"><button onClick={()=>{setImage(null);setStitches([])}}>▱ 新建</button><button onClick={()=>fileRef.current?.click()}>▱ 打开</button><button onClick={savePng}>⇩ 保存⌄</button><button>⚙ 设置</button></div></header>
    <section className="workspace">
      <aside className="left-col">
        <section className="panel photo-panel"><div className="tabs">{[["▧","photo","照片"],["✎","draw","绘制"],["♡","shape","图形"],["☆","sticker","贴纸"]].map(x=><button key={x[1]} className={mode===x[1]?"active":""} onClick={()=>setMode(x[1])}><b>{x[0]}</b>{x[2]}</button>)}</div>
          {mode==="draw"?<div className="draw-controls"><h3>棉线颜色</h3><div className="color-row"><span style={{background:color}}/><input value={color} readOnly/></div><label>色相 <small>{hue}°</small><input type="range" min="0" max="359" value={hue} onChange={e=>setHue(+e.target.value)}/></label><label>饱和度 <small>{sat}%</small><input type="range" value={sat} onChange={e=>setSat(+e.target.value)}/></label><label>明暗度 <small>{bright}%</small><input type="range" value={bright} onChange={e=>setBright(+e.target.value)}/></label><button className="wide" onClick={()=>setStitches([])}>清除全部针迹</button></div>:<><div className="upload-row"><div className="thumb">{image?<img src={image.src} alt="已上传"/>:<span>照片</span>}</div><button className="upload" onClick={()=>fileRef.current?.click()}><b>＋</b>上传照片</button><input ref={fileRef} hidden type="file" accept="image/*" onChange={e=>load(e.target.files?.[0])}/></div><label>大小 <small>{photoScale}%</small><input type="range" min="20" max="115" value={photoScale} onChange={e=>setPhotoScale(+e.target.value)}/></label><label>旋转 <small>{rotation}°</small><input type="range" min="-180" max="180" value={rotation} onChange={e=>setRotation(+e.target.value)}/></label><div className="mini-actions"><button onClick={()=>setRotation(v=>v-90)}>◁</button><button onClick={()=>setRotation(v=>v+90)}>▷</button><button onClick={()=>setPhotoScale(74)}>↕</button><button onClick={()=>setRotation(0)}>↔</button><button onClick={()=>{setPhotoScale(74);setRotation(0)}}>居中</button></div></>}
        </section>
        <section className="panel canvas-panel"><h2>画布</h2><div className="ratios">{RATIOS.map((r,i)=><button key={r.label} className={ratio===i?"active":""} onClick={()=>setRatio(i)}><b>{r.label}</b><small>{r.sub}</small></button>)}</div><h3>背景颜色</h3><div className="swatches">{PAPERS.map((p,i)=><button key={p} className={paper===i?"active":""} style={{background:p}} onClick={()=>setPaper(i)} aria-label={`背景${i+1}`}/>)}</div><h3>纸张纹理</h3><div className="textures">{[0,1,2,3,4].map(i=><button key={i} onClick={()=>setTexture(20+i*18)}/>)}</div><label>强度 <small>{texture}%</small><input type="range" value={texture} onChange={e=>setTexture(+e.target.value)}/></label></section>
      </aside>
      <section className="center-col"><div className="canvas-wrap" style={{aspectRatio:`${dims.w}/${dims.h}`}}><canvas ref={canvasRef} width={760} height={Math.round(760*dims.h/dims.w)} onPointerDown={down} onPointerMove={move} onPointerUp={()=>{setDrawing(false);setLast(null)}}/></div><div className="timeline panel"><button className="play" onClick={()=>{if(progress>=1)setProgress(0);setPlaying(v=>!v)}}>{playing?"Ⅱ":"▶"}</button><div className="timeline-main"><input type="range" min="0" max="1" step=".001" value={progress} onChange={e=>setProgress(+e.target.value)}/><div className="frames">{Array.from({length:9},(_,i)=><span key={i} style={{opacity:.35+i*.08}}><i>×</i></span>)}</div><small>{Math.round(progress*duration).toString().padStart(2,"0")}:{Math.round((progress*duration%1)*100).toString().padStart(2,"0")} / 00:{duration.toString().padStart(2,"0")}</small></div><div className="speeds"><button>0.5x</button><button className="active">1x</button><button>2x</button></div></div></section>
      <aside className="right-col"><section className="panel preview"><h2>预览 <button>⛶</button></h2><div className="preview-paper"><span className="preview-photo"/><span className="preview-stitch">×<br/>××<br/> ×××</span></div></section><section className="panel export"><h2>导出</h2><div className="export-types"><button onClick={savePng}>▧ <b>PNG</b><small>保存为高清图片</small></button><button className="active">▤ <b>GIF</b><small>保存刺绣过程</small></button></div><h3>动画设置</h3><label>时长 <small>{duration} 秒</small><input type="range" min="2" max="12" value={duration} onChange={e=>setDuration(+e.target.value)}/></label><label>帧率 <small>{fps} FPS</small><input type="range" min="6" max="30" value={fps} onChange={e=>setFps(+e.target.value)}/></label><button className="render" onClick={exportAnimation}>✦ 渲染并导出动画</button></section><section className="panel tips"><b>♧ 小贴士</b><p>切换到“绘制”，直接在纸张或照片上拖动。动画会展示金属针穿过纸面，棉线逐渐形成每一枚十字针。</p></section></aside>
    </section>
  </main>;
}
