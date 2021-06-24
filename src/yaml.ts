export { parse as parseYaml } from "yaml";

import type { Node, Document, Pair, Scalar, YAMLSeq } from "yaml";
import {
  isAlias,
  isPair,
  isScalar,
  isSeq,
  LineCounter,
  parseDocument,
  visit,
} from "yaml";

type Index = string | number;
export type Location = { line: number; col: number };
export type Range = { start: Location; end: Location };
export type RangeMap = {
  valueRange: Range;
  keyRange?: Range;
  contents?: { [key in Index]: RangeMap };
  references?: RangeMap;
};

type AnyNode = Node | Document<unknown> | Pair<unknown, unknown>;

type RangePair = { key?: Range; value: Range };
function rangeOf(node: AnyNode, lc: LineCounter): RangePair | null {
  if (isPair(node)) {
    const keyRange = rangeOf(node.key as any, lc);
    if (!keyRange) return null;

    const valueRange = rangeOf(node.value as any, lc);
    if (!valueRange) return null;

    return { key: keyRange.value, value: valueRange.value };
  } else {
    if (!node.range) return null;

    const [startOffset, endOffset] = node.range;
    const range = {
      start: lc.linePos(startOffset),
      end: lc.linePos(endOffset),
    };
    return { value: range };
  }
}

function findInSeq(node: AnyNode, seq: YAMLSeq): number {
  const items = seq.items;
  for (let j = 0; j < items.length; ++j) {
    if (items[j] === node) {
      return j;
    }
  }

  /* istanbul ignore next -- This is only here to make TypeScript happy. */
  return -1;
}

type AnchorMap = { [key: string]: AnyNode };
function mapNode(n: AnyNode, lc: LineCounter, am: AnchorMap = {}): RangeMap {
  const map: RangeMap = { valueRange: rangeOf(n, lc)!.value };

  const anchorMap: AnchorMap = am;

  visit(n, (key, node: any, path) => {
    if (node.anchor) {
      anchorMap[node.anchor] = node;
    }

    if (key === "key") return;

    if (!(isAlias(node) || isScalar(node))) return;

    let current = map;
    const next = (key: Index, range: RangePair) => {
      if (!current.contents) {
        current.contents = {};
      }

      if (!(key in current.contents)) {
        current.contents[key] = {
          valueRange: range.value,
          keyRange: range.key,
        };
      }

      current = current.contents[key];
    };

    let inSeq = false;
    // start at 1 because the first entry is always a document.
    for (let i = 0; i < path.length; ++i) {
      const el = path[i];

      if (inSeq) {
        inSeq = false;
        const index = findInSeq(el, path[i - 1] as YAMLSeq);
        const range = rangeOf(el, lc);
        if (range) next(index, range);
      }

      if (isSeq(el)) {
        inSeq = true;
      } else if (isPair(el)) {
        // Lots of assumptions on this line. There's a good chance this will
        // need fixing.
        const key = (el as Pair<Scalar, any>).key.value as Index;
        const range = rangeOf(el, lc);
        if (range) next(key, range);
      }
    }

    if (inSeq) {
      const index = findInSeq(node, path[path.length - 1] as YAMLSeq);
      const range = rangeOf(node, lc);
      if (range) next(index, range);
    }

    const range = rangeOf(node, lc);
    if (range) current.valueRange = range.value;

    if (isAlias(node)) {
      const otherNode = anchorMap[node.source];
      if (otherNode != null) {
        current.references = mapNode(otherNode, lc, anchorMap);
      }
    }
  });

  return map;
}

type LoadedYaml = { data: any; map: RangeMap };
export function loadYaml(y: string): LoadedYaml {
  const lc = new LineCounter();
  const doc = parseDocument(y, { lineCounter: lc });

  return {
    data: doc.toJS(),
    map: mapNode(doc, lc),
  };
}
