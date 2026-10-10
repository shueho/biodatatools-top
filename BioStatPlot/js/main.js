
'use strict';

/* ---------- 常量 ---------- */
const ICON_ROTATE_INTERVAL = 5000;
const ICON_PROBE_MAX       = 30;
const ICON_SLIDE_DURATION  = 600;

/* ---------- 当前语言 & 工具页目录 ---------- */
const LANG     = window.location.pathname.includes('home-ch.html') ? 'zh' : 'en';
const TOOL_DIR = LANG === 'zh' ? 'ch' : 'en';

/* ============================================================
   图标滑动动画样式
============================================================ */
function injectRotatorStyles() {
    if (document.getElementById('icon-rotator-style')) return;
    const style = document.createElement('style');
    style.id = 'icon-rotator-style';
    style.textContent = `
        .icon-rotator {
            position: relative;
            overflow: hidden;
            vertical-align: middle;
            flex-shrink: 0;
        }
        .icon-rotator .icon-slide {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            object-fit: contain;
            transition: transform ${ICON_SLIDE_DURATION}ms cubic-bezier(.4,0,.2,1);
            will-change: transform;
            backface-visibility: hidden;
        }
        .icon-rotator .icon-slide-in   { transform: translateX(0); }
        .icon-rotator .icon-slide-out  { transform: translateX(-100%); }
        .icon-rotator .icon-slide-wait { transform: translateX(100%); }
        .icon-rotator .icon-slide-reset { transition: none !important; }
    `;
    document.head.appendChild(style);
}

/* ============================================================
   图标探测（按 id 前缀）
   优先 images/001-1.svg, 001-2.svg ...
   兜底 images/001.svg / png / jpg ...
============================================================ */
const iconFileCache = new Map();

function probeImage(url) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload  = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

async function resolveIconFiles(id) {
    if (!id || typeof id !== 'string') return [];

    const files = [];
    for (let i = 1; i <= ICON_PROBE_MAX; i++) {
        const name = `${id}-${i}.svg`;
        if (await probeImage(`images/${name}`)) files.push(name);
        else break;
    }

    if (!files.length) {
        for (const ext of ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp']) {
            const name = `${id}.${ext}`;
            if (await probeImage(`images/${name}`)) { files.push(name); break; }
        }
    }
    return files;
}

async function preloadAllIcons() {
    if (typeof toolCategories === 'undefined') return;
    const ids = new Set();
    toolCategories.forEach(cat => {
        (cat.subcategories || []).forEach(sub => {
            (sub.tools || []).forEach(t => { if (t.id) ids.add(t.id); });
        });
    });
    await Promise.all(Array.from(ids).map(async id => {
        iconFileCache.set(id, await resolveIconFiles(id));
    }));
}

/* ============================================================
   图标渲染
============================================================ */
function buildSlidesHtml(files) {
    return files.map((f, i) => {
        const state = (i === 0) ? 'icon-slide-in' : 'icon-slide-wait';
        return `<img src="images/${f}" alt="" class="icon-slide ${state}">`;
    }).join('');
}

// 侧边栏小图标
function renderIcon(id, size = 24) {
    if (!id) return '';
    const files = iconFileCache.get(id) || [];
    if (!files.length) return '';

    if (files.length === 1) {
        return `<img src="images/${files[0]}" alt="icon" class="icon-img"
                     style="width:${size}px;height:${size}px;object-fit:contain;">`;
    }

    return `<span class="icon-rotator"
                  data-icon-key="${id}" data-current="0"
                  style="display:inline-block;width:${size}px;height:${size}px;">
                ${buildSlidesHtml(files)}
            </span>`;
}

// 工具卡片大图标
function buildCardIconHtml(id) {
    const files = iconFileCache.get(id) || [];
    if (!files.length) {
        return `<div class="icon" style="width:100%;height:100%;"></div>`;
    }
    if (files.length === 1) {
        return `<img class="icon" src="images/${files[0]}" alt="icon"
                     style="width:100%;height:100%;object-fit:contain;">`;
    }
    return `<span class="icon-rotator"
                  data-icon-key="${id}" data-current="0"
                  style="display:block;width:100%;height:100%;">
                ${buildSlidesHtml(files)}
            </span>`;
}

/* ============================================================
   翻页轮换
============================================================ */
function slideNext(el) {
    const files = iconFileCache.get(el.dataset.iconKey) || [];
    if (files.length < 2) return;

    const imgs    = el.querySelectorAll('.icon-slide');
    const current = parseInt(el.dataset.current, 10) || 0;
    const next    = (current + 1) % files.length;
    const curImg  = imgs[current];
    const nxtImg  = imgs[next];
    if (!curImg || !nxtImg) return;

    nxtImg.classList.remove('icon-slide-wait');
    nxtImg.classList.add('icon-slide-in');

    curImg.classList.remove('icon-slide-in');
    curImg.classList.add('icon-slide-out');

    setTimeout(() => {
        if (!curImg.classList.contains('icon-slide-out')) return;
        curImg.classList.add('icon-slide-reset');
        curImg.classList.remove('icon-slide-out');
        curImg.classList.add('icon-slide-wait');
        void curImg.offsetWidth;
        curImg.classList.remove('icon-slide-reset');
    }, ICON_SLIDE_DURATION + 20);

    el.dataset.current = next;
}

