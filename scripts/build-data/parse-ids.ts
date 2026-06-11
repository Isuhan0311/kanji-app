const IDC = /[⿰-⿿]/g;
const CJK = /[㐀-鿿豈-﫿㇀-㇣⺀-⻳]/u;

export function parseIds(text: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const line of text.split('\n')) {
    if (!line || line.startsWith(';;')) continue;
    const cols = line.split('\t');
    if (cols.length < 3) continue;
    const char = cols[1];
    const expr = cols[2].replace(/\[.*?\]/g, '').replace(IDC, '');
    const comps = [...new Set([...expr])].filter(
      (c) => c !== char && CJK.test(c),
    );
    map.set(char, comps);
  }
  return map;
}

export function expandComponents(
  direct: Map<string, string[]>,
): Map<string, Set<string>> {
  const cache = new Map<string, Set<string>>();
  function expand(char: string, seen: Set<string>): Set<string> {
    const cached = cache.get(char);
    if (cached) return cached;
    const result = new Set<string>();
    for (const c of direct.get(char) ?? []) {
      if (seen.has(c)) continue;
      result.add(c);
      for (const sub of expand(c, new Set([...seen, c]))) result.add(sub);
    }
    cache.set(char, result);
    return result;
  }
  const out = new Map<string, Set<string>>();
  for (const char of direct.keys()) out.set(char, expand(char, new Set([char])));
  return out;
}
