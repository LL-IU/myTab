/**
 * MyTab v3.3 —— 搜索模块
 * 搜索引擎切换（含自定义）/ 聚焦失焦样式 / 百度联想词（JSONP + 防抖）。
 * 对外暴露：NS.search = { searchMy, applyEngine, closeEngineMenu, closeEngineForm,
 *                          saveCustomEngine, hideSuggest }
 */
(function (NS) {
    'use strict';

    const ui = NS.ui;
    const storage = NS.storage;

    /* ================= 搜索引擎 ================= */
    // 搜索引擎列表（{q} 为关键词占位符）
    const ENGINE_LIST = [
        { name: '百度', url: 'https://www.baidu.com/s?ie=utf-8&word={q}', icon: 'baidu.png' },
        { name: '必应', url: 'https://www.bing.com/search?q={q}' },
        { name: '谷歌', url: 'https://www.google.com/search?q={q}' },
        { name: '搜狗', url: 'https://www.sogou.com/web?query={q}' }
    ];

    function getEngines() {
        const list = ENGINE_LIST.slice();
        const custom = storage.getCustomEngine();
        if (custom) list.push(custom);
        return list;
    }

    function getCurrentEngine() {
        const list = getEngines();
        return list[storage.getEngineIndex()] || list[0];
    }

    const isBaiduEngine = () => getCurrentEngine().url.indexOf('baidu.com') > -1;

    function buildSearchUrl(keyword) {
        return getCurrentEngine().url.replace('{q}', encodeURIComponent(keyword));
    }

    function searchMy() {
        const keyword = ui.sbtn.value.trim();
        if (!keyword) { ui.sbtn.focus(); return; } // 空内容不弹空白页
        window.open(buildSearchUrl(keyword), '_blank');
    }

    /* ================= 搜索引擎切换 ================= */
    function renderEngineMenu() {
        const list = getEngines();
        const idx = storage.getEngineIndex();
        ui.engineMenu.textContent = '';
        list.forEach((e, i) => {
            const div = document.createElement('div');
            div.className = 'engineOption' + (i === idx ? ' engine-active' : '');
            div.textContent = e.name;
            div.addEventListener('click', () => {
                storage.setEngineIndex(i);
                applyEngine();
                ui.engineMenu.style.display = 'none';
            });
            ui.engineMenu.appendChild(div);
        });
        const custom = document.createElement('div');
        custom.className = 'engineOption engine-custom';
        custom.textContent = '自定义…';
        custom.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止文档级点击关闭弹窗
            openEngineForm();
        });
        ui.engineMenu.appendChild(custom);
    }

    // 更新搜索框左侧按钮：显示当前引擎的图标或首字母
    function applyEngine() {
        const e = getCurrentEngine();
        ui.engineBtn.textContent = '';
        if (e.icon) {
            const img = document.createElement('img');
            img.src = e.icon;
            img.alt = e.name;
            ui.engineBtn.appendChild(img);
        } else {
            const span = document.createElement('span');
            span.className = 'engine-letter';
            span.textContent = e.name.charAt(0);
            ui.engineBtn.appendChild(span);
        }
        ui.engineBtn.title = '搜索引擎：' + e.name + '（点击切换）';
        hideSuggest();
    }

    ui.engineBtn.addEventListener('click', () => {
        if (ui.engineMenu.style.display === 'block') { NS.closeAllMenus(); return; }
        NS.closeAllMenus(); // 打开引擎菜单前关闭其他浮层
        const rect = ui.engineBtn.getBoundingClientRect();
        renderEngineMenu();
        ui.engineMenu.style.display = 'block';
        ui.engineMenu.style.left = rect.left + 'px';
        ui.engineMenu.style.top = (rect.bottom + 4) + 'px';
    });

    // 键盘可达性：Enter / 空格 触发引擎按钮
    ui.engineBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            ui.engineBtn.click();
        }
    });

    // 点击引擎按钮时阻止搜索框失焦（避免搜索框缩小，保持聚焦放大状态）
    ui.engineBtn.addEventListener('mousedown', (e) => e.preventDefault());

    /* ================= 自定义搜索引擎弹窗 ================= */
    function openEngineForm() {
        NS.closeAllMenus(); // 打开弹窗前关闭其他浮层
        ui.engineNameInput.value = '';
        ui.engineUrlInput.value = '';
        ui.engineForm.hidden = false;
        ui.engineNameInput.focus();
    }

    function closeEngineForm() { ui.engineForm.hidden = true; }

    function closeEngineMenu() { ui.engineMenu.style.display = 'none'; }

    function saveCustomEngine() {
        const name = ui.engineNameInput.value.trim();
        const url = ui.engineUrlInput.value.trim();
        if (!name || !url) { alert('名称和链接都不能为空'); return; }
        if (url.indexOf('{q}') === -1) { alert('链接中必须包含 {q} 占位符'); return; }
        storage.setCustomEngine({ name: name, url: url });
        storage.setEngineIndex(getEngines().length - 1);
        applyEngine();
        closeEngineForm();
    }

    ui.engineSave.addEventListener('click', saveCustomEngine);
    ui.engineCancel.addEventListener('click', closeEngineForm);

    /* ================= 聚焦 / 失焦样式 ================= */
    function addFocus() {
        ui.sbtn.classList.add('sbtn-focus');
        ui.engineBtn.classList.add('item-act');
        ui.searchGo.classList.add('item-act');
        ui.bg.classList.add('bg-act');
        ui.container.classList.add('container-focus');
        ui.oUl.style.width = ui.container.offsetWidth + 'px'; // 联想词宽度匹配搜索框宽度
        if (!ui.sbtn.value) hideSuggest();
    }

    function removeFocus() {
        ui.sbtn.classList.remove('sbtn-focus');
        ui.engineBtn.classList.remove('item-act');
        ui.searchGo.classList.remove('item-act');
        ui.bg.classList.remove('bg-act');
        ui.container.classList.remove('container-focus');
        hideSuggest();
    }

    ui.sbtn.addEventListener('focus', addFocus);
    ui.sbtn.addEventListener('blur', removeFocus);
    ui.searchGo.addEventListener('click', searchMy);

    /* ================= 百度联想词（JSONP + 防抖） ================= */
    let suggestTimer = null;
    let suggestScript = null;

    ui.sbtn.addEventListener('input', () => {
        clearTimeout(suggestTimer);
        const value = ui.sbtn.value.trim();
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
        ui.oUl.textContent = '';
        if (!list.length) { hideSuggest(); return; }
        list.forEach((ele) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = 'https://www.baidu.com/s?ie=utf-8&word=' + encodeURIComponent(ele);
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = ele; // textContent 防注入，空格可正常编码
            li.appendChild(a);
            ui.oUl.appendChild(li);
        });
        ui.oUl.style.display = 'block';
    };

    // 点击联想词时阻止输入框失焦（否则列表隐藏后点击事件丢失）
    ui.oUl.addEventListener('mousedown', (e) => e.preventDefault());

    function hideSuggest() { ui.oUl.style.display = 'none'; }

    /* ================= 导出 ================= */
    NS.search = {
        searchMy,
        applyEngine,
        closeEngineMenu,
        closeEngineForm,
        saveCustomEngine,
        hideSuggest
    };
})(window.MyTab = window.MyTab || {});
