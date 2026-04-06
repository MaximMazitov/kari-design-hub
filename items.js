// =============================================
// KARI Design Hub - Items Module
// =============================================

let currentCapsuleId = null;
let currentViewMode = 'table';
let currentFilter = 'all';
let currentItemId = null;

const defaultColors = [
    { name: 'Серый меланж', code: '17-4402 TCX', hex: '#9A9A9A' },
    { name: 'Графитовый', code: '19-3906 TCX', hex: '#4A4A4A' },
    { name: 'Чёрный', code: '19-4005 TCX', hex: '#1A1A1A' },
    { name: 'Оранжевый', code: '16-1462 TCX', hex: '#E8601C' },
    { name: 'Лаймовый', code: '13-0550 TCX', hex: '#C8E020' }
];

// =============================================
// IMAGE COMPRESSION UTILITY
// =============================================
const MAX_IMAGE_SIZE_KB = 100;
const MAX_IMAGE_DIMENSION = 800;

/**
 * Сжимает изображение до указанного размера
 * @param {File} file - исходный файл
 * @param {number} maxSizeKB - максимальный размер в KB
 * @param {number} maxDimension - максимальная сторона в px
 * @returns {Promise<string>} - base64 сжатого изображения
 */
async function compressImage(file, maxSizeKB = MAX_IMAGE_SIZE_KB, maxDimension = MAX_IMAGE_DIMENSION) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Ошибка чтения файла'));
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = () => reject(new Error('Ошибка загрузки изображения'));
            img.onload = () => {
                // Вычисляем новые размеры
                let width = img.width;
                let height = img.height;

                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                // Создаём canvas и рисуем
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Сжимаем с подбором качества
                let quality = 0.9;
                let result = canvas.toDataURL('image/jpeg', quality);

                // Уменьшаем качество пока не достигнем целевого размера
                while (result.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
                    quality -= 0.1;
                    result = canvas.toDataURL('image/jpeg', quality);
                }

                const finalSizeKB = Math.round(result.length / 1024 / 1.37);
                console.log(`[Compress] ${file.name}: ${Math.round(file.size/1024)}KB → ${finalSizeKB}KB (quality: ${quality.toFixed(1)})`);

                resolve(result);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Экспорт для использования в других модулях
window.compressImage = compressImage;

// =============================================
// INDEXEDDB IMAGE STORAGE
// =============================================
const DB_NAME = 'kari-images-db';
const DB_VERSION = 1;
const STORE_NAME = 'images';
let imageDB = null;

/**
 * Инициализация IndexedDB для хранения изображений
 */
async function initImageDB() {
    return new Promise((resolve, reject) => {
        if (imageDB) {
            resolve(imageDB);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.warn('[IndexedDB] Ошибка открытия, используем localStorage');
            resolve(null);
        };

        request.onsuccess = (event) => {
            imageDB = event.target.result;
            console.log('[IndexedDB] База изображений открыта');
            resolve(imageDB);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                console.log('[IndexedDB] Хранилище изображений создано');
            }
        };
    });
}

/**
 * Сохраняет изображение в IndexedDB
 * @param {string} id - уникальный ID (например, capsule-id-hero или item-id-0)
 * @param {string} imageData - base64 данные изображения
 */
async function saveImageToIDB(id, imageData) {
    const db = await initImageDB();
    if (!db) {
        // Fallback на localStorage
        try {
            localStorage.setItem(`img-${id}`, imageData);
        } catch (e) {
            console.error('[Storage] QuotaExceeded:', e);
            showToast('Недостаточно места для изображения', 'error');
        }
        return;
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ id, data: imageData, updatedAt: Date.now() });

        request.onsuccess = () => {
            console.log(`[IndexedDB] Изображение сохранено: ${id}`);
            resolve(true);
        };
        request.onerror = () => {
            console.error('[IndexedDB] Ошибка сохранения:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Загружает изображение из IndexedDB
 * @param {string} id - уникальный ID
 * @returns {Promise<string|null>} - base64 данные или null
 */
async function loadImageFromIDB(id) {
    const db = await initImageDB();
    if (!db) {
        // Fallback на localStorage
        return localStorage.getItem(`img-${id}`);
    }

    return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result?.data || null);
        };
        request.onerror = () => {
            resolve(null);
        };
    });
}

/**
 * Удаляет изображение из IndexedDB
 * @param {string} id - уникальный ID
 */
async function deleteImageFromIDB(id) {
    const db = await initImageDB();
    if (!db) {
        localStorage.removeItem(`img-${id}`);
        return;
    }

    return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
            console.log(`[IndexedDB] Изображение удалено: ${id}`);
            resolve(true);
        };
        request.onerror = () => resolve(false);
    });
}

// Экспорт IndexedDB функций
window.initImageDB = initImageDB;
window.saveImageToIDB = saveImageToIDB;
window.loadImageFromIDB = loadImageFromIDB;
window.deleteImageFromIDB = deleteImageFromIDB;

// Инициализируем DB при загрузке
initImageDB();

// =============================================
// LAZY LOADING IMAGES
// =============================================
let lazyImageObserver = null;

