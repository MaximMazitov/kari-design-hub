// =============================================
// KARI Design Hub — Supabase Integration v1.0
// Общий workspace + Magic Link / Email+Password
// =============================================

const SUPABASE_URL = 'https://oopolxtxzjmivhqvrdiy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_PEMvuDgVVqJszzT7V-edIA_ZCgacZ0w';
const SUPABASE_TABLE = 'kari_data';   // общая таблица key→jsonb
const SUPABASE_SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';

// Глобальные переменные (совместимость с интерфейсом firebase.js)
let sb = null;                // клиент Supabase
let db = null;                // alias для совместимости
let auth = null;              // alias
let currentUser = null;
let firebaseReady = false;    // имя оставляем для совместимости с app.js/capsules.js
let syncInProgress = false;
let guestMode = false;
let realtimeChannel = null;

// =============================================
// ЗАГРУЗКА SDK
// =============================================
function loadSupabaseSDK() {
    return new Promise((resolve, reject) => {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            return resolve();
        }
        const s = document.createElement('script');
        s.src = SUPABASE_SDK_URL;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Не удалось загрузить Supabase SDK'));
        document.head.appendChild(s);
    });
}

// =============================================
// ИНИЦИАЛИЗАЦИЯ
// =============================================
async function initFirebase() { // имя оставлено для обратной совместимости
    // Гостевой режим
    if (localStorage.getItem('kari-guest-mode') === 'true') {
        console.log('👤 Гостевой режим');
        guestMode = true;
        hideLoginScreen();
        showCloudStatus('offline');
        if (typeof renderCapsules === 'function') setTimeout(renderCapsules, 100);
        return true;
    }

    try {
        await loadSupabaseSDK();
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
        db = sb; auth = sb.auth;

        // Проверяем активную сессию (или ту что пришла из magic link)
        const { data: { session } } = await sb.auth.getSession();
        if (session?.user) {
            currentUser = session.user;
            firebaseReady = true;
            hideLoginScreen();
            showCloudStatus('connected');
            await syncFromCloud();
            subscribeRealtime();
            addLogoutButton();
        } else {
            firebaseReady = true;
            showLoginScreen();
        }

        // Слушаем изменения auth (например magic link)
        sb.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                currentUser = session.user;
                hideLoginScreen();
                showCloudStatus('connected');
                if (event === 'SIGNED_IN') {
                    await syncFromCloud();
                    subscribeRealtime();
                    addLogoutButton();
                }
            } else {
                currentUser = null;
                unsubscribeRealtime();
                showLoginScreen();
            }
        });

        return true;
    } catch (err) {
        console.error('[Supabase] init error:', err);
        showLoginScreen();
        return false;
    }
}

// =============================================
// АВТОРИЗАЦИЯ
// =============================================
async function signIn(email, password) {
    showLoginLoading(true);
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    showLoginLoading(false);
    if (error) {
        showLoginError(error.message || 'Ошибка входа');
        return false;
    }
    currentUser = data.user;
    return true;
}

async function signUp(email, password) {
    showLoginLoading(true);
    const { data, error } = await sb.auth.signUp({ email, password });
    showLoginLoading(false);
    if (error) {
        showLoginError(error.message || 'Ошибка регистрации');
        return false;
    }
    if (data.user && !data.session) {
        showLoginError('Проверьте почту — нужно подтвердить email');
        return false;
    }
    currentUser = data.user;
    return true;
}

async function signInMagicLink(email) {
    if (!email) { showLoginError('Введите email'); return false; }
    showLoginLoading(true, 'Отправляем ссылку...');
    const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + window.location.pathname }
    });
    showLoginLoading(false);
    if (error) { showLoginError(error.message); return false; }
    showLoginError('✉️ Проверьте почту — мы отправили ссылку для входа');
    const errorEl = document.getElementById('loginError');
    if (errorEl) errorEl.style.background = '#D1FAE5', errorEl.style.color = '#059669';
    return true;
}

async function signOut() {
    if (sb) await sb.auth.signOut();
    localStorage.removeItem('kari-guest-mode');
    currentUser = null;
    guestMode = false;
    unsubscribeRealtime();
    location.reload();
}

