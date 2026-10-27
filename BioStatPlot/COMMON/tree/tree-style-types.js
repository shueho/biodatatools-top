(function (global) {
'use strict';

const COMMON_KEYS = {
  color: 'styleColor', opacity: 'styleOpacity',
  fontFamily: 'styleFontFamily', fontSize: 'styleFontSize',
  bold: 'styleBold', italic: 'styleItalic',
  textColor: 'styleTextColor',
  bgShow: 'styleBgShow', bgColor: 'styleBgColor', bgOpacity: 'styleBgOpacity',
  bgBorderColor: 'styleBgBorderColor', bgBorderWidth: 'styleBgBorderWidth',
  align: 'styleAlign',
  x: 'styleX', y: 'styleY',
  offsetTangent: 'styleOffsetTangent', offsetRadial: 'styleOffsetRadial',
  stroke: 'styleStrokeColor', strokeWidth: 'styleStrokeWidth',
  lineStyle: 'styleLineStyle', dashSize: 'styleDashSize', gapSize: 'styleGapSize',
  shape: 'styleShape', size: 'styleShapeSize',
  fillColor: 'styleFillColor', fillOpacity: 'styleFillOpacity',
  shapeStrokeColor: 'styleShapeStrokeColor', shapeStrokeWidth: 'styleShapeStrokeWidth'
};

function num(v, d) { const n = Number(v); return Number.isFinite(n) ? n : d; }
function clamp01(v, d) { const n = num(v, d); return Math.max(0, Math.min(1, n)); }

function colorStyle(o) {
  o = o || {};
  return { color: o.color || '#000000', opacity: clamp01(o.opacity, 1) };
}

function textStyle(o) {
  o = o || {};
  return {
    fontFamily: o.fontFamily || '',
    fontSize: num(o.fontSize, 12),
    bold: !!o.bold,
    italic: !!o.italic,
    color: o.color || '#222222',
    opacity: clamp01(o.opacity, 1),
    bgShow: !!o.bgShow,
    bgColor: o.bgColor || '#ffffff',
    bgOpacity: clamp01(o.bgOpacity, 1),
    bgBorderColor: o.bgBorderColor || '#999999',
    bgBorderWidth: num(o.bgBorderWidth, 0),
    align: o.align || 'middle',
    x: o.x != null ? num(o.x, 0) : null,
    y: o.y != null ? num(o.y, 0) : null,
    offsetTangent: num(o.offsetTangent, 0),
    offsetRadial: num(o.offsetRadial, 0)
  };
}

function lineStyle(o) {
  o = o || {};
  const style = o.lineStyle || (o.dashed ? 'dashed' : 'solid');
  return {
    stroke: o.stroke || (o.color || '#888888'),
    strokeWidth: num(o.strokeWidth, 1),
    opacity: clamp01(o.opacity, 0.8),
    lineStyle: style === 'dashed' ? 'dashed' : 'solid',
    dashSize: num(o.dashSize, 2),
    gapSize: num(o.gapSize, 3)
  };
}

function shapeStyle(o) {
  o = o || {};
  return {
    shape: o.shape || 'circle',
    size: num(o.size, 5),
    fillColor: o.fillColor || '#4e79a7',
    fillOpacity: clamp01(o.fillOpacity, 1),
    strokeColor: o.strokeColor || (o.shapeStrokeColor || '#333333'),
    strokeWidth: num(o.strokeWidth != null ? o.strokeWidth : o.shapeStrokeWidth, 0),
    opacity: clamp01(o.opacity, 1)
  };
}

function dashArrayOf(l) {
  if (!l || l.lineStyle === 'solid') return '';
  return `${Math.max(1, num(l.dashSize, 2))} ${Math.max(1, num(l.gapSize, 3))}`;
}

function lineAttrs(l) {
  l = l || {};
  return {
    stroke: l.stroke || '#888888',
    'stroke-width': num(l.strokeWidth, 1),
    'stroke-dasharray': dashArrayOf(l),
    opacity: clamp01(l.opacity, 1)
  };
}

function toTextAttrs(t) {
  t = t || {};
  return {
    'font-family': t.fontFamily || undefined,
    'font-size': num(t.fontSize, 12),
    'font-weight': t.bold ? '700' : '400',
    'font-style': t.italic ? 'italic' : 'normal',
    fill: t.color || '#222222',
    opacity: clamp01(t.opacity, 1)
  };
}

function copyText(o) { return Object.assign({}, textStyle(o)); }

function pickText(o) {
  return textStyle(o).color;
}

global.TreeStyle = {
  COMMON_KEYS, colorStyle, textStyle, lineStyle, shapeStyle,
  dashArrayOf, lineAttrs, toTextAttrs, copyText, pickText
};
})(window);