'use strict';

/* ---------- 常量 ---------- */
const ICON_ROTATE_INTERVAL = 5000;
const ICON_PROBE_MAX       = 30;
const ICON_SLIDE_DURATION  = 600;

/* ---------- CDN & 本地路径 ---------- */
const CDN_BASE   = 'https://cdn.jsdelivr.net/gh/shueho/biodatatools-top@main/BioStatPlot/images/';
const LOCAL_BASE = 'images/';

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
   图标探测
============================================================ */
const iconFileCache       = new Map();
const iconLoadingPromises = new Map();

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
        if (await probeImage(LOCAL_BASE + name)) files.push(name);
        else break;
    }

    if (!files.length) {
        for (const ext of ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp']) {
            const name = `${id}.${ext}`;
            if (await probeImage(LOCAL_BASE + name)) { files.push(name); break; }
        }
    }
    return files;
}

async function preloadAllIcons() {
    if (typeof toolCategories === 'undefined') return;
    const ids = new Set();
    toolCategories.forEach(cat => {
        (cat.tools || []).forEach(t => { if (t.id) ids.add(t.id); });
        (cat.subcategories || []).forEach(sub => {
            (sub.tools || []).forEach(t => { if (t.id) ids.add(t.id); });
        });
    });
    await Promise.all(Array.from(ids).map(async id => {
        if (iconFileCache.has(id)) return;
        if (!iconLoadingPromises.has(id)) {
            iconLoadingPromises.set(id, resolveIconFiles(id));
        }
        const files = await iconLoadingPromises.get(id);
        iconFileCache.set(id, files);
    }));
}

/* ============================================================
   图标渲染
============================================================ */
function iconImgTag(filename, cls = '', style = '') {
    const cdn   = CDN_BASE + filename;
    const local = LOCAL_BASE + filename;
    return `<img src="${cdn}" class="${cls}" style="${style}"
                 onerror="this.onerror=null;this.src='${local}';">`;
}

function buildSlidesHtml(files) {
    return files.map((f, i) => {
        const state = (i === 0) ? 'icon-slide-in' : 'icon-slide-wait';
        return iconImgTag(f, `icon-slide ${state}`);
    }).join('');
}

function renderIcon(id, size = 24) {
    if (!id) return '';
    return `<span class="icon-slot" data-icon-id="${id}" data-icon-size="${size}"
                  data-icon-kind="nav"
                  style="display:inline-block;width:${size}px;height:${size}px;vertical-align:middle;"></span>`;
}

function buildCardIconHtml(id) {
    if (!id) {
        return `<div class="icon" style="width:100%;height:100%;"></div>`;
    }
    return `<span class="icon-slot" data-icon-id="${id}" data-icon-kind="card"
                  style="display:block;width:100%;height:100%;"></span>`;
}

