"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Pt = { x: number; y: number };
type Stitch = { a: Pt; b: Pt; color: string; group: number };
type Ratio = { label: string; sub: string; w: number; h: number };

const RATIOS: Ratio[] = [
  { label: "1:1", sub: "方形", w: 1, h: 1 },
  { label: "4:5", sub: "人像", w: 4, h: 5 },
  { label: "9:16", sub: "手机", w: 9, h: 16 },
  { label: "16:9", sub: "横向", w: 16, h: 9 },
  { label: "A4", sub: "打印", w: 210, h: 297 },
];
const PAPERS = ["#f6f3ec", "#d7d9d8", "#8c9190", "#e9dfca", "#e6bcc6", "#b9d4ee", "#cbcbe3", "#c7d3c9"];
const THREAD_COLORS = ["#f6f1df","#d6d1c4","#807c77","#292b2d","#8b332f","#c94135","#e46f57","#e9a08d","#a55d2a","#d9913b","#e9c75d","#eee19a","#56723b","#83a45f","#afc99a","#3f7671","#5d9d9c","#9ac9c8","#335d85","#5f88b5","#a8c4e4","#66588e","#9a79ad","#d0afd1"];
const MOTIFS = ["星星","爱心","玫瑰","太阳","云朵","彩虹"];
const FONT:Record<string,string[]>={
  A:["01110","10001","10001","11111","10001","10001","10001"],B:["11110","10001","10001","11110","10001","10001","11110"],C:["01111","10000","10000","10000","10000","10000","01111"],D:["11110","10001","10001","10001","10001","10001","11110"],E:["11111","10000","10000","11110","10000","10000","11111"],F:["11111","10000","10000","11110","10000","10000","10000"],G:["01111","10000","10000","10111","10001","10001","01111"],H:["10001","10001","10001","11111","10001","10001","10001"],I:["11111","00100","00100","00100","00100","00100","11111"],J:["00111","00010","00010","00010","10010","10010","01100"],K:["10001","10010","10100","11000","10100","10010","10001"],L:["10000","10000","10000","10000","10000","10000","11111"],M:["10001","11011","10101","10101","10001","10001","10001"],N:["10001","11001","10101","10011","10001","10001","10001"],O:["01110","10001","10001","10001","10001","10001","01110"],P:["11110","10001","10001","11110","10000","10000","10000"],Q:["01110","10001","10001","10001","10101","10010","01101"],R:["11110","10001","10001","11110","10100","10010","10001"],S:["01111","10000","10000","01110","00001","00001","11110"],T:["11111","00100","00100","00100","00100","00100","00100"],U:["10001","10001","10001","10001","10001","10001","01110"],V:["10001","10001","10001","10001","10001","01010","00100"],W:["10001","10001","10001","10101","10101","11011","10001"],X:["10001","10001","01010","00100","01010","10001","10001"],Y:["10001","10001","01010","00100","00100","00100","00100"],Z:["11111","00001","00010","00100","01000","10000","11111"]," ":["00000","00000","00000","00000","00000","00000","00000"]
};

