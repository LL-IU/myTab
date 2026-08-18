/**
 * MyTab v2.0 优化版
 *
 * 主要改动：
 * 1. 统一使用 addEventListener 绑定事件，修复 window.onkeydown / window.onclick
 *    被反复覆盖导致的相互冲突
 * 2. 修复百度联想词链接：正确域名 + URL 编码（支持空格）+ textContent 防注入 + 防抖
 * 3. 修复清除判断：输入 "clear" 才清除（原代码只判断 "c"），并同步重置 DOM
 * 4. 修复图标状态过期问题：添加/替换本地图标无需刷新页面
 * 5. 修复点击搜索按钮依赖失焦时序的问题，搜索不再清空已输入内容
 * 6. 空链接点击时弹出编辑菜单（对应 index.html 中注释的设计意图）
 * 7. 输入网址自动补全协议（https://），避免拼到当前页面地址后面
 * 8. localStorage 键位保持不变，已有自定义数据完全兼容
 */
(function () {
    'use strict';

    /* ================= 元素引用 ================= */
    var sbtn = document.getElementById('search-btn');
    var timeBox = document.querySelector('.timeBox');
    var container = document.getElementById('container');
    var itema = document.getElementById('itema');
    var itemb = document.getElementById('itemb');
    var bg = document.getElementById('bg');
    var ql = document.getElementById('quickLink');
    var keytype = ql.getElementsByClassName('keytype'); // 与 keyArray 顺序一致
    var myul = document.getElementById('myul');
    var linkInput = document.getElementById('linkInput');
    var iconInput = document.getElementById('iconInput');
    var iconSelect = document.getElementById('iconSelect');
    var oUl = document.getElementById('relevance');
    var bgChangeMenu = document.getElementById('bgChangeMenu');
    var bgSelect = document.getElementById('bgSelect');
    var bgClearBtn = document.getElementById('bgClear');
    var hideLinkBtn = document.getElementById('hideLink');
    var timeColorBtn = document.getElementById('timeColor');
    var linkColorBtn = document.getElementById('linkColor');

    // 按键盘排布的按键代码：Q W E R T Y U I O P / A S D F G H J K L / Z X C V B N M
    var keyArray = [81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 65, 83, 68, 70, 71, 72, 74, 75, 76, 90, 88, 67, 86, 66, 78, 77];

    var currentKey = null; // 当前正在编辑的快捷链接格子

    /* ================= 时间 ================= */
    function padZero(n) { return n > 9 ? n : '0' + n; }

    setInterval(function () {
        var d = new Date();
        timeBox.innerText = padZero(d.getHours()) + ':' + padZero(d.getMinutes());
    }, 1000);

    /* ================= 搜索 ================= */
    function searchMy() {
        var keyword = sbtn.value.trim();
        if (!keyword) { sbtn.focus(); return; } // 空内容不弹空白页
        window.open('https://www.baidu.com/s?ie=utf-8&word=' + encodeURIComponent(keyword));
    }

    // 聚焦 / 失焦时的样式切换（不再清除已输入内容，点击搜索按钮不再依赖失焦时序）
    function add() {
        sbtn.classList.add('sbtn-focus');
        itema.classList.add('item-act');
        itemb.classList.add('item-act');
        bg.classList.add('bg-act');
        container.classList.add('container-focus');
        if (!sbtn.value) hideSuggest();
    }

    function remove() {
        sbtn.classList.remove('sbtn-focus');
        itema.classList.remove('item-act');
        itemb.classList.remove('item-act');
        bg.classList.remove('bg-act');
        container.classList.remove('container-focus');
        hideSuggest();
    }

    sbtn.addEventListener('focus', add);
    sbtn.addEventListener('blur', remove);
    itemb.addEventListener('click', searchMy);

    /* ================= 百度联想词（JSONP） ================= */
    var suggestTimer = null;
    var suggestScript = null;

    sbtn.addEventListener('input', function () {
        clearTimeout(suggestTimer);
        var value = sbtn.value.trim();
        if (!value) { hideSuggest(); return; }
        suggestTimer = setTimeout(function () { fetchSuggest(value); }, 150); // 防抖
    });

    function fetchSuggest(value) {
        if (suggestScript) suggestScript.remove(); // 清理上一个 script，避免堆积
        suggestScript = document.createElement('script');
        suggestScript.src = 'https://sp0.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su?wd=' +
            encodeURIComponent(value) + '&cb=doJosn';
        document.body.appendChild(suggestScript);
    }

    // JSONP 回调（必须是全局函数，供百度返回的脚本调用）
    window.doJosn = function (data) {
        var list = data.s || [];
        oUl.innerHTML = '';
        if (list.length) {
            list.forEach(function (ele) {
                var li = document.createElement('li');
                var a = document.createElement('a');
                a.href = 'https://www.baidu.com/s?ie=utf-8&word=' + encodeURIComponent(ele);
                a.target = '_blank';
                a.textContent = ele; // textContent 防止注入，且空格可正常编码
                li.appendChild(a);
                oUl.appendChild(li);
            });
            oUl.style.display = 'block';
        } else {
            hideSuggest();
        }
    };

    // 点击联想词时阻止输入框失焦（否则列表被隐藏后点击事件丢失）
    oUl.addEventListener('mousedown', function (e) { e.preventDefault(); });

    function hideSuggest() { oUl.style.display = 'none'; }

    /* ================= 快捷链接：恢复 localStorage 数据 ================= */
    for (var i = 0; i < keytype.length; i++) {
        var kt = keytype[i];
        var savedHref = localStorage.getItem(i);
        var savedIcon = localStorage.getItem(i + 27);
        var savedLocal = localStorage.getItem(i + 54);
        if (savedHref) kt.href = savedHref;
        if (savedLocal) setIcon(kt, savedLocal);            // 本地图片优先
        else if (savedIcon) setIcon(kt, savedIcon);
    }

    function setIcon(kt, src) {
        var img = kt.querySelector('img');
        if (!img) { img = document.createElement('img'); kt.appendChild(img); }
        img.src = src;
    }

    function getKeyIndex(kt) { return Array.prototype.indexOf.call(keytype, kt); }

    /* ================= 右键编辑菜单 ================= */
    function openMenu(x, y) {
        myul.style.display = 'block';
        myul.style.left = x + 'px';
        myul.style.top = y + 'px';
        linkInput.focus();
    }

    function closeMenu() {
        myul.style.display = 'none';
        linkInput.value = '';
        iconInput.value = '';
    }

    // 右键快捷链接：弹出编辑菜单（事件委托，一次绑定）
    ql.addEventListener('contextmenu', function (e) {
        var kt = e.target.closest('.keytype');
        if (!kt) return;
        e.preventDefault();
        currentKey = kt;
        openMenu(e.pageX, e.pageY);
    });

    // 左键空链接：打开编辑菜单，而不是跳转到当前页面
    ql.addEventListener('click', function (e) {
        var kt = e.target.closest('.keytype');
        if (!kt || kt.getAttribute('href')) return;
        e.preventDefault();
        currentKey = kt;
        var rect = kt.getBoundingClientRect();
        openMenu(rect.left + window.scrollX, rect.bottom + window.scrollY + 4);
    });

    // 保存链接（Enter 触发）
    function saveLink() {
        if (!currentKey) return;
        var i = getKeyIndex(currentKey);
        var newLink = linkInput.value.trim();
        var newIcon = iconInput.value.trim();

        // 输入 clear 清除该格子的记录（并重置 DOM，不再残留 href="clear"）
        if (newLink.toLowerCase() === 'clear') {
            currentKey.href = '';
            var img = currentKey.querySelector('img');
            if (img) img.remove();
            localStorage.removeItem(i);
            localStorage.removeItem(i + 27);
            localStorage.removeItem(i + 54);
            closeMenu();
            return;
        }

        // 自动补全协议，避免把输入内容拼到当前页面地址后面
        if (newLink && !/^https?:\/\//i.test(newLink)) newLink = 'https://' + newLink;

        currentKey.href = newLink;
        if (newLink) localStorage.setItem(i, newLink);
        if (newIcon) {
            setIcon(currentKey, newIcon);
            localStorage.setItem(i + 27, newIcon);
        }
        closeMenu();
    }

    // 选择本地图片作为图标（FileReader 转 DataURL 存入 localStorage，可随时替换）
    iconSelect.addEventListener('change', function () {
        var kt = currentKey;
        var file = this.files[0];
        if (!kt || !file) return;
        if (!/image\/\w+/.test(file.type)) { alert('文件必须为图片！'); return; }
        var reader = new FileReader();
        reader.onload = function (e) {
            setIcon(kt, e.target.result);
            localStorage.setItem(getKeyIndex(kt) + 54, e.target.result);
        };
        reader.readAsDataURL(file);
        this.value = ''; // 允许再次选择同一个文件
    });

    /* ================= 全局键盘事件（统一，不再互相覆盖） ================= */
    document.addEventListener('keydown', function (e) {
        var menuOpen = myul.style.display === 'block';
        var bgMenuOpen = bgChangeMenu.style.display === 'block';
        var searchFocused = sbtn === document.activeElement;

        // 编辑菜单打开时：↑↓ 切换输入框，Esc 关闭，Enter 保存
        if (menuOpen) {
            if (e.keyCode === 40) { e.preventDefault(); iconInput.focus(); }
            else if (e.keyCode === 38) { e.preventDefault(); linkInput.focus(); }
            else if (e.keyCode === 27) { closeMenu(); }
            else if (e.keyCode === 13) { e.preventDefault(); saveLink(); }
            return;
        }
        // 背景菜单打开时：Esc 关闭，忽略其他按键
        if (bgMenuOpen) {
            if (e.keyCode === 27) bgChangeMenu.style.display = 'none';
            return;
        }
        // 快捷链接快捷键：搜索框未聚焦时按字母键打开对应网站（空链接则弹出编辑菜单）
        if (!searchFocused) {
            var idx = keyArray.indexOf(e.keyCode);
            if (idx > -1) { keytype[idx].click(); return; }
        }
        if (e.keyCode === 27) {
            if (searchFocused) { sbtn.blur(); hideSuggest(); }
            else { sbtn.focus(); }
        } else if (e.keyCode === 13 && searchFocused) {
            searchMy();
        }
    });

    /* ================= 全局点击事件（统一） ================= */
    document.addEventListener('click', function (e) {
        // 快捷链接的点击由 ql 的委托处理（空链接会打开菜单，不在这里关闭）
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
    });

    /* ================= 右键修改背景 ================= */
    var savedBg = localStorage.getItem(-1);
    if (savedBg) bg.src = savedBg;

    bg.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        bgChangeMenu.style.display = 'block';
        bgChangeMenu.style.left = e.pageX + 'px';
        bgChangeMenu.style.top = e.pageY + 'px';
    });

    bgSelect.addEventListener('change', function () {
        var file = this.files[0];
        if (!file) return;
        if (!/image\/\w+/.test(file.type)) { alert('文件必须为图片！'); return; }
        var reader = new FileReader();
        reader.onload = function (e) {
            var dataUrl = e.target.result;
            bg.src = dataUrl;
            // 压缩到最长边 1920px 后再存储，避免超出 localStorage 配额
            dealImage(dataUrl, 1920, function (compressed) {
                localStorage.setItem(-1, compressed);
            });
        };
        reader.readAsDataURL(file);
        this.value = '';
    });

    bgClearBtn.addEventListener('click', function () {
        bg.src = 'bg.jpg';
        localStorage.removeItem(-1);
    });

    // 压缩图片（等比缩放，最长边不超过 maxSide）
    function dealImage(src, maxSide, callback) {
        var img = new Image();
        img.onload = function () {
            var ratio = Math.max(img.width, img.height) > maxSide
                ? maxSide / Math.max(img.width, img.height) : 1;
            var canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * ratio);
            canvas.height = Math.round(img.height * ratio);
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            callback(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.src = src;
    }

    /* ================= 显隐链接 / 颜色切换 ================= */
    function applyHideLink() {
        ql.style.opacity = localStorage.getItem(-2) === '0' ? '0' : '1';
    }
    hideLinkBtn.addEventListener('click', function () {
        var next = ql.style.opacity === '0' ? '1' : '0';
        ql.style.opacity = next;
        localStorage.setItem(-2, next === '0' ? '0' : '1');
    });
    applyHideLink();

    function applyTimeColor() {
        timeBox.style.color = localStorage.getItem(-3) === '0' ? 'black' : 'white';
    }
    timeColorBtn.addEventListener('click', function () {
        var c = localStorage.getItem(-3);
        localStorage.setItem(-3, c === '0' ? '1' : '0');
        applyTimeColor();
    });
    applyTimeColor();

    function applyLinkColor() {
        var color = localStorage.getItem(-4) === '0' ? 'white' : 'black';
        Array.prototype.forEach.call(ql.getElementsByTagName('p'), function (p) {
            p.style.color = color;
        });
    }
    linkColorBtn.addEventListener('click', function () {
        var c = localStorage.getItem(-4);
        localStorage.setItem(-4, c === '0' ? '1' : '0');
        applyLinkColor();
    });
    applyLinkColor();

    /* ================= 初始化 ================= */
    sbtn.focus(); // 进入页面自动聚焦搜索框
})();
