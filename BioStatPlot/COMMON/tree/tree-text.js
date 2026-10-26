(function (global) {
'use strict';

class TextStyle {
  constructor(o) {
    o = o || {};
    this.font   = o.font   || 'Times New Roman';
    this.size   = num(o.size, 12);
    this.bold   = !!o.bold;
    this.italic = !!o.italic;
    this.color  = o.color  || '#333333';
  }
  attrs(extra) {
    const a = {
      'font-family': this.font,
      'font-size':   this.size,
      'font-weight': this.bold ? '700' : '400',
      'font-style':  this.italic ? 'italic' : 'normal',
      'fill':        this.color
    };
    if (extra) Object.assign(a, extra);
    return a;
  }
  clone(over) {
    return new TextStyle(Object.assign({
      font: this.font, size: this.size,
      bold: this.bold, italic: this.italic, color: this.color
    }, over || {}));
  }
}

function num(v, d) { const n = Number(v); return Number.isFinite(n) ? n : d; }
function of(o) { return o instanceof TextStyle ? o : new TextStyle(o); }

function draw(parent, x, y, content, style, extra) {
  const C = global.TreeCore;
  if (!C || typeof C.el !== 'function') return null;
  const attrs = of(style).attrs({ x: x, y: y });
  if (extra) for (const k in extra) if (extra[k] !== undefined) attrs[k] = extra[k];
  const node = C.el('text', attrs, parent);
  if (node) node.textContent = content == null ? '' : String(content);
  return node;
}

function fromParts(p) {
  p = p || {};
  return new TextStyle({
    font: p.font, size: p.size,
    bold: p.bold, italic: p.italic, color: p.color
  });
}

function fromState(obj) {
  const st = global.TreeCore && global.TreeCore.state;
  obj = obj || {};
  return new TextStyle({
    font:   obj.fontFamily || (st && st.fontFamily),
    size:   obj.fontSize,
    bold:   obj.bold,
    italic: obj.italic,
    color:  obj.color
  });
}

global.TreeText = { TextStyle, of, draw, fromParts, fromState };
})(window);