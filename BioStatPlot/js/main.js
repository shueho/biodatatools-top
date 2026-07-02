function renderIcon(icon, size = 24) {
    if (!icon) return '';
    if (icon.length === 1) {
        return `<span class="icon-emoji">${icon}</span>`;
    }
    const imgUrl = `images/${icon}`;
    return `<img src="${imgUrl}" alt="icon" class="icon-img" style="width:${size}px;height:${size}px;object-fit:contain;">`;
}

const langConfig = {
    en: {
        navTitle: '📚 Plotting Tools',
        introDesc: 'Online Statistical Analysis &amp; Plotting Suite for Biology',
        searchPlaceholder: '🔍 Search by tool name or description...',
        author: 'Author: Di Shang Fei Zhu (Hao Xue)',
        bilibili: 'Bilibili Channel',
        github: 'GitHub',
        backHome: 'Back to BioDataTools',
        langBtn: '🌐 中文',
        langTarget: 'home-ch.html'
    },
    zh: {
        navTitle: '📚 绘图工具导航',
        introDesc: '生物学在线统计分析与绘图合集',
        searchPlaceholder: '🔍 输入工具名称或描述中的关键词...',
        author: '作者：地上飞猪',
        bilibili: '前往B站主页',
        github: 'GitHub项目',
        backHome: '返回BioDataTools',
        langBtn: '🌐 English',
        langTarget: 'home.html'
    }
};

function getCurrentLang() {
    const path = window.location.pathname;
    if (path.includes('home-ch.html')) return 'zh';
    return 'en';
}

function applyLanguage(lang) {
    const config = langConfig[lang];
    if (!config) return;

    const elements = {
        navTitle: document.getElementById('navTitle'),
        introDesc: document.getElementById('introDesc'),
        authorText: document.getElementById('authorText'),
        bilibiliText: document.getElementById('bilibiliText'),
        githubText: document.getElementById('githubText'),
        backHomeText: document.getElementById('backHomeText'),
        searchInput: document.getElementById('toolSearchInput'),
        langBtn: document.getElementById('langSwitchBtn')
    };

    if (elements.navTitle) elements.navTitle.textContent = config.navTitle;
    if (elements.introDesc) elements.introDesc.innerHTML = config.introDesc;
    if (elements.authorText) elements.authorText.textContent = config.author;
    if (elements.bilibiliText) elements.bilibiliText.textContent = config.bilibili;
    if (elements.githubText) elements.githubText.textContent = config.github;
    if (elements.backHomeText) elements.backHomeText.textContent = config.backHome;
    if (elements.searchInput) elements.searchInput.placeholder = config.searchPlaceholder;
    if (elements.langBtn) {
        elements.langBtn.textContent = config.langBtn;
        const newBtn = elements.langBtn.cloneNode(true);
        elements.langBtn.parentNode.replaceChild(newBtn, elements.langBtn);
        newBtn.addEventListener('click', function() {
            location.href = config.langTarget;
        });
    }
}

