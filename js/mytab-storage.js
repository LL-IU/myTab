/**
 * MyTab v3.3 —— 存储层
 * 集中管理 localStorage 的历史键位（与 v2/v3 完全兼容，旧数据无缝读取）：
 * 0-25 网址  27-52 图标  54-79 本地图片图标(DataURL)
 * 81-106 名称  108-133 本地图标文件名
 * -1 背景  -2 显隐链接  -3 时间颜色  -4 链接颜色  -5 自定义引擎  -6 当前引擎
 */
(function (NS) {
    'use strict';

    const hrefKey = (i) => String(i);
    const iconKey = (i) => String(i + 27);
    const localIconKey = (i) => String(i + 54);
    const nameKey = (i) => String(i + 81);
    const localIconNameKey = (i) => String(i + 108);

    const get = (k) => localStorage.getItem(k);
    const set = (k, v) => localStorage.setItem(k, String(v));
    const del = (k) => localStorage.removeItem(k);
    // 便捷写入：空值（null / undefined / ''）等价删除
    const write = (k, v) => (v ? set(k, v) : del(k));

    const storage = {
        /* ---- 快捷链接 ---- */
        getHref: (i) => get(hrefKey(i)),
        setHref: (i, v) => write(hrefKey(i), v),
        getIcon: (i) => get(iconKey(i)),
        setIcon: (i, v) => write(iconKey(i), v),
        getLocalIcon: (i) => get(localIconKey(i)),
        setLocalIcon: (i, v) => write(localIconKey(i), v),
        getLocalIconName: (i) => get(localIconNameKey(i)),
        setLocalIconName: (i, v) => write(localIconNameKey(i), v),
        getName: (i) => get(nameKey(i)),
        setName: (i, v) => write(nameKey(i), v),
        clearSlot: (i) => {
            del(hrefKey(i));
            del(iconKey(i));
            del(localIconKey(i));
            del(localIconNameKey(i));
            del(nameKey(i));
        },

        /* ---- 设置项 ---- */
        getBg: () => get(-1),
        setBg: (v) => write(-1, v),
        getHideLinks: () => get(-2),
        setHideLinks: (v) => set(-2, v),
        getTimeColor: () => get(-3),
        setTimeColor: (v) => set(-3, v),
        getLinkColor: () => get(-4),
        setLinkColor: (v) => set(-4, v),
        getCustomEngine: () => {
            const raw = get(-5);
            if (!raw) return null;
            try { return JSON.parse(raw); } catch (e) { return null; } // 忽略损坏的自定义引擎
        },
        setCustomEngine: (e) => set(-5, JSON.stringify(e)),
        getEngineIndex: () => {
            const idx = parseInt(get(-6), 10);
            return isNaN(idx) ? 0 : idx;
        },
        setEngineIndex: (i) => set(-6, String(i))
    };

    /* ================= 导出 ================= */
    NS.storage = storage;
})(window.MyTab = window.MyTab || {});
