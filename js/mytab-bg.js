/**
 * MyTab v3.3 —— 背景与外观模块
 * 自定义背景（压缩后存 localStorage）/ 显隐链接 / 时间与链接颜色 / 使用方法面板。
 * 对外暴露：NS.bg = { closeMenu, applyHideLink, applyTimeColor, applyLinkColor }
 */
(function (NS) {
    'use strict';

    const ui = NS.ui;
    const storage = NS.storage;

    /* ================= 自定义背景 ================= */
    // 恢复自定义背景；无则保持白色底色（可重复执行，导入数据后调用）
    function restoreBg() {
        const savedBg = storage.getBg();
        if (savedBg) {
            ui.bg.src = savedBg;
            ui.bg.style.display = 'block';
        } else {
            ui.bg.removeAttribute('src');
            ui.bg.style.display = 'none';
        }
    }
    restoreBg();

    ui.bgSelectButton.addEventListener('click', () => ui.bgSelect.click());
    ui.bgSelect.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;
        if (!/image\/\w+/.test(file.type)) { alert('文件必须为图片！'); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            ui.bg.src = dataUrl;
            ui.bg.style.display = 'block';
            // 压缩到最长边 1920px 后再存储，避免超出 localStorage 配额
            dealImage(dataUrl, 1920, (compressed) => {
                storage.setBg(compressed);
            });
        };
        reader.readAsDataURL(file);
        this.value = '';
    });

    ui.bgClearBtn.addEventListener('click', () => {
        ui.bg.removeAttribute('src');
        ui.bg.style.display = 'none';
        storage.setBg(null);
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
        ui.ql.style.opacity = storage.getHideLinks() === '0' ? '0' : '1';
    }
    ui.hideLinkBtn.addEventListener('click', () => {
        const next = ui.ql.style.opacity === '0' ? '1' : '0';
        ui.ql.style.opacity = next;
        storage.setHideLinks(next === '0' ? '0' : '1');
    });

    function applyTimeColor() {
        // 默认黑色（适配默认白底）；-3 === '1' 时为白色（适配深色背景）
        ui.timeBox.style.color = storage.getTimeColor() === '1' ? 'white' : 'black';
    }
    ui.timeColorBtn.addEventListener('click', () => {
        storage.setTimeColor(storage.getTimeColor() === '1' ? '0' : '1');
        applyTimeColor();
    });

    function applyLinkColor() {
        const color = storage.getLinkColor() === '0' ? 'white' : 'black';
        Array.prototype.forEach.call(ui.ql.getElementsByTagName('p'), (p) => {
            p.style.color = color;
        });
    }
    ui.linkColorBtn.addEventListener('click', () => {
        storage.setLinkColor(storage.getLinkColor() === '0' ? '1' : '0');
        applyLinkColor();
    });

    /* ================= 使用方法 ================= */
    ui.bgHelpToggle.addEventListener('click', () => {
        const willShow = ui.bgHelpBox.hidden;
        ui.bgHelpBox.hidden = !willShow;
        if (willShow) {
            // 面板在菜单右侧展开；右侧空间不足时向左展开
            const r = ui.bgChangeMenu.getBoundingClientRect();
            const panelWidth = 300;
            ui.bgHelpBox.classList.toggle('bgHelp-left', r.right + 8 + panelWidth > window.innerWidth);
        }
    });

    /* ================= 数据导入 / 导出（右键菜单项） ================= */
    ui.bgExport.addEventListener('click', () => NS.data.exportData());
    ui.bgImport.addEventListener('click', () => ui.bgImportFile.click());
    ui.bgImportFile.addEventListener('change', function () {
        const file = this.files[0];
        this.value = ''; // 允许再次选择同一个文件
        NS.data.importFromFile(file);
    });

    /* ================= 导出 ================= */
    NS.bg = {
        closeMenu: () => { ui.bgChangeMenu.style.display = 'none'; },
        applyHideLink,
        applyTimeColor,
        applyLinkColor,
        reload: restoreBg
    };
})(window.MyTab = window.MyTab || {});
