// =============================================
// KARI Design Hub - Capsules Module
// =============================================

// =============================================
// RENDER CAPSULES
// =============================================
function renderCapsules() {
    const capsules = loadCapsules();
    const grid = document.getElementById('capsulesGrid');
    
    document.getElementById('statTotal').textContent = capsules.length;
    document.getElementById('statActive').textContent = capsules.filter(c => c.status === 'active').length;
    document.getElementById('statReview').textContent = capsules.filter(c => c.status === 'review').length;
    document.getElementById('statCompleted').textContent = capsules.filter(c => c.status === 'completed').length;
    
    const statusLabels = { draft: 'Черновик', active: 'В работе', review: 'На проверке', completed: 'Завершена' };
    const genderLabels = { boys: 'Мальчики', girls: 'Девочки', unisex: 'Унисекс' };
    
    // Загружаем палитры для отображения
    const palettes = typeof loadPalettes === 'function' ? loadPalettes() : [];
    
    grid.innerHTML = '';
    
    capsules.forEach(c => {
        // Проверка на наличие itemsByStatus (для старых капсул)
        if (!c.itemsByStatus) {
            c.itemsByStatus = { brief: 0, prompt: 0, generation: 0, review: 0, approved: 0 };
        }
        const progress = c.totalItems > 0 ? Math.round((c.itemsByStatus.approved / c.totalItems) * 100) : 0;
        const date = new Date(c.updatedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
        
        // Получаем палитру для карточки
        let paletteColors = [];
        let paletteName = '';
        if (c.paletteId) {
            const palette = palettes.find(p => p.id === c.paletteId);
            if (palette) {
                paletteColors = palette.colors;
                paletteName = palette.name;
            }
        } else if (Array.isArray(c.palette)) {
            paletteColors = c.palette;
            paletteName = c.fromPrototype ? 'Прототип' : '';
        } else if (c.palette?.mode === 'manual' && c.palette.colors) {
            paletteColors = c.palette.colors;
            paletteName = 'Ручная';
        }
        
        const palettePreview = paletteColors.length > 0 
            ? `<div class="capsule-palette-preview">
                ${paletteColors.slice(0, 5).map(col => `<div class="capsule-palette-dot" style="background: ${col.hex};" title="${col.name}"></div>`).join('')}
                ${paletteName ? `<span class="capsule-palette-name">${paletteName}</span>` : ''}
               </div>`
            : '';
        
        grid.innerHTML += `
            <div class="capsule-card" onclick="openCapsule('${c.id}')">
                <button class="capsule-delete-btn" onclick="event.stopPropagation(); deleteCapsule('${c.id}', '${c.name.replace(/'/g, "\\'")}')" title="Удалить капсулу">×</button>
                <div class="capsule-header">
                    <span class="capsule-season">${c.season}</span>
                    <h3 class="capsule-name">${c.name}</h3>
                    <p class="capsule-meta">${genderLabels[c.gender] || 'Унисекс'}${c.ageRange ? ', ' + c.ageRange + ' лет' : ''} • ${c.totalItems} SKU</p>
                    ${palettePreview}
                </div>
                <div class="capsule-body">
                    <div class="capsule-progress">
                        <div class="progress-header">
                            <span class="progress-label">Готовность</span>
                            <span class="progress-value">${c.itemsByStatus.approved}/${c.totalItems}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    <div class="capsule-stats">
                        <div class="capsule-stat"><div class="capsule-stat-value">${c.itemsByStatus.brief}</div><div class="capsule-stat-label">Бриф</div></div>
                        <div class="capsule-stat"><div class="capsule-stat-value">${c.itemsByStatus.generation}</div><div class="capsule-stat-label">Генерация</div></div>
                        <div class="capsule-stat"><div class="capsule-stat-value">${c.itemsByStatus.review}</div><div class="capsule-stat-label">Проверка</div></div>
                        <div class="capsule-stat"><div class="capsule-stat-value">${c.itemsByStatus.approved}</div><div class="capsule-stat-label">Готово</div></div>
                    </div>
                </div>
                <div class="capsule-footer">
                    <span class="status-badge ${c.status}"><span class="status-dot"></span>${statusLabels[c.status]}</span>
                    <span class="capsule-date">${date}</span>
                </div>
            </div>
        `;
    });
}

function openCapsule(capsuleId) {
    localStorage.setItem('kari-active-capsule', capsuleId);
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="items"]').classList.add('active');
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-items').classList.add('active');
    
    renderItemsPage(capsuleId);
}

