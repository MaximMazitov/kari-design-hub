// =============================================
// KARI Design Hub - Prompts Module
// =============================================

const PROMPTS_STORAGE_KEY = 'kari-prompts';

// =============================================
// DEFAULT PROMPT TEMPLATES
// =============================================
const defaultPrompts = [
    {
        id: 'jacket-base',
        name: 'Куртка базовая',
        category: 'jackets',
        style: 'streetwear',
        season: 'AW',
        isFavorite: true,
        template: `Professional child model, {age}-year-old {gender}, fully clothed, commercial studio photography, safe content, high-end children's fashion catalog.

Standing pose, confident expression, urban attitude.

Wearing oversized padded jacket in {baseColor} ({baseColorCode}), with {accentColor} accent details ({accentColorCode}). {material} fabric, ribbed cuffs, adjustable hood, front zip closure, side pockets with contrast stitching.

ENVIRONMENT: Clean light gray studio backdrop, soft diffused professional lighting
TECHNICAL: Full body shot, 4K resolution, Zara Kids aesthetic

--ar 3:4 --v 6 --style raw`,
        variables: ['age', 'gender', 'baseColor', 'baseColorCode', 'accentColor', 'accentColorCode', 'material'],
        tags: ['верхняя одежда', 'зима', 'базовый'],
        createdAt: '2024-12-01T10:00:00Z'
    },
    {
        id: 'hoodie-base',
        name: 'Худи базовое',
        category: 'hoodies',
        style: 'sport-casual',
        season: 'AW',
        isFavorite: true,
        template: `Professional child model, {age}-year-old {gender}, fully clothed, commercial studio photography, safe content, high-end children's fashion catalog.

Relaxed pose, friendly smile, casual mood.

Wearing {construction} hoodie in {baseColor} ({baseColorCode}), kangaroo pocket, {accentColor} drawstrings ({accentColorCode}). {material} fabric, ribbed hem and cuffs.

ENVIRONMENT: Clean light gray studio backdrop, soft diffused professional lighting
TECHNICAL: Full body shot, 4K resolution, Zara Kids aesthetic

--ar 3:4 --v 6 --style raw`,
        variables: ['age', 'gender', 'construction', 'baseColor', 'baseColorCode', 'accentColor', 'accentColorCode', 'material'],
        tags: ['толстовки', 'базовый', 'casual'],
        createdAt: '2024-12-01T10:00:00Z'
    },
    {
        id: 'pants-joggers',
        name: 'Джоггеры',
        category: 'pants',
        style: 'sport-casual',
        season: 'ALL',
        isFavorite: false,
        template: `Professional child model, {age}-year-old {gender}, fully clothed, commercial studio photography, safe content, high-end children's fashion catalog.

Dynamic pose, movement feel, active lifestyle.

Wearing jogger pants in {baseColor} ({baseColorCode}), elastic waistband with {accentColor} drawstring ({accentColorCode}), side pockets, ribbed ankle cuffs. {material} fabric.

ENVIRONMENT: Clean light gray studio backdrop, soft diffused professional lighting
TECHNICAL: Full body shot, 4K resolution, Zara Kids aesthetic

--ar 3:4 --v 6 --style raw`,
        variables: ['age', 'gender', 'baseColor', 'baseColorCode', 'accentColor', 'accentColorCode', 'material'],
        tags: ['брюки', 'спорт', 'casual'],
        createdAt: '2024-12-01T10:00:00Z'
    },
    {
        id: 'tshirt-print',
        name: 'Футболка с принтом',
        category: 'tshirts',
        style: 'streetwear',
        season: 'SS',
        isFavorite: false,
        template: `Professional child model, {age}-year-old {gender}, fully clothed, commercial studio photography, safe content, high-end children's fashion catalog.

Casual pose, playful expression.

Wearing oversized t-shirt in {baseColor} ({baseColorCode}), large {printType} graphic print on front in {accentColor} ({accentColorCode}). {material} fabric, ribbed crew neck, dropped shoulders.

ENVIRONMENT: Clean light gray studio backdrop, soft diffused professional lighting
TECHNICAL: Full body shot, 4K resolution, Zara Kids aesthetic

--ar 3:4 --v 6 --style raw`,
        variables: ['age', 'gender', 'baseColor', 'baseColorCode', 'accentColor', 'accentColorCode', 'printType', 'material'],
        tags: ['футболки', 'принт', 'лето'],
        createdAt: '2024-12-01T10:00:00Z'
    },
    {
        id: 'jacket-bomber',
        name: 'Бомбер',
        category: 'jackets',
        style: 'streetwear',
        season: 'AW',
        isFavorite: true,
        template: `Professional child model, {age}-year-old {gender}, fully clothed, commercial studio photography, safe content, high-end children's fashion catalog.

Cool confident pose, street style attitude.

Wearing bomber jacket in {baseColor} ({baseColorCode}), {accentColor} ribbed collar, cuffs and hem ({accentColorCode}). {material} outer, quilted lining, metal zip closure, sleeve pocket with logo patch.

ENVIRONMENT: Clean light gray studio backdrop, soft diffused professional lighting
TECHNICAL: Full body shot, 4K resolution, Zara Kids aesthetic

--ar 3:4 --v 6 --style raw`,
        variables: ['age', 'gender', 'baseColor', 'baseColorCode', 'accentColor', 'accentColorCode', 'material'],
        tags: ['верхняя одежда', 'бомбер', 'streetwear'],
        createdAt: '2024-12-01T10:00:00Z'
    },
    {
        id: 'hoodie-tech',
        name: 'Худи техвир',
        category: 'hoodies',
        style: 'techwear',
        season: 'AW',
        isFavorite: false,
        template: `Professional child model, {age}-year-old {gender}, fully clothed, commercial studio photography, safe content, high-end children's fashion catalog.

Futuristic pose, serious expression, tech vibe.

Wearing technical hoodie in {baseColor} ({baseColorCode}), asymmetric zip detail, {accentColor} reflective elements ({accentColorCode}), chest pocket with waterproof zip. {material} fabric, thumbholes, adjustable hood with drawcord.

ENVIRONMENT: Clean light gray studio backdrop, soft diffused professional lighting
TECHNICAL: Full body shot, 4K resolution, techwear aesthetic

--ar 3:4 --v 6 --style raw`,
        variables: ['age', 'gender', 'baseColor', 'baseColorCode', 'accentColor', 'accentColorCode', 'material'],
        tags: ['толстовки', 'techwear', 'функционал'],
        createdAt: '2024-12-01T10:00:00Z'
    },
    {
        id: 'set-tracksuit',
        name: 'Спортивный костюм',
        category: 'sets',
        style: 'sport-casual',
        season: 'ALL',
        isFavorite: true,
        template: `Professional child model, {age}-year-old {gender}, fully clothed, commercial studio photography, safe content, high-end children's fashion catalog.

Active dynamic pose, sporty energy.

Wearing matching tracksuit set: zip-up jacket and jogger pants in {baseColor} ({baseColorCode}), {accentColor} side stripes and logo details ({accentColorCode}). {material} fabric, ribbed trims, elastic waistband.

ENVIRONMENT: Clean light gray studio backdrop, soft diffused professional lighting
TECHNICAL: Full body shot, 4K resolution, Zara Kids aesthetic

--ar 3:4 --v 6 --style raw`,
        variables: ['age', 'gender', 'baseColor', 'baseColorCode', 'accentColor', 'accentColorCode', 'material'],
        tags: ['комплекты', 'спорт', 'костюм'],
        createdAt: '2024-12-01T10:00:00Z'
    },
    {
        id: 'vest-puffer',
        name: 'Жилет дутый',
        category: 'jackets',
        style: 'sport-casual',
        season: 'AW',
        isFavorite: false,
        template: `Professional child model, {age}-year-old {gender}, fully clothed, commercial studio photography, safe content, high-end children's fashion catalog.

Layered look pose, autumn mood.

Wearing puffer vest in {baseColor} ({baseColorCode}), {accentColor} zip and logo ({accentColorCode}), high collar, horizontal quilting. {material} outer, synthetic fill. Styled over hoodie.

ENVIRONMENT: Clean light gray studio backdrop, soft diffused professional lighting
TECHNICAL: Full body shot, 4K resolution, Zara Kids aesthetic

--ar 3:4 --v 6 --style raw`,
        variables: ['age', 'gender', 'baseColor', 'baseColorCode', 'accentColor', 'accentColorCode', 'material'],
        tags: ['верхняя одежда', 'жилет', 'демисезон'],
        createdAt: '2024-12-01T10:00:00Z'
    }
];