/**
 * Инициализация Intersection Observer для lazy loading
 */
function initLazyLoading() {
    if (lazyImageObserver) return; // Уже инициализирован

    // Проверка поддержки
    if (!('IntersectionObserver' in window)) {
        console.log('[LazyLoad] IntersectionObserver не поддерживается, используем eager loading');
        return;
    }

    const options = {
        root: null, // viewport
        rootMargin: '50px', // Предзагрузка за 50px до появления
        threshold: 0.01 // Триггер при 1% видимости
    };

    lazyImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                loadLazyImage(img);
                observer.unobserve(img); // Перестаём следить
            }
        });
    }, options);

    console.log('[LazyLoad] Intersection Observer инициализирован');
}

/**
 * Загрузка отложенного изображения
 * @param {HTMLImageElement} img - элемент изображения
 */
function loadLazyImage(img) {
    const src = img.dataset.src;
    if (!src) return;

    // Показываем placeholder пока грузится
    img.classList.add('lazy-loading');

    // Создаём временное изображение для предзагрузки
    const tempImg = new Image();
    tempImg.onload = () => {
        img.src = src;
        img.classList.remove('lazy-loading', 'lazy-placeholder');
        img.classList.add('lazy-loaded');
        img.removeAttribute('data-src');
    };
    tempImg.onerror = () => {
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-error');
        console.warn('[LazyLoad] Ошибка загрузки:', src.substring(0, 50) + '...');
    };
    tempImg.src = src;
}

/**
 * Создаёт HTML для lazy-loaded изображения
 * @param {string} src - URL изображения
 * @param {string} alt - alt текст
 * @param {string} className - дополнительные классы
 * @returns {string} HTML строка
 */
function lazyImageHTML(src, alt = '', className = '') {
    if (!src) return '';

    // Placeholder - маленький серый прямоугольник в base64
    const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTBlMGUwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuKdvzwvdGV4dD48L3N2Zz4=';

    return `<img
        src="${placeholder}"
        data-src="${src}"
        alt="${alt}"
        class="lazy-image lazy-placeholder ${className}"
        loading="lazy"
    >`;
}

/**
 * Применить lazy loading ко всем изображениям с data-src
 */
function observeLazyImages() {
    if (!lazyImageObserver) {
        initLazyLoading();
    }

    if (!lazyImageObserver) return; // Fallback - загружаем сразу

    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => {
        lazyImageObserver.observe(img);
    });

    console.log(`[LazyLoad] Отслеживаем ${lazyImages.length} изображений`);
}

// Инициализация при загрузке
initLazyLoading();

// Экспорт
window.lazyImageHTML = lazyImageHTML;
window.observeLazyImages = observeLazyImages;
window.initLazyLoading = initLazyLoading;

// =============================================
// ITEMS STORAGE
// =============================================
function getCapsulePaletteColors(capsule) {
    // Получаем цвета палитры капсулы
    if (capsule.paletteId && typeof loadPalettes === 'function') {
        const palettes = loadPalettes();
        const palette = palettes.find(p => p.id === capsule.paletteId);
        if (palette && palette.colors && palette.colors.length > 0) {
            return palette.colors;
        }
    }

    // AI Wizard — palette это массив цветов [{code, name, hex, role, percent}]
    if (Array.isArray(capsule.palette) && capsule.palette.length > 0 && capsule.palette[0].hex) {
        return capsule.palette;
    }

    // Если ручной режим - используем цвета из капсулы
    if (capsule.palette?.mode === 'manual' && capsule.palette.colors?.length > 0) {
        return capsule.palette.colors.map(c => ({
            name: c.name,
            code: c.code,
            hex: c.hex,
            role: c.percent >= 20 ? 'base' : 'accent'
        }));
    }

    // Fallback на дефолтные цвета
    return defaultColors;
}

