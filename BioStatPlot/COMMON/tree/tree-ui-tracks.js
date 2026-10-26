(function (global) {
'use strict';
const C = global.TreeCore;
const I = global.TreeI18N;
const S = global.TreeUI;

function esc(s) { return S.escapeHtml(s); }
function escA(s) { return S.escapeAttr(s); }
function subTitle(t) { return `<div class="sub-section-title">${t}</div>`; }

function legendBlock(t) {
  return subTitle(I.t('legendPanelTitle')) + `
    <div class="param-grid cols-4">
      <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="showLegend" data-tid="${t.id}" ${t.showLegend ? 'checked' : ''}> ${I.t('legendShowChk')}</label></div>
      <div class="param-item"><label>${I.t('legendTitleLabel')}</label><input type="text" data-tprop="legendTitle" data-tid="${t.id}" value="${escA(t.legendTitle || '')}" placeholder="${I.t('trackUntitled')}"></div>
      ${t.type === 'heatstrip' || t.type === 'multiheatmap' ? `
        <div class="param-item"><label>${I.t('legendDirection')}</label><select data-tprop="legendOrientation" data-tid="${t.id}">
          <option value="horizontal" ${t.legendOrientation !== 'vertical' ? 'selected' : ''}>${I.t('legendHorizontal')}</option>
          <option value="vertical" ${t.legendOrientation === 'vertical' ? 'selected' : ''}>${I.t('legendVertical')}</option></select></div>
        <div class="param-item"><label>${I.t('heatLegendTickInterval')}</label><input type="number" data-tprop="legendTickInterval" data-tid="${t.id}" value="${t.legendTickInterval != null ? t.legendTickInterval : ''}" min="0" step="any" placeholder="auto"></div>
        <div class="param-item"><label>${I.t('heatLegendTickDecimals')}</label><input type="number" data-tprop="legendTickDecimals" data-tid="${t.id}" value="${t.legendTickDecimals != null ? t.legendTickDecimals : 2}" min="0" max="6" step="1"></div>
      ` : ''}
    </div>`;
}

function customColorBlock(t, values) {
  const cur = t.customColors || {};
  const excluded = t.excludedValues || [];
  let html = '';
  if (values.length) {
    html += subTitle(I.t('trackCustomColors')) + `
      <div class="custom-color-list" style="display:flex;flex-wrap:wrap;gap:8px;">
        ${values.map(v => `
          <label style="display:flex;align-items:center;gap:4px;font-size:12px;">
            <input type="color" data-tcolor="${t.id}" data-cval="${escA(v)}"
                   value="${escA(cur[v] || '#cccccc')}"
                   style="width:30px;height:22px;padding:0;border:1px solid #ccc;border-radius:3px;cursor:pointer;">
            <span>${esc(v)}</span>
            <button class="btn-del-color" data-tdelcolor="${t.id}" data-cval="${escA(v)}" type="button" title="delete">×</button>
          </label>`).join('')}
      </div>`;
  }
  if (excluded.length) {
    html += `<div style="margin-top:6px;font-size:12px;color:#888;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
      <span>${I.t('trackExcludedLabel')}${excluded.map(v => esc(v)).join(', ')}</span>
      <button class="btn btn-outline" data-trestore-excluded="${t.id}" type="button" style="padding:2px 8px;font-size:12px;">${I.t('btnRestoreExcluded')}</button>
    </div>`;
  }
  return html;
}

function shapeMapBlock(t, values) {
  if (!values.length) return '';
  return subTitle(I.t('trackShapeSettings')) + `
    <div class="shape-map-list" style="display:flex;flex-wrap:wrap;gap:8px;">
      ${values.map(v => `
        <label style="display:flex;align-items:center;gap:4px;font-size:12px;">
          <select data-tshape="${t.id}" data-sval="${escA(v)}" style="padding:2px 4px;">
            <option value="square" ${(t.shapeMap && t.shapeMap[v]) === 'square' || (!t.shapeMap || !t.shapeMap[v]) ? 'selected' : ''}>■</option>
            <option value="triangle" ${t.shapeMap && t.shapeMap[v] === 'triangle' ? 'selected' : ''}>▲</option>
            <option value="circle" ${t.shapeMap && t.shapeMap[v] === 'circle' ? 'selected' : ''}>●</option>
            <option value="star" ${t.shapeMap && t.shapeMap[v] === 'star' ? 'selected' : ''}>★</option>
            <option value="diamond2" ${t.shapeMap && t.shapeMap[v] === 'diamond2' ? 'selected' : ''}>◆</option>
          </select>
          <span>${esc(v)}</span>
        </label>`).join('')}
    </div>`;
}

function paletteWithColors(t, vals) {
  return `
    <div class="param-item"><label>${I.t('groupPaletteLabel')}</label><div class="palette-slot" data-palette="${t.id}"></div></div>
    ${customColorBlock(t, vals)}
  `;
}

function toggleTrackAccordion(container, tid) {
  const TT = global.TreeTracks;
  const t = TT.tracks.find(x => x.id === tid);
  if (!t) return;
  const willExpand = !!t.collapsed;
  TT.toggleCustomTrack(tid);
  if (willExpand) {
    TT.tracks.forEach(o => { if (o.id !== tid) o.collapsed = true; });
  }
  refreshTrackList(container);
}

function refreshTrackList(container) {
  const box = container.querySelector('#trackList');
  if (!box) return;
  const TT = global.TreeTracks;
  if (!TT || !TT.tracks.length) { box.innerHTML = ''; return; }
  const expanded = TT.tracks.filter(t => !t.collapsed);
  if (expanded.length > 1) {
    const keep = expanded[0];
    TT.tracks.forEach(t => { if (t.id !== keep.id) t.collapsed = true; });
  }
  const ld = global.TreeAppData && global.TreeAppData.leafData;
  const cols = (ld && ld.headers) ? ld.headers.slice() : [];

  box.innerHTML = TT.tracks.map(t => {
    const colOpts = (sel) => `<option value="">${I.t('colPlaceholder')}</option>` +
      cols.map(c => `<option value="${escA(c)}" ${c === sel ? 'selected' : ''}>${esc(c)}</option>`).join('');
    const typeLabel = TT.trackTypeLabel(t.type);
    let body = '';

    if (t.type === 'legend') {
      const items = t.legendItems || [];
      body = `
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackNameLabel')}</label>
            <input type="text" data-tprop="name" data-tid="${t.id}" value="${escA(t.name)}"></div>
        </div>
        ${legendBlock(t)}
        ${subTitle(I.t('legendItemsTitle'))}
        <div id="legendItemsWrap_${t.id}" style="display:flex;flex-direction:column;gap:6px;">
          ${items.map((it, i) => `
            <div class="param-grid cols-4" style="align-items:end;">
              <div class="param-item"><label>${I.t('legendItemLabel')}</label>
                <input type="text" data-lgfield="label" data-lgtid="${t.id}" data-lgidx="${i}" value="${escA(it.label || '')}"></div>
              <div class="param-item"><label>${I.t('legendItemShape')}</label>
                <select data-lgfield="shape" data-lgtid="${t.id}" data-lgidx="${i}">
                  <option value="square" ${it.shape === 'square' ? 'selected' : ''}>${I.t('optShapeSquare')}</option>
                  <option value="triangle" ${it.shape === 'triangle' ? 'selected' : ''}>${I.t('optShapeTriangle')}</option>
                  <option value="circle" ${it.shape === 'circle' ? 'selected' : ''}>${I.t('optShapeCircle')}</option>
                  <option value="star" ${it.shape === 'star' ? 'selected' : ''}>${I.t('optShapeStar')}</option>
                  <option value="diamond2" ${it.shape === 'diamond2' ? 'selected' : ''}>${I.t('optShapeDiamond')}</option>
                </select></div>
              <div class="param-item"><label>${I.t('legendItemFill')}</label>
                <input type="color" data-lgfield="fillColor" data-lgtid="${t.id}" data-lgidx="${i}" value="${it.fillColor || '#4DBBD5'}"></div>
              <div class="param-item"><label>${I.t('legendItemStroke')}</label>
                <input type="color" data-lgfield="strokeColor" data-lgtid="${t.id}" data-lgidx="${i}" value="${it.strokeColor || '#333333'}"></div>
              <div class="param-item"><label>${I.t('legendItemStrokeWidth')}</label>
                <input type="number" data-lgfield="strokeWidth" data-lgtid="${t.id}" data-lgidx="${i}" value="${Number(it.strokeWidth) || 0}" min="0" max="6" step="0.5"></div>
              <div class="param-item" style="align-self:end;">
                <button class="btn btn-outline" data-del-legend-item="${t.id}" data-lgidx="${i}" type="button" style="padding:4px 10px;color:#a33;">×</button></div>
            </div>
          `).join('')}
        </div>
        <button class="btn" data-add-legend-item="${t.id}" type="button" style="margin-top:8px;">${I.t('legendAddItem')}</button>
      `;
    } else if (t.type === 'colorstrip') {
      const vals = TT.collectUniqueValues(t);
      body = `
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackDataColumn')}</label><select data-tprop="column" data-tid="${t.id}">${colOpts(t.column)}</select></div>
          <div class="param-item"><label>${I.t('trackNameLabel')}</label><input type="text" data-tprop="name" data-tid="${t.id}" value="${escA(t.name)}"></div>
          <div class="param-item"><label>${I.t('trackMergeGroups')}</label><select data-tprop="mergeGroups" data-tid="${t.id}">
            <option value="true" ${t.mergeGroups ? 'selected' : ''}>${I.t('trackMergeGroupsOn')}</option>
            <option value="false" ${!t.mergeGroups ? 'selected' : ''}>${I.t('trackMergeGroupsOff')}</option>
          </select></div>
          <div class="param-item"><label>${I.t('trackStripWidth')}</label><input type="number" data-tprop="width" data-tid="${t.id}" value="${t.width || 20}" min="4" max="400" ${t.textAutoWidth ? 'disabled' : ''}></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="textAutoWidth" data-tid="${t.id}" ${t.textAutoWidth ? 'checked' : ''}> ${I.t('trackTextAutoWidth')}</label></div>
          <div class="param-item"><label>${I.t('trackOffsetLabel')}</label><input type="number" data-tprop="offset" data-tid="${t.id}" value="${t.offset}" step="1"></div>
          <div class="param-item"><label>${I.t('trackBorderColor')}</label><input type="color" data-tprop="borderColor" data-tid="${t.id}" value="${t.borderColor}"></div>
          <div class="param-item"><label>${I.t('trackBorderWidth')}</label><input type="number" data-tprop="borderWidth" data-tid="${t.id}" value="${t.borderWidth}" min="0" max="6"></div>
          <div class="param-item"><label>${I.t('trackBlockOpacity')}</label>
            <input type="number" data-tprop="fillOpacity" data-tid="${t.id}" value="${t.fillOpacity != null ? t.fillOpacity : 1}" min="0" max="1" step="0.05"></div>
        </div>
        ${subTitle(I.t('trackColorText'))}
        <div class="param-grid cols-4">
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="showText" data-tid="${t.id}" ${t.showText ? 'checked' : ''}> ${I.t('trackShowText')}</label></div>
          <div class="param-item"><label>${I.t('trackFontSize')}</label><input type="number" data-tprop="textFontSize" data-tid="${t.id}" value="${t.textFontSize || 10}" min="6" max="40"></div>
          <div class="param-item"><label>${I.t('trackTextColor')}</label><input type="color" data-tprop="textColor" data-tid="${t.id}" value="${t.textColor || '#333333'}"></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="textBold" data-tid="${t.id}" ${t.textBold ? 'checked' : ''}> ${I.t('trackTextBold')}</label></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="textItalic" data-tid="${t.id}" ${t.textItalic ? 'checked' : ''}> ${I.t('trackTextItalic')}</label></div>
          <div class="param-item"><label>${I.t('trackTextOrientation')}</label><select data-tprop="textOrientation" data-tid="${t.id}">
            <option value="horizontal" ${t.textOrientation !== 'vertical' ? 'selected' : ''}>${I.t('trackTextHorizontal')}</option>
            <option value="vertical" ${t.textOrientation === 'vertical' ? 'selected' : ''}>${I.t('trackTextVertical')}</option>
          </select></div>
          <div class="param-item"><label>${I.t('colorstripTextOffsetX')}</label>
            <input type="number" data-tprop="colorstripTextOffsetX" data-tid="${t.id}" value="${t.colorstripTextOffsetX || 0}" step="1"></div>
          <div class="param-item"><label>${I.t('colorstripTextOffsetY')}</label>
            <input type="number" data-tprop="colorstripTextOffsetY" data-tid="${t.id}" value="${t.colorstripTextOffsetY || 0}" step="1"></div>
        </div>
        <div class="param-grid cols-4" style="margin-top:8px;">${paletteWithColors(t, vals)}</div>
        ${legendBlock(t)}
      `;
    } else if (t.type === 'binary') {
      const valOpts = `<option value="eq" ${t.binaryLogic === 'eq' ? 'selected' : ''}>${I.t('optEq')}</option>
        <option value="ne" ${t.binaryLogic === 'ne' ? 'selected' : ''}>${I.t('optNe')}</option>
        <option value="gt" ${t.binaryLogic === 'gt' ? 'selected' : ''}>${I.t('optGt')}</option>
        <option value="gte" ${t.binaryLogic === 'gte' ? 'selected' : ''}>${I.t('optGte')}</option>
        <option value="lt" ${t.binaryLogic === 'lt' ? 'selected' : ''}>${I.t('optLt')}</option>
        <option value="lte" ${t.binaryLogic === 'lte' ? 'selected' : ''}>${I.t('optLte')}</option>
        <option value="truthy" ${t.binaryLogic === 'truthy' ? 'selected' : ''}>${I.t('optTruthy')}</option>
        <option value="falsy" ${t.binaryLogic === 'falsy' ? 'selected' : ''}>${I.t('optFalsy')}</option>
        <option value="contains" ${t.binaryLogic === 'contains' ? 'selected' : ''}>${I.t('optContains')}</option>
        <option value="startswith" ${t.binaryLogic === 'startswith' ? 'selected' : ''}>${I.t('optStartsWith')}</option>
        <option value="endswith" ${t.binaryLogic === 'endswith' ? 'selected' : ''}>${I.t('optEndsWith')}</option>`;
      body = `
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackDataColumn')}</label><select data-tprop="column" data-tid="${t.id}">${colOpts(t.column)}</select></div>
          <div class="param-item"><label>${I.t('trackNameLabel')}</label><input type="text" data-tprop="name" data-tid="${t.id}" value="${escA(t.name)}"></div>
          <div class="param-item"><label>${I.t('trackBinaryLogic')}</label><select data-tprop="binaryLogic" data-tid="${t.id}">${valOpts}</select></div>
          <div class="param-item"><label>${I.t('trackBinaryValue')}</label><input type="text" data-tprop="binaryValue" data-tid="${t.id}" value="${escA(t.binaryValue || '')}"></div>
          <div class="param-item"><label>${I.t('trackBinaryTrueColor')}</label><input type="color" data-tprop="binaryTrueColor" data-tid="${t.id}" value="${t.binaryTrueColor}"></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="binaryShowFalse" data-tid="${t.id}" ${t.binaryShowFalse ? 'checked' : ''}> ${I.t('trackBinaryShowFalse')}</label></div>
          <div class="param-item"><label>${I.t('trackBinaryFalseColor')}</label><input type="color" data-tprop="binaryFalseColor" data-tid="${t.id}" value="${t.binaryFalseColor}"></div>
          <div class="param-item"><label>${I.t('trackShape')}</label><select data-tprop="shape" data-tid="${t.id}">
            <option value="square" ${t.shape === 'square' ? 'selected' : ''}>${I.t('optShapeSquare')}</option>
            <option value="triangle" ${t.shape === 'triangle' ? 'selected' : ''}>${I.t('optShapeTriangle')}</option>
            <option value="circle" ${t.shape === 'circle' ? 'selected' : ''}>${I.t('optShapeCircle')}</option>
            <option value="star" ${t.shape === 'star' ? 'selected' : ''}>${I.t('optShapeStar')}</option>
            <option value="diamond2" ${t.shape === 'diamond2' ? 'selected' : ''}>${I.t('optShapeDiamond')}</option>
          </select></div>
          <div class="param-item"><label>${I.t('trackOutlineColor')}</label><input type="color" data-tprop="outlineColor" data-tid="${t.id}" value="${t.outlineColor}"></div>
          <div class="param-item"><label>${I.t('trackOutlineWidth')}</label><input type="number" data-tprop="outlineWidth" data-tid="${t.id}" value="${t.outlineWidth}" min="0" max="6"></div>
          <div class="param-item"><label>${I.t('trackBinarySize')}</label><input type="number" data-tprop="binarySize" data-tid="${t.id}" value="${t.binarySize || 0}" min="0" max="200" step="1" placeholder="0"></div>
          <div class="param-item"><label>${I.t('trackOffsetLabel')}</label><input type="number" data-tprop="offset" data-tid="${t.id}" value="${t.offset}" step="1"></div>
        </div>
        ${legendBlock(t)}
      `;
    } else if (t.type === 'heatstrip') {
      const useCustom = !!(t.gradientStops && t.gradientStops.length >= 2);
      const stops = useCustom ? t.gradientStops : ['#ffffff', '#888888', '#000000'];
      body = `
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackDataColumn')}</label><select data-tprop="column" data-tid="${t.id}">${colOpts(t.column)}</select></div>
          <div class="param-item"><label>${I.t('trackNameLabel')}</label><input type="text" data-tprop="name" data-tid="${t.id}" value="${escA(t.name)}"></div>
          <div class="param-item" style="grid-column: span 2;"><label>${I.t('trackContinuousPalette')}</label><div class="palette-slot" data-palette-continuous="${t.id}"></div></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tcustom="${t.id}" ${useCustom ? 'checked' : ''}> ${I.t('trackCustomGradient')}</label></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="showBorder" data-tid="${t.id}" ${t.showBorder !== false ? 'checked' : ''}> ${I.t('trackShowBorder')}</label></div>
          <div class="param-item"><label>${I.t('trackOutlineColorLabel')}</label><input type="color" data-tprop="borderColor" data-tid="${t.id}" value="${t.borderColor}"></div>
          <div class="param-item"><label>${I.t('trackOutlineWidthLabel')}</label><input type="number" data-tprop="borderWidth" data-tid="${t.id}" value="${t.borderWidth}" min="0" max="6"></div>
          <div class="param-item"><label>${I.t('trackStripWidth')}</label><input type="number" data-tprop="width" data-tid="${t.id}" value="${t.width || 20}" min="4" max="80"></div>
          <div class="param-item"><label>${I.t('trackOffsetLabel')}</label><input type="number" data-tprop="offset" data-tid="${t.id}" value="${t.offset}" step="1"></div>
        </div>
        ${subTitle(I.t('trackColorSettings'))}
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackMinValue')}</label><input type="number" data-tprop="gradientMin" data-tid="${t.id}" value="${t.gradientMin != null ? t.gradientMin : ''}" placeholder="auto"></div>
          <div class="param-item"><label>${I.t('trackMaxValue')}</label><input type="number" data-tprop="gradientMax" data-tid="${t.id}" value="${t.gradientMax != null ? t.gradientMax : ''}" placeholder="auto"></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="gradientReverse" data-tid="${t.id}" ${t.gradientReverse ? 'checked' : ''}> ${I.t('trackReverse')}</label></div>
        </div>
        <div class="param-grid cols-4" style="${useCustom ? '' : 'display:none;'}" data-customgrad="${t.id}">
          <div class="param-item"><label>${I.t('trackLeftColor')}</label><input type="color" data-tgrad="0" data-tid="${t.id}" value="${stops[0] || '#ffffff'}"></div>
          <div class="param-item"><label>${I.t('trackMidColor')}</label><input type="color" data-tgrad="1" data-tid="${t.id}" value="${stops[1] || '#888888'}"></div>
          <div class="param-item"><label>${I.t('trackRightColor')}</label><input type="color" data-tgrad="2" data-tid="${t.id}" value="${stops[2] || stops[1] || '#000000'}"></div>
        </div>
        ${legendBlock(t)}
      `;
    } else if (t.type === 'bar') {
      body = `
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackDataColumn')}</label><select data-tprop="column" data-tid="${t.id}">${colOpts(t.column)}</select></div>
          <div class="param-item"><label>${I.t('trackNameLabel')}</label><input type="text" data-tprop="name" data-tid="${t.id}" value="${escA(t.name)}"></div>
          <div class="param-item"><label>${I.t('trackBarColor')}</label><input type="color" data-tprop="barColor" data-tid="${t.id}" value="${t.barColor}"></div>
          <div class="param-item"><label>${I.t('trackTrackLength')}</label><input type="number" data-tprop="width" data-tid="${t.id}" value="${t.width || 100}" min="20" max="400"></div>
          <div class="param-item"><label>${I.t('trackBarWidth')}</label><input type="number" data-tprop="barWidth" data-tid="${t.id}" value="${t.barWidth || 0}" min="0" max="40" placeholder="0"></div>
          <div class="param-item"><label>${I.t('trackOffsetLabel')}</label><input type="number" data-tprop="offset" data-tid="${t.id}" value="${t.offset}" step="1"></div>
        </div>
        ${subTitle(I.t('trackBarOutline'))}
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackBarOutlineColor')}</label><input type="color" data-tprop="barOutlineColor" data-tid="${t.id}" value="${t.barOutlineColor}"></div>
          <div class="param-item"><label>${I.t('trackBarOutlineWidth')}</label><input type="number" data-tprop="barOutlineWidth" data-tid="${t.id}" value="${t.barOutlineWidth}" min="0" max="6"></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="barOutlineDashed" data-tid="${t.id}" ${t.barOutlineDashed ? 'checked' : ''}> ${I.t('trackBarOutlineDashed')}</label></div>
        </div>
        ${subTitle(I.t('trackBox'))}
        <div class="param-grid cols-4">
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="showBox" data-tid="${t.id}" ${t.showBox ? 'checked' : ''}> ${I.t('trackShowBox')}</label></div>
          <div class="param-item"><label>${I.t('trackBoxColor')}</label><input type="color" data-tprop="boxColor" data-tid="${t.id}" value="${t.boxColor || '#bbbbbb'}"></div>
          <div class="param-item"><label>${I.t('trackBoxWidth')}</label><input type="number" data-tprop="boxWidth" data-tid="${t.id}" value="${t.boxWidth || 0.5}" min="0" max="6" step="0.1"></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="boxDashed" data-tid="${t.id}" ${t.boxDashed ? 'checked' : ''}> ${I.t('trackBoxDashed')}</label></div>
        </div>
        ${subTitle(I.t('trackXAxis'))}
        <div class="param-grid cols-4">
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="showValues" data-tid="${t.id}" ${t.showValues ? 'checked' : ''}> ${I.t('trackShowTopValues')}</label></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="showAxisNumbers" data-tid="${t.id}" ${t.showAxisNumbers !== false ? 'checked' : ''}> ${I.t('trackShowAxisTicks')}</label></div>
          <div class="param-item"><label>${I.t('trackMinValue')}</label><input type="number" data-tprop="axisMin" data-tid="${t.id}" value="${t.axisMin != null ? t.axisMin : ''}" placeholder="auto"></div>
          <div class="param-item"><label>${I.t('trackMaxValue')}</label><input type="number" data-tprop="axisMax" data-tid="${t.id}" value="${t.axisMax != null ? t.axisMax : ''}" placeholder="auto"></div>
          <div class="param-item"><label>${I.t('trackAxisInterval')}</label><input type="number" data-tprop="axisInterval" data-tid="${t.id}" value="${t.axisInterval != null ? t.axisInterval : ''}" placeholder="auto"></div>
        </div>
        ${subTitle(I.t('trackRefLine'))}<div style="margin-top:4px;"><button class="btn btn-outline" data-add-refline="${t.id}" type="button" style="padding:2px 8px;font-size:12px;">${I.t('trackAddRefLine')}</button></div>
        <div class="refline-list">
          ${(t.refLines || []).map((rl, i) => `
            <div class="param-grid cols-4" style="margin-top:6px;">
              <div class="param-item"><label>${I.t('trackRefValue')}</label><input type="number" data-rlidx="${i}" data-rlprop="value" data-tid="${t.id}" value="${rl.value != null ? rl.value : ''}"></div>
              <div class="param-item"><label>${I.t('trackRefColor')}</label><input type="color" data-rlidx="${i}" data-rlprop="color" data-tid="${t.id}" value="${rl.color || '#e74c3c'}"></div>
              <div class="param-item"><label>${I.t('trackRefWidth')}</label><input type="number" data-rlidx="${i}" data-rlprop="width" data-tid="${t.id}" value="${rl.width || 1}" min="0.5" max="4" step="0.5"></div>
              <div class="param-item" style="align-self:end;display:flex;gap:4px;">
                <label class="mini-check"><input type="checkbox" data-rlidx="${i}" data-rlprop="dashed" data-tid="${t.id}" ${rl.dashed ? 'checked' : ''}> ${I.t('trackBarOutlineDashed')}</label>
                <button class="btn btn-outline" data-del-refline="${t.id}" data-rlidx="${i}" type="button" style="padding:2px 6px;font-size:12px;">×</button>
              </div>
            </div>`).join('')}
        </div>
        ${legendBlock(t)}
      `;
    } else if (t.type === 'text') {
      const vals = TT.collectUniqueValues(t);
      body = `
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackDataColumn')}</label><select data-tprop="column" data-tid="${t.id}">${colOpts(t.column)}</select></div>
          <div class="param-item"><label>${I.t('trackNameLabel')}</label><input type="text" data-tprop="name" data-tid="${t.id}" value="${escA(t.name)}"></div>
          <div class="param-item"><label>${I.t('trackAlign')}</label><select data-tprop="textAlign" data-tid="${t.id}">
            <option value="left" ${t.textAlign === 'left' ? 'selected' : ''}>${I.t('trackAlignLeft')}</option>
            <option value="center" ${t.textAlign === 'center' ? 'selected' : ''}>${I.t('trackAlignCenter')}</option>
            <option value="right" ${t.textAlign === 'right' ? 'selected' : ''}>${I.t('trackAlignRight')}</option>
          </select></div>
          <div class="param-item"><label>${I.t('trackFontSize')}</label><input type="number" data-tprop="textFontSize" data-tid="${t.id}" value="${t.textFontSize}" min="6" max="40"></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="textBold" data-tid="${t.id}" ${t.textBold ? 'checked' : ''}> ${I.t('trackTextBold')}</label></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="textItalic" data-tid="${t.id}" ${t.textItalic ? 'checked' : ''}> ${I.t('trackTextItalic')}</label></div>
          <div class="param-item"><label>${I.t('trackOffsetLabel')}</label><input type="number" data-tprop="offset" data-tid="${t.id}" value="${t.offset}" step="1"></div>
        </div>
        <div class="param-grid cols-4" style="margin-top:8px;">${paletteWithColors(t, vals)}</div>
      `;
    } else if (t.type === 'multisymbol') {
      const vals = TT.collectUniqueValues(t);
      body = `
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackMultiColHint')}</label><select data-tprop="column" data-tid="${t.id}">${colOpts(t.column || t.shapeColumn)}</select></div>
          <div class="param-item"><label>${I.t('trackNameLabel')}</label><input type="text" data-tprop="name" data-tid="${t.id}" value="${escA(t.name)}"></div>
          <div class="param-item"><label>${I.t('trackSymbolSize')}</label><input type="number" data-tprop="symbolSize" data-tid="${t.id}" value="${t.symbolSize || 0}" min="0" max="200" step="1" placeholder="0"></div>
          <div class="param-item"><label>${I.t('trackOffsetLabel')}</label><input type="number" data-tprop="offset" data-tid="${t.id}" value="${t.offset}" step="1"></div>
        </div>
        ${subTitle(I.t('trackUniformShape'))}
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackShape')}</label><select data-tprop="uniformShape" data-tid="${t.id}">
            <option value="square" ${t.uniformShape === 'square' ? 'selected' : ''}>${I.t('optShapeSquare')}</option>
            <option value="triangle" ${t.uniformShape === 'triangle' ? 'selected' : ''}>${I.t('optShapeTriangle')}</option>
            <option value="circle" ${t.uniformShape === 'circle' ? 'selected' : ''}>${I.t('optShapeCircle')}</option>
            <option value="star" ${t.uniformShape === 'star' ? 'selected' : ''}>${I.t('optShapeStar')}</option>
            <option value="diamond2" ${t.uniformShape === 'diamond2' ? 'selected' : ''}>${I.t('optShapeDiamond')}</option>
          </select></div>
          <div class="param-item"><label>${I.t('trackOutlineColor')}</label><input type="color" data-tprop="outlineColor" data-tid="${t.id}" value="${t.outlineColor}"></div>
          <div class="param-item"><label>${I.t('trackOutlineWidth')}</label><input type="number" data-tprop="outlineWidth" data-tid="${t.id}" value="${t.outlineWidth}" min="0" max="6"></div>
        </div>
        ${shapeMapBlock(t, vals)}
        <div class="param-grid cols-4" style="margin-top:8px;">${paletteWithColors(t, vals)}</div>
        ${legendBlock(t)}
      `;
    } else if (t.type === 'stackedbar' || t.type === 'pie') {
      const colorVals = t.columns || [];
      body = `
        <div class="param-grid cols-4">
          <div class="param-item" style="grid-column: span 2;"><label>${I.t('trackMultiColData')}</label>
            <div class="multi-col-checks" style="max-height:120px;overflow:auto;border:1px solid #ddd;border-radius:4px;padding:6px;">
              ${cols.map(c => `<label class="mini-check" style="display:block;padding:2px 0;">
                <input type="checkbox" data-tcol="${t.id}" data-cname="${escA(c)}" ${(t.columns || []).includes(c) ? 'checked' : ''}> ${esc(c)}
              </label>`).join('')}
            </div>
          </div>
          <div class="param-item"><label>${I.t('trackNameLabel')}</label><input type="text" data-tprop="name" data-tid="${t.id}" value="${escA(t.name)}"></div>
          <div class="param-item"><label>${I.t('trackOffsetLabel')}</label><input type="number" data-tprop="offset" data-tid="${t.id}" value="${t.offset}" step="1"></div>
          ${t.type === 'pie' ? `<div class="param-item"><label>${I.t('trackPieRadius')}</label><input type="number" data-tprop="pieRadius" data-tid="${t.id}" value="${t.pieRadius || 9}" min="2" max="40"></div>` : ''}
${t.type === 'stackedbar' ? `
  <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="percentMode" data-tid="${t.id}" ${t.percentMode ? 'checked' : ''}> ${I.t('trackPercentMode')}</label></div>
  <div class="param-item"><label>${I.t('trackTrackLength')}</label><input type="number" data-tprop="width" data-tid="${t.id}" value="${t.width || 80}" min="20" max="400"></div>
  <div class="param-item"><label>${I.t('trackBarWidth')}</label><input type="number" data-tprop="barWidth" data-tid="${t.id}" value="${t.barWidth || 0}" min="0" max="40" placeholder="0"></div>
` : ''}
          <div class="param-item"><label>${I.t('groupPaletteLabel')}</label><div class="palette-slot" data-palette="${t.id}"></div></div>
        </div>
        ${subTitle(I.t('trackColumnColors'))}
        <div class="custom-color-list" style="display:flex;flex-wrap:wrap;gap:8px;">
          ${colorVals.map((c, i) => {
            const cols2 = global.TreePalette.getCategoricalScheme(t.palette || 'tableau10');
            const defColor = (t.columnColors && t.columnColors[c]) || cols2[i % cols2.length];
            return `<label style="display:flex;align-items:center;gap:4px;font-size:12px;">
              <input type="color" data-tcolcolor="${t.id}" data-cname="${escA(c)}" value="${escA(defColor)}"
                style="width:30px;height:22px;padding:0;border:1px solid #ccc;border-radius:3px;cursor:pointer;">
              <span>${esc(c)}</span>
              <button class="btn-del-color" data-tdelcolcolor="${t.id}" data-cname="${escA(c)}" type="button" title="delete">×</button>
            </label>`;
          }).join('')}
        </div>
        ${t.type === 'stackedbar' ? `
          ${subTitle(I.t('trackBox'))}
          <div class="param-grid cols-4">
            <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="showBox" data-tid="${t.id}" ${t.showBox ? 'checked' : ''}> ${I.t('trackShowBox')}</label></div>
            <div class="param-item"><label>${I.t('trackBoxColor')}</label><input type="color" data-tprop="boxColor" data-tid="${t.id}" value="${t.boxColor || '#bbbbbb'}"></div>
            <div class="param-item"><label>${I.t('trackBoxWidth')}</label><input type="number" data-tprop="boxWidth" data-tid="${t.id}" value="${t.boxWidth || 0.5}" min="0" max="6" step="0.1"></div>
            <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="boxDashed" data-tid="${t.id}" ${t.boxDashed ? 'checked' : ''}> ${I.t('trackBoxDashed')}</label></div>
          </div>
          ${subTitle(I.t('trackXAxis'))}
          <div class="param-grid cols-4">
            <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="showAxisNumbers" data-tid="${t.id}" ${t.showAxisNumbers !== false ? 'checked' : ''}> ${I.t('trackShowAxisTicks')}</label></div>
            <div class="param-item"><label>${I.t('trackMinValue')}</label><input type="number" data-tprop="axisMin" data-tid="${t.id}" value="${t.axisMin != null ? t.axisMin : ''}" placeholder="auto"></div>
            <div class="param-item"><label>${I.t('trackMaxValue')}</label><input type="number" data-tprop="axisMax" data-tid="${t.id}" value="${t.axisMax != null ? t.axisMax : ''}" placeholder="auto"></div>
            <div class="param-item"><label>${I.t('trackAxisInterval')}</label><input type="number" data-tprop="axisInterval" data-tid="${t.id}" value="${t.axisInterval != null ? t.axisInterval : ''}" placeholder="auto"></div>
          </div>
        ` : ''}
        ${legendBlock(t)}
      `;
    } else if (t.type === 'groupedbar') {
      const colorVals = t.columns || [];
      body = `
        <div class="param-grid cols-4">
          <div class="param-item" style="grid-column: span 2;"><label>${I.t('trackMultiColData')}</label>
            <div class="multi-col-checks" style="max-height:120px;overflow:auto;border:1px solid #ddd;border-radius:4px;padding:6px;">
              ${cols.map(c => `<label class="mini-check" style="display:block;padding:2px 0;">
                <input type="checkbox" data-tcol="${t.id}" data-cname="${escA(c)}" ${(t.columns || []).includes(c) ? 'checked' : ''}> ${esc(c)}
              </label>`).join('')}
            </div>
          </div>
          <div class="param-item"><label>${I.t('trackNameLabel')}</label><input type="text" data-tprop="name" data-tid="${t.id}" value="${escA(t.name)}"></div>
          <div class="param-item"><label>${I.t('trackOffsetLabel')}</label><input type="number" data-tprop="offset" data-tid="${t.id}" value="${t.offset}" step="1"></div>
          <div class="param-item"><label>${I.t('trackTrackLength')}</label><input type="number" data-tprop="width" data-tid="${t.id}" value="${t.width || 100}" min="20" max="400"></div>
          <div class="param-item"><label>${I.t('groupPaletteLabel')}</label><div class="palette-slot" data-palette="${t.id}"></div></div>
        </div>
        ${subTitle(I.t('trackColumnColors'))}
        <div class="custom-color-list" style="display:flex;flex-wrap:wrap;gap:8px;">
          ${colorVals.map((c, i) => {
            const cols2 = global.TreePalette.getCategoricalScheme(t.palette || 'tableau10');
            const defColor = (t.columnColors && t.columnColors[c]) || cols2[i % cols2.length];
            return `<label style="display:flex;align-items:center;gap:4px;font-size:12px;">
              <input type="color" data-tcolcolor="${t.id}" data-cname="${escA(c)}" value="${escA(defColor)}"
                style="width:30px;height:22px;padding:0;border:1px solid #ccc;border-radius:3px;cursor:pointer;">
              <span>${esc(c)}</span>
              <button class="btn-del-color" data-tdelcolcolor="${t.id}" data-cname="${escA(c)}" type="button" title="delete">×</button>
            </label>`;
          }).join('')}
        </div>
        ${subTitle(I.t('trackBarOutline'))}
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackBarOutlineColor')}</label><input type="color" data-tprop="barOutlineColor" data-tid="${t.id}" value="${t.barOutlineColor}"></div>
          <div class="param-item"><label>${I.t('trackBarOutlineWidth')}</label><input type="number" data-tprop="barOutlineWidth" data-tid="${t.id}" value="${t.barOutlineWidth}" min="0" max="6"></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="barOutlineDashed" data-tid="${t.id}" ${t.barOutlineDashed ? 'checked' : ''}> ${I.t('trackBarOutlineDashed')}</label></div>
        </div>
        ${subTitle(I.t('trackBox'))}
        <div class="param-grid cols-4">
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="showBox" data-tid="${t.id}" ${t.showBox ? 'checked' : ''}> ${I.t('trackShowBox')}</label></div>
          <div class="param-item"><label>${I.t('trackBoxColor')}</label><input type="color" data-tprop="boxColor" data-tid="${t.id}" value="${t.boxColor || '#bbbbbb'}"></div>
          <div class="param-item"><label>${I.t('trackBoxWidth')}</label><input type="number" data-tprop="boxWidth" data-tid="${t.id}" value="${t.boxWidth || 0.5}" min="0" max="6" step="0.1"></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="boxDashed" data-tid="${t.id}" ${t.boxDashed ? 'checked' : ''}> ${I.t('trackBoxDashed')}</label></div>
        </div>
        ${subTitle(I.t('trackXAxis'))}
        <div class="param-grid cols-4">
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="showAxisNumbers" data-tid="${t.id}" ${t.showAxisNumbers !== false ? 'checked' : ''}> ${I.t('trackShowAxisTicks')}</label></div>
          <div class="param-item"><label>${I.t('trackMinValue')}</label><input type="number" data-tprop="axisMin" data-tid="${t.id}" value="${t.axisMin != null ? t.axisMin : ''}" placeholder="auto"></div>
          <div class="param-item"><label>${I.t('trackMaxValue')}</label><input type="number" data-tprop="axisMax" data-tid="${t.id}" value="${t.axisMax != null ? t.axisMax : ''}" placeholder="auto"></div>
          <div class="param-item"><label>${I.t('trackAxisInterval')}</label><input type="number" data-tprop="axisInterval" data-tid="${t.id}" value="${t.axisInterval != null ? t.axisInterval : ''}" placeholder="auto"></div>
        </div>
        ${legendBlock(t)}
      `;
    } else if (t.type === 'multiheatmap') {
      body = `
        <div class="param-grid cols-4">
          <div class="param-item" style="grid-column: span 2;"><label>${I.t('trackMultiColData')}</label>
            <div class="multi-col-checks" style="max-height:120px;overflow:auto;border:1px solid #ddd;border-radius:4px;padding:6px;">
              ${cols.map(c => `<label class="mini-check" style="display:block;padding:2px 0;">
                <input type="checkbox" data-tcol="${t.id}" data-cname="${escA(c)}" ${(t.columns || []).includes(c) ? 'checked' : ''}> ${esc(c)}
              </label>`).join('')}
            </div>
          </div>
          <div class="param-item"><label>${I.t('trackNameLabel')}</label><input type="text" data-tprop="name" data-tid="${t.id}" value="${escA(t.name)}"></div>
          <div class="param-item"><label>${I.t('trackOffsetLabel')}</label><input type="number" data-tprop="offset" data-tid="${t.id}" value="${t.offset}" step="1"></div>
          <div class="param-item" style="grid-column: span 2;"><label>${I.t('trackContinuousPalette')}</label><div class="palette-slot" data-palette-continuous="${t.id}"></div></div>
          <div class="param-item"><label>${I.t('trackHeatCellWidth')}</label><input type="number" data-tprop="cellWidth" data-tid="${t.id}" value="${t.cellWidth || 20}" min="4" max="200"></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="showBorder" data-tid="${t.id}" ${t.showBorder !== false ? 'checked' : ''}> ${I.t('trackShowBorder')}</label></div>
          <div class="param-item"><label>${I.t('trackOutlineColorLabel')}</label><input type="color" data-tprop="borderColor" data-tid="${t.id}" value="${t.borderColor}"></div>
          <div class="param-item"><label>${I.t('trackOutlineWidthLabel')}</label><input type="number" data-tprop="borderWidth" data-tid="${t.id}" value="${t.borderWidth}" min="0" max="6"></div>
        </div>
        ${subTitle(I.t('multiheatmapColLabelsTitle'))}
        <div class="param-grid cols-4">
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="showColLabels" data-tid="${t.id}" ${t.showColLabels !== false ? 'checked' : ''}> ${I.t('multiheatmapShowColLabels')}</label></div>
          <div class="param-item"><label>${I.t('multiheatmapColLabelFontSize')}</label><input type="number" data-tprop="colLabelFontSize" data-tid="${t.id}" value="${t.colLabelFontSize || 10}" min="6" max="30"></div>
          <div class="param-item"><label>${I.t('multiheatmapColLabelColor')}</label><input type="color" data-tprop="colLabelColor" data-tid="${t.id}" value="${t.colLabelColor || '#333333'}"></div>
          <div class="param-item"><label>${I.t('multiheatmapColLabelOffset')}</label><input type="number" data-tprop="colLabelOffset" data-tid="${t.id}" value="${t.colLabelOffset || 6}" step="1"></div>
          <div class="param-item"><label>${I.t('multiheatmapColLabelOrientation')}</label><select data-tprop="colLabelOrientation" data-tid="${t.id}">
            <option value="vertical" ${(t.colLabelOrientation || 'vertical') === 'vertical' ? 'selected' : ''}>${I.t('multiheatmapColLabelVertical')}</option>
            <option value="horizontal" ${t.colLabelOrientation === 'horizontal' ? 'selected' : ''}>${I.t('multiheatmapColLabelHorizontal')}</option>
          </select></div>
        </div>
        ${subTitle(I.t('trackColorSettings'))}
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackMinValue')}</label><input type="number" data-tprop="gradientMin" data-tid="${t.id}" value="${t.gradientMin != null ? t.gradientMin : ''}" placeholder="empty = data min"></div>
          <div class="param-item"><label>${I.t('trackMaxValue')}</label><input type="number" data-tprop="gradientMax" data-tid="${t.id}" value="${t.gradientMax != null ? t.gradientMax : ''}" placeholder="empty = data max"></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="gradientReverse" data-tid="${t.id}" ${t.gradientReverse ? 'checked' : ''}> ${I.t('trackReverse')}</label></div>
        </div>
        ${legendBlock(t)}
      `;
    }

    return `
      <div class="track-item" data-track-id="${t.id}">
        <div class="track-header" draggable="true">
          <span class="track-drag-handle" title="${I.t('trackDragHint')}">⋮⋮</span>
          <span class="track-title">${esc(typeLabel)}${I.t('trackTitleSep')}${esc(t.name || I.t('trackUntitled'))}</span>
          <button class="track-toggle" data-tid="${t.id}" type="button">${t.collapsed ? '▼' : '▲'}</button>
          <button class="track-remove" data-tid="${t.id}" type="button">×</button>
        </div>
        <div class="track-body" style="${t.collapsed ? 'display:none;' : ''}">${body}</div>
      </div>
    `;
  }).join('');

  box.querySelectorAll('[data-tprop]').forEach(el => {
    el.addEventListener('input', e => {
      const id = Number(el.dataset.tid);
      const prop = el.dataset.tprop;
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      let v;
      if (el.type === 'checkbox') v = el.checked;
      else if (el.type === 'number') v = el.value === '' ? null : Number(el.value);
      else if (prop === 'mergeGroups') v = el.value === 'true';
      else v = el.value;
      const patch = { [prop]: v };
      if ((prop === 'column' || prop === 'shapeColumn') && v && !t.name) patch.name = v;
      TT.updateCustomTrack(id, patch);
      global.TreeRenderer.draw();
      if (prop === 'column' || prop === 'shapeColumn' || prop === 'colorColumn' || prop === 'textAutoWidth') {
        setTimeout(() => refreshTrackList(container), 0);
      }
    });
  });
  box.querySelectorAll('[data-tcolor]').forEach(el => {
    el.addEventListener('input', e => {
      const id = Number(el.dataset.tcolor);
      const val = el.dataset.cval;
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      t.customColors = t.customColors || {};
      t.customColors[val] = el.value;
      t._colorCache = null;
      global.TreeRenderer.draw();
    });
  });
  box.querySelectorAll('[data-tdelcolor]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const id = Number(el.dataset.tdelcolor);
      const val = el.dataset.cval;
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      t.excludedValues = t.excludedValues || [];
      if (!t.excludedValues.includes(val)) t.excludedValues.push(val);
      if (t.customColors) delete t.customColors[val];
      t._colorCache = null;
      refreshTrackList(container);
      global.TreeRenderer.draw();
    });
  });
  box.querySelectorAll('[data-tshape]').forEach(el => {
    el.addEventListener('change', e => {
      const id = Number(el.dataset.tshape);
      const val = el.dataset.sval;
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      t.shapeMap = t.shapeMap || {};
      t.shapeMap[val] = el.value;
      global.TreeRenderer.draw();
    });
  });
  box.querySelectorAll('[data-tcustom]').forEach(el => {
    el.addEventListener('change', e => {
      const id = Number(el.dataset.tcustom);
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      if (el.checked) {
        const stops = global.TreePalette.getContinuousColors(t.gradient || 'Viridis', 3);
        TT.updateCustomTrack(id, { gradientStops: stops });
      } else TT.updateCustomTrack(id, { gradientStops: null });
      refreshTrackList(container);
      global.TreeRenderer.draw();
    });
  });
  box.querySelectorAll('[data-tgrad]').forEach(el => {
    el.addEventListener('input', e => {
      const id = Number(el.dataset.tid);
      const idx = Number(el.dataset.tgrad);
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      const cur = (t.gradientStops && t.gradientStops.length >= 3) ? t.gradientStops.slice() : ['#ffffff', '#888888', '#000000'];
      cur[idx] = el.value;
      t.gradientStops = cur;
      global.TreeRenderer.draw();
    });
  });
  box.querySelectorAll('[data-tcol]').forEach(el => {
    el.addEventListener('change', e => {
      const id = Number(el.dataset.tcol);
      const cname = el.dataset.cname;
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      const set = new Set(t.columns || []);
      if (el.checked) set.add(cname); else set.delete(cname);
      t.columns = [...set];
      TT.updateCustomTrack(id, { columns: t.columns });
      global.TreeRenderer.draw();
      refreshTrackList(container);
    });
  });
  box.querySelectorAll('[data-tcolcolor]').forEach(el => {
    el.addEventListener('input', e => {
      const id = Number(el.dataset.tcolcolor);
      const cname = el.dataset.cname;
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      t.columnColors = t.columnColors || {};
      t.columnColors[cname] = el.value;
      global.TreeRenderer.draw();
    });
  });
  box.querySelectorAll('[data-tdelcolcolor]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const id = Number(el.dataset.tdelcolcolor);
      const cname = el.dataset.cname;
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      if (Array.isArray(t.columns)) {
        t.columns = t.columns.filter(c => c !== cname);
        TT.updateCustomTrack(id, { columns: t.columns });
      }
      if (t.columnColors) delete t.columnColors[cname];
      refreshTrackList(container);
      global.TreeRenderer.draw();
    });
  });
  box.querySelectorAll('[data-add-refline]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.addRefline);
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      t.refLines = t.refLines || [];
      t.refLines.push({ value: 1, color: '#e74c3c', width: 1, dashed: true });
      refreshTrackList(container);
      global.TreeRenderer.draw();
    });
  });
  box.querySelectorAll('[data-del-refline]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.delRefline);
      const idx = Number(btn.dataset.rlidx);
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      t.refLines.splice(idx, 1);
      refreshTrackList(container);
      global.TreeRenderer.draw();
    });
  });
  box.querySelectorAll('[data-rlprop]').forEach(el => {
    el.addEventListener('input', e => {
      const id = Number(el.dataset.tid);
      const idx = Number(el.dataset.rlidx);
      const prop = el.dataset.rlprop;
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      const rl = t.refLines[idx];
      if (!rl) return;
      if (el.type === 'checkbox') rl[prop] = el.checked;
      else if (el.type === 'number') rl[prop] = el.value === '' ? null : Number(el.value);
      else rl[prop] = el.value;
      global.TreeRenderer.draw();
    });
  });
  box.querySelectorAll('.track-toggle').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      toggleTrackAccordion(container, Number(btn.dataset.tid));
    });
  });
  box.querySelectorAll('.track-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      TT.removeCustomTrack(Number(btn.dataset.tid));
      refreshTrackList(container);
      global.TreeRenderer.draw();
    });
  });
  box.querySelectorAll('.track-header').forEach(hdr => {
    hdr.style.cursor = 'pointer';
    hdr.addEventListener('click', e => {
      if (e.target.closest('.track-remove')) return;
      const tid = Number(hdr.querySelector('.track-toggle')?.dataset.tid);
      if (!Number.isFinite(tid)) return;
      toggleTrackAccordion(container, tid);
    });
  });

  let dragSrcId = null;
  box.querySelectorAll('.track-header').forEach(header => {
    const item = header.closest('.track-item');
    if (!item) return;
    header.addEventListener('dragstart', e => {
      if (e.target.closest('button')) { e.preventDefault(); return; }
      const tid = Number(item.dataset.trackId);
      if (!Number.isFinite(tid)) return;
      dragSrcId = tid;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', String(dragSrcId)); } catch (_) {}
    });
    header.addEventListener('dragend', () => {
      dragSrcId = null;
      box.querySelectorAll('.track-item').forEach(i =>
        i.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom'));
    });
  });
  box.querySelectorAll('.track-item').forEach(item => {
    item.addEventListener('dragover', e => {
      if (!dragSrcId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const tgtId = Number(item.dataset.trackId);
      if (tgtId === dragSrcId) return;
      const rect = item.getBoundingClientRect();
      const isTop = e.clientY < rect.top + rect.height / 2;
      item.classList.toggle('drag-over-top', isTop);
      item.classList.toggle('drag-over-bottom', !isTop);
    });
    item.addEventListener('dragleave', e => {
      if (item.contains(e.relatedTarget)) return;
      item.classList.remove('drag-over-top', 'drag-over-bottom');
    });
    item.addEventListener('drop', e => {
      e.preventDefault();
      item.classList.remove('drag-over-top', 'drag-over-bottom');
      const tgtId = Number(item.dataset.trackId);
      if (!dragSrcId || tgtId === dragSrcId) { dragSrcId = null; return; }
      const arr = TT.tracks;
      const srcIdx = arr.findIndex(x => x.id === dragSrcId);
      const tgtIdx = arr.findIndex(x => x.id === tgtId);
      if (srcIdx < 0 || tgtIdx < 0) { dragSrcId = null; return; }
      const rect = item.getBoundingClientRect();
      const isTop = e.clientY < rect.top + rect.height / 2;
      const [moved] = arr.splice(srcIdx, 1);
      let insertIdx = tgtIdx;
      if (srcIdx < tgtIdx) insertIdx -= 1;
      if (!isTop) insertIdx += 1;
      arr.splice(insertIdx, 0, moved);
      dragSrcId = null;
      refreshTrackList(container);
      global.TreeRenderer.draw();
    });
  });
  box.querySelectorAll('[data-trestore-excluded]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const id = Number(btn.dataset.trestoreExcluded);
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      t.excludedValues = [];
      refreshTrackList(container);
      global.TreeRenderer.draw();
    });
  });
  box.querySelectorAll('[data-palette]').forEach(host => {
    const id = Number(host.dataset.palette);
    const t = TT.tracks.find(x => x.id === id);
    if (!t) return;
    S.renderGroupPaletteDropdown(host, {
      selected: t.palette || 'tableau10',
      onSelect: (name) => {
        const pal = global.TreePalette.getCategoricalScheme(name);
        const vals = TT.collectUniqueValues(t);
        t.customColors = {};
        vals.forEach((v, i) => { t.customColors[v] = pal[i % pal.length]; });
        TT.updateCustomTrack(id, { palette: name, customColors: t.customColors, _colorCache: null });
        global.TreeRenderer.draw();
        refreshTrackList(container);
      }
    });
  });
  box.querySelectorAll('[data-palette-continuous]').forEach(host => {
    const id = Number(host.dataset.paletteContinuous);
    const t = TT.tracks.find(x => x.id === id);
    if (!t || !global.ContinuousPalette) return;
    global.ContinuousPalette.render(host, {
      selected: t.gradient || 'Viridis',
      onSelect: (name) => {
        TT.updateCustomTrack(id, { gradient: name, gradientStops: null });
        global.TreeRenderer.draw();
        refreshTrackList(container);
      }
    });
  });
  box.querySelectorAll('[data-lgfield]').forEach(el => {
    el.addEventListener('input', () => {
      const tid = Number(el.dataset.lgtid), idx = Number(el.dataset.lgidx), field = el.dataset.lgfield;
      const t = TT.tracks.find(x => x.id === tid);
      if (!t || !t.legendItems || !t.legendItems[idx]) return;
      t.legendItems[idx][field] = el.type === 'number' ? Number(el.value) : el.value;
      global.TreeRenderer.draw();
    });
  });
  box.querySelectorAll('[data-add-legend-item]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.addLegendItem);
      const t = TT.tracks.find(x => x.id === id); if (!t) return;
      t.legendItems = t.legendItems || [];
      t.legendItems.push({
        shape: 'square', fillColor: '#4DBBD5', strokeColor: '#333333',
        strokeWidth: 0, label: 'Item ' + (t.legendItems.length + 1)
      });
      refreshTrackList(container);
      global.TreeRenderer.draw();
    });
  });
  box.querySelectorAll('[data-del-legend-item]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.delLegendItem), idx = Number(btn.dataset.lgidx);
      const t = TT.tracks.find(x => x.id === id); if (!t || !t.legendItems) return;
      t.legendItems.splice(idx, 1);
      refreshTrackList(container);
      global.TreeRenderer.draw();
    });
  });
}