// =============================================
// UI ВХОДА
// =============================================
function showLoginScreen() {
    const main = document.querySelector('.main');
    const header = document.querySelector('.header');
    if (main) main.style.display = 'none';
    if (header) header.style.display = 'none';

    let loginScreen = document.getElementById('loginScreen');
    if (loginScreen) { loginScreen.style.display = 'flex'; return; }

    loginScreen = document.createElement('div');
    loginScreen.id = 'loginScreen';
    loginScreen.innerHTML = `
        <style>
            #loginScreen { position: fixed; inset: 0; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); display: flex; align-items: center; justify-content: center; z-index: 10000; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
            .login-container { background: white; border-radius: 24px; padding: 48px; width: 100%; max-width: 420px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
            .login-logo { display:flex; align-items:center; justify-content:center; gap:12px; margin-bottom:32px; }
            .login-logo-icon { width:56px; height:56px; background: linear-gradient(135deg,#A03472,#8A2D62); border-radius:16px; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:24px; }
            .login-logo-text h1 { font-size:24px; font-weight:700; color:#111827; margin:0; }
            .login-logo-text span { font-size:13px; color:#6B7280; }
            .login-title { text-align:center; font-size:18px; font-weight:600; color:#374151; margin-bottom:24px; }
            .login-form { display:flex; flex-direction:column; gap:16px; }
            .login-input-group { display:flex; flex-direction:column; gap:8px; }
            .login-label { font-size:14px; font-weight:600; color:#374151; }
            .login-input { padding:14px 16px; border:2px solid #E5E7EB; border-radius:12px; font-size:16px; font-family:inherit; transition:all 0.2s; outline:none; }
            .login-input:focus { border-color:#A03472; box-shadow:0 0 0 4px rgba(160,52,114,0.1); }
            .login-btn { padding:16px; background: linear-gradient(135deg,#A03472,#8A2D62); color:white; border:none; border-radius:12px; font-size:16px; font-weight:600; cursor:pointer; font-family:inherit; margin-top:8px; }
            .login-btn:hover { transform: translateY(-2px); box-shadow:0 8px 20px rgba(160,52,114,0.4); }
            .login-btn:disabled { opacity:0.7; cursor:not-allowed; transform:none; }
            .login-btn-secondary { padding:12px; background:transparent; color:#A03472; border:2px solid #A03472; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; margin-top:4px; }
            .login-btn-secondary:hover { background:#FFF5F0; }
            .login-error { background:#FEE2E2; color:#DC2626; padding:12px 16px; border-radius:10px; font-size:14px; text-align:center; display:none; }
            .login-error.show { display:block; }
            .login-footer { text-align:center; margin-top:24px; font-size:13px; color:#9CA3AF; }
            .guest-btn { width:100%; padding:12px; background:transparent; color:#6B7280; border:2px solid #E5E7EB; border-radius:12px; font-size:14px; font-weight:500; cursor:pointer; font-family:inherit; margin-top:16px; }
            .guest-btn:hover { border-color:#9CA3AF; color:#374151; }
        </style>
        <div class="login-container">
            <div class="login-logo">
                <img src="icons/kari-logo.png" alt="KARI" style="width:56px;height:56px;border-radius:16px;object-fit:contain;">
                <div class="login-logo-text">
                    <h1>KARI Design Hub</h1>
                    <span>Общий workspace команды</span>
                </div>
            </div>
            <div class="login-title" id="loginTitle">Вход в систему</div>
            <div class="login-error" id="loginError"></div>
            <form class="login-form" onsubmit="handleLogin(event)">
                <div class="login-input-group">
                    <label class="login-label">Email</label>
                    <input type="email" class="login-input" id="loginEmail" placeholder="your@kari.com" required>
                </div>
                <div class="login-input-group">
                    <label class="login-label">Пароль</label>
                    <input type="password" class="login-input" id="loginPassword" placeholder="••••••••" required minlength="6">
                </div>
                <button type="submit" class="login-btn" id="loginBtn">Войти</button>
                <button type="button" class="login-btn-secondary" onclick="handleMagicLink()">✉️ Войти по ссылке (без пароля)</button>
            </form>
            <div class="login-toggle" style="text-align:center;margin-top:16px;">
                <span id="loginToggleText" style="font-size:14px;color:#6B7280;">Нет аккаунта? </span>
                <a href="#" id="loginToggleLink" onclick="toggleLoginMode(event)" style="font-size:14px;color:#A03472;font-weight:600;text-decoration:none;">Зарегистрироваться</a>
            </div>
            <div class="login-footer">🔒 Защищено Supabase Auth</div>
            <button type="button" class="guest-btn" onclick="enterGuestMode()">Продолжить без облака (локально)</button>
        </div>
    `;
    document.body.appendChild(loginScreen);
}

function hideLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const main = document.querySelector('.main');
    const header = document.querySelector('.header');
    if (loginScreen) loginScreen.style.display = 'none';
    if (main) main.style.display = 'block';
    if (header) header.style.display = 'block';

    // Устанавливаем инициалы пользователя в аватар
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) {
        let initials = '👤';
        if (currentUser && currentUser.email) {
            const name = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
            const parts = name.trim().split(/[\s._-]+/);
            if (parts.length >= 2) {
                initials = (parts[0][0] + parts[1][0]).toUpperCase();
            } else if (parts[0]) {
                initials = parts[0].substring(0, 2).toUpperCase();
            }
        } else if (guestMode) {
            initials = '👤';
        }
        avatarEl.textContent = initials;
    }
}

function showLoginError(message) {
    const errorEl = document.getElementById('loginError');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
        errorEl.style.background = '#FEE2E2';
        errorEl.style.color = '#DC2626';
    }
}

function showLoginLoading(loading, text) {
    const btn = document.getElementById('loginBtn');
    if (btn) {
        btn.disabled = loading;
        btn.textContent = loading ? (text || (loginMode === 'register' ? 'Регистрация...' : 'Вход...')) : (loginMode === 'register' ? 'Зарегистрироваться' : 'Войти');
    }
}

