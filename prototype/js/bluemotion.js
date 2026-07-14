const STAGES=[
 {h:0,name:"Quiet Ocean",deep:"#01040b",a:"#031020",b:"#061b31",c:"#2c72aa",glow:"#66bfff",ui:.62,ray:.28,surface:.28},
 {h:3,name:"Deep Sleep",deep:"#01030a",a:"#06101f",b:"#0b1730",c:"#376fa0",glow:"#82c9ff",ui:.56,ray:.18,surface:.18},
 {h:5,name:"Dawn",deep:"#07101d",a:"#253152",b:"#6f6b99",c:"#f1b58f",glow:"#ffd7b0",ui:.8,ray:.55,surface:.46},
 {h:7,name:"Morning",deep:"#04111d",a:"#0a4260",b:"#1296b4",c:"#9eeeff",glow:"#d0f8ff",ui:.95,ray:.7,surface:.65},
 {h:10,name:"Midday",deep:"#031020",a:"#063b72",b:"#087dc7",c:"#34c8ff",glow:"#9feaff",ui:1,ray:.8,surface:.78},
 {h:13,name:"Afternoon",deep:"#03101d",a:"#092f5a",b:"#0a66a8",c:"#29b4df",glow:"#88dcff",ui:.96,ray:.68,surface:.68},
 {h:16,name:"Late Afternoon",deep:"#061221",a:"#17435d",b:"#3d718d",c:"#e0c68f",glow:"#ffe0a8",ui:.92,ray:.62,surface:.58},
 {h:18,name:"Golden Hour",deep:"#0b101c",a:"#3b2941",b:"#91563d",c:"#ffb454",glow:"#ffd28a",ui:.88,ray:.72,surface:.62},
 {h:19.5,name:"Blue Hour",deep:"#050818",a:"#171c52",b:"#3d3d80",c:"#c084b7",glow:"#aab8ff",ui:.8,ray:.45,surface:.4},
 {h:21,name:"Evening",deep:"#020713",a:"#071a35",b:"#0b3463",c:"#1e7eb8",glow:"#76cfff",ui:.72,ray:.34,surface:.3},
 {h:23,name:"Late Night",deep:"#01040c",a:"#051326",b:"#09294d",c:"#0d6ba6",glow:"#5ebeff",ui:.64,ray:.24,surface:.22},
 {h:24,name:"Quiet Ocean",deep:"#01040b",a:"#031020",b:"#061b31",c:"#2c72aa",glow:"#66bfff",ui:.62,ray:.28,surface:.28}
];

const CURRENT_PRESETS={
 calm:{name:"Calm",x:0,y:0,ray:0,surface:0},
 left:{name:"Gentle Left",x:-42,y:2,ray:-1.1,surface:-12},
 right:{name:"Gentle Right",x:42,y:2,ray:1.1,surface:12},
 rising:{name:"Rising Water",x:8,y:-35,ray:.4,surface:4},
 deep:{name:"Deep Current",x:-5,y:32,ray:-.3,surface:-3}
};

function rgb(h){h=h.replace("#","");return{r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)}}
function mix(a,b,t){const A=rgb(a),B=rgb(b),m=k=>Math.round(A[k]+(B[k]-A[k])*t).toString(16).padStart(2,"0");return`#${m("r")}${m("g")}${m("b")}`}
function oceanState(hour){
 for(let i=0;i<STAGES.length-1;i++){
  const a=STAGES[i],b=STAGES[i+1];
  if(hour>=a.h&&hour<=b.h){
   const t=(hour-a.h)/(b.h-a.h||1);
   return{name:t<.5?a.name:b.name,deep:mix(a.deep,b.deep,t),a:mix(a.a,b.a,t),b:mix(a.b,b.b,t),c:mix(a.c,b.c,t),glow:mix(a.glow,b.glow,t),ui:a.ui+(b.ui-a.ui)*t,ray:a.ray+(b.ray-a.ray)*t,surface:a.surface+(b.surface-a.surface)*t}
  }
 }
 return STAGES[0];
}
function formatTime(hour){const h=Math.floor(hour)%24,m=Math.floor((hour-Math.floor(hour))*60),ap=h>=12?"PM":"AM",hh=((h+11)%12)+1;return`${hh}:${String(m).padStart(2,"0")} ${ap}`}