function generateItems(capsuleId) {
    const capsule = getCapsuleById(capsuleId);
    if (!capsule) return [];
    
    // Получаем цвета из палитры капсулы
    const paletteColors = getCapsulePaletteColors(capsule);
    const baseColors = paletteColors.filter(c => c.role === 'base' || c.percent >= 20);
    const accentColors = paletteColors.filter(c => c.role === 'accent' || c.percent < 20);
    
    // Если нет разделения - используем все
    const bases = baseColors.length > 0 ? baseColors : paletteColors.slice(0, 3);
    const accents = accentColors.length > 0 ? accentColors : paletteColors.slice(-2);
    
    const items = [];
    const prefixes = { jackets: 'JKT', hoodies: 'HOD', pants: 'PNT', tshirts: 'TSH', accessories: 'ACC', shoes: 'SHO' };
    const names = { jackets: 'Куртка', hoodies: 'Худи', pants: 'Брюки', tshirts: 'Футболка', accessories: 'Аксессуар', shoes: 'Обувь' };
    const prefix = capsule.name.substring(0, 3).toUpperCase();
    let num = 1;
    
    // Материалы по категориям (смесовые ткани - приоритет KARI)
    const materialsByCategory = {
        jackets: 'ПЭ 100%, подкладка ПЭ 100%',
        hoodies: 'Хлопок 65%, ПЭ 35%',
        pants: 'Хлопок 60%, ПЭ 40%',
        tshirts: 'Хлопок 70%, ПЭ 30%',
        accessories: 'ПЭ 100%',
        shoes: 'Эко-кожа, подошва ТЭП'
    };
    
    // Цены по категориям (масс-маркет KARI)
    const pricesByCategory = {
        jackets: 4990,
        hoodies: 2490,
        pants: 1990,
        tshirts: 990,
        accessories: 590,
        shoes: 2990
    };

    // Проверка на наличие categories (для старых капсул)
    const categories = capsule.categories || {
        jackets: 2,
        hoodies: 2,
        pants: 2,
        tshirts: 2,
        accessories: 1,
        shoes: 1
    };

    Object.entries(categories).forEach(([cat, count]) => {
        for (let i = 0; i < count; i++) {
            const base = bases[Math.floor(Math.random() * bases.length)] || defaultColors[0];
            const accent = accents[Math.floor(Math.random() * accents.length)] || defaultColors[1];
            
            // Для новых капсул все артикулы в статусе brief
            const status = 'brief';
            
            items.push({
                id: `${capsuleId}-${prefixes[cat]}-${String(num).padStart(3, '0')}`,
                capsuleId, 
                sku: `${prefix}-${prefixes[cat]}-${String(num).padStart(3, '0')}`,
                name: `${names[cat]} ${capsule.name} ${i + 1}`,
                category: cat, 
                status,
                baseColor: { name: base.name, code: base.code, hex: base.hex },
                accentColor: { name: accent.name, code: accent.code, hex: accent.hex },
                materials: materialsByCategory[cat] || 'ПЭ 100%',
                sizes: cat === 'shoes' ? '28-35' : '104-152',
                priceTarget: pricesByCategory[cat] || 990,
                prompt: '',
                images: [],
                comments: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            num++;
        }
    });
    
    console.log(`[Items] Сгенерировано ${items.length} артикулов для капсулы ${capsuleId}`);
    return items;
}

function loadItems(capsuleId) {
    let all = {};
    try {
        const parsed = JSON.parse(localStorage.getItem(ITEMS_STORAGE_KEY) || '{}');

        // Миграция: если старый формат (массив) — конвертировать в объект {capsuleId: [items]}
        if (Array.isArray(parsed)) {
            const migrated = {};
            parsed.forEach(item => {
                if (item && item.capsuleId) {
                    if (!migrated[item.capsuleId]) migrated[item.capsuleId] = [];
                    migrated[item.capsuleId].push(item);
                }
            });
            all = migrated;
            localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(all));
            console.log('[Items] Мигрировали kari-items из массива в объект:', Object.keys(all).length, 'капсул');
        } else if (parsed && typeof parsed === 'object') {
            all = parsed;
        }
    } catch (e) {
        console.error('[Items] Ошибка чтения kari-items:', e);
        all = {};
    }

    if (!all[capsuleId]) {
        all[capsuleId] = generateItems(capsuleId);
        localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(all));
    }
    return all[capsuleId] || [];
}

function saveItems(capsuleId, items) {
    const all = JSON.parse(localStorage.getItem(ITEMS_STORAGE_KEY) || '{}');
    all[capsuleId] = items;
    localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(all));

    // Помечаем несохранённые изменения
    if (typeof markUnsaved === 'function') {
        markUnsaved();
    }

    // Синхронизация с Firebase
    if (typeof syncToCloud === 'function') {
        syncToCloud().catch(err => {
            console.warn('[Items] Ошибка синхронизации:', err);
        });
    }
}

function getItemById(capsuleId, itemId) {
    return loadItems(capsuleId).find(i => i.id === itemId);
}

function updateItem(capsuleId, itemId, updates) {
    const items = loadItems(capsuleId);
    const idx = items.findIndex(i => i.id === itemId);
    if (idx !== -1) {
        items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
        saveItems(capsuleId, items);
        updateCapsuleStats(capsuleId);
        return items[idx];
    }
    return null;
}

function updateCapsuleStats(capsuleId) {
    const items = loadItems(capsuleId);
    const stats = { brief: 0, prompt: 0, generation: 0, review: 0, approved: 0 };
    items.forEach(i => { if (stats.hasOwnProperty(i.status)) stats[i.status]++; });
    updateCapsule(capsuleId, { itemsByStatus: stats, totalItems: items.length });
}