function bindTrackCommonControls(container) {
  const tc = global.TreeTracks.trackCommon;
  const sync = () => {
    container.querySelector('#tcLegendTitleShow').checked = tc.legendTitleShow;
    container.querySelector('#tcLegendFontSize').value = tc.legendFontSize;
    container.querySelector('#tcLegendBold').checked = tc.legendBold;
    container.querySelector('#tcLegendItalic').checked = tc.legendItalic;
    container.querySelector('#tcLegendTitleFontSize').value = tc.legendTitleFontSize;
    container.querySelector('#tcLegendTitleBold').checked = tc.legendTitleBold;
    container.querySelector('#tcLegendTitleItalic').checked = tc.legendTitleItalic;
    container.querySelector('#tcLegendMaxPerRow').value = tc.legendMaxPerRow;
    container.querySelector('#tcLegendScale').value = tc.legendScale;
    container.querySelector('#tcTrackNameShow').checked = tc.trackNameShow;
    container.querySelector('#tcTrackNameFontSize').value = tc.trackNameFontSize;
    container.querySelector('#tcTrackNameBold').checked = tc.trackNameBold;
    container.querySelector('#tcTrackNameItalic').checked = tc.trackNameItalic;
    container.querySelector('#tcTrackNameAngle').value = tc.trackNameAngle;
    container.querySelector('#tcTrackGap').value = tc.trackGap;
    container.querySelector('#tcAutoShapeSize').checked = tc.autoShapeSize !== false;
  };
  sync();
  const bind = (id, prop, type) => {
    container.querySelector('#' + id)?.addEventListener('input', e => {
      let v;
      if (type === 'bool') v = e.target.checked;
      else if (type === 'num') v = Number(e.target.value);
      else v = e.target.value;
      tc[prop] = v;
      global.TreeRenderer.draw();
    });
  };
  bind('tcLegendTitleShow', 'legendTitleShow', 'bool');
  bind('tcLegendFontSize', 'legendFontSize', 'num');
  bind('tcLegendBold', 'legendBold', 'bool');
  bind('tcLegendItalic', 'legendItalic', 'bool');
  bind('tcLegendTitleFontSize', 'legendTitleFontSize', 'num');
  bind('tcLegendTitleBold', 'legendTitleBold', 'bool');
  bind('tcLegendTitleItalic', 'legendTitleItalic', 'bool');
  bind('tcLegendMaxPerRow', 'legendMaxPerRow', 'num');
  bind('tcLegendScale', 'legendScale', 'num');
  bind('tcTrackNameShow', 'trackNameShow', 'bool');
  bind('tcTrackNameFontSize', 'trackNameFontSize', 'num');
  bind('tcTrackNameBold', 'trackNameBold', 'bool');
  bind('tcTrackNameItalic', 'trackNameItalic', 'bool');
  bind('tcTrackNameAngle', 'trackNameAngle', 'num');
  bind('tcTrackGap', 'trackGap', 'num');
  bind('tcAutoShapeSize', 'autoShapeSize', 'bool');
}

