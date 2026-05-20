import { useMemo, useState } from 'react';

type FingerEntry = {
  index: number;
  start: number;
  successor: number;
};

type RouteStep = {
  from: number;
  to: number;
  reason: string;
};

const DEFAULT_M = 5;
const DEFAULT_NODES = '1, 4, 9, 11, 14, 18, 20, 21, 28';
const DEFAULT_START_NODE = 9;
const DEFAULT_LOOKUP_KEY = 30;

const conceptCards = [
  {
    label: 'hash space',
    value: '2^m slots',
    text: 'Keys and node IDs live on the same circular identifier space.',
  },
  {
    label: 'ownership',
    value: '(pred, node]',
    text: 'A node stores every key after its predecessor up to itself.',
  },
  {
    label: 'routing',
    value: 'finger jumps',
    text: 'Each hop forwards to the best known node before the destination.',
  },
  {
    label: 'deployment',
    value: 'pod per node',
    text: 'The README packages every Chord node as a Flask service in Kubernetes.',
  },
];

const deploymentStages = [
  { icon: 'code', label: 'Flask node', detail: 'POST /lookup executes localSuccNode(key).' },
  { icon: 'deployed_code', label: 'Docker image', detail: 'The same Python node runs in a portable container.' },
  { icon: 'dns', label: 'Kubernetes pods', detail: 'Each pod gets NODE_ID, PRED_ID, and FINGER_TABLE env vars.' },
  { icon: 'lan', label: 'Service access', detail: 'A client can query any node; routing finds the owner.' },
];

const normalize = (value: number, modulo: number) => ((value % modulo) + modulo) % modulo;

const parseNodes = (value: string, modulo: number) => {
  const seen = new Set<number>();

  value
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const parsed = Number(part);
      if (Number.isInteger(parsed)) {
        seen.add(normalize(parsed, modulo));
      }
    });

  return Array.from(seen).sort((a, b) => a - b);
};

const inRange = (start: number, key: number, end: number) => {
  if (start < end) {
    return start < key && key <= end;
  }

  return start < key || key <= end;
};

const successorOf = (key: number, nodes: number[], modulo: number) => {
  const normalizedKey = normalize(key, modulo);
  return nodes.find((node) => node >= normalizedKey) ?? nodes[0];
};

const predecessorOf = (node: number, nodes: number[]) => {
  const index = nodes.indexOf(node);
  return nodes[(index - 1 + nodes.length) % nodes.length];
};

const buildFingerTable = (node: number, nodes: number[], m: number) => {
  const modulo = 2 ** m;

  return Array.from({ length: m }, (_, index) => {
    const start = normalize(node + 2 ** index, modulo);
    return {
      index,
      start,
      successor: successorOf(start, nodes, modulo),
    };
  });
};

const localSuccNode = (
  node: number,
  key: number,
  predecessor: number,
  fingerTable: FingerEntry[],
  modulo: number,
) => {
  const keyMod = normalize(key, modulo);

  if (inRange(predecessor, keyMod, node)) {
    return { next: node, reason: `key ${keyMod} is in (${predecessor}, ${node}]` };
  }

  if (inRange(node, keyMod, fingerTable[0].successor)) {
    return {
      next: fingerTable[0].successor,
      reason: `successor ${fingerTable[0].successor} owns (${node}, ${fingerTable[0].successor}]`,
    };
  }

  for (let index = 0; index < fingerTable.length - 1; index += 1) {
    const current = fingerTable[index].successor;
    const next = fingerTable[index + 1].successor;

    if (current !== next && inRange(current, keyMod, next)) {
      return { next: current, reason: `closest preceding finger before ${next}` };
    }
  }

  return {
    next: fingerTable[fingerTable.length - 1].successor,
    reason: 'fallback to highest finger entry',
  };
};

const buildRoute = (startNode: number, key: number, nodes: number[], m: number) => {
  const modulo = 2 ** m;
  const steps: RouteStep[] = [];
  const trail = [startNode];
  let current = startNode;

  for (let hop = 0; hop < nodes.length + 1; hop += 1) {
    const predecessor = predecessorOf(current, nodes);
    const fingerTable = buildFingerTable(current, nodes, m);
    const decision = localSuccNode(current, key, predecessor, fingerTable, modulo);

    if (decision.next === current) {
      return { responsibleNode: current, trail, steps };
    }

    steps.push({ from: current, to: decision.next, reason: decision.reason });
    trail.push(decision.next);
    current = decision.next;

    if (trail.filter((node) => node === current).length > 1) {
      break;
    }
  }

  return { responsibleNode: successorOf(key, nodes, modulo), trail, steps };
};

