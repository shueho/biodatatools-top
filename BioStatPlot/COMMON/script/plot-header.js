/* ============================================================
   BioDataTools 通用页眉注入
============================================================ */
(function () {
    'use strict';

    const DEFAULT_CFG = {
        author: '作者：地上飞猪',
        bilibiliUrl: 'https://space.bilibili.com/33053326',
        bilibiliText: '前往B站主页',
        githubUrl: 'https://github.com/shueho/BioDataTools',
        githubText: 'GitHub项目',
        homeText: '返回首页',
        returnHomeUrl: '../home-ch.html',
        langText: '🌐 English'
    };
    const EN_CFG = {
        author: 'Author: Di Shang Fei Zhu (Hao Xue)',
        bilibiliText: 'Bilibili Channel',
        githubText: 'GitHub',
        homeText: 'Home',
        returnHomeUrl: '../home.html',
        langText: '🌐 中文'
    };

    function getConfig() {
        const path = window.location.pathname;
        const isEnglish = path.includes('/en/');
        let cfg = isEnglish
            ? Object.assign({}, DEFAULT_CFG, EN_CFG)
            : Object.assign({}, DEFAULT_CFG);
        if (window.headerConfig) Object.assign(cfg, window.headerConfig);
        return cfg;
    }

    function getLangUrl() {
        const path = window.location.pathname;
        if (path.includes('/en/')) return path.replace('/en/', '/ch/');
        return path.replace('/ch/', '/en/');
    }

    function inject() {
        const cfg = getConfig();
        const isEnglish = window.location.pathname.includes('/en/');
        const langUrl = getLangUrl();
        const langBtnText = isEnglish ? cfg.langText : '🌐 English';

        const html = `
        <style id="plot-header-style">
            .pd-header {
                background: #1f4068;
                color: #fff;
                padding: 1.2rem 2rem;
                box-shadow: 0 2px 10px rgba(0,0,0,.15);
                position: sticky;
                top: 0;
                z-index: 99;
                font-family: "Segoe UI", "Microsoft Yahei", sans-serif;
                box-sizing: border-box;
            }
            .pd-header * { box-sizing: border-box; }
            .pd-header-wrap {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 16px;
            }
            .pd-header-left {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            .pd-header-logo {
                height: 80px;
                width: auto;
                border-radius: 6px;
                flex-shrink: 0;
            }
            .pd-header-title h1 {
                font-size: 1.6rem;
                letter-spacing: 1px;
                color: #fff;
                margin: 0;
                font-weight: 700;
            }
            .pd-header-title .pd-author {
                margin-top: .2rem;
                font-size: .85rem;
                opacity: .85;
            }
            .pd-header-nav {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            }
            .pd-header-nav a {
                color: #fff;
                text-decoration: none;
                padding: .6rem 1.2rem;
                border-radius: 6px;
                transition: .3s;
                font-weight: 500;
                white-space: nowrap;
                font-size: 1rem;
            }
            .pd-header-nav a.pd-bilibili { background: #fb7299; }
            .pd-header-nav a.pd-github   { background: #24292f; }
            .pd-header-nav a.pd-home     { background: #24292f; }
            .pd-header-nav a:hover { transform: scale(1.05); opacity: .9; }
            .pd-header-nav a.pd-lang {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: .5rem 1.4rem;
                border-radius: 30px;
                font-weight: 600;
                font-size: .95rem;
                box-shadow: 0 4px 12px rgba(102,126,234,.4);
                letter-spacing: .5px;
            }
            .pd-header-nav a.pd-lang:hover {
                transform: translateY(-2px) scale(1.03);
                box-shadow: 0 8px 20px rgba(102,126,234,.6);
            }
            @media (max-width: 768px) {
                .pd-header { padding: .8rem 1rem; }
                .pd-header-wrap { flex-direction: column; text-align: center; }
                .pd-header-left { flex-direction: column; gap: 8px; }
                .pd-header-logo { height: 55px; }
                .pd-header-title h1 { font-size: 1.3rem; }
                .pd-header-nav { justify-content: center; }
                .pd-header-nav a { padding: .4rem .8rem; font-size: .85rem; }
            }
            @media (max-width: 480px) {
                .pd-header-logo { height: 45px; }
            }
        </style>
        <header class="pd-header">
            <div class="pd-header-wrap">
                <div class="pd-header-left">
                    <img src="../../images/logo.png" alt="BioDataTools Logo" class="pd-header-logo">
                    <div class="pd-header-title">
                        <h1>BioDataTools</h1>
                        <div class="pd-author">${cfg.author}</div>
                    </div>
                </div>
                <nav class="pd-header-nav">
                    <a href="${cfg.bilibiliUrl}" target="_blank" class="pd-bilibili">${cfg.bilibiliText}</a>
                    <a href="${cfg.githubUrl}" target="_blank" class="pd-github">${cfg.githubText}</a>
                    <a href="${cfg.returnHomeUrl}" target="_self" class="pd-home">${cfg.homeText}</a>
                    <a href="${langUrl}" class="pd-lang">${langBtnText}</a>
                </nav>
            </div>
        </header>`;

        const ph = document.getElementById('common-header');
        if (ph) ph.outerHTML = html;
        else document.body.insertAdjacentHTML('afterbegin', html);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }
})();