function crossAt(x:number,y:number,size:number,color:string,group:number):Stitch[]{const d=size*.42;return[{a:{x:x-d,y:y-d},b:{x:x+d,y:y+d},color,group},{a:{x:x-d,y:y+d},b:{x:x+d,y:y-d},color,group}]}
function motifPoints(kind:string,c:Pt,size:number){const pts:Pt[]=[];const push=(x:number,y:number)=>pts.push({x:c.x+x*size,y:c.y+y*size});
  if(kind==="星星"){for(let i=0;i<=20;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?0.43:0.92;push(Math.cos(a)*r,Math.sin(a)*r)}}
  else if(kind==="爱心"){for(let i=0;i<=48;i++){const t=i/48*Math.PI*2;push(Math.sin(t)**3*.95,-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/17)}}
  else if(kind==="太阳"){for(let i=0;i<=28;i++){const a=i/28*Math.PI*2;push(Math.cos(a)*.55,Math.sin(a)*.55)}for(let i=0;i<12;i++){const a=i/12*Math.PI*2;push(Math.cos(a)*.72,Math.sin(a)*.72);push(Math.cos(a)*1.02,Math.sin(a)*1.02)}}
  else if(kind==="云朵"){for(let i=0;i<=48;i++){const t=i/48*Math.PI*2;const r=.62+.18*Math.sin(3*t);push(Math.cos(t)*r*1.35,Math.sin(t)*r*.7)}}
  else if(kind==="彩虹"){for(let band=0;band<3;band++)for(let i=0;i<=24;i++){const a=Math.PI+i/24*Math.PI,r=.55+band*.2;push(Math.cos(a)*r,-Math.sin(a)*r)}}
  else {for(let i=0;i<=42;i++){const t=i/42*Math.PI*5,r=.06+.045*i;push(Math.cos(t)*r,Math.sin(t)*r)}for(let i=0;i<12;i++){const a=i/12*Math.PI*2;push(Math.cos(a)*.75,Math.sin(a)*.48)}}return pts}

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
  const canvasRef=useRef<HTMLCanvasElement>(null), fileRef=useRef<HTMLInputElement>(null), animRef=useRef<number>(0), groupRef=useRef(0);
  const [image,setImage]=useState<HTMLImageElement|null>(null), [ratio,setRatio]=useState(1), [paper,setPaper]=useState(3);
  const [texture,setTexture]=useState(62), [photoScale,setPhotoScale]=useState(74), [rotation,setRotation]=useState(0);
  const [mode,setMode]=useState("photo"), [colorIndex,setColorIndex]=useState(5), [photoFilter,setPhotoFilter]=useState<"original"|"mono">("original");
  const [textValue,setTextValue]=useState("LOVE"), [motif,setMotif]=useState("爱心"), [motifSize,setMotifSize]=useState(72);
  const [stitchSize,setStitchSize]=useState(18);
  const [stitches,setStitches]=useState<Stitch[]>([]), [drawing,setDrawing]=useState(false), [last,setLast]=useState<Pt|null>(null);
  const [playing,setPlaying]=useState(false), [progress,setProgress]=useState(1), [duration,setDuration]=useState(6), [fps,setFps]=useState(12);
  const color=THREAD_COLORS[colorIndex], dims=RATIOS[ratio];

  const draw=useCallback((p=progress) => {
    const c=canvasRef.current; if(!c)return; const ctx=c.getContext("2d")!; const w=c.width,h=c.height;
    ctx.clearRect(0,0,w,h); ctx.fillStyle=PAPERS[paper]; ctx.fillRect(0,0,w,h);
    ctx.save(); ctx.globalAlpha=texture/100*.22;
    for(let i=0;i<950;i++){const x=(i*83)%w,y=(i*137)%h;ctx.fillStyle=i%4?"rgba(85,68,45,.16)":"rgba(255,255,255,.48)";ctx.fillRect(x,y,(i%3)+.5,.7)}
    for(let i=0;i<90;i++){const x=(i*151)%w,y=(i*67)%h;ctx.strokeStyle="rgba(110,89,59,.16)";ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+8,y-4,x+15,y+2);ctx.stroke()}ctx.restore();
    if(image){ctx.save();ctx.translate(w/2,h/2);ctx.rotate(rotation*Math.PI/180);const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height,maxW=w*photoScale/100,maxH=h*photoScale/100,s=Math.min(maxW/iw,maxH/ih);ctx.shadowColor="rgba(38,43,41,.18)";ctx.shadowBlur=12;ctx.shadowOffsetY=5;ctx.filter=photoFilter==="mono"?"grayscale(100%) sepia(8%) contrast(92%)":"none";ctx.drawImage(image,-iw*s/2,-ih*s/2,iw*s,ih*s);ctx.restore()}
    const count=Math.ceil(stitches.length*p); stitches.slice(0,count).forEach(s=>{threadLine(ctx,s.a,s.b,s.color);});
    if(p<1&&count>0){const s=stitches[Math.max(0,count-1)],t=(p*stitches.length)%1,nx=s.a.x+(s.b.x-s.a.x)*t,ny=s.a.y+(s.b.y-s.a.y)*t;ctx.save();ctx.translate(nx,ny);ctx.rotate(Math.atan2(s.b.y-s.a.y,s.b.x-s.a.x)-.65);const g=ctx.createLinearGradient(-36,0,36,0);g.addColorStop(0,"#5c5f5c");g.addColorStop(.45,"#f8f6e9");g.addColorStop(.58,"#777c78");g.addColorStop(1,"#292d2b");ctx.strokeStyle=g;ctx.lineWidth=5;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-34,0);ctx.lineTo(34,0);ctx.stroke();ctx.restore()}
  },[image,paper,texture,photoScale,rotation,stitches,progress,photoFilter,ratio]);
  useEffect(()=>draw(),[draw]);
  const undo=useCallback(()=>setStitches(v=>{if(!v.length)return v;const group=v[v.length-1].group;return v.filter(s=>s.group!==group)}),[]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="z"){e.preventDefault();undo()}};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key)},[undo]);

  useEffect(()=>{if(!playing)return;const start=performance.now() - progress*duration*1000;const tick=(now:number)=>{const p=Math.min(1,(now-start)/(duration*1000));setProgress(p);if(p<1)animRef.current=requestAnimationFrame(tick);else setPlaying(false)};animRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(animRef.current)},[playing,duration]);
  const pos=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();return{x:(e.clientX-r.left)*e.currentTarget.width/r.width,y:(e.clientY-r.top)*e.currentTarget.height/r.height}};
  const down=(e:React.PointerEvent<HTMLCanvasElement>)=>{const p=pos(e),group=++groupRef.current;if(mode==="pattern"){const pts=motifPoints(motif,p,motifSize);const placed:Stitch[]=[];pts.forEach((q,i)=>{if(i%2===0)placed.push(...crossAt(q.x,q.y,stitchSize,color,group))});setStitches(v=>[...v,...placed]);setProgress(1);return}if(mode==="text"){const chars=textValue.slice(0,10).toUpperCase().split(""),placed:Stitch[]=[];const cell=Math.max(stitchSize*1.3,motifSize/5.5),width=Math.max(0,chars.length*6-1)*cell;chars.forEach((ch,ci)=>(FONT[ch]||FONT[" "]).forEach((row,ry)=>row.split("").forEach((bit,cx)=>{if(bit==="1")placed.push(...crossAt(p.x-width/2+(ci*6+cx)*cell,p.y+(ry-3)*cell,Math.min(stitchSize,cell*.78),color,group))})));setStitches(v=>[...v,...placed]);setProgress(1);return}if(mode!=="draw")return;e.currentTarget.setPointerCapture(e.pointerId);setDrawing(true);setLast(p)};
  const move=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(!drawing||!last)return;const q=pos(e),spacing=Math.max(12,stitchSize*1.3);if(Math.hypot(q.x-last.x,q.y-last.y)<spacing)return;const mid={x:(last.x+q.x)/2,y:(last.y+q.y)/2};setStitches(v=>[...v,...crossAt(mid.x,mid.y,stitchSize,color,groupRef.current)]);setLast(q);setProgress(1)};
  const load=(f?:File)=>{if(!f)return;const img=new Image();img.onload=()=>setImage(img);img.src=URL.createObjectURL(f)};
  const savePng=()=>{draw(1);const a=document.createElement("a");a.download="stitchie-memory.png";a.href=canvasRef.current!.toDataURL("image/png");a.click()};
  const exportAnimation=()=>{setProgress(0);setPlaying(true);setMode("photo");alert("动态预览已开始。当前浏览器将动画录制为 WebM（画质优于 GIF）；完成后会自动保存。");const c=canvasRef.current!,stream=c.captureStream(fps),rec=new MediaRecorder(stream,{mimeType:"video/webm"}),parts:BlobPart[]=[];rec.ondataavailable=e=>parts.push(e.data);rec.onstop=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(parts,{type:"video/webm"}));a.download="stitchie-process.webm";a.click()};rec.start();setTimeout(()=>rec.stop(),duration*1000+250)};

  return <main className="studio-shell">
    <header className="topbar"><div className="brand"><span className="brand-flower">✿</span><strong>stitchie studio</strong><i>turn your memories<br/>into stitches</i></div><div className="file-actions"><button onClick={()=>{setImage(null);setStitches([])}}>▱ 新建</button><button onClick={()=>fileRef.current?.click()}>▱ 打开</button><button onClick={undo} disabled={!stitches.length}>↶ 撤销</button><button onClick={savePng}>⇩ 保存⌄</button><button>⚙ 设置</button></div></header>
    <section className="workspace">
      <aside className="left-col">
        <section className="panel photo-panel"><div className="tabs">{[["▧","photo","照片"],["✎","draw","绘制"],["T","text","文字"],["♡","pattern","图案"]].map(x=><button key={x[1]} className={mode===x[1]?"active":""} onClick={()=>setMode(x[1])}><b>{x[0]}</b>{x[2]}</button>)}</div>
          {mode==="photo"&&<><div className="upload-row"><div className="thumb">{image?<img className={photoFilter==="mono"?"mono":""} src={image.src} alt="已上传"/>:<span>照片</span>}</div><button className="upload" onClick={()=>fileRef.current?.click()}><b>＋</b>上传照片</button><input ref={fileRef} hidden type="file" accept="image/*" onChange={e=>load(e.target.files?.[0])}/></div><div className="filter-toggle"><button className={photoFilter==="original"?"active":""} onClick={()=>setPhotoFilter("original")}>原图</button><button className={photoFilter==="mono"?"active":""} onClick={()=>setPhotoFilter("mono")}>黑白滤镜</button></div><p className="ratio-note">🔒 已锁定原图比例，缩放不会压扁或拉长照片</p><label>等比大小 <small>{photoScale}%</small><input type="range" min="20" max="115" value={photoScale} onChange={e=>setPhotoScale(+e.target.value)}/></label><label>旋转 <small>{rotation}°</small><input type="range" min="-180" max="180" value={rotation} onChange={e=>setRotation(+e.target.value)}/></label><div className="mini-actions"><button onClick={()=>setRotation(v=>v-90)}>◁</button><button onClick={()=>setRotation(v=>v+90)}>▷</button><button onClick={()=>setPhotoScale(74)}>↕</button><button onClick={()=>setRotation(0)}>↔</button><button onClick={()=>{setPhotoScale(74);setRotation(0)}}>居中</button></div></>}
          {mode==="draw"&&<div className="draw-controls"><h3>24 色棉线调色盘</h3><div className="thread-palette">{THREAD_COLORS.map((c,i)=><button key={c} className={i===colorIndex?"active":""} style={{background:c}} onClick={()=>setColorIndex(i)} aria-label={`棉线颜色 ${i+1}`}/>)}</div><label>针脚大小 <small>{stitchSize}px</small><input type="range" min="8" max="32" value={stitchSize} onChange={e=>setStitchSize(+e.target.value)}/></label><p className="tool-hint">在画布上拖动，笔迹会自动转换成真实十字针。可使用 ⌘Z / Ctrl+Z 逐次撤销。</p><div className="edit-actions"><button onClick={undo} disabled={!stitches.length}>↶ 撤销上一笔</button><button onClick={()=>setStitches([])}>清除全部</button></div></div>}
          {mode==="text"&&<div className="type-controls"><h3>点阵十字绣文字</h3><input className="text-entry" value={textValue} maxLength={10} onChange={e=>setTextValue(e.target.value.replace(/[^a-zA-Z ]/g,""))} placeholder="输入英文字母"/><label>字距大小 <small>{motifSize}</small><input type="range" min="35" max="120" value={motifSize} onChange={e=>setMotifSize(+e.target.value)}/></label><label>单针大小 <small>{stitchSize}px</small><input type="range" min="8" max="32" value={stitchSize} onChange={e=>setStitchSize(+e.target.value)}/></label><h3>棉线颜色</h3><div className="thread-palette compact">{THREAD_COLORS.map((c,i)=><button key={c} className={i===colorIndex?"active":""} style={{background:c}} onClick={()=>setColorIndex(i)}/>)}</div><p className="tool-hint">每个亮点只生成一枚独立 X 针。输入字母后，在画布任意位置点击放置。</p></div>}
          {mode==="pattern"&&<div className="pattern-controls"><h3>十字绣图案</h3><div className="motif-grid">{MOTIFS.map((m,i)=><button className={motif===m?"active":""} key={m} onClick={()=>setMotif(m)}><b>{["☆","♡","❀","☼","☁","◠"][i]}</b>{m}</button>)}</div><label>图案大小 <small>{motifSize}</small><input type="range" min="35" max="120" value={motifSize} onChange={e=>setMotifSize(+e.target.value)}/></label><label>针脚大小 <small>{stitchSize}px</small><input type="range" min="8" max="32" value={stitchSize} onChange={e=>setStitchSize(+e.target.value)}/></label><h3>棉线颜色</h3><div className="thread-palette compact">{THREAD_COLORS.map((c,i)=><button key={c} className={i===colorIndex?"active":""} style={{background:c}} onClick={()=>setColorIndex(i)}/>)}</div><p className="tool-hint">选择图案后，在画布上点击需要的位置。</p></div>}
        </section>
        <section className="panel canvas-panel"><h2>画布</h2><div className="ratios">{RATIOS.map((r,i)=><button key={r.label} className={ratio===i?"active":""} onClick={()=>setRatio(i)}><b>{r.label}</b><small>{r.sub}</small></button>)}</div><h3>背景颜色</h3><div className="swatches">{PAPERS.map((p,i)=><button key={p} className={paper===i?"active":""} style={{background:p}} onClick={()=>setPaper(i)} aria-label={`背景${i+1}`}/>)}</div><h3>纸张纹理</h3><div className="textures">{[0,1,2,3,4].map(i=><button key={i} onClick={()=>setTexture(20+i*18)}/>)}</div><label>强度 <small>{texture}%</small><input type="range" value={texture} onChange={e=>setTexture(+e.target.value)}/></label></section>
      </aside>
      <section className="center-col"><div className="canvas-wrap" style={{aspectRatio:`${dims.w}/${dims.h}`,width:`min(100%, calc(74vh * ${dims.w/dims.h}))`}}><canvas ref={canvasRef} width={760} height={Math.round(760*dims.h/dims.w)} onPointerDown={down} onPointerMove={move} onPointerUp={()=>{setDrawing(false);setLast(null)}}/></div><div className="timeline panel"><button className="play" onClick={()=>{if(progress>=1)setProgress(0);setPlaying(v=>!v)}}>{playing?"Ⅱ":"▶"}</button><div className="timeline-main"><input type="range" min="0" max="1" step=".001" value={progress} onChange={e=>setProgress(+e.target.value)}/><div className="frames">{Array.from({length:9},(_,i)=><span key={i} style={{opacity:.35+i*.08}}><i>×</i></span>)}</div><small>{Math.round(progress*duration).toString().padStart(2,"0")}:{Math.round((progress*duration%1)*100).toString().padStart(2,"0")} / 00:{duration.toString().padStart(2,"0")}</small></div><div className="speeds"><button>0.5x</button><button className="active">1x</button><button>2x</button></div></div></section>
      <aside className="right-col"><section className="panel preview"><h2>预览 <button>⛶</button></h2><div className="preview-paper"><span className="preview-photo"/><span className="preview-stitch">×<br/>××<br/> ×××</span></div></section><section className="panel export"><h2>导出</h2><div className="export-types"><button onClick={savePng}>▧ <b>PNG</b><small>保存为高清图片</small></button><button className="active">▤ <b>GIF</b><small>保存刺绣过程</small></button></div><h3>动画设置</h3><label>时长 <small>{duration} 秒</small><input type="range" min="2" max="12" value={duration} onChange={e=>setDuration(+e.target.value)}/></label><label>帧率 <small>{fps} FPS</small><input type="range" min="6" max="30" value={fps} onChange={e=>setFps(+e.target.value)}/></label><button className="render" onClick={exportAnimation}>✦ 渲染并导出动画</button></section><section className="panel tips"><b>♧ 小贴士</b><p>切换到“绘制”，直接在纸张或照片上拖动。动画会展示金属针穿过纸面，棉线逐渐形成每一枚十字针。</p></section></aside>
    </section>
  </main>;
}
