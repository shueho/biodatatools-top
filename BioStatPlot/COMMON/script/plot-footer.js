/* ============================================================
   BioDataTools 通用页脚注入
 ============================================================ */
(function () {
    'use strict';

    function inject() {
        const currentYear = new Date().getFullYear();
        const startYear = 2023;
        const yearText = currentYear > startYear ? `${startYear}-${currentYear}` : `${startYear}`;
        const donateImgSrc = 'https://www.biodatatools.top/images/donate.png';

        const html = `
        <style id="plot-footer-style">
            .pd-footer {
                margin: 0;
                padding: 0;
                font-family: "Segoe UI", "Microsoft Yahei", sans-serif;
                font-size: .9rem;
                box-sizing: border-box;
            }
            .pd-footer * { box-sizing: border-box; }
            .pd-footer-ncbi { border-top: 1px solid #d0d0d0; }
            .pd-footer-container {
                max-width: 1500px;
                margin: 0 auto;
                padding: 0 20px;
            }
            .pd-footer-block-title {
                background: #4773AA;
                padding: 1.2rem 0 .8rem;
                text-align: center;
            }
            .pd-footer-block-title .pd-title-text {
                font-weight: 700;
                font-size: 1.1rem;
                color: #fff;
                font-family: "Roboto","Helvetica Neue",Arial,Tahoma;
            }
            .pd-footer-block-icons {
                background: #DBDBDB;
                padding: 1.2rem 0;
                text-align: center;
            }
            .pd-icon-grid {
                display: flex;
                justify-content: space-around;
                flex-wrap: wrap;
                padding: 0 10px;
                gap: 25px 35px;
            }
            .pd-footer-icon { display: inline-block; transition: transform .2s; }
            .pd-footer-icon:hover { transform: scale(1.15); }
            .pd-footer-icon svg {
                width: 36px;
                height: 36px;
                fill: #737373;
                vertical-align: middle;
            }
            .pd-footer-icon svg:hover { fill: #1f4068; }

            .pd-footer-block-links {
                background: #20558A;
                padding: 2rem 0 1rem;
                color: #e8f0fc;
            }
            .pd-link-columns {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding: .5rem 0 1rem;
                border-bottom: 1px solid rgba(255,255,255,.15);
                margin-bottom: 1rem;
                gap: 40px 60px;
            }
            .pd-link-column { flex: 1; min-width: 0; }
            .pd-link-column.pd-left { text-align: right; }
            .pd-link-column.pd-center {
                flex: 0 0 auto;
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .pd-link-column.pd-right {
                flex: 1;
                text-align: left;
                white-space: nowrap;
            }
            .pd-link-column h4 {
                font-size: .95rem;
                font-weight: 700;
                color: #fff;
                margin: 0 0 .5rem 0;
            }
            .pd-link-column ul { list-style: none; padding: 0; margin: 0; }
            .pd-link-column ul li { margin: .3rem 0; line-height: 1.6; }
            .pd-link-column ul li a { color: #b8d4f0; text-decoration: none; }
            .pd-link-column ul li a:hover { color: #fff; text-decoration: underline; }

            .pd-donate-title {
                display: inline-block;
                position: relative;
                cursor: pointer;
                font-weight: 700;
                font-size: 1.5rem;
                color: #fff;
                padding: .5rem 0;
                line-height: 1.4;
            }
            .pd-donate-tip {
                visibility: hidden;
                opacity: 0;
                position: absolute;
                bottom: 120%;
                left: 50%;
                transform: translateX(-50%);
                background: #fff;
                padding: 12px;
                border-radius: 8px;
                box-shadow: 0 3px 12px rgba(0,0,0,.2);
                transition: opacity .3s, visibility .3s;
                z-index: 100;
                white-space: nowrap;
            }
            .pd-donate-tip img { display: block; max-width: 400px; height: auto; }
            .pd-donate-title:hover .pd-donate-tip { visibility: visible; opacity: 1; }

            .pd-footer-bottom {
                text-align: center;
                font-size: .85rem;
                color: #fff;
                line-height: 1.8;
            }
            .pd-footer-bottom p { margin: .2rem 0; }

            @media (max-width: 768px) {
                .pd-link-columns {
                    flex-wrap: wrap;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 20px;
                }
                .pd-link-column,
                .pd-link-column.pd-left,
                .pd-link-column.pd-right,
                .pd-link-column.pd-center {
                    flex: none;
                    width: 100%;
                    text-align: center;
                    white-space: normal;
                }
                .pd-link-column.pd-right ul li { white-space: normal; }
                .pd-donate-tip img { max-width: 200px; }
            }
            @media (max-width: 480px) {
                .pd-footer-icon svg { width: 28px; height: 28px; }
                .pd-icon-grid { gap: 15px 25px; }
            }
        </style>
        <footer class="pd-footer">
            <div class="pd-footer-ncbi">

                <div class="pd-footer-block-title">
                    <div class="pd-footer-container">
                        <span class="pd-title-text">FOLLOW BIODATATOOLS</span>
                    </div>
                </div>

                <div class="pd-footer-block-icons">
                    <div class="pd-footer-container">
                        <div class="pd-icon-grid">
                            <a class="pd-footer-icon" href="https://x.com/shuehoo" target="_blank" aria-label="X (Twitter)">
                                <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6.067 7L16.878 20.9L6 32.2h4.2l8.4-9.1L25.668 32.2H34L22.8 17.5 31.9 7h-3.5l-7.7 8.4L14.4 7H6.068zm3.6 1.734h3.265L29.733 30.466h-3.163L9.668 8.734z"/>
                                </svg>
                            </a>
                            <a class="pd-footer-icon" href="https://github.com/shueho" target="_blank" aria-label="GitHub">
                                <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
                                    <path fill-rule="evenodd" d="M151.36 47.28a105.76 105.76 0 0 0-33.43 206.1c5.28 1 7.22-2.3 7.22-5.09 0-2.52-.09-10.85-.14-19.69-29.42 6.4-35.63-12.48-35.63-12.48-4.81-12.22-11.74-15.47-11.74-15.47-9.59-6.56.73-6.43.73-6.43 10.61.75 16.21 10.9 16.21 10.9 9.43 16.17 24.73 11.49 30.77 8.79 1-6.83 3.69-11.5 6.71-14.14C108.57 197.1 83.88 188 83.88 147.51a40.92 40.92 0 0 1 10.9-28.39c-1.1-2.66-4.72-13.42 1-28 0 0 8.88-2.84 29.09 10.84a100.26 100.26 0 0 1 53 0C198 88.3 206.9 91.14 206.9 91.14c5.76 14.56 2.14 25.32 1 28a40.87 40.87 0 0 1 10.89 28.39c0 40.62-24.74 49.56-48.29 52.18 3.79 3.28 7.17 9.71 7.17 19.58 0 14.15-.12 25.54-.12 29 0 2.82 1.9 6.11 7.26 5.07A105.76 105.76 0 0 0 151.36 47.28z"/>
                                </svg>
                            </a>
                            <a class="pd-footer-icon" href="https://space.bilibili.com/33053326" target="_blank" aria-label="Bilibili">
                                <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                    <g transform="scale(1.6667)">
                                        <path d="M18.223 3.086a1.25 1.25 0 0 1 0 1.768L17.08 5.996h1.17A3.75 3.75 0 0 1 22 9.747v7.5a3.75 3.75 0 0 1-3.75 3.75H5.75A3.75 3.75 0 0 1 2 17.247v-7.5a3.75 3.75 0 0 1 3.75-3.75h1.166L5.775 4.855a1.25 1.25 0 1 1 1.767-1.768l2.652 2.652c.079.079.145.165.198.257h3.213c.053-.092.12-.18.199-.258l2.651-2.652a1.25 1.25 0 0 1 1.768 0zm.027 5.42H5.75a1.25 1.25 0 0 0-1.247 1.157l-.003.094v7.5c0 .659.51 1.199 1.157 1.246l.093.004h12.5a1.25 1.25 0 0 0 1.247-1.157l.003-.093v-7.5c0-.69-.56-1.25-1.25-1.25zm-10 2.5c.69 0 1.25.56 1.25 1.25v1.25a1.25 1.25 0 1 1-2.5 0v-1.25c0-.69.56-1.25 1.25-1.25zm7.5 0c.69 0 1.25.56 1.25 1.25v1.25a1.25 1.25 0 1 1-2.5 0v-1.25c0-.69.56-1.25 1.25-1.25z"/>
                                    </g>
                                </svg>
                            </a>
                            <a class="pd-footer-icon" href="https://www.youtube.com/@shueho" target="_blank" aria-label="YouTube">
                                <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                    <g transform="scale(1.6667)">
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M9.49614 7.13176C9.18664 6.9549 8.80639 6.95617 8.49807 7.13509C8.18976 7.31401 8 7.64353 8 8V16C8 16.3565 8.18976 16.686 8.49807 16.8649C8.80639 17.0438 9.18664 17.0451 9.49614 16.8682L16.4961 12.8682C16.8077 12.6902 17 12.3589 17 12C17 11.6411 16.8077 11.3098 16.4961 11.1318L9.49614 7.13176ZM13.9844 12L10 14.2768V9.72318L13.9844 12Z" fill="#737373"/>
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M0 12C0 8.25027 0 6.3754 0.954915 5.06107C1.26331 4.6366 1.6366 4.26331 2.06107 3.95491C3.3754 3 5.25027 3 9 3H15C18.7497 3 20.6246 3 21.9389 3.95491C22.3634 4.26331 22.7367 4.6366 23.0451 5.06107C24 6.3754 24 8.25027 24 12C24 15.7497 24 17.6246 23.0451 18.9389C22.7367 19.3634 22.3634 19.7367 21.9389 20.0451C20.6246 21 18.7497 21 15 21H9C5.25027 21 3.3754 21 2.06107 20.0451C1.6366 19.7367 1.26331 19.3634 0.954915 18.9389C0 17.6246 0 15.7497 0 12ZM9 5H15C16.9194 5 18.1983 5.00275 19.1673 5.10773C20.0989 5.20866 20.504 5.38448 20.7634 5.57295C21.018 5.75799 21.242 5.98196 21.4271 6.23664C21.6155 6.49605 21.7913 6.90113 21.8923 7.83269C21.9973 8.80167 22 10.0806 22 12C22 13.9194 21.9973 15.1983 21.8923 16.1673C21.7913 17.0989 21.6155 17.504 21.4271 17.7634C21.242 18.018 21.018 18.242 20.7634 18.4271C20.504 18.6155 20.0989 18.7913 19.1673 18.8923C18.1983 18.9973 16.9194 19 15 19H9C7.08058 19 5.80167 18.9973 4.83269 18.8923C3.90113 18.7913 3.49605 18.6155 3.23664 18.4271C2.98196 18.242 2.75799 18.018 2.57295 17.7634C2.38448 17.504 2.20866 17.0989 2.10773 16.1673C2.00275 15.1983 2 13.9194 2 12C2 10.0806 2.00275 8.80167 2.10773 7.83269C2.20866 6.90113 2.38448 6.49605 2.57295 6.23664C2.75799 5.98196 2.98196 5.75799 3.23664 5.57295C3.49605 5.38448 3.90113 5.20866 4.83269 5.10773C5.80167 5.00275 7.08058 5 9 5Z" fill="#737373"/>
                                    </g>
                                </svg>
                            </a>
                            <a class="pd-footer-icon" href="https://weibo.com/u/5455163732" target="_blank" aria-label="微博">
                                <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                    <g transform="scale(2)">
                                        <path d="M14.8116637,9.80140866 C14.0339912,9.65987768 14.4126385,9.26711618 14.4126385,9.26711618 C14.4126385,9.26711618 15.1734442,8.08881081 14.2616596,7.23259532 C13.1310733,6.1718952 10.3849638,7.36768075 10.3849638,7.36768075 C9.33593364,7.67356288 9.61438018,7.22779766 9.76300352,6.47114405 C9.76300352,5.57886267 9.4371344,4.06905983 6.64315781,4.96134121 C3.85215903,5.85766931 1.45487431,8.99892697 1.45487431,8.99892697 C-0.211604897,11.0866601 0.00975232499,12.7000716 0.00975232499,12.7000716 C0.426022125,16.2618754 4.45783025,17.2399306 7.59394275,17.4714908 C10.8927898,17.7140855 15.3461567,16.4039905 16.6957668,13.7114601 C18.046177,11.014883 15.5924252,9.94792503 14.8116193,9.80142952 L14.8116637,9.80140866 Z M13.7679448,12.3499675 C13.7679448,14.4010716 11.1149692,16.3269776 7.83830014,16.4674239 C4.56240882,16.6106445 1.91492222,15.0688225 1.91492222,13.0177184 C1.91492222,10.9633185 4.56238659,9.3165738 7.83830014,9.17466735 C11.1149915,9.03257317 13.7679448,10.3006991 13.7679448,12.3499675 Z M7.18436189,10.5272738 C3.89060376,10.8891425 4.27100662,13.7855944 4.27100662,13.7855944 C4.27100662,13.7855944 4.23709526,14.702907 5.15416883,15.1698654 C7.08142778,16.1495893 9.06595383,15.5567445 10.0690947,14.3410591 C11.0720578,13.1252069 10.4839867,10.168388 7.18436189,10.5272738 Z M7.465164,13.6015728 C7.465164,14.082507 6.96653802,14.526812 6.35300007,14.592686 C5.73886212,14.6604164 5.24281394,14.3270833 5.24281394,13.8445222 C5.24281394,13.3632125 5.68299503,12.8598337 6.29831077,12.7998212 C7.00498276,12.7363043 7.465164,13.1184276 7.465164,13.6015728 Z M8.46770488,12.4510521 C8.57850571,12.6260833 8.49908289,12.8890994 8.29537025,13.0402048 C8.08690201,13.1859703 7.83103342,13.1659035 7.72121037,12.9906846 C7.60609839,12.8195125 7.64945428,12.5450863 7.85965586,12.4015319 C8.1035688,12.230923 8.35750405,12.2804223 8.46770488,12.4510521 Z" fill="#737373"/>
                                    </g>
                                </svg>
                            </a>
                            <a class="pd-footer-icon" href="https://www.zhihu.com/people/di-shang-fei-zhu" target="_blank" aria-label="知乎">
                                <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                    <g transform="scale(1.6667)">
                                        <path d="M12.344 17.963l-1.688 1.074-2.131-3.35c-.44 1.402-1.172 2.665-2.139 3.825-.402.483-.82.918-1.301 1.375-.155.147-.775.717-.878.82l-1.414-1.414c.139-.139.787-.735.915-.856.43-.408.795-.79 1.142-1.206 1.266-1.518 2.03-3.21 2.137-5.231H3v-2h4V7h-.868c-.689 1.266-1.558 2.222-2.618 2.857L2.486 8.143c1.395-.838 2.425-2.604 3.038-5.36l1.952.434c-.14.633-.303 1.227-.489 1.783H11.5v2H9v4h2.5v2H9.185l3.159 4.963zm3.838-.07L17.298 17H19V7h-4v10h.736l.446.893zM13 5h8v14h-3l-2.5 2-1-2H13V5z" fill="#737373"/>
                                    </g>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                <div class="pd-footer-block-links">
                    <div class="pd-footer-container">
                        <div class="pd-link-columns">
                            <div class="pd-link-column pd-left">
                                <h4>联系作者</h4>
                                <ul>
                                    <li><a href="mailto:studid@163.com">studid@163.com</a></li>
                                    <li><a href="mailto:xshueho@gmail.com">xshueho@gmail.com</a></li>
                                </ul>
                            </div>
                            <div class="pd-link-column pd-center">
                                <span class="pd-donate-title">
                                    赞赏支持
                                    <span class="pd-donate-tip">
                                        <img src="${donateImgSrc}" alt="捐赠二维码">
                                    </span>
                                </span>
                            </div>
                            <div class="pd-link-column pd-right">
                                <h4>建议引用格式（二选一）</h4>
                                <ul>
                                    <li>使用了 <a href="https://www.biodatatools.cn" target="_blank">BioDataTools（https://www.biodatatools.cn）</a> 进行XXX分析；</li>
                                    <li>使用了 <a href="https://www.biodatatools.top" target="_blank">BioDataTools（https://www.biodatatools.top）</a> 进行XXX分析。</li>
                                </ul>
                            </div>
                        </div>
                        <div class="pd-footer-bottom">
                            <p>BioDataTools &copy; ${yearText} 地上飞猪</p>
                            <p>参考文献：薛浩, 大石鸡（<em>Alectoris magna</em>）基因组结构与比较基因组分析[D]. 烟台: 烟台大学, 2024.</p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>`;

        const ph = document.getElementById('common-footer');
        if (ph) ph.outerHTML = html;
        else document.body.insertAdjacentHTML('beforeend', html);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }
})();