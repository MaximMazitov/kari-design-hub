// =============================================
// KARI Design Hub - Checklists Module
// =============================================

const CHECKLISTS_STORAGE_KEY = 'kari-checklists';
const CHECKLIST_RESULTS_KEY = 'kari-checklist-results';

// =============================================
// DEFAULT CHECKLIST TEMPLATES
// =============================================
const defaultChecklists = [
    {
        id: 'checklist-brief',
        name: 'Проверка брифа',
        stage: 'brief',
        description: 'Проверка полноты и корректности брифа перед генерацией',
        icon: '📋',
        items: [
            { id: 'b1', text: 'Указан целевой возраст', required: true },
            { id: 'b2', text: 'Указан пол (мальчики/девочки/унисекс)', required: true },
            { id: 'b3', text: 'Выбрана категория одежды', required: true },
            { id: 'b4', text: 'Указаны базовые цвета с Pantone кодами', required: true },
            { id: 'b5', text: 'Указаны акцентные цвета с Pantone кодами', required: true },
            { id: 'b6', text: 'Описаны ключевые элементы дизайна', required: true },
            { id: 'b7', text: 'Указан материал/состав', required: false },
            { id: 'b8', text: 'Указан ценовой сегмент', required: false },
            { id: 'b9', text: 'Загружен референс (если есть)', required: false }
        ],
        createdAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 'checklist-prompt',
        name: 'Проверка промпта',
        stage: 'prompt',
        description: 'Проверка промпта перед отправкой в AI',
        icon: '✨',
        items: [
            { id: 'p1', text: 'Указан возраст модели (child model, X-year-old)', required: true },
            { id: 'p2', text: 'Есть маркер "fully clothed"', required: true },
            { id: 'p3', text: 'Есть маркер "safe content"', required: true },
            { id: 'p4', text: 'Указан пол модели (boy/girl)', required: true },
            { id: 'p5', text: 'Описана поза и выражение', required: true },
            { id: 'p6', text: 'Указаны цвета с Pantone TCX кодами', required: true },
            { id: 'p7', text: 'Описан материал/текстура', required: false },
            { id: 'p8', text: 'Указано окружение (studio backdrop)', required: true },
            { id: 'p9', text: 'Есть технические параметры (--ar, --v, --style)', required: true },
            { id: 'p10', text: 'Нет запрещённых терминов', required: true }
        ],
        createdAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 'checklist-generation',
        name: 'Проверка генерации',
        stage: 'generation',
        description: 'Проверка сгенерированных изображений',
        icon: '🖼️',
        items: [
            { id: 'g1', text: 'Модель соответствует возрасту', required: true },
            { id: 'g2', text: 'Одежда полностью закрывает тело', required: true },
            { id: 'g3', text: 'Цвета соответствуют брифу', required: true },
            { id: 'g4', text: 'Силуэт соответствует описанию', required: true },
            { id: 'g5', text: 'Детали видны и корректны', required: true },
            { id: 'g6', text: 'Нет артефактов AI (лишние пальцы, искажения)', required: true },
            { id: 'g7', text: 'Качество изображения достаточное', required: true },
            { id: 'g8', text: 'Фон нейтральный/студийный', required: false },
            { id: 'g9', text: 'Поза естественная', required: false }
        ],
        createdAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 'checklist-review',
        name: 'Финальная проверка',
        stage: 'review',
        description: 'Финальная проверка перед утверждением',
        icon: '✅',
        items: [
            { id: 'r1', text: 'Соответствие брифу капсулы', required: true },
            { id: 'r2', text: 'Соответствие цветовой палитре', required: true },
            { id: 'r3', text: 'Коммерческая привлекательность', required: true },
            { id: 'r4', text: 'Соответствие ЦА (возраст, стиль)', required: true },
            { id: 'r5', text: 'Технологичность производства', required: true },
            { id: 'r6', text: 'Себестоимость в рамках сегмента', required: true },
            { id: 'r7', text: 'Уникальность в рамках капсулы', required: false },
            { id: 'r8', text: 'Согласованность с другими SKU', required: false },
            { id: 'r9', text: 'Готовность к передаче в производство', required: true }
        ],
        createdAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 'checklist-capsule',
        name: 'Проверка капсулы',
        stage: 'capsule',
        description: 'Общая проверка капсульной коллекции',
        icon: '📦',
        items: [
            { id: 'c1', text: 'Все SKU соответствуют концепции', required: true },
            { id: 'c2', text: 'Цветовой баланс соблюдён (база/акценты)', required: true },
            { id: 'c3', text: 'Категории сбалансированы', required: true },
            { id: 'c4', text: 'Есть layering-решения (комплекты)', required: false },
            { id: 'c5', text: 'Ценовая матрица корректна', required: true },
            { id: 'c6', text: 'Размерный ряд полный', required: true },
            { id: 'c7', text: 'Документация готова', required: false },
            { id: 'c8', text: 'Утверждение руководителя', required: true }
        ],
        createdAt: '2024-01-01T00:00:00Z'
    }
];

