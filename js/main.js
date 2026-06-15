// 渲染左侧导航栏
function renderSideNav() {
    const navList = document.getElementById('navList');
    navList.innerHTML = '';

    const blogItem = document.createElement('li');
    blogItem.innerHTML = `<a href="blog/home.html" class="parent-item blog-home-item">📝 博客首页</a>`;
    navList.appendChild(blogItem);

    const plotItem = document.createElement('li');
    plotItem.innerHTML = `<a href="plot/home.html" target="_blank" class="parent-item blog-home-item">🎨 在线科研绘图</a>`;
    navList.appendChild(plotItem);

    toolConfig.forEach((category, catIndex) => {
        const categoryItem = document.createElement('li');
        const subMenuId = `submenu-${catIndex}`;
        categoryItem.innerHTML = `
            <a class="parent-item" onclick="toggleSubMenu(${catIndex})">
                ${category.categoryIcon} ${category.categoryName}
            </a>
            <ul class="sub-menu" id="${subMenuId}"></ul>
        `;
        navList.appendChild(categoryItem);

        const subMenu = document.getElementById(subMenuId);
        category.tools.forEach((tool, toolIndex) => {
            const toolId = `tool-${catIndex}-${toolIndex}`;
            const toolItem = document.createElement('li');
            let iconText = tool.toolIcon.includes('images/') ? '' : tool.toolIcon;
            toolItem.innerHTML = `<a onclick="scrollToTool('${toolId}')">${iconText} ${tool.toolName}</a>`;
            subMenu.appendChild(toolItem);
        });
    });
}

function toggleSubMenu(catIndex) {
    const subMenu = document.getElementById(`submenu-${catIndex}`);
    subMenu.classList.toggle('open');
}

function scrollToTool(toolId) {
    const targetEl = document.getElementById(toolId);
    if (targetEl) {
        const headerHeight = document.querySelector('header').offsetHeight || 100;
        const offsetTop = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
}

// 渲染主内容（卡片结构改为左图右文，并记录所有卡片元素以用于搜索）
let allCardElements = []; // 存储 { card, categoryWrap, toolName, toolDesc }

function renderToolList() {
    const toolList = document.getElementById('toolList');
    toolList.innerHTML = '';
    allCardElements = [];

    toolConfig.forEach((category, catIndex) => {
        const catWrap = document.createElement('div');
        catWrap.className = 'tool-category';
        catWrap.setAttribute('data-category-index', catIndex);
        catWrap.innerHTML = `
            <div class="category-title">
                <span class="category-icon">${category.categoryIcon}</span>
                <h3>${category.categoryName}</h3>
            </div>
            <div class="sub-tool-grid" id="grid-${catIndex}"></div>
        `;
        toolList.appendChild(catWrap);

        const grid = document.getElementById(`grid-${catIndex}`);
        category.tools.forEach((tool, toolIndex) => {
            const toolId = `tool-${catIndex}-${toolIndex}`;
            const card = document.createElement('div');
            card.className = 'sub-tool-card';
            card.id = toolId;

            // 图标部分：图片或emoji
            let iconHtml = '';
            if (tool.toolIcon && tool.toolIcon.startsWith('images/')) {
                iconHtml = `<img src="${tool.toolIcon}" alt="${tool.toolName}">`;
            } else {
                iconHtml = tool.toolIcon || '🔧';
            }

            card.innerHTML = `
                <div class="icon">${iconHtml}</div>
                <div class="card-info">
                    <h4>${tool.toolName}</h4>
                    <p>${tool.toolDesc}</p>
                </div>
            `;
            card.onclick = () => window.open(tool.link, '_blank');

            grid.appendChild(card);
            // 存储卡片信息用于搜索
            allCardElements.push({
                card: card,
                categoryWrap: catWrap,
                toolName: (tool.toolName || '').toLowerCase(),
                toolDesc: (tool.toolDesc || '').toLowerCase()
            });
        });
    });
}

// 搜索筛选函数
function filterToolsByKeyword(keyword) {
    const kw = keyword.trim().toLowerCase();
    // 记录哪些分类下还有可见卡片
    const categoryHasVisible = new Map(); // key: categoryWrap, value: boolean

    allCardElements.forEach(item => {
        const match = kw === '' || item.toolName.includes(kw) || item.toolDesc.includes(kw);
        if (match) {
            item.card.style.display = 'flex';
            categoryHasVisible.set(item.categoryWrap, true);
        } else {
            item.card.style.display = 'none';
        }
    });

    // 处理整个分类的显隐
    const allCategories = document.querySelectorAll('.tool-category');
    allCategories.forEach(cat => {
        if (categoryHasVisible.get(cat)) {
            cat.style.display = 'block';
        } else {
            cat.style.display = 'none';
        }
    });
}

// 页面加载完成后绑定搜索事件
window.addEventListener('DOMContentLoaded', function () {
    renderSideNav();
    renderToolList();

    const searchInput = document.getElementById('toolSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterToolsByKeyword(e.target.value);
        });
    }
});