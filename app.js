// =============================================
// KARI Design Hub - Core Application
// =============================================

// Storage Keys (глобальные для доступа из других модулей)
const STORAGE_KEY = 'kari-capsules';
const ITEMS_STORAGE_KEY = 'kari-items';
window.STORAGE_KEY = STORAGE_KEY;
window.ITEMS_STORAGE_KEY = ITEMS_STORAGE_KEY;

// =============================================
// DEMO DATA
// =============================================
const demoCapsules = [
    {
        id: 'aw26-signal-boys',
        name: 'SIGNAL Urban',
        season: 'AW26',
        targetGroup: 'kids',
        ageRange: '8-12',
        gender: 'boys',
        description: 'Городская коллекция с акцентом на функциональность.',
        categories: { jackets: 8, hoodies: 12, pants: 10, tshirts: 6, accessories: 6, shoes: 0 },
        paletteId: 'aw26-signal',
        priceSegment: 'standard',
        status: 'active',
        totalItems: 42,
        itemsByStatus: { brief: 10, prompt: 8, generation: 12, review: 8, approved: 4 },
        createdAt: '2024-12-20T10:00:00Z',
        updatedAt: '2024-12-24T14:30:00Z'
    },
    {
        id: 'aw26-signal-girls',
        name: 'SIGNAL Bloom',
        season: 'AW26',
        targetGroup: 'kids',
        ageRange: '8-12',
        gender: 'girls',
        description: 'Женская версия SIGNAL.',
        categories: { jackets: 6, hoodies: 10, pants: 8, tshirts: 8, accessories: 8, shoes: 0 },
        paletteId: 'aw26-signal',
        priceSegment: 'standard',
        status: 'review',
        totalItems: 40,
        itemsByStatus: { brief: 0, prompt: 2, generation: 4, review: 20, approved: 14 },
        createdAt: '2024-12-18T09:00:00Z',
        updatedAt: '2024-12-24T11:00:00Z'
    },
    {
        id: 'ss26-sandals',
        name: 'Summer Steps',
        season: 'SS26',
        targetGroup: 'kids',
        ageRange: '4-12',
        gender: 'unisex',
        description: 'Летняя обувь.',
        categories: { jackets: 0, hoodies: 0, pants: 0, tshirts: 0, accessories: 4, shoes: 36 },
        paletteId: 'ss26-fresh',
        priceSegment: 'standard',
        status: 'draft',
        totalItems: 40,
        itemsByStatus: { brief: 36, prompt: 4, generation: 0, review: 0, approved: 0 },
        createdAt: '2024-12-22T16:00:00Z',
        updatedAt: '2024-12-22T16:00:00Z'
    }
];

// =============================================
// CAPSULES STORAGE
// =============================================
function loadCapsules() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    saveCapsules(demoCapsules);
    return demoCapsules;
}

function saveCapsules(capsules) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capsules));

    // Помечаем несохранённые изменения
    if (typeof markUnsaved === 'function') {
        markUnsaved();
    }

    // Автоматическая синхронизация с облаком
    if (typeof syncToCloud === 'function') {
        // Debounce - откладываем синхронизацию чтобы не спамить при множественных изменениях
        clearTimeout(window._capsuleSyncTimeout);
        window._capsuleSyncTimeout = setTimeout(() => {
            syncToCloud().catch(err => {
                console.warn('[App] Ошибка синхронизации капсул:', err);
            });
        }, 1000);
    }
}

function getCapsuleById(id) {
    return loadCapsules().find(c => c.id === id);
}

function addCapsule(capsule) {
    const capsules = loadCapsules();
    capsules.unshift(capsule);
    saveCapsules(capsules);
    console.log(`[App] Капсула "${capsule.name}" добавлена, синхронизация...`);
}

function updateCapsule(id, updates) {
    const capsules = loadCapsules();
    const index = capsules.findIndex(c => c.id === id);
    if (index !== -1) {
        capsules[index] = { ...capsules[index], ...updates, updatedAt: new Date().toISOString() };
        saveCapsules(capsules);
    }
}

// =============================================
// TABS NAVIGATION
// =============================================
function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById('page-' + tab.dataset.tab).classList.add('active');
            
            // Render page content
            const tabName = tab.dataset.tab;
            if (tabName === 'capsules') renderCapsules();
            if (tabName === 'prompts') renderPromptsPage();
            if (tabName === 'palette') renderPalettePage();
        });
    });
}

