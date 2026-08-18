/**
 * MyTab v3.1 —— 现代化重构版
 *
 * 相比 v3.0 的变化：
 * 1. 代码现代化：ES6+ 语法（const/let、箭头函数、模板字符串）、event.key、语义化类名、CSS 变量
 * 2. 新增"名称"栏：编辑菜单可填网站名称；悬浮提示显示名称与网址
 * 3. 编辑菜单重构：底部"清除网址 / 清除图标 / 本地图片"三个按钮；右键已配置链接自动预填
 * 4. 移除 Alt+字母唤出菜单（避免与其他快捷键冲突）
 * 5. 默认白色背景；清除背景回到白底；时间/链接文字默认黑色
 * 6. 右键空白处菜单新增"使用方法"说明
 * 7. 网站图标获取失败时显示「无」
 * 8. 右键菜单 UI 优化（毛玻璃、圆角、阴影、hover 反馈）
 * 9. 自定义搜索引擎改为弹窗表单（替换 prompt）
 * 10. localStorage 键位保持不变，原有自定义数据完全兼容
 */
(function () {
    'use strict';

    /* ================= 元素引用 ================= */
    const $ = (id) => document.getElementById(id);

    const sbtn = $('search-btn');
    const timeBox = $('timeBox');
    const container = $('container');
    const engineBtn = $('itema');
    const searchGo = $('itemb');
    const bg = $('bg');
    const ql = $('quickLink');
    const keytype = ql.getElementsByClassName('keytype'); // 与 KEY_CHARS 顺序一致
    const myul = $('myul');
    const nameInput = $('nameInput');
    const linkInput = $('linkInput');
    const iconInput = $('iconInput');
    const iconSelect = $('iconSelect');
    const clearUrlBtn = $('clearUrlBtn');
    const clearIconBtn = $('clearIconBtn');
    const pickIconBtn = $('pickIconBtn');
    const oUl = $('relevance');
    const bgChangeMenu = $('bgChangeMenu');
    const bgSelectButton = $('bgSelectButton');
    const bgSelect = $('bgSelect');
    const bgClearBtn = $('bgClear');
    const hideLinkBtn = $('hideLink');
    const timeColorBtn = $('timeColor');
    const linkColorBtn = $('linkColor');
    const bgHelpToggle = $('bgHelpToggle');
    const bgHelpBox = $('bgHelpBox');
    const engineMenu = $('engineMenu');
    const engineForm = $('engineForm');
    const engineNameInput = $('engineNameInput');
    const engineUrlInput = $('engineUrlInput');
    const engineSave = $('engineSave');
    const engineCancel = $('engineCancel');
    const tooltip = $('tooltip');

    // 键盘排布（小写字母，与 HTML 中 keytype 顺序一致）：q w e r t y u i o p / a s d f g h j k l / z x c v b n m
    const KEY_CHARS = 'qwertyuiopasdfghjklzxcvbnm';
    const EDIT_INPUTS = [nameInput, linkInput, iconInput]; // 编辑菜单三个输入框

    let currentKey = null; // 当前正在编辑的快捷链接格子

    /* ================= localStorage 键位（与旧版本完全兼容） =================
     * 0-25    网址        27-52   图标        54-79   本地图片图标（DataURL）
     * -1 背景  -2 显隐链接  -3 时间颜色  -4 链接颜色  -5 自定义引擎  -6 当前引擎
     * v3.1 新增：81-106 名称    108-133 本地图标文件名
     */
    const hrefKey = (i) => String(i);
    const iconKey = (i) => String(i + 27);
    const localIconKey = (i) => String(i + 54);
    const nameKey = (i) => String(i + 81);
    const localIconNameKey = (i) => String(i + 108);

    /* ================= 时间 ================= */
    const padZero = (n) => (n > 9 ? n : '0' + n);

    function renderTime() {
        const d = new Date();
        timeBox.textContent = padZero(d.getHours()) + ':' + padZero(d.getMinutes());
    }
    renderTime(); // 立即渲染，避免首秒空白
    setInterval(renderTime, 1000);

    /* ================= 搜索 ================= */
    // 搜索引擎列表（{q} 为关键词占位符）
    const ENGINE_LIST = [
        { name: '百度', url: 'https://www.baidu.com/s?ie=utf-8&word={q}', icon: 'baidu.png' },
        { name: '必应', url: 'https://www.bing.com/search?q={q}' },
        { name: '谷歌', url: 'https://www.google.com/search?q={q}' },
        { name: '搜狗', url: 'https://www.sogou.com/web?query={q}' }
    ];

    function getEngines() {
        const list = ENGINE_LIST.slice();
        const custom = localStorage.getItem(-5);
        if (custom) {
            try { list.push(JSON.parse(custom)); } catch (e) { /* 忽略损坏的自定义引擎 */ }
        }
        return list;
    }

    function getEngineIndex() {
        const idx = parseInt(localStorage.getItem(-6), 10);
        return isNaN(idx) ? 0 : idx;
    }

    function getCurrentEngine() {
        const list = getEngines();
        return list[getEngineIndex()] || list[0];
    }

    const isBaiduEngine = () => getCurrentEngine().url.indexOf('baidu.com') > -1;

    function buildSearchUrl(keyword) {
        return getCurrentEngine().url.replace('{q}', encodeURIComponent(keyword));
    }

    function searchMy() {
        const keyword = sbtn.value.trim();
        if (!keyword) { sbtn.focus(); return; } // 空内容不弹空白页
        window.open(buildSearchUrl(keyword), '_blank');
    }

    /* ================= 搜索引擎切换 ================= */
    function renderEngineMenu() {
        const list = getEngines();
        const idx = getEngineIndex();
        engineMenu.textContent = '';
        list.forEach((e, i) => {
            const div = document.createElement('div');
            div.className = 'engineOption' + (i === idx ? ' engine-active' : '');
            div.textContent = e.name;
            div.addEventListener('click', () => {
                localStorage.setItem(-6, String(i));
                applyEngine();
                engineMenu.style.display = 'none';
            });
            engineMenu.appendChild(div);
        });
        const custom = document.createElement('div');
        custom.className = 'engineOption engine-custom';
        custom.textContent = '自定义…';
        custom.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止文档级点击关闭弹窗
            openEngineForm();
        });
        engineMenu.appendChild(custom);
    }

    // 更新搜索框左侧按钮：显示当前引擎的图标或首字母
    function applyEngine() {
        const e = getCurrentEngine();
        engineBtn.textContent = '';
        if (e.icon) {
            const img = document.createElement('img');
            img.src = e.icon;
            img.alt = e.name;
            engineBtn.appendChild(img);
        } else {
            const span = document.createElement('span');
            span.className = 'engine-letter';
            span.textContent = e.name.charAt(0);
            engineBtn.appendChild(span);
        }
        engineBtn.title = '搜索引擎：' + e.name + '（点击切换）';
        hideSuggest();
    }

    engineBtn.addEventListener('click', () => {
        if (engineMenu.style.display === 'block') { closeAllMenus(); return; }
        closeAllMenus(); // 打开引擎菜单前关闭其他浮层
        const rect = engineBtn.getBoundingClientRect();
        renderEngineMenu();
        engineMenu.style.display = 'block';
        engineMenu.style.left = rect.left + 'px';
        engineMenu.style.top = (rect.bottom + 4) + 'px';
    });

    // 键盘可达性：Enter / 空格 触发引擎按钮
    engineBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            engineBtn.click();
        }
    });

    /* ================= 自定义搜索引擎弹窗 ================= */
    function openEngineForm() {
        closeAllMenus(); // 打开弹窗前关闭其他浮层
        engineNameInput.value = '';
        engineUrlInput.value = '';
        engineForm.hidden = false;
        engineNameInput.focus();
    }

    function closeEngineForm() { engineForm.hidden = true; }

    function saveCustomEngine() {
        const name = engineNameInput.value.trim();
        const url = engineUrlInput.value.trim();
        if (!name || !url) { alert('名称和链接都不能为空'); return; }
        if (url.indexOf('{q}') === -1) { alert('链接中必须包含 {q} 占位符'); return; }
        localStorage.setItem(-5, JSON.stringify({ name: name, url: url }));
        localStorage.setItem(-6, String(getEngines().length - 1));
        applyEngine();
        closeEngineForm();
    }

    engineSave.addEventListener('click', saveCustomEngine);
    engineCancel.addEventListener('click', closeEngineForm);

    /* ================= 聚焦 / 失焦样式 ================= */
    function addFocus() {
        sbtn.classList.add('sbtn-focus');
        engineBtn.classList.add('item-act');
        searchGo.classList.add('item-act');
        bg.classList.add('bg-act');
        container.classList.add('container-focus');
        if (!sbtn.value) hideSuggest();
    }

    function removeFocus() {
        sbtn.classList.remove('sbtn-focus');
        engineBtn.classList.remove('item-act');
        searchGo.classList.remove('item-act');
        bg.classList.remove('bg-act');
        container.classList.remove('container-focus');
        hideSuggest();
    }

    sbtn.addEventListener('focus', addFocus);
    sbtn.addEventListener('blur', removeFocus);
    searchGo.addEventListener('click', searchMy);

    /* ================= 百度联想词（JSONP + 防抖） ================= */
    let suggestTimer = null;
    let suggestScript = null;

    sbtn.addEventListener('input', () => {
        clearTimeout(suggestTimer);
        const value = sbtn.value.trim();
        if (!value || !isBaiduEngine()) { hideSuggest(); return; } // 联想词仅百度可用
        suggestTimer = setTimeout(() => fetchSuggest(value), 150);
    });

    function fetchSuggest(value) {
        if (suggestScript) { suggestScript.remove(); suggestScript = null; } // 取消上一次未完成的请求
        suggestScript = document.createElement('script');
        suggestScript.src = 'https://sp0.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su?wd=' +
            encodeURIComponent(value) + '&cb=mytabSuggest';
        suggestScript.onerror = () => {
            if (suggestScript) { suggestScript.remove(); suggestScript = null; }
            hideSuggest();
        };
        document.body.appendChild(suggestScript);
    }

    // JSONP 回调（必须挂在全局，供百度返回的脚本调用）
    window.mytabSuggest = function (data) {
        if (!isBaiduEngine()) { hideSuggest(); return; } // 切换引擎后忽略旧联想词
        const list = data.s || [];
        oUl.textContent = '';
        if (!list.length) { hideSuggest(); return; }
        list.forEach((ele) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = 'https://www.baidu.com/s?ie=utf-8&word=' + encodeURIComponent(ele);
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = ele; // textContent 防注入，空格可正常编码
            li.appendChild(a);
            oUl.appendChild(li);
        });
        oUl.style.display = 'block';
    };

    // 点击联想词时阻止输入框失焦（否则列表隐藏后点击事件丢失）
    oUl.addEventListener('mousedown', (e) => e.preventDefault());

    function hideSuggest() { oUl.style.display = 'none'; }

    /* ================= 快捷链接：恢复 localStorage 数据 ================= */
    for (let i = 0; i < keytype.length; i++) {
        const kt = keytype[i];
        const savedHref = localStorage.getItem(hrefKey(i));
        const savedIcon = localStorage.getItem(iconKey(i));
        const savedLocal = localStorage.getItem(localIconKey(i));
        if (savedHref) kt.href = savedHref;
        if (savedLocal) setIcon(kt, savedLocal);            // 本地图片优先
        else if (savedIcon) {                               // 图标可能是图片链接或文字
            if (isImageUrl(savedIcon)) setIcon(kt, savedIcon);
            else setTile(kt, savedIcon, tileColor(savedIcon));
        } else {
            ensureTile(kt);                                 // 有链接无图标 → 自动获取 / 文字图标
        }
    }

    function getKeyIndex(kt) { return Array.prototype.indexOf.call(keytype, kt); }

    function removeIconEl(kt) {
        const img = kt.querySelector('img');
        if (img) img.remove();
        const tile = kt.querySelector('.keytile');
        if (tile) tile.remove();
    }

    function setIcon(kt, src) {
        removeIconEl(kt);
        const img = document.createElement('img');
        kt.appendChild(img);
        img.src = src;
    }

    // 判断图标输入是图片链接还是文字（文字用于替代图标）
    function isImageUrl(s) {
        return /^data:image\//i.test(s) ||
            /^https?:\/\/.*\.(png|jpe?g|gif|webp|ico|svg|avif|bmp)(\?.*)?$/i.test(s);
    }

    // 根据字符串生成稳定的背景色
    function tileColor(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
        return 'hsl(' + h + ', 55%, 42%)';
    }

    // 文字图标（替代图片图标的网站）
    function setTile(kt, text, color) {
        removeIconEl(kt);
        const tile = document.createElement('span');
        tile.className = 'keytile';
        tile.textContent = text.slice(0, 2);
        tile.style.backgroundColor = color || tileColor(text);
        kt.appendChild(tile);
    }

    // 有链接但没有图标时：先自动尝试获取网站 favicon，失败则显示「无」
    function ensureTile(kt) {
        if (kt.querySelector('img') || kt.querySelector('.keytile')) return;
        const href = kt.getAttribute('href');
        if (!href) return;
        let host = href;
        try { host = new URL(href).hostname; } catch (e) { host = href.replace(/^https?:\/\//i, '').split('/')[0]; }
        const fav = document.createElement('img');
        fav.src = 'https://' + host + '/favicon.ico';
        fav.onerror = () => {
            fav.remove(); // favicon 获取失败 → 显示「无」
            setTile(kt, '无', tileColor(host));
        };
        kt.appendChild(fav);
    }

    /* ================= 右键编辑菜单 ================= */
    function openMenu(kt, x, y) {
        closeAllMenus(); // 打开编辑菜单前关闭其他浮层
        currentKey = kt;
        prefillMenu(kt);
        myul.style.display = 'block';
        myul.style.left = x + 'px';
        myul.style.top = y + 'px';
        nameInput.focus();
    }

    // 右键已配置的链接时预填：网址 / 名称 / 图标（在线链接、文字或本地图片文件名）
    function prefillMenu(kt) {
        const i = getKeyIndex(kt);
        linkInput.value = kt.getAttribute('href') || '';
        const localIcon = localStorage.getItem(localIconKey(i));
        const localName = localStorage.getItem(localIconNameKey(i));
        const icon = localStorage.getItem(iconKey(i));
        iconInput.value = localIcon ? (localName || '本地图片') : (icon || '');
        nameInput.value = localStorage.getItem(nameKey(i)) || '';
    }

    function closeMenu() {
        myul.style.display = 'none';
        currentKey = null;
        nameInput.value = '';
        linkInput.value = '';
        iconInput.value = '';
    }

    // 关闭所有浮层（打开新菜单前调用，避免多个菜单同时显示造成冲突）
    function closeAllMenus() {
        closeMenu();                                // 编辑菜单
        bgChangeMenu.style.display = 'none';        // 背景菜单
        engineMenu.style.display = 'none';          // 搜索引擎菜单
        closeEngineForm();                          // 自定义引擎弹窗
    }

    // 右键快捷链接：弹出编辑菜单（事件委托）
    ql.addEventListener('contextmenu', (e) => {
        const kt = e.target.closest('.keytype');
        if (!kt) return;
        e.preventDefault();
        e.stopPropagation(); // 阻止冒泡到文档级的背景菜单
        openMenu(kt, e.pageX, e.pageY);
    });

    // 左键空链接：打开编辑菜单，而不是跳转
    ql.addEventListener('click', (e) => {
        const kt = e.target.closest('.keytype');
        if (!kt || kt.getAttribute('href')) return;
        e.preventDefault();
        const rect = kt.getBoundingClientRect();
        openMenu(kt, rect.left + window.scrollX, rect.bottom + window.scrollY + 4);
    });

    // 保存链接（Enter 触发）
    function saveLink() {
        if (!currentKey) return;
        const i = getKeyIndex(currentKey);
        const newLink = linkInput.value.trim();
        const newName = nameInput.value.trim();
        const newIcon = iconInput.value.trim();

        // 兼容旧行为：网址栏输入 clear 清除该格子
        if (newLink.toLowerCase() === 'clear') {
            clearSlot(currentKey);
            closeMenu();
            return;
        }

        // 自动补全协议，避免拼到当前页面地址后面
        // 存储用户输入的原始链接（不含浏览器规范化的末尾斜杠）
        const finalLink = newLink && !/^https?:\/\//i.test(newLink) ? 'https://' + newLink : newLink;
        currentKey.href = finalLink;

        if (finalLink) localStorage.setItem(hrefKey(i), finalLink);
        else localStorage.removeItem(hrefKey(i));

        if (newName) localStorage.setItem(nameKey(i), newName);
        else localStorage.removeItem(nameKey(i));

        const hasLocalIcon = !!localStorage.getItem(localIconKey(i));
        // 图标栏没被改动（显示的是本地图片的文件名）时保留本地图标
        const iconUnchanged = hasLocalIcon &&
            (newIcon === localStorage.getItem(localIconNameKey(i)) || newIcon === '本地图片');

        if (newIcon && !iconUnchanged) {
            // 图片链接 → 图片图标；普通文字 → 文字图标（同时清掉旧的本地图标）
            if (isImageUrl(newIcon)) setIcon(currentKey, newIcon);
            else setTile(currentKey, newIcon, tileColor(newIcon));
            localStorage.setItem(iconKey(i), newIcon);
            localStorage.removeItem(localIconKey(i));
            localStorage.removeItem(localIconNameKey(i));
        } else if (!newIcon && !hasLocalIcon) {
            ensureTile(currentKey); // 未填图标但有链接 → 自动生成
        }
        closeMenu();
    }

    // 清空某个格子（网址 / 名称 / 图标 / 本地图标）
    function clearSlot(kt) {
        const i = getKeyIndex(kt);
        kt.href = '';
        removeIconEl(kt);
        localStorage.removeItem(hrefKey(i));
        localStorage.removeItem(iconKey(i));
        localStorage.removeItem(localIconKey(i));
        localStorage.removeItem(localIconNameKey(i));
        localStorage.removeItem(nameKey(i));
    }

    // 清除网址（保留图标）
    clearUrlBtn.addEventListener('click', () => {
        if (!currentKey) return;
        const i = getKeyIndex(currentKey);
        currentKey.href = '';
        localStorage.removeItem(hrefKey(i));
        localStorage.removeItem(nameKey(i));
        linkInput.value = '';
        nameInput.value = '';
    });

    // 清除图标（保留网址）
    clearIconBtn.addEventListener('click', () => {
        if (!currentKey) return;
        const i = getKeyIndex(currentKey);
        removeIconEl(currentKey);
        localStorage.removeItem(iconKey(i));
        localStorage.removeItem(localIconKey(i));
        localStorage.removeItem(localIconNameKey(i));
        iconInput.value = '';
    });

    // 选择本地图片作为图标（FileReader 转 DataURL 存入 localStorage，可随时替换）
    pickIconBtn.addEventListener('click', () => iconSelect.click());
    iconSelect.addEventListener('change', function () {
        const kt = currentKey;
        const file = this.files[0];
        if (!kt || !file) return;
        if (!/image\/\w+/.test(file.type)) { alert('文件必须为图片！'); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            setIcon(kt, e.target.result);
            const i = getKeyIndex(kt);
            localStorage.setItem(localIconKey(i), e.target.result);
            localStorage.setItem(localIconNameKey(i), file.name);
            iconInput.value = file.name;
        };
        reader.readAsDataURL(file);
        this.value = ''; // 允许再次选择同一个文件
    });

    /* ================= 悬浮提示（跟随鼠标，显示名称与网址） ================= */
    function showTooltip(x, y, text) {
        tooltip.textContent = text;
        tooltip.style.display = 'block';
        const pad = 12;
        let left = x + pad;
        let top = y + pad;
        const tw = tooltip.offsetWidth;
        const th = tooltip.offsetHeight;
        if (left + tw > window.innerWidth - 4) left = x - tw - pad;  // 右侧溢出 → 移到左侧
        if (top + th > window.innerHeight - 4) top = y - th - pad;   // 底部溢出 → 移到上方
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }

    function hideTooltip() { tooltip.style.display = 'none'; }

    ql.addEventListener('mousemove', (e) => {
        const kt = e.target.closest('.keytype');
        if (!kt) { hideTooltip(); return; }
        const href = kt.getAttribute('href');
        if (!href) { hideTooltip(); return; }
        const name = localStorage.getItem(nameKey(getKeyIndex(kt)));
        showTooltip(e.clientX, e.clientY, name ? name + '：' + href : href);
    });
    ql.addEventListener('mouseleave', hideTooltip);

    /* ================= 全局键盘事件 ================= */
    function focusNextInput(dir) {
        const cur = EDIT_INPUTS.indexOf(document.activeElement);
        const next = cur === -1 ? 0 : (cur + dir + EDIT_INPUTS.length) % EDIT_INPUTS.length;
        EDIT_INPUTS[next].focus();
    }

    document.addEventListener('keydown', (e) => {
        const menuOpen = myul.style.display === 'block';
        const bgMenuOpen = bgChangeMenu.style.display === 'block';
        const engineMenuOpen = engineMenu.style.display === 'block';
        const formOpen = !engineForm.hidden;
        const searchFocused = sbtn === document.activeElement;

        // 自定义引擎弹窗：Esc 关闭，Enter 保存
        if (formOpen) {
            if (e.key === 'Escape') closeEngineForm();
            else if (e.key === 'Enter') saveCustomEngine();
            return;
        }
        // 编辑菜单：↑↓ 切换输入框，Esc 关闭，Enter 保存
        if (menuOpen) {
            if (e.key === 'ArrowDown') { e.preventDefault(); focusNextInput(1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); focusNextInput(-1); }
            else if (e.key === 'Escape') closeMenu();
            else if (e.key === 'Enter') { e.preventDefault(); saveLink(); }
            return;
        }
        // 背景菜单：Esc 关闭
        if (bgMenuOpen) {
            if (e.key === 'Escape') bgChangeMenu.style.display = 'none';
            return;
        }
        // 搜索引擎菜单：Esc 关闭
        if (engineMenuOpen) {
            if (e.key === 'Escape') engineMenu.style.display = 'none';
            return;
        }
        // 快捷链接快捷键：搜索框未聚焦且无修饰键时，按字母键打开对应网站（空链接则弹出编辑菜单）
        if (!searchFocused && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const idx = KEY_CHARS.indexOf(e.key.toLowerCase());
            if (idx > -1) { e.preventDefault(); keytype[idx].click(); return; }
        }
        if (e.key === 'Escape') {
            if (searchFocused) { sbtn.blur(); hideSuggest(); }
            else { sbtn.focus(); }
        } else if (e.key === 'Enter' && searchFocused) {
            searchMy();
        }
    });

    /* ================= 全局点击事件 ================= */
    document.addEventListener('click', (e) => {
        // 快捷链接的点击由 ql 的委托处理（空链接会打开菜单）
        if (e.target.closest && e.target.closest('.keytype')) return;
        // 点击联想词列表内部不隐藏
        if (oUl.contains(e.target)) return;
        hideSuggest();
        // 点击编辑菜单内部不关闭
        if (myul.contains(e.target)) return;
        closeMenu();
        // 点击背景菜单外部关闭
        if (!bgChangeMenu.contains(e.target)) {
            bgChangeMenu.style.display = 'none';
        }
        // 点击引擎按钮或菜单外部时关闭引擎菜单
        if (!engineMenu.contains(e.target) && !engineBtn.contains(e.target)) {
            engineMenu.style.display = 'none';
        }
        // 点击弹窗外部关闭
        if (!engineForm.contains(e.target)) {
            closeEngineForm();
        }
    });

    /* ================= 右键修改背景（空白处） ================= */
    document.addEventListener('contextmenu', (e) => {
        // 输入框保留原生右键菜单（复制 / 粘贴等）
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        e.preventDefault(); // 屏蔽浏览器原生右键菜单
        // 编辑菜单 / 背景菜单 / 引擎菜单 / 弹窗内部右键：忽略
        if (e.target.closest && e.target.closest('#myul, #bgChangeMenu, #engineMenu, #engineForm')) return;
        closeAllMenus(); // 打开背景菜单前关闭其他浮层
        bgChangeMenu.style.display = 'block';
        bgChangeMenu.style.left = e.pageX + 'px';
        bgChangeMenu.style.top = e.pageY + 'px';
    });

    // 恢复自定义背景；无则保持白色底色
    const savedBg = localStorage.getItem(-1);
    if (savedBg) {
        bg.src = savedBg;
        bg.style.display = 'block';
    }

    bgSelectButton.addEventListener('click', () => bgSelect.click());
    bgSelect.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;
        if (!/image\/\w+/.test(file.type)) { alert('文件必须为图片！'); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            bg.src = dataUrl;
            bg.style.display = 'block';
            // 压缩到最长边 1920px 后再存储，避免超出 localStorage 配额
            dealImage(dataUrl, 1920, (compressed) => {
                localStorage.setItem(-1, compressed);
            });
        };
        reader.readAsDataURL(file);
        this.value = '';
    });

    bgClearBtn.addEventListener('click', () => {
        bg.removeAttribute('src');
        bg.style.display = 'none';
        localStorage.removeItem(-1);
    });

    // 压缩图片（等比缩放，最长边不超过 maxSide）
    function dealImage(src, maxSide, callback) {
        const img = new Image();
        img.onload = () => {
            const longer = Math.max(img.width, img.height);
            const ratio = longer > maxSide ? maxSide / longer : 1;
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * ratio);
            canvas.height = Math.round(img.height * ratio);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            callback(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.src = src;
    }

    /* ================= 显隐链接 / 颜色切换 ================= */
    function applyHideLink() {
        ql.style.opacity = localStorage.getItem(-2) === '0' ? '0' : '1';
    }
    hideLinkBtn.addEventListener('click', () => {
        const next = ql.style.opacity === '0' ? '1' : '0';
        ql.style.opacity = next;
        localStorage.setItem(-2, next === '0' ? '0' : '1');
    });

    function applyTimeColor() {
        // 默认黑色（适配默认白底）；-3 === '1' 时为白色（适配深色背景）
        timeBox.style.color = localStorage.getItem(-3) === '1' ? 'white' : 'black';
    }
    timeColorBtn.addEventListener('click', () => {
        localStorage.setItem(-3, localStorage.getItem(-3) === '1' ? '0' : '1');
        applyTimeColor();
    });

    function applyLinkColor() {
        const color = localStorage.getItem(-4) === '0' ? 'white' : 'black';
        Array.prototype.forEach.call(ql.getElementsByTagName('p'), (p) => {
            p.style.color = color;
        });
    }
    linkColorBtn.addEventListener('click', () => {
        localStorage.setItem(-4, localStorage.getItem(-4) === '0' ? '1' : '0');
        applyLinkColor();
    });

    /* ================= 使用方法 ================= */
    bgHelpToggle.addEventListener('click', () => {
        bgHelpBox.hidden = !bgHelpBox.hidden;
    });

    /* ================= 初始化 ================= */
    applyHideLink();
    applyTimeColor();
    applyLinkColor();
    applyEngine(); // 恢复上次选择的搜索引擎
    sbtn.focus();  // 进入页面自动聚焦搜索框
})();
