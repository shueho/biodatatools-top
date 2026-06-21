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
                Support Us
                <div class="donate-tip">
                    <img class="donate-img" src="${donateImgSrc}" alt="Donation QR Code">
                </div>
            </span>
            <div class="email">Contact: studid@163.com</div>
            BioDataTools &copy; ${yearText} Di Shang Fei Zhu (Hao Xue)<br>
            Disclaimer: Most content is adapted from the BioDataTools toolkit. Some scripts are sourced from open-source projects with original authors credited. Web design is AI-assisted.<br>
            For citation, please reference this website: https://www.biodatatools.top or the BioDataTools toolkit.<br>
            Reference: Xue H. Genome structure and comparative genomic analysis of the Przewalski's partridge (Alectoris magna) [D]. Yantai: Yantai University, 2024.
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