function backToCapsules() {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="capsules"]').classList.add('active');
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-capsules').classList.add('active');
    
    renderCapsules();
}

// =============================================
// NEW CAPSULE WIZARD
// =============================================
let currentStep = 1;
let currentMode = 'manual';
let refImageData = null;

function openNewCapsuleModal() {
    currentStep = 1;
    currentMode = 'manual';
    paletteMode = 'select';
    selectedPaletteId = null;
    refImageData = null;
    updateWizardUI();
    document.getElementById('newCapsuleModal').classList.add('active');
    document.getElementById('capsuleName').value = '';
    document.getElementById('capsuleSeason').value = 'AW26';
    document.getElementById('capsuleTarget').value = '';
    document.getElementById('capsuleAge').value = '';
    document.getElementById('capsuleGender').value = 'unisex';
    document.getElementById('capsuleDescription').value = '';
    categoryRows = getDefaultCategoryRows();
    renderCategoriesList();
    updateTotalSku();
    // Сбрасываем палитру — пользователь добавляет цвета сам через пикер
    const colorsContainer = document.getElementById('colorsContainer');
    if (colorsContainer) colorsContainer.innerHTML = '';
    updateTotalPercent();
    
    // КРИТИЧНО: Инициализируем область загрузки референса после открытия модалки
    setTimeout(initRefUploadArea, 100);
    
    // Сброс режима Claude
    setMode('manual');
    document.getElementById('refUploadArea').innerHTML = `
        <div class="image-upload-icon">📷</div>
        <div class="image-upload-text">Нажмите для загрузки фото</div>
        <div class="image-upload-hint">или перетащите файл сюда</div>
    `;
    document.getElementById('refUploadArea').classList.remove('has-image');
    document.getElementById('claudeSkuCount').value = '6';
    document.getElementById('claudeImagesCount').value = '3';
    document.getElementById('claudeNotes').value = '';
    
    // Сброс палитры - теперь режим select по умолчанию
    setPaletteMode('select');
}

function nextStep() {
    if (currentStep === 1) {
        if (!document.getElementById('capsuleName').value.trim()) { showToast('Введите название', 'error'); return; }
        if (!document.getElementById('capsuleSeason').value) { showToast('Выберите сезон', 'error'); return; }
        if (!document.getElementById('capsuleTarget').value) { showToast('Выберите группу', 'error'); return; }
    }
    if (currentStep < 3) { currentStep++; updateWizardUI(); }
}

function prevStep() {
    if (currentStep > 1) { currentStep--; updateWizardUI(); }
}

function updateWizardUI() {
    document.querySelectorAll('.wizard-step').forEach(s => {
        const n = parseInt(s.dataset.step);
        s.classList.remove('active', 'completed');
        if (n === currentStep) s.classList.add('active');
        else if (n < currentStep) s.classList.add('completed');
    });
    
    document.querySelectorAll('.wizard-content').forEach(c => c.style.display = 'none');
    document.getElementById('step' + currentStep).style.display = 'block';
    
    document.getElementById('btnPrev').style.display = currentStep > 1 ? 'inline-flex' : 'none';
    document.getElementById('btnNext').style.display = currentStep < 3 ? 'inline-flex' : 'none';
    document.getElementById('btnCreate').style.display = currentStep === 3 ? 'inline-flex' : 'none';
}

// =============================================
// UNIFIED CATEGORIES (manual mode)
// =============================================
let categoryRows = [];