// =============================================
// RENDER ITEMS PAGE
// =============================================
async function renderItemsPage(capsuleId) {
    currentCapsuleId = capsuleId;
    const capsule = getCapsuleById(capsuleId);
    const items = loadItems(capsuleId);

    if (!capsule) return;

    const statusLabels = { draft: 'Черновик', active: 'В работе', review: 'На проверке', completed: 'Завершена' };

    // Находим первое изображение из артикулов или референс капсулы (async для IndexedDB)
    const heroImage = await getHeroImage(capsule, items);
    
    // Получаем палитру капсулы
    const paletteColors = getCapsulePaletteColors(capsule);
    
    document.getElementById('page-items').innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h2>${capsule.name}</h2>
                <p>${capsule.season} • ${items.length} артикулов • <span class="status-badge ${capsule.status}" style="font-size:11px;padding:2px 8px;">${statusLabels[capsule.status]}</span></p>
            </div>
            <div style="display:flex;gap:12px;">
                <button class="btn btn-secondary" onclick="generatePromptsForCapsule('${capsuleId}')" title="Сгенерировать промпты для всех артикулов без промптов">✨ Промпты</button>
                <button class="btn btn-secondary" onclick="openExportModal('${capsuleId}')">📤 Экспорт</button>
                <button class="btn btn-secondary" onclick="analyzeCapsulewithAI('${capsuleId}')">🤖 Анализ</button>
                <button class="btn btn-secondary" onclick="backToCapsules()">← Назад</button>
            </div>
        </div>
        
        <div class="items-layout">
            <!-- Hero Preview Sidebar -->
            <div class="capsule-hero-sidebar">
                <div class="hero-image-container" onclick="openHeroImageUpload()">
                    ${heroImage 
                        ? `<img src="${heroImage}" alt="${capsule.name}" class="hero-image">`
                        : `<div class="hero-placeholder">
                            <div class="hero-placeholder-icon">📷</div>
                            <div class="hero-placeholder-text">Нажмите для загрузки<br>изображения капсулы</div>
                           </div>`
                    }
                </div>
                <input type="file" id="heroImageInput" accept="image/*" style="display:none;" onchange="handleHeroImageUpload(event)">
                
                <div class="hero-info">
                    <div class="hero-info-row">
                        <span class="hero-info-label">Сезон</span>
                        <span class="hero-info-value">${capsule.season}</span>
                    </div>
                    <div class="hero-info-row">
                        <span class="hero-info-label">Пол</span>
                        <span class="hero-info-value">${capsule.gender === 'boys' ? '👦 Мальчики' : capsule.gender === 'girls' ? '👧 Девочки' : '👫 Унисекс'}</span>
                    </div>
                    <div class="hero-info-row">
                        <span class="hero-info-label">Возраст</span>
                        <span class="hero-info-value">${capsule.ageRange || '4-16'} лет</span>
                    </div>
                    <div class="hero-info-row">
                        <span class="hero-info-label">Артикулов</span>
                        <span class="hero-info-value">${items.length}</span>
                    </div>
                </div>
                
                <div class="hero-palette">
                    <div class="hero-palette-title">Палитра</div>
                    <div class="hero-palette-colors">
                        ${paletteColors.slice(0, 5).map(c => `
                            <div class="hero-color" style="background:${c.hex || '#ccc'}" title="${c.name || ''}\n${c.code || ''}"></div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="hero-stats">
                    <div class="hero-stat">
                        <div class="hero-stat-value">${items.filter(i => i.status === 'approved').length}</div>
                        <div class="hero-stat-label">Готово</div>
                    </div>
                    <div class="hero-stat">
                        <div class="hero-stat-value">${items.filter(i => i.status === 'generation' || i.status === 'review').length}</div>
                        <div class="hero-stat-label">В работе</div>
                    </div>
                    <div class="hero-stat">
                        <div class="hero-stat-value">${items.filter(i => i.status === 'brief').length}</div>
                        <div class="hero-stat-label">Бриф</div>
                    </div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="items-main">
                <div class="items-toolbar">
                    <div class="toolbar-left">
                        <div class="view-toggle">
                            <button class="view-btn ${currentViewMode === 'table' ? 'active' : ''}" onclick="setView('table')">☰ Таблица</button>
                            <button class="view-btn ${currentViewMode === 'kanban' ? 'active' : ''}" onclick="setView('kanban')">▤ Kanban</button>
                        </div>
                        <div class="filter-pills">
                            <button class="filter-pill ${currentFilter === 'all' ? 'active' : ''}" onclick="setFilter('all')">Все <span class="pill-count">${items.length}</span></button>
                            <button class="filter-pill ${currentFilter === 'brief' ? 'active' : ''}" onclick="setFilter('brief')">Бриф <span class="pill-count">${items.filter(i=>i.status==='brief').length}</span></button>
                            <button class="filter-pill ${currentFilter === 'prompt' ? 'active' : ''}" onclick="setFilter('prompt')">Промпт <span class="pill-count">${items.filter(i=>i.status==='prompt').length}</span></button>
                            <button class="filter-pill ${currentFilter === 'generation' ? 'active' : ''}" onclick="setFilter('generation')">Генерация <span class="pill-count">${items.filter(i=>i.status==='generation').length}</span></button>
                            <button class="filter-pill ${currentFilter === 'review' ? 'active' : ''}" onclick="setFilter('review')">Проверка <span class="pill-count">${items.filter(i=>i.status==='review').length}</span></button>
                            <button class="filter-pill ${currentFilter === 'approved' ? 'active' : ''}" onclick="setFilter('approved')">Готово <span class="pill-count">${items.filter(i=>i.status==='approved').length}</span></button>
                        </div>
                    </div>
                    <input type="text" class="search-input" placeholder="Поиск..." id="itemSearch" oninput="debouncedSearch(refreshItems)">
                </div>
                
                <div id="itemsContent">${currentViewMode === 'table' ? renderTable(items) : renderKanban(items)}</div>
            </div>
        </div>
    `;
}

// Получить hero-изображение капсулы (async для IndexedDB)
async function getHeroImage(capsule, items) {
    // 1. Проверяем есть ли ID изображения в IndexedDB
    if (capsule.heroImageId) {
        const image = await loadImageFromIDB(capsule.heroImageId);
        if (image) return image;
    }

    // 2. Fallback на старый формат (base64 в данных)
    if (capsule.heroImage) return capsule.heroImage;
    if (capsule.refImage) return capsule.refImage;

    // 3. Ищем первый артикул с изображением
    const itemWithImage = items.find(i => i.images && i.images.length > 0);
    if (itemWithImage) return itemWithImage.images[0];

    return null;
}

// Открыть диалог загрузки hero-изображения
function openHeroImageUpload() {
    document.getElementById('heroImageInput').click();
}

// Обработчик загрузки hero-изображения (со сжатием + IndexedDB)
async function handleHeroImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Выберите изображение', 'error');
        return;
    }

    try {
        showToast('Сжатие изображения...', 'success');
        const imageData = await compressImage(file);

        // Сохраняем изображение в IndexedDB
        const imageId = `capsule-${currentCapsuleId}-hero`;
        await saveImageToIDB(imageId, imageData);

        // Сохраняем только ссылку в капсулу (не base64)
        updateCapsule(currentCapsuleId, { heroImageId: imageId });

        // Перерисовываем страницу
        renderItemsPage(currentCapsuleId);
        showToast('Изображение капсулы загружено', 'success');
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showToast('Ошибка загрузки файла', 'error');
    }
}


