// =============================================
// KARI Design Hub — Firebase Integration v2.0
// С авторизацией
// =============================================

// Firebase конфигурация
const firebaseConfig = {
    apiKey: "AIzaSyBHVoOySNxgNPhQcr08AH2axUj4wjHOouQ",
    authDomain: "kari-design-hub.firebaseapp.com",
    projectId: "kari-design-hub",
    storageBucket: "kari-design-hub.firebasestorage.app",
    messagingSenderId: "517848131782",
    appId: "1:517848131782:web:7adec02deb4a66a64c8fc7"
};

// Глобальные переменные
let db = null;
let auth = null;
let currentUser = null;
let firebaseReady = false;
let syncInProgress = false;

// =============================================
// ИНИЦИАЛИЗАЦИЯ FIREBASE
// =============================================
let guestMode = false;

async function initFirebase() {
    // Проверяем сохранённый гостевой режим
    if (localStorage.getItem('kari-guest-mode') === 'true') {
        console.log('👤 Продолжаем в гостевом режиме');
        guestMode = true;
        hideLoginScreen();
        showCloudStatus('offline');
        if (typeof renderCapsules === 'function') {
            setTimeout(renderCapsules, 100);
        }
        return true;
    }

    // Инициализируем Firebase
    try {
        await loadFirebaseSDK();

        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        db = firebase.firestore();
        auth = firebase.auth();

        try {
            await db.enablePersistence({ synchronizeTabs: true });
            console.log('✅ Firestore offline persistence enabled');
        } catch (err) {
            if (err.code === 'failed-precondition') {
                console.warn('⚠️ Persistence failed: Multiple tabs open');
            } else if (err.code === 'unimplemented') {
                console.warn('⚠️ Persistence not supported in this browser');
            }
        }

        firebaseReady = true;
        console.log('✅ Firebase initialized successfully');

        auth.onAuthStateChanged(handleAuthStateChanged);

        return true;

    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        showLoginScreen();
        return false;
    }
}

// Загрузка Firebase SDK
function loadFirebaseSDK() {
    return new Promise((resolve, reject) => {
        if (typeof firebase !== 'undefined') {
            resolve();
            return;
        }
        
        const scripts = [
            'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
            'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js',
            'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js'
        ];
        
        let loaded = 0;
        scripts.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                loaded++;
                if (loaded === scripts.length) resolve();
            };
            script.onerror = () => reject(new Error('Failed to load Firebase SDK'));
            document.head.appendChild(script);
        });
    });
}

// =============================================
// АВТОРИЗАЦИЯ
// =============================================

// Обработчик изменения состояния авторизации
function handleAuthStateChanged(user) {
    if (user) {
        // Пользователь вошёл
        currentUser = user;
        console.log('✅ User signed in:', user.email);
        hideLoginScreen();
        showCloudStatus('connected');
        syncFromCloud();
    } else {
        // Пользователь не авторизован
        currentUser = null;
        console.log('👤 User signed out');
        showLoginScreen();
    }
}

// Вход по email/password
async function signIn(email, password) {
    try {
        showLoginLoading(true);
        await auth.signInWithEmailAndPassword(email, password);
        return { success: true };
    } catch (error) {
        console.error('Sign in error:', error);
        let message = 'Ошибка входа';
        if (error.code === 'auth/user-not-found') {
            message = 'Пользователь не найден';
        } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            message = 'Неверный пароль';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Неверный email';
        } else if (error.code === 'auth/too-many-requests') {
            message = 'Слишком много попыток. Подождите.';
        }
        showLoginError(message);
        return { success: false, error: message };
    } finally {
        showLoginLoading(false);
    }
}

// Регистрация нового пользователя
async function signUp(email, password) {
    try {
        showLoginLoading(true);
        await auth.createUserWithEmailAndPassword(email, password);
        return { success: true };
    } catch (error) {
        console.error('Sign up error:', error);
        let message = 'Ошибка регистрации';
        if (error.code === 'auth/email-already-in-use') {
            message = 'Этот email уже зарегистрирован';
        } else if (error.code === 'auth/weak-password') {
            message = 'Пароль слишком слабый (мин. 6 символов)';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Неверный email';
        }
        showLoginError(message);
        return { success: false, error: message };
    } finally {
        showLoginLoading(false);
    }
}