function getDefaultCategoryRows() {
    return [
        { key: 'jackets',     name: '🧥 Куртки',     count: 0 },
        { key: 'hoodies',     name: '👕 Худи',       count: 0 },
        { key: 'pants',       name: '👖 Брюки',      count: 0 },
        { key: 'tshirts',     name: '👚 Футболки',   count: 0 },
        { key: 'accessories', name: '🎒 Аксессуары', count: 0 },
        { key: 'shoes',       name: '👟 Обувь',      count: 0 }
    ];
}

function renderCategoriesList() {
    const container = document.getElementById('categoriesList');
    if (!container) return;
    container.innerHTML = categoryRows.map((c, idx) => `
        <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
            <input type="text" class="form-input" placeholder="Название категории" value="${c.name || ''}" oninput="updateCategoryRow(${idx},'name',this.value)" style="flex:1;">
            <input type="number" class="form-input" min="0" max="99" value="${c.count || 0}" oninput="updateCategoryRow(${idx},'count',this.value)" style="width:90px;" placeholder="Кол-во">
            <button type="button" class="btn-icon" onclick="removeCategoryRow(${idx})" title="Удалить категорию">✕</button>
        </div>
    `).join('');
}

function addCategoryRow() {
    categoryRows.push({ key: 'cust-' + Date.now() + '-' + categoryRows.length, name: '', count: 1 });
    renderCategoriesList();
    updateTotalSku();
}

function removeCategoryRow(idx) {
    categoryRows.splice(idx, 1);
    renderCategoriesList();
    updateTotalSku();
}

function updateCategoryRow(idx, field, value) {
    if (!categoryRows[idx]) return;
    categoryRows[idx][field] = field === 'count' ? parseInt(value) || 0 : value;
    if (field === 'count') updateTotalSku();
}

function updateTotalSku() {
    const total = (categoryRows || []).reduce((s, c) => s + (parseInt(c.count) || 0), 0);
    const el = document.getElementById('totalSku');
    if (el) el.textContent = total;
}


// =============================================
// MODE SELECTOR (Manual / Claude) - Step 2
// =============================================
function setMode(mode) {
    currentMode = mode;
    
    document.getElementById('modeManual').classList.toggle('active', mode === 'manual');
    document.getElementById('modeClaude').classList.toggle('active', mode === 'claude');
    
    document.getElementById('manualMode').style.display = mode === 'manual' ? 'block' : 'none';
    document.getElementById('claudeMode').style.display = mode === 'claude' ? 'block' : 'none';
}

async function handleRefImageUpload(event) {
    console.log('[Capsules] handleRefImageUpload triggered');
    
    const file = event.target?.files?.[0];
    if (!file) {
        console.warn('[Capsules] No file selected');
        return;
    }
    
    console.log('[Capsules] File selected:', file.name, file.type, file.size);
    
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
        showToast('Выберите изображение', 'error');
        return;
    }

    try {
        showToast('Сжатие изображения...', 'success');
        // Используем compressImage из items.js
        refImageData = await compressImage(file);
        console.log('[Capsules] Image compressed, size:', refImageData.length);

        const area = document.getElementById('refUploadArea');
        if (area) {
            area.innerHTML = `
                <img src="${refImageData}" style="max-height: 150px; max-width: 100%; border-radius: 8px;">
                <div style="margin-top: 8px; font-size: 12px; color: #10B981;">✓ Фото сжато</div>
            `;
            area.classList.add('has-image');
        }
        showToast('Референс загружен', 'success');
    } catch (err) {
        console.error('[Capsules] Compression error:', err);
        showToast('Ошибка загрузки файла', 'error');
    }
}

// Альтернативная функция для клика по области загрузки
function triggerRefImageUpload() {
    console.log('[Capsules] triggerRefImageUpload called');
    const input = document.getElementById('refImageInput');
    if (input) {
        console.log('[Capsules] Clicking input...');
        input.click();
    } else {
        console.error('[Capsules] refImageInput not found');
    }
}

// Инициализация drag-and-drop для области загрузки
let refUploadInitialized = false;