function syncRangesControls(container) {
  const R = global.TreeRanges;
  if (!R) return;
  const setVal = (sel, val) => { const el = container.querySelector(sel); if (el) el.value = val; };
  const setChk = (sel, v) => { const el = container.querySelector(sel); if (el) el.checked = !!v; };
  const bindOnce = (el, evt, handler) => {
    if (!el) return;
    const key = 'bound' + evt.charAt(0).toUpperCase() + evt.slice(1);
    if (el.dataset[key] === '1') return;
    el.dataset[key] = '1';
    el.addEventListener(evt, handler);
  };
  setVal('#rangeCoverSelect', R.rangeCover || 'label');
  setChk('#rangeColorBranchesChk', !!R.rangeColorBranches);
  setChk('#rangeColorLabelsChk', !!R.rangeColorLabels);
  setVal('#rpBorder', R.rangeBorder);
  setVal('#rpBorderColor', R.rangeBorderColor);
  setVal('#rangeGradient', String(C.state.rangeGradient));
  setVal('#rangeOpacity', (1 - (Number(C.state.rangeOpacity) || 0)).toFixed(2));
  setChk('#rangeLabelTrackShowChk', R.rangeLabelTrackShow !== false);
  setChk('#rangeLabelTrackTitleShowChk', R.rangeLabelTrackTitleShow !== false);
  setVal('#rangeLabelTrackTitle', R.rangeLabelTrackTitle || 'Groups');
  setVal('#rangeLabelTrackOffset', R.rangeLabelTrackOffset || 0);
  setVal('#rangeLabelTextOffsetX', R.rangeLabelTrackTextOffsetX || 0);
  setVal('#rangeLabelTextOffsetY', R.rangeLabelTrackTextOffsetY || 0);
  setChk('#rangeLabelTrackAutoWidthChk', !!R.rangeLabelTrackAutoWidth);
  setVal('#rangeLabelTrackWidth', R.rangeLabelTrackWidth || 60);
  const autoW = !!R.rangeLabelTrackAutoWidth;
  const widthInput = container.querySelector('#rangeLabelTrackWidth');
  if (widthInput) widthInput.disabled = autoW;
  setVal('#rangeLabelTrackOpacity', R.rangeLabelTrackOpacity != null ? R.rangeLabelTrackOpacity : 1);
  setVal('#rangeLabelTrackTextOrientation', R.rangeLabelTrackTextOrientation || 'horizontal');
  setChk('#rangeShowLabelsSelect', !!R.rangeShowLabels);
  setVal('#rpLabelSize', R.rangeLabelSize);
  setChk('#rpLabelBoldChk', R.rangeLabelBold);
  setChk('#rpLabelItalicChk', R.rangeLabelItalic);
  setVal('#rpLabelColor', R.rangeLabelColor || '#333333');
  setChk('#showLegendChk', C.state.showLegend);
  setVal('#legendTitle', C.state.legendTitle);
  setVal('#legendColor', C.state.legendColor);

  bindOnce(container.querySelector('#rangeLabelTrackShowChk'), 'change', e => {
    R.rangeLabelTrackShow = e.target.checked;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rangeLabelTrackTitleShowChk'), 'change', e => {
    R.rangeLabelTrackTitleShow = e.target.checked;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rangeLabelTrackTitle'), 'input', e => {
    R.rangeLabelTrackTitle = e.target.value;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rangeLabelTrackOffset'), 'input', e => {
    R.rangeLabelTrackOffset = Number(e.target.value) || 0;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rangeLabelTextOffsetX'), 'input', e => {
    R.rangeLabelTrackTextOffsetX = Number(e.target.value) || 0;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rangeLabelTextOffsetY'), 'input', e => {
    R.rangeLabelTrackTextOffsetY = Number(e.target.value) || 0;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rangeLabelTrackAutoWidthChk'), 'change', e => {
    R.rangeLabelTrackAutoWidth = e.target.checked;
    if (widthInput) widthInput.disabled = e.target.checked;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rangeLabelTrackWidth'), 'input', e => {
    if (e.target.disabled) return;
    R.rangeLabelTrackWidth = Math.max(10, Number(e.target.value) || 60);
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rangeLabelTrackOpacity'), 'input', e => {
    R.rangeLabelTrackOpacity = Math.max(0, Math.min(1, Number(e.target.value)));
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rangeLabelTrackTextOrientation'), 'change', e => {
    R.rangeLabelTrackTextOrientation = e.target.value;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rangeShowLabelsSelect'), 'change', e => {
    R.rangeShowLabels = e.target.checked;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rangeColorBranchesChk'), 'change', e => {
    R.rangeColorBranches = e.target.checked;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rangeColorLabelsChk'), 'change', e => {
    R.rangeColorLabels = e.target.checked;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rpLabelSize'), 'input', e => {
    R.rangeLabelSize = Number(e.target.value) || 13;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rpLabelBoldChk'), 'change', e => {
    R.rangeLabelBold = e.target.checked;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rpLabelItalicChk'), 'change', e => {
    R.rangeLabelItalic = e.target.checked;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rpLabelColor'), 'input', e => {
    R.rangeLabelColor = e.target.value;
    global.TreeRenderer.draw();
  });
}