// =============================================
// STORAGE
// =============================================
function loadChecklists() {
    const stored = localStorage.getItem(CHECKLISTS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    saveChecklists(defaultChecklists);
    return defaultChecklists;
}

function saveChecklists(checklists) {
    localStorage.setItem(CHECKLISTS_STORAGE_KEY, JSON.stringify(checklists));
}

function getChecklistById(id) {
    return loadChecklists().find(c => c.id === id);
}

function addChecklist(checklist) {
    const checklists = loadChecklists();
    checklists.push(checklist);
    saveChecklists(checklists);
}

function updateChecklist(id, updates) {
    const checklists = loadChecklists();
    const idx = checklists.findIndex(c => c.id === id);
    if (idx !== -1) {
        checklists[idx] = { ...checklists[idx], ...updates };
        saveChecklists(checklists);
    }
}

function deleteChecklist(id) {
    const checklists = loadChecklists().filter(c => c.id !== id);
    saveChecklists(checklists);
}

function loadChecklistResults() {
    const stored = localStorage.getItem(CHECKLIST_RESULTS_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveChecklistResults(results) {
    localStorage.setItem(CHECKLIST_RESULTS_KEY, JSON.stringify(results));
}

function addChecklistResult(result) {
    const results = loadChecklistResults();
    results.unshift(result);
    saveChecklistResults(results);
}

function getResultsForItem(itemId) {
    return loadChecklistResults().filter(r => r.itemId === itemId);
}

function getResultsForCapsule(capsuleId) {
    return loadChecklistResults().filter(r => r.capsuleId === capsuleId);
}

// =============================================
// RENDER CHECKLISTS PAGE
// =============================================
let checklistCurrentView = 'templates';

function renderChecklistsPage() {
    const checklists = loadChecklists();
    const results = loadChecklistResults();
    
    const stats = {
        templates: checklists.length,
        completed: results.length,
        thisWeek: results.filter(r => {
            const d = new Date(r.completedAt);
            const now = new Date();
            return (now - d) < 7 * 24 * 60 * 60 * 1000;
        }).length,
        passRate: results.length > 0 
            ? Math.round(results.filter(r => r.passed).length / results.length * 100) 
            : 0
    };
    
    document.getElementById('page-checklists').innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h2>Чек-листы</h2>
                <p>Контроль качества на каждом этапе</p>
            </div>
            <button class="btn btn-primary" onclick="openNewChecklistModal()">
                <span>+</span> Новый шаблон
            </button>
        </div>
        
        <div class="checklist-stats">
            <div class="checklist-stat-card">
                <div class="checklist-stat-icon">📋</div>
                <div class="checklist-stat-value">${stats.templates}</div>
                <div class="checklist-stat-label">Шаблонов</div>
            </div>
            <div class="checklist-stat-card">
                <div class="checklist-stat-icon">✅</div>
                <div class="checklist-stat-value">${stats.completed}</div>
                <div class="checklist-stat-label">Проверок</div>
            </div>
            <div class="checklist-stat-card">
                <div class="checklist-stat-icon">📅</div>
                <div class="checklist-stat-value">${stats.thisWeek}</div>
                <div class="checklist-stat-label">За неделю</div>
            </div>
            <div class="checklist-stat-card">
                <div class="checklist-stat-icon">📊</div>
                <div class="checklist-stat-value">${stats.passRate}%</div>
                <div class="checklist-stat-label">Успешных</div>
            </div>
        </div>
        
        <div class="checklist-toolbar">
            <div class="view-toggle">
                <button class="view-btn ${checklistCurrentView === 'templates' ? 'active' : ''}" onclick="setChecklistView('templates')">
                    📋 Шаблоны
                </button>
                <button class="view-btn ${checklistCurrentView === 'history' ? 'active' : ''}" onclick="setChecklistView('history')">
                    📜 История
                </button>
            </div>
        </div>
        
        <div id="checklistContent">
            ${checklistCurrentView === 'templates' ? renderChecklistTemplates(checklists) : renderChecklistHistory(results)}
        </div>
    `;
}

function renderChecklistTemplates(checklists) {
    const stageLabels = { brief: 'Бриф', prompt: 'Промпт', generation: 'Генерация', review: 'Ревью', capsule: 'Капсула' };
    const stageColors = { brief: 'blue', prompt: 'orange', generation: 'purple', review: 'green', capsule: 'gray' };
    
    return `
        <div class="checklist-templates-grid">
            ${checklists.map(c => {
                const requiredCount = c.items.filter(i => i.required).length;
                const totalCount = c.items.length;
                return `
                    <div class="checklist-template-card" onclick="openChecklistDetail('${c.id}')">
                        <div class="checklist-template-icon">${c.icon}</div>
                        <div class="checklist-template-content">
                            <div class="checklist-template-header">
                                <h3>${c.name}</h3>
                                <span class="stage-badge ${stageColors[c.stage]}">${stageLabels[c.stage] || c.stage}</span>
                            </div>
                            <p class="checklist-template-desc">${c.description}</p>
                            <div class="checklist-template-meta">
                                <span>${totalCount} пунктов</span>
                                <span>${requiredCount} обязательных</span>
                            </div>
                        </div>
                        <div class="checklist-template-actions">
                            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); startChecklist('${c.id}')">
                                ▶️ Начать
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderChecklistHistory(results) {
    if (results.length === 0) {
        return '<div class="checklist-empty"><p>Нет завершённых проверок</p></div>';
    }
    
    return `
        <div class="checklist-history-list">
            ${results.map(r => {
                const date = new Date(r.completedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                const checkedCount = r.checkedItems?.length || 0;
                const totalCount = r.totalItems || 0;
                const passRate = totalCount > 0 ? Math.round(checkedCount / totalCount * 100) : 0;
                
                return `
                    <div class="checklist-history-item ${r.passed ? 'passed' : 'failed'}">
                        <div class="history-item-status">${r.passed ? '✅' : '❌'}</div>
                        <div class="history-item-content">
                            <div class="history-item-title">${r.checklistName}</div>
                            <div class="history-item-meta">${r.targetName || 'Без привязки'} • ${checkedCount}/${totalCount} пунктов</div>
                        </div>
                        <div class="history-item-progress">
                            <div class="mini-progress-bar">
                                <div class="mini-progress-fill ${r.passed ? 'green' : 'red'}" style="width: ${passRate}%;"></div>
                            </div>
                            <span>${passRate}%</span>
                        </div>
                        <div class="history-item-date">${date}</div>
                        <button class="btn-icon-sm" onclick="viewChecklistResult('${r.id}')" title="Подробнее">👁️</button>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function setChecklistView(view) {
    checklistCurrentView = view;
    const checklists = loadChecklists();
    const results = loadChecklistResults();
    document.querySelectorAll('.checklist-toolbar .view-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.getElementById('checklistContent').innerHTML = view === 'templates' ? renderChecklistTemplates(checklists) : renderChecklistHistory(results);
}

function openChecklistDetail(id) {
    const checklist = getChecklistById(id);
    if (!checklist) return;
    
    document.getElementById('itemModalTitle').textContent = `${checklist.icon} ${checklist.name}`;
    document.getElementById('itemModalBody').innerHTML = `
        <div class="checklist-detail">
            <p class="checklist-detail-desc">${checklist.description}</p>
            <div class="checklist-items-preview">
                <h4>Пункты проверки:</h4>
                <ul class="checklist-items-list">
                    ${checklist.items.map(item => `
                        <li class="${item.required ? 'required' : 'optional'}">
                            <span class="item-marker">${item.required ? '●' : '○'}</span>
                            <span class="item-text">${item.text}</span>
                            ${item.required ? '<span class="required-badge">Обяз.</span>' : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="startChecklist('${id}')">▶️ Начать проверку</button>
                <button class="btn btn-secondary" onclick="openEditChecklistModal('${id}')">✏️ Редактировать</button>
                <button class="btn btn-secondary" onclick="closeItemModal()">Закрыть</button>
            </div>
        </div>
    `;
    document.getElementById('itemModal').classList.add('active');
}

let currentChecklistRun = null;

function startChecklist(checklistId) {
    const checklist = getChecklistById(checklistId);
    if (!checklist) return;
    
    let targets = loadCapsules();
    let targetLabel = checklist.stage === 'capsule' ? 'Капсула' : 'Капсула (затем артикул)';
    
    currentChecklistRun = { checklistId, checklist, targetType: null, targetId: null, checkedItems: [] };
    
    document.getElementById('itemModalTitle').textContent = `▶️ ${checklist.name}`;
    document.getElementById('itemModalBody').innerHTML = `
        <div class="checklist-run">
            <div class="form-group">
                <label class="form-label">Выберите объект проверки</label>
                <select class="form-select" id="checklistTarget" onchange="onChecklistTargetChange()">
                    <option value="">-- Выберите ${targetLabel} --</option>
                    ${targets.map(t => `<option value="${t.id}">${t.name} (${t.season || ''})</option>`).join('')}
                </select>
            </div>
            <div id="checklistItemsContainer" style="display: none;">
                <h4 style="margin: 20px 0 16px; font-size: 14px; color: var(--gray-700);">Пункты проверки:</h4>
                <div class="checklist-run-items" id="checklistRunItems"></div>
                <div class="checklist-run-summary" id="checklistRunSummary">
                    <div class="summary-progress"><span>Выполнено:</span><span id="checklistProgress">0 / ${checklist.items.length}</span></div>
                    <div class="summary-required"><span>Обязательных:</span><span id="checklistRequired">0 / ${checklist.items.filter(i => i.required).length}</span></div>
                </div>
                <div class="form-group" style="margin-top: 16px;">
                    <label class="form-label">Комментарий (опционально)</label>
                    <textarea class="form-textarea" id="checklistComment" placeholder="Замечания, рекомендации..."></textarea>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" id="btnCompleteChecklist" onclick="completeChecklist()" disabled>✅ Завершить проверку</button>
                <button class="btn btn-secondary" onclick="closeItemModal()">Отмена</button>
            </div>
        </div>
    `;
    document.getElementById('itemModal').classList.add('active');
}

function onChecklistTargetChange() {
    const targetId = document.getElementById('checklistTarget').value;
    const container = document.getElementById('checklistItemsContainer');
    const itemsContainer = document.getElementById('checklistRunItems');
    
    if (!targetId) { container.style.display = 'none'; return; }
    
    currentChecklistRun.targetId = targetId;
    currentChecklistRun.targetType = 'capsule';
    currentChecklistRun.checkedItems = [];
    
    itemsContainer.innerHTML = currentChecklistRun.checklist.items.map(item => `
        <div class="checklist-run-item ${item.required ? 'required' : ''}" data-item-id="${item.id}">
            <label class="checklist-checkbox">
                <input type="checkbox" onchange="toggleChecklistItem('${item.id}')">
                <span class="checkmark"></span>
            </label>
            <span class="checklist-item-text">${item.text}</span>
            ${item.required ? '<span class="required-dot">●</span>' : ''}
        </div>
    `).join('');
    
    container.style.display = 'block';
    updateChecklistProgress();
}

function toggleChecklistItem(itemId) {
    const idx = currentChecklistRun.checkedItems.indexOf(itemId);
    if (idx === -1) currentChecklistRun.checkedItems.push(itemId);
    else currentChecklistRun.checkedItems.splice(idx, 1);
    updateChecklistProgress();
}

function updateChecklistProgress() {
    const checklist = currentChecklistRun.checklist;
    const checked = currentChecklistRun.checkedItems;
    const requiredItems = checklist.items.filter(i => i.required).map(i => i.id);
    const requiredChecked = checked.filter(id => requiredItems.includes(id)).length;
    
    document.getElementById('checklistProgress').textContent = `${checked.length} / ${checklist.items.length}`;
    document.getElementById('checklistRequired').textContent = `${requiredChecked} / ${requiredItems.length}`;
    document.getElementById('btnCompleteChecklist').disabled = requiredChecked !== requiredItems.length;
}

function completeChecklist() {
    const checklist = currentChecklistRun.checklist;
    const checked = currentChecklistRun.checkedItems;
    const requiredItems = checklist.items.filter(i => i.required).map(i => i.id);
    const allRequiredChecked = requiredItems.every(id => checked.includes(id));
    
    let targetName = '';
    if (currentChecklistRun.targetType === 'capsule') {
        const capsule = getCapsuleById(currentChecklistRun.targetId);
        targetName = capsule?.name || currentChecklistRun.targetId;
    }
    
    const result = {
        id: 'result-' + Date.now(),
        checklistId: checklist.id,
        checklistName: checklist.name,
        targetType: currentChecklistRun.targetType,
        targetId: currentChecklistRun.targetId,
        targetName: targetName,
        checkedItems: checked,
        totalItems: checklist.items.length,
        passed: allRequiredChecked,
        comment: document.getElementById('checklistComment')?.value || '',
        completedAt: new Date().toISOString()
    };
    
    addChecklistResult(result);
    closeItemModal();
    renderChecklistsPage();
    showToast(allRequiredChecked ? 'Проверка пройдена ✅' : 'Проверка завершена с замечаниями', allRequiredChecked ? 'success' : 'error');
}

function viewChecklistResult(resultId) {
    const results = loadChecklistResults();
    const result = results.find(r => r.id === resultId);
    if (!result) return;
    
    const checklist = getChecklistById(result.checklistId);
    
    document.getElementById('itemModalTitle').textContent = `📋 Результат: ${result.checklistName}`;
    document.getElementById('itemModalBody').innerHTML = `
        <div class="checklist-result-detail">
            <div class="result-header ${result.passed ? 'passed' : 'failed'}">
                <span class="result-status">${result.passed ? '✅ Пройдено' : '❌ Не пройдено'}</span>
                <span class="result-date">${new Date(result.completedAt).toLocaleString('ru-RU')}</span>
            </div>
            <div class="result-target"><strong>Объект:</strong> ${result.targetName || result.targetId}</div>
            <div class="result-items">
                <h4>Результаты по пунктам:</h4>
                <ul>
                    ${checklist ? checklist.items.map(item => {
                        const isChecked = result.checkedItems.includes(item.id);
                        return `
                            <li class="${isChecked ? 'checked' : 'unchecked'} ${item.required ? 'required' : ''}">
                                <span class="result-check">${isChecked ? '✅' : '❌'}</span>
                                <span>${item.text}</span>
                                ${item.required && !isChecked ? '<span class="fail-badge">Обязательный!</span>' : ''}
                            </li>
                        `;
                    }).join('') : '<li>Шаблон не найден</li>'}
                </ul>
            </div>
            ${result.comment ? `<div class="result-comment"><h4>Комментарий:</h4><p>${result.comment}</p></div>` : ''}
            <div class="result-summary">
                <span>Выполнено: ${result.checkedItems.length} / ${result.totalItems}</span>
                <span>Процент: ${Math.round(result.checkedItems.length / result.totalItems * 100)}%</span>
            </div>
        </div>
    `;
    document.getElementById('itemModal').classList.add('active');
}

let editingChecklistId = null;
let editingChecklistItems = [];

function openNewChecklistModal() {
    editingChecklistId = null;
    editingChecklistItems = [{ id: 'item-1', text: '', required: true }];
    showChecklistEditor({ name: '', stage: 'brief', description: '', icon: '📋' });
}

function openEditChecklistModal(id) {
    const checklist = getChecklistById(id);
    if (!checklist) return;
    editingChecklistId = id;
    editingChecklistItems = JSON.parse(JSON.stringify(checklist.items));
    closeItemModal();
    setTimeout(() => showChecklistEditor(checklist), 100);
}

function showChecklistEditor(checklist) {
    const stages = [
        { id: 'brief', label: 'Бриф', icon: '📋' },
        { id: 'prompt', label: 'Промпт', icon: '✨' },
        { id: 'generation', label: 'Генерация', icon: '🖼️' },
        { id: 'review', label: 'Ревью', icon: '✅' },
        { id: 'capsule', label: 'Капсула', icon: '📦' }
    ];
    const icons = ['📋', '✅', '✨', '🖼️', '📦', '🎨', '👕', '🧥', '📊', '⚙️'];
    
    document.getElementById('itemModalTitle').textContent = editingChecklistId ? '✏️ Редактировать чек-лист' : '✨ Новый чек-лист';
    document.getElementById('itemModalBody').innerHTML = `
        <div class="checklist-editor">
            <div class="form-row">
                <div class="form-group" style="flex: 2;">
                    <label class="form-label">Название *</label>
                    <input type="text" class="form-input" id="checklistName" value="${checklist.name}" placeholder="Например: Проверка брифа">
                </div>
                <div class="form-group" style="flex: 1;">
                    <label class="form-label">Иконка</label>
                    <select class="form-select" id="checklistIcon">
                        ${icons.map(i => `<option value="${i}" ${checklist.icon === i ? 'selected' : ''}>${i}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group" style="flex: 1;">
                    <label class="form-label">Этап</label>
                    <select class="form-select" id="checklistStage">
                        ${stages.map(s => `<option value="${s.id}" ${checklist.stage === s.id ? 'selected' : ''}>${s.icon} ${s.label}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group" style="flex: 2;">
                    <label class="form-label">Описание</label>
                    <input type="text" class="form-input" id="checklistDescription" value="${checklist.description || ''}" placeholder="Краткое описание">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Пункты проверки</label>
                <div id="checklistItemsEditor">${renderChecklistItemsEditor()}</div>
                <button class="btn btn-secondary" onclick="addChecklistItem()" style="margin-top: 12px; width: 100%;">+ Добавить пункт</button>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="saveChecklistFromEditor()">💾 Сохранить</button>
                <button class="btn btn-secondary" onclick="closeItemModal()">Отмена</button>
                ${editingChecklistId ? `<button class="btn btn-secondary" onclick="deleteChecklistConfirm('${editingChecklistId}')" style="margin-left:auto; color:var(--red);">🗑️ Удалить</button>` : ''}
            </div>
        </div>
    `;
    document.getElementById('itemModal').classList.add('active');
}

function renderChecklistItemsEditor() {
    return editingChecklistItems.map((item, idx) => `
        <div class="checklist-item-editor" data-index="${idx}">
            <input type="text" class="form-input" value="${item.text}" placeholder="Текст пункта" onchange="updateChecklistItemText(${idx}, this.value)" style="flex: 1;">
            <label class="required-toggle">
                <input type="checkbox" ${item.required ? 'checked' : ''} onchange="toggleChecklistItemRequired(${idx})">
                <span>Обяз.</span>
            </label>
            <button class="btn-icon" onclick="removeChecklistItem(${idx})" title="Удалить">✕</button>
        </div>
    `).join('');
}

function updateChecklistItemText(idx, text) { editingChecklistItems[idx].text = text; }
function toggleChecklistItemRequired(idx) { editingChecklistItems[idx].required = !editingChecklistItems[idx].required; }

function addChecklistItem() {
    editingChecklistItems.push({ id: 'item-' + Date.now(), text: '', required: false });
    document.getElementById('checklistItemsEditor').innerHTML = renderChecklistItemsEditor();
}

function removeChecklistItem(idx) {
    if (editingChecklistItems.length > 1) {
        editingChecklistItems.splice(idx, 1);
        document.getElementById('checklistItemsEditor').innerHTML = renderChecklistItemsEditor();
    } else {
        showToast('Нужен хотя бы один пункт', 'error');
    }
}

function saveChecklistFromEditor() {
    const name = document.getElementById('checklistName').value.trim();
    if (!name) { showToast('Введите название', 'error'); return; }
    
    const items = editingChecklistItems.filter(i => i.text.trim());
    if (items.length === 0) { showToast('Добавьте хотя бы один пункт', 'error'); return; }
    
    const checklistData = {
        name,
        icon: document.getElementById('checklistIcon').value,
        stage: document.getElementById('checklistStage').value,
        description: document.getElementById('checklistDescription').value.trim(),
        items: items.map((item, idx) => ({ id: item.id || `item-${idx}`, text: item.text.trim(), required: item.required }))
    };
    
    if (editingChecklistId) {
        updateChecklist(editingChecklistId, checklistData);
        showToast('Чек-лист обновлён', 'success');
    } else {
        checklistData.id = 'checklist-' + Date.now();
        checklistData.createdAt = new Date().toISOString();
        addChecklist(checklistData);
        showToast('Чек-лист создан', 'success');
    }
    closeItemModal();
    renderChecklistsPage();
}

function deleteChecklistConfirm(id) {
    showConfirmDialog({
        title: 'Удалить чек-лист?',
        message: 'Этот чек-лист будет удалён безвозвратно.',
        confirmText: '🗑️ Удалить',
        danger: true,
        onConfirm: () => {
            deleteChecklist(id);
            closeItemModal();
            renderChecklistsPage();
            showToast('Чек-лист удалён', 'success');
        }
    });
}

// =============================================
// ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ
// =============================================
window.loadChecklists = loadChecklists;
window.saveChecklists = saveChecklists;
window.getChecklistById = getChecklistById;
window.addChecklist = addChecklist;
window.updateChecklist = updateChecklist;
window.deleteChecklist = deleteChecklist;
window.loadChecklistResults = loadChecklistResults;
window.saveChecklistResults = saveChecklistResults;
window.addChecklistResult = addChecklistResult;
window.getResultsForItem = getResultsForItem;
window.getResultsForCapsule = getResultsForCapsule;
window.renderChecklistsPage = renderChecklistsPage;
window.renderChecklistTemplates = renderChecklistTemplates;
window.renderChecklistHistory = renderChecklistHistory;
window.setChecklistView = setChecklistView;
window.openChecklistDetail = openChecklistDetail;
window.startChecklist = startChecklist;
window.onChecklistTargetChange = onChecklistTargetChange;
window.toggleChecklistItem = toggleChecklistItem;
window.updateChecklistProgress = updateChecklistProgress;
window.completeChecklist = completeChecklist;
window.viewChecklistResult = viewChecklistResult;
window.openNewChecklistModal = openNewChecklistModal;
window.openEditChecklistModal = openEditChecklistModal;
window.showChecklistEditor = showChecklistEditor;
window.renderChecklistItemsEditor = renderChecklistItemsEditor;
window.updateChecklistItemText = updateChecklistItemText;
window.toggleChecklistItemRequired = toggleChecklistItemRequired;
window.addChecklistItem = addChecklistItem;
window.removeChecklistItem = removeChecklistItem;
window.saveChecklistFromEditor = saveChecklistFromEditor;
window.deleteChecklistConfirm = deleteChecklistConfirm;

console.log('✅ Checklists module loaded');
