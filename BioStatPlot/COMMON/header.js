// 公共页眉注入器（支持中英文切换）
(function() {
    var defaultConfig = {
        author: '地上飞猪',
        bilibiliUrl: 'https://space.bilibili.com/33053326',
        bilibiliText: null, 
        githubUrl: 'https://github.com/shueho/BioDataTools',
        githubText: null,   
        returnHomeUrl: '../home.html',
        returnHomeText: null 
    };

    function getConfig() {
        if (window.headerConfig) {
            return { ...defaultConfig, ...window.headerConfig };
        }
        return defaultConfig;
    }

    function getText(key, fallback) {
        if (typeof LangManager !== 'undefined' && LangManager.t) {
            var translated = LangManager.t(key);
            if (translated !== key) return translated;
        }
        return fallback || key;
    }

    function injectHeader() {
        var config = getConfig();
        var lang = (typeof LangManager !== 'undefined') ? LangManager.getLang() : 'en';

        var authorPrefix = getText('authorPrefix', '作者：');
        var returnHomeText = config.returnHomeText || getText('returnHome', '返回首页');
        var bilibiliText = config.bilibiliText || getText('bilibiliText', '前往B站主页');
        var githubText = config.githubText || getText('githubText', 'GitHub项目');

        var bilibiliBtn = config.bilibiliUrl && bilibiliText
            ? `<a href="${config.bilibiliUrl}" target="_blank" class="bilibili-link">${bilibiliText}</a>`
            : '';
        var githubBtn = config.githubUrl && githubText
            ? `<a href="${config.githubUrl}" target="_blank" class="github-link">${githubText}</a>`
            : '';

        var headerHTML = `
        <header>
            <div class="header-wrap">
                <div class="header-left">
                    <img src="../../images/logo.png" alt="BioDataTools Logo" class="header-logo">
                    <div class="site-title">
                        <h1>BioStatPlot</h1>
                        <div class="author"><span data-lang-key="authorPrefix">${authorPrefix}</span>${config.author}</div>
                    </div>
                </div>
                <div class="header-right">
                    ${bilibiliBtn}
                    ${githubBtn}
                    <a href="${config.returnHomeUrl}" target="_self" class="back-home" data-lang-key="returnHome">${returnHomeText}</a>
                </div>
            </div>
        </header>`;
        
        var placeholder = document.getElementById('common-header');
        if (placeholder) {
            placeholder.outerHTML = headerHTML;
        } else {
            document.body.insertAdjacentHTML('afterbegin', headerHTML);
        }

        if (typeof LangManager !== 'undefined' && LangManager.switchLanguage) {
            var currentLang = LangManager.getLang();
            var elements = document.querySelectorAll('[data-lang-key]');
            for (var i = 0; i < elements.length; i++) {
                var el = elements[i];
                var key = el.getAttribute('data-lang-key');
                var text = LangManager.t(key, currentLang);
                el.textContent = text;
            }
        }
    }

    window.updateHeader = function() {
        // 移除旧 header 重新注入
        var oldHeader = document.querySelector('header');
        if (oldHeader) oldHeader.remove();
        injectHeader();
    };

    document.addEventListener('languageChanged', function() {
        if (typeof window.updateHeader === 'function') {
            window.updateHeader();
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectHeader);
    } else {
        injectHeader();
    }
})();