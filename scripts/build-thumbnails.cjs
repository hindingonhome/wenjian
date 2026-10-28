const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const engine=html.match(/<script id="growth-engine">([\s\S]*?)<\/script>/)[1];
const palette=html.slice(html.indexOf('    const graphPalettes='),html.indexOf("    let currentTheme="));
const drawing=html.slice(html.indexOf('    function drawLine('),html.indexOf('    function render()'));
const context=vm.createContext({Math});vm.runInContext(engine+'\n'+palette+'\nlet drawingColors=graphPalettes.light;\n'+drawing+'\nglobalThis.api={createStudy,advanceStudy,drawStudy};',context);
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;');
class SVGCanvas{constructor(){this.elements=[];this.path='';this.lineWidth=1;this.fillStyle='#000';this.strokeStyle='#000'}fillRect(x,y,w,h){this.elements.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${escape(this.fillStyle)}"/>`)}beginPath(){this.path=''}moveTo(x,y){this.path+=`M${x},${y}`}lineTo(x,y){this.path+=`L${x},${y}`}bezierCurveTo(a,b,c,d,e,f){this.path+=`C${a},${b} ${c},${d} ${e},${f}`}closePath(){this.path+='Z'}arc(x,y,r){this.path+=`M${x-r},${y}a${r},${r} 0 1,0 ${r*2},0a${r},${r} 0 1,0 ${-r*2},0`}fill(){this.elements.push(`<path d="${this.path}" fill="${escape(this.fillStyle)}"/>`)}stroke(){this.elements.push(`<path d="${this.path}" fill="none" stroke="${escape(this.strokeStyle)}" stroke-width="${this.lineWidth}" stroke-linecap="round" stroke-linejoin="round"/>`)}svg(){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">${this.elements.join('')}</svg>`}}
const ids=['venation','colonization','selforg','reaction','dla','lsystem','phyllotaxis','physarum','neuralca','gca'],steps=[160,210,20,850,200,75,60,110,90,70];
fs.mkdirSync(path.join(root,'assets/algorithm-previews'),{recursive:true});
ids.forEach((id,i)=>{const s=context.api.createStudy(id,{seed:73,density:60,spread:55,detail:55});for(let n=0;n<steps[i]&&s.running;n++)context.api.advanceStudy(s);const canvas=new SVGCanvas();context.api.drawStudy(canvas,s);fs.writeFileSync(path.join(root,'assets/algorithm-previews',id+'.svg'),canvas.svg())});
console.log('Built 10 static algorithm previews.');
