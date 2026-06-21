(function() {
    function isRootPage() {
        const path = window.location.pathname;
        return path === '/' || path === '/index.html' || path.endsWith('/index.html');
    }

    function getDonateImgSrc() {
        if (isRootPage()) {
            return './images/donate.png';  
        } else {
            return '../images/donate.png';  
        }
    }

    function injectFooter() {
        const currentYear = new Date().getFullYear();
        const startYear = 2023;
        const yearText = currentYear > startYear ? `${startYear}-${currentYear}` : `${startYear}`;
        
        const donateImgSrc = getDonateImgSrc();
        //const donateImgSrc = 'https://shueho.github.io/images/donate.png';


        const footerHTML = `
        <footer>
            <span class="donate-wrap">
                赞赏支持
                <div class="donate-tip">
                    <img class="donate-img" src="${donateImgSrc}" alt="捐赠二维码">
                </div>
            </span>
            <div class="email">联系作者：studid@163.com</div>
            BioDataTools &copy; ${yearText} 地上飞猪<br>
            声明：大部分内容改编自BioDataTools工具集，部分脚本取自开源项目并标注原作者，网页设计由AI辅助完成。<br>
            如需引用，可引用本网站：https://www.biodatatools.top或BioDataTools工具集。<br>
            参考文献：薛浩, 大石鸡（Alectoris magna）基因组结构与比较基因组分析[D]. 烟台: 烟台大学, 2024.
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