const nodePosition = (node: number, modulo: number, radius: number) => {
  const angle = (node / modulo) * 2 * Math.PI - Math.PI / 2;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
};

function App() {
  const [m, setM] = useState(DEFAULT_M);
  const [nodeInput, setNodeInput] = useState(DEFAULT_NODES);
  const [startNode, setStartNode] = useState(DEFAULT_START_NODE);
  const [lookupKey, setLookupKey] = useState(DEFAULT_LOOKUP_KEY);

  const modulo = 2 ** m;
  const nodes = useMemo(() => parseNodes(nodeInput, modulo), [nodeInput, modulo]);
  const safeStartNode = nodes.includes(startNode) ? startNode : nodes[0];
  const keyMod = normalize(lookupKey, modulo);

  const route = useMemo(() => {
    if (nodes.length === 0 || safeStartNode === undefined) {
      return { responsibleNode: null, trail: [] as number[], steps: [] as RouteStep[] };
    }

    return buildRoute(safeStartNode, lookupKey, nodes, m);
  }, [lookupKey, m, nodes, safeStartNode]);

  const selectedFingerTable = useMemo(() => {
    if (nodes.length === 0 || safeStartNode === undefined) {
      return [] as FingerEntry[];
    }

    return buildFingerTable(safeStartNode, nodes, m);
  }, [m, nodes, safeStartNode]);

  const selectedPredecessor =
    nodes.length > 0 && safeStartNode !== undefined ? predecessorOf(safeStartNode, nodes) : undefined;
  const responsiblePredecessor =
    nodes.length > 0 && route.responsibleNode !== null ? predecessorOf(route.responsibleNode, nodes) : undefined;
  const linearProbeCost = nodes.length;
  const routeHopCost = Math.max(route.trail.length - 1, 0);

  const trailSet = new Set(route.trail);
  const activeEdges = route.steps.map((step) => {
    const from = nodePosition(step.from, modulo, 230);
    const to = nodePosition(step.to, modulo, 230);
    return { ...step, from, to };
  });

  const visibleSlots = Array.from({ length: modulo }, (_, id) => {
    const point = nodePosition(id, modulo, 230);
    const isMember = nodes.includes(id);
    const isStart = id === safeStartNode;
    const isTarget = id === route.responsibleNode;
    const isTrail = trailSet.has(id);

    return { id, ...point, isMember, isStart, isTarget, isTrail };
  });

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface">
      <header className="fixed left-0 top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/10 bg-surface/70 px-gutter backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <span className="font-label-caps text-label-caps tracking-widest text-primary">DHT_CORE_VISUALIZER</span>
          <span className="hidden rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1 font-data-mono text-[11px] text-on-surface-variant md:block">
            Chord modulo {modulo}
          </span>
        </div>
        <div className="flex items-center gap-5 font-data-mono text-[11px] text-tertiary">
          <span className="hidden sm:inline">pods: {nodes.length}</span>
          <span>nodes: {nodes.length}</span>
          <span>hops: {Math.max(route.trail.length - 1, 0)}</span>
        </div>
      </header>

      <aside className="custom-scrollbar relative z-40 mt-16 flex w-full flex-col gap-5 border-b border-white/10 bg-surface-container-low/40 p-panel-padding backdrop-blur-xl lg:fixed lg:left-0 lg:top-16 lg:mt-0 lg:h-[calc(100vh-64px)] lg:w-72 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <section>
          <h1 className="font-headline-md text-headline-md text-primary">Chord Lab 3</h1>
          <p className="mt-1 font-data-mono text-data-mono text-on-surface-variant/70">
            Kubernetes-backed distributed hash table
          </p>
        </section>

        <section className="grid grid-cols-2 gap-2">
          {conceptCards.map((card) => (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3" key={card.label}>
              <div className="font-label-caps text-[9px] uppercase text-on-surface-variant/60">{card.label}</div>
              <div className="mt-1 font-data-mono text-[12px] text-primary">{card.value}</div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <label className="block space-y-2">
            <span className="font-label-caps text-[10px] uppercase text-on-surface-variant/70">Identifier bits</span>
            <select
              className="w-full rounded-lg border border-white/10 bg-surface-container-lowest/60 p-2 font-data-mono text-sm text-primary outline-none focus:border-primary"
              value={m}
              onChange={(event) => setM(Number(event.target.value))}
            >
              {[3, 4, 5, 6].map((value) => (
                <option key={value} value={value}>
                  m = {value} ({2 ** value} slots)
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="font-label-caps text-[10px] uppercase text-on-surface-variant/70">Active nodes</span>
            <textarea
              className="min-h-24 w-full resize-none rounded-lg border border-white/10 bg-surface-container-lowest/60 p-2 font-data-mono text-sm text-primary outline-none focus:border-primary"
              value={nodeInput}
              onChange={(event) => setNodeInput(event.target.value)}
            />
          </label>

          <label className="block space-y-2">
            <span className="font-label-caps text-[10px] uppercase text-on-surface-variant/70">Start node</span>
            <select
              className="w-full rounded-lg border border-white/10 bg-surface-container-lowest/60 p-2 font-data-mono text-sm text-primary outline-none focus:border-primary"
              value={safeStartNode ?? ''}
              onChange={(event) => setStartNode(Number(event.target.value))}
            >
              {nodes.map((node) => (
                <option key={node} value={node}>
                  node {node}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="font-label-caps text-[10px] uppercase text-on-surface-variant/70">Lookup key</span>
            <input
              className="w-full rounded-lg border border-white/10 bg-surface-container-lowest/60 p-2 font-data-mono text-sm text-primary outline-none focus:border-primary"
              min={0}
              type="number"
              value={lookupKey}
              onChange={(event) => setLookupKey(Number(event.target.value))}
            />
          </label>

          <button
            className="w-full rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 font-label-caps text-[10px] uppercase text-primary transition hover:bg-primary/20"
            onClick={() => {
              setM(DEFAULT_M);
              setNodeInput(DEFAULT_NODES);
              setStartNode(DEFAULT_START_NODE);
              setLookupKey(DEFAULT_LOOKUP_KEY);
            }}
            type="button"
          >
            Load README topology
          </button>
        </section>

        <section className="glass-panel rounded-xl p-4">
          <div className="font-label-caps text-[10px] uppercase text-on-surface-variant/70">Python logic mirror</div>
          <div className="mt-3 space-y-2 font-data-mono text-[12px] text-on-surface-variant">
            <div>key_mod = {keyMod}</div>
            <div>trail = {route.trail.length ? route.trail.join(' -> ') : 'none'}</div>
            <div className="text-tertiary">responsible = {route.responsibleNode ?? 'n/a'}</div>
          </div>
        </section>

        <section className="glass-panel rounded-xl p-4">
          <div className="font-label-caps text-[10px] uppercase text-on-surface-variant/70">Distributed meaning</div>
          <p className="mt-3 text-sm leading-5 text-on-surface-variant/80">
            Node {safeStartNode ?? 'n/a'} answers with only its predecessor and finger table. The lookup moves across
            independent nodes instead of scanning the full cluster.
          </p>
        </section>
      </aside>

      <main className="relative flex h-[560px] items-center justify-center overflow-hidden lg:ml-72 lg:mr-96 lg:h-screen lg:pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_24%,rgba(168,232,255,0.10),transparent_32%),radial-gradient(circle_at_75%_72%,rgba(0,254,170,0.08),transparent_28%)]" />

        <section className="relative h-[min(86vw,560px)] w-[min(86vw,560px)] min-w-[320px] lg:h-[min(72vw,680px)] lg:w-[min(72vw,680px)] lg:min-w-[520px]">
          <svg className="absolute inset-0 h-full w-full" viewBox="-300 -300 600 600">
            <circle cx="0" cy="0" fill="none" r="230" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <circle cx="0" cy="0" fill="none" r="252" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
            {activeEdges.map((edge) => (
              <line
                className="route-line"
                key={`${edge.from.x}-${edge.to.x}-${edge.reason}`}
                stroke="var(--neon-purple)"
                strokeLinecap="round"
                strokeWidth="2"
                x1={edge.from.x}
                x2={edge.to.x}
                y1={edge.from.y}
                y2={edge.to.y}
              />
            ))}
          </svg>

          <div className="absolute inset-0">
            {visibleSlots.map((slot) => (
              <button
                aria-label={`slot ${slot.id}`}
                className={`absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all ${
                  slot.isMember
                    ? 'border-primary/50 bg-primary shadow-[0_0_12px_rgba(168,232,255,0.55)]'
                    : 'border-white/10 bg-surface-container-highest/50'
                } ${slot.isTrail ? 'scale-125 border-secondary bg-secondary shadow-[0_0_14px_rgba(237,177,255,0.7)]' : ''} ${
                  slot.isTarget ? 'node-pulse border-tertiary bg-tertiary shadow-[0_0_18px_rgba(0,254,170,0.85)]' : ''
                } ${slot.isStart ? 'ring-2 ring-secondary/60' : ''}`}
                key={slot.id}
                onClick={() => {
                  if (slot.isMember) {
                    setStartNode(slot.id);
                  } else {
                    setLookupKey(slot.id);
                  }
                }}
                style={{
                  left: `calc(50% + ${slot.x}px)`,
                  top: `calc(50% + ${slot.y}px)`,
                }}
                type="button"
              >
                {(slot.id % Math.max(1, modulo / 8) === 0 || slot.isMember || slot.isTrail) && (
                  <span className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 whitespace-nowrap font-data-mono text-[10px] text-on-surface-variant">
                    {slot.id}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="glass-panel absolute left-1/2 top-1/2 flex h-52 w-52 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-primary/20 text-center">
            <span className="font-label-caps text-[10px] uppercase text-primary/70">Active lookup</span>
            <strong className="my-2 font-data-mono text-4xl text-primary">{keyMod}</strong>
            <span className="font-data-mono text-[12px] text-on-surface-variant">
              {safeStartNode ?? 'n/a'} {'->'} {route.responsibleNode ?? 'n/a'}
            </span>
            <span className="mt-3 font-data-mono text-[10px] text-tertiary">
              {routeHopCost} hops vs {linearProbeCost} node scan
            </span>
          </div>
        </section>
      </main>

      <aside className="relative z-40 w-full p-4 lg:fixed lg:right-0 lg:top-16 lg:h-[calc(100vh-64px)] lg:w-96 lg:p-6">
        <div className="glass-panel custom-scrollbar h-full overflow-y-auto rounded-xl border-white/5 shadow-2xl">
          <div className="border-b border-white/10 bg-white/5 p-4">
            <h2 className="flex items-center gap-2 font-label-caps text-xs text-secondary">
              <span className="material-symbols-outlined text-sm">table_rows</span>
              Finger table for node {safeStartNode ?? 'n/a'}
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 font-data-mono text-[11px] text-on-surface-variant">
              <div>
                <div className="font-label-caps text-[9px] uppercase text-on-surface-variant/50">predecessor</div>
                <div className="text-primary">{selectedPredecessor ?? 'n/a'}</div>
              </div>
              <div>
                <div className="font-label-caps text-[9px] uppercase text-on-surface-variant/50">owns range</div>
                <div className="text-primary">
                  ({selectedPredecessor ?? 'n/a'}, {safeStartNode ?? 'n/a'}]
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-data-mono text-[11px]">
              <thead className="bg-white/5 uppercase text-on-surface-variant/60">
                <tr>
                  <th className="px-4 py-2 font-medium">i</th>
                  <th className="px-4 py-2 font-medium">start</th>
                  <th className="px-4 py-2 font-medium">successor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {selectedFingerTable.map((entry) => (
                  <tr className="transition-colors hover:bg-white/5" key={entry.index}>
                    <td className="px-4 py-3 text-primary">{entry.index}</td>
                    <td className="px-4 py-3">{entry.start}</td>
                    <td className="px-4 py-3 text-secondary">{entry.successor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-white/10 bg-white/[0.02] p-4">
            <div className="mb-3 font-label-caps text-[10px] uppercase text-on-surface-variant/70">Routing decisions</div>
            <div className="space-y-3">
              {route.steps.length === 0 ? (
                <p className="font-data-mono text-[12px] text-tertiary">Start node already owns this key.</p>
              ) : (
                route.steps.map((step, index) => (
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3" key={`${step.from}-${step.to}-${index}`}>
                    <div className="font-data-mono text-[12px] text-primary">
                      hop {index + 1}: {step.from} {'->'} {step.to}
                    </div>
                    <div className="mt-1 font-data-mono text-[11px] text-on-surface-variant/70">{step.reason}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-white/10 bg-white/[0.02] p-4">
            <div className="mb-3 font-label-caps text-[10px] uppercase text-on-surface-variant/70">Why node {route.responsibleNode ?? 'n/a'}?</div>
            <p className="text-sm leading-5 text-on-surface-variant/80">
              Key {keyMod} falls in ({responsiblePredecessor ?? 'n/a'}, {route.responsibleNode ?? 'n/a'}], so that node is
              the successor responsible for storing or returning the key.
            </p>
          </div>

          <div className="border-t border-white/10 bg-white/[0.02] p-4">
            <div className="mb-3 font-label-caps text-[10px] uppercase text-on-surface-variant/70">Project architecture</div>
            <div className="space-y-2">
              {deploymentStages.map((stage) => (
                <div className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3" key={stage.label}>
                  <span className="material-symbols-outlined text-base text-tertiary">{stage.icon}</span>
                  <div>
                    <div className="font-data-mono text-[12px] text-primary">{stage.label}</div>
                    <div className="mt-1 text-xs leading-4 text-on-surface-variant/70">{stage.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;