// Выход с принудительным сохранением
async function signOut() {
    try {
        // КРИТИЧНО: Сохраняем все данные перед выходом
        showToast('Сохранение данных...', 'success');
        
        // Принудительная синхронизация в облако
        syncInProgress = false; // Сбрасываем флаг чтобы гарантировать синхронизацию
        await syncToCloud();
        
        // Небольшая задержка для завершения записи
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await auth.signOut();
        showToast('Вы вышли из системы', 'success');
    } catch (error) {
        console.error('Sign out error:', error);
        // Даже при ошибке синхронизации позволяем выйти
        try {
            await auth.signOut();
        } catch (e) {
            console.error('Force sign out error:', e);
        }
    }
}

// =============================================
// UI АВТОРИЗАЦИИ
// =============================================

// Показать экран входа
function showLoginScreen() {
    // Скрываем основной контент
    const main = document.querySelector('.main');
    const header = document.querySelector('.header');
    if (main) main.style.display = 'none';
    if (header) header.style.display = 'none';
    
    // Проверяем есть ли уже экран входа
    let loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
        loginScreen.style.display = 'flex';
        return;
    }
    
    // Создаём экран входа
    loginScreen = document.createElement('div');
    loginScreen.id = 'loginScreen';
    loginScreen.innerHTML = `
        <style>
            #loginScreen {
                position: fixed;
                inset: 0;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .login-container {
                background: white;
                border-radius: 24px;
                padding: 48px;
                width: 100%;
                max-width: 420px;
                box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
            }
            .login-logo {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                margin-bottom: 32px;
            }
            .login-logo-icon {
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, #E8601C, #D4540F);
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 700;
                font-size: 24px;
            }
            .login-logo-text h1 {
                font-size: 24px;
                font-weight: 700;
                color: #111827;
                margin: 0;
            }
            .login-logo-text span {
                font-size: 13px;
                color: #6B7280;
            }
            .login-title {
                text-align: center;
                font-size: 18px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 32px;
            }
            .login-form {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .login-input-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .login-label {
                font-size: 14px;
                font-weight: 600;
                color: #374151;
            }
            .login-input {
                padding: 14px 16px;
                border: 2px solid #E5E7EB;
                border-radius: 12px;
                font-size: 16px;
                font-family: inherit;
                transition: all 0.2s;
                outline: none;
            }
            .login-input:focus {
                border-color: #E8601C;
                box-shadow: 0 0 0 4px rgba(232, 96, 28, 0.1);
            }
            .login-btn {
                padding: 16px;
                background: linear-gradient(135deg, #E8601C, #D4540F);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                font-family: inherit;
                margin-top: 8px;
            }
            .login-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(232, 96, 28, 0.4);
            }
            .login-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none;
            }
            .login-error {
                background: #FEE2E2;
                color: #DC2626;
                padding: 12px 16px;
                border-radius: 10px;
                font-size: 14px;
                text-align: center;
                display: none;
            }
            .login-error.show {
                display: block;
            }
            .login-footer {
                text-align: center;
                margin-top: 24px;
                font-size: 13px;
                color: #9CA3AF;
            }
        </style>
        <div class="login-container">
            <div class="login-logo">
                <div class="login-logo-icon">K</div>
                <div class="login-logo-text">
                    <h1>KARI Design Hub</h1>
                    <span>Pipeline Management v2.1</span>
                </div>
            </div>
            
            <div class="login-title" id="loginTitle">Вход в систему</div>

            <div class="login-error" id="loginError"></div>

            <form class="login-form" onsubmit="handleLogin(event)">
                <div class="login-input-group">
                    <label class="login-label">Email</label>
                    <input type="email" class="login-input" id="loginEmail" placeholder="your@email.com" required>
                </div>
                <div class="login-input-group">
                    <label class="login-label">Пароль</label>
                    <input type="password" class="login-input" id="loginPassword" placeholder="••••••••" required>
                </div>
                <button type="submit" class="login-btn" id="loginBtn">Войти</button>
            </form>

            <div class="login-toggle" style="text-align:center;margin-top:16px;">
                <span id="loginToggleText" style="font-size:14px;color:#6B7280;">Нет аккаунта? </span>
                <a href="#" id="loginToggleLink" onclick="toggleLoginMode(event)" style="font-size:14px;color:#E8601C;font-weight:600;text-decoration:none;">Зарегистрироваться</a>
            </div>

            <div class="login-footer">
                🔒 Защищено Firebase Authentication
            </div>

            <button type="button" class="guest-btn" onclick="enterGuestMode()">
                Продолжить без облака
            </button>
        </div>
        <style>
            .guest-btn {
                width: 100%;
                padding: 12px;
                background: transparent;
                color: #6B7280;
                border: 2px solid #E5E7EB;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                font-family: inherit;
                margin-top: 16px;
            }
            .guest-btn:hover {
                border-color: #9CA3AF;
                color: #374151;
            }
        </style>
    `;
    document.body.appendChild(loginScreen);
}