// =============================================
// DEBOUNCE UTILITY
// =============================================
const debounceTimers = {};

/**
 * Универсальный debounce для любых функций
 * @param {Function} func - функция для выполнения
 * @param {number} delay - задержка в мс (по умолчанию 300)
 * @param {string} key - уникальный ключ для таймера
 */
function debounce(func, delay = 300, key = 'default') {
    clearTimeout(debounceTimers[key]);
    debounceTimers[key] = setTimeout(func, delay);
}

/**
 * Debounced поиск - вызывает функцию с задержкой
 * Использование: oninput="debouncedSearch(refreshItems)"
 */
function debouncedSearch(callback, delay = 250) {
    debounce(callback, delay, 'search');
}

// Экспорт
window.debounce = debounce;
window.debouncedSearch = debouncedSearch;

// =============================================
// RENDER CACHE (предотвращение лишних перерисовок)
// =============================================
const renderCache = {
    capsules: { hash: null, timestamp: 0 },
    items: { hash: null, timestamp: 0 },
    prompts: { hash: null, timestamp: 0 }
};

/**
 * Вычисляет простой хэш для данных
 */
function simpleHash(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

/**
 * Проверяет нужен ли ре-рендер
 * @param {string} key - ключ кэша (capsules, items, prompts)
 * @param {any} data - данные для сравнения
 * @returns {boolean} - true если нужен рендер
 */
function shouldRender(key, data) {
    const newHash = simpleHash(data);
    const cached = renderCache[key];

    if (!cached) return true;

    // Если данные не изменились за последние 100мс - пропускаем
    if (cached.hash === newHash && Date.now() - cached.timestamp < 100) {
        console.log(`[Cache] Пропуск рендера: ${key} (данные не изменились)`);
        return false;
    }

    // Обновляем кэш
    renderCache[key] = { hash: newHash, timestamp: Date.now() };
    return true;
}

/**
 * Инвалидирует кэш для принудительного рендера
 */
function invalidateCache(key) {
    if (renderCache[key]) {
        renderCache[key].hash = null;
    }
}

// Экспорт
window.shouldRender = shouldRender;
window.invalidateCache = invalidateCache;

// =============================================
// TOAST NOTIFICATIONS
// =============================================
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    document.getElementById('toastIcon').textContent = type === 'success' ? '✓' : '⚠';
    document.getElementById('toastText').textContent = msg;
    t.className = 'toast ' + type + ' show';
    setTimeout(() => t.classList.remove('show'), 3000);
}

// =============================================
// LOADING OVERLAY
// =============================================
let loadingOverlay = null;

function showLoading(message = 'Загрузка...') {
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loadingOverlay';
        loadingOverlay.innerHTML = `
            <style>
                #loadingOverlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 99999;
                    backdrop-filter: blur(4px);
                }
                .loading-content {
                    background: white;
                    padding: 32px 48px;
                    border-radius: 16px;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                .loading-spinner {
                    width: 48px;
                    height: 48px;
                    border: 4px solid #E5E7EB;
                    border-top-color: #E8601C;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 16px;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .loading-text {
                    font-size: 16px;
                    color: #374151;
                    font-weight: 500;
                }
            </style>
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text" id="loadingText">${message}</div>
            </div>
        `;
        document.body.appendChild(loadingOverlay);
    } else {
        document.getElementById('loadingText').textContent = message;
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

function updateLoadingText(message) {
    const text = document.getElementById('loadingText');
    if (text) text.textContent = message;
}

// Экспорт
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.updateLoadingText = updateLoadingText;

// =============================================
// MODAL HELPERS
// =============================================
function closeModal() {
    document.getElementById('newCapsuleModal').classList.remove('active');
}

function closeItemModal() {
    document.getElementById('itemModal').classList.remove('active');
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    renderCapsules();
});

// Modal close handlers — закрываем только если ВЕСЬ клик (mousedown→mouseup) был на бэкдропе.
// Это предотвращает закрытие модалки при выделении текста внутри input/textarea и случайном
// дрифте курсора на оверлей.
(function attachBackdropClose(modalId, closeFn) {
    const el = document.getElementById(modalId);
    if (!el) return;
    let mouseDownTarget = null;
    el.addEventListener('mousedown', e => { mouseDownTarget = e.target; });
    el.addEventListener('mouseup', e => {
        if (mouseDownTarget === el && e.target === el) closeFn();
        mouseDownTarget = null;
    });
})('newCapsuleModal', closeModal);

