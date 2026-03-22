import { useEffect, useRef } from "react";

const ScrollIntro = () => {

const canvasRef = useRef<HTMLCanvasElement>(null);
const headlineRef = useRef<HTMLHeadingElement>(null);
const logoRef = useRef<HTMLDivElement>(null);
const sectionRef = useRef<HTMLElement>(null);

useEffect(()=>{

const TEXT =
"The Next Standard in\nFreelancing\nProfessional. Scalable. Contemporary.";

const canvas = canvasRef.current!;
const ctx = canvas.getContext("2d")!;
const headline = headlineRef.current!;
const logo = logoRef.current!;
const section = sectionRef.current!;

let started=false;
let index=0;

let particles:any[]=[];

const colors=[

"#ff3b3b",
"#ff9a00",
"#ffd400",
"#00d084",
"#00c2ff",
"#3b5bff",
"#a259ff",
"#ff2ec4"

];


/* ================= CANVAS SIZE ================= */

function resize(){

canvas.width=canvas.offsetWidth;
canvas.height=canvas.offsetHeight;

}

resize();
window.addEventListener("resize",resize);



/* ================= NATURAL TYPING ================= */

function type(){

if(index<=TEXT.length){

headline.innerHTML=

TEXT.slice(0,index)
.replace(/\n/g,"<br/>") +

'<span class="typing-cursor"></span>';

index++;


// ⭐ NATURAL HUMAN SPEED
const delay =
TEXT[index]===" "
? 120 + Math.random()*120
: 40 + Math.random()*90;

setTimeout(type,delay);

}

else{

headline.innerHTML=

TEXT.replace(/\n/g,"<br/>") +

'<span class="typing-cursor blink"></span>';

startConfetti();

logo.classList.add("shake");

}

}



/* ================= CONFETTI ENGINE ================= */

function emit(x:number,y:number,count:number,power:number){

for(let i=0;i<count;i++){

const angle=(Math.random()-0.5)*1.4 - Math.PI/2;

const velocity=power*(0.7+Math.random()*0.6);

particles.push({

x,
y,

vx:Math.cos(angle)*velocity,
vy:Math.sin(angle)*velocity,

w:6+Math.random()*4,
h:10+Math.random()*6,

gravity:.35,
drag:.99,

rotation:Math.random()*360,
rotationSpeed:(Math.random()-.5)*10,

life:220,

color:colors[Math.floor(Math.random()*colors.length)]

});

}

}



/* ================= BURST ================= */

function startConfetti(){

const cx=canvas.width/2;
const cy=canvas.height/3;

emit(cx,cy,140,18);

setTimeout(()=>emit(cx,cy,120,16),120);
setTimeout(()=>emit(cx,cy,100,14),240);
setTimeout(()=>emit(cx,cy,60,12),360);

}



/* ================= FIXED CURSOR CONFETTI ================= */

window.addEventListener("mousemove",(e)=>{

const rect=canvas.getBoundingClientRect();

emit(

e.clientX-rect.left,
e.clientY-rect.top,
4,
6

);

});



/* ================= ANIMATION LOOP ================= */

function animate(){

ctx.clearRect(0,0,canvas.width,canvas.height);

particles.forEach(p=>{

p.vx*=p.drag;
p.vy*=p.drag;

p.vy+=p.gravity;

p.x+=p.vx;
p.y+=p.vy;

p.rotation+=p.rotationSpeed;

p.life--;

ctx.save();

ctx.globalAlpha=p.life/220;

ctx.translate(p.x,p.y);

ctx.rotate(p.rotation*Math.PI/180);

ctx.fillStyle=p.color;

ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);

ctx.restore();

});

particles=particles.filter(p=>p.life>0);

requestAnimationFrame(animate);

}

animate();



/* ================= SCROLL START ================= */

const observer=new IntersectionObserver(

(entries)=>{

entries.forEach(entry=>{

if(entry.isIntersecting && !started){

started=true;

logo.classList.add("visible");

setTimeout(type,400);

}

});

},

{threshold:.6}

);

observer.observe(section);


},[]);



return(

<section ref={sectionRef} className="scroll-intro">

<canvas ref={canvasRef} id="canvas"/>

<div ref={logoRef} className="logo">

<img src="/images/logo.png" className="logo-img"/>

</div>

<h2 ref={headlineRef} id="headline"/>

</section>

);

};

export default ScrollIntro;