document.addEventListener("DOMContentLoaded",()=>{
 const root=document.documentElement;
 const atlas=document.querySelector("#atlas");
 const clock=document.querySelector("#clock");
 const slider=document.querySelector("#time-slider");
 const stageLabel=document.querySelector("#stage-label");
 const analyzer=document.querySelector("#analyzer");
 const bubbles=document.querySelector("#near-bubbles");
 const status=document.querySelector("#status");
 const modeSelect=document.querySelector("#current-mode");
 const eelgrassLayer=document.querySelector("#eelgrass-layer");
 const bottomParticles=document.querySelector("#bottom-particles");
 const hintsToggle=document.querySelector("#hints-toggle");
 const responseDemo=document.querySelector("#response-demo");
 let hintsOn=true;

 const visibility=document.querySelector("#visibility-mode");
 let visMode="auto";
 const VIS={
  crystal:{far:.08,mid:.18,atlas:1},
  normal:{far:.18,mid:.30,atlas:.96},
  mist:{far:.30,mid:.40,atlas:.90},
  deep:{far:.42,mid:.52,atlas:.82}
 };
 function applyVis(v){
   const s=VIS[v];
   document.documentElement.style.setProperty("--vis-far",s.far);
   document.documentElement.style.setProperty("--vis-mid",s.mid);
   document.documentElement.style.setProperty("--atlas-opacity",s.atlas);
 }
 visibility.addEventListener("change",()=>{
   if(visibility.value==="auto"){applyVis("normal");}
   else applyVis(visibility.value);
 });
 applyVis("normal");


 let autoTime=false;
 let currentMode="auto";
 let currentState={...CURRENT_PRESETS.calm};
 let targetState={...CURRENT_PRESETS.calm};
 let lastAutoChoice="calm";
 let nextAutoChange=Date.now()+20000;

 function makeParticles(layerId,count,sizeMin,sizeMax,depthStrength){
  const layer=document.querySelector(layerId);
  for(let i=0;i<count;i++){
   const p=document.createElement("span");
   p.className="particle";
   const s=sizeMin+Math.random()*(sizeMax-sizeMin);
   p.style.width=`${s}px`;p.style.height=`${s}px`;
   p.dataset.baseX=String(Math.random()*108-4);
   p.dataset.baseY=String(Math.random()*108-4);
   p.dataset.phase=String(Math.random()*Math.PI*2);
   p.dataset.speed=String(.25+Math.random()*.75);
   p.dataset.depth=String(depthStrength);
   layer.appendChild(p);
  }
 }

 makeParticles("#far-particles",60,.5,1.4,1);
 makeParticles("#mid-particles",38,1,2.8,.68);
 makeParticles("#near-particles",14,3,8,.35);


 function createEelgrass(){
  const clusters=[
    {left:5, scale:.76, hero:true, blades:5},
    {left:20, scale:.52, hero:false, blades:3},
    {left:42, scale:.48, hero:false, blades:3},
    {left:66, scale:.82, hero:true, blades:5},
    {left:84, scale:.5, hero:false, blades:3},
    {left:95, scale:.7, hero:true, blades:4}
  ];

  clusters.forEach((config,index)=>{
    const cluster=document.createElement("div");
    cluster.className=`eelgrass-cluster${config.hero?" hero":""}`;
    cluster.style.left=`${config.left}%`;
    cluster.style.setProperty("--grass-scale",String(config.scale));
    cluster.style.setProperty("--cluster-opacity",String(.42+Math.random()*.22));

    for(let i=0;i<config.blades;i++){
      const blade=document.createElement("span");
      blade.className="eelgrass-blade";
      blade.style.setProperty("--blade-height",`${58+Math.random()*47}%`);
      blade.style.setProperty("--blade-x",`${(i-(config.blades-1)/2)*7}px`);
      blade.style.setProperty("--blade-angle",`${-9+Math.random()*18}deg`);
      blade.style.setProperty("--blade-time",`${13+Math.random()*6}s`);
      cluster.appendChild(blade);
    }
    eelgrassLayer.appendChild(cluster);
  });
 }

 function createBottomParticles(){
  for(let i=0;i<24;i++){
    const p=document.createElement("span");
    p.className="bottom-particle";
    const s=.6+Math.random()*1.8;
    p.style.width=`${s}px`;p.style.height=`${s}px`;
    p.style.left=`${Math.random()*100}%`;
    p.style.bottom=`${Math.random()*82}%`;
    p.style.setProperty("--sand-x",`${-16+Math.random()*32}px`);
    p.style.setProperty("--sand-y",`${-5-Math.random()*15}px`);
    p.style.animationDuration=`${28+Math.random()*35}s`;
    p.style.animationDelay=`-${Math.random()*30}s`;
    bottomParticles.appendChild(p);
  }
 }



 createEelgrass();
 createBottomParticles();

 for(let i=0;i<28;i++){
  const b=document.createElement("div");
  b.className="bar";
  b.style.height=`${15+Math.random()*65}%`;
  analyzer.appendChild(b);
 }

 const analyzerBars=[...analyzer.children];
 const analyzerLevels=analyzerBars.map(()=>18+Math.random()*34);
 const analyzerTargets=analyzerBars.map(()=>18+Math.random()*34);
 const analyzerVelocity=analyzerBars.map(()=>0);

 function animateBars(){
  const now=performance.now();

  analyzerTargets.forEach((_,i)=>{
    const primary=31+22*Math.sin(now/650+i*.60);
    const secondary=6*Math.sin(now/1240+i*.31);
    const noise=Math.random()*14;
    analyzerTargets[i]=Math.max(9,Math.min(92,primary+secondary+noise));
  });

  const influenced=analyzerTargets.map((value,i)=>{
    const left=analyzerTargets[i-1] ?? value;
    const right=analyzerTargets[i+1] ?? value;
    return value*.90 + left*.05 + right*.05;
  });

  analyzerBars.forEach((bar,i)=>{
    const target=influenced[i];
    const current=analyzerLevels[i];
    const delta=target-current;

    // Slightly responsive rise, slower and smoother release.
    const spring=delta>0 ? .22 : .085;
    analyzerVelocity[i]=analyzerVelocity[i]*.58 + delta*spring;
    analyzerLevels[i]+=analyzerVelocity[i];

    // Prevent overshoot from creating jitter.
    if(Math.abs(delta)<.35){
      analyzerLevels[i]=target;
      analyzerVelocity[i]*=.35;
    }

    analyzerLevels[i]=Math.max(8,Math.min(94,analyzerLevels[i]));
    bar.style.height=`${analyzerLevels[i]}%`;
  });

  setTimeout(animateBars,135);
 }
 animateBars();

 function chooseAutoCurrent(){
  const keys=["calm","left","right","rising","deep"];
  const weighted=["calm","calm","calm","left","right","rising","deep"];
  let choice=weighted[Math.floor(Math.random()*weighted.length)];
  if(choice===lastAutoChoice && choice!=="calm"){
    choice=keys[Math.floor(Math.random()*keys.length)];
  }
  lastAutoChoice=choice;
  targetState={...CURRENT_PRESETS[choice]};
  nextAutoChange=Date.now()+90000+Math.random()*150000;
 }

 function setManualCurrent(mode){
  currentMode=mode;
  if(mode==="auto"){
    nextAutoChange=Date.now()+3000;
  }else{
    targetState={...CURRENT_PRESETS[mode]};
  }
 }

 function updateCurrent(){
  if(currentMode==="auto" && Date.now()>=nextAutoChange) chooseAutoCurrent();

  const easing=.0028;
  for(const key of ["x","y","ray","surface"]){
    currentState[key]+=((targetState[key]??0)-currentState[key])*easing;
  }
  currentState.name=targetState.name;

  root.style.setProperty("--current-x",`${currentState.x}px`);
  root.style.setProperty("--current-y",`${currentState.y}px`);
  root.style.setProperty("--ray-lean",`${currentState.ray}deg`);
  root.style.setProperty("--surface-shift",`${currentState.surface}px`);
  root.style.setProperty("--atlas-current-x",`${currentState.x*.2}px`);
  root.style.setProperty("--atlas-current-y",`${currentState.y*.2}px`);
  const horizontalLean=currentState.x*.17;
  const verticalLift=1-currentState.y*.0018;
  const bend=currentState.x*.12;
  const haze=.40+Math.max(0,currentState.y)*.0035;
  root.style.setProperty("--grass-lean",`${horizontalLean}deg`);
  root.style.setProperty("--grass-bend",`${bend}deg`);
  root.style.setProperty("--grass-lift",String(Math.max(.92,Math.min(1.08,verticalLift))));
  root.style.setProperty("--bottom-haze-strength",String(Math.min(.58,haze)));

  status.textContent=`Current Engine · ${currentMode==="auto"?"Automatic / ":""}${currentState.name}`;
  requestAnimationFrame(updateCurrent);
 }
 updateCurrent();

 function animateParticles(){
  const t=performance.now()/1000;
  document.querySelectorAll(".particle").forEach(p=>{
    const baseX=Number(p.dataset.baseX),baseY=Number(p.dataset.baseY);
    const phase=Number(p.dataset.phase),speed=Number(p.dataset.speed),depth=Number(p.dataset.depth);
    const localX=Math.sin(t*speed+phase)*7*depth;
    const localY=Math.cos(t*speed*.72+phase)*5*depth;
    const x=baseX+(currentState.x*depth*.06)+localX*.08;
    const y=baseY+(currentState.y*depth*.05)+localY*.08;
    p.style.left=`${x}%`;
    p.style.top=`${y}%`;
  });
  requestAnimationFrame(animateParticles);
 }
 animateParticles();

 function bubbleCluster(){
  const roll=Math.random();
  const count=roll<.6?0:roll<.84?3:roll<.97?5:1;
  for(let i=0;i<count;i++){
    setTimeout(()=>{
      const b=document.createElement("span");
      b.className="bubble";
      const s=4+Math.random()*18;
      b.style.width=`${s}px`;b.style.height=`${s}px`;
      b.style.left=`${4+Math.random()*92}%`;
      b.style.setProperty("--bubble-drift",`${-45+Math.random()*90}px`);
      b.style.animationDuration=`${11+Math.random()*17}s`;
      bubbles.appendChild(b);
      b.addEventListener("animationend",()=>b.remove());
    },i*180);
  }
 }
 setInterval(bubbleCluster,2400);

 function applyTime(hour){
  const s=oceanState(hour);
  root.style.setProperty("--deep",s.deep);
  root.style.setProperty("--water-a",s.a);
  root.style.setProperty("--water-b",s.b);
  root.style.setProperty("--water-c",s.c);
  root.style.setProperty("--glow",s.glow);
  root.style.setProperty("--ui",s.ui.toFixed(2));
  root.style.setProperty("--ray",s.ray.toFixed(2));
  root.style.setProperty("--surface",s.surface.toFixed(2));
  clock.textContent=formatTime(hour);
  stageLabel.textContent=`${formatTime(hour)} · ${s.name}`;
 }

 function currentHour(){
  const d=new Date();
  return d.getHours()+d.getMinutes()/60+d.getSeconds()/3600;
 }

 function sendAtlas(){
  atlas.classList.remove("swimming");
  atlas.style.top=`${30+Math.random()*25}%`;
  atlas.style.setProperty("--crossing",`${31+Math.random()*14}s`);
  atlas.style.setProperty("--scale",`${.88+Math.random()*.18}`);
  void atlas.offsetWidth;
  atlas.classList.add("swimming");
 }

 atlas.addEventListener("animationend",()=>atlas.classList.remove("swimming"));

 slider.addEventListener("input",()=>{
  autoTime=false;
  applyTime(Number(slider.value));
 });

 document.querySelector("#current-time").addEventListener("click",()=>{
  autoTime=true;
  const h=currentHour();
  slider.value=h;
  applyTime(h);
 });

 document.querySelector("#atlas-now").addEventListener("click",sendAtlas);
 modeSelect.addEventListener("change",()=>setManualCurrent(modeSelect.value));


 hintsToggle.addEventListener("click",()=>{
  hintsOn=!hintsOn;
  root.style.setProperty("--hints-opacity",hintsOn?"1":"0");
  hintsToggle.textContent=`Hints: ${hintsOn?"On":"Off"}`;
 });

 responseDemo.addEventListener("click",()=>{
  const sequence=["left","right","rising","deep","calm"];
  let index=0;
  modeSelect.value=sequence[index];
  setManualCurrent(sequence[index]);
  releaseStrand();

  const demoTimer=setInterval(()=>{
    index++;
    if(index>=sequence.length){
      clearInterval(demoTimer);
      modeSelect.value="auto";
      setManualCurrent("auto");
      return;
    }
    modeSelect.value=sequence[index];
    setManualCurrent(sequence[index]);
    if(index===1 || index===3) releaseStrand();
  },12000);
 });

 setInterval(()=>{
  if(autoTime){
    const h=currentHour();
    slider.value=h;
    applyTime(h);
  }
 },1000);

 applyTime(Number(slider.value));
 setManualCurrent("auto");
 setTimeout(sendAtlas,1800);
});
