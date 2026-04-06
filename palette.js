// =============================================
// KARI Design Hub - Palette Module
// =============================================

const PALETTES_STORAGE_KEY = 'kari-palettes';

// =============================================
// DEFAULT PALETTES
// =============================================
const defaultPalettes = [
    {
        id: 'aw26-signal',
        name: 'SIGNAL',
        season: 'AW26',
        description: 'Городская коллекция с яркими акцентами',
        isDefault: true,
        colors: [
            { code: '19-4005 TCX', name: 'Чёрный', hex: '#1A1A1A', percent: 30, role: 'base' },
            { code: '19-3906 TCX', name: 'Графитовый', hex: '#4A4A4A', percent: 25, role: 'base' },
            { code: '17-4402 TCX', name: 'Серый меланж', hex: '#9A9A9A', percent: 25, role: 'base' },
            { code: '16-1462 TCX', name: 'Оранжевый', hex: '#E8601C', percent: 15, role: 'accent' },
            { code: '13-0550 TCX', name: 'Лаймовый', hex: '#C8E020', percent: 5, role: 'accent' }
        ],
        createdAt: '2024-11-01T10:00:00Z',
        updatedAt: '2024-12-01T10:00:00Z'
    },
    {
        id: 'aw26-urban',
        name: 'URBAN',
        season: 'AW26',
        description: 'Минималистичная палитра для города',
        isDefault: false,
        colors: [
            { code: '19-4005 TCX', name: 'Чёрный', hex: '#1A1A1A', percent: 35, role: 'base' },
            { code: '19-0201 TCX', name: 'Антрацит', hex: '#363636', percent: 25, role: 'base' },
            { code: '14-4102 TCX', name: 'Светло-серый', hex: '#CACACA', percent: 20, role: 'base' },
            { code: '11-0601 TCX', name: 'Белый', hex: '#F5F5F0', percent: 15, role: 'neutral' },
            { code: '18-1662 TCX', name: 'Красный', hex: '#C41E3A', percent: 5, role: 'accent' }
        ],
        createdAt: '2024-11-15T10:00:00Z',
        updatedAt: '2024-12-01T10:00:00Z'
    },
    {
        id: 'ss26-fresh',
        name: 'FRESH',
        season: 'SS26',
        description: 'Свежая летняя палитра',
        isDefault: false,
        colors: [
            { code: '11-0601 TCX', name: 'Белый', hex: '#F5F5F0', percent: 30, role: 'base' },
            { code: '14-4122 TCX', name: 'Голубой', hex: '#89CFF0', percent: 25, role: 'base' },
            { code: '12-0824 TCX', name: 'Ванильный', hex: '#F3E5AB', percent: 20, role: 'base' },
            { code: '16-5422 TCX', name: 'Мятный', hex: '#98FF98', percent: 15, role: 'accent' },
            { code: '17-1456 TCX', name: 'Коралловый', hex: '#FF6F61', percent: 10, role: 'accent' }
        ],
        createdAt: '2024-10-01T10:00:00Z',
        updatedAt: '2024-11-15T10:00:00Z'
    },
    {
        id: 'aw26-forest',
        name: 'FOREST',
        season: 'AW26',
        description: 'Природные тона для outdoor коллекции',
        isDefault: false,
        colors: [
            { code: '19-0414 TCX', name: 'Хаки тёмный', hex: '#4A5D23', percent: 30, role: 'base' },
            { code: '17-0525 TCX', name: 'Оливковый', hex: '#708238', percent: 25, role: 'base' },
            { code: '19-1116 TCX', name: 'Коричневый', hex: '#5C4033', percent: 20, role: 'base' },
            { code: '16-1120 TCX', name: 'Песочный', hex: '#C9B896', percent: 15, role: 'neutral' },
            { code: '18-1450 TCX', name: 'Терракотовый', hex: '#CC5A3D', percent: 10, role: 'accent' }
        ],
        createdAt: '2024-11-20T10:00:00Z',
        updatedAt: '2024-12-10T10:00:00Z'
    },
    {
        id: 'ss26-ocean',
        name: 'OCEAN',
        season: 'SS26',
        description: 'Морская тематика для пляжной линии',
        isDefault: false,
        colors: [
            { code: '19-4034 TCX', name: 'Тёмно-синий', hex: '#1E3A5F', percent: 25, role: 'base' },
            { code: '17-4427 TCX', name: 'Синий', hex: '#4682B4', percent: 25, role: 'base' },
            { code: '11-0601 TCX', name: 'Белый', hex: '#F5F5F0', percent: 25, role: 'neutral' },
            { code: '14-4522 TCX', name: 'Аква', hex: '#7FCDCD', percent: 15, role: 'accent' },
            { code: '13-0755 TCX', name: 'Жёлтый', hex: '#FFD700', percent: 10, role: 'accent' }
        ],
        createdAt: '2024-10-15T10:00:00Z',
        updatedAt: '2024-11-20T10:00:00Z'
    }
];

