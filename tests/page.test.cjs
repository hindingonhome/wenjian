const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles', 'atlas.css'), 'utf8');

test('inline scripts parse and no remote script or style is required', () => {
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].filter(m=>!/^<script\b[^>]*\bsrc=/.test(m[0]));
  assert.equal(scripts.length, 2);
  scripts.forEach((script, i) => assert.doesNotThrow(() => new vm.Script(script[1], { filename: `inline-${i}.js` })));
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)="https?:\/\//i);
});

test('ten distinct archive mechanisms each have a research URL', () => {
  const section = html.match(/const archive=\[([\s\S]*?)\];/);
  assert.ok(section);
  const entries = [...section[1].matchAll(/\{id:'([^']+)'[\s\S]*?url:'(https:\/\/[^']+)'/g)];
  assert.equal(entries.length, 10);
  assert.equal(new Set(entries.map(x => x[1])).size, 10);
  assert.equal(new Set(entries.map(x => x[2])).size, 10);
});

test('all ten metal concept images and the original user reference are local', () => {
  const ids = ['venation','colonization','selforg','reaction','dla','lsystem','phyllotaxis','physarum','neuralca','gca'];
  for (const id of ids) assert.ok(fs.existsSync(path.join(root, 'assets', `metal-${id}.png`)), `${id} render is present`);
  for (const id of ids) for (const view of ['left','front','right']) {
    assert.ok(fs.existsSync(path.join(root, 'assets', 'metal-views', `${id}-${view}.jpg`)), `${id} ${view} AI view is present`);
  }
  assert.ok(fs.existsSync(path.join(root, 'assets', 'colonization-concepts.png')));
  assert.ok(fs.existsSync(path.join(root, 'previews', '01_space_colonization_simulation.png')));
});

test('metal concept uses bounded multi-view AI images rather than a generated metal canvas', () => {
  assert.match(html, /id="view-angle"[^>]*type="range"[^>]*min="0"[^>]*max="2"/);
  assert.match(html, /id="case-image"/);
  assert.match(html, /id="export-metal-button"[^>]*>[^<]*导出当前 AI/);
  assert.doesNotMatch(html, /<canvas id="metal-canvas"/);
});

test('fixed navigation, universal controls, and local PNG export are present', () => {
  assert.match(css, /\.site-header\{position:sticky;top:0/);
  assert.match(html, /id="export-button"/);
  assert.match(html, /id="site-header"/);
  assert.match(html, /assets\/algorithm-previews\/\$\{item.id\}\.svg/);
  assert.doesNotMatch(html, /canvas\[data-study\]/);
  assert.doesNotMatch(html, /[↗→←↓↑]/);
  assert.match(html, /id="history-list"/);
  assert.match(html, /id="save-button"/);
  assert.match(html, /id="view-angle"/);
  assert.match(html, /id="metal-history-list"/);
  assert.match(html, /id="export-metal-button"/);
});

test('page scripts initialize the archive and working growth controls', () => {
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x => x[1]);
  const elements = new Map();
  const defaults = { 'point-count': '55', influence: '55', kill: '55', speed: '3', 'seed-input': '73', 'study-select': 'colonization', 'view-angle': '1' };
  const gradient={addColorStop(){}};
  const context2d = { clearRect(){}, fillRect(){}, beginPath(){}, moveTo(){}, lineTo(){}, stroke(){}, arc(){}, ellipse(){}, fill(){}, bezierCurveTo(){}, closePath(){}, scale(){}, save(){}, restore(){}, translate(){}, rotate(){}, createLinearGradient(){return gradient},createRadialGradient(){return gradient} };
  let downloaded='',scrolls=0;
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      value: defaults[id] || '', textContent: '', innerHTML: '', handlers: {}, dataset: {}, attributes: {}, listeners: {},
      addEventListener(event, fn) { (this.listeners[event] ||= []).push(fn); this.handlers[event] = (...args) => this.listeners[event].forEach(listener=>listener(...args)); },
      setAttribute(key,value){this.attributes[key]=value}, getAttribute(key){return this.attributes[key]},
      click(){this.handlers.click?.()},
      scrollIntoView() {},
      getContext() { return context2d; }, toDataURL() { return 'data:image/png;base64,abc'; }
    });
    return elements.get(id);
  }
  const filterButtons = ['all', 'network'].map(filter => ({
    dataset: { filter }, handlers: {}, classList: { toggle() {} },
    addEventListener(event, fn) { this.handlers[event] = fn; }
  }));
  const cards = [{ dataset: { group: 'network' }, hidden: false }, { dataset: { group: 'texture' }, hidden: false }];
  const cardButtons = [{ dataset: { id: 'venation' }, handlers: {}, addEventListener(event, fn) { this.handlers[event] = fn; } }];
  const context = vm.createContext({
    Math, document: { documentElement:{dataset:{}}, addEventListener(){}, getElementById: element, querySelectorAll: selector => selector === '.filter' ? filterButtons : selector === '.card' ? cards : selector === '.card-select' ? cardButtons : [], createElement: () => ({click(){downloaded=this.download},remove(){}}), body:{appendChild(){}} },
    matchMedia: () => ({ matches: false }), requestAnimationFrame() {}, setTimeout(fn){fn();return 1},clearTimeout(){}, window:{scrollTo(){scrolls++}},
  });
  scripts.forEach(script => vm.runInContext(script, context));
  assert.equal((element('archive-grid').innerHTML.match(/class="card"/g) || []).length, 10);
  assert.equal((element('references-list').innerHTML.match(/class="reference-item"/g) || []).length, 25);
  assert.equal(element('case-image').src, 'assets/metal-views/colonization-front.jpg');
  assert.ok(Number(element('stat-nodes').textContent)>1);
  element('play-button').handlers.click();
  assert.equal(element('run-status').textContent, '已暂停');
  element('step-button').handlers.click();
  assert.ok(Number(element('stat-iteration').textContent) >= 1);
  element('reset-button').handlers.click();
  assert.ok(Number(element('stat-iteration').textContent)>0);
  filterButtons[1].handlers.click();
  assert.equal(cards[0].hidden, false);
  assert.equal(cards[1].hidden, true);
  element('study-select').value = 'reaction';
  element('study-select').handlers.change();
  assert.equal(element('case-image').src, 'assets/metal-views/reaction-front.jpg');
  element('view-angle').value='0';element('view-angle').handlers.input();
  assert.equal(element('case-image').src,'assets/metal-views/reaction-left.jpg');
  assert.match(element('view-angle-label').textContent,/左偏/);
  assert.notEqual(element('canvas-area').hidden, true);
  assert.match(element('method-caveat').textContent,/简化/);
  element('export-button').handlers.click();
  assert.match(downloaded,/growth-atlas-reaction-seed-73\.png/);
  element('export-metal-button').handlers.click();
  assert.match(downloaded,/growth-atlas-concept-reaction-left\.jpg/);
  element('point-count').value='83';element('point-count').handlers.input();
  assert.equal(element('count-value').textContent,'83');
  assert.match(element('stat-points').textContent,/83/);
  element('site-header').handlers.click({target:{id:'topbar-inner'}});
  assert.equal(scrolls,1);
  assert.match(element('case-title').textContent, /反应扩散/);
  cardButtons[0].handlers.click();
  assert.equal(element('case-image').src, 'assets/metal-views/venation-front.jpg');
  element('case-next').handlers.click();
  assert.equal(element('case-image').src, 'assets/metal-views/colonization-front.jpg');
  element('view-next').handlers.click();
  assert.equal(element('case-image').src, 'assets/metal-views/colonization-right.jpg');
  assert.equal(element('view-next').disabled,true);
  element('view-prev').handlers.click();
  assert.equal(element('case-image').src, 'assets/metal-views/colonization-front.jpg');
  for(const id of ['venation','colonization','selforg','reaction','dla','lsystem','phyllotaxis','physarum','neuralca','gca']){
    element('study-select').value=id;element('study-select').handlers.change();
    assert.match(element('case-image').src,new RegExp(`assets/metal-views/${id}-(left|front|right)\\.jpg`));
    assert.ok(element('lab-description').textContent.length>65, `${id} has a useful introduction`);
    assert.ok(element('lab-description').textContent.length<200, `${id} introduction is concise`);
    assert.equal((element('lab-materials').innerHTML.match(/target="_blank"/g)||[]).length,2,`${id} has original and related research links`);
    const referenceHtml=element('references-list').innerHTML;
    const coreIndex=referenceHtml.indexOf(`id="ref-${String(['venation','colonization','selforg','reaction','dla','lsystem','phyllotaxis','physarum','neuralca','gca'].indexOf(id)+1).padStart(2,'0')}"`);
    const extensionIndex=referenceHtml.indexOf('id="ref-r01"');
    assert.ok(coreIndex>=0&&coreIndex<extensionIndex,`${id} core research appears before extensions`);
    const coreItem=referenceHtml.slice(coreIndex,referenceHtml.indexOf('</div></div>',coreIndex)+12);
    assert.match(coreItem,/class="reference-significance"/,`${id} core entry explains its relevance`);
    element('export-button').handlers.click();
    assert.match(downloaded,new RegExp(`growth-atlas-${id}-seed-73\\.png`));
  }
  const referenceItems=[...element('references-list').innerHTML.matchAll(/class="reference-item" id="ref-(\d\d)"/g)].map(match=>match[1]);
  assert.deepEqual(referenceItems.slice(0,10),['01','02','03','04','05','06','07','08','09','10']);
  element('study-select').value='reaction';element('study-select').handlers.change();
  assert.equal(Number(element('point-count').value),83,'reaction restores its own density');
  assert.equal(element('case-image').src,'assets/metal-views/reaction-left.jpg','reaction restores its view');
  element('theme-toggle').handlers.click();
  assert.equal(element('theme-toggle').attributes['aria-pressed'],'true');
  assert.equal(Number(element('point-count').value),83,'theme does not reset parameters');
  element('theme-toggle').handlers.click();
  assert.equal(element('theme-toggle').attributes['aria-pressed'],'false');
  element('study-select').value='gca';element('study-select').handlers.change();
  element('save-button').handlers.click();
  assert.match(element('history-list').innerHTML,/data-history-index="0"/);
  assert.match(element('metal-history-list').innerHTML,/data-history-index="0"/);
  assert.equal(element('history-count').textContent,'1 / 5');
  for(let seed=101;seed<=106;seed++){
    element('seed-input').value=String(seed);element('apply-seed').handlers.click();element('save-button').handlers.click();
  }
  assert.equal(element('history-count').textContent,'5 / 5');
  assert.equal(element('metal-history-count').textContent,'5 / 5');
  element('history-list').handlers.click({target:{closest(){return {dataset:{historyIndex:'1'}}}}});
  assert.equal(element('seed-input').value,105);
  element('metal-history-list').handlers.click({target:{closest(){return {dataset:{historyIndex:'2'}}}}});
  assert.equal(element('seed-input').value,104);
});
