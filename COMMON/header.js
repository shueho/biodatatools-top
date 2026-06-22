(function() {
    const defaultConfig = {
        author: '作者：地上飞猪',
        bilibiliUrl: 'https://space.bilibili.com/33053326',
        bilibiliText: '前往B站主页',
        githubUrl: 'https://github.com/shueho/BioDataTools',
        githubText: 'GitHub项目',
        homeText: '返回首页',
        returnHomeUrl: '../index-ch.html',   
        langText: '🌐 English',                 
    };

    const enConfig = {
        author: 'Author: Di Shang Fei Zhu (Hao Xue)',
        bilibiliText: 'Bilibili Channel',
        githubText: 'GitHub',
        homeText: 'Home',
        returnHomeUrl: '../index.html',     
        langText: '🌐 中文',
    };

    function getConfig() {
        const currentPath = window.location.pathname;
        const isEnglish = currentPath.includes('/en/');

        let base = isEnglish ? { ...defaultConfig, ...enConfig } : { ...defaultConfig };

        if (window.headerConfig) {
            base = { ...base, ...window.headerConfig };
        }
        return base;
    }

    function getLangSwitchUrl() {
        const currentPath = window.location.pathname;
        if (currentPath.includes('/en/')) {
            return currentPath.replace('/en/', '/ch/');
        } else {
            return currentPath.replace('/ch/', '/en/');
        }
    }

    function injectHeader() {
        const config = getConfig();
        const currentPath = window.location.pathname;
        const isEnglish = currentPath.includes('/en/');
        const langUrl = getLangSwitchUrl();

        const {
            author,
            bilibiliUrl,
            bilibiliText,
            githubUrl,
            githubText,
            homeText,
            returnHomeUrl,
            langText,
        } = config;

        const langButtonText = isEnglish ? langText : 'English';

        const headerHTML = `
        <header>
            <div class="header-wrap">
                <div class="header-left">
                    <img src="../images/logo.png" alt="BioDataTools Logo" class="header-logo">
                    <div class="site-title">
                        <h1>BioDataTools</h1>
                        <div class="author">${author}</div>
                    </div>
                </div>
                <div>
                    <a href="${bilibiliUrl}" target="_blank" class="bilibili-link">${bilibiliText}</a>
                    <a href="${githubUrl}" target="_blank" class="github-link">${githubText}</a>
                    <a href="${returnHomeUrl}" target="_self" class="back-home">${homeText}</a>
                    <a href="${langUrl}" class="lang-switch-btn">${langButtonText}</a>
                </div>
            </div>
        </header>`;

        const placeholder = document.getElementById('common-header');
        if (placeholder) {
            placeholder.outerHTML = headerHTML;
        } else {
            document.body.insertAdjacentHTML('afterbegin', headerHTML);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectHeader);
    } else {
        injectHeader();
    }
})();