// =============================================
// TABLE VIEW
// =============================================
function renderTable(items) {
    const search = (document.getElementById('itemSearch')?.value || '').toLowerCase();
    const filtered = items.filter(i => {
        if (currentFilter !== 'all' && i.status !== currentFilter) return false;
        if (search && !(i.sku || '').toLowerCase().includes(search) && !(i.name || '').toLowerCase().includes(search)) return false;
        return true;
    });

    if (!filtered.length) return '<p style="text-align:center;padding:60px;color:var(--gray-500);">Ничего не найдено</p>';

    const catLabels = { jackets: 'Куртки', hoodies: 'Худи', pants: 'Брюки', tshirts: 'Футболки', accessories: 'Аксессуары', shoes: 'Обувь' };
    const statLabels = { brief: 'Бриф', prompt: 'Промпт', generation: 'Генерация', review: 'Проверка', approved: 'Готово' };

    const html = `<table class="items-table">
        <thead><tr><th></th><th>SKU</th><th>Название</th><th>Категория</th><th>Цвета</th><th>Статус</th><th>Цена</th></tr></thead>
        <tbody>${filtered.map(i => `
            <tr onclick="openItemModal('${i.id}')">
                <td><div class="item-image-thumb">${i.images && i.images.length > 0
                    ? lazyImageHTML(i.images[0], i.name, 'item-thumb-img')
                    : '📷'}</div></td>
                <td><span class="item-sku">${i.sku || i.id || ''}</span></td>
                <td><span class="item-name">${i.name}</span></td>
                <td>${catLabels[i.category]}</td>
                <td><div class="item-colors"><div class="color-dot" style="background:${i.baseColor?.hex || i.colors?.[0]?.hex || '#ccc'}"></div><div class="color-dot" style="background:${i.accentColor?.hex || i.colors?.[1]?.hex || '#eee'}"></div></div></td>
                <td><span class="item-status ${i.status}">${statLabels[i.status]}</span></td>
                <td><span class="item-price">${(i.priceTarget || i.price || 0).toLocaleString()}₽</span></td>
            </tr>
        `).join('')}</tbody>
    </table>`;

    // После рендера запустим lazy loading
    setTimeout(() => observeLazyImages(), 0);

    return html;
}

// =============================================
// KANBAN VIEW
// =============================================
function renderKanban(items) {
    const statuses = [
        { id: 'brief', label: '📋 Бриф' },
        { id: 'prompt', label: '✏️ Промпт' },
        { id: 'generation', label: '🎨 Генерация' },
        { id: 'review', label: '👁️ Проверка' },
        { id: 'approved', label: '✅ Готово' }
    ];
    const search = (document.getElementById('itemSearch')?.value || '').toLowerCase();
    
    return `<div class="kanban-board">${statuses.map(s => {
        const col = items.filter(i => i.status === s.id && (!search || (i.sku || '').toLowerCase().includes(search) || (i.name || '').toLowerCase().includes(search)));
        return `<div class="kanban-column">
            <div class="kanban-header ${s.id}"><span class="kanban-title">${s.label}</span><span class="kanban-count">${col.length}</span></div>
            <div class="kanban-items" ondragover="event.preventDefault()" ondrop="dropItem(event,'${s.id}')">
                ${col.map(i => `<div class="kanban-card" draggable="true" ondragstart="dragItem(event,'${i.id}')" onclick="openItemModal('${i.id}')">
                    <div class="kanban-card-sku">${i.sku || i.id || ''}</div>
                    <div class="kanban-card-name">${i.name}</div>
                    <div class="kanban-card-footer">
                        <div class="kanban-card-colors"><div class="color-dot" style="background:${i.baseColor?.hex || i.colors?.[0]?.hex || '#ccc'}"></div><div class="color-dot" style="background:${i.accentColor?.hex || i.colors?.[1]?.hex || '#eee'}"></div></div>
                        <span class="kanban-card-price">${(i.priceTarget || i.price || 0).toLocaleString()}₽</span>
                    </div>
                </div>`).join('')}
            </div>
        </div>`;
    }).join('')}</div>`;
}

