/* Product navigation and presentation. The research engines keep their coordinates. */
(() => {
  const byId=id=>document.getElementById(id);
  const menu=byId('algorithm-menu'),trigger=byId('algorithm-menu-trigger'),scrim=byId('algorithm-menu-scrim');
  const grid=byId('algorithm-menu-grid');document.body.append(byId('history-drawer'),byId('live-controls'));
  grid.innerHTML=archive.map((item,i)=>`<button type="button" class="algorithm-choice" data-algorithm="${item.id}" aria-pressed="false"><img src="assets/algorithm-previews/${item.id}.svg" alt="" loading="lazy"><span class="algorithm-choice-number">${String(i+1).padStart(2,'0')}</span><strong>${item.name}</strong><span lang="en">${item.en}</span></button>`).join('');
  let leaveTimer,lastPanelTrigger;
  function setMenu(open,focus=false){if(open)closePanels();clearTimeout(leaveTimer);menu.open=open;trigger.setAttribute('aria-expanded',String(open));scrim.hidden=!open;if(!open&&focus)trigger.focus({preventScroll:true})}
  menu.addEventListener('toggle',()=>{scrim.hidden=!menu.open;trigger.setAttribute('aria-expanded',String(menu.open))});
  menu.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){clearTimeout(leaveTimer);setMenu(true)}});
  menu.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse')leaveTimer=setTimeout(()=>{if(!menu.contains(document.activeElement))setMenu(false)},180)});
  scrim.addEventListener('click',()=>setMenu(false,true));
  function closePanels(focus=false){byId('history-drawer').hidden=true;byId('live-controls').hidden=true;byId('history-toggle').setAttribute('aria-expanded','false');byId('parameters-toggle').setAttribute('aria-expanded','false');byId('case-history-toggle').setAttribute('aria-expanded','false');if(focus)lastPanelTrigger?.focus({preventScroll:true})}
  function togglePanel(id,button){const open=byId(id).hidden;closePanels();byId(id).hidden=!open;button.setAttribute('aria-expanded',String(open));if(id==='history-drawer'){byId('history-toggle').setAttribute('aria-expanded',String(open));byId('case-history-toggle').setAttribute('aria-expanded',String(open))}lastPanelTrigger=button;setMenu(false);if(open)byId(id).querySelector('button,input')?.focus({preventScroll:true})}
  byId('history-toggle').addEventListener('click',()=>togglePanel('history-drawer',byId('history-toggle')));
  byId('parameters-toggle').addEventListener('click',()=>togglePanel('live-controls',byId('parameters-toggle')));byId('case-history-toggle').addEventListener('click',()=>togglePanel('history-drawer',byId('case-history-toggle')));
  document.querySelectorAll('[data-close-panel]').forEach(button=>button.addEventListener('click',()=>closePanels(true)));
  grid.addEventListener('click',event=>{const button=event.target.closest('button[data-algorithm]');if(!button)return;selectStudy(button.dataset.algorithm);closePanels();setMenu(false,true);sync();byId('laboratory').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})});
  grid.addEventListener('keydown',event=>{const buttons=[...grid.querySelectorAll('button')],index=buttons.indexOf(document.activeElement);if(index<0)return;const columns=getComputedStyle(grid).gridTemplateColumns.split(' ').length;let next=index;
    if(event.key==='ArrowRight')next++;else if(event.key==='ArrowLeft')next--;else if(event.key==='ArrowDown')next+=columns;else if(event.key==='ArrowUp')next-=columns;else if(event.key==='Home')next=0;else if(event.key==='End')next=buttons.length-1;else return;
    event.preventDefault();buttons[Math.max(0,Math.min(buttons.length-1,next))].focus();
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(menu.open)setMenu(false,true);else if(!byId('history-drawer').hidden||!byId('live-controls').hidden)closePanels(true)}});
  document.addEventListener('click',event=>{if(menu.open&&!menu.contains(event.target))setMenu(false);if(!byId('history-drawer').contains(event.target)&&!byId('live-controls').contains(event.target)&&!event.target.closest('#history-toggle,#parameters-toggle,#case-history-toggle'))closePanels()});
  const ranges=[['point-count','count-value','density-label'],['influence','influence-value','spread-label'],['kill','kill-value','detail-label'],['speed','speed-value','speed-label']];
  function decorate(range){range.style.setProperty('--range-fill',`${100*(Number(range.value)-Number(range.min))/(Number(range.max)-Number(range.min))}%`)}
  for(const [rangeId,valueId,labelId]of ranges){const range=byId(rangeId),number=byId(valueId);range.setAttribute('aria-labelledby',labelId);range.addEventListener('input',()=>{number.value=range.value;decorate(range)});
    number.addEventListener('change',()=>{const value=Number(number.value);number.value=String(Math.max(Number(range.min),Math.min(Number(range.max),Number.isFinite(value)?Math.round(value):Number(range.value))));range.value=number.value;range.dispatchEvent(new Event('input',{bubbles:true}))});
    number.addEventListener('keydown',event=>{if(event.key==='Enter'){number.blur()}if(event.key==='Escape'){number.value=range.value;number.blur()}});
  }
  let previousId;
  function sync(){const item=archive.find(item=>item.id===selectedId);const changed=previousId!==selectedId;
    if(changed){byId('nav-algorithm-name').textContent=item.name;document.title=item.name+' · 纹间';grid.querySelectorAll('[data-algorithm]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.algorithm===selectedId)));closePanels();previousId=selectedId}
    const historyLabel=currentHistory().length+' / 5';if(byId('history-toggle-count').textContent!==historyLabel)byId('history-toggle-count').textContent=historyLabel;byId('case-history-count').textContent=historyLabel;
    for(const [rangeId,valueId,labelId]of ranges){const range=byId(rangeId),number=byId(valueId);if(document.activeElement!==number&&number.value!==range.value)number.value=range.value;if(changed)number.setAttribute('aria-label',byId(labelId).textContent+'数值');decorate(range)}
  }
  window.productUI={sync,closePanels,setMenu};
  // Adapt physical pixels, keeping algorithm geometry and results unchanged.
  render=()=>{const pageWidth=document.documentElement.clientWidth+'px';if(document.documentElement.style.getPropertyValue('--page-width')!==pageWidth)document.documentElement.style.setProperty('--page-width',pageWidth);const rect=canvas.getBoundingClientRect();if(rect.width<1||rect.height<1)return;const ratio=Math.min(window.devicePixelRatio||1,2,Math.sqrt(8000000/(rect.width*rect.height)));const width=Math.round(rect.width*ratio),height=Math.round(rect.height*ratio);if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;
    ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=drawingColors.bg;ctx.fillRect(0,0,width,height);const scale=Math.min(width/900,height/600)*.95;ctx.setTransform(scale,0,0,scale,(width-900*scale)/2,(height-600*scale)/2);drawStudy(ctx,state);ctx.setTransform(1,0,0,1,0,0);
  };
  // Breakout width must follow resize immediately, even while a hidden window delays animation frames.
  let resizePending=false;const resize=()=>{document.documentElement.style.setProperty('--page-width',document.documentElement.clientWidth+'px');if(resizePending)return;resizePending=true;requestAnimationFrame(()=>{resizePending=false;render()})};
  const observer=new ResizeObserver(resize);observer.observe(canvas);window.addEventListener('resize',resize);
  byId('view-angle').addEventListener('input',event=>decorate(event.target));
  const updateView=updateConceptView;updateConceptView=index=>{updateView(index);decorate(byId('view-angle'))};
  sync();decorate(byId('view-angle'));render();
})();
