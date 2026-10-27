(function (global) {
'use strict';
const C = global.TreeCore;
const T = global.TreeTraverse;
const I = global.TreeI18N;
const S = global.TreeUI;
const W = global.TreeCommonWidgets;

function esc(s) { return S.escapeHtml(s); }
function escA(s) { return S.escapeAttr(s); }

function renderNodeLabelItem(item, index, nodeDataColumns) {
  const isText = item.mode === "text";
  const opts = nodeDataColumns.map(c => `<option value="${escA(c)}" ${item.column===c?'selected':''}>${esc(c)}</option>`).join('');
  return `
    <div class="node-label-item" data-nlid="${item.id}">
      <div class="nli-head">
        <span>${I.t('nodeLabelItemTitle')} #${index + 1}</span>
        <button class="nli-remove" data-remove="${item.id}" type="button">×</button>
      </div>
      <div class="param-grid cols-4">
        <div class="param-item"><label>${I.t('nodeLabelDataColumn')}</label>
          <select data-prop="column" data-nlid="${item.id}"><option value="">${I.t('trackUntitled')}</option>${opts}</select></div>
        <div class="param-item"><label>${I.t('nodeLabelMode')}</label>
          <select data-prop="mode" data-nlid="${item.id}">
            <option value="text" ${isText?'selected':''}>${I.t('nodeLabelModeText')}</option>
            <option value="symbol" ${!isText?'selected':''}>${I.t('nodeLabelModeSymbol')}</option>
          </select></div>
        <div class="param-item"><label>${I.t('nodeLabelThresholdLogic')}</label>
          <select data-prop="thresholdLogic" data-nlid="${item.id}">
            <option value="" ${!item.thresholdLogic?'selected':''}>${I.t('optThresholdNone')}</option>
            <option value="gt" ${item.thresholdLogic==='gt'?'selected':''}>${I.t('optThresholdGt')}</option>
            <option value="gte" ${item.thresholdLogic==='gte'?'selected':''}>${I.t('optThresholdGte')}</option>
            <option value="lt" ${item.thresholdLogic==='lt'?'selected':''}>${I.t('optThresholdLt')}</option>
            <option value="lte" ${item.thresholdLogic==='lte'?'selected':''}>${I.t('optThresholdLte')}</option>
          </select></div>
        <div class="param-item"><label>${I.t('nodeLabelThresholdValue')}</label>
          <input type="number" data-prop="threshold" data-nlid="${item.id}" value="${item.threshold!=null?item.threshold:''}" step="any" ${item.thresholdLogic?'':'disabled'}></div>
        ${isText ? `
          <div class="param-item"><label>${I.t('nodeLabelDecimals')}</label><input type="number" data-prop="decimals" data-nlid="${item.id}" value="${item.decimals!=null?item.decimals:2}" min="0" max="6"></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-prop="asPercent" data-nlid="${item.id}" ${item.asPercent?'checked':''}> ${I.t('nodeLabelAsPercent')}</label></div>
        ` : `
          <div class="param-item"><label>${I.t('nodeLabelShape')}</label>
            <select data-prop="shape" data-nlid="${item.id}">
              <option value="circle" ${item.shape==='circle'?'selected':''}>${I.t('optShapeCircle')}</option>
              <option value="triangle" ${item.shape==='triangle'?'selected':''}>${I.t('optShapeTriangle')}</option>
              <option value="square" ${item.shape==='square'?'selected':''}>${I.t('optShapeSquare')}</option>
              <option value="star" ${item.shape==='star'?'selected':''}>${I.t('optShapeStar')}</option>
            </select></div>
          <div class="param-item"><label>${I.t('nodeLabelStrokeColor')}</label><input type="color" data-prop="strokeColor" data-nlid="${item.id}" value="${item.strokeColor||'#000000'}"></div>
          <div class="param-item"><label>${I.t('nodeLabelStrokeWidth')}</label><input type="number" data-prop="strokeWidth" data-nlid="${item.id}" value="${item.strokeWidth||0}" min="0" max="6" step="0.5"></div>
          <div class="param-item"><label>${I.t('nodeLabelFillColor')}</label><input type="color" data-prop="fillColor" data-nlid="${item.id}" value="${item.fillColor||'#E64B35'}"></div>
          <div class="param-item"><label>${I.t('nodeLabelMaxSize')}</label><input type="number" data-prop="maxSize" data-nlid="${item.id}" value="${item.maxSize||10}" min="1" max="30"></div>
          <div class="param-item"><label>${I.t('nodeLabelMinSize')}</label><input type="number" data-prop="minSize" data-nlid="${item.id}" value="${item.minSize||2}" min="1" max="30"></div>
        `}
      </div>
    </div>`;
}

function renderAdvancedPanel(container) {
  if (!container) return;
  const st = C.state;
  const metaFields = [];
  if (C.getRoot()) T.allWalk(C.getRoot(), n => (n.meta || []).forEach(f => { if (f && f.field && !metaFields.includes(f.field)) metaFields.push(f.field); }));
  metaFields.sort();
  const nodeDataColumns = ["support", "length", "cumLength", "uid", "label", ...metaFields];
  const rangeFields = metaFields;
  const pieCfg = st.pieMarker || {};
  const piePal = global.TreePalette.getCategoricalScheme(pieCfg.palette || 'tableau10');

  function renderNodeLabelList() {
    const list = container.querySelector('#nodeLabelList');
    if (!list) return;
    if (!st.nodeLabels.length) { list.innerHTML = ''; return; }
    list.innerHTML = st.nodeLabels.map((it, i) => renderNodeLabelItem(it, i, nodeDataColumns)).join('');
    list.querySelectorAll('[data-prop]').forEach(el => {
      el.addEventListener('input', e => {
        const id = Number(el.dataset.nlid);
        const prop = el.dataset.prop;
        const item = C.state.nodeLabels.find(it => it.id === id);
        if (!item) return;
        if (el.type === 'checkbox') item[prop] = el.checked;
        else if (el.type === 'number') item[prop] = el.value === '' ? null : Number(el.value);
        else item[prop] = el.value;
        if (prop === 'mode') renderNodeLabelList();
        if (prop === 'thresholdLogic') {
          const numInput = list.querySelector(`input[data-prop="threshold"][data-nlid="${id}"]`);
          if (numInput) numInput.disabled = !el.value;
        }
        global.TreeRenderer.draw();
      });
    });
    list.querySelectorAll('.nli-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.remove);
        C.state.nodeLabels = C.state.nodeLabels.filter(it => it.id !== id);
        renderNodeLabelList();
        global.TreeRenderer.draw();
      });
    });
  }

  container.innerHTML = `
    <div class="param-panel"><div class="param-panel-title">${I.t('panelLengthLabel')}</div>
      <div class="param-grid cols-4">
        <div class="param-item"><label>${I.t('lengthLabelShow')}</label>
          <select id="lenLabelShow"><option value="false" ${st.lengthLabel.show?'':'selected'}>${I.t('optHidden')}</option><option value="true" ${st.lengthLabel.show?'selected':''}>${I.t('optShown')}</option></select></div>
        <div class="param-item"><label>${I.t('lengthLabelDecimals')}</label><input id="lenLabelDecimals" type="number" value="${st.lengthLabel.decimals}" min="0" max="6"></div>
        <div class="param-item"><label>${I.t('lengthLabelAsTime')}</label>
          <select id="lenLabelAsTime"><option value="false" ${!st.lengthLabel.asTime?'selected':''}>${I.t('optNo')}</option><option value="true" ${st.lengthLabel.asTime?'selected':''}>${I.t('optYes')}</option></select></div>
        <div class="param-item"><label>${I.t('lengthLabelTimeRootAge')}</label><input id="lenLabelTimeRootAge" type="number" value="${st.lengthLabel.timeRootAge!=null?st.lengthLabel.timeRootAge:0}" step="0.01"></div>
        <div class="param-item"><label>${I.t('lengthLabelTimeFactor')}</label><input id="lenLabelTimeFactor" type="number" value="${st.lengthLabel.timeFactor}" step="0.001"></div>
        <div class="param-item"><label>${I.t('lengthLabelCiField')}</label>
          <select id="lenLabelCiField"><option value="">${I.t('optThresholdNone')}</option>${metaFields.map(f=>`<option value="${escA(f)}" ${st.lengthLabel.ciField===f?'selected':''}>${esc(f)}</option>`).join('')}</select></div>
      </div>
      <div class="style-box" style="margin-top:8px;">
        <div class="style-box-title">${I.t('styleBoxLabelText')}</div>
        <div data-lenlabel-text-host></div>
      </div>
      <div class="param-grid cols-4" style="margin-top:8px;">
        <div class="param-item"><label>${I.t('lengthLabelOffsetX')}</label><input id="lenLabelOffsetX" type="number" value="${st.lengthLabel.offsetX || 0}" step="1"></div>
        <div class="param-item"><label>${I.t('lengthLabelOffsetY')}</label><input id="lenLabelOffsetY" type="number" value="${st.lengthLabel.offsetY || 0}" step="1"></div>
        <div class="param-item"><label>${I.t('lengthLabelOffsetTangent')}</label><input id="lenLabelOffsetTangent" type="number" value="${st.lengthLabel.offsetTangent || 0}" step="1"></div>
        <div class="param-item"><label>${I.t('lengthLabelOffsetRadial')}</label><input id="lenLabelOffsetRadial" type="number" value="${st.lengthLabel.offsetRadial || 0}" step="1"></div>
      </div>
    </div>

    <div class="param-panel"><div class="param-panel-title">${I.t('panelNodeLabelDisplay')}</div>
      <div class="sub-section-title"><strong>${I.t('nodeLabelCommon')}</strong></div>
      <div class="param-grid cols-4">
        <div class="param-item"><label class="mini-check"><input id="nodeLabelMergeText" type="checkbox" ${st.nodeLabelCommon.mergeText!==false?'checked':''}> ${I.t('nodeLabelMergeText')}</label></div>
        <div class="param-item"><label>${I.t('nodeLabelFillColorAs')}</label>
          <select id="nodeLabelFillColorAs">
            <option value="text" ${st.nodeLabelCommon.fillColorAs!=='background'?'selected':''}>${I.t('nodeLabelFillAsText')}</option>
            <option value="background" ${st.nodeLabelCommon.fillColorAs==='background'?'selected':''}>${I.t('nodeLabelFillAsBackground')}</option>
          </select></div>
        <div class="param-item"><label>${I.t('nodeLabelBgFillLabel')}</label><input id="nodeLabelBgFill" type="color" value="${st.nodeLabelCommon.bgFill||'#eeeeee'}"></div>
        <div class="param-item"><label>${I.t('nodeLabelBgBorderColorLabel')}</label><input id="nodeLabelBgBorderColor" type="color" value="${st.nodeLabelCommon.bgBorderColor||'#cccccc'}"></div>
        <div class="param-item"><label>${I.t('nodeLabelBgBorderWidthLabel')}</label><input id="nodeLabelBgBorderWidth" type="number" value="${st.nodeLabelCommon.bgBorderWidth||0}" min="0" max="6" step="0.5"></div>
        <div class="param-item"><label>${I.t('nodeLabelTextColorOnBg')}</label><input id="nodeLabelTextColorOnBg" type="color" value="${st.nodeLabelCommon.textColorOnBg||'#222222'}"></div>
        <div class="param-item"><label>${I.t('nodeLabelSeparator')}</label><input id="nodeLabelSeparator" type="text" value="${escA(st.nodeLabelCommon.separator)}" style="white-space:pre;font-family:monospace"></div>
        <div class="param-item"><label class="mini-check"><input id="nodeLabelHideOnLeaves" type="checkbox" ${st.nodeLabelCommon.hideOnLeaves?'checked':''}> ${I.t('nodeLabelHideOnLeaves')}</label></div>
      </div>
      <div class="style-box" style="margin-top:8px;">
        <div class="style-box-title">${I.t('styleBoxLabelText')}</div>
        <div data-nodelabel-text-host></div>
      </div>
      <div class="param-grid cols-4" style="margin-top:8px;">
        <div class="param-item"><label>${I.t('nodeLabelOffsetX')}</label><input id="nodeLabelOffsetX" type="number" value="${st.nodeLabelCommon.offsetX || 0}" step="1"></div>
        <div class="param-item"><label>${I.t('nodeLabelOffsetY')}</label><input id="nodeLabelOffsetY" type="number" value="${st.nodeLabelCommon.offsetY || 0}" step="1"></div>
        <div class="param-item"><label>${I.t('nodeLabelOffsetTangent')}</label><input id="nodeLabelOffsetTangent" type="number" value="${st.nodeLabelCommon.offsetTangent || 0}" step="1"></div>
        <div class="param-item"><label>${I.t('nodeLabelOffsetRadial')}</label><input id="nodeLabelOffsetRadial" type="number" value="${st.nodeLabelCommon.offsetRadial || 0}" step="1"></div>
      </div>
      <div id="nodeLabelList" style="margin-top:10px;"></div>
      <div class="btn-group" style="margin-top:10px;">
        <button class="btn" id="addNodeLabelBtn" type="button">${I.t('nodeLabelAdd')}</button>
      </div>
    </div>

    <div class="param-panel"><div class="param-panel-title">${I.t('panelPieMarkerDisplay')}</div>
      <div class="param-grid cols-4">
        <div class="param-item"><label>${I.t('pieMarkerShow')}</label>
          <select id="pieMarkerShow"><option value="false" ${!pieCfg.show?'selected':''}>${I.t('optHidden')}</option><option value="true" ${pieCfg.show?'selected':''}>${I.t('optShown')}</option></select></div>
        <div class="param-item"><label>${I.t('pieMarkerRadius')}</label><input id="pieMarkerRadius" type="number" value="${pieCfg.radius||9}" min="2" max="40"></div>
        <div class="param-item"><label class="mini-check"><input type="checkbox" id="pieMarkerHideOnLeaves" ${pieCfg.hideOnLeaves?'checked':''}> ${I.t('pieMarkerHideOnLeaves')}</label></div>
        <div class="param-item"><label>${I.t('pieMarkerPalette')}</label><div class="palette-slot" id="pieMarkerPalette"></div></div>
        <div class="param-item" style="grid-column: span 2;"><label>${I.t('pieMarkerColumns')}</label>
          <div class="multi-col-checks" style="max-height:140px;overflow:auto;border:1px solid #ddd;border-radius:4px;padding:6px;">
            ${metaFields.length ? metaFields.map(f => `<label class="mini-check" style="display:block;padding:2px 0;"><input type="checkbox" data-pie-col="${escA(f)}" ${(pieCfg.columns||[]).includes(f)?'checked':''}> ${esc(f)}</label>`).join('') : `<div style="color:#999;font-size:12px;">${I.t('pieMarkerNoMetaFields')}</div>`}
          </div>
        </div>
      </div>
      <div class="sub-section-title">${I.t('pieMarkerOffsetTitle')}</div>
      <div class="param-grid cols-4">
        <div class="param-item"><label>${I.t('pieMarkerOffsetX')}</label><input id="pieMarkerOffsetX" type="number" value="${pieCfg.offsetX||0}" step="1"></div>
        <div class="param-item"><label>${I.t('pieMarkerOffsetY')}</label><input id="pieMarkerOffsetY" type="number" value="${pieCfg.offsetY||0}" step="1"></div>
        <div class="param-item"><label>${I.t('pieMarkerOffsetTangent')}</label><input id="pieMarkerOffsetTangent" type="number" value="${pieCfg.offsetTangent||0}" step="1"></div>
        <div class="param-item"><label>${I.t('pieMarkerOffsetRadial')}</label><input id="pieMarkerOffsetRadial" type="number" value="${pieCfg.offsetRadial||0}" step="1"></div>
      </div>
      ${(pieCfg.columns && pieCfg.columns.length) ? `
      <div class="sub-section-title">${I.t('pieMarkerColumnColors')}</div>
      <div class="custom-color-list" style="display:flex;flex-wrap:wrap;gap:8px;">
        ${pieCfg.columns.map((col, i) => {
          const defColor = (pieCfg.columnColors && pieCfg.columnColors[col]) || piePal[i % piePal.length];
          return `<label style="display:flex;align-items:center;gap:4px;font-size:12px;">
            <input type="color" data-pie-colcolor="${escA(col)}" value="${defColor}" style="width:30px;height:22px;padding:0;border:1px solid #ccc;border-radius:3px;cursor:pointer;">
            <span>${esc(col)}</span>
            <button class="btn-del-color" data-pie-delcolcolor="${escA(col)}" type="button" title="${I.t('btnDeleteTitle')}">×</button>
          </label>`;
        }).join('')}
      </div>` : ''}
    </div>

    <div class="param-panel"><div class="param-panel-title">${I.t('panelRangeLabelDisplay')}</div>
      <div class="param-grid cols-4">
        <div class="param-item"><label>${I.t('rangeLabelShow')}</label>
          <select id="rangeLabelShow"><option value="false" ${st.rangeLabelConfig.show?'':'selected'}>${I.t('optHidden')}</option><option value="true" ${st.rangeLabelConfig.show?'selected':''}>${I.t('optShown')}</option></select></div>
        <div class="param-item"><label>${I.t('rangeLabelField')}</label>
          <select id="rangeLabelField"><option value="">${I.t('optThresholdNone')}</option>${rangeFields.map(f=>`<option value="${escA(f)}" ${st.rangeLabelConfig.field===f?'selected':''}>${esc(f)}</option>`).join('')}</select></div>
        <div class="param-item"><label>${I.t('rangeLabelLineHeight')}</label><input id="rangeLabelLineHeight" type="number" value="${st.rangeLabelConfig.lineHeight}" min="1" max="40"></div>
        <div class="param-item"><label>${I.t('rangeLabelColor')}</label><input id="rangeLabelColor" type="color" value="${st.rangeLabelConfig.color || '#67cb9e'}"></div>
        <div class="param-item"><label>${I.t('rangeLabelOpacity')}</label><input id="rangeLabelOpacity" type="number" value="${st.rangeLabelConfig.opacity != null ? st.rangeLabelConfig.opacity : 0.8}" min="0" max="1" step="0.05"></div>
        <div class="param-item"><label>${I.t('rangeLabelOutlineColor')}</label><input id="rangeLabelOutlineColor" type="color" value="${st.rangeLabelConfig.outlineColor}"></div>
        <div class="param-item"><label>${I.t('rangeLabelOutlineWidth')}</label><input id="rangeLabelOutlineWidth" type="number" value="${st.rangeLabelConfig.outlineWidth}" min="0" max="8" step="0.5"></div>
      </div>
    </div>

    <div class="param-panel" id="geoTimePanel">
      <div class="param-panel-title">${I.t('geoPanelTitle')}</div>
      <div class="param-grid cols-4" style="margin-bottom:8px;">
        <div class="param-item"><label class="mini-check"><input type="checkbox" id="geoTimeShowChk"> ${I.t('geoShowToggle')}</label></div>
        <div class="param-item"><label>${I.t('geoScaleFactor')}</label><input id="geoScaleFactor" type="number" min="0.000001" step="any" value="${global.TreeRanges.geoScaleFactor}"></div>
        <div class="param-item" style="grid-column: span 2;"><label>${I.t('geoImportLevels')}</label>
          <div style="display:flex;gap:12px;flex-wrap:wrap;padding:4px 0;">
            <label class="mini-check"><input type="checkbox" data-geolevel="eon" checked> ${I.t('geoLevelEon')}</label>
            <label class="mini-check"><input type="checkbox" data-geolevel="era" checked> ${I.t('geoLevelEra')}</label>
            <label class="mini-check"><input type="checkbox" data-geolevel="period" checked> ${I.t('geoLevelPeriod')}</label>
            <label class="mini-check"><input type="checkbox" data-geolevel="epoch"> ${I.t('geoLevelEpoch')}</label>
            <label class="mini-check"><input type="checkbox" data-geolevel="age"> ${I.t('geoLevelAge')}</label>
          </div>
        </div>
      </div>
      <div class="info-box" style="margin:4px 0 10px;line-height:1.7;">
        <div><strong>${I.t('geoHowTo')}</strong></div>
        <div>· <b>${I.t('geoHowToCustom')}</b>${I.t('geoHowToCustomDesc')}</div>
        <div>· <b>${I.t('geoHowToPreset')}</b>${I.t('geoHowToPresetDesc')}</div>
        <div>· <b>${I.t('geoHowToScale')}</b>${I.t('geoHowToScaleDesc')}</div>
        <div>· <b>${I.t('geoHowToAxisSide')}</b>${I.t('geoHowToAxisSideDesc')}</div>
        <div>· <b>${I.t('geoHowToAsFill')}</b>${I.t('geoHowToAsFillDesc')}</div>
        <div>· <b>${I.t('geoHowToRadial')}</b>${I.t('geoHowToRadialDesc')}</div>
        <div>· ${I.t('geoHowToTruncate')}</div>
      </div>
      <div class="style-box">
        <div class="style-box-title">${I.t('styleBoxGeoText')}</div>
        <div data-geotext-host></div>
      </div>
      <div id="geoTimeTrackList" style="display:flex;flex-direction:column;gap:8px;max-height:520px;overflow:auto;"></div>
      <div class="btn-group" style="margin-top:8px;">
        <button class="btn" id="geoImportPresetBtn" type="button">${I.t('geoImportPresetBtn')}</button>
        <button class="btn" id="geoAddTrackBtn" type="button">${I.t('geoAddTrackBtn')}</button>
        <button class="btn" id="geoClearBtn" type="button">${I.t('geoClearBtn')}</button>
      </div>
    </div>
  `;

  container.querySelector('#lenLabelShow')?.addEventListener('change', e => { st.lengthLabel.show = e.target.value === 'true'; global.TreeRenderer.draw(); });
  container.querySelector('#lenLabelDecimals')?.addEventListener('input', e => { st.lengthLabel.decimals = Number(e.target.value); global.TreeRenderer.draw(); });
  container.querySelector('#lenLabelAsTime')?.addEventListener('change', e => { st.lengthLabel.asTime = e.target.value === 'true'; global.TreeRenderer.draw(); });
  container.querySelector('#lenLabelTimeRootAge')?.addEventListener('input', e => { st.lengthLabel.timeRootAge = Number(e.target.value); global.TreeRenderer.draw(); });
  container.querySelector('#lenLabelTimeFactor')?.addEventListener('input', e => { st.lengthLabel.timeFactor = Number(e.target.value); global.TreeRenderer.draw(); });
  container.querySelector('#lenLabelCiField')?.addEventListener('change', e => { st.lengthLabel.ciField = e.target.value; global.TreeRenderer.draw(); });

  const lenTextInit = {
    fontFamily: st.lengthLabel.fontFamily || '',
    fontSize: st.lengthLabel.fontSize,
    bold: st.lengthLabel.bold, italic: st.lengthLabel.italic,
    color: st.lengthLabel.color || '#000000',
    opacity: st.lengthLabel.opacity != null ? st.lengthLabel.opacity : 1,
    bgShow: !!st.lengthLabel.bgShow,
    bgColor: st.lengthLabel.bgColor || st.lengthLabel.bgFill || '#ffffff',
    bgOpacity: st.lengthLabel.bgOpacity != null ? st.lengthLabel.bgOpacity : 1,
    bgBorderColor: st.lengthLabel.bgBorderColor || '#999999',
    bgBorderWidth: st.lengthLabel.bgBorderWidth != null ? st.lengthLabel.bgBorderWidth : 1,
    align: 'middle', x: st.lengthLabel.offsetX, y: st.lengthLabel.offsetY,
    offsetTangent: st.lengthLabel.offsetTangent || 0,
    offsetRadial: st.lengthLabel.offsetRadial || 0
  };
  W.textStylePanel(container.querySelector('[data-lenlabel-text-host]'), lenTextInit, {
    onChange: s => {
      Object.assign(st.lengthLabel, {
        fontFamily: s.fontFamily, fontSize: s.fontSize, bold: s.bold, italic: s.italic,
        color: s.color, opacity: s.opacity,
        bgShow: s.bgShow,
        bgColor: s.bgColor, bgFill: s.bgColor,
        bgOpacity: s.bgOpacity,
        bgBorderColor: s.bgBorderColor, bgBorderWidth: s.bgBorderWidth,
        offsetX: s.x, offsetY: s.y,
        offsetTangent: s.offsetTangent, offsetRadial: s.offsetRadial
      });
      global.TreeRenderer.draw();
    }
  });
  container.querySelector('#lenLabelOffsetX')?.addEventListener('input', e => { st.lengthLabel.offsetX = Number(e.target.value) || 0; global.TreeRenderer.draw(); });
  container.querySelector('#lenLabelOffsetY')?.addEventListener('input', e => { st.lengthLabel.offsetY = Number(e.target.value) || 0; global.TreeRenderer.draw(); });
  container.querySelector('#lenLabelOffsetTangent')?.addEventListener('input', e => { st.lengthLabel.offsetTangent = Number(e.target.value) || 0; global.TreeRenderer.draw(); });
  container.querySelector('#lenLabelOffsetRadial')?.addEventListener('input', e => { st.lengthLabel.offsetRadial = Number(e.target.value) || 0; global.TreeRenderer.draw(); });
  container.querySelector('#nodeLabelMergeText')?.addEventListener('change', e => { st.nodeLabelCommon.mergeText = e.target.checked; global.TreeRenderer.draw(); });
  container.querySelector('#nodeLabelFillColorAs')?.addEventListener('change', e => { st.nodeLabelCommon.fillColorAs = e.target.value; global.TreeRenderer.draw(); });
  container.querySelector('#nodeLabelBgFill')?.addEventListener('input', e => { st.nodeLabelCommon.bgFill = e.target.value; global.TreeRenderer.draw(); });
  container.querySelector('#nodeLabelBgBorderColor')?.addEventListener('input', e => { st.nodeLabelCommon.bgBorderColor = e.target.value; global.TreeRenderer.draw(); });
  container.querySelector('#nodeLabelBgBorderWidth')?.addEventListener('input', e => { st.nodeLabelCommon.bgBorderWidth = Number(e.target.value); global.TreeRenderer.draw(); });
  container.querySelector('#nodeLabelTextColorOnBg')?.addEventListener('input', e => { st.nodeLabelCommon.textColorOnBg = e.target.value; global.TreeRenderer.draw(); });
  container.querySelector('#nodeLabelSeparator')?.addEventListener('input', e => { st.nodeLabelCommon.separator = e.target.value; global.TreeRenderer.draw(); });
  container.querySelector('#nodeLabelHideOnLeaves')?.addEventListener('change', e => { st.nodeLabelCommon.hideOnLeaves = e.target.checked; global.TreeRenderer.draw(); });

  const nlTextInit = {
    fontFamily: st.nodeLabelCommon.fontFamily || '',
    fontSize: st.nodeLabelCommon.fontSize,
    bold: st.nodeLabelCommon.bold, italic: st.nodeLabelCommon.italic,
    color: st.nodeLabelCommon.color || '#333333',
    opacity: st.nodeLabelCommon.opacity != null ? st.nodeLabelCommon.opacity : 1,
    bgShow: !!st.nodeLabelCommon.bgShow,
    bgColor: st.nodeLabelCommon.bgColor || st.nodeLabelCommon.bgFill || '#eeeeee',
    bgOpacity: st.nodeLabelCommon.bgOpacity != null ? st.nodeLabelCommon.bgOpacity : 1,
    bgBorderColor: st.nodeLabelCommon.bgBorderColor || '#cccccc',
    bgBorderWidth: st.nodeLabelCommon.bgBorderWidth != null ? st.nodeLabelCommon.bgBorderWidth : 0,
    align: 'middle', x: st.nodeLabelCommon.offsetX, y: st.nodeLabelCommon.offsetY,
    offsetTangent: st.nodeLabelCommon.offsetTangent || 0,
    offsetRadial: st.nodeLabelCommon.offsetRadial || 0
  };
  W.textStylePanel(container.querySelector('[data-nodelabel-text-host]'), nlTextInit, {
    onChange: s => {
      Object.assign(st.nodeLabelCommon, {
        fontFamily: s.fontFamily, fontSize: s.fontSize, bold: s.bold, italic: s.italic,
        color: s.color, opacity: s.opacity,
        bgShow: s.bgShow, bgColor: s.bgColor, bgFill: s.bgColor,
        bgOpacity: s.bgOpacity,
        bgBorderColor: s.bgBorderColor, bgBorderWidth: s.bgBorderWidth,
        offsetX: s.x, offsetY: s.y,
        offsetTangent: s.offsetTangent, offsetRadial: s.offsetRadial
      });
      global.TreeRenderer.draw();
    }
  });
  container.querySelector('#nodeLabelOffsetX')?.addEventListener('input', e => { st.nodeLabelCommon.offsetX = Number(e.target.value) || 0; global.TreeRenderer.draw(); });
  container.querySelector('#nodeLabelOffsetY')?.addEventListener('input', e => { st.nodeLabelCommon.offsetY = Number(e.target.value) || 0; global.TreeRenderer.draw(); });
  container.querySelector('#nodeLabelOffsetTangent')?.addEventListener('input', e => { st.nodeLabelCommon.offsetTangent = Number(e.target.value) || 0; global.TreeRenderer.draw(); });
  container.querySelector('#nodeLabelOffsetRadial')?.addEventListener('input', e => { st.nodeLabelCommon.offsetRadial = Number(e.target.value) || 0; global.TreeRenderer.draw(); });
  let nodeLabelSeq = (st.nodeLabels.reduce((m, it) => Math.max(m, it.id || 0), 0)) + 1;
  container.querySelector('#addNodeLabelBtn')?.addEventListener('click', () => {
    st.nodeLabels.push({
      id: nodeLabelSeq++, column: "", mode: "text",
      decimals: 2, asPercent: false,
      thresholdLogic: "", threshold: null,
      shape: "circle", strokeColor: "#000000", strokeWidth: 1,
      fillColor: "#E64B35", maxSize: 10, minSize: 2
    });
    renderNodeLabelList();
    global.TreeRenderer.draw();
  });
  renderNodeLabelList();

  container.querySelector('#rangeLabelShow')?.addEventListener('change', e => { st.rangeLabelConfig.show = e.target.value === 'true'; global.TreeRenderer.draw(); });
  container.querySelector('#rangeLabelField')?.addEventListener('change', e => { st.rangeLabelConfig.field = e.target.value; global.TreeRenderer.draw(); });
  container.querySelector('#rangeLabelLineHeight')?.addEventListener('input', e => { st.rangeLabelConfig.lineHeight = Number(e.target.value); global.TreeRenderer.draw(); });
  container.querySelector('#rangeLabelOutlineColor')?.addEventListener('input', e => { st.rangeLabelConfig.outlineColor = e.target.value; global.TreeRenderer.draw(); });
  container.querySelector('#rangeLabelOutlineWidth')?.addEventListener('input', e => { st.rangeLabelConfig.outlineWidth = Number(e.target.value); global.TreeRenderer.draw(); });

  container.querySelector('#rangeLabelColor')?.addEventListener('input', e => { st.rangeLabelConfig.color = e.target.value; global.TreeRenderer.draw(); });
  container.querySelector('#rangeLabelOpacity')?.addEventListener('input', e => { st.rangeLabelConfig.opacity = Math.max(0, Math.min(1, Number(e.target.value))); global.TreeRenderer.draw(); });

  const pieCfgSet = (k, v) => { st.pieMarker = st.pieMarker || {}; st.pieMarker[k] = v; global.TreeRenderer.draw(); };
  container.querySelector('#pieMarkerShow')?.addEventListener('change', e => pieCfgSet('show', e.target.value === 'true'));
  container.querySelector('#pieMarkerRadius')?.addEventListener('input', e => pieCfgSet('radius', Number(e.target.value) || 9));
  container.querySelector('#pieMarkerHideOnLeaves')?.addEventListener('change', e => pieCfgSet('hideOnLeaves', e.target.checked));
  container.querySelector('#pieMarkerOffsetX')?.addEventListener('input', e => pieCfgSet('offsetX', Number(e.target.value)));
  container.querySelector('#pieMarkerOffsetY')?.addEventListener('input', e => pieCfgSet('offsetY', Number(e.target.value)));
  container.querySelector('#pieMarkerOffsetTangent')?.addEventListener('input', e => pieCfgSet('offsetTangent', Number(e.target.value)));
  container.querySelector('#pieMarkerOffsetRadial')?.addEventListener('input', e => pieCfgSet('offsetRadial', Number(e.target.value)));

  container.querySelectorAll('[data-pie-col]').forEach(el => {
    el.addEventListener('change', () => {
      st.pieMarker = st.pieMarker || {};
      const set = new Set(st.pieMarker.columns || []);
      if (el.checked) set.add(el.dataset.pieCol); else set.delete(el.dataset.pieCol);
      st.pieMarker.columns = [...set];
      renderAdvancedPanel(container);
      global.TreeRenderer.draw();
    });
  });
  container.querySelectorAll('[data-pie-colcolor]').forEach(el => {
    el.addEventListener('input', () => {
      st.pieMarker = st.pieMarker || {};
      st.pieMarker.columnColors = st.pieMarker.columnColors || {};
      st.pieMarker.columnColors[el.dataset.pieColcolor] = el.value;
      global.TreeRenderer.draw();
    });
  });
  container.querySelectorAll('[data-pie-delcolcolor]').forEach(el => {
    el.addEventListener('click', ev => {
      ev.preventDefault(); ev.stopPropagation();
      if (st.pieMarker && st.pieMarker.columnColors) delete st.pieMarker.columnColors[el.dataset.pieDelcolcolor];
      renderAdvancedPanel(container);
      global.TreeRenderer.draw();
    });
  });

  const piePaletteHost = container.querySelector('#pieMarkerPalette');
  if (piePaletteHost) {
    S.renderGroupPaletteDropdown(piePaletteHost, {
      selected: (st.pieMarker && st.pieMarker.palette) || 'tableau10',
      onSelect: (name) => {
        st.pieMarker = st.pieMarker || {};
        st.pieMarker.palette = name;
        st.pieMarker.columnColors = {};
        global.TreeRenderer.draw();
        renderAdvancedPanel(container);
      }
    });
  }

  W.textStylePanel(container.querySelector('[data-geotext-host]'), st.textStyles.geoText, {
    onChange: s => { Object.assign(st.textStyles.geoText, s); global.TreeRenderer.draw(); }
  });

  bindGeoTimeControls(container);
  if (global.TreeApp && typeof global.TreeApp.rebuildSidebarNav === 'function') {
    try { global.TreeApp.rebuildSidebarNav(); } catch (_) {}
  }
}