function initRefUploadArea() {
    const area = document.getElementById('refUploadArea');
    const input = document.getElementById('refImageInput');
    
    if (!area || !input) {
        console.log('[Capsules] Upload area not ready, will retry...');
        return;
    }
    
    // Защита от повторной инициализации
    if (refUploadInitialized) {
        console.log('[Capsules] Ref upload already initialized');
        return;
    }
    
    console.log('[Capsules] Initializing ref upload area');
    refUploadInitialized = true;
    
    // Клик по области
    area.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[Capsules] Area clicked');
        input.click();
    });
    
    // Drag and drop
    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('dragover');
    });
    
    area.addEventListener('dragleave', () => {
        area.classList.remove('dragover');
    });
    
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            // Имитируем событие change
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(files[0]);
            input.files = dataTransfer.files;
            handleRefImageUpload({ target: input });
        }
    });
    
    // Обработчик изменения input
    input.addEventListener('change', handleRefImageUpload);
    
    console.log('[Capsules] Ref upload area initialized');
}

// Вызываем инициализацию при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    // Небольшая задержка чтобы DOM точно был готов
    setTimeout(initRefUploadArea, 100);
});

function copyClaudeBrief() {
    const capsuleName = document.getElementById('capsuleName').value || 'Без названия';
    const season = document.getElementById('capsuleSeason').value || 'AW26';
    const target = document.getElementById('capsuleTarget').value || 'kids';
    const age = document.getElementById('capsuleAge').value || '8-12';
    const gender = document.getElementById('capsuleGender').value || 'unisex';
    
    const skuCount = document.getElementById('claudeSkuCount').value;
    const imagesCount = document.getElementById('claudeImagesCount').value;
    
    const accents = getSelectedOptions('claudeAccents');
    const materials = getSelectedOptions('claudeMaterials');
    const construction = document.getElementById('claudeConstruction').value;
    const style = document.getElementById('claudeStyle').value;
    const details = getSelectedOptions('claudeDetails');
    const notes = document.getElementById('claudeNotes').value;
    
    const genderLabels = { boys: 'Мальчики', girls: 'Девочки', unisex: 'Унисекс' };
    
    const brief = `БРИФ ДЛЯ ГЕНЕРАЦИИ КАПСУЛЫ KARI

📦 КАПСУЛА: ${capsuleName}

📊 ПАРАМЕТРЫ:
• Сезон: ${season}
• Целевая группа: ${genderLabels[gender] || gender}, ${age} лет
• Количество SKU: ${skuCount}
• Образов на SKU: ${imagesCount}

🎯 АКЦЕНТНЫЕ ЭЛЕМЕНТЫ: ${formatOptions(accents)}
🧵 МАТЕРИАЛЫ: ${formatOptions(materials)}
✂️ КОНСТРУКЦИЯ: ${formatOption(construction)}
🎨 СТИЛЬ: ${formatOption(style)}
✨ ДЕТАЛИ: ${formatOptions(details)}

${notes ? `💬 ДОПОЛНИТЕЛЬНО:\n${notes}\n` : ''}
📷 РЕФЕРЕНС: [Фото прикреплено выше]

═══════════════════════════════════════

ЗАДАЧА: На основе референса создай ${skuCount} вариаций для капсулы "${capsuleName}".

Для КАЖДОЙ вариации укажи:
1. Название (например: "${capsuleName} Classic", "${capsuleName} Urban")
2. Описание изменений относительно оригинала
3. Цветовую схему:
   • Базовый цвет (Pantone TCX)
   • Акцентный цвет (Pantone TCX)
4. Материалы с составом
5. Готовый промпт для Midjourney

ФОРМАТ ПРОМПТА MIDJOURNEY:
Professional child model, [AGE]-year-old [boy/girl], fully clothed, commercial studio photography, safe content, high-end children's fashion catalog.
[Описание модели и позы]
[Детальное описание одежды с Pantone кодами]
ENVIRONMENT: Clean light gray studio backdrop, soft diffused professional lighting
TECHNICAL: Full body shot, 4K resolution, Zara Kids aesthetic
--ar 3:4 --v 6 --style raw

═══════════════════════════════════════

ВАЖНО ДЛЯ KARI:
• Масс-маркет сегмент (себестоимость приоритет)
• Смесовые ткани предпочтительнее 100% натуральных
• Целевая розница: 890-9990₽
• Практичность: машинная стирка, не мнётся`;

    navigator.clipboard.writeText(brief).then(() => {
        showToast('Бриф скопирован! Вставьте в Claude вместе с фото', 'success');
    });
}

