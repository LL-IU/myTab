/**
 * MyTab v3.5 —— WebDAV 手动同步模块
 * 配置自己的 WebDAV 网盘后，右键菜单「立即同步」把全部链接与设置
 * （与「导出数据」同一 JSON 格式）PUT 上传到云端；仅手动触发，
 * 不做任何自动同步。支持「测试连接」与「从云端恢复」。
 *
 * 地址配置为两段：服务器地址填 WebDAV 根目录（如 https://dav.jianguoyun.com/dav/），
 * 文件名填相对根目录的完整路径（如 /mytab/mytab.json）；首次保存配置时
 * 自动在云端创建对应文件夹（已存在则跳过），同步时 409 建目录兜底。
 *
 * 配置存于 localStorage -7 / -8，不属于备份数据（导入备份、clearAll 均不清除）。
 * 扩展环境（MV3）跨域请求需站点主机权限：manifest 声明 optional_host_permissions，
 * 保存配置时按需申请；网页版直接 fetch，能否连接取决于目标服务器的 CORS 策略。
 *
 * 对外暴露：NS.webdav = { openForm, closeForm, saveForm, syncNow }
 */
(function (NS) {
    'use strict';

    const ui = NS.ui;
    const storage = NS.storage;

    const DEFAULT_FILENAME = '/mytab/mytab.json';

    /* ================= 配置读写 ================= */
    function getConfig() {
        const raw = storage.getWebdav();
        if (!raw) return null;
        try {
            const cfg = JSON.parse(raw);
            if (!cfg || typeof cfg.url !== 'string') return null; // 忽略损坏的配置
            return cfg;
        } catch (e) { return null; }
    }

    // 目标文件 URL = 服务器地址（根目录）+ 文件名完整路径
    function buildTargetUrl(cfg) {
        const base = cfg.url.trim().replace(/\/+$/, '');
        const file = (cfg.filename || DEFAULT_FILENAME).trim();
        return base + '/' + file.replace(/^\/+/, '');
    }

    // Basic 认证（经 TextEncoder 中转，支持中文等非 Latin1 字符）
    function basicAuth(user, pass) {
        const bytes = new TextEncoder().encode((user || '') + ':' + (pass || ''));
        let bin = '';
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return 'Basic ' + btoa(bin);
    }

    function davRequest(cfg, url, method, body) {
        const headers = { Authorization: basicAuth(cfg.user, cfg.pass) };
        if (body !== undefined) headers['Content-Type'] = 'application/json';
        return fetch(url, { method: method, headers: headers, body: body });
    }

    /* ================= 扩展站点权限 ================= */
    function originOf(url) {
        try { return new URL(url).origin + '/*'; } catch (e) { return null; }
    }

    // 用户手势路径（保存 / 测试 / 恢复按钮点击）：直接申请站点权限
    function requestPermission(url) {
        if (!NS.isExtension() || !chrome.permissions) return Promise.resolve(true);
        const origin = originOf(url);
        if (!origin) return Promise.resolve(true);
        return chrome.permissions.request({ origins: [origin] }).catch(() => false);
    }

    // 非手势路径（立即同步）：只检查不申请
    function checkPermission(url) {
        if (!NS.isExtension() || !chrome.permissions) return Promise.resolve(true);
        const origin = originOf(url);
        if (!origin) return Promise.resolve(true);
        return chrome.permissions.contains({ origins: [origin] }).catch(() => false);
    }

    /* ================= 设置弹窗 ================= */
    function showStatus(text, kind) {
        ui.webdavStatus.textContent = text;
        ui.webdavStatus.className = kind || '';
        ui.webdavStatus.hidden = !text;
    }

    function openForm() {
        NS.closeAllMenus(); // 打开弹窗前关闭其他浮层
        const cfg = getConfig() || {};
        ui.webdavEnable.checked = !!cfg.enabled;
        ui.webdavUrlInput.value = cfg.url || '';
        ui.webdavFileInput.value = cfg.filename || DEFAULT_FILENAME;
        ui.webdavUserInput.value = cfg.user || '';
        ui.webdavPassInput.value = cfg.pass || '';
        showStatus('', '');
        ui.webdavForm.hidden = false;
        ui.webdavUrlInput.focus();
    }

    function closeForm() { ui.webdavForm.hidden = true; }

    function formCfg() {
        return {
            enabled: !!ui.webdavEnable.checked,
            url: ui.webdavUrlInput.value.trim(),
            filename: ui.webdavFileInput.value.trim() || DEFAULT_FILENAME,
            user: ui.webdavUserInput.value,
            pass: ui.webdavPassInput.value
        };
    }

    function saveForm() {
        const cfg = formCfg();
        if (cfg.enabled && !cfg.url) { showStatus('启用同步前请先填写服务器地址', 'err'); return; }
        if (cfg.url && !/^https?:\/\//i.test(cfg.url)) cfg.url = 'https://' + cfg.url; // 与链接编辑一致，自动补全
        ui.webdavUrlInput.value = cfg.url;
        storage.setWebdav(cfg);
        if (cfg.url) {
            prepareTarget(cfg).then((msg) => { if (msg) alert(msg); });
        }
        closeForm();
    }

    // 保存配置时在云端创建目标文件夹（首次创建，已存在则服务器返回 405 跳过）；
    // 返回需要弹窗提示的失败信息，成功返回 null
    function prepareTarget(cfg) {
        return requestPermission(buildTargetUrl(cfg)).then((ok) => {
            if (!ok) return '已保存配置，但未授予该站点的访问权限，扩展中同步会失败';
            const dir = buildTargetUrl(cfg).replace(/\/[^/]*$/, '');
            return davRequest(cfg, dir, 'MKCOL').then((res) => {
                if (res.status === 201 || res.status === 200 || res.status === 405) return null;
                return '已保存配置，但云端文件夹创建失败（服务器返回 ' + res.status + '）；同步时会自动重试';
            }).catch((err) => '已保存配置，但云端文件夹创建失败（' + err.message + '）；同步时会自动重试');
        });
    }

    /* ================= 立即同步（仅手动触发） ================= */
    // PUT 上传；父目录不存在（409）时先 MKCOL 建目录再重试一次
    function putWithMkcol(cfg, url, body) {
        return davRequest(cfg, url, 'PUT', body).then((res) => {
            if (res.status !== 409) return res;
            const dir = url.replace(/\/[^/]*$/, '');
            return davRequest(cfg, dir, 'MKCOL').then(() => davRequest(cfg, url, 'PUT', body));
        });
    }

    function syncNow() {
        const cfg = getConfig();
        if (!cfg || !cfg.url) { alert('请先在「WebDAV 设置」中填写服务器地址'); openForm(); return; }
        if (!cfg.enabled) { alert('WebDAV 同步当前未启用，请在「WebDAV 设置」中打开开关'); openForm(); return; }
        const target = buildTargetUrl(cfg);
        checkPermission(target).then((ok) => {
            if (!ok) { alert('未获得该站点的访问权限，请打开「WebDAV 设置」重新保存一次以授权'); return; }
            const body = JSON.stringify(NS.data.buildExport(), null, 2); // 与导出文件同格式
            putWithMkcol(cfg, target, body).then((res) => {
                if (res.status === 401) { alert('同步失败：账号或密码错误（401）'); return; }
                if (!res.ok) { alert('同步失败：服务器返回 ' + res.status); return; }
                storage.setLastSync(new Date().toISOString());
                alert('同步成功：已上传到 ' + target);
            }).catch((err) => alert('同步失败：' + err.message + '（检查网络、地址与站点权限）'));
        });
    }

    /* ================= 测试连接 / 从云端恢复 ================= */
    ui.webdavTestBtn.addEventListener('click', () => {
        const cfg = formCfg(); // 用表单当前值，便于保存前测试
        if (!cfg.url) { showStatus('请先填写服务器地址', 'err'); return; }
        const target = buildTargetUrl(cfg);
        showStatus('正在连接 ' + target + ' …', '');
        requestPermission(target).then((ok) => {
            if (!ok) { showStatus('未授予站点权限，扩展中无法连接', 'err'); return; }
            return davRequest(cfg, target, 'GET').then((res) => {
                if (res.status === 401) showStatus('连接失败：账号或密码错误（401）', 'err');
                else if (res.ok) showStatus('连接成功，云端已有备份文件', 'ok');
                else if (res.status === 404) showStatus('连接成功（云端还没有备份文件，可点「立即同步」上传）', 'ok');
                else showStatus('服务器返回 ' + res.status, 'err');
            }).catch((err) => showStatus('连接失败：' + err.message, 'err'));
        });
    });

    ui.webdavRestoreBtn.addEventListener('click', () => {
        const cfg = formCfg();
        if (!cfg.url) { showStatus('请先填写服务器地址', 'err'); return; }
        const target = buildTargetUrl(cfg);
        showStatus('正在读取云端备份 …', '');
        requestPermission(target).then((ok) => {
            if (!ok) { showStatus('未授予站点权限，扩展中无法连接', 'err'); return; }
            return davRequest(cfg, target, 'GET').then((res) => {
                if (res.status === 404) { showStatus('云端还没有备份文件，请先「立即同步」上传', 'err'); return null; }
                if (res.status === 401) { showStatus('读取失败：账号或密码错误（401）', 'err'); return null; }
                if (!res.ok) { showStatus('读取失败：服务器返回 ' + res.status, 'err'); return null; }
                return res.text();
            }).then((text) => {
                if (!text) return;
                try {
                    const data = JSON.parse(text);
                    if (!NS.data.validate(data)) { showStatus('云端文件不是有效的 MyTab 备份', 'err'); return; }
                    NS.data.applyImport(data); // 校验通过后全量恢复并刷新界面
                    closeForm();
                    alert('恢复成功：已应用云端备份数据');
                } catch (e) {
                    showStatus('云端文件无法解析（' + e.message + '）', 'err');
                }
            }).catch((err) => showStatus('读取失败：' + err.message, 'err'));
        });
    });

    /* ================= 右键菜单项 ================= */
    ui.bgWebdav.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止文档级点击关闭刚打开的弹窗
        openForm();
    });
    ui.bgSyncNow.addEventListener('click', (e) => {
        e.stopPropagation();
        NS.closeAllMenus();
        syncNow();
    });
    ui.webdavSave.addEventListener('click', saveForm);
    ui.webdavCancel.addEventListener('click', closeForm);

    /* ================= 导出 ================= */
    NS.webdav = { openForm, closeForm, saveForm, syncNow };
})(window.MyTab = window.MyTab || {});