(function attachBackdropClose2(modalId, closeFn) {
    const el = document.getElementById(modalId);
    if (!el) return;
    let mouseDownTarget = null;
    el.addEventListener('mousedown', e => { mouseDownTarget = e.target; });
    el.addEventListener('mouseup', e => {
        if (mouseDownTarget === el && e.target === el) closeFn();
        mouseDownTarget = null;
    });
})('itemModal', closeItemModal);

// =============================================
// ГОРЯЧИЕ КЛАВИШИ
// =============================================
const keyboardShortcuts = {
    // Навигация
    '1': { ctrl: true, action: () => switchTab('capsules'), desc: 'Капсулы' },
    '2': { ctrl: true, action: () => switchTab('items'), desc: 'Артикулы' },
    '3': { ctrl: true, action: () => switchTab('prompts'), desc: 'Промпты' },
    '4': { ctrl: true, action: () => switchTab('palette'), desc: 'Палитра' },

    // Действия
    'n': { ctrl: true, action: () => openNewCapsuleModal(), desc: 'Новая капсула' },
    's': { ctrl: true, action: () => triggerAutoSave(), desc: 'Сохранить' },
    'b': { ctrl: true, action: () => openBackupModal(), desc: 'Backup' },
    'd': { ctrl: true, action: () => toggleTheme(), desc: 'Тёмная тема' },
    'f': { ctrl: true, action: () => focusSearch(), desc: 'Поиск' },
    '/': { ctrl: false, action: () => focusSearch(), desc: 'Поиск' },
    '?': { ctrl: false, shift: true, action: () => showKeyboardHelp(), desc: 'Справка' },

    // Модалки
    'Escape': { ctrl: false, action: () => { closeModal(); closeItemModal(); }, desc: 'Закрыть окно' }
};

/**
 * Глобальный обработчик клавиатуры
 */
document.addEventListener('keydown', (e) => {
    // Игнорируем ввод в текстовых полях
    const target = e.target;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    // Для Escape всегда работаем
    if (e.key === 'Escape') {
        closeModal();
        closeItemModal();
        if (isInput) target.blur();
        return;
    }

    // Для остальных клавиш - только вне полей ввода (кроме Ctrl+комбинаций)
    if (isInput && !e.ctrlKey && !e.metaKey) return;

    const key = e.key.toLowerCase();
    const shortcut = keyboardShortcuts[e.key] || keyboardShortcuts[key];

    if (!shortcut) return;

    // Проверяем модификаторы
    const ctrlPressed = e.ctrlKey || e.metaKey; // metaKey для Mac
    const shiftPressed = e.shiftKey;

    if (shortcut.ctrl && !ctrlPressed) return;
    if (shortcut.shift && !shiftPressed) return;
    if (!shortcut.ctrl && ctrlPressed && key !== '/') return;

    // Выполняем действие
    e.preventDefault();
    shortcut.action();
});

/**
 * Переключение вкладки
 */
function switchTab(tabName) {
    const tab = document.querySelector(`.tab[data-tab="${tabName}"]`);
    if (tab) tab.click();
}

/**
 * Фокус на поле поиска
 */
function focusSearch() {
    const search = document.querySelector('.search-input:not([style*="display: none"])') ||
                   document.getElementById('itemSearch') ||
                   document.querySelector('.search-input');
    if (search) {
        search.focus();
        search.select();
    }
}

/**
 * Открыть модалку новой капсулы
 */
function openNewCapsuleModal() {
    const modal = document.getElementById('newCapsuleModal');
    if (modal && typeof window.openModal === 'function') {
        window.openModal();
    } else if (modal) {
        modal.classList.add('active');
    }
}

/**
 * Показать справку по горячим клавишам
 */