function fillIconSlots() {
    document.querySelectorAll('.icon-slot').forEach(slot => {
        const id   = slot.dataset.iconId;
        const kind = slot.dataset.iconKind;
        const size = slot.dataset.iconSize;
        const files = iconFileCache.get(id) || [];

        let html = '';

        if (!files.length) {
            html = (kind === 'card')
                ? `<div class="icon" style="width:100%;height:100%;"></div>`
                : '';
        } else if (files.length === 1) {
            if (kind === 'card') {
                html = iconImgTag(files[0], 'icon',
                                  'width:100%;height:100%;object-fit:contain;');
            } else {
                html = iconImgTag(files[0], 'icon-img',
                                  `width:${size}px;height:${size}px;object-fit:contain;`);
            }
        } else {
            html = `<span class="icon-rotator"
                          data-icon-key="${id}" data-current="0"
                          style="display:block;width:100%;height:100%;">
                        ${buildSlidesHtml(files)}
                    </span>`;
        }
        slot.outerHTML = html;
    });
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

let iconRotatorTimer = null;
function startIconRotators() {
    const rotators = document.querySelectorAll('.icon-rotator');
    if (!rotators.length) return;

    if (iconRotatorTimer) clearInterval(iconRotatorTimer);
    iconRotatorTimer = setInterval(() => {
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
            <a class="parent-item" onclick="toggleCategory('${catId}'); scrollToCategory(${catIdx});">${cat[LANG] || ''}</a>
            <ul class="sub-menu open" id="${catId}"></ul>
        `;
        navList.appendChild(li);

        const subMenu = document.getElementById(catId);

        /* 情况一：类别直接包含 tools（无子类别） */
        if (cat.tools && cat.tools.length) {
            cat.tools.forEach(tool => {
                const toolLi = document.createElement('li');
                toolLi.innerHTML = `<a onclick="scrollToTool('${tool.id}')">${tool[LANG] || ''}</a>`;
                subMenu.appendChild(toolLi);
            });
            return;
        }

        /* 情况二：类别包含子类别 */
        (cat.subcategories || []).forEach((sub, subIdx) => {
            const subId = `sub-${catIdx}-${subIdx}`;
            const subLi = document.createElement('li');
            subLi.innerHTML = `
                <a class="sub-parent" onclick="toggleSubCategory('${subId}'); scrollToSubCategory(${catIdx}, ${subIdx});">${sub[LANG] || ''}</a>
                <ul class="sub-sub-menu" id="${subId}"></ul>
            `;
            subMenu.appendChild(subLi);

            const subSubMenu = document.getElementById(subId);
            (sub.tools || []).forEach(tool => {
                const toolLi = document.createElement('li');
                toolLi.innerHTML = `<a onclick="scrollToTool('${tool.id}')">${tool[LANG] || ''}</a>`;
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

/* 滚动到工具卡片 */
window.scrollToTool = function(toolId) {
    const target = document.getElementById(`tool-${toolId}`);
    if (!target) return;
    const headerHeight = document.querySelector('header')?.offsetHeight || 100;
    const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
};

/* 滚动到类别区块 */
window.scrollToCategory = function(catIdx) {
    const target = document.getElementById(`cat-sec-${catIdx}`);
    if (!target) return;
    const headerHeight = document.querySelector('header')?.offsetHeight || 100;
    const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
};

/* 滚动到子类别区块 */
window.scrollToSubCategory = function(catIdx, subIdx) {
    const target = document.getElementById(`sub-sec-${catIdx}-${subIdx}`);
    if (!target) return;
    const headerHeight = document.querySelector('header')?.offsetHeight || 100;
    const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
};

/* ============================================================
   工具卡片
============================================================ */
function makeToolCard(tool) {
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
        if (!tool.id || tool.id === 'xxx') {
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
    return wrapper;
}

function renderToolCards() {
    const container = document.getElementById('toolList');
    if (!container) return;
    container.innerHTML = '';

    if (typeof toolCategories === 'undefined') {
        console.error('toolCategories is not defined. Please check config.js');
        return;
    }

    toolCategories.forEach((cat, catIdx) => {
        const catDiv = document.createElement('div');
        catDiv.className = 'tool-category';
        catDiv.id = `cat-sec-${catIdx}`;
        catDiv.innerHTML = `<h2 class="category-title">${cat[LANG] || ''}</h2>`;
        container.appendChild(catDiv);

        /* 情况一：类别直接包含 tools */
        if (cat.tools && cat.tools.length) {
            const grid = document.createElement('div');
            grid.className = 'sub-tool-grid';
            grid.style.marginTop = '10px';
            catDiv.appendChild(grid);
            cat.tools.forEach(tool => grid.appendChild(makeToolCard(tool)));
            return;
        }

        /* 情况二：类别包含子类别 */
        (cat.subcategories || []).forEach((sub, subIdx) => {
            const subDiv = document.createElement('div');
            subDiv.className = 'sub-category';
            subDiv.id = `sub-sec-${catIdx}-${subIdx}`;
            subDiv.innerHTML = `<h3 class="sub-title">${sub[LANG] || ''}</h3>`;
            catDiv.appendChild(subDiv);

            const grid = document.createElement('div');
            grid.className = 'sub-tool-grid';
            subDiv.appendChild(grid);

            (sub.tools || []).forEach(tool => grid.appendChild(makeToolCard(tool)));
        });
    });
}

/* ============================================================
   搜索过滤
============================================================ */
function filterTools(keyword) {
    const kw = keyword.trim().toLowerCase();
    const wrappers      = document.querySelectorAll('.tool-item-wrapper');
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
        const anyVisibleSub = Array.from(cat.querySelectorAll('.sub-category'))
            .some(sub => sub.style.display !== 'none');
        const anyVisibleTool = Array.from(cat.querySelectorAll('.tool-item-wrapper'))
            .some(w => w.style.display !== 'none');
        cat.style.display = (anyVisibleSub || anyVisibleTool) ? '' : 'none';
    });
}

/* ============================================================
   初始化
============================================================ */
document.addEventListener('DOMContentLoaded', function() {

    injectRotatorStyles();
    applyLanguage(LANG);

    renderSideNav();
    renderToolCards();

    const searchInput = document.getElementById('toolSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', e => filterTools(e.target.value));
    }

    const toggleSideBtn = document.getElementById('toggleSideBtn');
    const sideNav  = document.querySelector('.side-nav');
    const mainWrap = document.querySelector('.main');
    if (toggleSideBtn && sideNav && mainWrap) {
        toggleSideBtn.addEventListener('click', () => {
            sideNav.classList.toggle('hidden');
            mainWrap.classList.toggle('full-width');
        });
    }

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

    preloadAllIcons().then(() => {
        fillIconSlots();
        startIconRotators();
    });
});