// ========== 图标渲染工具 ==========
function renderIcon(icon, size = 24) {
    if (!icon) return ''; // 无图标时返回空
    // 判断是否为单个字符（Unicode/Emoji）
    if (icon.length === 1) {
        return `<span class="icon-emoji">${icon}</span>`;
    }
    // 否则视为图片文件名，拼接相对路径 images/
    const imgUrl = `images/${icon}`;
    return `<img src="${imgUrl}" alt="icon" class="icon-img" style="width:${size}px;height:${size}px;object-fit:contain;">`;
}

// ========== 渲染侧边栏 ==========
function renderSideNav() {
    const navList = document.getElementById('navList');
    if (!navList) return;
    navList.innerHTML = '';

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
            sub.tools.forEach(tool => {
                const toolLi = document.createElement('li');
                toolLi.innerHTML = `<a onclick="scrollToTool('${tool.name}')">${renderIcon(tool.icon, 18)} ${tool.name}</a>`;
                subSubMenu.appendChild(toolLi);
            });
        });
    });
}

// 折叠/展开一级分类
window.toggleCategory = function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('open');
};

// 折叠/展开二级分类
window.toggleSubCategory = function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('open');
};

// 滚动到指定工具卡片
window.scrollToTool = function(toolName) {
    const targetId = `tool-${toolName.replace(/\s/g, '-')}`;
    const target = document.getElementById(targetId);
    if (target) {
        const headerHeight = document.querySelector('header').offsetHeight || 100;
        const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
};

// ========== 渲染主页卡片 ==========
function renderToolCards() {
    const container = document.getElementById('toolList');
    if (!container) return;
    container.innerHTML = '';

    toolCategories.forEach(cat => {
        const catDiv = document.createElement('div');
        catDiv.className = 'tool-category';
        catDiv.innerHTML = `<h2 class="category-title">${cat.icon || ''} ${cat.name}</h2>`;
        container.appendChild(catDiv);

        cat.subcategories.forEach(sub => {
            const subDiv = document.createElement('div');
            subDiv.className = 'sub-category';
            subDiv.innerHTML = `<h3 class="sub-title">${sub.icon || ''} ${sub.name}</h3>`;
            catDiv.appendChild(subDiv);

            const grid = document.createElement('div');
            grid.className = 'sub-tool-grid';
            subDiv.appendChild(grid);

            sub.tools.forEach(tool => {
                const wrapper = document.createElement('div');
                wrapper.className = 'tool-item-wrapper';

                // 卡片容器
                const card = document.createElement('a');
                card.className = 'plot-card';
                card.id = `tool-${tool.name.replace(/\s/g, '-')}`;

                // --- 根据 icon 类型生成不同内容 ---
                const icon = tool.icon || '';
                let iconHtml = '';

                // 判断是否为图片：长度 > 1 且非纯文本 Emoji
                if (icon.length > 1) {
                    // 外部图片：使用背景图，路径改为 images/ 目录
                    const imgUrl = `images/${icon}`;
                    iconHtml = `<div class="icon" style="background-image: url('${imgUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat; width:100%; height:100%;"></div>`;
                } else {
                    // 单个字符（Emoji 或 Unicode）：直接显示文本
                    iconHtml = `<div class="icon" style="display:flex; align-items:center; justify-content:center; font-size:4rem; width:100%; height:100%;">${icon}</div>`;
                }

                card.innerHTML = iconHtml;

                // 名称（在卡片外部下方）
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
        });
    });
}

// ========== 搜索筛选 ==========
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

// ========== 页面加载 ==========
document.addEventListener('DOMContentLoaded', () => {
    renderSideNav();
    renderToolCards();

    const searchInput = document.getElementById('toolSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => filterTools(e.target.value));
    }
});