function showKeyboardHelp() {
    const modal = document.getElementById('itemModal');
    if (!modal) return;

    document.getElementById('itemModalTitle').textContent = '⌨️ Горячие клавиши';
    document.getElementById('itemModalBody').innerHTML = `
        <div style="padding: 16px 0;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--gray-200);">
                        <th style="text-align: left; padding: 8px 12px; color: var(--gray-600);">Клавиша</th>
                        <th style="text-align: left; padding: 8px 12px; color: var(--gray-600);">Действие</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom: 1px solid var(--gray-100);">
                        <td style="padding: 8px 12px;"><kbd>Ctrl+1</kbd></td>
                        <td style="padding: 8px 12px;">Перейти к Капсулам</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-100);">
                        <td style="padding: 8px 12px;"><kbd>Ctrl+2</kbd></td>
                        <td style="padding: 8px 12px;">Перейти к Артикулам</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-100);">
                        <td style="padding: 8px 12px;"><kbd>Ctrl+3</kbd></td>
                        <td style="padding: 8px 12px;">Перейти к Промптам</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-100);">
                        <td style="padding: 8px 12px;"><kbd>Ctrl+4</kbd></td>
                        <td style="padding: 8px 12px;">Перейти к Палитре</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-100);">
                        <td style="padding: 8px 12px;"><kbd>Ctrl+N</kbd></td>
                        <td style="padding: 8px 12px;">Создать новую капсулу</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-100);">
                        <td style="padding: 8px 12px;"><kbd>Ctrl+S</kbd></td>
                        <td style="padding: 8px 12px;">Сохранить (синхронизация)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-100);">
                        <td style="padding: 8px 12px;"><kbd>Ctrl+B</kbd></td>
                        <td style="padding: 8px 12px;">Резервное копирование</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-100);">
                        <td style="padding: 8px 12px;"><kbd>Ctrl+D</kbd></td>
                        <td style="padding: 8px 12px;">Переключить тёмную тему</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-100);">
                        <td style="padding: 8px 12px;"><kbd>Ctrl+F</kbd> или <kbd>/</kbd></td>
                        <td style="padding: 8px 12px;">Фокус на поиск</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-100);">
                        <td style="padding: 8px 12px;"><kbd>Shift+?</kbd></td>
                        <td style="padding: 8px 12px;">Показать эту справку</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px;"><kbd>Escape</kbd></td>
                        <td style="padding: 8px 12px;">Закрыть окно</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="modal-actions">
            <button class="btn btn-secondary" onclick="closeItemModal()">Закрыть</button>
        </div>
    `;
    modal.classList.add('active');
}

// Экспорт функций
window.switchTab = switchTab;
window.focusSearch = focusSearch;
window.showKeyboardHelp = showKeyboardHelp;
window.openNewCapsuleModal = openNewCapsuleModal;

// =============================================
// ТЁМНАЯ ТЕМА
// =============================================
const THEME_KEY = 'kari-theme';

/**
 * Инициализация темы при загрузке
 */
function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(theme);

    // Слушаем изменение системной темы
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(THEME_KEY)) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
}

/**
 * Применить тему
 */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

/**
 * Переключить тему
 */
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = current === 'dark' ? 'light' : 'dark';

    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);

    showToast(`Тема: ${newTheme === 'dark' ? 'тёмная' : 'светлая'}`, 'success');
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', initTheme);

// Экспорт
window.toggleTheme = toggleTheme;
window.initTheme = initTheme;

// =============================================
// ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ОШИБОК
// =============================================
window.addEventListener('error', (event) => {
    console.error('[Global Error]', event.error);
    showToast('Произошла ошибка. Перезагрузите страницу.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise]', event.reason);
    showToast('Ошибка операции: ' + (event.reason?.message || 'Неизвестная ошибка'), 'error');
});

// =============================================
// АВТОСОХРАНЕНИЕ И BEFOREUNLOAD
// =============================================
let hasUnsavedChanges = false;
let autoSaveTimeout = null;

// Помечаем что есть несохранённые изменения
function markUnsaved() {
    hasUnsavedChanges = true;

    // Отложенное автосохранение через 5 секунд
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        triggerAutoSave();
    }, 5000);
}

// Триггер автосохранения
function triggerAutoSave() {
    if (!hasUnsavedChanges) return;

    console.log('[AutoSave] Автоматическое сохранение...');

    // Синхронизация с облаком если доступно
    if (typeof syncToCloud === 'function' && !window.guestMode) {
        syncToCloud().then(() => {
            hasUnsavedChanges = false;
            console.log('[AutoSave] Синхронизация завершена');
        }).catch(err => {
            console.warn('[AutoSave] Ошибка синхронизации:', err);
        });
    } else {
        hasUnsavedChanges = false;
    }
}

