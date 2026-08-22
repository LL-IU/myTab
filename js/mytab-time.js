/**
 * MyTab v3.3 —— 时间模块
 * 页面顶部时钟，HH:MM 格式，每秒刷新。
 */
(function (NS) {
    'use strict';

    function renderTime() {
        const d = new Date();
        NS.ui.timeBox.textContent = NS.padZero(d.getHours()) + ':' + NS.padZero(d.getMinutes());
    }

    renderTime(); // 立即渲染，避免首秒空白
    setInterval(renderTime, 1000);
})(window.MyTab = window.MyTab || {});