function getSelectedOptions(selectId) {
    const select = document.getElementById(selectId);
    const selected = [];
    for (let option of select.selectedOptions) {
        selected.push({ value: option.value, text: option.text });
    }
    return selected;
}

function formatOptions(options) {
    if (options.length === 0) return 'Не указано';
    if (options.some(o => o.value === 'claude')) {
        const others = options.filter(o => o.value !== 'claude');
        if (others.length === 0) return '[Определить по фото]';
        return '[Определить по фото] + ' + others.map(o => o.text).join(', ');
    }
    return options.map(o => o.text).join(', ');
}

function formatOption(value) {
    if (value === 'claude') return '[Определить по фото]';
    const labels = {
        'oversize': 'Оверсайз',
        'straight': 'Прямой крой',
        'fitted': 'Приталенный',
        'elongated': 'Удлинённый',
        'cropped': 'Укороченный',
        'streetwear': 'Streetwear',
        'sport-casual': 'Sport casual',
        'minimal': 'Minimal',
        'techwear': 'Techwear',
        'y2k': 'Y2K'
    };
    return labels[value] || value;
}

// =============================================
// PALETTE MODE (Manual / Claude / Select) - Step 3
// =============================================
let paletteMode = 'select';
let selectedPaletteId = null;

function setPaletteMode(mode) {
    paletteMode = mode;
    
    document.getElementById('paletteModeSelect')?.classList.toggle('active', mode === 'select');
    document.getElementById('paletteModeManual')?.classList.toggle('active', mode === 'manual');
    document.getElementById('paletteModeClaude')?.classList.toggle('active', mode === 'claude');
    
    document.getElementById('paletteSelectMode').style.display = mode === 'select' ? 'block' : 'none';
    document.getElementById('paletteManualMode').style.display = mode === 'manual' ? 'block' : 'none';
    document.getElementById('paletteClaudeMode').style.display = mode === 'claude' ? 'block' : 'none';
    
    if (mode === 'select') {
        renderPaletteSelectGrid();
    }
}

function renderPaletteSelectGrid() {
    const palettes = typeof loadPalettes === 'function' ? loadPalettes() : [];
    const grid = document.getElementById('paletteSelectGrid');
    
    if (!grid) return;
    
    if (palettes.length === 0) {
        grid.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 20px;">Нет доступных палитр. Создайте палитру в разделе "Палитра".</p>';
        return;
    }
    
    // Сортируем: сначала default, потом по сезону
    const sorted = [...palettes].sort((a, b) => {
        if (a.isDefault) return -1;
        if (b.isDefault) return 1;
        return (a.season || '').localeCompare(b.season || '');
    });
    
    // По умолчанию выбираем default палитру
    if (!selectedPaletteId) {
        const defaultPalette = sorted.find(p => p.isDefault);
        if (defaultPalette) selectedPaletteId = defaultPalette.id;
    }
    
    grid.innerHTML = sorted.map(p => `
        <div class="palette-select-card ${selectedPaletteId === p.id ? 'selected' : ''}" onclick="selectPalette('${p.id}')">
            <div class="palette-select-colors">
                ${p.colors.map(c => `<div class="palette-select-bar" style="background: ${c.hex}; flex: ${c.percent};"></div>`).join('')}
            </div>
            <div class="palette-select-info">
                <span class="palette-select-name">${p.name}</span>
                <span class="palette-select-season">${p.season}</span>
                ${p.isDefault ? '<span class="palette-select-default">⭐</span>' : ''}
            </div>
        </div>
    `).join('');
    
    // Показываем превью выбранной
    updateSelectedPalettePreview();
}