let loginMode = 'login';
function toggleLoginMode(e) {
    if (e) e.preventDefault();
    const errorEl = document.getElementById('loginError');
    if (errorEl) errorEl.classList.remove('show');
    if (loginMode === 'login') {
        loginMode = 'register';
        document.getElementById('loginTitle').textContent = 'Регистрация';
        document.getElementById('loginBtn').textContent = 'Зарегистрироваться';
        document.getElementById('loginToggleText').textContent = 'Уже есть аккаунт? ';
        document.getElementById('loginToggleLink').textContent = 'Войти';
    } else {
        loginMode = 'login';
        document.getElementById('loginTitle').textContent = 'Вход в систему';
        document.getElementById('loginBtn').textContent = 'Войти';
        document.getElementById('loginToggleText').textContent = 'Нет аккаунта? ';
        document.getElementById('loginToggleLink').textContent = 'Зарегистрироваться';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    if (errorEl) errorEl.classList.remove('show');
    if (loginMode === 'register') await signUp(email, password);
    else await signIn(email, password);
}

async function handleMagicLink() {
    const email = document.getElementById('loginEmail').value.trim();
    const errorEl = document.getElementById('loginError');
    if (errorEl) errorEl.classList.remove('show');
    await signInMagicLink(email);
}

// =============================================
// КНОПКА ВЫХОДА
// =============================================
function addLogoutButton() {
    const userMenu = document.querySelector('.user-menu');
    if (!userMenu || document.getElementById('logoutBtn')) return;
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logoutBtn';
    logoutBtn.innerHTML = '🚪';
    logoutBtn.title = currentUser ? `Выйти (${currentUser.email})` : 'Выйти';
    logoutBtn.style.cssText = 'background:none;border:none;font-size:20px;cursor:pointer;padding:8px;border-radius:8px;transition:background 0.2s;';
    logoutBtn.onmouseover = () => logoutBtn.style.background = '#F3F4F6';
    logoutBtn.onmouseout = () => logoutBtn.style.background = 'none';
    logoutBtn.onclick = signOut;
    userMenu.insertBefore(logoutBtn, userMenu.firstChild);
}

// =============================================
// ХРАНЕНИЕ В ОБЛАКЕ
// =============================================
// Используем одну таблицу kari_data (key text PK, value jsonb, updated_at, updated_by)
// Ключи: 'capsules', 'items', 'palettes', 'prompts'
async function saveToCloud(collection, docId, data) {
    if (!firebaseReady || !sb || !currentUser) return false;
    try {
        const key = docId; // docId == 'capsules' / 'items' / 'palettes' / 'prompts'
        const { error } = await sb.from(SUPABASE_TABLE).upsert({
            key,
            value: data,
            updated_at: new Date().toISOString(),
            updated_by: currentUser.email || currentUser.id
        }, { onConflict: 'key' });
        if (error) throw error;
        showCloudStatus('synced');
        return true;
    } catch (err) {
        console.error('[Supabase] save error:', err);
        showCloudStatus('error');
        return false;
    }
}

async function loadFromCloud(collection, docId) {
    if (!firebaseReady || !sb || !currentUser) return null;
    try {
        const { data, error } = await sb.from(SUPABASE_TABLE).select('value').eq('key', docId).maybeSingle();
        if (error) throw error;
        return data ? data.value : null;
    } catch (err) {
        console.error('[Supabase] load error:', err);
        return null;
    }
}

// =============================================
// СИНХРОНИЗАЦИЯ
// =============================================
async function syncFromCloud() {
    if (!firebaseReady || syncInProgress || !currentUser) return;
    syncInProgress = true;
    showCloudStatus('syncing');
    try {
        // Капсулы
        const cloudCapsules = await loadFromCloud('data', 'capsules');
        if (cloudCapsules && cloudCapsules.items) {
            const localCapsules = JSON.parse(localStorage.getItem('kari-capsules') || '[]');
            const merged = mergeData(localCapsules, cloudCapsules.items, 'id');
            localStorage.setItem('kari-capsules', JSON.stringify(merged));
        }
        // Артикулы
        const cloudItems = await loadFromCloud('data', 'items');
        if (cloudItems && cloudItems.data) {
            const localItems = JSON.parse(localStorage.getItem('kari-items') || '{}');
            const merged = mergeItemsData(localItems, cloudItems.data);
            localStorage.setItem('kari-items', JSON.stringify(merged));
        }
        // Палитры
        const cloudPalettes = await loadFromCloud('data', 'palettes');
        if (cloudPalettes && cloudPalettes.items) {
            const localPalettes = JSON.parse(localStorage.getItem('kari-palettes') || '[]');
            const merged = mergeData(localPalettes, cloudPalettes.items, 'id');
            localStorage.setItem('kari-palettes', JSON.stringify(merged));
        }
        // Промпты
        const cloudPrompts = await loadFromCloud('data', 'prompts');
        if (cloudPrompts && cloudPrompts.items) {
            const localPrompts = JSON.parse(localStorage.getItem('kari-prompts') || '[]');
            const merged = mergeData(localPrompts, cloudPrompts.items, 'id');
            localStorage.setItem('kari-prompts', JSON.stringify(merged));
        }
        showCloudStatus('connected');
        if (typeof renderCapsules === 'function') renderCapsules();
    } catch (err) {
        console.error('[Supabase] syncFromCloud error:', err);
        showCloudStatus('error');
    } finally {
        syncInProgress = false;
    }
    // При первом входе — пушим локальные данные в облако (миграция). ВНЕ syncInProgress.
    try { await syncToCloud(); } catch(e) { console.error('[Supabase] migration push error:', e); }
}

async function syncToCloud() {
    if (!firebaseReady || syncInProgress || !currentUser) return;
    syncInProgress = true;
    showCloudStatus('syncing');
    try {
        const capsules = JSON.parse(localStorage.getItem('kari-capsules') || '[]');
        await saveToCloud('data', 'capsules', { items: capsules });

        const items = JSON.parse(localStorage.getItem('kari-items') || '{}');
        await saveToCloud('data', 'items', { data: items });

        const palettes = JSON.parse(localStorage.getItem('kari-palettes') || '[]');
        await saveToCloud('data', 'palettes', { items: palettes });

        const prompts = JSON.parse(localStorage.getItem('kari-prompts') || '[]');
        await saveToCloud('data', 'prompts', { items: prompts });

        showCloudStatus('connected');
    } catch (err) {
        console.error('[Supabase] syncToCloud error:', err);
        showCloudStatus('error');
    } finally {
        syncInProgress = false;
    }
}

// =============================================
// REALTIME — подписка на изменения от других пользователей
// =============================================
function subscribeRealtime() {
    if (!sb || realtimeChannel) return;
    realtimeChannel = sb
        .channel('kari-data-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: SUPABASE_TABLE }, (payload) => {
            // Игнорируем свои же изменения (проверка по updated_by)
            if (payload.new && currentUser && payload.new.updated_by === (currentUser.email || currentUser.id)) return;
            console.log('☁️ Изменение от другого пользователя:', payload.new?.key);
            // Дебаунс — чтобы не грузить при пачке изменений
            clearTimeout(window._realtimeReloadTimeout);
            window._realtimeReloadTimeout = setTimeout(async () => {
                await pullFromCloudOnly();
                if (typeof renderCapsules === 'function') renderCapsules();
                if (typeof renderPalettes === 'function') renderPalettes();
                if (typeof showToast === 'function') showToast('☁️ Данные обновлены коллегой', 'success');
            }, 800);
        })
        .subscribe();
}

