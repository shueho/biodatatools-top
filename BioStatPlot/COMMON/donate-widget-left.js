/* ============================================================
   BioDataTools 通用「赞赏支持」悬浮组件 —— 左下角版

   ============================================================ */
(function () {
    'use strict';

    if (window.__bdtDonateWidgetLeftInjected) return;
    window.__bdtDonateWidgetLeftInjected = true;

    // 与右版共用同一份配置对象 donateWidgetConfig，也可单独用 donateWidgetConfigLeft 覆盖
    var CFG = Object.assign({
        image: 'https://www.biodatatools.top/images/donate.png',
        label: '',
        lang: 'auto'
    }, window.donateWidgetConfig || {}, window.donateWidgetConfigLeft || {});

    function detectLang() {
        if (CFG.lang === 'zh' || CFG.lang === 'en') return CFG.lang;
        var path = window.location.pathname || '';
        if (/\/ch(\/|$)/i.test(path)) return 'zh';
        if (/-ch(?:[-._/]|$)/i.test(path)) return 'zh';
        return 'en';
    }
    var LANG = detectLang();

    var I18N = {
        zh: {
            button: '赞赏支持',
            title: '赞赏支持',
            closeLabel: '关闭',
            dialogLabel: '赞赏支持',
            imgAlt: '赞赏二维码',
            paras: [
                '本项目网页源码开源，平台全部工具免费开放使用。',
                '如有需要可以引用本站：' +
                    '<a href="https://www.biodatatools.cn" target="_blank" rel="noopener noreferrer">https://www.biodatatools.cn</a>' +
                    ' / ' +
                    '<a href="https://www.biodatatools.top" target="_blank" rel="noopener noreferrer">https://www.biodatatools.top</a>' +
                    '。',
                '同时期待您助力项目发展：'
            ]
        },
        en: {
            button: 'Donate',
            title: 'Support This Project',
            closeLabel: 'Close',
            dialogLabel: 'Support this project',
            imgAlt: 'Donation QR code',
            paras: [
                'This project\'s source code is open-source, and all tools on this platform are free to use.',
                'If needed, please cite this site:' +
                    '<a href="https://www.biodatatools.cn" target="_blank" rel="noopener noreferrer">https://www.biodatatools.cn</a>' +
                    ' / ' +
                    '<a href="https://www.biodatatools.top" target="_blank" rel="noopener noreferrer">https://www.biodatatools.top</a>' +
                    '.',
                'Your support helps the project keep growing:'
            ]
        }
    };
    var T = I18N[LANG];
    if (CFG.label) T = Object.assign({}, T, { button: CFG.label });

    var CSS = `
    .bdt-donate-l {
        position: fixed;
        left: 24px;
        right: auto;
        bottom: 24px;
        z-index: 999;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        font-family: "Segoe UI", "Microsoft Yahei", sans-serif;
        line-height: 1.6;
    }

    .bdt-donate-l-btn {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 10px 18px;
        border: none;
        border-radius: 999px;
        cursor: pointer;
        font-family: inherit;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: .3px;
        white-space: nowrap;
        color: #fff;
        background: linear-gradient(135deg, #4773AA 0%, #1f4068 100%);
        box-shadow: 0 6px 18px rgba(31, 64, 104, .35);
        transition: transform .25s ease, box-shadow .25s ease;
    }
    .bdt-donate-l-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 26px rgba(31, 64, 104, .45);
    }
    .bdt-donate-l-btn:active {
        transform: translateY(-1px) scale(.97);
    }
    .bdt-donate-l-btn svg {
        width: 18px;
        height: 18px;
        fill: currentColor;
        flex-shrink: 0;
        transition: transform .25s ease;
    }
    .bdt-donate-l-btn:hover svg {
        transform: scale(1.15);
    }

    .bdt-donate-l-panel {
        position: absolute;
        left: 0;
        right: auto;
        bottom: calc(100% + 14px);
        width: 360px;
        max-width: calc(100vw - 32px);
        max-height: calc(100vh - 160px);
        overflow-y: auto;
        padding: 20px 22px 18px;
        background: #fff;
        border: 1px solid #e8edf2;
        border-radius: 14px;
        box-shadow: 0 12px 34px rgba(31, 64, 104, .18);
        text-align: center;

        opacity: 0;
        visibility: hidden;
        transform: translateY(12px) scale(.96);
        transform-origin: bottom left;
        transition: opacity .25s ease, transform .25s ease, visibility .25s;
        pointer-events: none;
    }
    .bdt-donate-l.show .bdt-donate-l-panel {
        opacity: 1;
        visibility: visible;
        transform: translateY(0) scale(1);
        pointer-events: auto;
    }
    .bdt-donate-l-panel::after {
        content: "";
        position: absolute;
        left: 30px;
        right: auto;
        bottom: -7px;
        width: 13px;
        height: 13px;
        background: #fff;
        border-right: 1px solid #e8edf2;
        border-bottom: 1px solid #e8edf2;
        transform: rotate(45deg);
    }

    .bdt-donate-l-panel::-webkit-scrollbar { width: 5px; }
    .bdt-donate-l-panel::-webkit-scrollbar-thumb {
        background: #d8e2ec;
        border-radius: 3px;
    }

    .bdt-donate-l-close {
        position: absolute;
        top: 8px;
        right: 10px;
        width: 24px;
        height: 24px;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: #9aa9b8;
        font-size: 18px;
        line-height: 1;
        cursor: pointer;
        transition: background .2s, color .2s;
    }
    .bdt-donate-l-close:hover {
        background: #f0f4f8;
        color: #1f4068;
    }

    .bdt-donate-l-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0 18px 12px;
        font-size: 16px;
        font-weight: 800;
        color: #1f4068;
        letter-spacing: .5px;
        padding-right: 16px;
    }
    .bdt-donate-l-title::before,
    .bdt-donate-l-title::after {
        content: "";
        flex: 1;
        height: 2px;
    }
    .bdt-donate-l-title::before {
        background: linear-gradient(90deg, transparent, #b8d4f0);
    }
    .bdt-donate-l-title::after {
        background: linear-gradient(90deg, #b8d4f0, transparent);
    }

    .bdt-donate-l-text {
        margin: 0 0 12px;
        font-size: 13px;
        line-height: 1.9;
        color: #5a6b7d;
        text-align: left;
        word-break: break-word;
    }
    .bdt-donate-l-text p {
        margin: 0 0 6px;
    }
    .bdt-donate-l-text p:last-child {
        margin-bottom: 0;
    }
    .bdt-donate-l-text a {
        color: #1f4068;
        font-weight: 600;
        text-decoration: none;
        word-break: break-all;
    }
    .bdt-donate-l-text a:hover {
        text-decoration: underline;
    }

    .bdt-donate-l-img {
        display: block;
        width: 100%;
        height: auto;
        margin: 0 auto;
        padding: 4px;
        border: 1px solid #e8edf2;
        border-radius: 10px;
        background: #f8fafc;
        box-sizing: border-box;
    }

    @media (max-width: 768px) {
        .bdt-donate-l {
            left: 14px;
            right: auto;
            bottom: 14px;
        }
        .bdt-donate-l-btn {
            padding: 9px 15px;
            font-size: 13px;
        }
        .bdt-donate-l-btn svg {
            width: 16px;
            height: 16px;
        }
        .bdt-donate-l-panel {
            width: calc(100vw - 32px);
            max-width: 340px;
            padding: 16px 16px 14px;
        }
    }
    `;

    function injectStyle() {
        if (document.getElementById('bdt-donate-l-style')) return;
        var style = document.createElement('style');
        style.id = 'bdt-donate-l-style';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    function escapeAttr(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function buildTextHtml(paras) {
        return '<div class="bdt-donate-l-text">' +
            paras.map(function (p) { return '<p>' + p + '</p>'; }).join('') +
            '</div>';
    }

    function createWidget() {
        var wrap = document.createElement('div');
        wrap.className = 'bdt-donate-l';
        wrap.setAttribute('lang', LANG === 'zh' ? 'zh-CN' : 'en');

        wrap.innerHTML =
            '<div class="bdt-donate-l-panel" role="dialog" aria-label="' + escapeAttr(T.dialogLabel) + '">' +
                '<button type="button" class="bdt-donate-l-close" aria-label="' + escapeAttr(T.closeLabel) + '">&times;</button>' +
                '<div class="bdt-donate-l-title">' + T.title + '</div>' +
                buildTextHtml(T.paras) +
                '<img class="bdt-donate-l-img" src="' + escapeAttr(CFG.image) + '" alt="' + escapeAttr(T.imgAlt) + '" loading="lazy">' +
            '</div>' +
            '<button type="button" class="bdt-donate-l-btn" aria-expanded="false" aria-label="' + escapeAttr(T.button) + '">' +
                '<svg viewBox="0 0 24 24" aria-hidden="true">' +
                    '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3' +
                    'c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5' +
                    'c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>' +
                '</svg>' +
                '<span>' + T.button + '</span>' +
            '</button>';

        return wrap;
    }

    function bindEvents(wrap) {
        var btn = wrap.querySelector('.bdt-donate-l-btn');
        var panel = wrap.querySelector('.bdt-donate-l-panel');
        var closeBtn = wrap.querySelector('.bdt-donate-l-close');

        function open() {
            wrap.classList.add('show');
            btn.setAttribute('aria-expanded', 'true');
        }
        function close() {
            wrap.classList.remove('show');
            btn.setAttribute('aria-expanded', 'false');
        }

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            wrap.classList.contains('show') ? close() : open();
        });
        closeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            close();
        });
        panel.addEventListener('click', function (e) {
            e.stopPropagation();
        });
        document.addEventListener('click', function (e) {
            if (wrap.classList.contains('show') && !wrap.contains(e.target)) close();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && wrap.classList.contains('show')) close();
        });
    }

    function setupPositionTracking(wrap) {
        var panel = wrap.querySelector('.bdt-donate-l-panel');
        var ticking = false;

        function update() {
            var footer = document.querySelector('footer');
            if (!footer) return;
            var baseGap = window.innerWidth <= 768 ? 14 : 24;
            var vh = window.innerHeight || document.documentElement.clientHeight;
            var footerTop = footer.getBoundingClientRect().top;
            var overlap = vh - footerTop;

            if (overlap > 0) {
                wrap.style.bottom = (overlap + baseGap) + 'px';
                var maxH = Math.max(220, vh - (overlap + baseGap) - 90);
                panel.style.maxHeight = maxH + 'px';
            } else {
                wrap.style.bottom = baseGap + 'px';
                panel.style.maxHeight = '';
            }
        }

        function onScroll() {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(function () {
                    update();
                    ticking = false;
                });
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        window.addEventListener('load', update);
        setTimeout(update, 100);
        setTimeout(update, 500);
    }

    function init() {
        injectStyle();
        var wrap = createWidget();
        document.body.appendChild(wrap);
        bindEvents(wrap);
        setupPositionTracking(wrap);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();