function selectPalette(id) {
    selectedPaletteId = id;
    
    // Обновляем визуал
    document.querySelectorAll('.palette-select-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    updateSelectedPalettePreview();
}

function updateSelectedPalettePreview() {
    const preview = document.getElementById('selectedPalettePreview');
    if (!preview || !selectedPaletteId) {
        if (preview) preview.style.display = 'none';
        return;
    }
    
    const palettes = typeof loadPalettes === 'function' ? loadPalettes() : [];
    const palette = palettes.find(p => p.id === selectedPaletteId);
    
    if (!palette) {
        preview.style.display = 'none';
        return;
    }
    
    preview.style.display = 'block';
    preview.querySelector('.selected-palette-name').textContent = palette.name;
    preview.querySelector('.selected-palette-season').textContent = palette.season;
    preview.querySelector('.selected-palette-colors').innerHTML = palette.colors.map(c => `
        <div class="selected-color-item">
            <div class="selected-color-swatch" style="background: ${c.hex};"></div>
            <div class="selected-color-info">
                <span class="selected-color-name">${c.name}</span>
                <span class="selected-color-code">${c.code}</span>
            </div>
            <span class="selected-color-percent">${c.percent}%</span>
        </div>
    `).join('');
}

function addColor() {
    const container = document.getElementById('colorsContainer');
    const row = document.createElement('div');
    row.className = 'color-row';
    row.innerHTML = `
        <input type="text" class="form-input color-input" placeholder="19-4005 TCX" style="width: 140px;">
        <input type="text" class="form-input" placeholder="Название" style="width: 120px;">
        <input type="color" class="color-picker" value="#888888" style="width: 50px; height: 42px; padding: 2px; cursor: pointer;">
        <input type="number" class="form-input percent-input" value="0" min="0" max="100" style="width: 70px;" oninput="updateTotalPercent()">
        <span style="color: var(--gray-500);">%</span>
        <button class="btn-icon" onclick="removeColor(this)" title="Удалить">✕</button>
    `;
    container.appendChild(row);
    updateTotalPercent();
}

function removeColor(btn) {
    const row = btn.closest('.color-row');
    row.remove();
    updateTotalPercent();
}

function updateTotalPercent() {
    const inputs = document.querySelectorAll('.percent-input');
    let total = 0;
    inputs.forEach(input => {
        total += parseInt(input.value) || 0;
    });
    
    const display = document.getElementById('totalPercentValue');
    display.textContent = total + '%';
    
    if (total === 100) {
        display.style.color = '#10B981'; // green
    } else if (total > 100) {
        display.style.color = '#EF4444'; // red
    } else {
        display.style.color = '#F59E0B'; // yellow
    }
}

function getColorsData() {
    const rows = document.querySelectorAll('.color-row');
    const colors = [];
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        colors.push({
            code: inputs[0].value,
            name: inputs[1].value,
            hex: inputs[2].value,
            percent: parseInt(inputs[3].value) || 0
        });
    });
    return colors;
}