function bindGeoTimeControls(container) {
  const R = global.TreeRanges;
  if (!R) return;
  const showChk = container.querySelector('#geoTimeShowChk');
  if (showChk) {
    showChk.checked = !!R.geoTimeShow;
    showChk.addEventListener('change', e => { R.geoTimeShow = e.target.checked; global.TreeRenderer.draw(); });
  }
  const scaleInput = container.querySelector('#geoScaleFactor');
  if (scaleInput) {
    scaleInput.value = R.geoScaleFactor;
    scaleInput.addEventListener('input', e => {
      const v = Number(e.target.value);
      R.geoScaleFactor = (Number.isFinite(v) && v > 0) ? v : 1;
      global.TreeRenderer.draw();
    });
  }
  const list = container.querySelector('#geoTimeTrackList');
  if (!list) return;
  function render() {
    const tracks = R.geoTimeTracks;
    if (!tracks.length) { list.innerHTML = `<div class="info-box" style="margin:8px 0;padding:8px;">${I.t('geoNoTracks')}</div>`; return; }
    list.innerHTML = tracks.map(t => {
      const hasLevel = !!t.level;
      const levelOptions = hasLevel ? R.GEO_LEVELS.map(l => `<option value="${l}" ${t.level===l?'selected':''}>${R.GEO_LEVEL_LABELS[l]}</option>`).join('') : '';
      const titlePrefix = hasLevel ? `${R.GEO_LEVEL_LABELS[t.level] || t.level}：` : '';
      const entriesHtml = t.entries.map(e => `
        <div class="rp-row" style="flex-wrap:wrap;gap:4px;padding:4px 0;" data-entry-id="${e.id}" data-track-id="${t.id}">
          <input type="number" data-efield="start" data-eid="${e.id}" data-tid="${t.id}" value="${e.start}" placeholder="${I.t('geoEntryStart')}" style="width:80px;" step="any">
          <input type="number" data-efield="end" data-eid="${e.id}" data-tid="${t.id}" value="${e.end}" placeholder="${I.t('geoEntryEnd')}" style="width:80px;" step="any">
          <input type="text" data-efield="name" data-eid="${e.id}" data-tid="${t.id}" value="${escA(e.name)}" placeholder="${I.t('geoEntryName')}" style="width:110px;">
          <input type="color" data-efield="color" data-eid="${e.id}" data-tid="${t.id}" value="${e.color}" style="width:40px;height:26px;padding:0;">
          <button class="rp-x" data-eremove="${e.id}" data-tid="${t.id}" type="button">×</button>
        </div>`).join('');
      return `
      <div class="track-item" data-geo-track-id="${t.id}">
        <div class="track-header">
          <span class="track-title">${titlePrefix}${esc(t.name || I.t('geoUntitled'))}</span>
          <button class="track-toggle" data-geo-toggle="${t.id}" type="button">${t.collapsed?'▼':'▲'}</button>
          <button class="track-remove" data-geo-remove="${t.id}" type="button">×</button>
        </div>
        <div class="track-body" style="${t.collapsed?'display:none;':''}">
          <div class="param-grid cols-4">
            ${hasLevel ? `<div class="param-item"><label>${I.t('geoLevelLabel')}</label><select data-gtrack-field="level" data-tid="${t.id}">${levelOptions}</select></div>` : ''}
            <div class="param-item"><label>${I.t('geoTitleLabel')}</label><input type="text" data-gtrack-field="name" data-tid="${t.id}" value="${escA(t.name)}"></div>
            <div class="param-item"><label class="mini-check"><input type="checkbox" data-gtrack-field="nameShow" data-tid="${t.id}" ${t.nameShow?'checked':''}> ${I.t('geoTitleShowLabel')}</label></div>
            <div class="param-item"><label>${I.t('geoTitleFontSizeLabel')}</label><input type="number" data-gtrack-field="nameFontSize" data-tid="${t.id}" value="${t.nameFontSize}" min="6" max="30"></div>
            <div class="param-item"><label class="mini-check"><input type="checkbox" data-gtrack-field="nameBold" data-tid="${t.id}" ${t.nameBold?'checked':''}> ${I.t('geoTitleBoldLabel')}</label></div>
            <div class="param-item"><label class="mini-check"><input type="checkbox" data-gtrack-field="nameItalic" data-tid="${t.id}" ${t.nameItalic?'checked':''}> ${I.t('geoTitleItalicLabel')}</label></div>
            <div class="param-item"><label>${I.t('geoOutlineColorLabel')}</label><input type="color" data-gtrack-field="outlineColor" data-tid="${t.id}" value="${t.outlineColor}"></div>
            <div class="param-item"><label>${I.t('geoOutlineWidthLabel')}</label><input type="number" data-gtrack-field="outlineWidth" data-tid="${t.id}" value="${t.outlineWidth}" min="0" max="6" step="0.5"></div>
            <div class="param-item"><label>${I.t('geoOpacityLabel')}</label><input type="number" data-gtrack-field="opacity" data-tid="${t.id}" value="${t.opacity}" min="0" max="1" step="0.05"></div>
            <div class="param-item"><label>${I.t('geoHeightLabel')}</label><input type="number" data-gtrack-field="height" data-tid="${t.id}" value="${t.height}" min="4" max="120"></div>
            <div class="param-item"><label>${I.t('geoGapLabel')}</label><input type="number" data-gtrack-field="gap" data-tid="${t.id}" value="${t.gap}" min="0" max="60"></div>
            <div class="param-item"><label>${I.t('geoOffsetLabel')}</label><input type="number" data-gtrack-field="offset" data-tid="${t.id}" value="${t.offset||0}" step="1"></div>
            <div class="param-item"><label>${I.t('geoTextOrientationLabel')}</label>
              <select data-gtrack-field="textOrientation" data-tid="${t.id}">
                <option value="horizontal" ${t.textOrientation!=='vertical'?'selected':''}>${I.t('geoTextHorizontal')}</option>
                <option value="vertical" ${t.textOrientation==='vertical'?'selected':''}>${I.t('geoTextVertical')}</option>
              </select></div>
            <div class="param-item"><label>${I.t('geoAxisSideLabel')}</label>
              <select data-gtrack-field="position" data-tid="${t.id}">
                <option value="bottom" ${t.position==='bottom'?'selected':''}>${I.t('geoAxisSideBottom')}</option>
                <option value="top" ${t.position==='top'?'selected':''}>${I.t('geoAxisSideTop')}</option>
              </select></div>
            <div class="param-item"><label class="mini-check"><input type="checkbox" data-gtrack-field="fillTree" data-tid="${t.id}" ${t.fillTree?'checked':''}> ${I.t('geoFillTreeLabel')}</label></div>
            <div class="param-item"><label>${I.t('geoFillTreeOpacityLabel')}</label><input type="number" data-gtrack-field="fillTreeOpacity" data-tid="${t.id}" value="${t.fillTreeOpacity!=null?t.fillTreeOpacity:0.14}" min="0" max="1" step="0.02" ${t.fillTree?'':'disabled'}></div>
          </div>
          <div class="sub-section-title" style="margin-top:8px;">${I.t('geoEntriesTitle')}（${t.entries.length}）</div>
          <div style="display:flex;flex-direction:column;gap:2px;max-height:180px;overflow:auto;">
            ${entriesHtml || `<div class="info-box" style="margin:6px 0;padding:6px;">${I.t('geoNoEntries')}</div>`}
          </div>
          <button class="btn" data-geo-add-entry="${t.id}" type="button" style="margin-top:6px;">${I.t('geoAddEntryBtn')}</button>
        </div>
      </div>`;
    }).join('');
    list.querySelectorAll('[data-gtrack-field]').forEach(el => {
      el.addEventListener('input', e => {
        const id = Number(el.dataset.tid);
        const field = el.dataset.gtrackField;
        const t = R.geoTimeTracks.find(x => x.id === id); if (!t) return;
        if (el.type === 'checkbox') t[field] = el.checked;
        else if (el.type === 'number') t[field] = Number(el.value);
        else t[field] = el.value;
        if (field === 'level') {
          const header = list.querySelector(`[data-geo-track-id="${id}"] .track-title`);
          if (header) {
            const pre = t.level ? `${R.GEO_LEVEL_LABELS[t.level] || t.level}${I.t('trackTitleSep')}` : '';
            header.textContent = pre + (t.name || I.t('geoUntitled'));
          }
        }
        global.TreeRenderer.draw();
      });
    });
    list.querySelectorAll('[data-efield]').forEach(el => {
      el.addEventListener('input', e => {
        const tid = Number(el.dataset.tid);
        const eid = Number(el.dataset.eid);
        const field = el.dataset.efield;
        const t = R.geoTimeTracks.find(x => x.id === tid); if (!t) return;
        const entry = t.entries.find(x => x.id === eid); if (!entry) return;
        if (el.type === 'number') entry[field] = Number(el.value); else entry[field] = el.value;
        global.TreeRenderer.draw();
      });
    });
    list.querySelectorAll('[data-eremove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tid = Number(btn.dataset.tid);
        const eid = Number(btn.dataset.eremove);
        R.removeGeoEntry(tid, eid);
        render(); global.TreeRenderer.draw();
      });
    });
    list.querySelectorAll('[data-geo-add-entry]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tid = Number(btn.dataset.geoAddEntry);
        const t = R.geoTimeTracks.find(x => x.id === tid); if (!t) return;
        const s = t.entries.length ? Math.min(...t.entries.map(e => e.end)) : 0;
        const e = t.entries.length ? Math.max(...t.entries.map(e => e.start), s + 100) : 100;
        R.addGeoEntry(tid, { start: e, end: s, name: 'New', color: '#888888' });
        render(); global.TreeRenderer.draw();
      });
    });
    list.querySelectorAll('[data-geo-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.geoToggle);
        const t = R.geoTimeTracks.find(x => x.id === id); if (!t) return;
        t.collapsed = !t.collapsed;
        render();
      });
    });
    list.querySelectorAll('[data-geo-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.geoRemove);
        R.removeGeoTrack(id);
        render(); global.TreeRenderer.draw();
      });
    });
    list.querySelectorAll('input[type="checkbox"][data-gtrack-field="fillTree"]').forEach(chk => {
      chk.addEventListener('change', () => {
        const id = Number(chk.dataset.tid);
        const opInput = list.querySelector(`input[data-gtrack-field="fillTreeOpacity"][data-tid="${id}"]`);
        if (opInput) opInput.disabled = !chk.checked;
      });
    });
  }
  render();

  container.querySelector('#geoImportPresetBtn')?.addEventListener('click', async () => {
    const levels = [];
    container.querySelectorAll('[data-geolevel]:checked').forEach(c => levels.push(c.dataset.geolevel));
    if (!levels.length) { alert(I.t('geoAlertSelectLevel')); return; }
    try {
      await R.importGeoPreset(levels);
      const chk = container.querySelector('#geoTimeShowChk');
      if (chk) chk.checked = true;
      render();
    } catch (err) {
      alert(I.t('geoAlertImportFail') + ': ' + (err && err.message || err));
    }
  });
  container.querySelector('#geoAddTrackBtn')?.addEventListener('click', () => {
    R.addGeoTrack({ name: '', entries: [] });
    R.geoTimeShow = true;
    const chk = container.querySelector('#geoTimeShowChk');
    if (chk) chk.checked = true;
    render();
    global.TreeRenderer.draw();
  });
  container.querySelector('#geoClearBtn')?.addEventListener('click', () => {
    if (!confirm(I.t('geoConfirmClear'))) return;
    const arr = R.geoTimeTracks;
    arr.length = 0;
    render();
    global.TreeRenderer.draw();
  });
}

global.TreeUIAdvanced = { renderAdvancedPanel };
})(window);