function unsubscribeRealtime() {
    if (realtimeChannel && sb) {
        sb.removeChannel(realtimeChannel);
        realtimeChannel = null;
    }
}

// Чистая загрузка из облака без merge (для realtime-обновлений)
async function pullFromCloudOnly() {
    const capsules = await loadFromCloud('data', 'capsules');
    if (capsules?.items) localStorage.setItem('kari-capsules', JSON.stringify(capsules.items));

    const items = await loadFromCloud('data', 'items');
    if (items?.data) localStorage.setItem('kari-items', JSON.stringify(items.data));

    const palettes = await loadFromCloud('data', 'palettes');
    if (palettes?.items) localStorage.setItem('kari-palettes', JSON.stringify(palettes.items));

    const prompts = await loadFromCloud('data', 'prompts');
    if (prompts?.items) localStorage.setItem('kari-prompts', JSON.stringify(prompts.items));
}

// =============================================
// MERGE ЛОГИКА (из firebase.js)
// =============================================
function mergeData(localArray, cloudArray, keyField = 'id') {
    const merged = new Map();
    cloudArray.forEach(item => { if (item && item[keyField]) merged.set(item[keyField], item); });
    localArray.forEach(item => {
        if (!item || !item[keyField]) return;
        const existing = merged.get(item[keyField]);
        if (!existing) { merged.set(item[keyField], item); return; }
        const localDate = new Date(item.updatedAt || 0);
        const cloudDate = new Date(existing.updatedAt || 0);
        if (localDate >= cloudDate) merged.set(item[keyField], item);
    });
    return Array.from(merged.values());
}

function mergeItemsData(localItems, cloudItems) {
    const merged = { ...cloudItems };
    Object.keys(localItems).forEach(capsuleId => {
        if (!merged[capsuleId]) merged[capsuleId] = localItems[capsuleId];
        else merged[capsuleId] = mergeData(localItems[capsuleId] || [], merged[capsuleId] || [], 'id');
    });
    return merged;
}