function renderSideNav() {
    const navList = document.getElementById('navList');
    if (!navList) return;
    navList.innerHTML = '';

    if (typeof toolCategories === 'undefined') {
        console.error('toolCategories is not defined. Please check config file.');
        return;
    }

    toolCategories.forEach((cat, catIdx) => {
        const catId = `cat-${catIdx}`;
        const li = document.createElement('li');
        li.innerHTML = `
            <a class="parent-item" onclick="toggleCategory('${catId}')">
                ${renderIcon(cat.icon, 20)} ${cat.name}
            </a>
            <ul class="sub-menu" id="${catId}"></ul>
        `;
        navList.appendChild(li);

        const subMenu = document.getElementById(catId);
        if (cat.subcategories) {
            cat.subcategories.forEach((sub, subIdx) => {
                const subId = `sub-${catIdx}-${subIdx}`;
                const subLi = document.createElement('li');
                subLi.innerHTML = `
                    <a class="sub-parent" onclick="toggleSubCategory('${subId}')">
                        ${renderIcon(sub.icon, 20)} ${sub.name}
                    </a>
                    <ul class="sub-sub-menu" id="${subId}"></ul>
                `;
                subMenu.appendChild(subLi);

                const subSubMenu = document.getElementById(subId);
                if (sub.tools) {
                    sub.tools.forEach(tool => {
                        const toolLi = document.createElement('li');
                        toolLi.innerHTML = `<a onclick="scrollToTool('${tool.name}')">${renderIcon(tool.icon, 18)} ${tool.name}</a>`;
                        subSubMenu.appendChild(toolLi);
                    });
                }
            });
        }
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

window.scrollToTool = function(toolName) {
    const targetId = `tool-${toolName.replace(/\s/g, '-')}`;
    const target = document.getElementById(targetId);
    if (target) {
        const headerHeight = document.querySelector('header').offsetHeight || 100;
        const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
};

function renderToolCards() {
    const container = document.getElementById('toolList');
    if (!container) return;
    container.innerHTML = '';

    if (typeof toolCategories === 'undefined') {
        console.error('toolCategories is not defined. Please check config file.');
        return;
    }

    toolCategories.forEach(cat => {
        const catDiv = document.createElement('div');
        catDiv.className = 'tool-category';
        catDiv.innerHTML = `<h2 class="category-title">${cat.icon || ''} ${cat.name}</h2>`;
        container.appendChild(catDiv);

        if (cat.subcategories) {
            cat.subcategories.forEach(sub => {
                const subDiv = document.createElement('div');
                subDiv.className = 'sub-category';
                subDiv.innerHTML = `<h3 class="sub-title">${sub.icon || ''} ${sub.name}</h3>`;
                catDiv.appendChild(subDiv);

                const grid = document.createElement('div');
                grid.className = 'sub-tool-grid';
                subDiv.appendChild(grid);

                if (sub.tools) {
                    sub.tools.forEach(tool => {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'tool-item-wrapper';

                        const card = document.createElement('a');
                        card.className = 'plot-card';
                        card.id = `tool-${tool.name.replace(/\s/g, '-')}`;

                        const icon = tool.icon || '';
                        let iconHtml = '';
                        if (icon.length > 1) {
                            const imgUrl = `images/${icon}`;
                            iconHtml = `<div class="icon" style="background-image: url('${imgUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat; width:100%; height:100%;"></div>`;
                        } else {
                            iconHtml = `<div class="icon" style="display:flex; align-items:center; justify-content:center; font-size:4rem; width:100%; height:100%;">${icon}</div>`;
                        }
                        card.innerHTML = iconHtml;

                        const nameSpan = document.createElement('div');
                        nameSpan.className = 'tool-name';
                        nameSpan.textContent = tool.name;

                        const handleClick = (e) => {
                            if (tool.link && tool.link !== '#') {
                                window.open(tool.link, '_blank');
                            } else {
                                e.preventDefault();
                                alert('该功能正在开发中，敬请期待！');
                            }
                        };
                        card.addEventListener('click', handleClick);
                        nameSpan.addEventListener('click', handleClick);
                        card.style.cursor = 'pointer';
                        nameSpan.style.cursor = 'pointer';

                        wrapper.appendChild(card);
                        wrapper.appendChild(nameSpan);
                        grid.appendChild(wrapper);
                    });
                }
            });
        }
    });
}

function filterTools(keyword) {
    const kw = keyword.trim().toLowerCase();
    const wrappers = document.querySelectorAll('.tool-item-wrapper');
    const categories = document.querySelectorAll('.tool-category');
    const subCategories = document.querySelectorAll('.sub-category');

    wrappers.forEach(wrapper => {
        const nameEl = wrapper.querySelector('.tool-name');
        const name = nameEl?.innerText.toLowerCase() || '';
        const match = kw === '' || name.includes(kw);
        wrapper.style.display = match ? '' : 'none';
    });

    subCategories.forEach(sub => {
        const visibleWrappers = Array.from(sub.querySelectorAll('.tool-item-wrapper')).some(w => w.style.display !== 'none');
        sub.style.display = visibleWrappers ? '' : 'none';
    });
    categories.forEach(cat => {
        const visibleSubs = Array.from(cat.querySelectorAll('.sub-category')).some(sub => sub.style.display !== 'none');
        cat.style.display = visibleSubs ? '' : 'none';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // 应用语言
    const lang = getCurrentLang();
    applyLanguage(lang);

    // 渲染
    renderSideNav();
    renderToolCards();

    // 搜索事件
    const searchInput = document.getElementById('toolSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            filterTools(e.target.value);
        });
    }

    const toggleSideBtn = document.getElementById('toggleSideBtn');
    const sideNav = document.querySelector('.side-nav');
    const mainWrap = document.querySelector('.main');

    if (toggleSideBtn && sideNav && mainWrap) {
        toggleSideBtn.addEventListener('click', function() {
            sideNav.classList.toggle('hidden');
            mainWrap.classList.toggle('full-width');
        });
    }

    (function() {
        const sideNav = document.getElementById('sideNav');
        const footer = document.querySelector('footer');
        
        function updateNavPosition() {
            if (!sideNav || !footer) return;
            
            const footerRect = footer.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const navHeight = sideNav.offsetHeight;
            
            let bottomOffset = 20;
            
            if (footerRect.top < windowHeight) {
                if (footerRect.bottom <= windowHeight) {
                    bottomOffset = windowHeight - footerRect.top + 20;
                } else {
                    bottomOffset = windowHeight - footerRect.top + 20;
                }
            }
            
            const maxBottom = windowHeight - 150; 
            bottomOffset = Math.min(bottomOffset, maxBottom);
            bottomOffset = Math.max(bottomOffset, 20);
            
            sideNav.style.bottom = bottomOffset + 'px';
        }
        
        window.addEventListener('scroll', updateNavPosition);
        window.addEventListener('resize', updateNavPosition);
        setTimeout(updateNavPosition, 200);
    })();
});