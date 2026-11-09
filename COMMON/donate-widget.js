/* ============================================================
   BioDataTools 通用「赞赏支持」悬浮组件
   ============================================================ */
(function () {
    'use strict';

    if (window.__bdtDonateWidgetInjected) return;
    window.__bdtDonateWidgetInjected = true;

    var CFG = Object.assign({
        image: 'https://www.biodatatools.top/images/donate.png',
        helpImage: 'https://www.biodatatools.top/images/weixin.png',
        label: '',
        lang: 'auto'
    }, window.donateWidgetConfig || {});

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
            ],
            helpButton: '获取帮助',
            helpTitle: '获取帮助',
            helpDialogLabel: '获取帮助',
            helpImgAlt: '微信公众号二维码',
            helpParas: [
                '部分工具附带视频教程，点击工具页中的【当前工具使用教程视频】按钮可查看详细演示。',
                '各工具图文教程将持续更新，欢迎关注公众号并发送工具名称，查看对应帮助文档。'
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
            ],
            helpButton: 'Get Help',
            helpTitle: 'Get Help',
            helpDialogLabel: 'Get help',
            helpImgAlt: 'WeChat Official Account QR code',
            helpParas: [
                'Some tools come with video tutorials. Click the "Tutorial video for this tool" button on the tool page to view a detailed demonstration.',
                'Illustrated guides for each tool will be updated continuously. Follow our WeChat Official Account and send us the tool name to view its help documentation.'
            ]
        }
    };
    var T = I18N[LANG];
    if (CFG.label) T = Object.assign({}, T, { button: CFG.label });

    var CSS = `
    .bdt-donate {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 999;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 14px;
        font-family: "Segoe UI", "Microsoft Yahei", sans-serif;
        line-height: 1.6;
    }

    .bdt-donate-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
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
    .bdt-donate-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 26px rgba(31, 64, 104, .45);
    }
    .bdt-donate-btn:active {
        transform: translateY(-1px) scale(.97);
    }
    .bdt-donate-btn svg {
        width: 18px;
        height: 18px;
        fill: currentColor;
        flex-shrink: 0;
        transition: transform .25s ease;
    }
    .bdt-donate-btn:hover svg {
        transform: scale(1.15);
    }

    .bdt-donate-panel {
        position: absolute;
        right: 0;
        bottom: calc(100% + 14px);
        width: 360px;
        max-width: calc(100vw - 32px);
        max-height: calc(100vh - 120px);
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
        transform-origin: bottom right;
        transition: opacity .25s ease, transform .25s ease, visibility .25s;
        pointer-events: none;
    }
    .bdt-donate.show .bdt-donate-panel--donate,
    .bdt-donate.show-help .bdt-donate-panel--help {
        opacity: 1;
        visibility: visible;
        transform: translateY(0) scale(1);
        pointer-events: auto;
    }
    .bdt-donate-panel::after {
        content: "";
        position: absolute;
        right: 30px;
        bottom: -7px;
        width: 13px;
        height: 13px;
        background: #fff;
        border-right: 1px solid #e8edf2;
        border-bottom: 1px solid #e8edf2;
        transform: rotate(45deg);
    }

    .bdt-donate-panel::-webkit-scrollbar { width: 5px; }
    .bdt-donate-panel::-webkit-scrollbar-thumb {
        background: #d8e2ec;
        border-radius: 3px;
    }

    .bdt-donate-close {
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
    .bdt-donate-close:hover {
        background: #f0f4f8;
        color: #1f4068;
    }

    .bdt-donate-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0 18px 10px;
        font-size: 16px;
        font-weight: 800;
        color: #1f4068;
        letter-spacing: .5px;
        padding-right: 16px;
    }
    .bdt-donate-title::before,
    .bdt-donate-title::after {
        content: "";
        flex: 1;
        height: 2px;
    }
    .bdt-donate-title::before {
        background: linear-gradient(90deg, transparent, #b8d4f0);
    }
    .bdt-donate-title::after {
        background: linear-gradient(90deg, #b8d4f0, transparent);
    }

    .bdt-donate-text {
        margin: 0 0 10px;
        font-size: 13px;
        line-height: 1.7;
        color: #5a6b7d;
        text-align: left;
        word-break: break-word;
    }
    .bdt-donate-text p {
        margin: 0 0 6px;
    }
    .bdt-donate-text p:last-child {
        margin-bottom: 0;
    }
    .bdt-donate-text a {
        color: #1f4068;
        font-weight: 600;
        text-decoration: none;
        word-break: break-all;
    }
    .bdt-donate-text a:hover {
        text-decoration: underline;
    }

    .bdt-donate-img {
        display: block;
        width: 100%;
        max-height: 220px;
        object-fit: contain;
        height: auto;
        margin: 0 auto;
        padding: 4px;
        border: 1px solid #e8edf2;
        border-radius: 10px;
        background: #fff;
        box-sizing: border-box;
    }

    @media (max-width: 768px) {
        .bdt-donate {
            right: 14px;
            bottom: 14px;
            gap: 12px;
        }
        .bdt-donate-btn {
            padding: 9px 15px;
            font-size: 13px;
        }
        .bdt-donate-btn svg {
            width: 16px;
            height: 16px;
        }
        .bdt-donate-panel {
            width: calc(100vw - 32px);
            max-width: 340px;
            max-height: calc(100vh - 100px);
            padding: 16px 16px 14px;
        }
        .bdt-donate-img {
            max-height: 180px;
        }
    }
    `;

    function injectStyle() {
        if (document.getElementById('bdt-donate-style')) return;
        var style = document.createElement('style');
        style.id = 'bdt-donate-style';
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
        return '<div class="bdt-donate-text">' +
            paras.map(function (p) { return '<p>' + p + '</p>'; }).join('') +
            '</div>';
    }

    function createWidget() {
        var wrap = document.createElement('div');
        wrap.className = 'bdt-donate';
        wrap.setAttribute('lang', LANG === 'zh' ? 'zh-CN' : 'en');

        wrap.innerHTML =
            '<div class="bdt-donate-panel bdt-donate-panel--donate" role="dialog" aria-label="' + escapeAttr(T.dialogLabel) + '">' +
                '<button type="button" class="bdt-donate-close" aria-label="' + escapeAttr(T.closeLabel) + '">&times;</button>' +
                '<div class="bdt-donate-title">' + T.title + '</div>' +
                buildTextHtml(T.paras) +
                '<img class="bdt-donate-img" src="' + escapeAttr(CFG.image) + '" alt="' + escapeAttr(T.imgAlt) + '" loading="lazy">' +
            '</div>' +
            '<div class="bdt-donate-panel bdt-donate-panel--help" role="dialog" aria-label="' + escapeAttr(T.helpDialogLabel) + '">' +
                '<button type="button" class="bdt-donate-close" aria-label="' + escapeAttr(T.closeLabel) + '">&times;</button>' +
                '<div class="bdt-donate-title">' + T.helpTitle + '</div>' +
                buildTextHtml(T.helpParas) +
                '<img class="bdt-donate-img" src="' + escapeAttr(CFG.helpImage) + '" alt="' + escapeAttr(T.helpImgAlt) + '" loading="lazy">' +
            '</div>' +
            '<button type="button" class="bdt-donate-btn bdt-donate-btn--donate" aria-expanded="false" aria-label="' + escapeAttr(T.button) + '">' +
                '<svg viewBox="0 0 24 24" aria-hidden="true">' +
                    '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3' +
                    'c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5' +
                    'c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>' +
                '</svg>' +
                '<span>' + T.button + '</span>' +
            '</button>' +
            '<button type="button" class="bdt-donate-btn bdt-donate-btn--help" aria-expanded="false" aria-label="' + escapeAttr(T.helpButton) + '">' +
                '<svg viewBox="0 0 24 24" aria-hidden="true">' +
                    '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z' +
                    'm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5' +
                    'c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8' +
                    'c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>' +
                '</svg>' +
                '<span>' + T.helpButton + '</span>' +
            '</button>';

        return wrap;
    }

    function bindEvents(wrap) {
        var donateBtn = wrap.querySelector('.bdt-donate-btn--donate');
        var helpBtn = wrap.querySelector('.bdt-donate-btn--help');

        function closeAll() {
            wrap.classList.remove('show', 'show-help');
            donateBtn.setAttribute('aria-expanded', 'false');
            helpBtn.setAttribute('aria-expanded', 'false');
        }

        function toggle(which) {
            if (which === 'donate') {
                if (wrap.classList.contains('show')) { closeAll(); return; }
                closeAll();
                wrap.classList.add('show');
                donateBtn.setAttribute('aria-expanded', 'true');
            } else {
                if (wrap.classList.contains('show-help')) { closeAll(); return; }
                closeAll();
                wrap.classList.add('show-help');
                helpBtn.setAttribute('aria-expanded', 'true');
            }
        }

        donateBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            toggle('donate');
        });
        helpBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            toggle('help');
        });

        wrap.querySelectorAll('.bdt-donate-close').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                closeAll();
            });
        });

        wrap.querySelectorAll('.bdt-donate-panel').forEach(function (panel) {
            panel.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        });

        document.addEventListener('click', function (e) {
            if ((wrap.classList.contains('show') || wrap.classList.contains('show-help')) && !wrap.contains(e.target)) {
                closeAll();
            }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && (wrap.classList.contains('show') || wrap.classList.contains('show-help'))) {
                closeAll();
            }
        });
    }

    function setupPositionTracking(wrap) {
        var panels = wrap.querySelectorAll('.bdt-donate-panel');
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
                var maxH = Math.max(220, vh - (overlap + baseGap) - 60);
                panels.forEach(function (p) { p.style.maxHeight = maxH + 'px'; });
            } else {
                wrap.style.bottom = baseGap + 'px';
                panels.forEach(function (p) { p.style.maxHeight = ''; });
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