// Предупреждение при закрытии с несохранёнными данными
window.addEventListener('beforeunload', (event) => {
    // Принудительное сохранение перед закрытием
    if (typeof syncToCloud === 'function' && !window.guestMode) {
        syncToCloud();
    }

    // Предупреждение если есть несохранённые изменения
    if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'У вас есть несохранённые изменения. Вы уверены, что хотите уйти?';
        return event.returnValue;
    }
});

// Сохранение при потере фокуса
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        triggerAutoSave();
    }
});

// Экспорт
window.markUnsaved = markUnsaved;
window.triggerAutoSave = triggerAutoSave;

// =============================================
// ВАЛИДАЦИЯ ДАННЫХ
// =============================================

/**
 * Валидация капсулы
 */
function validateCapsule(capsule) {
    const errors = [];

    if (!capsule.name || capsule.name.trim().length < 2) {
        errors.push('Название капсулы должно быть минимум 2 символа');
    }

    if (!capsule.season || !/^(SS|AW)\d{2}$/.test(capsule.season)) {
        errors.push('Сезон должен быть в формате SS26 или AW26');
    }

    if (!capsule.gender || !['boys', 'girls', 'unisex'].includes(capsule.gender)) {
        errors.push('Укажите пол: boys, girls или unisex');
    }

    if (!capsule.ageRange) {
        errors.push('Укажите возрастной диапазон');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Валидация артикула
 */
function validateItem(item) {
    const errors = [];

    if (!item.sku || item.sku.trim().length < 3) {
        errors.push('SKU должен быть минимум 3 символа');
    }

    if (!item.category) {
        errors.push('Укажите категорию товара');
    }

    if (item.priceTarget && (item.priceTarget < 0 || item.priceTarget > 50000)) {
        errors.push('Цена должна быть от 0 до 50000');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Очистка и восстановление повреждённых данных
 */
function repairLocalStorage() {
    try {
        // Проверка капсул
        const capsulesRaw = localStorage.getItem(STORAGE_KEY);
        if (capsulesRaw) {
            const capsules = JSON.parse(capsulesRaw);
            if (!Array.isArray(capsules)) {
                console.warn('[Repair] Капсулы повреждены, восстановление...');
                localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
            }
        }

        // Проверка артикулов
        const itemsRaw = localStorage.getItem(ITEMS_STORAGE_KEY);
        if (itemsRaw) {
            const items = JSON.parse(itemsRaw);
            if (typeof items !== 'object') {
                console.warn('[Repair] Артикулы повреждены, восстановление...');
                localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify({}));
            }
        }

        console.log('[Repair] Проверка данных завершена');
        return true;
    } catch (error) {
        console.error('[Repair] Критическая ошибка данных:', error);
        return false;
    }
}

// Запуск проверки при загрузке
repairLocalStorage();

// Экспорт валидаторов
window.validateCapsule = validateCapsule;
window.validateItem = validateItem;
window.repairLocalStorage = repairLocalStorage;

// =============================================
// МИГРАЦИЯ СТАРЫХ ДАННЫХ
// =============================================
const DATA_VERSION_KEY = 'kari-data-version';
const CURRENT_DATA_VERSION = 2;

/**
 * Миграция данных при обновлении структуры
 */
async function migrateData() {
    const currentVersion = parseInt(localStorage.getItem(DATA_VERSION_KEY) || '1');

    if (currentVersion >= CURRENT_DATA_VERSION) {
        console.log('[Migration] Данные актуальны, версия:', currentVersion);
        return;
    }

    console.log('[Migration] Начинаем миграцию с версии', currentVersion, 'до', CURRENT_DATA_VERSION);

    try {
        // Миграция v1 → v2: перенос изображений из localStorage в IndexedDB
        if (currentVersion < 2) {
            await migrateImagesToIndexedDB();
        }

        // Обновляем версию
        localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION.toString());
        console.log('[Migration] Миграция завершена успешно');

        if (typeof showToast === 'function') {
            showToast('Данные обновлены до новой версии', 'success');
        }
    } catch (error) {
        console.error('[Migration] Ошибка миграции:', error);
    }
}

/**
 * Миграция v1 → v2: перенос base64 изображений из капсул в IndexedDB
 */
async function migrateImagesToIndexedDB() {
    console.log('[Migration] Переносим изображения в IndexedDB...');

    // Проверяем доступность IndexedDB
    if (typeof initImageDB !== 'function') {
        console.warn('[Migration] IndexedDB модуль не загружен, пропускаем');
        return;
    }

    await initImageDB();

    // Миграция изображений капсул
    const capsules = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    let migratedCount = 0;

    for (const capsule of capsules) {
        // Мигрируем heroImage
        if (capsule.heroImage && capsule.heroImage.startsWith('data:image')) {
            const imageId = `capsule-${capsule.id}-hero`;
            await saveImageToIDB(imageId, capsule.heroImage);
            capsule.heroImageId = imageId;
            delete capsule.heroImage;
            migratedCount++;
        }

        // Мигрируем refImage
        if (capsule.refImage && capsule.refImage.startsWith('data:image')) {
            const imageId = `capsule-${capsule.id}-ref`;
            await saveImageToIDB(imageId, capsule.refImage);
            capsule.refImageId = imageId;
            delete capsule.refImage;
            migratedCount++;
        }
    }

    if (migratedCount > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(capsules));
        console.log(`[Migration] Перенесено ${migratedCount} изображений капсул`);
    }

    // Миграция изображений артикулов
    const allItems = JSON.parse(localStorage.getItem(ITEMS_STORAGE_KEY) || '{}');
    let itemImageCount = 0;

    for (const [capsuleId, items] of Object.entries(allItems)) {
        if (!Array.isArray(items)) continue;

        for (const item of items) {
            if (item.images && Array.isArray(item.images)) {
                const newImages = [];
                for (let i = 0; i < item.images.length; i++) {
                    const img = item.images[i];
                    if (img && img.startsWith('data:image') && img.length > 10000) {
                        // Переносим в IndexedDB только большие изображения
                        const imageId = `item-${item.id}-${i}`;
                        await saveImageToIDB(imageId, img);
                        newImages.push(imageId);
                        itemImageCount++;
                    } else {
                        newImages.push(img);
                    }
                }
                item.images = newImages;
            }
        }
    }

    if (itemImageCount > 0) {
        localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(allItems));
        console.log(`[Migration] Перенесено ${itemImageCount} изображений артикулов`);
    }

    // Очистка старых img- ключей из localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('img-')) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
    });

    if (keysToRemove.length > 0) {
        console.log(`[Migration] Удалено ${keysToRemove.length} старых ключей изображений`);
    }
}

