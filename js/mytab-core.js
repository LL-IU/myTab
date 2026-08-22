/**
 * MyTab v3.3 —— 模块化核心
 * DOM 引用 + 共享常量与工具。所有模块通过 window.MyTab 命名空间协作，
 * 保持零依赖、无构建步骤，双击 index.html 可直接使用（经典脚本，非 ES Module，
 * 因浏览器会拦截 file:// 下的 type="module"）。
 *
 * 加载顺序：core → storage → time → search → links → bg → init
 */
(function (NS) {
    'use strict';

    const $ = (id) => document.getElementById(id);

    /* ================= 元素引用（与 HTML 中 id 一一对应） ================= */
    const ui = {
        sbtn: $('search-btn'),
        timeBox: $('timeBox'),
        container: $('container'),
        engineBtn: $('itema'),
        searchGo: $('itemb'),
        bg: $('bg'),
        ql: $('quickLink'),
        myul: $('myul'),
        nameInput: $('nameInput'),
        linkInput: $('linkInput'),
        iconInput: $('iconInput'),
        iconSelect: $('iconSelect'),
        clearUrlBtn: $('clearUrlBtn'),
        clearIconBtn: $('clearIconBtn'),
        pickIconBtn: $('pickIconBtn'),
        oUl: $('relevance'),
        bgChangeMenu: $('bgChangeMenu'),
        bgSelectButton: $('bgSelectButton'),
        bgSelect: $('bgSelect'),
        bgClearBtn: $('bgClear'),
        hideLinkBtn: $('hideLink'),
        timeColorBtn: $('timeColor'),
        linkColorBtn: $('linkColor'),
        bgHelpToggle: $('bgHelpToggle'),
        bgHelpBox: $('bgHelpBox'),
        engineMenu: $('engineMenu'),
        engineForm: $('engineForm'),
        engineNameInput: $('engineNameInput'),
        engineUrlInput: $('engineUrlInput'),
        engineSave: $('engineSave'),
        engineCancel: $('engineCancel'),
        tooltip: $('tooltip'),
        bgExport: $('bgExport'),
        bgImport: $('bgImport'),
        bgImportFile: $('bgImportFile')
    };

    // 键盘排布（小写字母，与 HTML 中 keytype 顺序一致）：q w e r t y u i o p / a s d f g h j k l / z x c v b n m
    const keytype = ui.ql.getElementsByClassName('keytype');
    const KEY_CHARS = 'qwertyuiopasdfghjklzxcvbnm';
    const EDIT_INPUTS = [ui.nameInput, ui.linkInput, ui.iconInput]; // 编辑菜单三个输入框

    const padZero = (n) => (n > 9 ? n : '0' + n);

    // 是否运行在浏览器扩展环境（chrome-extension:// 页面）。
    // MV3 下远程 <script> 被 CSP 拦截，联想词等需要走 fetch + host_permissions；
    // 普通网页返回 false，保留 JSONP 方案。
    const isExtension = () => typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;

    /* ================= 导出 ================= */
    NS.ui = ui;
    NS.keytype = keytype;
    NS.KEY_CHARS = KEY_CHARS;
    NS.EDIT_INPUTS = EDIT_INPUTS;
    NS.padZero = padZero;
    NS.isExtension = isExtension;
})(window.MyTab = window.MyTab || {});
