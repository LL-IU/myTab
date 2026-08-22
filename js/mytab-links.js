/**
 * MyTab v3.3 —— 快捷链接模块
 * 恢复存储 / 图标三态（图片链接、文字、本地图片）/ 右键编辑菜单 / 悬浮提示。
 * 对外暴露：NS.links = { open, close, save }
 */
(function (NS) {
    'use strict';

    const ui = NS.ui;
    const storage = NS.storage;

    /* ================= 恢复 localStorage 数据 ================= */
    for (let i = 0; i < NS.keytype.length; i++) {
        const kt = NS.keytype[i];
        const savedHref = storage.getHref(i);
        const savedIcon = storage.getIcon(i);
        const savedLocal = storage.getLocalIcon(i);
        if (savedHref) kt.href = savedHref;
        if (savedLocal) setIcon(kt, savedLocal);            // 本地图片优先
        else if (savedIcon) {                               // 图标可能是图片链接或文字
            if (isImageUrl(savedIcon)) setIcon(kt, savedIcon);
            else setTile(kt, savedIcon, tileColor(savedIcon));
        } else {
            ensureTile(kt);                                 // 有链接无图标 → 自动获取 / 文字图标
        }
    }

    function getKeyIndex(kt) { return Array.prototype.indexOf.call(NS.keytype, kt); }

    /* ================= 图标三态 ================= */
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
    let currentKey = null; // 当前正在编辑的快捷链接格子

    function openMenu(kt, x, y) {
        NS.closeAllMenus(); // 打开编辑菜单前关闭其他浮层
        currentKey = kt;
        prefillMenu(kt);
        ui.myul.style.display = 'block';
        ui.myul.style.left = x + 'px';
        ui.myul.style.top = y + 'px';
        ui.nameInput.focus();
    }

    // 右键已配置的链接时预填：网址 / 名称 / 图标（在线链接、文字或本地图片文件名）
    function prefillMenu(kt) {
        const i = getKeyIndex(kt);
        ui.linkInput.value = kt.getAttribute('href') || '';
        const localIcon = storage.getLocalIcon(i);
        const localName = storage.getLocalIconName(i);
        const icon = storage.getIcon(i);
        ui.iconInput.value = localIcon ? (localName || '本地图片') : (icon || '');
        ui.nameInput.value = storage.getName(i) || '';
    }

    function closeMenu() {
        ui.myul.style.display = 'none';
        currentKey = null;
        ui.nameInput.value = '';
        ui.linkInput.value = '';
        ui.iconInput.value = '';
    }

    // 右键快捷链接：弹出编辑菜单（事件委托）
    ui.ql.addEventListener('contextmenu', (e) => {
        const kt = e.target.closest('.keytype');
        if (!kt) return;
        e.preventDefault();
        e.stopPropagation(); // 阻止冒泡到文档级的背景菜单
        openMenu(kt, e.pageX, e.pageY);
    });

    // 左键空链接：打开编辑菜单，而不是跳转
    ui.ql.addEventListener('click', (e) => {
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
        const newLink = ui.linkInput.value.trim();
        const newName = ui.nameInput.value.trim();
        const newIcon = ui.iconInput.value.trim();

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

        storage.setHref(i, finalLink);
        storage.setName(i, newName);

        const hasLocalIcon = !!storage.getLocalIcon(i);
        // 图标栏没被改动（显示的是本地图片的文件名）时保留本地图标
        const iconUnchanged = hasLocalIcon &&
            (newIcon === storage.getLocalIconName(i) || newIcon === '本地图片');

        if (newIcon && !iconUnchanged) {
            // 图片链接 → 图片图标；普通文字 → 文字图标（同时清掉旧的本地图标）
            if (isImageUrl(newIcon)) setIcon(currentKey, newIcon);
            else setTile(currentKey, newIcon, tileColor(newIcon));
            storage.setIcon(i, newIcon);
            storage.setLocalIcon(i, null);
            storage.setLocalIconName(i, null);
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
        storage.clearSlot(i);
    }

    // 清除网址（保留图标）
    ui.clearUrlBtn.addEventListener('click', () => {
        if (!currentKey) return;
        const i = getKeyIndex(currentKey);
        currentKey.href = '';
        storage.setHref(i, null);
        storage.setName(i, null);
        ui.linkInput.value = '';
        ui.nameInput.value = '';
    });

    // 清除图标（保留网址）
    ui.clearIconBtn.addEventListener('click', () => {
        if (!currentKey) return;
        const i = getKeyIndex(currentKey);
        removeIconEl(currentKey);
        storage.setIcon(i, null);
        storage.setLocalIcon(i, null);
        storage.setLocalIconName(i, null);
        ui.iconInput.value = '';
    });

    // 选择本地图片作为图标（FileReader 转 DataURL 存入 localStorage，可随时替换）
    ui.pickIconBtn.addEventListener('click', () => ui.iconSelect.click());
    ui.iconSelect.addEventListener('change', function () {
        const kt = currentKey;
        const file = this.files[0];
        if (!kt || !file) return;
        if (!/image\/\w+/.test(file.type)) { alert('文件必须为图片！'); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            setIcon(kt, e.target.result);
            const i = getKeyIndex(kt);
            storage.setLocalIcon(i, e.target.result);
            storage.setLocalIconName(i, file.name);
            ui.iconInput.value = file.name;
        };
        reader.readAsDataURL(file);
        this.value = ''; // 允许再次选择同一个文件
    });

    /* ================= 悬浮提示（跟随鼠标，显示名称与网址） ================= */
    function showTooltip(x, y, text) {
        ui.tooltip.textContent = text;
        ui.tooltip.style.display = 'block';
        const pad = 12;
        let left = x + pad;
        let top = y + pad;
        const tw = ui.tooltip.offsetWidth;
        const th = ui.tooltip.offsetHeight;
        if (left + tw > window.innerWidth - 4) left = x - tw - pad;  // 右侧溢出 → 移到左侧
        if (top + th > window.innerHeight - 4) top = y - th - pad;   // 底部溢出 → 移到上方
        ui.tooltip.style.left = left + 'px';
        ui.tooltip.style.top = top + 'px';
    }

    function hideTooltip() { ui.tooltip.style.display = 'none'; }

    ui.ql.addEventListener('mousemove', (e) => {
        const kt = e.target.closest('.keytype');
        if (!kt) { hideTooltip(); return; }
        const href = kt.getAttribute('href');
        if (!href) { hideTooltip(); return; }
        const name = storage.getName(getKeyIndex(kt));
        showTooltip(e.clientX, e.clientY, name ? name + '：' + href : href);
    });
    ui.ql.addEventListener('mouseleave', hideTooltip);

    /* ================= 导出 ================= */
    NS.links = {
        open: openMenu,
        close: closeMenu,
        save: saveLink
    };
})(window.MyTab = window.MyTab || {});
