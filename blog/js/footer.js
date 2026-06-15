// 公共页脚注入器（自动判断首页/子页，选择正确的图片路径）
(function() {
    // 判断当前页面是否位于网站根目录（首页）
    function isRootPage() {
        // 获取当前路径（不含域名）
        const path = window.location.pathname;
        // 根目录的情况：path 为 '/' 或者 '/index.html' 或者以 '/index.html' 结尾
        return path === '/' || path === '/index.html' || path.endsWith('/index.html');
    }

    // 根据是否首页返回正确的捐赠图片路径
    function getDonateImgSrc() {
        if (isRootPage()) {
            return './images/donate.png';   // 首页使用当前目录下的 images
        } else {
            return '../images/donate.png';  // 子页使用上级目录的 images
        }
    }

    function injectFooter() {
        const currentYear = new Date().getFullYear();
        const startYear = 2023;
        const yearText = currentYear > startYear ? `${startYear}-${currentYear}` : `${startYear}`;
        
        const donateImgSrc = getDonateImgSrc();

        const footerHTML = `
        <footer>
            <span class="donate-wrap">
                赞赏支持
                <div class="donate-tip">
                    <img class="donate-img" src="${donateImgSrc}" alt="捐赠二维码">
                </div>
            </span>
            <div class="email">联系作者：studid@163.com</div>
            地上飞猪个人博客 &copy; ${yearText} 地上飞猪<br>
            声明：博客内容为个人见解，仅供学习交流。
        </footer>`;
        
        const placeholder = document.getElementById('common-footer');
        if (placeholder) {
            placeholder.outerHTML = footerHTML;
        } else {
            document.body.insertAdjacentHTML('beforeend', footerHTML);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectFooter);
    } else {
        injectFooter();
    }
})();