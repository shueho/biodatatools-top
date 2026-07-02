function renderSideNav() {
    const navList = document.getElementById('navList');
    navList.innerHTML = '';

    const blogItem = document.createElement('li');
    blogItem.innerHTML = `<a href="blog/home.html" class="parent-item blog-home-item">📝 Blog</a>`;
    navList.appendChild(blogItem);

    const plotItem = document.createElement('li');
    plotItem.innerHTML = `<a href="BioStatPlot/home.html" target="_blank" class="parent-item blog-home-item">🎨 BioStatPlot</a>`;
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
            //let iconText = tool.toolIcon.includes('images/') ? '' : tool.toolIcon;
            let iconText = (tool.toolIcon && typeof tool.toolIcon === 'string' && !tool.toolIcon.includes('images/')) ? tool.toolIcon : '';
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

let allCardElements = [];

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
            card.title = `${tool.toolName}\n${tool.toolDesc}`;
/*
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
*/
            card.innerHTML = `
                <div class="card-info">
                    <h4>${tool.toolName}</h4>
                    <p>${tool.toolDesc}</p>
                </div>
            `;
            card.onclick = () => window.open(tool.link, '_blank');

            grid.appendChild(card);
            allCardElements.push({
                card: card,
                categoryWrap: catWrap,
                toolName: (tool.toolName || '').toLowerCase(),
                toolDesc: (tool.toolDesc || '').toLowerCase()
            });
        });
    });
}

function filterToolsByKeyword(keyword) {
    const kw = keyword.trim().toLowerCase();
    const categoryHasVisible = new Map();

    allCardElements.forEach(item => {
        const match = kw === '' || item.toolName.includes(kw) || item.toolDesc.includes(kw);
        if (match) {
            item.card.style.display = 'flex';
            categoryHasVisible.set(item.categoryWrap, true);
        } else {
            item.card.style.display = 'none';
        }
    });

    const allCategories = document.querySelectorAll('.tool-category');
    allCategories.forEach(cat => {
        if (categoryHasVisible.get(cat)) {
            cat.style.display = 'block';
        } else {
            cat.style.display = 'none';
        }
    });
}

function initLanguageSwitch() {
    const btn = document.getElementById('langSwitchBtn');
    if (!btn) return;

    const isChinese = window.location.pathname.includes('index-ch.html');

    if (isChinese) {
        btn.textContent = '🌐 English';   
        btn.onclick = () => location.href = 'index.html';
    } else {
        btn.textContent = '🌐 中文';
        btn.onclick = () => location.href = 'index-ch.html';
    }
}

// ========== DOM 加载完成 ==========
window.addEventListener('DOMContentLoaded', function () {
    renderSideNav();
    renderToolList();

    const searchInput = document.getElementById('toolSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterToolsByKeyword(e.target.value);
        });
    }

    initLanguageSwitch();

    // ========== 导航跟随页脚（新版，更可靠） ==========
    (function() {
        const sideNav = document.getElementById('sideNav');
        const footer = document.querySelector('footer');
        
        function updateNavPosition() {
            if (!sideNav || !footer) return;
            
            const footerRect = footer.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const navHeight = sideNav.offsetHeight;
            
            // 默认底部距离
            let bottomOffset = 20;
            
            // 页脚顶部进入视口
            if (footerRect.top < windowHeight) {
                // 如果页脚完全在视口内或部分在视口内
                if (footerRect.bottom <= windowHeight) {
                    // 页脚完全可见，导航底部停在页脚顶部上方
                    bottomOffset = windowHeight - footerRect.top + 20;
                } else {
                    // 页脚部分可见，导航逐渐上移
                    const visibleFooterHeight = windowHeight - footerRect.top;
                    bottomOffset = windowHeight - footerRect.top + 20;
                }
            }
            
            // 限制最大偏移，不让导航超出顶部
            const maxBottom = windowHeight - 150; // 顶部留出 header 空间
            bottomOffset = Math.min(bottomOffset, maxBottom);
            bottomOffset = Math.max(bottomOffset, 20);
            
            sideNav.style.bottom = bottomOffset + 'px';
        }
        
        window.addEventListener('scroll', updateNavPosition);
        window.addEventListener('resize', updateNavPosition);
        setTimeout(updateNavPosition, 200);
    })();
});