// =============================================
// CREATE CAPSULE
// =============================================
function createCapsule() {
    let categories, totalItems;
    
    if (currentMode === 'manual') {
        // Унифицированный список категорий: и стандартные, и пользовательские
        const knownKeys = ['jackets','hoodies','pants','tshirts','accessories','shoes'];
        categories = { jackets:0, hoodies:0, pants:0, tshirts:0, accessories:0, shoes:0 };
        const customList = [];
        (categoryRows || []).forEach(r => {
            const cnt = parseInt(r.count) || 0;
            if (cnt <= 0 || !r.name || !r.name.trim()) return;
            if (knownKeys.includes(r.key)) {
                categories[r.key] = cnt;
            } else {
                customList.push({ name: r.name.trim(), count: cnt });
            }
        });
        totalItems = Object.values(categories).reduce((a, b) => a + b, 0)
                   + customList.reduce((s, c) => s + c.count, 0);
        if (totalItems === 0) { showToast('Добавьте артикулы', 'error'); return; }
        // прокидываем дальше через локальную переменную
        window.__pendingCustomCategories = customList;
    } else {
        // Режим Claude - равномерное распределение по категориям
        const skuCount = parseInt(document.getElementById('claudeSkuCount').value);
        
        // Умное распределение: куртки 20%, худи 25%, брюки 20%, футболки 20%, аксессуары 10%, обувь 5%
        const distribution = {
            jackets: Math.round(skuCount * 0.20),
            hoodies: Math.round(skuCount * 0.25),
            pants: Math.round(skuCount * 0.20),
            tshirts: Math.round(skuCount * 0.20),
            accessories: Math.round(skuCount * 0.10),
            shoes: Math.round(skuCount * 0.05)
        };
        
        // Корректировка остатка
        let distributed = Object.values(distribution).reduce((a, b) => a + b, 0);
        let diff = skuCount - distributed;
        
        // Добавляем остаток в худи (самая популярная категория)
        if (diff > 0) distribution.hoodies += diff;
        if (diff < 0) distribution.hoodies = Math.max(0, distribution.hoodies + diff);
        
        categories = distribution;
        totalItems = skuCount;
    }
    
    // Палитра - теперь три режима
    let palette;
    let paletteId = null;
    
    if (paletteMode === 'select') {
        // Выбрана из библиотеки
        if (!selectedPaletteId) {
            showToast('Выберите палитру', 'error');
            return;
        }
        paletteId = selectedPaletteId;
        palette = { mode: 'library', paletteId: selectedPaletteId };
    } else if (paletteMode === 'manual') {
        palette = {
            mode: 'manual',
            colors: getColorsData()
        };
    } else {
        palette = {
            mode: 'claude',
            notes: document.getElementById('paletteClaudeNotes').value
        };
    }
    
    const name = document.getElementById('capsuleName').value.trim();
    const id = `${document.getElementById('capsuleSeason').value.toLowerCase()}-${Date.now().toString(36)}`;
    
    const capsuleData = {
        id, name,
        season: document.getElementById('capsuleSeason').value,
        targetGroup: document.getElementById('capsuleTarget').value,
        ageRange: document.getElementById('capsuleAge').value,
        gender: document.getElementById('capsuleGender').value,
        description: document.getElementById('capsuleDescription').value,
        categories,
        customCategories: currentMode === 'manual' ? (window.__pendingCustomCategories || []) : [],
        palette,
        paletteId, // Прямая ссылка на палитру из библиотеки
        priceSegment: document.getElementById('capsulePrice').value,
        status: 'draft',
        totalItems,
        itemsByStatus: { brief: totalItems, prompt: 0, generation: 0, review: 0, approved: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creationMode: currentMode
    };
    
    // 1. Сохраняем капсулу
    addCapsule(capsuleData);
    
    // 2. КРИТИЧНО: Генерируем артикулы СРАЗУ после создания капсулы
    if (typeof generateItems === 'function' && typeof saveItems === 'function') {
        const items = generateItems(id);
        saveItems(id, items);
        console.log(`[Capsules] Сгенерировано ${items.length} артикулов для капсулы ${id}`);
    }
    
    // 3. Синхронизируем с Firebase если доступен
    if (typeof syncToCloud === 'function') {
        syncToCloud().then(() => {
            console.log('[Capsules] Данные синхронизированы с Firebase');
        }).catch(err => {
            console.warn('[Capsules] Ошибка синхронизации:', err);
        });
    }
    
    closeModal();
    renderCapsules();
    showToast(`Капсула "${name}" создана с ${totalItems} артикулами!`, 'success');
}

// =============================================
// DELETE CAPSULE
// =============================================
function deleteCapsule(capsuleId, capsuleName) {
    showConfirmDialog({
        title: 'Удалить капсулу?',
        message: `Капсула «${capsuleName}» и все её артикулы будут удалены безвозвратно.`,
        confirmText: '🗑️ Удалить',
        danger: true,
        onConfirm: () => {
            let capsules = loadCapsules();
            capsules = capsules.filter(c => c.id !== capsuleId);
            saveCapsules(capsules);

            const allItems = JSON.parse(localStorage.getItem(ITEMS_STORAGE_KEY) || '{}');
            delete allItems[capsuleId];
            localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(allItems));

            if (typeof syncToCloud === 'function') {
                syncToCloud().then(() => {
                    console.log('[Capsules] Удаление синхронизировано с Firebase');
                }).catch(err => {
                    console.warn('[Capsules] Ошибка синхронизации удаления:', err);
                });
            }

            renderCapsules();
            showToast(`Капсула "${capsuleName}" удалена`, 'success');
        }
    });
}

