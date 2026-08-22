/**
 * MyTab v3.3 —— 启动编排
 * 全局事件（键盘 / 点击 / 右键）与浮层互斥管理 + 初始化调用。
 * 本模块依赖其余模块的导出，必须最后加载。
 */
(function (NS) {
    'use strict';

    const ui = NS.ui;

    /* ================= 浮层互斥 ================= */
    // 关闭所有浮层（打开新菜单前调用，避免多个菜单同时显示造成冲突）
    NS.closeAllMenus = function () {
        NS.links.close();              // 编辑菜单
        NS.bg.closeMenu();             // 背景菜单
        NS.search.closeEngineMenu();   // 搜索引擎菜单
        NS.search.closeEngineForm();   // 自定义引擎弹窗
    };

    /* ================= 全局键盘事件 ================= */
    function focusNextInput(dir) {
        const cur = NS.EDIT_INPUTS.indexOf(document.activeElement);
        const next = cur === -1 ? 0 : (cur + dir + NS.EDIT_INPUTS.length) % NS.EDIT_INPUTS.length;
        NS.EDIT_INPUTS[next].focus();
    }

    document.addEventListener('keydown', (e) => {
        const menuOpen = ui.myul.style.display === 'block';
        const bgMenuOpen = ui.bgChangeMenu.style.display === 'block';
        const engineMenuOpen = ui.engineMenu.style.display === 'block';
        const formOpen = !ui.engineForm.hidden;
        const searchFocused = ui.sbtn === document.activeElement;

        // 自定义引擎弹窗：Esc 关闭，Enter 保存
        if (formOpen) {
            if (e.key === 'Escape') NS.search.closeEngineForm();
            else if (e.key === 'Enter') NS.search.saveCustomEngine();
            return;
        }
        // 编辑菜单：↑↓ 切换输入框，Esc 关闭，Enter 保存
        if (menuOpen) {
            if (e.key === 'ArrowDown') { e.preventDefault(); focusNextInput(1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); focusNextInput(-1); }
            else if (e.key === 'Escape') NS.links.close();
            else if (e.key === 'Enter') { e.preventDefault(); NS.links.save(); }
            return;
        }
        // 背景菜单：Esc 关闭
        if (bgMenuOpen) {
            if (e.key === 'Escape') NS.bg.closeMenu();
            return;
        }
        // 搜索引擎菜单：Esc 关闭
        if (engineMenuOpen) {
            if (e.key === 'Escape') NS.search.closeEngineMenu();
            return;
        }
        // 快捷链接快捷键：搜索框未聚焦且无修饰键时，按字母键打开对应网站（空链接则弹出编辑菜单）
        if (!searchFocused && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const idx = NS.KEY_CHARS.indexOf(e.key.toLowerCase());
            if (idx > -1) { e.preventDefault(); NS.keytype[idx].click(); return; }
        }
        if (e.key === 'Escape') {
            if (searchFocused) { ui.sbtn.blur(); NS.search.hideSuggest(); }
            else { ui.sbtn.focus(); }
        } else if (e.key === 'Enter' && searchFocused) {
            NS.search.searchMy();
        }
    });

    /* ================= 全局点击事件 ================= */
    document.addEventListener('click', (e) => {
        // 快捷链接的点击由 ql 的委托处理（空链接会打开菜单）
        if (e.target.closest && e.target.closest('.keytype')) return;
        // 点击联想词列表内部不隐藏
        if (ui.oUl.contains(e.target)) return;
        NS.search.hideSuggest();
        // 点击编辑菜单内部不关闭
        if (ui.myul.contains(e.target)) return;
        NS.links.close();
        // 点击背景菜单外部关闭
        if (!ui.bgChangeMenu.contains(e.target)) {
            NS.bg.closeMenu();
        }
        // 点击引擎按钮或菜单外部时关闭引擎菜单
        if (!ui.engineMenu.contains(e.target) && !ui.engineBtn.contains(e.target)) {
            NS.search.closeEngineMenu();
        }
        // 点击弹窗外部关闭
        if (!ui.engineForm.contains(e.target)) {
            NS.search.closeEngineForm();
        }
    });

    /* ================= 右键修改背景（空白处） ================= */
    document.addEventListener('contextmenu', (e) => {
        // 输入框保留原生右键菜单（复制 / 粘贴等）
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        e.preventDefault(); // 屏蔽浏览器原生右键菜单
        // 编辑菜单 / 背景菜单 / 引擎菜单 / 弹窗内部右键：忽略
        if (e.target.closest && e.target.closest('#myul, #bgChangeMenu, #engineMenu, #engineForm')) return;
        NS.closeAllMenus(); // 打开背景菜单前关闭其他浮层
        ui.bgChangeMenu.style.display = 'block';
        ui.bgChangeMenu.style.left = e.pageX + 'px';
        ui.bgChangeMenu.style.top = e.pageY + 'px';
    });

    /* ================= 初始化 ================= */
    NS.bg.applyHideLink();
    NS.bg.applyTimeColor();
    NS.bg.applyLinkColor();
    NS.search.applyEngine(); // 恢复上次选择的搜索引擎
    ui.sbtn.focus();  // 进入页面自动聚焦搜索框
})(window.MyTab = window.MyTab || {});