function startIconRotators() {
    const rotators = document.querySelectorAll('.icon-rotator');
    if (!rotators.length) return;

    const seen = new Set();
    rotators.forEach(el => {
        const files = iconFileCache.get(el.dataset.iconKey) || [];
        files.forEach(f => {
            if (seen.has(f)) return;
            seen.add(f);
            const img = new Image();
            img.src = `images/${f}`;
        });
    });

    setInterval(() => {
        document.querySelectorAll('.icon-rotator').forEach(el => slideNext(el));
    }, ICON_ROTATE_INTERVAL);
}

/* ============================================================
   顶部/侧栏语言化文案
============================================================ */
const langConfig = {
    en: {
        navTitle: '📚 Tools',
        introDesc: 'Online Statistical Analysis &amp; Plotting Suite for Biology',
        searchPlaceholder: '🔍 Search by tool name or description...',
        author: 'Author: Di Shang Fei Zhu (Hao Xue)',
        bilibili: 'Bilibili Channel',
        github: 'GitHub',
        backHome: 'Back to BioDataTools',
        langBtn: '🌐 中文',
        langTarget: 'home-ch.html',
        comingSoon: 'This tool is under development. Stay tuned!'
    },
    zh: {
        navTitle: '📚 工具',
        introDesc: '生物学在线统计分析与绘图合集',
        searchPlaceholder: '🔍 输入工具名称或描述中的关键词...',
        author: '作者：地上飞猪',
        bilibili: '前往B站主页',
        github: 'GitHub项目',
        backHome: '返回BioDataTools',
        langBtn: '🌐 English',
        langTarget: 'home.html',
        comingSoon: '该功能正在开发中，敬请期待！'
    }
};

function applyLanguage(lang) {
    const config = langConfig[lang];
    if (!config) return;

    const $ = id => document.getElementById(id);
    if ($('navTitle'))        $('navTitle').textContent = config.navTitle;
    if ($('introDesc'))       $('introDesc').innerHTML  = config.introDesc;
    if ($('authorText'))      $('authorText').textContent = config.author;
    if ($('bilibiliText'))    $('bilibiliText').textContent = config.bilibili;
    if ($('githubText'))      $('githubText').textContent = config.github;
    if ($('backHomeText'))    $('backHomeText').textContent = config.backHome;
    if ($('toolSearchInput')) $('toolSearchInput').placeholder = config.searchPlaceholder;

    const langBtn = $('langSwitchBtn');
    if (langBtn) {
        langBtn.textContent = config.langBtn;
        const newBtn = langBtn.cloneNode(true);
        langBtn.parentNode.replaceChild(newBtn, langBtn);
        newBtn.addEventListener('click', () => { location.href = config.langTarget; });
    }
}



function getToolUrl(tool) {
    const name = tool.file || tool.id;
    return `${TOOL_DIR}/${name}.html`;
}

/* ============================================================
   侧边导航
============================================================ */
function renderSideNav() {
    const navList = document.getElementById('navList');
    if (!navList) return;
    navList.innerHTML = '';

    if (typeof toolCategories === 'undefined') {
        console.error('toolCategories is not defined. Please check config.js');
        return;
    }

    toolCategories.forEach((cat, catIdx) => {
        const catId = `cat-${catIdx}`;
        const li = document.createElement('li');
        li.innerHTML = `
            <a class="parent-item" onclick="toggleCategory('${catId}')">${cat[LANG] || ''}</a>
            <ul class="sub-menu" id="${catId}"></ul>
        `;
        navList.appendChild(li);

        const subMenu = document.getElementById(catId);
        (cat.subcategories || []).forEach((sub, subIdx) => {
            const subId = `sub-${catIdx}-${subIdx}`;
            const subLi = document.createElement('li');
            subLi.innerHTML = `
                <a class="sub-parent" onclick="toggleSubCategory('${subId}')">${sub[LANG] || ''}</a>
                <ul class="sub-sub-menu" id="${subId}"></ul>
            `;
            subMenu.appendChild(subLi);

            const subSubMenu = document.getElementById(subId);
            (sub.tools || []).forEach(tool => {
                const toolLi = document.createElement('li');
                toolLi.innerHTML = `<a onclick="scrollToTool('${tool.id}')">${renderIcon(tool.id, 18)} ${tool[LANG] || ''}</a>`;
                subSubMenu.appendChild(toolLi);
            });
        });
    });
}

