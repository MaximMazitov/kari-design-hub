// =============================================
// ВКЛАДКА "ПО ПРОТОТИПУ" — Prototype-based capsule generator
// =============================================

function emptyDraft() {
    return {
        id: 'draft-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),
        owner: (window.currentUser && (window.currentUser.email||window.currentUser.id)) || 'local',
        updatedAt: new Date().toISOString(),
        theme: '', season: 'SS25', audience: '', mood: '', description: '',
        palette: [], categories: [],
        anchorCategory: '', anchorPrompt: '', anchorApproved: false,
        skus: [], globalTarget: 'midjourney'
    };
}

let protoDrafts = [];         // массив всех черновиков (все дизайнеры)
let currentDraftId = null;    // активный черновик
let protoState = emptyDraft();// ссылка на текущий черновик для работы

const PROTO_DRAFTS_KEY = 'kari-prototype-drafts';
const PROTO_CURRENT_KEY = 'kari-prototype-current';

function loadProtoState() {
    try {
        protoDrafts = JSON.parse(localStorage.getItem(PROTO_DRAFTS_KEY) || '[]');
        currentDraftId = localStorage.getItem(PROTO_CURRENT_KEY) || null;
        // Миграция старого формата
        const old = JSON.parse(localStorage.getItem('kari-prototype-state') || 'null');
        if (old && !protoDrafts.length) {
            const d = Object.assign(emptyDraft(), old);
            protoDrafts.push(d);
            currentDraftId = d.id;
            localStorage.removeItem('kari-prototype-state');
        }
        if (!protoDrafts.length) {
            const d = emptyDraft();
            protoDrafts.push(d);
            currentDraftId = d.id;
        }
        if (!protoDrafts.find(d => d.id === currentDraftId)) {
            currentDraftId = protoDrafts[0].id;
        }
        protoState = protoDrafts.find(d => d.id === currentDraftId);
    } catch (e) { console.error(e); }
}

function saveProtoState() {
    try {
        if (protoState) protoState.updatedAt = new Date().toISOString();
        localStorage.setItem(PROTO_DRAFTS_KEY, JSON.stringify(protoDrafts));
        localStorage.setItem(PROTO_CURRENT_KEY, currentDraftId || '');
        // Синк в облако — общий список черновиков для всех дизайнеров
        if (typeof saveToCloud === 'function' && window.currentUser) {
            saveToCloud('data', 'proto_drafts', { items: protoDrafts }).catch(()=>{});
        }
    } catch(e){}
}

async function pullProtoDraftsFromCloud() {
    if (typeof loadFromCloud !== 'function' || !window.currentUser) return;
    try {
        const cloud = await loadFromCloud('data', 'proto_drafts');
        if (cloud && cloud.items && Array.isArray(cloud.items)) {
            // Merge: облачные + локальные (по id, берём свежее по updatedAt)
            const map = new Map();
            cloud.items.forEach(d => map.set(d.id, d));
            protoDrafts.forEach(d => {
                const ex = map.get(d.id);
                if (!ex || new Date(d.updatedAt||0) > new Date(ex.updatedAt||0)) map.set(d.id, d);
            });
            protoDrafts = Array.from(map.values());
            if (!protoDrafts.find(d => d.id === currentDraftId)) currentDraftId = protoDrafts[0]?.id || null;
            protoState = protoDrafts.find(d => d.id === currentDraftId) || emptyDraft();
            localStorage.setItem(PROTO_DRAFTS_KEY, JSON.stringify(protoDrafts));
            localStorage.setItem(PROTO_CURRENT_KEY, currentDraftId || '');
        }
    } catch(e){ console.error(e); }
}

function switchDraft(id) {
    saveProtoState();
    currentDraftId = id;
    protoState = protoDrafts.find(d => d.id === id) || emptyDraft();
    localStorage.setItem(PROTO_CURRENT_KEY, id);
    renderPrototypeWizard();
}

function deleteDraft(id) {
    if (!confirm('Удалить этот черновик?')) return;
    protoDrafts = protoDrafts.filter(d => d.id !== id);
    if (!protoDrafts.length) protoDrafts.push(emptyDraft());
    if (currentDraftId === id) currentDraftId = protoDrafts[0].id;
    protoState = protoDrafts.find(d => d.id === currentDraftId);
    saveProtoState();
    renderPrototypeWizard();
}

