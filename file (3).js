const video = document.getElementById("cam");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

const base = new Image(),
      eyesOpen = new Image(),
      eyesClosed = new Image(),
      mouthOpen = new Image();

base.src = "avatar_base.png";
eyesOpen.src = "avatar_eyes_open.png";
eyesClosed.src = "avatar_eyes_closed.png";
mouthOpen.src = "avatar_mouth_open.png";

const smooth = {x:0, y:0, angle:0, blink:0, mouth:0};
const lerp = (a,b,t)=>a+(b-a)*t;

function drawAvatar(){
  const s=400;
  ctx.save();
  ctx.translate(smooth.x, smooth.y);
  ctx.rotate(smooth.angle);
  ctx.drawImage(base,-s/2,-s/2,s,s);
  if(smooth.blink>0.5) ctx.drawImage(eyesClosed,-s/2,-s/2,s,s);
  else ctx.drawImage(eyesOpen,-s/2,-s/2,s,s);
  if(smooth.mouth>0.4) ctx.drawImage(mouthOpen,-s/2,-s/2,s,s);
  ctx.restore();
}

function drawBody(p){
  if(!p) return;
  ctx.strokeStyle="#00ffcc"; ctx.lineWidth=5;
  const w=canvas.width, h=canvas.height;
  const link=(a,b)=>{ctx.beginPath();ctx.moveTo(a.x*w,a.y*h);ctx.lineTo(b.x*w,b.y*h);ctx.stroke();};
  link(p[11],p[12]);link(p[11],p[13]);link(p[13],p[15]);
  link(p[12],p[14]);link(p[14],p[16]);
}

function onResults(r){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(!r.faceLandmarks)return;
  const f=r.faceLandmarks,p=r.poseLandmarks;
  const le=f[33],re=f[263],n=f[1];
  const dx=re.x-le.x, dy=re.y-le.y, angle=Math.atan2(dy,dx);
  const x=n.x*canvas.width, y=n.y*canvas.height;
  const mouth=Math.min(1,Math.abs(f[14].y-f[13].y)*25);
  const blink=Math.max(0,1-((f[159].y-f[145].y)+(f[386].y-f[374].y))/0.07);
  smooth.x=lerp(smooth.x||x,x,0.15);
  smooth.y=lerp(smooth.y||y,y,0.15);
  smooth.angle=lerp(smooth.angle,angle,0.3);
  smooth.blink=lerp(smooth.blink,blink,0.3);
  smooth.mouth=lerp(smooth.mouth,mouth,0.3);
  drawAvatar();
  drawBody(p);
}

const holistic=new Holistic.Holistic({
  locateFile:f=>`[cdn.jsdelivr.net](https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${f})`
});
holistic.setOptions({
  modelComplexity:1,
  smoothLandmarks:true,
  refineFaceLandmarks:true
});
holistic.onResults(onResults);

const cam=new CameraUtils.Camera(video,{
  width:640, height:480,
  onFrame:async()=>{await holistic.send({image:video});}
});
cam.start();