// =============================================
// CLOUD STATUS INDICATOR
// =============================================
function showCloudStatus(status) {
    let indicator = document.getElementById('cloudStatusIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'cloudStatusIndicator';
        indicator.style.cssText = 'position:fixed;bottom:20px;left:20px;padding:8px 16px;border-radius:20px;font-size:12px;font-weight:500;display:flex;align-items:center;gap:8px;z-index:9999;transition:all 0.3s ease;cursor:pointer;font-family:"Plus Jakarta Sans",sans-serif;';
        document.body.appendChild(indicator);
    }
    const statuses = {
        connected: { bg: '#D1FAE5', color: '#059669', icon: '☁️', text: currentUser ? currentUser.email.split('@')[0] : 'Облако' },
        syncing:   { bg: '#DBEAFE', color: '#2563EB', icon: '🔄', text: 'Синхронизация...' },
        synced:    { bg: '#D1FAE5', color: '#059669', icon: '✔',  text: 'Сохранено' },
        offline:   { bg: '#FEF3C7', color: '#D97706', icon: '⚡', text: 'Локально (войти в облако)' },
        error:     { bg: '#FEE2E2', color: '#DC2626', icon: '⚠️', text: 'Ошибка синхронизации' }
    };
    if (status === 'offline') {
        indicator.onclick = () => exitGuestMode();
        indicator.title = 'Нажмите чтобы войти в облако';
    } else {
        indicator.onclick = () => syncToCloud();
        indicator.title = 'Нажмите для синхронизации';
    }
    const s = statuses[status] || statuses.offline;
    indicator.style.background = s.bg;
    indicator.style.color = s.color;
    indicator.innerHTML = `${s.icon} ${s.text}`;
}

// =============================================
// ГОСТЕВОЙ РЕЖИМ
// =============================================
function enterGuestMode() {
    localStorage.setItem('kari-guest-mode', 'true');
    guestMode = true;
    hideLoginScreen();
    showCloudStatus('offline');
    if (typeof renderCapsules === 'function') setTimeout(renderCapsules, 100);
}

function exitGuestMode() {
    localStorage.removeItem('kari-guest-mode');
    guestMode = false;
    location.reload();
}

async function forceSync() {
    await syncFromCloud();
}

// =============================================
// АВТО-СИНХ ПРИ ИЗМЕНЕНИЯХ В ДРУГИХ ВКЛАДКАХ
// =============================================
window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('kari-') && currentUser) {
        clearTimeout(window.syncTimeout);
        window.syncTimeout = setTimeout(syncToCloud, 2000);
    }
});

window.addEventListener('beforeunload', () => {
    // best-effort финальный синх
    if (currentUser && !syncInProgress) {
        try { syncToCloud(); } catch(e) {}
    }
});

// =============================================
// ГЛОБАЛЬНЫЕ ЭКСПОРТЫ (совместимость с firebase.js)
// =============================================
window.initFirebase = initFirebase;
window.syncToCloud = syncToCloud;
window.syncFromCloud = syncFromCloud;
window.forceSync = forceSync;
window.saveToCloud = saveToCloud;
window.loadFromCloud = loadFromCloud;
window.signIn = signIn;
window.signUp = signUp;
window.signOut = signOut;
window.signInMagicLink = signInMagicLink;
window.handleLogin = handleLogin;
window.handleMagicLink = handleMagicLink;
window.toggleLoginMode = toggleLoginMode;
window.mergeData = mergeData;
window.mergeItemsData = mergeItemsData;
window.exitGuestMode = exitGuestMode;
window.enterGuestMode = enterGuestMode;
window.showCloudStatus = showCloudStatus;

// =============================================
// STORAGE — загрузка картинок прототипов
// =============================================
async function uploadPrototypeImage(file) {
    if (!sb || !currentUser) throw new Error('Нужно войти в облако');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const { error } = await sb.storage.from('prototypes').upload(path, file, {
        cacheControl: '3600', upsert: false, contentType: file.type
    });
    if (error) throw error;
    const { data } = sb.storage.from('prototypes').getPublicUrl(path);
    return { path, url: data.publicUrl };
}

async function deletePrototypeImage(path) {
    if (!sb || !path) return;
    try { await sb.storage.from('prototypes').remove([path]); } catch(e){ console.warn(e); }
}

Object.defineProperty(window, 'currentUser', { get: () => currentUser, configurable: true });
window.uploadPrototypeImage = uploadPrototypeImage;
window.deletePrototypeImage = deletePrototypeImage;

// Автозапуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initFirebase, 300));
} else {
    setTimeout(initFirebase, 300);
}