/**
 * Проверка и очистка устаревших данных
 */
function cleanupOldData() {
    // Удаляем устаревшие ключи
    const deprecatedKeys = [
        'kari-old-capsules',
        'kari-backup',
        'kari-temp',
        'kari-cache'
    ];

    deprecatedKeys.forEach(key => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            console.log('[Cleanup] Удалён устаревший ключ:', key);
        }
    });

    // Проверка размера localStorage
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        if (value) {
            totalSize += key.length + value.length;
        }
    }

    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
    console.log(`[Cleanup] Размер localStorage: ${sizeMB} MB`);

    if (totalSize > 4 * 1024 * 1024) { // > 4MB
        console.warn('[Cleanup] localStorage близок к лимиту!');
    }
}

// Запуск миграции при загрузке
document.addEventListener('DOMContentLoaded', () => {
    migrateData();
    cleanupOldData();
});

// Экспорт
window.migrateData = migrateData;
window.cleanupOldData = cleanupOldData;

// =============================================
// ЭКСПОРТ/ИМПОРТ ДАННЫХ (BACKUP)
// =============================================

/**
 * Экспортирует все данные в JSON файл
 */
async function exportAllData() {
    try {
        showLoading('Подготовка экспорта...');

        // Собираем все данные
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            capsules: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),
            items: JSON.parse(localStorage.getItem(ITEMS_STORAGE_KEY) || '{}'),
            palettes: JSON.parse(localStorage.getItem('kari-palettes') || '[]'),
            prompts: JSON.parse(localStorage.getItem('kari-prompts') || '[]'),
            settings: {
                guestMode: localStorage.getItem('kari-guest-mode'),
                lastSync: localStorage.getItem('kari-last-sync')
            }
        };

        // Экспорт изображений из IndexedDB
        updateLoadingText('Экспорт изображений...');
        if (typeof loadImageFromIDB === 'function') {
            exportData.images = {};
            const db = await initImageDB();
            if (db) {
                const transaction = db.transaction(['images'], 'readonly');
                const store = transaction.objectStore('images');
                const request = store.getAll();

                await new Promise((resolve, reject) => {
                    request.onsuccess = () => {
                        request.result.forEach(item => {
                            exportData.images[item.id] = item.data;
                        });
                        resolve();
                    };
                    request.onerror = () => reject(request.error);
                });
            }
        }

        // Создаём файл
        updateLoadingText('Создание файла...');
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Скачиваем
        const a = document.createElement('a');
        a.href = url;
        a.download = `kari-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        hideLoading();
        showToast(`Экспорт завершён: ${exportData.capsules.length} капсул`, 'success');

        return true;
    } catch (error) {
        hideLoading();
        console.error('[Export] Ошибка:', error);
        showToast('Ошибка экспорта: ' + error.message, 'error');
        return false;
    }
}

/**
 * Импортирует данные из JSON файла
 * @param {File} file - файл для импорта
 * @param {boolean} merge - объединить с существующими данными (true) или заменить (false)
 */
async function importData(file, merge = false) {
    try {
        showLoading('Чтение файла...');

        const text = await file.text();
        const importData = JSON.parse(text);

        // Валидация формата
        if (!importData.version || !importData.capsules) {
            throw new Error('Неверный формат файла');
        }

        updateLoadingText('Импорт данных...');

        // Импорт капсул
        if (importData.capsules) {
            if (merge) {
                const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                const merged = [...existing];
                importData.capsules.forEach(capsule => {
                    const idx = merged.findIndex(c => c.id === capsule.id);
                    if (idx !== -1) {
                        merged[idx] = capsule; // Обновляем
                    } else {
                        merged.push(capsule); // Добавляем
                    }
                });
                localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            } else {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(importData.capsules));
            }
        }

        // Импорт артикулов
        if (importData.items) {
            if (merge) {
                const existing = JSON.parse(localStorage.getItem(ITEMS_STORAGE_KEY) || '{}');
                const merged = { ...existing, ...importData.items };
                localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(merged));
            } else {
                localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(importData.items));
            }
        }

        // Импорт палитр
        if (importData.palettes) {
            if (merge) {
                const existing = JSON.parse(localStorage.getItem('kari-palettes') || '[]');
                const merged = [...existing];
                importData.palettes.forEach(palette => {
                    const idx = merged.findIndex(p => p.id === palette.id);
                    if (idx !== -1) {
                        merged[idx] = palette;
                    } else {
                        merged.push(palette);
                    }
                });
                localStorage.setItem('kari-palettes', JSON.stringify(merged));
            } else {
                localStorage.setItem('kari-palettes', JSON.stringify(importData.palettes));
            }
        }

        // Импорт промптов
        if (importData.prompts) {
            if (merge) {
                const existing = JSON.parse(localStorage.getItem('kari-prompts') || '[]');
                const merged = [...existing];
                importData.prompts.forEach(prompt => {
                    const idx = merged.findIndex(p => p.id === prompt.id);
                    if (idx !== -1) {
                        merged[idx] = prompt;
                    } else {
                        merged.push(prompt);
                    }
                });
                localStorage.setItem('kari-prompts', JSON.stringify(merged));
            } else {
                localStorage.setItem('kari-prompts', JSON.stringify(importData.prompts));
            }
        }

        // Импорт изображений в IndexedDB
        if (importData.images && typeof saveImageToIDB === 'function') {
            updateLoadingText('Импорт изображений...');
            for (const [id, data] of Object.entries(importData.images)) {
                await saveImageToIDB(id, data);
            }
        }

        hideLoading();
        showToast(`Импорт завершён: ${importData.capsules?.length || 0} капсул`, 'success');

        // Обновляем UI
        invalidateCache('capsules');
        invalidateCache('items');
        invalidateCache('prompts');
        renderCapsules();

        return true;
    } catch (error) {
        hideLoading();
        console.error('[Import] Ошибка:', error);
        showToast('Ошибка импорта: ' + error.message, 'error');
        return false;
    }
}

/**
 * Открывает модальное окно импорта/экспорта
 */
function openBackupModal() {
    const modal = document.getElementById('itemModal');
    document.getElementById('itemModalTitle').textContent = '💾 Резервное копирование';
    document.getElementById('itemModalBody').innerHTML = `
        <div style="padding: 20px 0;">
            <div style="margin-bottom: 24px;">
                <h3 style="margin-bottom: 12px; color: var(--gray-700);">📤 Экспорт данных</h3>
                <p style="color: var(--gray-500); margin-bottom: 12px;">
                    Скачать все данные (капсулы, артикулы, палитры, изображения) в JSON файл.
                </p>
                <button class="btn btn-primary" onclick="exportAllData()">
                    📥 Скачать резервную копию
                </button>
            </div>

            <div style="border-top: 1px solid var(--gray-200); padding-top: 24px;">
                <h3 style="margin-bottom: 12px; color: var(--gray-700);">📥 Импорт данных</h3>
                <p style="color: var(--gray-500); margin-bottom: 12px;">
                    Загрузить данные из ранее сохранённой резервной копии.
                </p>
                <input type="file" id="importFileInput" accept=".json" style="display:none"
                    onchange="handleImportFile(event)">

                <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="radio" name="importMode" value="replace" checked>
                        <span>Заменить все данные</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="radio" name="importMode" value="merge">
                        <span>Объединить с существующими</span>
                    </label>
                </div>

                <button class="btn btn-secondary" onclick="document.getElementById('importFileInput').click()">
                    📂 Выбрать файл
                </button>
            </div>

            <div style="border-top: 1px solid var(--gray-200); padding-top: 24px; margin-top: 24px;">
                <h3 style="margin-bottom: 12px; color: var(--red);">⚠️ Очистка данных</h3>
                <p style="color: var(--gray-500); margin-bottom: 12px;">
                    Удалить все локальные данные. Это действие нельзя отменить!
                </p>
                <button class="btn" style="background: var(--red); color: white;"
                    onclick="confirmClearAllData()">
                    🗑️ Очистить все данные
                </button>
            </div>
        </div>

        <div class="modal-actions">
            <button class="btn btn-secondary" onclick="closeItemModal()">Закрыть</button>
        </div>
    `;
    modal.classList.add('active');
}

/**
 * Обработчик выбора файла для импорта
 */
function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const mergeMode = document.querySelector('input[name="importMode"]:checked')?.value === 'merge';

    if (!mergeMode) {
        if (!confirm('Все текущие данные будут заменены. Продолжить?')) {
            event.target.value = '';
            return;
        }
    }

    importData(file, mergeMode);
    event.target.value = '';
}

/**
 * Подтверждение очистки данных
 */
function confirmClearAllData() {
    if (!confirm('Вы уверены? Все данные будут удалены безвозвратно!')) return;
    if (!confirm('Это последнее предупреждение! Удалить ВСЕ данные?')) return;

    try {
        showLoading('Очистка данных...');

        // Очистка localStorage
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ITEMS_STORAGE_KEY);
        localStorage.removeItem('kari-palettes');
        localStorage.removeItem('kari-prompts');

        // Очистка IndexedDB
        if (typeof indexedDB !== 'undefined') {
            indexedDB.deleteDatabase('kari-images-db');
        }

        hideLoading();
        showToast('Все данные удалены', 'success');
        closeItemModal();

        // Перезагрузка страницы
        setTimeout(() => location.reload(), 1000);
    } catch (error) {
        hideLoading();
        showToast('Ошибка очистки: ' + error.message, 'error');
    }
}

// Экспорт функций backup
window.exportAllData = exportAllData;
window.importData = importData;
window.openBackupModal = openBackupModal;
window.handleImportFile = handleImportFile;
window.confirmClearAllData = confirmClearAllData;

// =============================================
// ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ
// =============================================
window.loadCapsules = loadCapsules;
window.saveCapsules = saveCapsules;
window.getCapsuleById = getCapsuleById;
window.addCapsule = addCapsule;
window.updateCapsule = updateCapsule;
window.showToast = showToast;
window.closeModal = closeModal;
window.closeItemModal = closeItemModal;