// =============================================
// ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ
// =============================================
window.renderCapsules = renderCapsules;
window.openCapsule = openCapsule;
window.backToCapsules = backToCapsules;
window.openNewCapsuleModal = openNewCapsuleModal;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.setMode = setMode;
window.handleRefImageUpload = handleRefImageUpload;
window.triggerRefImageUpload = triggerRefImageUpload;
window.copyClaudeBrief = copyClaudeBrief;
window.setPaletteMode = setPaletteMode;
window.selectPalette = selectPalette;
window.addColor = addColor;
window.removeColor = removeColor;
window.updateTotalPercent = updateTotalPercent;
window.createCapsule = createCapsule;
window.deleteCapsule = deleteCapsule;
window.updateTotalSku = updateTotalSku;
window.addCategoryRow = addCategoryRow;
window.removeCategoryRow = removeCategoryRow;
window.updateCategoryRow = updateCategoryRow;
window.renderCategoriesList = renderCategoriesList;
window.renderPaletteSelectGrid = renderPaletteSelectGrid;
window.updateSelectedPalettePreview = updateSelectedPalettePreview;
window.getColorsData = getColorsData;
// loadCapsules и saveCapsules уже экспортируются в app.js

// =============================================
// UPDATE AGE OPTIONS
// =============================================
function updateAgeOptions() {
    const target = document.getElementById('capsuleTarget')?.value;
    const ageSelect = document.getElementById('capsuleAge');
    const genderSelect = document.getElementById('capsuleGender');
    
    if (!ageSelect || !genderSelect) return;
    
    const ageOptions = {
        'babies': [
            { value: '0-6', text: '0-6 мес' },
            { value: '6-12', text: '6-12 мес' },
            { value: '12-18', text: '12-18 мес' },
            { value: '18-24', text: '18-24 мес' }
        ],
        'kids-young': [
            { value: '2-3', text: '2-3 года' },
            { value: '3-5', text: '3-5 лет' },
            { value: '5-7', text: '5-7 лет' }
        ],
        'kids-older': [
            { value: '7-9', text: '7-9 лет' },
            { value: '9-12', text: '9-12 лет' },
            { value: '12-14', text: '12-14 лет' }
        ],
        'men': [
            { value: '18-25', text: '18-25 лет' },
            { value: '25-35', text: '25-35 лет' },
            { value: '35-45', text: '35-45 лет' },
            { value: '45+', text: '45+ лет' }
        ],
        'women': [
            { value: '18-25', text: '18-25 лет' },
            { value: '25-35', text: '25-35 лет' },
            { value: '35-45', text: '35-45 лет' },
            { value: '45+', text: '45+ лет' }
        ]
    };
    
    // Обновляем возрасты
    ageSelect.innerHTML = '<option value="">Выберите</option>';
    if (ageOptions[target]) {
        ageOptions[target].forEach(opt => {
            ageSelect.innerHTML += `<option value="${opt.value}">${opt.text}</option>`;
        });
    }
    
    // Обновляем пол
    if (target === 'men') {
        genderSelect.innerHTML = '<option value="men" selected>Мужчины</option>';
    } else if (target === 'women') {
        genderSelect.innerHTML = '<option value="women" selected>Женщины</option>';
    } else {
        genderSelect.innerHTML = `
            <option value="unisex">Унисекс</option>
            <option value="boys">Мальчики</option>
            <option value="girls">Девочки</option>
        `;
    }
}

window.updateAgeOptions = updateAgeOptions;

console.log('📦 Capsules module loaded');