window.toggleCategory = function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('open');
};

window.toggleSubCategory = function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('open');
};

window.scrollToTool = function(toolId) {
    const target = document.getElementById(`tool-${toolId}`);
    if (!target) return;
    const headerHeight = document.querySelector('header')?.offsetHeight || 100;
    const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
};

/* ============================================================
   工具卡片
============================================================ */
function renderToolCards() {
    const container = document.getElementById('toolList');
    if (!container) return;
    container.innerHTML = '';

    if (typeof toolCategories === 'undefined') {
        console.error('toolCategories is not defined. Please check config.js');
        return;
    }

    toolCategories.forEach(cat => {
        const catDiv = document.createElement('div');
        catDiv.className = 'tool-category';
        catDiv.innerHTML = `<h2 class="category-title">${cat[LANG] || ''}</h2>`;
        container.appendChild(catDiv);

        (cat.subcategories || []).forEach(sub => {
            const subDiv = document.createElement('div');
            subDiv.className = 'sub-category';
            subDiv.innerHTML = `<h3 class="sub-title">${sub[LANG] || ''}</h3>`;
            catDiv.appendChild(subDiv);

            const grid = document.createElement('div');
            grid.className = 'sub-tool-grid';
            subDiv.appendChild(grid);

            (sub.tools || []).forEach(tool => {
                const wrapper = document.createElement('div');
                wrapper.className = 'tool-item-wrapper';

                const card = document.createElement('a');
                card.className = 'plot-card';
                card.id = `tool-${tool.id}`;
                card.innerHTML = buildCardIconHtml(tool.id);

                const nameSpan = document.createElement('div');
                nameSpan.className = 'tool-name';
                nameSpan.textContent = tool[LANG] || '';

                const handleClick = () => {
                    if (!tool.id) {
                        alert(langConfig[LANG].comingSoon);
                        return;
                    }
                    window.open(getToolUrl(tool), '_blank');
                };
                card.addEventListener('click', handleClick);
                nameSpan.addEventListener('click', handleClick);
                card.style.cursor = 'pointer';
                nameSpan.style.cursor = 'pointer';

                wrapper.appendChild(card);
                wrapper.appendChild(nameSpan);
                grid.appendChild(wrapper);
            });
        });
    });
}

/* ============================================================
   搜索过滤
============================================================ */
function filterTools(keyword) {
    const kw = keyword.trim().toLowerCase();
    const wrappers     = document.querySelectorAll('.tool-item-wrapper');
    const subCategories = document.querySelectorAll('.sub-category');
    const categories    = document.querySelectorAll('.tool-category');

    wrappers.forEach(wrapper => {
        const name = wrapper.querySelector('.tool-name')?.innerText.toLowerCase() || '';
        wrapper.style.display = (kw === '' || name.includes(kw)) ? '' : 'none';
    });

    subCategories.forEach(sub => {
        const anyVisible = Array.from(sub.querySelectorAll('.tool-item-wrapper'))
            .some(w => w.style.display !== 'none');
        sub.style.display = anyVisible ? '' : 'none';
    });

    categories.forEach(cat => {
        const anyVisible = Array.from(cat.querySelectorAll('.sub-category'))
            .some(sub => sub.style.display !== 'none');
        cat.style.display = anyVisible ? '' : 'none';
    });
}

/* ============================================================
   初始化
============================================================ */
document.addEventListener('DOMContentLoaded', async function() {

    injectRotatorStyles();
    applyLanguage(LANG);

    await preloadAllIcons();

    renderSideNav();
    renderToolCards();
    startIconRotators();

    const searchInput = document.getElementById('toolSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', e => filterTools(e.target.value));
    }

    // 侧栏折叠
    const toggleSideBtn = document.getElementById('toggleSideBtn');
    const sideNav  = document.querySelector('.side-nav');
    const mainWrap = document.querySelector('.main');
    if (toggleSideBtn && sideNav && mainWrap) {
        toggleSideBtn.addEventListener('click', () => {
            sideNav.classList.toggle('hidden');
            mainWrap.classList.toggle('full-width');
        });
    }

    // 侧栏底部跟随页脚
    (function() {
        const sideNav2 = document.getElementById('sideNav');
        const footer   = document.querySelector('footer');
        if (!sideNav2 || !footer) return;

        function updateNavPosition() {
            const footerRect   = footer.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            let bottomOffset = 20;
            if (footerRect.top < windowHeight) {
                bottomOffset = windowHeight - footerRect.top + 20;
            }
            bottomOffset = Math.min(bottomOffset, windowHeight - 150);
            bottomOffset = Math.max(bottomOffset, 20);

            sideNav2.style.bottom = bottomOffset + 'px';
        }

        window.addEventListener('scroll', updateNavPosition);
        window.addEventListener('resize', updateNavPosition);
        setTimeout(updateNavPosition, 200);
    })();
});