// =============================================
// РЕНДЕР
// =============================================
function renderPrototypeWizard() {
    const root = document.getElementById('prototypeWizard');
    if (!root) return;
    root.innerHTML = `
        <style>
            .proto-section { background:#fff; border-radius:16px; padding:24px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,0.04); }
            .proto-section h3 { margin:0 0 16px 0; font-size:18px; display:flex; align-items:center; gap:8px; }
            .proto-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
            .proto-field label { display:block; font-size:13px; color:#6b7280; margin-bottom:6px; font-weight:500; }
            .proto-field input, .proto-field select, .proto-field textarea { width:100%; padding:10px 12px; border:1px solid #e5e7eb; border-radius:10px; font-size:14px; font-family:inherit; }
            .proto-field textarea { min-height:70px; resize:vertical; }
            .proto-cat-row { display:flex; gap:10px; align-items:center; margin-bottom:8px; }
            .proto-cat-row input[type="text"] { flex:1; }
            .proto-cat-row input[type="number"] { width:80px; }
            .proto-btn { padding:10px 16px; border-radius:10px; border:none; font-weight:600; cursor:pointer; font-size:14px; }
            .proto-btn-primary { background:#f97316; color:#fff; }
            .proto-btn-secondary { background:#f3f4f6; color:#374151; }
            .proto-btn-danger { background:#fee2e2; color:#dc2626; }
            .proto-btn:hover { opacity:0.9; }
            .proto-sku-card { background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:16px; margin-bottom:12px; }
            .proto-sku-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
            .proto-sku-body { display:grid; grid-template-columns:140px 1fr; gap:16px; }
            .proto-thumb { width:140px; height:180px; border-radius:10px; background:#e5e7eb; display:flex; align-items:center; justify-content:center; cursor:pointer; overflow:hidden; border:2px dashed #d1d5db; font-size:12px; color:#6b7280; text-align:center; padding:8px; }
            .proto-thumb img { width:100%; height:100%; object-fit:cover; }
            .proto-analysis-box { background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:10px; font-size:12px; max-height:180px; overflow:auto; white-space:pre-wrap; font-family:monospace; }
            .proto-color-chip { display:inline-flex; align-items:center; gap:6px; padding:4px 8px; background:#fff; border:1px solid #e5e7eb; border-radius:20px; font-size:12px; margin:2px; }
            .proto-color-swatch { width:14px; height:14px; border-radius:50%; border:1px solid rgba(0,0,0,0.1); }
            .proto-prompt-box { background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:12px; font-size:13px; white-space:pre-wrap; margin-top:8px; }
            .proto-target-selector { display:flex; gap:16px; align-items:center; padding:12px; background:#fef3c7; border-radius:10px; margin-bottom:16px; }
            .proto-loading { display:inline-block; width:14px; height:14px; border:2px solid #d1d5db; border-top-color:#f97316; border-radius:50%; animation:spin 0.8s linear infinite; }
            @keyframes spin { to { transform:rotate(360deg); } }
            .proto-step-num { display:inline-flex; width:28px; height:28px; border-radius:50%; background:#f97316; color:#fff; align-items:center; justify-content:center; font-weight:700; }
        </style>

        <!-- СПИСОК ЧЕРНОВИКОВ (все дизайнеры) -->
        <div class="proto-section">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                <h3 style="margin:0">📂 Черновики капсул (${protoDrafts.length})</h3>
                <button class="proto-btn proto-btn-primary" onclick="protoNewCapsule()">🆕 Новая капсула</button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px">
                ${protoDrafts.map(d => {
                    const active = d.id === currentDraftId;
                    const title = d.theme || '(без названия)';
                    const owner = d.owner || 'local';
                    const skuCount = (d.skus||[]).length;
                    const updated = d.updatedAt ? new Date(d.updatedAt).toLocaleString('ru-RU') : '';
                    return `
                        <div onclick="switchDraft('${d.id}')" style="cursor:pointer;padding:12px;border-radius:10px;border:2px solid ${active?'#f97316':'#e5e7eb'};background:${active?'#fff7ed':'#fff'};position:relative">
                            <div style="font-weight:600;font-size:14px;margin-bottom:4px">${escapeHtml(title)}</div>
                            <div style="font-size:11px;color:#6b7280">👤 ${escapeHtml(owner)}</div>
                            <div style="font-size:11px;color:#6b7280">🧩 ${skuCount} SKU · ${escapeHtml(d.season||'')}</div>
                            <div style="font-size:10px;color:#9ca3af;margin-top:4px">${updated}</div>
                            <button onclick="event.stopPropagation();deleteDraft('${d.id}')" style="position:absolute;top:6px;right:6px;background:#fee2e2;color:#dc2626;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px">✕</button>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        <!-- ШАГ 1: ТЕМА -->
        <div class="proto-section">
            <h3><span class="proto-step-num">1</span> Тема капсулы</h3>
            <div class="proto-grid">
                <div class="proto-field">
                    <label>Название / Тема</label>
                    <input type="text" id="protoTheme" placeholder="Street Tech / Urban Minimalism" value="${escapeHtml(protoState.theme)}">
                </div>
                <div class="proto-field">
                    <label>Сезон</label>
                    <select id="protoSeason">
                        ${['SS25','AW25','SS26','AW26','SS27','AW27','SS28','AW28','SS29','AW29','SS30','AW30'].map(s=>`<option ${protoState.season===s?'selected':''}>${s}</option>`).join('')}
                    </select>
                </div>
                <div class="proto-field">
                    <label>Целевая аудитория</label>
                    <input type="text" id="protoAudience" placeholder="Унисекс, 20-35" value="${escapeHtml(protoState.audience)}">
                </div>
                <div class="proto-field">
                    <label>Настроение / стиль</label>
                    <input type="text" id="protoMood" placeholder="минимализм, техничные ткани" value="${escapeHtml(protoState.mood)}">
                </div>
            </div>
            <div class="proto-field" style="margin-top:16px">
                <label>Развёрнутое описание капсулы (концепция, нарратив, ключевые идеи, материалы, силуэты, референсы)</label>
                <textarea id="protoDescription" style="min-height:140px" placeholder="Например: Капсула вдохновлена японским уличным стилем и техничной спортивной одеждой 90-х. Ключевые материалы — плотный футер с начёсом, нейлон рипстоп, софтшелл. Силуэты оверсайз с опущенной линией плеча. Акцент на функциональных карманах, кулисках и светоотражающих деталях. Настроение — городская свобода и минимализм.">${escapeHtml(protoState.description)}</textarea>
            </div>
        </div>

        <!-- ШАГ 2: ПАЛИТРА -->
        <div class="proto-section">
            <h3><span class="proto-step-num">2</span> Палитра Pantone TCX</h3>
            <div id="protoPaletteList"></div>
            <button class="proto-btn proto-btn-secondary" onclick="protoOpenPantonePicker()">+ Добавить цвет из Pantone TCX</button>
        </div>

        <!-- ШАГ 3: КАТЕГОРИИ -->
        <div class="proto-section">
            <h3><span class="proto-step-num">3</span> Категории и количество SKU</h3>
            <div id="protoCatList"></div>
            <button class="proto-btn proto-btn-secondary" onclick="protoAddCategory()">+ Добавить категорию</button>
            <button class="proto-btn proto-btn-primary" style="float:right" onclick="protoGenerateSkus()">Создать SKU →</button>
        </div>

        <!-- ШАГ 4: ЭТАЛОННЫЙ ОБРАЗЕЦ -->
        <div class="proto-section">
            <h3><span class="proto-step-num">4</span> Эталонный образец <span style="font-size:13px; color:#6b7280; font-weight:normal;">(первое изделие задаст визуальный стиль всей капсулы)</span></h3>
            <div class="proto-field">
                <label>Выбери категорию для эталона</label>
                <select id="protoAnchorCat" onchange="protoState.anchorCategory=this.value;saveProtoState()">
                    <option value="">— выбери —</option>
                    ${protoState.categories.map(c=>`<option ${protoState.anchorCategory===c.name?'selected':''}>${escapeHtml(c.name)}</option>`).join('')}
                </select>
            </div>
            <div class="proto-field" style="margin-top:12px">
                <label>AI для эталона</label>
                <div style="display:flex;gap:16px">
                    <label><input type="radio" name="protoAnchorTarget" value="midjourney" ${(protoState.globalTarget||'midjourney')==='midjourney'?'checked':''}> 🎨 Midjourney</label>
                    <label><input type="radio" name="protoAnchorTarget" value="gpt" ${protoState.globalTarget==='gpt'?'checked':''}> 💬 GPT/DALL·E</label>
                    <label><input type="radio" name="protoAnchorTarget" value="banana" ${protoState.globalTarget==='banana'?'checked':''}> 🍌 Nano Banana</label>
                </div>
            </div>
            <button class="proto-btn proto-btn-primary" style="margin-top:12px" onclick="protoGenerateAnchor()">⚡ Сгенерировать эталон</button>
            ${protoState.anchorPrompt ? `
                <div class="proto-field" style="margin-top:16px">
                    <label>Эталонный промпт (можешь отредактировать)</label>
                    <textarea id="protoAnchorPrompt" style="min-height:140px" onchange="protoState.anchorPrompt=this.value;saveProtoState()">${escapeHtml(protoState.anchorPrompt)}</textarea>
                </div>
                <button class="proto-btn proto-btn-secondary" onclick="protoGenerateAnchor()">🔄 Перегенерить</button>
                <button class="proto-btn ${protoState.anchorApproved?'proto-btn-secondary':'proto-btn-primary'}" onclick="protoState.anchorApproved=!protoState.anchorApproved;saveProtoState();renderPrototypeWizard()" style="margin-left:8px">
                    ${protoState.anchorApproved?'✅ Эталон утверждён':'Утвердить эталон →'}
                </button>
            ` : ''}
        </div>

        <!-- ШАГ 5: SKU + ПРОТОТИПЫ -->
        <div class="proto-section">
            <h3><span class="proto-step-num">5</span> SKU и прототипы <span style="font-size:13px; color:#6b7280; font-weight:normal;">(загрузи фото прототипа для каждого SKU — AI проанализирует крой)</span></h3>
            <div id="protoSkuList"></div>
        </div>

        <!-- ШАГ 6: ГЕНЕРАЦИЯ -->
        <div class="proto-section">
            <h3><span class="proto-step-num">6</span> Генерация финальных промптов</h3>
            <div class="proto-target-selector">
                <strong>Для какого AI генерить:</strong>
                <label><input type="radio" name="protoTarget" value="midjourney" ${protoState.globalTarget==='midjourney'?'checked':''} onchange="protoState.globalTarget=this.value;saveProtoState()"> 🎨 Midjourney</label>
                <label><input type="radio" name="protoTarget" value="gpt" ${protoState.globalTarget==='gpt'?'checked':''} onchange="protoState.globalTarget=this.value;saveProtoState()"> 💬 ChatGPT / DALL·E</label>
                <label><input type="radio" name="protoTarget" value="banana" ${protoState.globalTarget==='banana'?'checked':''} onchange="protoState.globalTarget=this.value;saveProtoState()"> 🍌 Nano Banana (Gemini)</label>
            </div>
            <button class="proto-btn proto-btn-primary" onclick="protoGenerateAllPrompts()">⚡ Сгенерировать все промпты</button>
            <button class="proto-btn proto-btn-secondary" onclick="protoExportJson()" style="margin-left:8px">📥 Экспорт JSON</button>
            <button class="proto-btn proto-btn-secondary" onclick="protoSaveAsCapsule()" style="margin-left:8px">💾 Сохранить как капсулу</button>
        </div>
    `;

    // Attach onchange for top fields
    ['protoTheme','protoSeason','protoAudience','protoMood','protoDescription'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => {
            protoState.theme = document.getElementById('protoTheme').value;
            protoState.season = document.getElementById('protoSeason').value;
            protoState.audience = document.getElementById('protoAudience').value;
            protoState.mood = document.getElementById('protoMood').value;
            protoState.description = document.getElementById('protoDescription').value;
            saveProtoState();
        });
    });
    // anchor target radios
    document.querySelectorAll('input[name="protoAnchorTarget"]').forEach(r => {
        r.addEventListener('change', () => { protoState.globalTarget = r.value; saveProtoState(); });
    });

    renderProtoPalette();
    renderProtoCategories();
    renderProtoSkus();
}

function escapeHtml(s) {
    return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// =============================================
// ПАЛИТРА
// =============================================
function renderProtoPalette() {
    const list = document.getElementById('protoPaletteList');
    if (!list) return;
    if (!protoState.palette.length) {
        list.innerHTML = '<div style="color:#9ca3af;font-size:13px;margin-bottom:12px">Цвета не выбраны</div>';
        return;
    }
    list.innerHTML = protoState.palette.map((c, i) => `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <div class="proto-color-swatch" style="width:32px;height:32px;background:${c.hex||'#ccc'}"></div>
            <div style="flex:1">
                <div style="font-weight:600;font-size:14px">${escapeHtml(c.name||c.code)}</div>
                <div style="font-size:12px;color:#6b7280">${escapeHtml(c.code)}</div>
            </div>
            <input type="number" min="0" max="100" value="${c.percent||0}" onchange="protoState.palette[${i}].percent=parseInt(this.value)||0;saveProtoState()" style="width:70px;padding:6px;border:1px solid #e5e7eb;border-radius:6px" placeholder="%">
            <button class="proto-btn proto-btn-danger" onclick="protoState.palette.splice(${i},1);saveProtoState();renderProtoPalette()">✕</button>
        </div>
    `).join('');
}

function protoOpenPantonePicker() {
    // Использует существующий pantone-tcx picker если есть, иначе простой модал
    if (typeof openPantonePicker === 'function') {
        openPantonePicker((color) => {
            protoState.palette.push({
                code: color.code,
                name: color.name,
                hex: color.hex,
                percent: 10
            });
            saveProtoState();
            renderProtoPalette();
        });
        return;
    }
    // Fallback — простой prompt
    const code = prompt('Введите Pantone TCX код (например 19-4052):');
    if (!code) return;
    protoState.palette.push({ code, name: code, hex: '#888888', percent: 10 });
    saveProtoState();
    renderProtoPalette();
}

// =============================================
// КАТЕГОРИИ
// =============================================
function renderProtoCategories() {
    const list = document.getElementById('protoCatList');
    if (!list) return;
    if (!protoState.categories.length) {
        protoState.categories = [
            { key:'hoodies', name:'Худи', count:0 },
            { key:'tshirts', name:'Футболки', count:0 },
            { key:'pants', name:'Брюки', count:0 }
        ];
    }
    list.innerHTML = protoState.categories.map((c,i) => `
        <div class="proto-cat-row">
            <input type="text" value="${escapeHtml(c.name)}" onchange="protoState.categories[${i}].name=this.value;saveProtoState()" placeholder="Название категории">
            <input type="number" min="0" value="${c.count}" onchange="protoState.categories[${i}].count=parseInt(this.value)||0;saveProtoState()" placeholder="SKU">
            <button class="proto-btn proto-btn-danger" onclick="protoState.categories.splice(${i},1);saveProtoState();renderProtoCategories()">✕</button>
        </div>
    `).join('') + `<div style="margin-top:8px;font-size:13px;color:#6b7280">Всего SKU: <strong>${protoState.categories.reduce((s,c)=>s+(c.count||0),0)}</strong></div>`;
}

function protoAddCategory() {
    protoState.categories.push({ key:'cust-'+Date.now(), name:'', count:1 });
    saveProtoState();
    renderProtoCategories();
}

// =============================================
// SKU
// =============================================
function protoGenerateSkus() {
    // Создаём SKU на основе категорий, сохраняя уже существующие
    const existing = protoState.skus || [];
    const newSkus = [];
    protoState.categories.forEach(cat => {
        for (let i = 0; i < (cat.count||0); i++) {
            const existingIdx = existing.findIndex(s => s.category === cat.name && s._idxInCat === i);
            if (existingIdx >= 0) {
                newSkus.push(existing[existingIdx]);
            } else {
                newSkus.push({
                    id: 'sku-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),
                    category: cat.name,
                    _idxInCat: i,
                    name: `${cat.name} #${i+1}`,
                    prototypeUrl: null,
                    prototypePath: null,
                    analysis: null,
                    editedAnalysis: null,
                    colors: [],
                    prompt: null
                });
            }
        }
    });
    protoState.skus = newSkus;
    saveProtoState();
    renderProtoSkus();
    if (typeof showToast === 'function') showToast(`Создано ${newSkus.length} SKU`, 'success');
}