// =============================================
// PALETTES STORAGE
// =============================================
function loadPalettes() {
    const stored = localStorage.getItem(PALETTES_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    savePalettes(defaultPalettes);
    return defaultPalettes;
}

function savePalettes(palettes) {
    localStorage.setItem(PALETTES_STORAGE_KEY, JSON.stringify(palettes));
}

function getPaletteById(id) {
    return loadPalettes().find(p => p.id === id);
}

function addPalette(palette) {
    const palettes = loadPalettes();
    palettes.unshift(palette);
    savePalettes(palettes);
}

function updatePalette(id, updates) {
    const palettes = loadPalettes();
    const idx = palettes.findIndex(p => p.id === id);
    if (idx !== -1) {
        palettes[idx] = { ...palettes[idx], ...updates, updatedAt: new Date().toISOString() };
        savePalettes(palettes);
    }
}

function deletePalette(id) {
    const palettes = loadPalettes().filter(p => p.id !== id);
    savePalettes(palettes);
}

// =============================================
// RENDER PALETTE PAGE
// =============================================
let currentPaletteSeason = 'all';
let currentPaletteView = 'grid';

function renderPalettePage() {
    const palettes = loadPalettes();
    
    const seasons = [...new Set(palettes.map(p => p.season))].sort();
    
    const filtered = currentPaletteSeason === 'all' 
        ? palettes 
        : palettes.filter(p => p.season === currentPaletteSeason);
    
    document.getElementById('page-palette').innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h2>Цветовые палитры</h2>
                <p>${palettes.length} палитр • Pantone TCX</p>
            </div>
            <button class="btn btn-primary" onclick="openNewPaletteModal()">
                <span>+</span> Новая палитра
            </button>
        </div>
        
        <div class="palette-toolbar">
            <div class="filter-pills">
                <button class="filter-pill ${currentPaletteSeason === 'all' ? 'active' : ''}" onclick="setPaletteSeason('all')">
                    Все сезоны
                </button>
                ${seasons.map(s => `
                    <button class="filter-pill ${currentPaletteSeason === s ? 'active' : ''}" onclick="setPaletteSeason('${s}')">
                        ${s}
                    </button>
                `).join('')}
            </div>
            
            <div class="view-toggle">
                <button class="view-btn ${currentPaletteView === 'grid' ? 'active' : ''}" onclick="setPaletteView('grid')">▦ Сетка</button>
                <button class="view-btn ${currentPaletteView === 'list' ? 'active' : ''}" onclick="setPaletteView('list')">☰ Список</button>
            </div>
        </div>
        
        <div class="palettes-container" id="palettesContainer">
            ${currentPaletteView === 'grid' ? renderPaletteGrid(filtered) : renderPaletteList(filtered)}
        </div>
    `;
}

function renderPaletteGrid(palettes) {
    if (!palettes.length) {
        return '<div class="palettes-empty"><p>Палитры не найдены</p></div>';
    }
    
    return `<div class="palettes-grid">
        ${palettes.map(p => `
            <div class="palette-card ${p.isDefault ? 'default' : ''}" onclick="openPaletteDetail('${p.id}')">
                <div class="palette-card-colors">
                    ${p.colors.map(c => `
                        <div class="palette-color-bar" style="background: ${c.hex}; flex: ${c.percent};" title="${c.name} (${c.percent}%)"></div>
                    `).join('')}
                </div>
                
                <div class="palette-card-body">
                    <div class="palette-card-header">
                        <div>
                            <span class="palette-season-badge">${p.season}</span>
                            ${p.isDefault ? '<span class="palette-default-badge">По умолчанию</span>' : ''}
                        </div>
                    </div>
                    
                    <h3 class="palette-card-name">${p.name}</h3>
                    <p class="palette-card-desc">${p.description || ''}</p>
                    
                    <div class="palette-card-swatches">
                        ${p.colors.map(c => `
                            <div class="palette-swatch" style="background: ${c.hex};" title="${c.name}\n${c.code}\n${c.percent}%">
                                <span class="swatch-percent">${c.percent}%</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="palette-card-meta">
                        <span>${p.colors.length} цветов</span>
                        <span>Базовые: ${p.colors.filter(c => c.role === 'base').length}</span>
                        <span>Акценты: ${p.colors.filter(c => c.role === 'accent').length}</span>
                    </div>
                </div>
            </div>
        `).join('')}
    </div>`;
}

function renderPaletteList(palettes) {
    if (!palettes.length) {
        return '<div class="palettes-empty"><p>Палитры не найдены</p></div>';
    }
    
    return `<div class="palettes-list">
        ${palettes.map(p => `
            <div class="palette-list-item" onclick="openPaletteDetail('${p.id}')">
                <div class="palette-list-colors">
                    ${p.colors.map(c => `
                        <div class="palette-list-swatch" style="background: ${c.hex};" title="${c.name}"></div>
                    `).join('')}
                </div>
                
                <div class="palette-list-info">
                    <div class="palette-list-name">
                        ${p.name}
                        <span class="palette-season-badge">${p.season}</span>
                        ${p.isDefault ? '<span class="palette-default-badge">По умолчанию</span>' : ''}
                    </div>
                    <div class="palette-list-desc">${p.description || ''}</div>
                </div>
                
                <div class="palette-list-stats">
                    <span>${p.colors.length} цветов</span>
                </div>
                
                <div class="palette-list-actions">
                    <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); duplicatePalette('${p.id}')">🔄</button>
                    <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); exportPalette('${p.id}')">📤</button>
                </div>
            </div>
        `).join('')}
    </div>`;
}

// =============================================
// FILTERS
// =============================================
function setPaletteSeason(season) {
    currentPaletteSeason = season;
    refreshPalettes();
}

function setPaletteView(view) {
    currentPaletteView = view;
    refreshPalettes();
}

function refreshPalettes() {
    const palettes = loadPalettes();
    const filtered = currentPaletteSeason === 'all' 
        ? palettes 
        : palettes.filter(p => p.season === currentPaletteSeason);
    
    document.getElementById('palettesContainer').innerHTML = 
        currentPaletteView === 'grid' ? renderPaletteGrid(filtered) : renderPaletteList(filtered);
}

// =============================================
// PALETTE DETAIL MODAL
// =============================================
function openPaletteDetail(id) {
    const palette = getPaletteById(id);
    if (!palette) return;
    
    const roleLabels = { base: 'Базовый', accent: 'Акцент', neutral: 'Нейтральный' };
    
    document.getElementById('itemModalTitle').textContent = `🎨 ${palette.name}`;
    document.getElementById('itemModalBody').innerHTML = `
        <div class="palette-detail">
            <div class="palette-detail-header">
                <div class="palette-detail-colors">
                    ${palette.colors.map(c => `
                        <div class="palette-color-bar" style="background: ${c.hex}; flex: ${c.percent};"></div>
                    `).join('')}
                </div>
                
                <div class="palette-detail-info">
                    <span class="palette-season-badge">${palette.season}</span>
                    ${palette.isDefault ? '<span class="palette-default-badge">По умолчанию</span>' : ''}
                    <p style="margin-top: 8px; color: var(--gray-600);">${palette.description || ''}</p>
                </div>
            </div>
            
            <h4 style="margin: 20px 0 12px; color: var(--gray-700);">Цвета палитры</h4>
            
            <div class="palette-colors-table">
                ${palette.colors.map((c, idx) => `
                    <div class="palette-color-row">
                        <div class="palette-color-swatch-lg" style="background: ${c.hex};"></div>
                        <div class="palette-color-info">
                            <div class="palette-color-name">${c.name}</div>
                            <div class="palette-color-code">${c.code}</div>
                        </div>
                        <div class="palette-color-hex">${c.hex}</div>
                        <div class="palette-color-role">
                            <span class="role-badge ${c.role}">${roleLabels[c.role] || c.role}</span>
                        </div>
                        <div class="palette-color-percent">
                            <div class="percent-bar">
                                <div class="percent-fill" style="width: ${c.percent}%; background: ${c.hex};"></div>
                            </div>
                            <span>${c.percent}%</span>
                        </div>
                        <button class="btn-icon-sm" onclick="copyColorCode('${c.code}')" title="Копировать код">📋</button>
                    </div>
                `).join('')}
            </div>
            
            <div class="palette-detail-summary">
                <div class="summary-item">
                    <span class="summary-label">Базовые цвета</span>
                    <span class="summary-value">${palette.colors.filter(c => c.role === 'base').reduce((s, c) => s + c.percent, 0)}%</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Акценты</span>
                    <span class="summary-value">${palette.colors.filter(c => c.role === 'accent').reduce((s, c) => s + c.percent, 0)}%</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Нейтральные</span>
                    <span class="summary-value">${palette.colors.filter(c => c.role === 'neutral').reduce((s, c) => s + c.percent, 0)}%</span>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="openEditPaletteModal('${id}')">✏️ Редактировать</button>
                <button class="btn btn-secondary" onclick="duplicatePalette('${id}'); closeItemModal();">🔄 Дублировать</button>
                <button class="btn btn-secondary" onclick="exportPalette('${id}')">📤 Экспорт</button>
                ${!palette.isDefault ? `<button class="btn btn-secondary" onclick="setAsDefault('${id}')" style="margin-left: auto;">⭐ По умолчанию</button>` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('itemModal').classList.add('active');
}

function copyColorCode(code) {
    navigator.clipboard.writeText(code);
    showToast('Код скопирован: ' + code, 'success');
}

// =============================================
// NEW/EDIT PALETTE MODAL
// =============================================
let editingPaletteId = null;
let editingPaletteColors = [];

function openNewPaletteModal() {
    editingPaletteId = null;
    editingPaletteColors = [
        { code: '', name: '', hex: '#4A4A4A', percent: 30, role: 'base' },
        { code: '', name: '', hex: '#9A9A9A', percent: 30, role: 'base' },
        { code: '', name: '', hex: '#E8601C', percent: 20, role: 'accent' },
        { code: '', name: '', hex: '#FFFFFF', percent: 20, role: 'neutral' }
    ];
    showPaletteEditor({
        name: '',
        season: 'AW26',
        description: ''
    });
}

function openEditPaletteModal(id) {
    const palette = getPaletteById(id);
    if (!palette) return;
    editingPaletteId = id;
    editingPaletteColors = JSON.parse(JSON.stringify(palette.colors));
    closeItemModal();
    setTimeout(() => showPaletteEditor(palette), 100);
}

function showPaletteEditor(palette) {
    const seasons = ['SS25', 'AW25', 'SS26', 'AW26', 'SS27', 'AW27'];
    
    document.getElementById('itemModalTitle').textContent = editingPaletteId ? '✏️ Редактировать палитру' : '✨ Новая палитра';
    document.getElementById('itemModalBody').innerHTML = `
        <div class="form-row">
            <div class="form-group" style="flex: 2;">
                <label class="form-label">Название палитры *</label>
                <input type="text" class="form-input" id="paletteName" value="${palette.name}" placeholder="Например: SIGNAL">
            </div>
            <div class="form-group" style="flex: 1;">
                <label class="form-label">Сезон *</label>
                <select class="form-select" id="paletteSeason">
                    ${seasons.map(s => `<option value="${s}" ${palette.season === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">Описание</label>
            <input type="text" class="form-input" id="paletteDescription" value="${palette.description || ''}" placeholder="Краткое описание палитры">
        </div>
        
        <div class="form-group">
            <label class="form-label">Цвета палитры</label>
            <div id="paletteColorsEditor">
                ${renderPaletteColorsEditor()}
            </div>
            <button class="btn btn-secondary" onclick="addPaletteColor()" style="margin-top: 12px; width: 100%;">
                + Добавить цвет
            </button>
        </div>
        
        <div id="paletteTotalPercent" style="background: var(--gray-50); padding: 12px 16px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
            <span style="font-weight: 600;">Итого:</span>
            <span id="paletteTotalValue" style="font-size: 20px; font-weight: 700;">0%</span>
        </div>
        
        <div class="modal-actions">
            <button class="btn btn-primary" onclick="savePaletteFromEditor()">💾 Сохранить</button>
            <button class="btn btn-secondary" onclick="closeItemModal()">Отмена</button>
            ${editingPaletteId ? `<button class="btn btn-secondary" onclick="deletePaletteConfirm('${editingPaletteId}')" style="margin-left:auto; color:var(--red);">🗑️ Удалить</button>` : ''}
        </div>
    `;
    
    document.getElementById('itemModal').classList.add('active');
    updatePaletteTotal();
}

function renderPaletteColorsEditor() {
    return editingPaletteColors.map((c, idx) => `
        <div class="palette-editor-row" data-index="${idx}">
            <input type="color" class="palette-editor-color" value="${c.hex}" onchange="updatePaletteColorHex(${idx}, this.value)">
            <input type="text" class="form-input" placeholder="Код Pantone TCX" value="${c.code}" onchange="updatePaletteColorField(${idx}, 'code', this.value)" style="width: 130px;">
            <input type="text" class="form-input" placeholder="Название" value="${c.name}" onchange="updatePaletteColorField(${idx}, 'name', this.value)" style="width: 120px;">
            <select class="form-select" onchange="updatePaletteColorField(${idx}, 'role', this.value)" style="width: 110px;">
                <option value="base" ${c.role === 'base' ? 'selected' : ''}>Базовый</option>
                <option value="accent" ${c.role === 'accent' ? 'selected' : ''}>Акцент</option>
                <option value="neutral" ${c.role === 'neutral' ? 'selected' : ''}>Нейтральный</option>
            </select>
            <input type="number" class="form-input" value="${c.percent}" min="0" max="100" onchange="updatePaletteColorField(${idx}, 'percent', parseInt(this.value))" style="width: 70px;">
            <span style="color: var(--gray-500);">%</span>
            <button class="btn-icon" onclick="removePaletteColor(${idx})" title="Удалить">✕</button>
        </div>
    `).join('');
}

function updatePaletteColorHex(idx, hex) {
    editingPaletteColors[idx].hex = hex;
}

function updatePaletteColorField(idx, field, value) {
    editingPaletteColors[idx][field] = value;
    if (field === 'percent') updatePaletteTotal();
}

function addPaletteColor() {
    editingPaletteColors.push({ code: '', name: '', hex: '#888888', percent: 0, role: 'base' });
    document.getElementById('paletteColorsEditor').innerHTML = renderPaletteColorsEditor();
    updatePaletteTotal();
}

function removePaletteColor(idx) {
    if (editingPaletteColors.length > 1) {
        editingPaletteColors.splice(idx, 1);
        document.getElementById('paletteColorsEditor').innerHTML = renderPaletteColorsEditor();
        updatePaletteTotal();
    } else {
        showToast('Нужен хотя бы один цвет', 'error');
    }
}

function updatePaletteTotal() {
    const total = editingPaletteColors.reduce((s, c) => s + (c.percent || 0), 0);
    const display = document.getElementById('paletteTotalValue');
    if (display) {
        display.textContent = total + '%';
        if (total === 100) {
            display.style.color = 'var(--green)';
        } else if (total > 100) {
            display.style.color = 'var(--red)';
        } else {
            display.style.color = 'var(--yellow)';
        }
    }
}

function savePaletteFromEditor() {
    const name = document.getElementById('paletteName').value.trim();
    const season = document.getElementById('paletteSeason').value;
    const description = document.getElementById('paletteDescription').value.trim();
    
    if (!name) {
        showToast('Введите название палитры', 'error');
        return;
    }
    
    if (editingPaletteColors.length === 0) {
        showToast('Добавьте хотя бы один цвет', 'error');
        return;
    }
    
    const total = editingPaletteColors.reduce((s, c) => s + (c.percent || 0), 0);
    if (total !== 100) {
        if (!confirm(`Сумма процентов = ${total}%. Продолжить?`)) return;
    }
    
    const paletteData = {
        name,
        season,
        description,
        colors: editingPaletteColors
    };
    
    if (editingPaletteId) {
        updatePalette(editingPaletteId, paletteData);
        showToast('Палитра обновлена', 'success');
    } else {
        paletteData.id = 'palette-' + Date.now();
        paletteData.isDefault = false;
        paletteData.createdAt = new Date().toISOString();
        paletteData.updatedAt = new Date().toISOString();
        addPalette(paletteData);
        showToast('Палитра создана', 'success');
    }
    
    closeItemModal();
    renderPalettePage();
}

function deletePaletteConfirm(id) {
    const palette = getPaletteById(id);
    if (palette?.isDefault) {
        showToast('Нельзя удалить палитру по умолчанию', 'error');
        return;
    }
    if (confirm('Удалить эту палитру?')) {
        deletePalette(id);
        closeItemModal();
        renderPalettePage();
        showToast('Палитра удалена', 'success');
    }
}

// =============================================
// ACTIONS
// =============================================
function duplicatePalette(id) {
    const palette = getPaletteById(id);
    if (palette) {
        const newPalette = {
            ...JSON.parse(JSON.stringify(palette)),
            id: 'palette-' + Date.now(),
            name: palette.name + ' (копия)',
            isDefault: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        addPalette(newPalette);
        renderPalettePage();
        showToast('Палитра скопирована', 'success');
    }
}

function setAsDefault(id) {
    const palettes = loadPalettes();
    palettes.forEach(p => {
        p.isDefault = (p.id === id);
    });
    savePalettes(palettes);
    closeItemModal();
    renderPalettePage();
    showToast('Палитра установлена по умолчанию', 'success');
}

function exportPalette(id) {
    const palette = getPaletteById(id);
    if (!palette) return;
    
    const exportData = `ПАЛИТРА: ${palette.name}
Сезон: ${palette.season}
${palette.description ? 'Описание: ' + palette.description + '\n' : ''}
ЦВЕТА:
${palette.colors.map(c => `• ${c.name} | ${c.code} | ${c.hex} | ${c.percent}% | ${c.role}`).join('\n')}

Экспорт: ${new Date().toLocaleDateString('ru-RU')}`;
    
    navigator.clipboard.writeText(exportData);
    showToast('Палитра скопирована в буфер', 'success');
}

// =============================================
// ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ
// =============================================
window.loadPalettes = loadPalettes;
window.savePalettes = savePalettes;
window.getPaletteById = getPaletteById;
window.addPalette = addPalette;
window.updatePalette = updatePalette;
window.deletePalette = deletePalette;
window.renderPalettePage = renderPalettePage;
window.renderPaletteGrid = renderPaletteGrid;
window.renderPaletteList = renderPaletteList;
window.setPaletteSeason = setPaletteSeason;
window.setPaletteView = setPaletteView;
window.refreshPalettes = refreshPalettes;
window.openPaletteDetail = openPaletteDetail;
window.copyColorCode = copyColorCode;
window.openNewPaletteModal = openNewPaletteModal;
window.openEditPaletteModal = openEditPaletteModal;
window.showPaletteEditor = showPaletteEditor;
window.renderPaletteColorsEditor = renderPaletteColorsEditor;
window.updatePaletteColorHex = updatePaletteColorHex;
window.updatePaletteColorField = updatePaletteColorField;
window.addPaletteColor = addPaletteColor;
window.removePaletteColor = removePaletteColor;
window.updatePaletteTotal = updatePaletteTotal;
window.savePaletteFromEditor = savePaletteFromEditor;
window.deletePaletteConfirm = deletePaletteConfirm;
window.duplicatePalette = duplicatePalette;
window.setAsDefault = setAsDefault;
window.exportPalette = exportPalette;

console.log('🎨 Palette module loaded');