// Скрыть экран входа
function hideLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const main = document.querySelector('.main');
    const header = document.querySelector('.header');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (main) main.style.display = 'block';
    if (header) header.style.display = 'block';
}

// Показать ошибку входа
function showLoginError(message) {
    const errorEl = document.getElementById('loginError');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }
}

// Показать/скрыть загрузку
function showLoginLoading(loading) {
    const btn = document.getElementById('loginBtn');
    if (btn) {
        btn.disabled = loading;
        btn.textContent = loading ? 'Вход...' : 'Войти';
    }
}

// Режим формы: 'login' или 'register'
let loginMode = 'login';

// Переключение между входом и регистрацией
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

// Обработчик формы входа
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Скрываем предыдущую ошибку
    const errorEl = document.getElementById('loginError');
    if (errorEl) errorEl.classList.remove('show');

    if (loginMode === 'register') {
        await signUp(email, password);
    } else {
        await signIn(email, password);
    }
}

// =============================================
// КНОПКА ВЫХОДА В HEADER
// =============================================
function addLogoutButton() {
    const userMenu = document.querySelector('.user-menu');
    if (!userMenu || document.getElementById('logoutBtn')) return;
    
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logoutBtn';
    logoutBtn.innerHTML = '🚪';
    logoutBtn.title = 'Выйти';
    logoutBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: background 0.2s;
    `;
    logoutBtn.onmouseover = () => logoutBtn.style.background = '#F3F4F6';
    logoutBtn.onmouseout = () => logoutBtn.style.background = 'none';
    logoutBtn.onclick = signOut;
    
    userMenu.insertBefore(logoutBtn, userMenu.firstChild);
}

// =============================================
// СИНХРОНИЗАЦИЯ С ОБЛАКОМ
// =============================================

// Сохранить данные в облако
async function saveToCloud(collection, docId, data) {
    if (!firebaseReady || !db || !currentUser) {
        console.warn('Firebase not ready or user not signed in');
        return false;
    }
    
    try {
        await db.collection(collection).doc(docId).set({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: currentUser.email
        }, { merge: true });
        
        console.log(`☁️ Saved to cloud: ${collection}/${docId}`);
        showCloudStatus('synced');
        return true;
        
    } catch (error) {
        console.error('Cloud save error:', error);
        showCloudStatus('error');
        return false;
    }
}

// Загрузить данные из облака
async function loadFromCloud(collection, docId) {
    if (!firebaseReady || !db || !currentUser) {
        return null;
    }
    
    try {
        const doc = await db.collection(collection).doc(docId).get();
        if (doc.exists) {
            return doc.data();
        }
        return null;
        
    } catch (error) {
        console.error('Cloud load error:', error);
        return null;
    }
}

// Полная синхронизация из облака
async function syncFromCloud() {
    if (!firebaseReady || syncInProgress || !currentUser) return;
    
    syncInProgress = true;
    showCloudStatus('syncing');
    
    try {
        console.log('🔄 Syncing from cloud...');
        
        // Загружаем капсулы с умным слиянием
        const cloudCapsules = await loadFromCloud('data', 'capsules');
        if (cloudCapsules && cloudCapsules.items) {
            const localCapsules = JSON.parse(localStorage.getItem('kari-capsules') || '[]');
            const mergedCapsules = mergeData(localCapsules, cloudCapsules.items, 'id');
            localStorage.setItem('kari-capsules', JSON.stringify(mergedCapsules));
            console.log(`☁️ Merged capsules: ${mergedCapsules.length} total`);
        }
        
        // Загружаем артикулы с умным слиянием
        const cloudItems = await loadFromCloud('data', 'items');
        if (cloudItems && cloudItems.data) {
            const localItems = JSON.parse(localStorage.getItem('kari-items') || '{}');
            const mergedItems = mergeItemsData(localItems, cloudItems.data);
            localStorage.setItem('kari-items', JSON.stringify(mergedItems));
            console.log('☁️ Merged items from cloud');
        }
        
        // Загружаем палитры с умным слиянием
        const cloudPalettes = await loadFromCloud('data', 'palettes');
        if (cloudPalettes && cloudPalettes.items) {
            const localPalettes = JSON.parse(localStorage.getItem('kari-palettes') || '[]');
            const mergedPalettes = mergeData(localPalettes, cloudPalettes.items, 'id');
            localStorage.setItem('kari-palettes', JSON.stringify(mergedPalettes));
            console.log(`☁️ Merged palettes: ${mergedPalettes.length} total`);
        }
        
        // Загружаем промпты с умным слиянием
        const cloudPrompts = await loadFromCloud('data', 'prompts');
        if (cloudPrompts && cloudPrompts.items) {
            const localPrompts = JSON.parse(localStorage.getItem('kari-prompts') || '[]');
            const mergedPrompts = mergeData(localPrompts, cloudPrompts.items, 'id');
            localStorage.setItem('kari-prompts', JSON.stringify(mergedPrompts));
            console.log(`☁️ Merged prompts: ${mergedPrompts.length} total`);
        }
        
        showCloudStatus('connected');
        console.log('✅ Sync from cloud complete');
        
        // Обновляем UI
        if (typeof renderCapsules === 'function') {
            renderCapsules();
        }
        
        // Добавляем кнопку выхода
        addLogoutButton();
        
    } catch (error) {
        console.error('Sync from cloud error:', error);
        showCloudStatus('error');
    } finally {
        syncInProgress = false;
    }
}

// Умное слияние массивов по ключу (для капсул, палитр, промптов)
function mergeData(localArray, cloudArray, keyField = 'id') {
    const merged = new Map();
    
    // Сначала добавляем облачные данные
    cloudArray.forEach(item => {
        if (item && item[keyField]) {
            merged.set(item[keyField], item);
        }
    });
    
    // Затем локальные - они перезаписывают облачные если новее
    localArray.forEach(item => {
        if (item && item[keyField]) {
            const existing = merged.get(item[keyField]);
            if (!existing) {
                // Новый локальный элемент - добавляем
                merged.set(item[keyField], item);
            } else {
                // Сравниваем по updatedAt
                const localDate = new Date(item.updatedAt || 0);
                const cloudDate = new Date(existing.updatedAt || 0);
                if (localDate >= cloudDate) {
                    merged.set(item[keyField], item);
                }
            }
        }
    });
    
    return Array.from(merged.values());
}

// Умное слияние объектов артикулов (по capsuleId)
function mergeItemsData(localItems, cloudItems) {
    const merged = { ...cloudItems };
    
    Object.keys(localItems).forEach(capsuleId => {
        if (!merged[capsuleId]) {
            // Новая капсула локально - добавляем
            merged[capsuleId] = localItems[capsuleId];
        } else {
            // Объединяем артикулы этой капсулы
            merged[capsuleId] = mergeData(
                localItems[capsuleId] || [], 
                merged[capsuleId] || [], 
                'id'
            );
        }
    });
    
    return merged;
}

// Синхронизация в облако
async function syncToCloud() {
    if (!firebaseReady || syncInProgress || !currentUser) return;
    
    syncInProgress = true;
    showCloudStatus('syncing');
    
    try {
        console.log('🔄 Syncing to cloud...');
        
        // Сохраняем капсулы
        const capsules = JSON.parse(localStorage.getItem('kari-capsules') || '[]');
        await saveToCloud('data', 'capsules', { items: capsules });
        
        // Сохраняем артикулы
        const items = JSON.parse(localStorage.getItem('kari-items') || '{}');
        await saveToCloud('data', 'items', { data: items });
        
        // Сохраняем палитры
        const palettes = JSON.parse(localStorage.getItem('kari-palettes') || '[]');
        await saveToCloud('data', 'palettes', { items: palettes });
        
        // Сохраняем промпты
        const prompts = JSON.parse(localStorage.getItem('kari-prompts') || '[]');
        await saveToCloud('data', 'prompts', { items: prompts });
        
        showCloudStatus('connected');
        console.log('✅ Sync to cloud complete');
        
    } catch (error) {
        console.error('Sync to cloud error:', error);
        showCloudStatus('error');
    } finally {
        syncInProgress = false;
    }
}

// =============================================
// UI ИНДИКАТОР СТАТУСА ОБЛАКА
// =============================================
function showCloudStatus(status) {
    let indicator = document.getElementById('cloudStatusIndicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'cloudStatusIndicator';
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 9999;
            transition: all 0.3s ease;
            cursor: pointer;
            font-family: 'Plus Jakarta Sans', sans-serif;
        `;
        indicator.onclick = () => syncToCloud();
        indicator.title = 'Нажмите для синхронизации';
        document.body.appendChild(indicator);
    }
    
    const statuses = {
        connected: { bg: '#D1FAE5', color: '#059669', icon: '☁️', text: currentUser ? currentUser.email.split('@')[0] : 'Облако' },
        syncing: { bg: '#DBEAFE', color: '#2563EB', icon: '🔄', text: 'Синхронизация...' },
        synced: { bg: '#D1FAE5', color: '#059669', icon: '✔', text: 'Сохранено' },
        offline: { bg: '#FEF3C7', color: '#D97706', icon: '⚡', text: 'Локально (войти в облако)' },
        error: { bg: '#FEE2E2', color: '#DC2626', icon: '⚠️', text: 'Ошибка синхронизации' }
    };

    // Для офлайн режима меняем обработчик клика
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
    
    // Автоматически возвращаем к "connected" через 3 секунды
    if (status === 'synced') {
        setTimeout(() => showCloudStatus('connected'), 3000);
    }
}

