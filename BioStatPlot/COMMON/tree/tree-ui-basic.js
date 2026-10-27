(function (global) {
'use strict';
const C = global.TreeCore;
const T = global.TreeTraverse;
const I = global.TreeI18N;
const S = global.TreeUI;
const W = global.TreeCommonWidgets;

function esc(s) { return S.escapeHtml(s); }
function escA(s) { return S.escapeAttr(s); }

function renderBasicPanel(container) {
  if (!container) return;
  const st = C.state;
  const metaSet = new Set();
  if (C.getRoot()) T.allWalk(C.getRoot(), n => (n.meta || []).forEach(f => { if (f && f.field) metaSet.add(f.field); }));
  const metaFieldList = Array.from(metaSet).sort();

  container.innerHTML = `
<div class="mode-tabs" style="margin-bottom:12px;">
  <label><input type="radio" name="treeModeSelect" value="rectangular" ${st.mode==='rectangular'?'checked':''}> ${I.t('panelModeRect')}</label>
  <label><input type="radio" name="treeModeSelect" value="circular" ${st.mode==='circular'?'checked':''}> ${I.t('panelModeCircular')}</label>
  <label><input type="radio" name="treeModeSelect" value="unrooted" ${st.mode==='unrooted'?'checked':''}> ${I.t('panelModeUnrooted')}</label>
</div>

<div class="param-panel" id="layoutPanel">
  <div class="param-panel-title">${I.t('panelLayout')}</div>
  <div class="sub-section-title"><strong>${I.t('panelLayoutCommon')}</strong></div>
  <div class="param-grid cols-4">
    <div class="param-item"><label>${I.t('panelInvert')}</label>
      <select id="invertSelect"><option value="false" ${!st.invert?'selected':''}>${I.t('optNo')}</option><option value="true" ${st.invert?'selected':''}>${I.t('optYes')}</option></select></div>
    <div class="param-item"><label>${I.t('panelSort')}</label>
      <select id="sortModeSelect"><option value="none" ${st.sortMode==='none'?'selected':''}>${I.t('optSortNone')}</option><option value="ascending" ${st.sortMode==='ascending'?'selected':''}>${I.t('optSortAsc')}</option><option value="descending" ${st.sortMode==='descending'?'selected':''}>${I.t('optSortDesc')}</option></select></div>
    <div class="param-item"><label>${I.t('panelLeafReverse')}</label>
      <select id="leafReverseSelect"><option value="false" ${!st.leafReverse?'selected':''}>${I.t('optReverseKeep')}</option><option value="true" ${st.leafReverse?'selected':''}>${I.t('optReverseReverse')}</option></select></div>
    <div class="param-item"><label>${I.t('panelScaleH')}</label><input id="scaleH" type="number" value="${st.scaleH}" min="0.3" max="4" step="0.1"></div>
    <div class="param-item"><label>${I.t('panelScaleV')}</label><input id="scaleV" type="number" value="${st.scaleV}" min="0.3" max="4" step="0.1"></div>
    <div class="param-item"><label class="mini-check"><input type="checkbox" id="forceMidpointRoot" ${st.forceMidpointRoot?'checked':''}> ${I.t('forceMidpointRoot')}</label></div>
    <div class="param-item"><label>${I.t('panelLabelPos')}</label>
      <select id="labelPositionSelect"><option value="aligned" ${st.labelPosition==='aligned'?'selected':''}>${I.t('optAligned')}</option><option value="tips" ${st.labelPosition==='tips'?'selected':''}>${I.t('optAtTips')}</option></select></div>
  </div>
  <div id="layoutSpecificInner"></div>
</div>

<div class="param-panel" id="commonPanel">
  <div class="param-panel-title">${I.t('panelCommon')}</div>

  <div class="sub-section-title"><strong>${I.t('panelFontFamily')}</strong></div>
  <div class="param-grid cols-4">
    <div class="param-item"><label>${I.t('panelFontFamily')}</label>
      <select id="fontFamily">
        <option value="Times New Roman" ${st.fontFamily==='Times New Roman'?'selected':''}>Times New Roman</option>
        <option value="Arial" ${st.fontFamily==='Arial'?'selected':''}>Arial</option>
        <option value="Helvetica" ${st.fontFamily==='Helvetica'?'selected':''}>Helvetica</option>
        <option value="Georgia" ${st.fontFamily==='Georgia'?'selected':''}>Georgia</option>
        <option value="Microsoft YaHei" ${st.fontFamily==='Microsoft YaHei'?'selected':''}>${I.t('optMicrosoftYaHei')}</option>
      </select></div>
  </div>

  <div class="sub-section-title"><strong>${I.t('styleBoxLabelSettings')}</strong></div>
  <div class="param-grid cols-4">
    <div class="param-item"><label>${I.t('panelLabelsShow')}</label>
      <select id="labelsSelect"><option value="true" ${st.labels?'selected':''}>${I.t('optDisplay')}</option><option value="false" ${!st.labels?'selected':''}>${I.t('optHide')}</option></select></div>
    <div class="param-item"><label>${I.t('panelLabelFontSize')}</label><input id="fontSize" type="number" value="${st.fontSize}" min="6" max="90"></div>
    <div class="param-item"><label class="mini-check"><input id="boldChk" type="checkbox" ${st.bold?'checked':''}> ${I.t('panelLabelBold')}</label></div>
    <div class="param-item"><label class="mini-check"><input id="italicChk" type="checkbox" ${st.italic?'checked':''}> ${I.t('panelLabelItalic')}</label></div>
    <div class="param-item"><label>${I.t('panelLabelColor')}</label><input id="labelColor" type="color" value="${st.labelColor}"></div>
  </div>
  <div class="style-box">
    <div class="style-box-title">${I.t('styleBoxBranchExtend')}</div>
    <div class="param-grid cols-4">
      <div class="param-item"><label>${I.t('panelExtendBranches')}</label>
        <select id="extendBranchesSelect"><option value="true" ${st.extendBranches?'selected':''}>${I.t('optOn')}</option><option value="false" ${!st.extendBranches?'selected':''}>${I.t('optOff')}</option></select></div>
    </div>
    <div class="info-box" style="margin:6px 0 8px;">${I.t('styleBoxBranchExtendHint')}</div>
    <div data-extend-host></div>
  </div>

  <div class="sub-section-title"><strong>${I.t('panelBranchLength')}</strong></div>
  <div class="param-grid cols-4">
    <div class="param-item"><label>${I.t('panelBranchLength')}</label>
      <select id="ignoreLength"><option value="false" ${!st.ignoreLength?'selected':''}>${I.t('optUse')}</option><option value="true" ${st.ignoreLength?'selected':''}>${I.t('optIgnore')}</option></select></div>
    <div class="param-item"><label>${I.t('panelBranchLenSource')}</label>
      <select id="branchLengthField"><option value="">${I.t('optDefaultLen')}</option>${metaFieldList.map(f=>`<option value="${escA(f)}" ${st.branchLengthField===f?'selected':''}>${esc(f)}</option>`).join('')}</select></div>
    <div class="param-item"><label>${I.t('bootstrapRange')}</label>
      <select id="bootstrapRangeSelect">
        <option value="auto" ${(!st.bootstrapRange||st.bootstrapRange==='auto')?'selected':''}>${I.t('optBootRangeAuto')}</option>
        <option value="0-1" ${st.bootstrapRange==='0-1'?'selected':''}>${I.t('optBootRange01')}</option>
        <option value="0-100" ${st.bootstrapRange==='0-100'?'selected':''}>${I.t('optBootRange0100')}</option>
        <option value="count" ${st.bootstrapRange==='count'?'selected':''}>${I.t('optBootRangeCount')}</option>
        <option value="none" ${st.bootstrapRange==='none'?'selected':''}>${I.t('optBootRangeNone')}</option>
      </select></div>
  </div>

  <div class="style-box">
    <div class="style-box-title">${I.t('styleBoxBranchLine')}</div>
    <div class="param-grid cols-4">
      <div class="param-item"><label>${I.t('panelBranchWidth')}</label><input id="branchWidth" type="number" value="${st.branchWidth}" min=".2" max="12" step=".1"></div>
      <div class="param-item"><label>${I.t('panelBranchColor')}</label><input id="branchColor" type="color" value="${st.branchColor}"></div>
      <div class="param-item"><label>${I.t('panelDashed')}</label>
        <select id="dashedSelect"><option value="false" ${!st.dashed?'selected':''}>${I.t('optOff')}</option><option value="true" ${st.dashed?'selected':''}>${I.t('optOn')}</option></select></div>
      <div class="param-item"><label>${I.t('panelDashSize')}</label><input id="dashSize" type="number" value="${st.dashSize}" min="0" max="16" step=".1"></div>
    </div>
  </div>
</div>


<div class="param-panel" id="nodeSymbolsPanel"><div class="param-panel-title">${I.t('panelNodeSymbols')}</div>
  <div class="sub-section-title"><strong>${I.t('panelLeafSymbols')}</strong></div>
  <div class="param-grid cols-4">
    <div class="param-item"><label>${I.t('panelShow')}</label>
      <select id="leafSymbolsSelect"><option value="false" ${st.leafSymbols?'':'selected'}>${I.t('optHidden')}</option><option value="true" ${st.leafSymbols?'selected':''}>${I.t('optShown')}</option></select></div>
    <div class="param-item"><label>${I.t('panelShape')}</label>
      <select id="leafSymShape">
        <option value="square" ${st.leafSymShape==='square'?'selected':''}>${I.t('optSquareZh')}</option>
        <option value="circle" ${st.leafSymShape==='circle'?'selected':''}>${I.t('optCircleZh')}</option>
        <option value="star" ${st.leafSymShape==='star'?'selected':''}>${I.t('optStarZh')}</option>
        <option value="triangle-left" ${st.leafSymShape==='triangle-left'?'selected':''}>${I.t('optTriangleLeft')}</option>
        <option value="triangle-right" ${st.leafSymShape==='triangle-right'?'selected':''}>${I.t('optTriangleRight')}</option>
      </select></div>
    <div class="param-item"><label>${I.t('panelSize')}</label><input id="leafSymSize" type="number" value="${st.leafSymSize}" min="1" max="20" step="1"></div>
    <div class="param-item"><label>${I.t('panelFill')}</label><input id="leafSymFill" type="color" value="${st.leafSymFill}"></div>
    <div class="param-item"><label>${I.t('panelBorderColor')}</label><input id="leafSymBC" type="color" value="${st.leafSymBC}"></div>
    <div class="param-item"><label>${I.t('panelBorderWidth')}</label><input id="leafSymBW" type="number" value="${st.leafSymBW}" min="0" max="6" step=".5"></div>
  </div>
  <div class="sub-section-title" style="margin-top:8px;"><strong>${I.t('panelIntSymbols')}</strong></div>
  <div class="param-grid cols-4">
    <div class="param-item"><label>${I.t('panelShow')}</label>
      <select id="internalSymbolsSelect"><option value="false" ${st.internalSymbols?'':'selected'}>${I.t('optHidden')}</option><option value="true" ${st.internalSymbols?'selected':''}>${I.t('optShown')}</option></select></div>
    <div class="param-item"><label>${I.t('panelShape')}</label>
      <select id="intSymShape">
        <option value="square" ${st.intSymShape==='square'?'selected':''}>${I.t('optSquareZh')}</option>
        <option value="circle" ${st.intSymShape==='circle'?'selected':''}>${I.t('optCircleZh')}</option>
        <option value="star" ${st.intSymShape==='star'?'selected':''}>${I.t('optStarZh')}</option>
        <option value="triangle-left" ${st.intSymShape==='triangle-left'?'selected':''}>${I.t('optTriangleLeft')}</option>
        <option value="triangle-right" ${st.intSymShape==='triangle-right'?'selected':''}>${I.t('optTriangleRight')}</option>
      </select></div>
    <div class="param-item"><label>${I.t('panelSize')}</label><input id="intSymSize" type="number" value="${st.intSymSize}" min="1" max="20" step="1"></div>
    <div class="param-item"><label>${I.t('panelFill')}</label><input id="intSymFill" type="color" value="${st.intSymFill}"></div>
    <div class="param-item"><label>${I.t('panelBorderColor')}</label><input id="intSymBC" type="color" value="${st.intSymBC}"></div>
    <div class="param-item"><label>${I.t('panelBorderWidth')}</label><input id="intSymBW" type="number" value="${st.intSymBW}" min="0" max="6" step=".5"></div>
  </div>
</div>

<div class="param-panel" id="ticksPanel"><div class="param-panel-title">${I.t('panelTicks')}</div>
  <div class="sub-section-title"><strong>${I.t('panelAxis')}</strong></div>
  <div class="param-grid cols-4">
    <div class="param-item"><label>${I.t('axisShow')}</label>
      <select id="axisShowSelect"><option value="true" ${st.axisShow?'selected':''}>${I.t('optOn')}</option><option value="false" ${!st.axisShow?'selected':''}>${I.t('optOff')}</option></select></div>
    <div class="param-item" id="axisPosItem"><label>${I.t('axisPosition')}</label>
      <select id="axisPosSelect"><option value="top" ${st.axisPos==='top'?'selected':''}>${I.t('axisPosTop')}</option><option value="bottom" ${st.axisPos==='bottom'?'selected':''}>${I.t('axisPosBottom')}</option></select></div>
    <div class="param-item" id="axisRotItem" style="display:none;"><label>${I.t('axisRotation')}</label>
      <input id="axisRotationInput" type="number" value="${st.axisRotation}" min="-360" max="360" step="1"></div>
    <div class="param-item"><label class="mini-check"><input id="axisReverseChk" type="checkbox" ${st.axisReverse?'checked':''}> ${I.t('axisReverse')}</label></div>
    <div class="param-item"><label>${I.t('axisMinVal')}</label>
      <input id="axisMinValInput" type="number" value="${st.axisMinVal != null ? st.axisMinVal : ''}" step="any" title="${I.t('axisMinValHint')}" placeholder="${I.t('axisAutoPlaceholder')}"></div>
    <div class="param-item"><label>${I.t('axisMaxVal')}</label>
      <input id="axisMaxValInput" type="number" value="${st.axisMaxVal != null ? st.axisMaxVal : 0}" step="any" title="${I.t('axisMaxValHint')}" placeholder="${I.t('axisAutoPlaceholder')}"></div>
    <div class="param-item" style="grid-column:1/-1;"><div class="info-box" style="margin:0 0 8px;padding:6px 10px;font-size:12px;">${I.t('axisRangeHint')}</div></div>
  </div>
  <div class="sub-section-title" style="margin-top:8px;"><strong>${I.t('tickLabelStyle')}</strong></div>
  <div class="param-grid cols-4">
    <div class="param-item"><label>${I.t('tickLabelFontSize')}</label><input id="tickLabelFontSize" type="number" value="${st.tickLabelFontSize||20}" min="6" max="40"></div>
    <div class="param-item"><label class="mini-check"><input id="tickLabelBold" type="checkbox" ${st.tickLabelBold?'checked':''}> ${I.t('tickLabelBold')}</label></div>
    <div class="param-item"><label class="mini-check"><input id="tickLabelItalic" type="checkbox" ${st.tickLabelItalic?'checked':''}> ${I.t('tickLabelItalic')}</label></div>
  </div>
  <div class="sub-section-title" style="margin-top:8px;"><strong>${I.t('panelPrimaryAxis')}</strong></div>
  <div class="param-grid cols-4">
    <div class="param-item"><label>${I.t('tickInterval')}</label><input id="tickPrimaryInterval" type="number" value="${st.tickPrimary.interval}" min="0" step="0.01"></div>
    <div class="param-item"><label>${I.t('tickShowLabels')}</label>
      <select id="tickPrimaryShowLabels"><option value="true" ${st.tickPrimary.showLabels?'selected':''}>${I.t('optOn')}</option><option value="false" ${!st.tickPrimary.showLabels?'selected':''}>${I.t('optOff')}</option></select></div>
    <div class="param-item"><label>${I.t('tickShowGrid')}</label>
      <select id="tickPrimaryShowGrid"><option value="true" ${st.tickPrimary.showGrid?'selected':''}>${I.t('optOn')}</option><option value="false" ${!st.tickPrimary.showGrid?'selected':''}>${I.t('optOff')}</option></select></div>
    <div class="param-item"><label>${I.t('tickGridDashed')}</label>
      <select id="tickPrimaryGridDashed"><option value="true" ${st.tickPrimary.gridDashed?'selected':''}>${I.t('optOn')}</option><option value="false" ${!st.tickPrimary.gridDashed?'selected':''}>${I.t('optOff')}</option></select></div>
    <div class="param-item"><label>${I.t('tickGridWidth')}</label><input id="tickPrimaryGridWidth" type="number" value="${st.tickPrimary.gridWidth}" min="0.5" max="4" step="0.5"></div>
    <div class="param-item"><label>${I.t('tickGridColor')}</label><input id="tickPrimaryGridColor" type="color" value="${st.tickPrimary.gridColor||'#dddddd'}"></div>
  </div>
  <div class="sub-section-title" style="margin-top:8px;"><strong>${I.t('tickCustom')}</strong></div>
  <div class="param-grid cols-4">
    <div class="param-item" style="grid-column: span 2;"><label>${I.t('tickCustom')}（${I.t('tickCustomHint')}）</label>
      <input id="tickPrimaryCustom" type="text" value="${(st.tickPrimary.customTicks||[]).join(',')}" placeholder="0.1, 0.5, 1"></div>
    <div class="param-item"><label>${I.t('tickCustomColor')}</label><input id="customTickColor" type="color" value="${st.customTickColor||'#c0392b'}"></div>
    <div class="param-item"><label class="mini-check"><input id="customTickBold" type="checkbox" ${st.customTickBold?'checked':''}> ${I.t('tickCustomBold')}</label></div>
  </div>
  <div class="sub-section-title" style="margin-top:8px;"><strong>${I.t('panelSecondaryAxis')}</strong></div>
  <div class="param-grid cols-4">
    <div class="param-item"><label>${I.t('tickInterval')}</label><input id="tickSecondaryInterval" type="number" value="${st.tickSecondary.interval}" min="0" step="1"></div>
    <div class="param-item"><label>${I.t('tickShowLabels')}</label>
      <select id="tickSecondaryShowLabels"><option value="true" ${st.tickSecondary.showLabels?'selected':''}>${I.t('optOn')}</option><option value="false" ${!st.tickSecondary.showLabels?'selected':''}>${I.t('optOff')}</option></select></div>
    <div class="param-item"><label>${I.t('tickShowGrid')}</label>
      <select id="tickSecondaryShowGrid"><option value="true" ${st.tickSecondary.showGrid?'selected':''}>${I.t('optOn')}</option><option value="false" ${!st.tickSecondary.showGrid?'selected':''}>${I.t('optOff')}</option></select></div>
    <div class="param-item"><label>${I.t('tickGridDashed')}</label>
      <select id="tickSecondaryGridDashed"><option value="true" ${st.tickSecondary.gridDashed?'selected':''}>${I.t('optOn')}</option><option value="false" ${!st.tickSecondary.gridDashed?'selected':''}>${I.t('optOff')}</option></select></div>
    <div class="param-item"><label>${I.t('tickGridWidth')}</label><input id="tickSecondaryGridWidth" type="number" value="${st.tickSecondary.gridWidth}" min="0.5" max="4" step="0.5"></div>
    <div class="param-item"><label>${I.t('tickGridColor')}</label><input id="tickSecondaryGridColor" type="color" value="${st.tickSecondary.gridColor||'#dddddd'}"></div>
  </div>
</div>

<div class="param-panel" id="scaleBoxPanel"><div class="param-panel-title">${I.t('panelScaleBox')}</div>
  <div class="param-grid cols-4">
    <div class="param-item"><label class="mini-check"><input id="showScaleBoxChk" type="checkbox" ${st.showScaleBox!==false?'checked':''}> ${I.t('scaleBoxShow')}</label></div>
    <div class="param-item"><label>${I.t('scaleBoxSize')}</label><input id="scaleBoxSizeInput" type="number" value="${st.scaleBoxSize||0}" min="0" step="0.01"></div>
    <div class="param-item"><label>${I.t('scaleBoxTitle')}</label><input id="scaleBoxTitleInput" type="text" value="${escA(st.scaleBoxTitle||'Scale')}"></div>
  </div>
  <div class="style-box" style="margin-top:8px;">
    <div class="style-box-title">${I.t('styleBoxScaleBoxTitle')}</div>
    <div data-scale-title-host></div>
  </div>
  <div class="style-box" style="margin-top:8px;">
    <div class="style-box-title">${I.t('styleBoxScaleBoxText')}</div>
    <div data-scale-text-host></div>
  </div>
</div>

<div class="param-panel"><div class="param-panel-title">${I.t('panelTimeTree')}</div>
  <div class="param-grid cols-4">
    <div class="param-item"><label>${I.t('rootTickValue')}</label><input id="rootTickValueInput" type="number" value="${st.rootTickValue!=null?st.rootTickValue:0}" step="0.01"></div>
    <div class="param-item"><label>${I.t('timeScaleFactor')}</label><input id="timeScaleFactorInput" type="number" value="${st.timeScaleFactor}" min="0.000001" step="0.001"></div>
  </div>
  <div class="info-box" style="margin-top:6px;">${I.t('timeTreeHint')}</div>
</div>
  `;

  function renderLayoutSpecific() {
    const inner = container.querySelector('#layoutSpecificInner');
    if (!inner) return;
    const m = C.state.mode || 'rectangular';
    const ticksPanelEl = container.querySelector('#ticksPanel');
    if (ticksPanelEl) ticksPanelEl.style.display = (m === 'rectangular' && C.state.lineShape === 'slanted') ? 'none' : '';
    if (m === 'circular') {
      inner.innerHTML = `
        <div class="sub-section-title"><strong>${I.t('panelLayoutCircular')}</strong></div>
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('panelRotation')}</label><input id="rotation" type="number" value="${C.state.rotation}" min="-360" max="360" step="1"></div>
          <div class="param-item"><label>${I.t('panelArc')}</label><input id="arc" type="number" value="${C.state.arc}" min="1" max="360" step="1"></div>
          <div class="param-item"><label>${I.t('panelLabelAnchorCirc')}</label>
            <select id="labelAnchorCircSelect"><option value="auto" ${(C.state.labelAnchorCirc||'auto')==='auto'?'selected':''}>${I.t('optAuto')}</option><option value="left" ${C.state.labelAnchorCirc==='left'?'selected':''}>${I.t('optLeft')}</option><option value="right" ${C.state.labelAnchorCirc==='right'?'selected':''}>${I.t('optRight')}</option></select></div>
          <div class="param-item"><label>${I.t('panelLabelOffset')}</label><input id="labelShift" type="number" value="${C.state.labelShift}" min="-160" max="260" step="1"></div>
          <div class="param-item"><label>${I.t('panelCircularInvertInnerRadius')}</label><input id="circularInvertInnerRadius" type="number" value="${C.state.circularInvertInnerRadius||''}" min="0" step="1" placeholder="${I.t('phAuto')}"></div>
        </div>
        <div class="info-box" style="margin-top:6px;">${I.t('panelArcHint')}</div>`;
      inner.querySelector('#rotation')?.addEventListener('input', e => { C.state.rotation = Number(e.target.value); global.TreeRenderer.draw(); });
      inner.querySelector('#arc')?.addEventListener('input', e => { C.state.arc = Math.max(1, Math.min(360, Number(e.target.value))); global.TreeRenderer.draw(); });
      inner.querySelector('#labelAnchorCircSelect')?.addEventListener('change', e => { C.state.labelAnchorCirc = e.target.value; global.TreeRenderer.draw(); });
      inner.querySelector('#labelShift')?.addEventListener('input', e => { C.state.labelShift = Number(e.target.value); global.TreeRenderer.draw(); });
      inner.querySelector('#circularInvertInnerRadius')?.addEventListener('input', e => {
        const v = Number(e.target.value);
        C.state.circularInvertInnerRadius = (Number.isFinite(v) && v > 0) ? v : 0;
        global.TreeRenderer.draw();
      });
    } else if (m === 'unrooted') {
      inner.innerHTML = `
        <div class="sub-section-title"><strong>${I.t('panelLayoutUnrooted')}</strong></div>
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('panelRotation')}</label><input id="rotation" type="number" value="${C.state.rotation}" min="-360" max="360" step="1"></div>
          <div class="param-item"><label>${I.t('panelArc')}</label><input id="arc" type="number" value="${C.state.arc}" min="1" max="360" step="1"></div>
          <div class="param-item"><label>${I.t('panelLabelAnchorCirc')}</label>
            <select id="labelAnchorCircSelect"><option value="auto" ${(C.state.labelAnchorCirc||'auto')==='auto'?'selected':''}>${I.t('optAuto')}</option><option value="left" ${C.state.labelAnchorCirc==='left'?'selected':''}>${I.t('optLeft')}</option><option value="right" ${C.state.labelAnchorCirc==='right'?'selected':''}>${I.t('optRight')}</option></select></div>
          <div class="param-item"><label>${I.t('panelLabelOffset')}</label><input id="labelShift" type="number" value="${C.state.labelShift}" min="-160" max="260" step="1"></div>
          <div class="param-item"><label>${I.t('panelUnrootedDaylightIter')}</label><input id="unrootedDaylightIter" type="number" value="${C.state.unrootedDaylightIter!=null?C.state.unrootedDaylightIter:0}" min="0" max="200" step="1" title="${I.t('panelUnrootedDaylightIterHint')}"></div>
        </div>
        <div class="info-box" style="margin-top:6px;">${I.t('panelUnrootedDaylightIterHint')}</div>`;
      inner.querySelector('#rotation')?.addEventListener('input', e => { C.state.rotation = Number(e.target.value); global.TreeRenderer.draw(); });
      inner.querySelector('#arc')?.addEventListener('input', e => { C.state.arc = Math.max(1, Math.min(360, Number(e.target.value))); global.TreeRenderer.draw(); });
      inner.querySelector('#labelAnchorCircSelect')?.addEventListener('change', e => { C.state.labelAnchorCirc = e.target.value; global.TreeRenderer.draw(); });
      inner.querySelector('#labelShift')?.addEventListener('input', e => { C.state.labelShift = Number(e.target.value); global.TreeRenderer.draw(); });
      inner.querySelector('#unrootedDaylightIter')?.addEventListener('input', e => {
        const v = Math.max(0, Math.min(200, Math.round(Number(e.target.value)) || 0));
        C.state.unrootedDaylightIter = v;
        global.TreeRenderer.draw();
      });
    } else {
      const showAlign = C.state.labelPosition === "aligned";
      const curCurvature = (C.state.curvature != null ? Number(C.state.curvature) : 0);
      const isStraight = C.state.lineShape !== 'slanted';
      inner.innerHTML = `
        <div class="sub-section-title"><strong>${I.t('panelLayoutRect')}</strong></div>
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('panelLineShape')}</label>
            <select id="lineShapeSelect"><option value="straight" ${C.state.lineShape==='straight'?'selected':''}>${I.t('optLineStraight')}</option><option value="slanted" ${C.state.lineShape==='slanted'?'selected':''}>${I.t('optLineSlanted')}</option></select></div>
          <div class="param-item"><label>${I.t('panelCurvature')}</label><input id="curvatureInput" type="number" value="${curCurvature.toFixed(2)}" min="0" max="1" step="0.05" ${isStraight?'':'disabled'}></div>
          <div class="param-item align-item" style="${showAlign?'':'display:none;'}"><label>${I.t('panelLabelAnchorRect')}</label>
            <select id="labelAnchorRectSelect"><option value="left" ${(C.state.labelAnchorRect||'left')==='left'?'selected':''}>${I.t('optLeft')}</option><option value="right" ${C.state.labelAnchorRect==='right'?'selected':''}>${I.t('optRight')}</option></select></div>
          <div class="param-item"><label>${I.t('panelLabelOffset')}</label><input id="labelShiftRect" type="number" value="${C.state.labelShift}" min="-260" max="260" step="1"></div>
        </div>`;
      inner.querySelector('#lineShapeSelect')?.addEventListener('change', e => {
        C.state.lineShape = e.target.value;
        if (e.target.value === 'slanted' && C.state.labelPosition === 'aligned') {
          C.state.labelPosition = 'tips';
          const posSel = container.querySelector('#labelPositionSelect');
          if (posSel) posSel.value = 'tips';
          const alignItem = container.querySelector('#layoutSpecificInner .align-item');
          if (alignItem) alignItem.style.display = 'none';
        }
        const cInp = inner.querySelector('#curvatureInput');
        if (cInp) cInp.disabled = (e.target.value !== 'straight');
        const ticksPanel = container.querySelector('#ticksPanel');
        if (ticksPanel) ticksPanel.style.display = (e.target.value === 'slanted') ? 'none' : '';
        global.TreeRenderer.draw();
      });
      inner.querySelector('#curvatureInput')?.addEventListener('input', e => {
        const v = Math.max(0, Math.min(1, Number(e.target.value)));
        if (!isFinite(v)) return;
        C.state.curvature = v;
        global.TreeRenderer.draw();
      });
      inner.querySelector('#labelAnchorRectSelect')?.addEventListener('change', e => { C.state.labelAnchorRect = e.target.value; global.TreeRenderer.draw(); });
      inner.querySelector('#labelShiftRect')?.addEventListener('input', e => { C.state.labelShift = Number(e.target.value); global.TreeRenderer.draw(); });
    }
  }
  renderLayoutSpecific();

  container.querySelectorAll('input[name="treeModeSelect"]').forEach(r => {
    r.addEventListener('change', e => {
      C.state.mode = e.target.value;
      C.state.zoom = 1; C.state.panX = 0; C.state.panY = 0;
      const isCirc = C.state.mode === 'circular' || C.state.mode === 'unrooted';
      const posItem = container.querySelector('#axisPosItem');
      const rotItem = container.querySelector('#axisRotItem');
      if (posItem) posItem.style.display = isCirc ? 'none' : '';
      if (rotItem) rotItem.style.display = isCirc ? '' : 'none';
      renderLayoutSpecific();
      global.TreeRenderer.draw();
      if (global.TreeApp && typeof global.TreeApp.drawTree === "function") global.TreeApp.drawTree();
    });
  });
  const isCirc = C.state.mode === 'circular' || C.state.mode === 'unrooted';
  const posItem = container.querySelector('#axisPosItem');
  const rotItem = container.querySelector('#axisRotItem');
  if (posItem) posItem.style.display = isCirc ? 'none' : '';
  if (rotItem) rotItem.style.display = isCirc ? '' : 'none';

  const posSel = container.querySelector('#labelPositionSelect');
  if (posSel) posSel.addEventListener('change', (e) => {
    const item = container.querySelector('#layoutSpecificInner .align-item');
    if (item) item.style.display = e.target.value === 'aligned' ? '' : 'none';
  });


  W.textStylePanel(container.querySelector('[data-scale-title-host]'), C.state.textStyles.scaleBoxTitle, { onChange: s => { Object.assign(C.state.textStyles.scaleBoxTitle, s); global.TreeRenderer.draw(); } });
  W.textStylePanel(container.querySelector('[data-scale-text-host]'), C.state.textStyles.scaleBoxText, { onChange: s => { Object.assign(C.state.textStyles.scaleBoxText, s); global.TreeRenderer.draw(); } });

  W.lineStylePanel(container.querySelector('[data-extend-host]'), C.state.extendLineStyle, {
    onChange: s => { Object.assign(C.state.extendLineStyle, s); global.TreeRenderer.draw(); }
  });
}

global.TreeUIBasic = { renderBasicPanel };
})(window);