// =============================================
// VIEW CONTROLS
// =============================================
function setView(mode) { currentViewMode = mode; refreshItems(); }
function setFilter(f) { currentFilter = f; refreshItems(); }
function refreshItems() {
    const items = loadItems(currentCapsuleId);
    document.getElementById('itemsContent').innerHTML = currentViewMode === 'table' ? renderTable(items) : renderKanban(items);
}

// =============================================
// DRAG & DROP
// =============================================
let draggedId = null;
function dragItem(e, id) { draggedId = id; }
function dropItem(e, status) {
    e.preventDefault();
    if (draggedId) {
        updateItem(currentCapsuleId, draggedId, { status });
        refreshItems();
        showToast('Статус изменён', 'success');
    }
    draggedId = null;
}

// =============================================
// ITEM MODAL
// =============================================
function openItemModal(itemId) {
    currentItemId = itemId;
    const item = getItemById(currentCapsuleId, itemId);
    if (!item) return;

    // Получаем палитру капсулы
    const capsules = JSON.parse(localStorage.getItem('kari-capsules') || '[]');
    const capsule = capsules.find(c => c.id === currentCapsuleId);
    const paletteColors = capsule ? getCapsulePaletteColors(capsule) : [];

    // Превью изображения
    const imagePreview = item.images && item.images.length > 0 
        ? `<img src="${item.images[0]}" style="max-width:100%;max-height:200px;border-radius:8px;object-fit:cover;">`
        : `<div class="image-upload-icon">📷</div>
           <div class="image-upload-text">Нажмите для загрузки</div>`;
    
    document.getElementById('itemModalTitle').textContent = item.sku || item.id || 'Артикул';
    document.getElementById('itemModalBody').innerHTML = `
        <div class="item-detail-grid">
            <div>
                <div class="item-detail-section">
                    <div class="item-detail-label">Название</div>
                    <input type="text" class="form-input" id="editName" value="${item.name}">
                </div>
                <div class="item-detail-section">
                    <div class="item-detail-label">Статус</div>
                    <select class="form-select" id="editStatus">
                        <option value="brief" ${item.status==='brief'?'selected':''}>📋 Бриф</option>
                        <option value="prompt" ${item.status==='prompt'?'selected':''}>✏️ Промпт</option>
                        <option value="generation" ${item.status==='generation'?'selected':''}>🎨 Генерация</option>
                        <option value="review" ${item.status==='review'?'selected':''}>👁️ Проверка</option>
                        <option value="approved" ${item.status==='approved'?'selected':''}>✅ Готово</option>
                    </select>
                </div>
                <div class="item-detail-section">
                    <div class="item-detail-label">Цвета</div>
                    ${paletteColors.length > 0 ? `
                    <div style="margin-bottom:12px;">
                        <label style="font-size:12px;color:var(--gray-600);display:block;margin-bottom:4px;">Базовый цвет:</label>
                        <select class="form-input" id="editBaseColor" style="width:100%;">
                            ${paletteColors.map(c => `
                                <option value="${c.code}" ${(item.baseColor?.code || '') === c.code ? 'selected' : ''}>
                                    ${c.name} (${c.code})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="font-size:12px;color:var(--gray-600);display:block;margin-bottom:4px;">Акцентный цвет:</label>
                        <select class="form-input" id="editAccentColor" style="width:100%;">
                            ${paletteColors.map(c => `
                                <option value="${c.code}" ${(item.accentColor?.code || '') === c.code ? 'selected' : ''}>
                                    ${c.name} (${c.code})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    ` : `
                    <div style="font-size:13px;color:var(--gray-500);">
                        ${Array.isArray(item.colors) && item.colors.length > 0
                            ? item.colors.map(c => `<span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:${c.hex || '#ccc'};vertical-align:middle;margin-right:4px;border:1px solid rgba(0,0,0,0.1);"></span>${c.name || c.code || ''}`).join(', ')
                            : 'Не указаны'
                        }
                    </div>
                    `}
                </div>
                <div class="item-detail-section">
                    <div class="item-detail-label">Материалы</div>
                    <input type="text" class="form-input" id="editMaterials" value="${item.materials || ''}">
                </div>
                <div class="item-detail-section">
                    <div class="item-detail-label">Цена</div>
                    <input type="number" class="form-input" id="editPrice" value="${item.priceTarget || item.price || 0}" style="width:150px"> ₽
                </div>
            </div>
            <div>
                <div class="item-detail-section">
                    <div class="item-detail-label">Промпт для AI</div>
                    <textarea class="prompt-textarea" id="editPrompt">${item.prompt || ''}</textarea>
                    <div style="display:flex;gap:8px;margin-top:8px;">
                        <button class="btn btn-secondary" onclick="copyPrompt()">📋 Копировать</button>
                        <button class="btn btn-primary" id="generatePromptBtn" onclick="generatePromptForCurrentItem()">
                            <span class="btn-text">🤖 Сгенерировать</span>
                            <span class="btn-loader" style="display:none;">⏳</span>
                        </button>
                    </div>
                </div>
                <div class="item-detail-section">
                    <div class="item-detail-label">Изображение</div>
                    <input type="file" id="itemImageInput" accept="image/*" style="display:none;" onchange="handleItemImageUpload(event)">
                    <div class="image-upload-area" onclick="document.getElementById('itemImageInput').click()" style="cursor:pointer;">
                        ${imagePreview}
                    </div>
                    ${item.images && item.images.length > 0 ? `
                        <button class="btn btn-secondary" style="margin-top:8px;width:100%;" onclick="removeItemImage()">🗑️ Удалить фото</button>
                    ` : ''}
                </div>
            </div>
        </div>
        
        <div style="margin-top:20px;border-top:1px solid var(--gray-200);padding-top:20px;">
            <div class="item-detail-label">💬 Комментарии</div>
            <div class="comment-input-row">
                <input type="text" class="comment-input" id="newComment" placeholder="Написать комментарий...">
                <button class="btn btn-primary" onclick="addComment()">Отправить</button>
            </div>
            <div id="commentList" style="margin-top:16px;">
                ${item.comments && item.comments.length ? item.comments.map(c => `
                    <div class="comment-item">
                        <div class="comment-avatar">${c.author.substring(0,2).toUpperCase()}</div>
                        <div class="comment-content">
                            <div class="comment-header"><span class="comment-author">${c.author}</span><span class="comment-date">${new Date(c.date).toLocaleDateString('ru-RU')}</span></div>
                            <div class="comment-text">${c.text}</div>
                        </div>
                    </div>
                `).join('') : '<p style="color:var(--gray-400);">Комментариев нет</p>'}
            </div>
        </div>
        
        <div class="modal-actions">
            <button class="btn btn-primary" onclick="saveItem()">💾 Сохранить</button>
            <button class="btn btn-secondary" onclick="closeItemModal()">Отмена</button>
        </div>
    `;
    document.getElementById('itemModal').classList.add('active');
}

// =============================================
// IMAGE UPLOAD (со сжатием)
// =============================================
async function handleItemImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Проверка типа
    if (!file.type.startsWith('image/')) {
        showToast('Выберите изображение', 'error');
        return;
    }

    try {
        showToast('Сжатие изображения...', 'success');
        const imageData = await compressImage(file);

        // Сохраняем в артикул
        const item = getItemById(currentCapsuleId, currentItemId);
        if (item) {
            updateItem(currentCapsuleId, currentItemId, {
                images: [imageData]
            });

            // Обновляем превью в модалке
            openItemModal(currentItemId);
            showToast('Изображение загружено', 'success');
        }
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showToast('Ошибка загрузки файла', 'error');
    }
}

function removeItemImage() {
    if (!confirm('Удалить изображение?')) return;
    
    updateItem(currentCapsuleId, currentItemId, { images: [] });
    openItemModal(currentItemId);
    showToast('Изображение удалено', 'success');
}

// =============================================
// PROMPT FUNCTIONS
// =============================================
function copyPrompt() {
    const prompt = document.getElementById('editPrompt').value;
    if (!prompt) {
        showToast('Промпт пустой', 'error');
        return;
    }
    navigator.clipboard.writeText(prompt);
    showToast('Промпт скопирован!', 'success');
}

function addComment() {
    const text = document.getElementById('newComment').value.trim();
    if (!text) return;
    const item = getItemById(currentCapsuleId, currentItemId);
    const comments = [...(item.comments || []), { author: 'Дизайнер', text, date: new Date().toISOString() }];
    updateItem(currentCapsuleId, currentItemId, { comments });
    openItemModal(currentItemId);
    showToast('Комментарий добавлен', 'success');
}

function saveItem() {
    // Получаем капсулу и палитру для поиска полной информации о цветах
    const capsule = getCapsuleById(currentCapsuleId);
    const paletteColors = getCapsulePaletteColors(capsule);

    // Получаем выбранные коды цветов
    const baseColorCode = document.getElementById('editBaseColor')?.value;
    const accentColorCode = document.getElementById('editAccentColor')?.value;

    // Находим полную информацию о цветах по коду
    const baseColorFull = paletteColors.find(c => c.code === baseColorCode);
    const accentColorFull = paletteColors.find(c => c.code === accentColorCode);

    const updates = {
        name: document.getElementById('editName').value,
        status: document.getElementById('editStatus').value,
        priceTarget: parseInt(document.getElementById('editPrice').value) || 0,
        prompt: document.getElementById('editPrompt').value,
        materials: document.getElementById('editMaterials')?.value || ''
    };

    // Добавляем цвета если они выбраны
    if (baseColorFull) {
        updates.baseColor = {
            name: baseColorFull.name,
            code: baseColorFull.code,
            hex: baseColorFull.hex
        };
    }
    if (accentColorFull) {
        updates.accentColor = {
            name: accentColorFull.name,
            code: accentColorFull.code,
            hex: accentColorFull.hex
        };
    }

    updateItem(currentCapsuleId, currentItemId, updates);
    closeItemModal();
    refreshItems();
    showToast('Сохранено', 'success');
}

// =============================================
// GENERATE PROMPT FOR CURRENT ITEM
// =============================================
async function generatePromptForCurrentItem() {
    const btn = document.getElementById('generatePromptBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    
    // Показываем индикатор загрузки
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';
    
    try {
        // Проверяем наличие функции генерации
        if (typeof generatePromptWithClaude !== 'function') {
            showToast('Claude API не подключен', 'error');
            return;
        }
        
        const item = getItemById(currentCapsuleId, currentItemId);
        const capsule = getCapsuleById(currentCapsuleId);
        
        if (!item || !capsule) {
            showToast('Ошибка загрузки данных', 'error');
            return;
        }
        
        const prompt = await generatePromptWithClaude(item, capsule);
        
        if (prompt) {
            document.getElementById('editPrompt').value = prompt;
            showToast('Промпт сгенерирован!', 'success');
        }
    } catch (error) {
        console.error('[Items] Ошибка генерации промпта:', error);
        showToast('Ошибка генерации: ' + error.message, 'error');
    } finally {
        // Скрываем индикатор
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

// =============================================
// GENERATE PROMPTS FOR ALL ITEMS IN CAPSULE
// =============================================

// =============================================
// AI ANALYSIS
// =============================================
async function itemsAnalyzeCapsulewithAI(capsuleId) {
    // Проверяем наличие функции анализа в claude-api.js
    if (typeof analyzeCapsulewithAI === 'function') {
        return analyzeCapsulewithAI(capsuleId);
    }
    
    // Fallback на ручной режим
    requestAnalysis();
}

function requestAnalysis() {
    const capsule = getCapsuleById(currentCapsuleId);
    const items = loadItems(currentCapsuleId);
    
    document.getElementById('itemModalTitle').textContent = '🤖 Анализ Claude';
    document.getElementById('itemModalBody').innerHTML = `
        <p style="margin-bottom:16px;color:var(--gray-600);">Скопируйте данные и вставьте в Claude:</p>
        <textarea class="prompt-textarea" style="min-height:250px;" readonly>Проанализируй капсулу KARI:
Название: ${capsule.name}
Сезон: ${capsule.season}
Пол: ${capsule.gender}
Возраст: ${capsule.ageRange}
Всего артикулов: ${items.length}
Статистика: Brief=${capsule.itemsByStatus.brief}, Prompt=${capsule.itemsByStatus.prompt || 0}, Generation=${capsule.itemsByStatus.generation}, Review=${capsule.itemsByStatus.review}, Approved=${capsule.itemsByStatus.approved}

Категории:
${Object.entries(capsule.categories).map(([cat, count]) => `- ${cat}: ${count} шт`).join('\n')}

Дай анализ:
1. Качество промптов
2. Баланс категорий
3. Ценовая политика
4. Рекомендации по улучшению</textarea>
        <button class="btn btn-primary" onclick="navigator.clipboard.writeText(document.querySelector('#itemModalBody textarea').value); showToast('Скопировано!');" style="margin-top:12px;">📋 Копировать</button>
    `;
    document.getElementById('itemModal').classList.add('active');
}


// =============================================
// ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ
// =============================================
window.generateItems = generateItems;
window.loadItems = loadItems;
window.saveItems = saveItems;
window.getItemById = getItemById;
window.updateItem = updateItem;
window.updateCapsuleStats = updateCapsuleStats;
window.renderItemsPage = renderItemsPage;
window.renderTable = renderTable;
window.renderKanban = renderKanban;
window.setView = setView;
window.setFilter = setFilter;
window.refreshItems = refreshItems;
window.dragItem = dragItem;
window.dropItem = dropItem;
window.openItemModal = openItemModal;
window.closeItemModal = closeItemModal;
window.handleItemImageUpload = handleItemImageUpload;
window.removeItemImage = removeItemImage;
window.copyPrompt = copyPrompt;
window.addComment = addComment;
window.saveItem = saveItem;
window.requestAnalysis = requestAnalysis;
window.generatePromptForCurrentItem = generatePromptForCurrentItem;
// analyzeCapsulewithAI экспортируется из claude-api.js
window.getCapsulePaletteColors = getCapsulePaletteColors;
window.getHeroImage = getHeroImage;
window.openHeroImageUpload = openHeroImageUpload;
window.handleHeroImageUpload = handleHeroImageUpload;

console.log('👕 Items module loaded');
