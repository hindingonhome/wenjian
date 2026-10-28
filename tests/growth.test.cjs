const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function engine() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const script = html.match(/<script id="growth-engine">([\s\S]*?)<\/script>/);
  assert.ok(script, 'growth engine script is present');
  const context = vm.createContext({ Math });
  vm.runInContext(`${script[1]}\n globalThis.engine = { createColony, advanceColony, createStudy, advanceStudy, studySignature };`, context);
  return context.engine;
}

test('same seed and settings yield the same initial attraction points', () => {
  const { createColony } = engine();
  const a = createColony({ seed: 73, pointCount: 420, influence: 100, kill: 13 });
  const b = createColony({ seed: 73, pointCount: 420, influence: 100, kill: 13 });
  assert.equal(a.points.length, 420);
  assert.deepEqual(JSON.stringify(a.points), JSON.stringify(b.points));
  assert.equal(a.nodes.length, 1);
});

test('all ten studies grow and respond to seed and morphology controls', () => {
  const { createStudy, advanceStudy, studySignature } = engine();
  const ids = ['venation','colonization','selforg','reaction','dla','lsystem','phyllotaxis','physarum','neuralca','gca'];
  for (const id of ids) {
    const settings = {seed:73,density:55,spread:55,detail:55};
    const state = createStudy(id, settings);
    const initial = studySignature(state);
    for (let i=0;i<12;i++) advanceStudy(state);
    const grown = studySignature(state);
    assert.notEqual(grown, initial, `${id} grows`);
    const alternate = createStudy(id, {...settings, seed:74});
    for (let i=0;i<12;i++) advanceStudy(alternate);
    assert.notEqual(studySignature(alternate), grown, `${id} seed changes result`);
    const tuned = createStudy(id, {...settings, density:80, spread:25, detail:75});
    for (let i=0;i<12;i++) advanceStudy(tuned);
    assert.notEqual(studySignature(tuned), grown, `${id} sliders change result`);
  }
});

test('growth is rooted and uses the configured segment length', () => {
  const { createColony, advanceColony } = engine();
  const state = createColony({ seed: 73, pointCount: 420, influence: 100, kill: 13 });
  for (let i = 0; i < 90 && state.running; i++) advanceColony(state);
  assert.ok(state.nodes.length > 40, `expected visible growth, got ${state.nodes.length}`);
  for (let i = 1; i < state.nodes.length; i++) {
    const node = state.nodes[i];
    assert.ok(node.parent >= 0 && node.parent < i);
    const parent = state.nodes[node.parent];
    assert.ok(Math.abs(Math.hypot(node.x - parent.x, node.y - parent.y) - state.step) < 0.001);
  }
});

test('branches consume attraction points as they grow', () => {
  const { createColony, advanceColony } = engine();
  const state = createColony({ seed: 73, pointCount: 420, influence: 100, kill: 13 });
  for (let i = 0; i < 150 && state.running; i++) advanceColony(state);
  assert.ok(state.points.length < 420, `expected points to be consumed, got ${state.points.length}`);
  assert.ok(state.iteration > 0);
});

test('L system uses a rewritten fern grammar rather than tree tip splitting', () => {
  const { createStudy, advanceStudy } = engine();
  const state = createStudy('lsystem', { seed: 73, density: 70, spread: 40, detail: 55 });
  assert.match(state.data.grammar, /\[|\+|-/);
  assert.ok(state.data.segments.length > 100);
  assert.equal(state.data.visible, 0);
  advanceStudy(state);
  assert.ok(state.data.visible > 0);
  assert.ok(state.data.visible < state.data.segments.length);
});

test('neural CA forms a porous target and visibly regenerates after damage', () => {
  const { createStudy, advanceStudy } = engine();
  const state = createStudy('neuralca', { seed: 624589, density: 92, spread: 25, detail: 55 });
  for(let i=0;i<95;i++) advanceStudy(state);
  const d=state.data;
  const before=d.cells.reduce((sum,value)=>sum+(value>0),0);
  assert.ok(before>120, `expected grown cell pattern, got ${before}`);
  assert.ok(before<1800, `expected porous pattern, got ${before}`);
  advanceStudy(state);
  const damaged=d.cells.reduce((sum,value)=>sum+(value>0),0);
  assert.equal(d.damageEvents,1);
  assert.ok(damaged<before, `expected visible damage, got ${before} -> ${damaged}`);
  for(let i=0;i<25;i++) advanceStudy(state);
  const healed=d.cells.reduce((sum,value)=>sum+(value>0),0);
  assert.ok(healed>damaged, `expected regeneration, got ${damaged} -> ${healed}`);
  const sparse=createStudy('neuralca',{seed:624589,density:15,spread:25,detail:55});
  const dense=createStudy('neuralca',{seed:624589,density:92,spread:25,detail:55});
  assert.ok(dense.data.target.reduce((a,b)=>a+b,0)>sparse.data.target.reduce((a,b)=>a+b,0),'density changes the mature cellular texture');
});
