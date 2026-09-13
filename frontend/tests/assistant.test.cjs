const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: (name) => dependencies[name], process: { env: {} },
    AbortController, AbortSignal, ...globals });
  return exports;
}

test('assistant API sends empty context and selected station or null, and validates responses', async () => {
  const calls = [];
  let result = { ok: true, json: async () => ({ answer: 'Jawaban tersedia.' }) };
  const api = load('src/lib/assistant-api.ts', {}, { fetch: async (url, options) => {
    calls.push({ url, options }); return result;
  } });
  for (const station of [null, 'TBT']) {
    assert.equal(await api.askAssistant('Pertanyaan', station, new AbortController().signal), 'Jawaban tersedia.');
    assert.deepEqual(JSON.parse(calls.at(-1).options.body), { question: 'Pertanyaan', context: {}, station_id: station });
    assert.match(calls.at(-1).url, /\/api\/v1\/assistant$/);
  }
  result = { ok: false };
  await assert.rejects(api.askAssistant('Tes', null, new AbortController().signal));
  result = { ok: true, json: async () => ({ answer: '' }) };
  await assert.rejects(api.askAssistant('Tes', null, new AbortController().signal));
});

// Exercise handlers with lightweight hook/JSX adapters; no browser or live API.
function harness() {
  const slots = [];
  let cursor = 0;
  const calls = [];
  let resolve, reject;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], (next) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useEffect() {}, useId: () => 'chat-panel',
  };
  const jsx = (type, props) => ({ type, props });
  const { AssistantChat } = load('src/components/assistant/assistant-chat.tsx', {
    react, 'react/jsx-runtime': { jsx, jsxs: jsx }, '../ui/button': { Button: 'Button' },
    '../../lib/assistant-api': { askAssistant: (...args) => {
      calls.push(args); return new Promise((yes, no) => { resolve = yes; reject = no; });
    } },
  });
  return { calls, render(stationId = null) { cursor = 0; return AssistantChat({ stationId }); },
    resolve: (answer) => resolve(answer), reject: () => reject(new Error('failure')) };
}
function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}
function find(tree, predicate) { return nodes(tree).find(predicate); }
const flush = () => new Promise(setImmediate);

test('chat opens/closes, FAQ submits with station, duplicate submit is blocked, and answer is shown', async () => {
  const chat = harness();
  let tree = chat.render('TBT');
  assert.equal(find(tree, (n) => n.props.role === 'dialog'), undefined);
  find(tree, (n) => n.props['aria-controls']).props.onClick();
  tree = chat.render('TBT');
  assert.ok(find(tree, (n) => n.props.role === 'dialog'));
  const faq = find(tree, (n) => n.props.children === 'Apa itu Safety Score?');
  faq.props.onClick(); faq.props.onClick();
  assert.equal(chat.calls.length, 1);
  assert.equal(chat.calls[0][0], 'Apa itu Safety Score?');
  assert.equal(chat.calls[0][1], 'TBT');
  tree = chat.render('TBT');
  assert.ok(find(tree, (n) => n.props.role === 'status'));
  assert.equal(find(tree, (n) => n.props.type === 'submit').props.disabled, true);
  chat.resolve('Skor dari data yang tersedia.'); await flush();
  tree = chat.render('TBT');
  assert.ok(JSON.stringify(tree).includes('Skor dari data yang tersedia.'));
  find(tree, (n) => n.props['aria-label'] === 'Tutup Commute.ly Assistant').props.onClick();
  assert.equal(find(chat.render(), (n) => n.props.role === 'dialog'), undefined);
});

test('normal question uses latest station, Shift+Enter does not send, errors restore draft, Escape closes', async () => {
  const chat = harness();
  find(chat.render(), (n) => n.props['aria-controls']).props.onClick();
  let tree = chat.render();
  find(tree, (n) => n.type === 'textarea').props.onChange({ target: { value: '  Bagaimana perjalanan saya?  ' } });
  tree = chat.render();
  const input = find(tree, (n) => n.type === 'textarea');
  input.props.onKeyDown({ key: 'Enter', shiftKey: true });
  assert.equal(chat.calls.length, 0);
  input.props.onKeyDown({ key: 'Enter', shiftKey: false, nativeEvent: { isComposing: false }, preventDefault() {} });
  assert.equal(chat.calls[0][0], 'Bagaimana perjalanan saya?');
  assert.equal(chat.calls[0][1], null);
  chat.reject(); await flush();
  tree = chat.render('TBT');
  assert.ok(find(tree, (n) => n.props.role === 'alert'));
  assert.equal(find(tree, (n) => n.type === 'textarea').props.value, 'Bagaimana perjalanan saya?');
  find(tree, (n) => n.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(chat.calls[1][1], 'TBT');
  chat.resolve('Jawaban'); await flush();
  tree = chat.render();
  tree.props.onKeyDown({ key: 'Escape', stopPropagation() {} });
  assert.equal(find(chat.render(), (n) => n.props.role === 'dialog'), undefined);
});
