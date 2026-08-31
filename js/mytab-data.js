/**
 * MyTab v3.4.1 —— 数据模块（导出 / 导入）
 * 导出全部自定义数据为 JSON 备份文件（26 个链接槽 + 设置项）；
 * 导入时先校验结构，再全量恢复并刷新界面。
 * 对外暴露：NS.data = { buildExport, exportData, importFromFile, validate, applyImport }
 */
(function (NS) {
    'use strict';

    const storage = NS.storage;
    const LINK_COUNT = 26;
    const EXPORT_VERSION = 1;

    /* ================= 导出 ================= */
    function buildExport() {
        const links = [];
        for (let i = 0; i < LINK_COUNT; i++) {
            links.push({
                href: storage.getHref(i) || '',
                icon: storage.getIcon(i) || '',
                localIcon: storage.getLocalIcon(i) || '',
                localIconName: storage.getLocalIconName(i) || '',
                name: storage.getName(i) || ''
            });
        }
        return {
            app: 'MyTab',
            version: EXPORT_VERSION,
            exportedAt: new Date().toISOString(),
            links: links,
            settings: {
                bg: storage.getBg() || '',
                hideLinks: storage.getHideLinks() || '1',
                timeColor: storage.getTimeColor() || '0',
                linkColor: storage.getLinkColor() || '1',
                customEngine: storage.getCustomEngine(),
                engineIndex: storage.getEngineIndex()
            }
        };
    }

    function timestamp() {
        const d = new Date();
        const p = (n) => (n > 9 ? n : '0' + n);
        return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) +
            '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
    }

    function downloadJson(filename, obj) {
        const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function exportData() {
        downloadJson('mytab-backup-' + timestamp() + '.json', buildExport());
    }

    /* ================= 导入 ================= */
    function validate(data) {
        if (!data || data.app !== 'MyTab' || !Array.isArray(data.links) || data.links.length !== LINK_COUNT) return false;
        if (!data.settings || typeof data.settings !== 'object') return false;
        return true;
    }

    function applyImport(data) {
        storage.clearAll(); // 先清空，保证与备份完全一致

        data.links.forEach((slot, i) => {
            if (!slot) return;
            if (slot.href) storage.setHref(i, slot.href);
            if (slot.icon) storage.setIcon(i, slot.icon);
            if (slot.localIcon) storage.setLocalIcon(i, slot.localIcon);
            if (slot.localIconName) storage.setLocalIconName(i, slot.localIconName);
            if (slot.name) storage.setName(i, slot.name);
        });

        const s = data.settings;
        storage.setBg(s.bg || null);
        storage.setHideLinks(s.hideLinks !== undefined ? s.hideLinks : '1');
        storage.setTimeColor(s.timeColor !== undefined ? s.timeColor : '0');
        storage.setLinkColor(s.linkColor !== undefined ? s.linkColor : '1');
        if (s.customEngine) storage.setCustomEngine(s.customEngine);
        storage.setEngineIndex(typeof s.engineIndex === 'number' ? s.engineIndex : 0);

        // 刷新界面（链接 / 背景 / 颜色 / 显隐 / 搜索引擎）
        NS.links.reload();
        NS.bg.reload();
        NS.bg.applyHideLink();
        NS.bg.applyTimeColor();
        NS.bg.applyLinkColor();
        NS.search.applyEngine();
    }

    function importFromFile(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!validate(data)) {
                    alert('导入失败：文件不是有效的 MyTab 备份');
                    return;
                }
                applyImport(data);
                NS.closeAllMenus(); // 导入完成关闭浮层
                alert('导入成功：已恢复备份数据');
            } catch (err) {
                alert('导入失败：文件无法解析（' + err.message + '）');
            }
        };
        reader.readAsText(file);
    }

    /* ================= 导出 ================= */
    // buildExport / validate / applyImport 同时供 WebDAV 同步与云端恢复复用（v3.5）
    NS.data = {
        buildExport,
        exportData,
        importFromFile,
        validate,
        applyImport
    };
})(window.MyTab = window.MyTab || {});
