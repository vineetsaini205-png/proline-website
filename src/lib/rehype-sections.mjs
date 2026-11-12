// Build-time changes to Markdown page text (owner, 25 Oct: less crowded on phones, nothing removed for Google).
// 1. Service, charger, battery, audience and guide pages: each H2 part becomes a tap-to-open block
//    (<details class="sec">; all start closed on phones, LandingPage opens the first on wide screens).
//    The heading stays a real <h2> inside <summary>,
//    and the whole text stays in the HTML.
// 2. Every Markdown table (blog too): each cell gets data-label="<its column heading>", so on phones
//    a table can show as one card per row (see .prose table rules in global.css).
// After changing this file, bump `version` in astro.config.mjs (cached Markdown is reused otherwise).
const SECTIONED = /[\\/]src[\\/]content[\\/](services|chargers|batteries|audiences|pages)[\\/]/;

const el = (tagName, properties, children) => ({ type: 'element', tagName, properties, children });
const textOf = (n) => (n.type === 'text' ? n.value : (n.children || []).map(textOf).join(''));
const kids = (n, tag) => (n.children || []).filter((c) => c.type === 'element' && c.tagName === tag);

function labelTables(node) {
  if (node.type === 'element' && node.tagName === 'table') {
    const head = kids(node, 'thead')[0];
    const row = head && kids(head, 'tr')[0];
    const labels = row ? kids(row, 'th').map((th) => textOf(th).trim()) : [];
    for (const body of kids(node, 'tbody')) {
      for (const tr of kids(body, 'tr')) {
        kids(tr, 'td').forEach((td, i) => { td.properties = { ...(td.properties || {}), dataLabel: labels[i] || '' }; });
      }
    }
    return;
  }
  (node.children || []).forEach(labelTables);
}

export default function rehypeSections() {
  return (tree, file) => {
    labelTables(tree);
    const path = String(file.path || (file.history && file.history[0]) || '');
    if (!SECTIONED.test(path)) return;
    const out = [];
    let body = null;
    let n = 0;
    for (const node of tree.children) {
      if (node.type === 'element' && node.tagName === 'h2') {
        body = el('div', { className: ['sec-body'] }, []);
        out.push(el('details', { className: n === 0 ? ['sec', 'sec-first'] : ['sec'] }, [el('summary', {}, [node]), body]));
        n++;
      } else if (body) {
        body.children.push(node);
      } else {
        out.push(node);
      }
    }
    tree.children = out;
  };
}