// =============================================
// АВТОСИНХРОНИЗАЦИЯ
// =============================================

// Синхронизация при изменениях в localStorage
window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('kari-') && currentUser) {
        console.log('📝 Local storage changed:', e.key);
        clearTimeout(window.syncTimeout);
        window.syncTimeout = setTimeout(syncToCloud, 2000);
    }
});

// Синхронизация при закрытии страницы
window.addEventListener('beforeunload', () => {
    if (firebaseReady && currentUser) {
        syncToCloud();
    }
});

// Синхронизация при возврате на страницу
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && firebaseReady && currentUser) {
        syncFromCloud();
    }
});

// =============================================
// РУЧНАЯ СИНХРОНИЗАЦИЯ
// =============================================
async function forceSync() {
    if (!currentUser) {
        showToast('Сначала войдите в систему', 'error');
        return;
    }
    showToast('Синхронизация...', 'success');
    await syncToCloud();
    await syncFromCloud();
    showToast('Синхронизация завершена', 'success');

    if (typeof renderCapsules === 'function') {
        renderCapsules();
    }
}

// Выход из гостевого режима (для входа в облако)
function exitGuestMode() {
    localStorage.removeItem('kari-guest-mode');
    guestMode = false;
    showLoginScreen();
    showToast('Войдите для синхронизации с облаком', 'success');
}

// Вход в гостевой режим (без облака)
function enterGuestMode() {
    localStorage.setItem('kari-guest-mode', 'true');
    guestMode = true;
    hideLoginScreen();
    showCloudStatus('offline');
    if (typeof renderCapsules === 'function') {
        setTimeout(renderCapsules, 100);
    }
}

// Экспорт в глобальную область
window.initFirebase = initFirebase;
window.syncToCloud = syncToCloud;
window.syncFromCloud = syncFromCloud;
window.forceSync = forceSync;
window.saveToCloud = saveToCloud;
window.loadFromCloud = loadFromCloud;
window.signIn = signIn;
window.signUp = signUp;
window.signOut = signOut;
window.handleLogin = handleLogin;
window.toggleLoginMode = toggleLoginMode;
window.mergeData = mergeData;
window.mergeItemsData = mergeItemsData;
window.exitGuestMode = exitGuestMode;
window.enterGuestMode = enterGuestMode;
window.guestMode = guestMode;

// =============================================
// АВТОИНИЦИАЛИЗАЦИЯ
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initFirebase, 300);
});

console.log('🔐 Firebase Auth module loaded');
