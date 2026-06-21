(function() {
    const defaultConfig = {
        author: 'Author: Di Shang Fei Zhu (Hao Xue)',
        bilibiliUrl: 'https://space.bilibili.com/33053326',
        bilibiliText: 'Bilibili Channel',
        githubUrl: 'https://github.com/shueho/BioDataTools',
        githubText: 'GitHub',
        returnHomeUrl: '../index.html'   
    };

    function getConfig() {
        if (window.headerConfig) {
            return { ...defaultConfig, ...window.headerConfig };
        }
        return defaultConfig;
    }

    function injectHeader() {
        const config = getConfig();
        const headerHTML = `
        <header>
            <div class="header-wrap">
                <div class="header-left">
                    <img src="../images/logo.png" alt="BioDataTools Logo" class="header-logo">
                    <div class="site-title">
                        <h1>BioDataTools</h1>
                        <div class="author">${config.author}</div>
                    </div>
                </div>
                <div>
                    <a href="${config.bilibiliUrl}" target="_blank" class="bilibili-link">${config.bilibiliText}</a>
                    <a href="${config.githubUrl}" target="_blank" class="github-link">${config.githubText}</a>
                    <a href="${config.returnHomeUrl}" target="_self" class="back-home">Home</a>
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