// =============================================
// PROMPTS STORAGE
// =============================================
function loadPrompts() {
    const stored = localStorage.getItem(PROMPTS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    savePrompts(defaultPrompts);
    return defaultPrompts;
}

function savePrompts(prompts) {
    localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(prompts));
}

function getPromptById(id) {
    return loadPrompts().find(p => p.id === id);
}

function addPrompt(prompt) {
    const prompts = loadPrompts();
    prompts.unshift(prompt);
    savePrompts(prompts);
}

function updatePrompt(id, updates) {
    const prompts = loadPrompts();
    const idx = prompts.findIndex(p => p.id === id);
    if (idx !== -1) {
        prompts[idx] = { ...prompts[idx], ...updates };
        savePrompts(prompts);
    }
}

function deletePrompt(id) {
    const prompts = loadPrompts().filter(p => p.id !== id);
    savePrompts(prompts);
}

// =============================================
// RENDER PROMPTS PAGE
// =============================================
let currentPromptFilter = 'all';
let currentPromptCategory = 'all';
let currentPromptSearch = '';

function renderPromptsPage() {
    const prompts = loadPrompts();
    
    const categories = [
        { id: 'all', label: 'Все', icon: '📋' },
        { id: 'jackets', label: 'Куртки', icon: '🧥' },
        { id: 'hoodies', label: 'Худи', icon: '👕' },
        { id: 'pants', label: 'Брюки', icon: '👖' },
        { id: 'tshirts', label: 'Футболки', icon: '👚' },
        { id: 'sets', label: 'Комплекты', icon: '👔' },
        { id: 'accessories', label: 'Аксессуары', icon: '🎒' }
    ];
    
    const styles = [
        { id: 'all', label: 'Все стили' },
        { id: 'streetwear', label: 'Streetwear' },
        { id: 'sport-casual', label: 'Sport Casual' },
        { id: 'techwear', label: 'Techwear' },
        { id: 'minimal', label: 'Minimal' }
    ];
    
    document.getElementById('page-prompts').innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h2>Библиотека промптов</h2>
                <p>${prompts.length} шаблонов для AI-генерации</p>
            </div>
            <button class="btn btn-primary" onclick="openNewPromptModal()">
                <span>+</span> Новый шаблон
            </button>
        </div>
        
        <div class="prompts-layout">
            <!-- Sidebar -->
            <div class="prompts-sidebar">
                <div class="sidebar-section">
                    <div class="sidebar-title">Категории</div>
                    ${categories.map(c => `
                        <div class="sidebar-item ${currentPromptCategory === c.id ? 'active' : ''}" onclick="setPromptCategory('${c.id}')">
                            <span>${c.icon}</span>
                            <span>${c.label}</span>
                            <span class="sidebar-count">${c.id === 'all' ? prompts.length : prompts.filter(p => p.category === c.id).length}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="sidebar-section">
                    <div class="sidebar-title">Быстрые фильтры</div>
                    <div class="sidebar-item ${currentPromptFilter === 'favorites' ? 'active' : ''}" onclick="setPromptFilter('favorites')">
                        <span>⭐</span>
                        <span>Избранное</span>
                        <span class="sidebar-count">${prompts.filter(p => p.isFavorite).length}</span>
                    </div>
                    <div class="sidebar-item ${currentPromptFilter === 'recent' ? 'active' : ''}" onclick="setPromptFilter('recent')">
                        <span>🕐</span>
                        <span>Недавние</span>
                    </div>
                </div>
                
                <div class="sidebar-section">
                    <div class="sidebar-title">Стиль</div>
                    <select class="form-select" onchange="setPromptStyle(this.value)" style="width:100%;">
                        ${styles.map(s => `<option value="${s.id}">${s.label}</option>`).join('')}
                    </select>
                </div>
            </div>
            
            <!-- Main content -->
            <div class="prompts-content">
                <div class="prompts-toolbar">
                    <input type="text" class="search-input" placeholder="Поиск шаблонов..."
                           style="width:300px;" value="${currentPromptSearch}"
                           oninput="debouncedSearch(() => searchPrompts(this.value))">
                </div>
                
                <div class="prompts-grid" id="promptsGrid">
                    ${renderPromptCards(prompts)}
                </div>
            </div>
        </div>
    `;
}

function renderPromptCards(prompts) {
    let filtered = prompts;
    
    // Apply category filter
    if (currentPromptCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentPromptCategory);
    }
    
    // Apply quick filter
    if (currentPromptFilter === 'favorites') {
        filtered = filtered.filter(p => p.isFavorite);
    }
    
    // Apply search
    if (currentPromptSearch) {
        const search = currentPromptSearch.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(search) || 
            p.tags.some(t => t.toLowerCase().includes(search))
        );
    }
    
    if (!filtered.length) {
        return '<div class="prompts-empty"><p>Шаблоны не найдены</p></div>';
    }
    
    const categoryLabels = {
        jackets: 'Куртки', hoodies: 'Худи', pants: 'Брюки', 
        tshirts: 'Футболки', sets: 'Комплекты', accessories: 'Аксессуары'
    };
    
    const styleLabels = {
        streetwear: 'Streetwear', 'sport-casual': 'Sport Casual',
        techwear: 'Techwear', minimal: 'Minimal'
    };
    
    return filtered.map(p => `
        <div class="prompt-card">
            <div class="prompt-card-header">
                <div class="prompt-card-title">${p.name}</div>
                <button class="prompt-favorite ${p.isFavorite ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite('${p.id}')">
                    ${p.isFavorite ? '⭐' : '☆'}
                </button>
            </div>
            
            <div class="prompt-card-meta">
                <span class="prompt-tag category">${categoryLabels[p.category] || p.category}</span>
                <span class="prompt-tag style">${styleLabels[p.style] || p.style}</span>
                <span class="prompt-tag season">${p.season}</span>
            </div>
            
            <div class="prompt-card-preview">
                ${p.template.substring(0, 150)}...
            </div>
            
            <div class="prompt-card-variables">
                ${p.variables.slice(0, 4).map(v => `<span class="var-tag">{${v}}</span>`).join('')}
                ${p.variables.length > 4 ? `<span class="var-more">+${p.variables.length - 4}</span>` : ''}
            </div>
            
            <div class="prompt-card-tags">
                ${p.tags.map(t => `<span class="prompt-tag-small">#${t}</span>`).join('')}
            </div>
            
            <div class="prompt-card-actions">
                <button class="btn btn-primary btn-sm" onclick="openUsePromptModal('${p.id}')">📋 Использовать</button>
                <button class="btn btn-secondary btn-sm" onclick="openEditPromptModal('${p.id}')">✏️</button>
                <button class="btn btn-secondary btn-sm" onclick="duplicatePrompt('${p.id}')">🔄</button>
            </div>
        </div>
    `).join('');
}

// =============================================
// FILTERS
// =============================================
function setPromptCategory(cat) {
    currentPromptCategory = cat;
    currentPromptFilter = 'all';
    refreshPrompts();
}

function setPromptFilter(filter) {
    currentPromptFilter = filter;
    if (filter !== 'all') currentPromptCategory = 'all';
    refreshPrompts();
}

function setPromptStyle(style) {
    // Additional style filter can be implemented
    refreshPrompts();
}

function searchPrompts(query) {
    currentPromptSearch = query;
    refreshPrompts();
}

function refreshPrompts() {
    const prompts = loadPrompts();
    document.getElementById('promptsGrid').innerHTML = renderPromptCards(prompts);
}

// =============================================
// ACTIONS
// =============================================
function toggleFavorite(id) {
    const prompt = getPromptById(id);
    if (prompt) {
        updatePrompt(id, { isFavorite: !prompt.isFavorite });
        refreshPrompts();
    }
}

function duplicatePrompt(id) {
    const prompt = getPromptById(id);
    if (prompt) {
        const newPrompt = {
            ...prompt,
            id: 'prompt-' + Date.now(),
            name: prompt.name + ' (копия)',
            isFavorite: false,
            createdAt: new Date().toISOString()
        };
        addPrompt(newPrompt);
        refreshPrompts();
        showToast('Шаблон скопирован', 'success');
    }
}

// =============================================
// USE PROMPT MODAL
// =============================================
function openUsePromptModal(id) {
    const prompt = getPromptById(id);
    if (!prompt) return;
    
    const variableInputs = prompt.variables.map(v => {
        let defaultValue = '';
        let placeholder = '';
        
        switch(v) {
            case 'age': defaultValue = '10'; placeholder = 'Возраст (например: 10)'; break;
            case 'gender': defaultValue = 'boy'; placeholder = 'boy / girl'; break;
            case 'baseColor': defaultValue = 'Графитовый'; placeholder = 'Название цвета'; break;
            case 'baseColorCode': defaultValue = '19-3906 TCX'; placeholder = 'Pantone код'; break;
            case 'accentColor': defaultValue = 'Оранжевый'; placeholder = 'Название цвета'; break;
            case 'accentColorCode': defaultValue = '16-1462 TCX'; placeholder = 'Pantone код'; break;
            case 'material': defaultValue = 'Polyester blend'; placeholder = 'Материал'; break;
            case 'construction': defaultValue = 'oversized'; placeholder = 'Крой'; break;
            case 'printType': defaultValue = 'geometric'; placeholder = 'Тип принта'; break;
            default: placeholder = v;
        }
        
        return `
            <div class="form-group" style="margin-bottom: 12px;">
                <label class="form-label">{${v}}</label>
                <input type="text" class="form-input variable-input" data-var="${v}" 
                       value="${defaultValue}" placeholder="${placeholder}">
            </div>
        `;
    }).join('');
    
    document.getElementById('itemModalTitle').textContent = '📋 ' + prompt.name;
    document.getElementById('itemModalBody').innerHTML = `
        <div class="use-prompt-layout">
            <div class="use-prompt-variables">
                <h4 style="margin-bottom: 16px; color: var(--gray-700);">Заполните переменные:</h4>
                ${variableInputs}
            </div>
            
            <div class="use-prompt-result">
                <h4 style="margin-bottom: 16px; color: var(--gray-700);">Готовый промпт:</h4>
                <textarea class="prompt-textarea" id="generatedPrompt" style="min-height: 300px;" readonly>${prompt.template}</textarea>
                
                <div style="display: flex; gap: 12px; margin-top: 16px;">
                    <button class="btn btn-primary" onclick="copyGeneratedPrompt()" style="flex:1;">
                        📋 Копировать
                    </button>
                    <button class="btn btn-secondary" onclick="generatePromptPreview('${id}')">
                        🔄 Обновить
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add input listeners
    setTimeout(() => {
        document.querySelectorAll('.variable-input').forEach(input => {
            input.addEventListener('input', () => generatePromptPreview(id));
        });
        generatePromptPreview(id);
    }, 100);
    
    document.getElementById('itemModal').classList.add('active');
}

function generatePromptPreview(id) {
    const prompt = getPromptById(id);
    if (!prompt) return;
    
    let result = prompt.template;
    
    document.querySelectorAll('.variable-input').forEach(input => {
        const varName = input.dataset.var;
        const value = input.value || `{${varName}}`;
        result = result.replace(new RegExp(`\\{${varName}\\}`, 'g'), value);
    });
    
    document.getElementById('generatedPrompt').value = result;
}

function copyGeneratedPrompt() {
    const text = document.getElementById('generatedPrompt').value;
    navigator.clipboard.writeText(text);
    showToast('Промпт скопирован!', 'success');
}

// =============================================
// NEW/EDIT PROMPT MODAL
// =============================================
let editingPromptId = null;

function openNewPromptModal() {
    editingPromptId = null;
    showPromptEditor({
        name: '',
        category: 'jackets',
        style: 'streetwear',
        season: 'AW',
        template: `Professional child model, {age}-year-old {gender}, fully clothed, commercial studio photography, safe content, high-end children's fashion catalog.

[Описание позы и настроения]

[Описание одежды с цветами {baseColor} ({baseColorCode}) и акцентами {accentColor} ({accentColorCode})]

ENVIRONMENT: Clean light gray studio backdrop, soft diffused professional lighting
TECHNICAL: Full body shot, 4K resolution, Zara Kids aesthetic

--ar 3:4 --v 6 --style raw`,
        tags: []
    });
}

function openEditPromptModal(id) {
    const prompt = getPromptById(id);
    if (!prompt) return;
    editingPromptId = id;
    showPromptEditor(prompt);
}

function showPromptEditor(prompt) {
    const categories = [
        { id: 'jackets', label: 'Куртки' },
        { id: 'hoodies', label: 'Худи' },
        { id: 'pants', label: 'Брюки' },
        { id: 'tshirts', label: 'Футболки' },
        { id: 'sets', label: 'Комплекты' },
        { id: 'accessories', label: 'Аксессуары' }
    ];
    
    const styles = [
        { id: 'streetwear', label: 'Streetwear' },
        { id: 'sport-casual', label: 'Sport Casual' },
        { id: 'techwear', label: 'Techwear' },
        { id: 'minimal', label: 'Minimal' }
    ];
    
    document.getElementById('itemModalTitle').textContent = editingPromptId ? '✏️ Редактировать шаблон' : '✨ Новый шаблон';
    document.getElementById('itemModalBody').innerHTML = `
        <div class="form-group">
            <label class="form-label">Название шаблона *</label>
            <input type="text" class="form-input" id="promptName" value="${prompt.name}" placeholder="Например: Куртка зимняя">
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Категория</label>
                <select class="form-select" id="promptCategory">
                    ${categories.map(c => `<option value="${c.id}" ${prompt.category === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Стиль</label>
                <select class="form-select" id="promptStyle">
                    ${styles.map(s => `<option value="${s.id}" ${prompt.style === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Сезон</label>
                <select class="form-select" id="promptSeason">
                    <option value="AW" ${prompt.season === 'AW' ? 'selected' : ''}>AW (Осень-Зима)</option>
                    <option value="SS" ${prompt.season === 'SS' ? 'selected' : ''}>SS (Весна-Лето)</option>
                    <option value="ALL" ${prompt.season === 'ALL' ? 'selected' : ''}>Всесезон</option>
                </select>
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">Шаблон промпта *</label>
            <p style="font-size: 12px; color: var(--gray-500); margin-bottom: 8px;">
                Используйте переменные в формате {variable}: {age}, {gender}, {baseColor}, {baseColorCode}, {accentColor}, {accentColorCode}, {material}, {construction}
            </p>
            <textarea class="prompt-textarea" id="promptTemplate" style="min-height: 250px;">${prompt.template}</textarea>
        </div>
        
        <div class="form-group">
            <label class="form-label">Теги (через запятую)</label>
            <input type="text" class="form-input" id="promptTags" value="${(prompt.tags || []).join(', ')}" placeholder="базовый, зима, streetwear">
        </div>
        
        <div class="modal-actions">
            <button class="btn btn-primary" onclick="savePromptFromEditor()">💾 Сохранить</button>
            <button class="btn btn-secondary" onclick="closeItemModal()">Отмена</button>
            ${editingPromptId ? `<button class="btn btn-secondary" onclick="deletePromptConfirm('${editingPromptId}')" style="margin-left:auto; color:var(--red);">🗑️ Удалить</button>` : ''}
        </div>
    `;
    
    document.getElementById('itemModal').classList.add('active');
}

function savePromptFromEditor() {
    const name = document.getElementById('promptName').value.trim();
    const template = document.getElementById('promptTemplate').value.trim();
    
    if (!name || !template) {
        showToast('Заполните название и шаблон', 'error');
        return;
    }
    
    // Extract variables from template
    const variables = [];
    const matches = template.matchAll(/\{(\w+)\}/g);
    for (const match of matches) {
        if (!variables.includes(match[1])) {
            variables.push(match[1]);
        }
    }
    
    const tagsInput = document.getElementById('promptTags').value;
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
    
    const promptData = {
        name,
        category: document.getElementById('promptCategory').value,
        style: document.getElementById('promptStyle').value,
        season: document.getElementById('promptSeason').value,
        template,
        variables,
        tags
    };
    
    if (editingPromptId) {
        updatePrompt(editingPromptId, promptData);
        showToast('Шаблон обновлён', 'success');
    } else {
        promptData.id = 'prompt-' + Date.now();
        promptData.isFavorite = false;
        promptData.createdAt = new Date().toISOString();
        addPrompt(promptData);
        showToast('Шаблон создан', 'success');
    }
    
    closeItemModal();
    renderPromptsPage();
}

function deletePromptConfirm(id) {
    showConfirmDialog({
        title: 'Удалить шаблон?',
        message: 'Этот шаблон промпта будет удалён безвозвратно.',
        confirmText: '🗑️ Удалить',
        danger: true,
        onConfirm: () => {
            deletePrompt(id);
            closeItemModal();
            renderPromptsPage();
            showToast('Шаблон удалён', 'success');
        }
    });
}

// =============================================
// ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ
// =============================================
window.loadPrompts = loadPrompts;
window.savePrompts = savePrompts;
window.getPromptById = getPromptById;
window.addPrompt = addPrompt;
window.updatePrompt = updatePrompt;
window.deletePrompt = deletePrompt;
window.renderPromptsPage = renderPromptsPage;
window.renderPromptCards = renderPromptCards;
window.setPromptCategory = setPromptCategory;
window.setPromptFilter = setPromptFilter;
window.setPromptStyle = setPromptStyle;
window.searchPrompts = searchPrompts;
window.refreshPrompts = refreshPrompts;
window.toggleFavorite = toggleFavorite;
window.duplicatePrompt = duplicatePrompt;
window.openUsePromptModal = openUsePromptModal;
window.generatePromptPreview = generatePromptPreview;
window.copyGeneratedPrompt = copyGeneratedPrompt;
window.openNewPromptModal = openNewPromptModal;
window.openEditPromptModal = openEditPromptModal;
window.showPromptEditor = showPromptEditor;
window.savePromptFromEditor = savePromptFromEditor;
window.deletePromptConfirm = deletePromptConfirm;

console.log('✨ Prompts module loaded');