function renderProtoSkus() {
    const list = document.getElementById('protoSkuList');
    if (!list) return;
    if (!protoState.skus.length) {
        list.innerHTML = '<div style="color:#9ca3af;font-size:14px">Нажми «Создать SKU» в шаге 3</div>';
        return;
    }
    list.innerHTML = protoState.skus.map((sku, i) => `
        <div class="proto-sku-card" id="proto-sku-${sku.id}">
            <div class="proto-sku-header">
                <div>
                    <strong>${escapeHtml(sku.category)}</strong> —
                    <input type="text" value="${escapeHtml(sku.name)}" onchange="protoState.skus[${i}].name=this.value;saveProtoState()" style="border:none;background:transparent;font-size:14px;font-weight:500">
                </div>
                <button class="proto-btn proto-btn-danger" onclick="protoState.skus.splice(${i},1);saveProtoState();renderProtoSkus()">✕</button>
            </div>
            <div class="proto-sku-body">
                <div>
                    <div class="proto-thumb" onclick="document.getElementById('proto-file-${sku.id}').click()">
                        ${sku.prototypeUrl ? `<img src="${sku.prototypeUrl}">` : '📎<br>Загрузить<br>прототип'}
                    </div>
                    <input type="file" accept="image/*" id="proto-file-${sku.id}" style="display:none" onchange="protoHandleFileUpload('${sku.id}', this.files[0])">
                    ${sku.prototypeUrl ? `<button class="proto-btn proto-btn-secondary" style="margin-top:8px;width:140px;font-size:12px" onclick="protoAnalyzePrototype('${sku.id}')">${sku.analysis ? '🔄 Переанализ' : '🔍 Анализ AI'}</button>` : ''}
                </div>
                <div>
                    ${sku.analysis ? `
                        <label style="font-size:13px;color:#6b7280;font-weight:500">Анализ прототипа (можно редактировать):</label>
                        <textarea class="proto-analysis-box" onchange="protoUpdateAnalysis('${sku.id}', this.value)" style="width:100%;min-height:180px">${escapeHtml(JSON.stringify(sku.editedAnalysis || sku.analysis, null, 2))}</textarea>
                    ` : `<div style="color:#9ca3af;font-size:13px">Загрузи фото прототипа → нажми «Анализ AI» → получишь структурированное описание кроя</div>`}
                    ${sku.prompt ? `
                        <label style="font-size:13px;color:#6b7280;font-weight:500;margin-top:12px;display:block">Финальный промпт (${sku.target||protoState.globalTarget}):</label>
                        <div class="proto-prompt-box">${escapeHtml(sku.prompt)}</div>
                        <button class="proto-btn proto-btn-secondary" style="margin-top:6px;font-size:12px" onclick="navigator.clipboard.writeText(protoState.skus[${i}].prompt);showToast&&showToast('Скопировано','success')">📋 Копировать</button>
                        <button class="proto-btn proto-btn-secondary" style="margin-top:6px;font-size:12px;margin-left:6px" onclick="protoRegenerateOne('${sku.id}')">🔄 Перегенерить</button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// =============================================
// ЗАГРУЗКА И АНАЛИЗ
// =============================================
async function protoHandleFileUpload(skuId, file) {
    if (!file) return;
    const sku = protoState.skus.find(s => s.id === skuId);
    if (!sku) return;
    if (typeof uploadPrototypeImage !== 'function' || !window.currentUser) {
        // Fallback — base64 локально
        const reader = new FileReader();
        reader.onload = (e) => {
            sku.prototypeUrl = e.target.result;
            sku.prototypePath = null;
            saveProtoState();
            renderProtoSkus();
            protoAnalyzePrototype(skuId);
        };
        reader.readAsDataURL(file);
        if (typeof showToast === 'function') showToast('⚠️ Не вошёл в облако — сохраняю локально', 'warning');
        return;
    }
    try {
        if (typeof showToast === 'function') showToast('⏳ Загрузка в Storage...', 'info');
        const { path, url } = await uploadPrototypeImage(file);
        sku.prototypeUrl = url;
        sku.prototypePath = path;
        saveProtoState();
        renderProtoSkus();
        if (typeof showToast === 'function') showToast('✅ Загружено, запускаю анализ...', 'success');
        // Авто-анализ сразу после загрузки
        protoAnalyzePrototype(skuId);
    } catch (err) {
        console.error(err);
        if (typeof showToast === 'function') showToast('❌ ' + err.message, 'error');
    }
}

async function protoAnalyzePrototype(skuId) {
    const sku = protoState.skus.find(s => s.id === skuId);
    if (!sku || !sku.prototypeUrl) return;
    if (typeof analyzePrototypeImage !== 'function') {
        alert('Vision функция не загружена');
        return;
    }
    if (typeof showToast === 'function') showToast('🔍 Анализ прототипа...', 'info');
    const result = await analyzePrototypeImage(sku.prototypeUrl);
    if (!result.success) {
        if (typeof showToast === 'function') showToast('❌ ' + (result.error || 'Ошибка'), 'error');
        return;
    }
    sku.analysis = result.analysis;
    sku.editedAnalysis = null;
    saveProtoState();
    renderProtoSkus();
    if (typeof showToast === 'function') showToast('✅ Прототип проанализирован', 'success');
}

function protoUpdateAnalysis(skuId, value) {
    const sku = protoState.skus.find(s => s.id === skuId);
    if (!sku) return;
    try {
        sku.editedAnalysis = JSON.parse(value);
        saveProtoState();
    } catch(e) {
        // Храним как текст если не JSON
        sku.editedAnalysis = value;
        saveProtoState();
    }
}

// =============================================
// БАТЧ-ГЕНЕРАЦИЯ
// =============================================
async function protoGenerateAllPrompts() {
    if (!protoState.skus.length) { alert('Сначала создай SKU'); return; }
    const withoutAnalysis = protoState.skus.filter(s => !s.analysis && !s.editedAnalysis);
    if (withoutAnalysis.length && !confirm(`${withoutAnalysis.length} SKU без анализа прототипа — генерить всё равно? (они получат промпты без конструктивных деталей)`)) return;

    const capsule = {
        name: protoState.theme,
        theme: protoState.theme,
        season: protoState.season,
        audience: protoState.audience,
        mood: protoState.mood,
        description: protoState.description,
        anchorPrompt: protoState.anchorPrompt,
        palette: protoState.palette,
        categories: protoState.categories
    };

    for (let i = 0; i < protoState.skus.length; i++) {
        const sku = protoState.skus[i];
        if (typeof showToast === 'function') showToast(`⚡ Генерация ${i+1}/${protoState.skus.length}...`, 'info');
        const analysis = sku.editedAnalysis || sku.analysis || { note: 'прототип не загружен' };
        const res = await generatePromptFromPrototype({
            capsule,
            sku,
            prototypeAnalysis: analysis,
            target: protoState.globalTarget
        });
        if (res.success) {
            sku.prompt = res.content;
            sku.target = protoState.globalTarget;
        } else {
            sku.prompt = '❌ Ошибка: ' + res.error;
        }
        saveProtoState();
        renderProtoSkus();
    }
    if (typeof showToast === 'function') showToast('✅ Все промпты сгенерированы', 'success');
}

async function protoRegenerateOne(skuId) {
    const sku = protoState.skus.find(s => s.id === skuId);
    if (!sku) return;
    const capsule = {
        name: protoState.theme, theme: protoState.theme, season: protoState.season,
        audience: protoState.audience, mood: protoState.mood,
        palette: protoState.palette, categories: protoState.categories
    };
    if (typeof showToast === 'function') showToast('⚡ Генерация...', 'info');
    const res = await generatePromptFromPrototype({
        capsule, sku,
        prototypeAnalysis: sku.editedAnalysis || sku.analysis || {},
        target: protoState.globalTarget
    });
    if (res.success) {
        sku.prompt = res.content;
        sku.target = protoState.globalTarget;
        saveProtoState();
        renderProtoSkus();
        if (typeof showToast === 'function') showToast('✅ Готово', 'success');
    }
}

// =============================================
// ГЕНЕРАЦИЯ ЭТАЛОНА
// =============================================
async function protoGenerateAnchor() {
    if (!protoState.anchorCategory) { alert('Выбери категорию для эталона'); return; }
    if (!protoState.palette.length) { alert('Добавь хотя бы один цвет в палитру'); return; }
    if (typeof callClaudeAPI !== 'function') { alert('Claude API не загружен'); return; }

    const target = protoState.globalTarget || 'midjourney';
    const targetName = target === 'gpt' ? 'ChatGPT / DALL·E' : target === 'banana' ? 'Google Nano Banana (Gemini)' : 'Midjourney';
    const colorsLine = protoState.palette.map(c => `${c.name||c.code} (${c.code}) — ${c.percent||0}%`).join(', ');

    let formatInstruction;
    if (target === 'midjourney') {
        formatInstruction = 'Формат: английский, через запятые, в конце --ar 3:4 --v 6 --style raw. 60-120 слов.';
    } else if (target === 'gpt') {
        formatInstruction = 'Формат: развёрнутое английское описание естественным языком. Без MJ-параметров. 80-150 слов.';
    } else {
        formatInstruction = 'Формат: структурированные блоки на английском (garment, fabric, colors, construction, styling, photography). 80-150 слов.';
    }

    const system = `Ты fashion prompt-engineer. Создаёшь эталонный промпт, который задаст визуальный стиль всей капсульной коллекции: свет, фон, тип модели, стиль съёмки.`;
    const user = `КАПСУЛА:
- Тема: ${protoState.theme}
- Сезон: ${protoState.season}
- Аудитория: ${protoState.audience}
- Настроение: ${protoState.mood}

РАЗВЁРНУТОЕ ОПИСАНИЕ:
${protoState.description || '—'}

ПАЛИТРА PANTONE TCX:
${colorsLine}

ЭТАЛОННОЕ ИЗДЕЛИЕ: ${protoState.anchorCategory}

ЗАДАЧА:
Создай промпт для ${targetName} для первого изделия капсулы — категория "${protoState.anchorCategory}". Этот промпт станет ЭТАЛОНОМ визуального стиля: определит свет, фон, модель, стиль съёмки для всей коллекции.
Обязательно:
1. Укажи Pantone TCX коды с процентами
2. Опиши стиль съёмки чётко (studio / natural light / background / model type) — он должен быть повторяем
3. Отрази настроение и материалы из описания капсулы
${formatInstruction}

Верни ТОЛЬКО текст промпта.`;

    if (typeof showToast === 'function') showToast('⚡ Генерация эталона...', 'info');
    const res = await callClaudeAPI(system, user, 1200);
    if (res.success) {
        protoState.anchorPrompt = res.content.trim();
        protoState.anchorApproved = false;
        saveProtoState();
        renderPrototypeWizard();
        if (typeof showToast === 'function') showToast('✅ Эталон сгенерирован', 'success');
    } else {
        if (typeof showToast === 'function') showToast('❌ ' + res.error, 'error');
    }
}

// =============================================
// ЭКСПОРТ / СОХРАНЕНИЕ
// =============================================
function protoExportJson() {
    const data = JSON.stringify(protoState, null, 2);
    const blob = new Blob([data], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `prototype-capsule-${Date.now()}.json`;
    a.click();
}

function protoSaveAsCapsule() {
    if (!protoState.theme) { alert('Укажи название капсулы'); return; }
    const capsules = JSON.parse(localStorage.getItem('kari-capsules') || '[]');
    const newCapsule = {
        id: 'cap-'+Date.now(),
        name: protoState.theme,
        theme: protoState.theme,
        season: protoState.season,
        audience: protoState.audience,
        mood: protoState.mood,
        palette: protoState.palette,
        categories: protoState.categories.reduce((acc,c)=>{acc[c.key||c.name]=c.count;return acc},{}),
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fromPrototype: true,
        prototypeSkus: protoState.skus.map(s => ({
            id: s.id, category: s.category, name: s.name,
            prototypeUrl: s.prototypeUrl, analysis: s.editedAnalysis || s.analysis,
            prompt: s.prompt, target: s.target
        }))
    };
    capsules.push(newCapsule);
    localStorage.setItem('kari-capsules', JSON.stringify(capsules));

    // Создаём артикулы с уже готовыми промптами → чтобы вкладка «Артикулы» не предлагала регенерацию
    const allItems = JSON.parse(localStorage.getItem('kari-items') || '{}');
    const prefix = (protoState.theme || 'CAP').substring(0,3).toUpperCase();
    const counters = {};
    const items = protoState.skus.map((s, idx) => {
        const catKey = s.category || 'item';
        counters[catKey] = (counters[catKey]||0) + 1;
        const cprefix = catKey.replace(/[^A-Za-zА-Яа-я]/g,'').substring(0,3).toUpperCase() || 'ITM';
        const firstColor = (s.colors && s.colors[0]) || (protoState.palette[0]) || {name:'',code:'',hex:'#ccc'};
        const accentColor = (s.colors && s.colors[1]) || (protoState.palette[1]) || firstColor;
        return {
            id: `${newCapsule.id}-${cprefix}-${String(idx+1).padStart(3,'0')}`,
            capsuleId: newCapsule.id,
            sku: `${prefix}-${cprefix}-${String(idx+1).padStart(3,'0')}`,
            name: s.name || `${s.category} ${idx+1}`,
            category: catKey,
            categoryLabel: s.category,
            status: s.prompt ? 'generation' : 'brief',
            baseColor: { name: firstColor.name||'', code: firstColor.code||'', hex: firstColor.hex||'#ccc' },
            accentColor: { name: accentColor.name||'', code: accentColor.code||'', hex: accentColor.hex||'#ccc' },
            materials: 'смесовая ткань',
            sizes: '',
            priceTarget: 0,
            prompt: s.prompt || '',
            promptTarget: s.target || protoState.globalTarget,
            prototypeUrl: s.prototypeUrl || null,
            prototypeAnalysis: s.editedAnalysis || s.analysis || null,
            images: [],
            comments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    });
    allItems[newCapsule.id] = items;
    localStorage.setItem('kari-items', JSON.stringify(allItems));

    if (typeof syncToCloud === 'function') syncToCloud();
    if (typeof showToast === 'function') showToast(`✅ Капсула сохранена (${items.length} артикулов с промптами)`, 'success');
}

// =============================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ПЕРЕКЛЮЧЕНИИ НА ВКЛАДКУ
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    loadProtoState();
    // Наблюдаем за активной вкладкой
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.dataset.tab === 'prototype') {
                setTimeout(async () => {
                    await pullProtoDraftsFromCloud();
                    renderPrototypeWizard();
                }, 50);
            }
        });
    });
});

// Экспорты
window.renderPrototypeWizard = renderPrototypeWizard;
window.protoOpenPantonePicker = protoOpenPantonePicker;
window.protoAddCategory = protoAddCategory;
window.protoGenerateSkus = protoGenerateSkus;
window.protoHandleFileUpload = protoHandleFileUpload;
window.protoAnalyzePrototype = protoAnalyzePrototype;
window.protoUpdateAnalysis = protoUpdateAnalysis;
window.protoGenerateAllPrompts = protoGenerateAllPrompts;
window.protoRegenerateOne = protoRegenerateOne;
window.protoExportJson = protoExportJson;
window.protoSaveAsCapsule = protoSaveAsCapsule;
window.protoState = protoState;
window.saveProtoState = saveProtoState;
window.protoGenerateAnchor = protoGenerateAnchor;

function protoNewCapsule() {
    saveProtoState();
    const d = emptyDraft();
    protoDrafts.push(d);
    currentDraftId = d.id;
    protoState = d;
    saveProtoState();
    renderPrototypeWizard();
    if (typeof showToast === 'function') showToast('🆕 Создан новый черновик', 'success');
}
window.protoNewCapsule = protoNewCapsule;
window.switchDraft = switchDraft;
window.deleteDraft = deleteDraft;