function renderDatasetsPanel(container) {
  if (!container) return;
  const R = global.TreeRanges;

  container.innerHTML = `
    <div class="param-panel" id="leafLabelPanel">
      <div class="param-panel-title">${I.t('leafLabelPanel')}</div>
      <div class="param-grid cols-4">
        <div class="param-item" style="grid-column: span 2;">
          <label>${I.t('leafLabelDataColumn')}</label>
          <select id="leafLabelColumn"><option value="">${I.t('leafLabelUseLeafName')}</option></select>
        </div>
        <div class="param-item" style="align-self:end;">
          <button class="btn" id="applyLeafLabelColumn" type="button">${I.t('applyLeafLabel')}</button>
          <button class="btn btn-outline" id="resetLeafLabelColumn" type="button">${I.t('resetLeafLabel')}</button>
        </div>
      </div>
      <div class="sub-section-title" style="margin-top:10px;">${I.t('leafLabelStylePanel')}</div>
      <div class="param-grid cols-4">
        <div class="param-item" style="grid-column: span 2;">
          <label>${I.t('leafLabelStyleColumn')}</label>
          <select id="leafLabelStyleColumn"><option value="">${I.t('leafLabelStyleNone')}</option></select>
        </div>
        <div class="param-item" style="align-self:end;">
          <button class="btn" id="applyLeafLabelStyleColumn" type="button">${I.t('applyLeafLabelStyle')}</button>
          <button class="btn btn-outline" id="resetLeafLabelStyleColumn" type="button">${I.t('resetLeafLabelStyle')}</button>
        </div>
      </div>
      <div class="info-box" style="margin-top:6px;font-size:12px;line-height:1.65;">
        ${I.t('leafLabelStyleHint')}
      </div>
    </div>
    <div class="param-panel" id="trackCommonPanel">
      <div class="param-panel-title">${I.t('trackCommonPanel')}</div>
      ${subTitle(I.t('trackLegendCommon'))}
      <div class="param-grid cols-4">
        <div class="param-item"><label class="mini-check"><input type="checkbox" id="tcLegendTitleShow" checked> ${I.t('trackLegendTitleShow')}</label></div>
        <div class="param-item"><label>${I.t('trackLegendFontSize')}</label><input id="tcLegendFontSize" type="number" min="6" max="40" value="11"></div>
        <div class="param-item"><label class="mini-check"><input type="checkbox" id="tcLegendBold"> ${I.t('trackLegendBold')}</label></div>
        <div class="param-item"><label class="mini-check"><input type="checkbox" id="tcLegendItalic"> ${I.t('trackLegendItalic')}</label></div>
        <div class="param-item"><label>${I.t('trackLegendTitleFontSize')}</label><input id="tcLegendTitleFontSize" type="number" min="6" max="40" value="30"></div>
        <div class="param-item"><label class="mini-check"><input type="checkbox" id="tcLegendTitleBold" checked> ${I.t('trackLegendTitleBold')}</label></div>
        <div class="param-item"><label class="mini-check"><input type="checkbox" id="tcLegendTitleItalic"> ${I.t('trackLegendTitleItalic')}</label></div>
        <div class="param-item"><label>${I.t('trackLegendMaxPerRow')}</label><input id="tcLegendMaxPerRow" type="number" min="0" max="20" value="0" placeholder="0"></div>
        <div class="param-item"><label>${I.t('trackLegendScale')}</label><input id="tcLegendScale" type="number" min="0.3" max="50" step="0.1" value="1"></div>
      </div>
      ${subTitle(I.t('trackNameAndGap'))}
      <div class="param-grid cols-4">
        <div class="param-item"><label class="mini-check"><input type="checkbox" id="tcTrackNameShow" checked> ${I.t('trackNameShow')}</label></div>
        <div class="param-item"><label>${I.t('trackNameFontSize')}</label><input id="tcTrackNameFontSize" type="number" min="6" max="40" value="26"></div>
        <div class="param-item"><label class="mini-check"><input type="checkbox" id="tcTrackNameBold" checked> ${I.t('trackNameBold')}</label></div>
        <div class="param-item"><label class="mini-check"><input type="checkbox" id="tcTrackNameItalic"> ${I.t('trackNameItalic')}</label></div>
        <div class="param-item"><label>${I.t('trackNameAngle')}</label><input id="tcTrackNameAngle" type="number" min="-90" max="90" step="1" value="-45"></div>
        <div class="param-item"><label>${I.t('trackGap')}</label><input id="tcTrackGap" type="number" min="0" step="1" value="50"></div>
      </div>
      ${subTitle(I.t('trackShapeSizeCommon'))}
      <div class="param-grid cols-4">
        <div class="param-item"><label class="mini-check">
          <input type="checkbox" id="tcAutoShapeSize" checked> ${I.t('trackAutoShapeSize')}
        </label></div>
      </div>
    </div>

    <div class="param-panel" id="rangeBackgroundPanel">
      <div class="param-panel-title">${I.t('rangeBackgroundPanel')}</div>
      <div class="param-grid cols-4">
        <div class="param-item">
          <label>${I.t('groupDataColumn')}</label>
          <select id="groupByColumn"><option value="">${I.t('groupChooseColumn')}</option></select>
        </div>
        <div class="param-item" style="grid-column: span 2;">
          <label>${I.t('groupPaletteLabel')}</label>
          <div id="groupPaletteContainer"></div>
        </div>
        <div class="param-item" style="align-self:end;">
          <button class="btn" id="applyGroupByColumn" type="button">${I.t('applyGroup')}</button>
          <button class="btn btn-outline" id="clearGroupsBtn" type="button">${I.t('clearGroup')}</button>
        </div>
      </div>
      <div class="rp-list" id="rpList" style="max-height:220px;overflow:auto;margin-top:10px;border:1px solid #eef1f0;border-radius:4px;"></div>
      ${subTitle(I.t('rangeStyleTitle'))}
      <div class="param-grid cols-4">
        <div class="param-item"><label>${I.t('rangeCoverLabel')}</label>
          <select id="rangeCoverSelect">
            <option value="label">${I.t('rangeCoverOptLabel')}</option>
            <option value="clade">${I.t('rangeCoverOptClade')}</option>
            <option value="full">${I.t('rangeCoverOptFull')}</option>
            <option value="none">${I.t('rangeCoverOptNone')}</option>
            <option value="off">${I.t('rangeCoverOptOff')}</option>
          </select>
        </div>
        <div class="param-item"><label class="mini-check">
          <input type="checkbox" id="rangeColorBranchesChk"> ${I.t('rangeColorBranches')}
        </label></div>
        <div class="param-item"><label class="mini-check">
          <input type="checkbox" id="rangeColorLabelsChk"> ${I.t('rangeColorLabels')}
        </label></div>
        <div class="param-item"><label>${I.t('rangeBorderWidth')}</label>
          <input id="rpBorder" type="number" min="0" max="8" step="1" value="0">
        </div>
        <div class="param-item"><label>${I.t('rangeBorderColor2')}</label>
          <input id="rpBorderColor" type="color" value="#333333">
        </div>
        <div class="param-item"><label>${I.t('rangeFillStyle')}</label>
          <select id="rangeGradient">
            <option value="false">${I.t('rangeFillSolid')}</option>
            <option value="true">${I.t('rangeFillGradient')}</option>
          </select>
        </div>
        <div class="param-item"><label>${I.t('rangeOpacity2')}</label>
          <input id="rangeOpacity" type="number" min="0" max="1" step="0.05" value="0.15">
        </div>
      </div>
      ${subTitle(I.t('rangeLabelTrackTitle2'))}
      <div class="param-grid cols-4">
        <div class="param-item"><label class="mini-check">
          <input type="checkbox" id="rangeLabelTrackShowChk" checked> ${I.t('rangeLabelTrackShowChk')}
        </label></div>
        <div class="param-item"><label class="mini-check">
          <input type="checkbox" id="rangeLabelTrackTitleShowChk" checked> ${I.t('rangeLabelTrackTitleShowChk')}
        </label></div>
        <div class="param-item"><label>${I.t('rangeLabelTrackTitleLabel')}</label>
          <input id="rangeLabelTrackTitle" type="text" value="Groups">
        </div>
        <div class="param-item"><label>${I.t('rangeLabelTrackOffsetLabel')}</label>
          <input id="rangeLabelTrackOffset" type="number" step="1" value="0">
        </div>
        <div class="param-item"><label>${I.t('rangeLabelTextOffsetX')}</label>
          <input id="rangeLabelTextOffsetX" type="number" step="1" value="0">
        </div>
        <div class="param-item"><label>${I.t('rangeLabelTextOffsetY')}</label>
          <input id="rangeLabelTextOffsetY" type="number" step="1" value="0">
        </div>
        <div class="param-item"><label class="mini-check">
          <input type="checkbox" id="rangeLabelTrackAutoWidthChk"> ${I.t('rangeLabelTrackAutoWidthChk')}
        </label></div>
        <div class="param-item"><label>${I.t('rangeLabelTrackWidthLabel')}</label>
          <input id="rangeLabelTrackWidth" type="number" min="10" max="300" step="1" value="60">
        </div>
        <div class="param-item"><label>${I.t('rangeLabelTrackOpacityLabel')}</label>
          <input id="rangeLabelTrackOpacity" type="number" min="0" max="1" step="0.05" value="1">
        </div>
        <div class="param-item"><label>${I.t('rangeLabelTrackTextOrientation')}</label>
          <select id="rangeLabelTrackTextOrientation">
            <option value="horizontal">${I.t('rangeLabelTextHorizontal')}</option>
            <option value="vertical">${I.t('rangeLabelTextVertical')}</option>
          </select>
        </div>
        <div class="param-item"><label class="mini-check">
          <input type="checkbox" id="rangeShowLabelsSelect" checked> ${I.t('rangeShowLabelsChk')}
        </label></div>
        <div class="param-item"><label>${I.t('rangeLabelSizeLabel')}</label>
          <input id="rpLabelSize" type="number" min="6" max="60" step="1" value="13">
        </div>
        <div class="param-item"><label class="mini-check">
          <input type="checkbox" id="rpLabelBoldChk" checked> ${I.t('rangeLabelBoldChk')}
        </label></div>
        <div class="param-item"><label class="mini-check">
          <input type="checkbox" id="rpLabelItalicChk"> ${I.t('rangeLabelItalicChk')}
        </label></div>
        <div class="param-item"><label>${I.t('rangeLabelColorLabel')}</label>
          <input id="rpLabelColor" type="color" value="#333333">
        </div>
      </div>
      ${subTitle(I.t('legendPanelTitle'))}
      <div class="param-grid cols-4">
        <div class="param-item"><label class="mini-check">
          <input type="checkbox" id="showLegendChk"> ${I.t('legendShowChk')}
        </label></div>
        <div class="param-item"><label>${I.t('legendTitleLabel')}</label>
          <input id="legendTitle" type="text" value="Groups">
        </div>
        <div class="param-item"><label>${I.t('legendColorLabel')}</label>
          <input id="legendColor" type="color" value="#222222">
        </div>
      </div>
    </div>

    <div class="param-panel" id="customTrackPanel">
      <div class="param-panel-title">${I.t('customTrackPanel')}</div>
      <div id="trackList" class="track-list"></div>
      <div class="param-grid cols-4" style="margin-top:12px;">
        <div class="param-item"><label>${I.t('customTrackType')}</label>
          <select id="newTrackType">
            <option value="legend">${I.t('optLegend')}</option>
            <option value="colorstrip">${I.t('optColorstrip')}</option>
            <option value="binary">${I.t('optBinary')}</option>
            <option value="multisymbol">${I.t('optSymbols')}</option>
            <option value="bar">${I.t('optSimpleBar')}</option>
            <option value="stackedbar">${I.t('optMultibar')}</option>
            <option value="groupedbar">${I.t('optGroupedbar')}</option>
            <option value="pie">${I.t('optPiechart')}</option>
            <option value="heatstrip">${I.t('optGradient')}</option>
            <option value="multiheatmap">${I.t('optMultiheatmap')}</option>
            <option value="text">${I.t('optText')}</option>
          </select>
        </div>
        <div class="param-item" style="align-self:end;">
          <button class="btn" id="addTrackBtn" type="button">${I.t('customTrackAddBtn')}</button>
        </div>
      </div>
    </div>
  `;

  S.renderGroupPaletteDropdown(container.querySelector('#groupPaletteContainer'), {
    selected: R ? R.ringPalette : 'tableau10',
    onSelect: (name) => {
      if (!R) return;
      R.ringPalette = name;
      if (R.colorRanges.length) {
        R.recolorRangesByPalette();
        if (global.TreeRenderer) global.TreeRenderer.draw();
      }
    }
  });

  bindTrackCommonControls(container);
  syncRangesControls(container);

  const leafLabelSel = container.querySelector('#leafLabelColumn');
  const refreshLeafLabelCols = () => {
    const ld = global.TreeAppData && global.TreeAppData.leafData;
    const headers = (ld && ld.headers) ? ld.headers.filter(h => h !== 'Leaf') : [];
    const cur = leafLabelSel.value;
    leafLabelSel.innerHTML = `<option value="">${I.t('leafLabelUseLeafName')}</option>` +
      headers.map(h => `<option value="${escA(h)}" ${h === cur ? 'selected' : ''}>${esc(h)}</option>`).join('');
  };
  if (leafLabelSel) {
    leafLabelSel.addEventListener('pointerdown', refreshLeafLabelCols);
    leafLabelSel.addEventListener('focus', refreshLeafLabelCols);
    refreshLeafLabelCols();
  }
  container.querySelector('#applyLeafLabelColumn')?.addEventListener('click', () => {
    const col = leafLabelSel ? leafLabelSel.value : '';
    if (!col) { R.resetLeafLabels(); return; }
    R.applyLeafLabelColumn(col);
  });
  container.querySelector('#resetLeafLabelColumn')?.addEventListener('click', () => R.resetLeafLabels());
  const leafStyleSel = container.querySelector('#leafLabelStyleColumn');
  const refreshLeafStyleCols = () => {
    if (!leafStyleSel) return;
    const ld = global.TreeAppData && global.TreeAppData.leafData;
    const headers = (ld && ld.headers) ? ld.headers.filter(h => h !== 'Leaf') : [];
    const cur = leafStyleSel.value;
    leafStyleSel.innerHTML = `<option value="">${I.t('leafLabelStyleNone')}</option>` +
      headers.map(h => `<option value="${escA(h)}" ${h === cur ? 'selected' : ''}>${esc(h)}</option>`).join('');
  };
  if (leafStyleSel) {
    leafStyleSel.addEventListener('pointerdown', refreshLeafStyleCols);
    leafStyleSel.addEventListener('focus', refreshLeafStyleCols);
    refreshLeafStyleCols();
  }
  container.querySelector('#applyLeafLabelStyleColumn')?.addEventListener('click', () => {
    const col = leafStyleSel ? leafStyleSel.value : '';
    if (!col) { alert(I.t('leafLabelStyleNone')); return; }
    R.applyLeafLabelStyleColumn(col);
  });
  container.querySelector('#resetLeafLabelStyleColumn')?.addEventListener('click', () => R.resetLeafLabelStyles());
  const groupSel = container.querySelector('#groupByColumn');
  const refreshCols = () => {
    const ld = global.TreeAppData && global.TreeAppData.leafData;
    const headers = (ld && ld.headers) ? ld.headers.slice() : [];
    const cur = groupSel.value;
    groupSel.innerHTML = `<option value="">${I.t('groupChooseColumn')}</option>` +
      headers.map(h => `<option value="${escA(h)}" ${h === cur ? 'selected' : ''}>${esc(h)}</option>`).join('');
  };
  if (groupSel) {
    groupSel.addEventListener('pointerdown', refreshCols);
    groupSel.addEventListener('focus', refreshCols);
    refreshCols();
  }
  container.querySelector('#applyGroupByColumn')?.addEventListener('click', () => {
    const col = groupSel ? groupSel.value : '';
    if (!col) { alert(I.t('groupChooseColumn')); return; }
    R.applyGroupsByColumn(col);
  });
  container.querySelector('#clearGroupsBtn')?.addEventListener('click', () => {
    R.clearAllColorRanges();
    R.renderRangesPanel();
    if (global.TreeRenderer) global.TreeRenderer.draw();
  });
  container.querySelector('#addTrackBtn')?.addEventListener('click', () => {
    const type = container.querySelector('#newTrackType')?.value || 'colorstrip';
    const t = global.TreeTracks.addCustomTrack({ type });
    global.TreeTracks.tracks.forEach(o => { if (o.id !== t.id) o.collapsed = true; });
    refreshTrackList(container);
    global.TreeRenderer.draw();
  });

  refreshTrackList(container);
}

global.TreeUITracks = { renderDatasetsPanel, refreshTrackList };
})(window);