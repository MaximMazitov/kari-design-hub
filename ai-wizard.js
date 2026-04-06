// =============================================
// KARI Design Hub — AI Capsule Wizard v10.0
// 6-шаговый AI-driven workflow
// 1. Загрузка фото → 2. AI-анализ → 3. Категории → 4. Параметры → 5. Генерация → 6. Результат
// =============================================

// =============================================
// CATEGORY DEFINITIONS
// =============================================
const WIZARD_CATEGORIES = [
    { id: 'jackets', label: 'Куртки / Бомберы', icon: '🧥', group: 'outerwear' },
    { id: 'vests', label: 'Жилеты', icon: '🦺', group: 'outerwear' },
    { id: 'hoodies', label: 'Худи / Свитшоты', icon: '👕', group: 'tops' },
    { id: 'tshirts', label: 'Футболки / Лонгсливы', icon: '👚', group: 'tops' },
    { id: 'shirts', label: 'Рубашки', icon: '👔', group: 'tops' },
    { id: 'sweaters', label: 'Свитера / Кардиганы', icon: '🧶', group: 'tops' },
    { id: 'pants', label: 'Брюки / Джоггеры', icon: '👖', group: 'bottoms' },
    { id: 'jeans', label: 'Джинсы', icon: '👖', group: 'bottoms' },
    { id: 'shorts', label: 'Шорты', icon: '🩳', group: 'bottoms' },
    { id: 'dresses', label: 'Платья / Юбки', icon: '👗', group: 'dresses' },
    { id: 'overalls', label: 'Комбинезоны', icon: '🥋', group: 'overalls' },
    { id: 'tracksuits', label: 'Спортивные костюмы', icon: '🏃', group: 'sport' },
    { id: 'footwear', label: 'Обувь', icon: '👟', group: 'footwear' },
    { id: 'accessories', label: 'Аксессуары', icon: '🎒', group: 'accessories' }
];

// =============================================
// STATE
// =============================================
window.wizardState = {
    step: 1,
    totalSteps: 6,
    bestseller: {
        sku: '',
        name: '',
        description: '',
        colors: '',
        price: null,
        cost: null,
        sold: null,
        imageBase64: null,
        imagePreview: null
    },
    analysis: null,        // результат AI-анализа
    isAnalyzing: false,    // флаг анализа
    selectedCategories: [], // [{id, label, icon, count}]
    collection: {
        name: '',
        description: '',
        season: 'AW26',
        ageGroup: 'kid',
        gender: 'unisex',
        segment: 'standard'
    },
    requirements: {
        looksCount: 5,
        itemsCount: 25,
        notes: ''
    },
    result: null,
    isGenerating: false
};
const wizardState = window.wizardState;

// =============================================
// WIZARD UI RENDER
// =============================================
function openAIWizard() {
    // Reset state
    window.wizardState.step = 1;
    window.wizardState.totalSteps = 6;
    window.wizardState.result = null;
    window.wizardState.isGenerating = false;
    window.wizardState.analysis = null;
    window.wizardState.isAnalyzing = false;
    window.wizardState.selectedCategories = [];

    // Reset bestseller
    window.wizardState.bestseller.sku = '';
    window.wizardState.bestseller.name = '';
    window.wizardState.bestseller.description = '';
    window.wizardState.bestseller.colors = '';
    window.wizardState.bestseller.price = null;
    window.wizardState.bestseller.cost = null;
    window.wizardState.bestseller.sold = null;
    window.wizardState.bestseller.imageBase64 = null;
    window.wizardState.bestseller.imagePreview = null;

    // Reset collection
    window.wizardState.collection.name = '';
    window.wizardState.collection.description = '';
    window.wizardState.collection.season = 'AW26';
    window.wizardState.collection.ageGroup = 'kid';
    window.wizardState.collection.gender = 'unisex';
    window.wizardState.collection.segment = 'standard';

    // Reset requirements
    window.wizardState.requirements.looksCount = 5;
    window.wizardState.requirements.itemsCount = 25;
    window.wizardState.requirements.notes = '';

    renderWizardModal();
    document.getElementById('aiWizardModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeAIWizard() {
    document.getElementById('aiWizardModal').style.display = 'none';
    document.body.style.overflow = '';
}

function renderWizardModal() {
    let modal = document.getElementById('aiWizardModal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'aiWizardModal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal ai-wizard-modal">
            <div class="modal-header">
                <div class="wizard-header-content">
                    <h3 class="modal-title">
                        <span class="wizard-icon">🤖</span>
                        AI Capsule Wizard
                    </h3>
                    <div class="wizard-progress">
                        ${renderProgressSteps()}
                    </div>
                </div>
                <div class="modal-close" onclick="closeAIWizard()">&times;</div>
            </div>
            <div class="modal-body wizard-body">
                ${renderWizardStep()}
            </div>
            <div class="modal-footer wizard-footer">
                ${renderWizardFooter()}
            </div>
        </div>
    `;

    setTimeout(() => {
        initWizardStep();
    }, 100);
}

function renderProgressSteps() {
    const steps = [
        { num: 1, label: 'Фото', icon: '📸' },
        { num: 2, label: 'Анализ', icon: '🔍' },
        { num: 3, label: 'Категории', icon: '📋' },
        { num: 4, label: 'Параметры', icon: '🎯' },
        { num: 5, label: 'Генерация', icon: '✨' },
        { num: 6, label: 'Результат', icon: '🎉' }
    ];

    return steps.map(s => `
        <div class="wizard-step ${wizardState.step === s.num ? 'active' : ''} ${wizardState.step > s.num ? 'completed' : ''}">
            <div class="wizard-step-icon">${wizardState.step > s.num ? '✓' : s.icon}</div>
            <div class="wizard-step-label">${s.label}</div>
        </div>
    `).join('<div class="wizard-step-line"></div>');
}

function renderWizardStep() {
    switch (wizardState.step) {
        case 1: return renderStep1_Photo();
        case 2: return renderStep2_Analysis();
        case 3: return renderStep3_Categories();
        case 4: return renderStep4_Params();
        case 5: return renderStep5_Generate();
        case 6: return renderStep6_Review();
        default: return '';
    }
}

function renderWizardFooter() {
    // Step 6 — review/save
    if (wizardState.step === 6) {
        return `
            <button class="btn btn-secondary" onclick="wizardGoToStep(5)">
                ← Назад
            </button>
            <div class="wizard-footer-right">
                <button class="btn btn-primary btn-success" onclick="saveGeneratedCapsule()">
                    ✅ Сохранить капсулу
                </button>
            </div>
        `;
    }

    // Step 5 generating
    if (wizardState.step === 5 && wizardState.isGenerating) {
        return `<div class="wizard-generating-hint">⏳ AI создаёт коллекцию...</div>`;
    }

    // Step 2 analyzing
    if (wizardState.step === 2 && wizardState.isAnalyzing) {
        return `<div class="wizard-generating-hint">⏳ AI анализирует изображение...</div>`;
    }

    // Step 2 with analysis done — confirm button
    if (wizardState.step === 2 && wizardState.analysis) {
        return `
            <button class="btn btn-secondary" onclick="wizardPrevStep()">
                ← Назад
            </button>
            <button class="btn btn-primary" onclick="wizardNextStep()">
                ✅ Подтвердить анализ → Далее
            </button>
        `;
    }

    return `
        <button class="btn btn-secondary" ${wizardState.step === 1 ? 'disabled' : ''} onclick="wizardPrevStep()">
            ← Назад
        </button>
        <button class="btn btn-primary" onclick="wizardNextStep()">
            ${wizardState.step === 5 ? '🤖 Сгенерировать' : 'Далее →'}
        </button>
    `;
}

// =============================================
// STEP 1: PHOTO UPLOAD
// =============================================
function renderStep1_Photo() {
    return `
        <div class="wizard-step-content">
            <div class="wizard-step-header">
                <h4>📸 Загрузите фото бестселлера</h4>
                <p>AI проанализирует изображение: цвета, детали, фасон, стиль, материалы</p>
            </div>

            <div class="image-upload-area" id="imageUploadArea" onclick="triggerImageUpload()">
                ${wizardState.bestseller.imagePreview ? `
                    <img src="${wizardState.bestseller.imagePreview}" class="uploaded-image-preview" alt="Бестселлер">
                    <div class="image-overlay">
                        <span>📷 Заменить фото</span>
                    </div>
                ` : `
                    <div class="upload-placeholder">
                        <div class="upload-icon">📷</div>
                        <div class="upload-text">Перетащите изображение сюда</div>
                        <div class="upload-hint">или нажмите для выбора файла</div>
                        <div class="upload-formats">JPG, PNG до 10MB</div>
                    </div>
                `}
            </div>
            <input type="file" id="wizardImageInput" accept="image/*" style="display:none" onchange="handleWizardImage(event)">

            <div class="wizard-tip">
                <span class="tip-icon">💡</span>
                <span class="tip-text">Лучший результат: фото товара на модели или ghost mannequin, хорошее освещение, виден весь силуэт</span>
            </div>
        </div>
    `;
}

function triggerImageUpload() {
    document.getElementById('wizardImageInput').click();
}

async function handleWizardImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Пожалуйста, выберите изображение', 'error');
        return;
    }

    try {
        showToast('Сжатие изображения...', 'success');
        const compressedImage = await compressImage(file);

        wizardState.bestseller.imageBase64 = compressedImage;
        wizardState.bestseller.imagePreview = compressedImage;

        // Reset analysis when new image uploaded
        wizardState.analysis = null;

        const uploadArea = document.getElementById('imageUploadArea');
        if (uploadArea) {
            uploadArea.innerHTML = `
                <img src="${compressedImage}" class="uploaded-image-preview" alt="Бестселлер">
                <div class="image-overlay">
                    <span>📷 Заменить фото</span>
                </div>
            `;
        }

        showToast('Изображение загружено', 'success');
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showToast('Ошибка загрузки файла', 'error');
    }
}

// =============================================
// STEP 2: AI ANALYSIS
// =============================================
function renderStep2_Analysis() {
    // If analyzing
    if (wizardState.isAnalyzing) {
        return `
            <div class="wizard-step-content wizard-generating">
                <div class="generating-animation">
                    <div class="generating-spinner"></div>
                    <div class="generating-icon">🔍</div>
                </div>
                <h4 class="generating-title">AI анализирует изображение...</h4>
                <div class="generating-steps">
                    <div class="generating-step active">
                        <span class="step-icon">📸</span>
                        <span>Распознавание изображения</span>
                    </div>
                    <div class="generating-step">
                        <span class="step-icon">🎨</span>
                        <span>Определение цветов</span>
                    </div>
                    <div class="generating-step">
                        <span class="step-icon">✂️</span>
                        <span>Анализ деталей и стиля</span>
                    </div>
                </div>
                <p class="generating-hint">Обычно занимает 10-20 секунд</p>
            </div>
        `;
    }

    // If no analysis yet — trigger it
    if (!wizardState.analysis) {
        // Auto-start analysis
        setTimeout(() => runImageAnalysis(), 100);
        return `
            <div class="wizard-step-content">
                <div class="wizard-step-header">
                    <h4>🔍 Запускаю AI-анализ...</h4>
                </div>
            </div>
        `;
    }

    // Analysis done — show results
    const a = wizardState.analysis;

    return `
        <div class="wizard-step-content">
            <div class="wizard-step-header">
                <h4>🔍 Результат AI-анализа</h4>
                <p>Проверьте результат. Можно отредактировать описание перед продолжением.</p>
            </div>

            <div class="analysis-layout">
                <div class="analysis-image-side">
                    ${wizardState.bestseller.imagePreview ?
                        `<img src="${wizardState.bestseller.imagePreview}" class="analysis-preview-img" alt="Бестселлер">` :
                        `<div class="no-image-badge">Без фото</div>`
                    }
                    <button class="btn btn-secondary btn-sm" onclick="rerunImageAnalysis()" style="margin-top: 12px; width: 100%;">
                        🔄 Повторить анализ
                    </button>
                </div>

                <div class="analysis-results-side">
                    <!-- 1. Description (editable) -->
                    <div class="analysis-card analysis-card-wide">
                        <div class="analysis-card-title">📝 Описание товара</div>
                        <textarea class="form-textarea analysis-description-edit" id="analysisDescriptionEdit" rows="10"
                                  oninput="wizardState.analysis.description = this.value">${a.description || ''}</textarea>
                    </div>

                    <!-- 2. Colors with roles -->
                    <div class="analysis-card">
                        <div class="analysis-card-title">🎨 Цветовой анализ</div>
                        <div class="analysis-colors-grid">
                            ${(a.colors || []).map(c => `
                                <div class="analysis-color-chip">
                                    <div class="color-swatch" style="background: ${c.hex || '#ccc'}"></div>
                                    <div class="color-info">
                                        <span class="color-name">${c.name || '?'}</span>
                                        <span class="color-code">${c.code || '?'}</span>
                                        ${c.role ? `<span class="color-role-badge">${c.role}</span>` : ''}
                                        <span class="color-percent">${c.percent || 0}%</span>
                                        ${c.placement ? `<span class="color-placement">${c.placement}</span>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        ${a.colorHarmony ? `<div class="analysis-subtext"><strong>Гармония:</strong> ${a.colorHarmony}</div>` : ''}
                    </div>

                    <!-- 3. Prints -->
                    <div class="analysis-card">
                        <div class="analysis-card-title">🖼️ Принт / Паттерн</div>
                        ${a.prints?.hasPrint ? `
                            <div class="analysis-kv-list">
                                <div class="analysis-kv"><span class="kv-label">Тип:</span><span class="analysis-tag accent">${a.prints.type || '—'}</span></div>
                                <div class="analysis-kv"><span class="kv-label">Размещение:</span><span class="kv-value">${a.prints.placement || '—'}</span></div>
                                <div class="analysis-kv"><span class="kv-label">Масштаб:</span><span class="kv-value">${a.prints.scale || '—'}</span></div>
                                <div class="analysis-kv"><span class="kv-label">Техника:</span><span class="kv-value">${a.prints.technique || '—'}</span></div>
                                ${a.prints.colorInteraction ? `<div class="analysis-kv"><span class="kv-label">Цвет. взаимодействие:</span><span class="kv-value">${a.prints.colorInteraction}</span></div>` : ''}
                            </div>
                            ${a.prints.description ? `<div class="analysis-subtext">${a.prints.description}</div>` : ''}
                        ` : `<div class="analysis-text muted">Принт отсутствует</div>`}
                    </div>

                    <!-- 4. Patches -->
                    <div class="analysis-card">
                        <div class="analysis-card-title">🏷️ Нашивки / Патчи / Лейблы</div>
                        ${a.patches?.hasPatches && a.patches.items?.length > 0 ? `
                            <div class="analysis-patches-list">
                                ${a.patches.items.map(p => `
                                    <div class="analysis-patch-item">
                                        <span class="analysis-tag">${p.type || '?'}</span>
                                        <span class="patch-detail">${p.placement || ''}</span>
                                        <span class="patch-detail">${p.size || ''}</span>
                                        ${p.description ? `<span class="patch-desc">${p.description}</span>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        ` : `<div class="analysis-text muted">Нашивки не обнаружены</div>`}
                    </div>

                    <!-- 5. Hardware -->
                    <div class="analysis-card">
                        <div class="analysis-card-title">⚙️ Фурнитура</div>
                        <div class="analysis-kv-list">
                            ${(a.hardware?.zippers || []).map((z, i) => `
                                <div class="analysis-kv"><span class="kv-label">Молния ${i+1}:</span><span class="kv-value">${z.type || ''}, ${z.style || ''}, ${z.color || ''}, ${z.placement || ''}</span></div>
                            `).join('')}
                            ${a.hardware?.snaps ? `<div class="analysis-kv"><span class="kv-label">Кнопки:</span><span class="kv-value">${a.hardware.snaps}</span></div>` : ''}
                            ${a.hardware?.buttons ? `<div class="analysis-kv"><span class="kv-label">Пуговицы:</span><span class="kv-value">${a.hardware.buttons}</span></div>` : ''}
                            ${a.hardware?.buckles ? `<div class="analysis-kv"><span class="kv-label">Пряжки/Фастексы:</span><span class="kv-value">${a.hardware.buckles}</span></div>` : ''}
                            ${a.hardware?.velcro ? `<div class="analysis-kv"><span class="kv-label">Липучки:</span><span class="kv-value">${a.hardware.velcro}</span></div>` : ''}
                            ${a.hardware?.cordLocks ? `<div class="analysis-kv"><span class="kv-label">Утяжки:</span><span class="kv-value">${a.hardware.cordLocks}</span></div>` : ''}
                            ${a.hardware?.eyelets ? `<div class="analysis-kv"><span class="kv-label">Люверсы:</span><span class="kv-value">${a.hardware.eyelets}</span></div>` : ''}
                        </div>
                    </div>

                    <!-- 6. Construction -->
                    <div class="analysis-card">
                        <div class="analysis-card-title">🔧 Конструкция</div>
                        <div class="analysis-kv-list">
                            ${a.construction?.closureSystem ? `<div class="analysis-kv"><span class="kv-label">Застёжка:</span><span class="kv-value">${a.construction.closureSystem}</span></div>` : ''}
                            ${a.construction?.hood ? `<div class="analysis-kv"><span class="kv-label">Капюшон:</span><span class="kv-value">${a.construction.hood}</span></div>` : ''}
                            ${a.construction?.pockets ? `<div class="analysis-kv"><span class="kv-label">Карманы:</span><span class="kv-value">${a.construction.pockets}</span></div>` : ''}
                            ${a.construction?.cuffs ? `<div class="analysis-kv"><span class="kv-label">Манжеты:</span><span class="kv-value">${a.construction.cuffs}</span></div>` : ''}
                            ${a.construction?.hem ? `<div class="analysis-kv"><span class="kv-label">Низ:</span><span class="kv-value">${a.construction.hem}</span></div>` : ''}
                            ${a.construction?.seams ? `<div class="analysis-kv"><span class="kv-label">Швы:</span><span class="kv-value">${a.construction.seams}</span></div>` : ''}
                            ${a.construction?.panels ? `<div class="analysis-kv"><span class="kv-label">Панели кроя:</span><span class="kv-value">${a.construction.panels}</span></div>` : ''}
                            ${a.construction?.lining ? `<div class="analysis-kv"><span class="kv-label">Подкладка:</span><span class="kv-value">${a.construction.lining}</span></div>` : ''}
                            ${a.construction?.insulation ? `<div class="analysis-kv"><span class="kv-label">Утеплитель:</span><span class="kv-value">${a.construction.insulation}</span></div>` : ''}
                            ${a.construction?.reinforcement ? `<div class="analysis-kv"><span class="kv-label">Усиление:</span><span class="kv-value">${a.construction.reinforcement}</span></div>` : ''}
                        </div>
                    </div>

                    <!-- 7. Texture -->
                    <div class="analysis-card">
                        <div class="analysis-card-title">🧶 Текстура / Поверхность</div>
                        <div class="analysis-tags">
                            ${a.texture?.surfaceFinish ? `<span class="analysis-tag">${a.texture.surfaceFinish}</span>` : ''}
                            ${a.texture?.coating ? `<span class="analysis-tag">${a.texture.coating}</span>` : ''}
                            ${a.texture?.quilting ? `<span class="analysis-tag">${a.texture.quilting}</span>` : ''}
                            ${a.texture?.fabricWeight ? `<span class="analysis-tag">${a.texture.fabricWeight}</span>` : ''}
                            ${a.texture?.fabricHand ? `<span class="analysis-tag">${a.texture.fabricHand}</span>` : ''}
                        </div>
                    </div>

                    <!-- 8. Silhouette (expanded) -->
                    <div class="analysis-card">
                        <div class="analysis-card-title">👔 Силуэт</div>
                        <div class="analysis-tags" style="margin-bottom: 8px;">
                            ${a.silhouette?.fit ? `<span class="analysis-tag accent">${a.silhouette.fit}</span>` : ''}
                            ${a.silhouette?.shape ? `<span class="analysis-tag accent">${a.silhouette.shape}</span>` : ''}
                            ${a.silhouette?.length ? `<span class="analysis-tag">${a.silhouette.length}</span>` : ''}
                        </div>
                        <div class="analysis-kv-list">
                            ${a.silhouette?.proportions ? `<div class="analysis-kv"><span class="kv-label">Пропорции:</span><span class="kv-value">${a.silhouette.proportions}</span></div>` : ''}
                            ${a.silhouette?.drape ? `<div class="analysis-kv"><span class="kv-label">Драпировка:</span><span class="kv-value">${a.silhouette.drape}</span></div>` : ''}
                        </div>
                        ${a.silhouette?.description ? `<div class="analysis-subtext">${a.silhouette.description}</div>` : ''}
                        ${typeof a.silhouette === 'string' ? `<p class="analysis-text">${a.silhouette}</p>` : ''}
                    </div>

                    <!-- 9. Details -->
                    <div class="analysis-card">
                        <div class="analysis-card-title">✨ Ключевые детали</div>
                        <div class="analysis-tags">
                            ${(a.details || []).map(d => `<span class="analysis-tag">${d}</span>`).join('')}
                        </div>
                    </div>

                    <!-- 10. Materials (expanded) -->
                    <div class="analysis-card">
                        <div class="analysis-card-title">🧵 Материалы</div>
                        ${typeof a.materials === 'object' && !Array.isArray(a.materials) ? `
                            <div class="analysis-kv-list">
                                ${a.materials?.mainFabric ? `<div class="analysis-kv"><span class="kv-label">Основная ткань:</span><span class="kv-value">${a.materials.mainFabric}</span></div>` : ''}
                                ${a.materials?.liningFabric ? `<div class="analysis-kv"><span class="kv-label">Подкладка:</span><span class="kv-value">${a.materials.liningFabric}</span></div>` : ''}
                                ${a.materials?.trimFabric ? `<div class="analysis-kv"><span class="kv-label">Отделка:</span><span class="kv-value">${a.materials.trimFabric}</span></div>` : ''}
                                ${a.materials?.estimatedComposition ? `<div class="analysis-kv"><span class="kv-label">Состав:</span><span class="analysis-tag accent">${a.materials.estimatedComposition}</span></div>` : ''}
                            </div>
                        ` : `
                            <div class="analysis-tags">
                                ${(Array.isArray(a.materials) ? a.materials : []).map(m => `<span class="analysis-tag">${m}</span>`).join('')}
                            </div>
                        `}
                    </div>

                    <!-- 11. Style -->
                    <div class="analysis-card">
                        <div class="analysis-card-title">🎯 Стиль</div>
                        <p class="analysis-text"><span class="analysis-tag accent">${a.style || '—'}</span></p>
                    </div>

                    <!-- 12. Target Audience (expanded) -->
                    <div class="analysis-card">
                        <div class="analysis-card-title">👥 Целевая аудитория</div>
                        ${typeof a.targetAudience === 'object' ? `
                            <div class="analysis-tags" style="margin-bottom: 8px;">
                                ${a.targetAudience?.ageRange ? `<span class="analysis-tag accent">${a.targetAudience.ageRange}</span>` : ''}
                                ${a.targetAudience?.gender ? `<span class="analysis-tag accent">${a.targetAudience.gender}</span>` : ''}
                            </div>
                            ${a.targetAudience?.visualCues ? `<div class="analysis-kv"><span class="kv-label">Визуальные маркеры:</span><span class="kv-value">${a.targetAudience.visualCues}</span></div>` : ''}
                            ${a.targetAudience?.trendAlignment ? `<div class="analysis-kv"><span class="kv-label">Тренды:</span><span class="kv-value">${a.targetAudience.trendAlignment}</span></div>` : ''}
                        ` : `<p class="analysis-text">${a.targetAudience || '—'}</p>`}
                    </div>

                    <!-- 13. Sales Drivers (expanded) -->
                    <div class="analysis-card analysis-card-wide">
                        <div class="analysis-card-title">🔥 Анализ драйверов продаж</div>
                        ${typeof a.salesDrivers === 'object' && !Array.isArray(a.salesDrivers) ? `
                            <div class="analysis-kv-list">
                                ${a.salesDrivers?.visualImpact ? `<div class="analysis-kv"><span class="kv-label">Визуальный импакт:</span><span class="kv-value">${a.salesDrivers.visualImpact}</span></div>` : ''}
                                ${a.salesDrivers?.functionalAppeal ? `<div class="analysis-kv"><span class="kv-label">Функциональность:</span><span class="kv-value">${a.salesDrivers.functionalAppeal}</span></div>` : ''}
                                ${a.salesDrivers?.parentAppeal ? `<div class="analysis-kv"><span class="kv-label">Для родителей:</span><span class="kv-value">${a.salesDrivers.parentAppeal}</span></div>` : ''}
                                ${a.salesDrivers?.childAppeal ? `<div class="analysis-kv"><span class="kv-label">Для детей:</span><span class="kv-value">${a.salesDrivers.childAppeal}</span></div>` : ''}
                                ${a.salesDrivers?.versatility ? `<div class="analysis-kv"><span class="kv-label">Универсальность:</span><span class="kv-value">${a.salesDrivers.versatility}</span></div>` : ''}
                                ${a.salesDrivers?.pricePerception ? `<div class="analysis-kv"><span class="kv-label">Восприятие цены:</span><span class="kv-value">${a.salesDrivers.pricePerception}</span></div>` : ''}
                            </div>
                            <div class="analysis-tags" style="margin-top: 10px;">
                                ${(a.salesDrivers?.keyDrivers || []).map(d => `<span class="analysis-tag accent">${d}</span>`).join('')}
                            </div>
                        ` : `
                            <div class="analysis-tags">
                                ${(Array.isArray(a.salesDrivers) ? a.salesDrivers : []).map(d => `<span class="analysis-tag accent">${d}</span>`).join('')}
                            </div>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function runImageAnalysis() {
    if (wizardState.isAnalyzing) return;

    wizardState.isAnalyzing = true;
    renderWizardModal();

    // Animate analysis steps
    const animateSteps = async () => {
        const stepEls = document.querySelectorAll('.generating-step');
        for (let i = 0; i < stepEls.length; i++) {
            await new Promise(r => setTimeout(r, 3000));
            if (stepEls[i]) stepEls[i].classList.add('completed');
            if (stepEls[i + 1]) stepEls[i + 1].classList.add('active');
        }
    };
    animateSteps();

    try {
        const result = await analyzeImageWithAI(wizardState.bestseller.imageBase64);

        wizardState.isAnalyzing = false;

        if (result.success) {
            wizardState.analysis = result.data;
            showToast('Анализ завершён!', 'success');
        } else {
            wizardState.analysis = null;
            showToast('Ошибка анализа: ' + result.error, 'error');
        }

        renderWizardModal();

    } catch (error) {
        console.error('[AI Wizard] Analysis error:', error);
        wizardState.isAnalyzing = false;
        wizardState.analysis = null;
        renderWizardModal();
        showToast('Ошибка: ' + error.message, 'error');
    }
}

function rerunImageAnalysis() {
    wizardState.analysis = null;
    runImageAnalysis();
}

// =============================================
// STEP 3: CATEGORY SELECTION
// =============================================
function renderStep3_Categories() {
    const cats = wizardState.selectedCategories;

    // Calculate total SKU
    const totalSku = cats.reduce((sum, c) => sum + (c.count || 0), 0);

    return `
        <div class="wizard-step-content">
            <div class="wizard-step-header">
                <h4>📋 Выберите категории одежды</h4>
                <p>Отметьте категории и количество артикулов для капсульной коллекции</p>
            </div>

            <div class="wizard-tip" style="margin-bottom: 16px;">
                <span class="tip-icon">💡</span>
                <span class="tip-text">Система сохранит стиль, цвета и визуальную логику бестселлера в каждой категории</span>
            </div>

            <div class="categories-grid">
                ${WIZARD_CATEGORIES.map(cat => {
                    const selected = cats.find(c => c.id === cat.id);
                    const isChecked = !!selected;
                    const count = selected ? selected.count : 2;
                    return `
                        <div class="category-card ${isChecked ? 'selected' : ''}" id="catCard_${cat.id}">
                            <label class="category-checkbox-label">
                                <input type="checkbox" class="category-checkbox"
                                       ${isChecked ? 'checked' : ''}
                                       onchange="toggleCategory('${cat.id}', '${cat.label}', '${cat.icon}', this.checked)">
                                <span class="category-icon">${cat.icon}</span>
                                <span class="category-name">${cat.label}</span>
                            </label>
                            <div class="category-count-control" style="${isChecked ? '' : 'display:none'}" id="catCount_${cat.id}">
                                <button class="btn-icon-sm" onclick="changeCategoryCount('${cat.id}', -1)">−</button>
                                <span class="category-count-value" id="catCountVal_${cat.id}">${count}</span>
                                <button class="btn-icon-sm" onclick="changeCategoryCount('${cat.id}', 1)">+</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="categories-total-bar">
                <span>Всего артикулов:</span>
                <span class="categories-total-value" id="categoriesTotalSku">${totalSku}</span>
            </div>
        </div>
    `;
}

function toggleCategory(id, label, icon, checked) {
    const cats = wizardState.selectedCategories;
    const card = document.getElementById('catCard_' + id);
    const countControl = document.getElementById('catCount_' + id);

    if (checked) {
        if (!cats.find(c => c.id === id)) {
            cats.push({ id, label, icon, count: 2 });
        }
        if (card) card.classList.add('selected');
        if (countControl) countControl.style.display = '';
    } else {
        wizardState.selectedCategories = cats.filter(c => c.id !== id);
        if (card) card.classList.remove('selected');
        if (countControl) countControl.style.display = 'none';
    }
    updateCategoriesTotalSku();
}

function changeCategoryCount(id, delta) {
    const cat = wizardState.selectedCategories.find(c => c.id === id);
    if (!cat) return;
    cat.count = Math.max(1, Math.min(15, cat.count + delta));
    const valEl = document.getElementById('catCountVal_' + id);
    if (valEl) valEl.textContent = cat.count;
    updateCategoriesTotalSku();
}

function updateCategoriesTotalSku() {
    const total = wizardState.selectedCategories.reduce((sum, c) => sum + (c.count || 0), 0);
    const el = document.getElementById('categoriesTotalSku');
    if (el) el.textContent = total;

    // Auto-update requirements
    wizardState.requirements.itemsCount = total;
}

// =============================================
// STEP 4: COLLECTION PARAMS
// =============================================
function renderStep4_Params() {
    const c = wizardState.collection;
    const r = wizardState.requirements;

    return `
        <div class="wizard-step-content">
            <div class="wizard-step-header">
                <h4>🎯 Параметры новой коллекции</h4>
                <p>Задайте характеристики капсулы, которую создаст AI</p>
            </div>

            <div class="wizard-form-grid">
                <div class="form-group full-width">
                    <label class="form-label required">Название коллекции</label>
                    <input type="text" class="form-input form-input-lg" id="wizCollectionName"
                           value="${c.name}" placeholder="SIGNAL Urban"
                           oninput="wizardState.collection.name = this.value">
                </div>

                <div class="form-group full-width">
                    <label class="form-label">📝 Концепция коллекции (творческий бриф)</label>
                    <textarea class="form-textarea" id="wizCollectionDescription" rows="5"
                              placeholder="Опишите стилистику, палитру, ключевые элементы, настроение коллекции. Например: Пастельная бирюзовая палитра, объёмные цветочные аппликации, лаконичные силуэты..."
                              oninput="wizardState.collection.description = this.value">${c.description || ''}</textarea>
                    <div style="font-size:11px; color:var(--gray-500); margin-top:4px;">Это описание станет главным ориентиром для AI при генерации промптов Midjourney</div>
                </div>

                <div class="form-group">
                    <label class="form-label">Сезон</label>
                    <select class="form-select" id="wizCollectionSeason"
                            onchange="wizardState.collection.season = this.value">
                        <option value="AW26" ${c.season === 'AW26' ? 'selected' : ''}>AW26 (Осень-Зима)</option>
                        <option value="SS26" ${c.season === 'SS26' ? 'selected' : ''}>SS26 (Весна-Лето)</option>
                        <option value="AW25" ${c.season === 'AW25' ? 'selected' : ''}>AW25 (Осень-Зима)</option>
                        <option value="SS25" ${c.season === 'SS25' ? 'selected' : ''}>SS25 (Весна-Лето)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Ценовой сегмент</label>
                    <select class="form-select" id="wizCollectionSegment"
                            onchange="wizardState.collection.segment = this.value">
                        <option value="economy" ${c.segment === 'economy' ? 'selected' : ''}>💚 Эконом (890-2990₽)</option>
                        <option value="standard" ${c.segment === 'standard' ? 'selected' : ''}>💛 Стандарт (2990-6990₽)</option>
                        <option value="premium" ${c.segment === 'premium' ? 'selected' : ''}>🧡 Премиум (6990-19990₽)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Возрастная группа</label>
                    <select class="form-select" id="wizCollectionAge"
                            onchange="wizardState.collection.ageGroup = this.value">
                        <option value="baby" ${c.ageGroup === 'baby' ? 'selected' : ''}>👶 0-24 мес</option>
                        <option value="toddler" ${c.ageGroup === 'toddler' ? 'selected' : ''}>🧒 2-7 лет</option>
                        <option value="kid" ${c.ageGroup === 'kid' ? 'selected' : ''}>👦 7-14 лет</option>
                        <option value="teen" ${c.ageGroup === 'teen' ? 'selected' : ''}>🧑 14-18 лет</option>
                        <option value="women" ${c.ageGroup === 'women' ? 'selected' : ''}>👩 Женщины</option>
                        <option value="men" ${c.ageGroup === 'men' ? 'selected' : ''}>👨 Мужчины</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Пол</label>
                    <select class="form-select" id="wizCollectionGender"
                            onchange="wizardState.collection.gender = this.value">
                        <option value="male" ${c.gender === 'male' ? 'selected' : ''}>👦 Мальчики</option>
                        <option value="female" ${c.gender === 'female' ? 'selected' : ''}>👧 Девочки</option>
                        <option value="unisex" ${c.gender === 'unisex' ? 'selected' : ''}>👫 Унисекс</option>
                    </select>
                </div>
            </div>

            <div class="wizard-divider"></div>

            <h5 class="wizard-section-title">📦 Количество образов</h5>

            <div class="wizard-sliders">
                <div class="wizard-slider-group">
                    <label class="slider-label">
                        <span>👔 Образов (looks)</span>
                        <span class="slider-value-display" id="looksDisplay">${r.looksCount}</span>
                    </label>
                    <input type="range" class="wizard-slider" id="wizLooksSlider"
                           min="3" max="10" value="${r.looksCount}"
                           oninput="wizardState.requirements.looksCount = parseInt(this.value); updateSliderDisplays()">
                    <div class="slider-hints">
                        <span>3</span>
                        <span>10</span>
                    </div>
                </div>
            </div>

            <div class="items-per-look-hint" id="itemsPerLookHint">
                ${wizardState.requirements.itemsCount} артикулов из категорий ≈ ${Math.round(wizardState.requirements.itemsCount / r.looksCount)} на образ
            </div>

            <div class="form-group">
                <label class="form-label">💬 Дополнительные пожелания (опционально)</label>
                <textarea class="form-textarea" id="wizNotes" rows="2"
                          placeholder="Акцент на яркие детали, использовать милитари-элементы..."
                          oninput="wizardState.requirements.notes = this.value">${r.notes}</textarea>
            </div>
        </div>
    `;
}

function updateSliderDisplays() {
    const looksDisplay = document.getElementById('looksDisplay');
    const perLookHint = document.getElementById('itemsPerLookHint');
    const looksSlider = document.getElementById('wizLooksSlider');

    const { looksCount } = window.wizardState.requirements;
    const itemsCount = window.wizardState.requirements.itemsCount;

    if (looksDisplay) looksDisplay.textContent = looksCount;
    if (perLookHint) perLookHint.textContent = `${itemsCount} артикулов из категорий ≈ ${Math.round(itemsCount / looksCount)} на образ`;

    if (looksSlider) {
        const percent = ((looksCount - 3) / (10 - 3)) * 100;
        looksSlider.style.background = `linear-gradient(to right, #E8601C 0%, #E8601C ${percent}%, #E5E7EB ${percent}%, #E5E7EB 100%)`;
    }
}

// =============================================
// STEP 5: GENERATE
// =============================================
function renderStep5_Generate() {
    if (wizardState.isGenerating) {
        return renderGeneratingState();
    }

    const totalItems = wizardState.selectedCategories.reduce((s, c) => s + c.count, 0);

    return `
        <div class="wizard-step-content wizard-summary">
            <div class="wizard-step-header">
                <h4>✨ Готово к генерации!</h4>
                <p>Проверьте данные и запустите AI</p>
            </div>

            <div class="summary-grid">
                <div class="summary-card">
                    <div class="summary-card-header">
                        <span class="summary-icon">📸</span>
                        <span>Бестселлер</span>
                    </div>
                    <div class="summary-card-body">
                        ${wizardState.bestseller.imagePreview ?
                            `<img src="${wizardState.bestseller.imagePreview}" class="summary-image" alt="Бестселлер">` :
                            `<div class="no-image-badge">Без фото</div>`
                        }
                        <div class="summary-details">
                            <strong>${wizardState.analysis?.description?.substring(0, 80) || 'Анализ завершён'}</strong>
                            <span>${wizardState.analysis?.style || ''}</span>
                        </div>
                    </div>
                </div>

                ${wizardState.collection.description ? `
                <div class="summary-card">
                    <div class="summary-card-header">
                        <span class="summary-icon">📝</span>
                        <span>Концепция</span>
                    </div>
                    <div class="summary-card-body">
                        <p style="font-size:12px; color:var(--gray-600); line-height:1.4; margin:0;">
                            ${wizardState.collection.description.substring(0, 200)}${wizardState.collection.description.length > 200 ? '...' : ''}
                        </p>
                    </div>
                </div>
                ` : ''}

                <div class="summary-card">
                    <div class="summary-card-header">
                        <span class="summary-icon">📋</span>
                        <span>Категории</span>
                    </div>
                    <div class="summary-card-body">
                        <div class="summary-categories">
                            ${wizardState.selectedCategories.map(c => `
                                <span class="summary-cat-tag">${c.icon} ${c.label} ×${c.count}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="summary-card">
                    <div class="summary-card-header">
                        <span class="summary-icon">🎯</span>
                        <span>Коллекция</span>
                    </div>
                    <div class="summary-card-body">
                        <div class="summary-collection">
                            <h5>${wizardState.collection.name || 'Новая капсула'}</h5>
                            <div class="summary-tags">
                                <span class="tag">${wizardState.collection.season}</span>
                                <span class="tag">${getAgeLabel(wizardState.collection.ageGroup)}</span>
                                <span class="tag">${getGenderLabel(wizardState.collection.gender)}</span>
                                <span class="tag">${getSegmentLabel(wizardState.collection.segment)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="summary-card">
                    <div class="summary-card-header">
                        <span class="summary-icon">📦</span>
                        <span>Генерация</span>
                    </div>
                    <div class="summary-card-body">
                        <div class="summary-numbers">
                            <div class="summary-number">
                                <span class="number">${wizardState.requirements.looksCount}</span>
                                <span class="label">образов</span>
                            </div>
                            <div class="summary-number">
                                <span class="number">${totalItems}</span>
                                <span class="label">артикулов</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="ai-info-box">
                <div class="ai-info-icon">🤖</div>
                <div class="ai-info-text">
                    <strong>Claude AI создаст на основе анализа бестселлера:</strong>
                    <ul>
                        <li>🎨 Цветовую палитру (Pantone TCX) из цветов бестселлера</li>
                        <li>👔 ${wizardState.requirements.looksCount} стилистических образов</li>
                        <li>📦 ${totalItems} артикулов по выбранным категориям</li>
                        <li>✨ Готовые промпты для Midjourney</li>
                    </ul>
                </div>
            </div>

            <div class="generate-time-estimate">
                ⏱️ Примерное время генерации: 30-60 секунд
            </div>
        </div>
    `;
}

function renderGeneratingState() {
    return `
        <div class="wizard-step-content wizard-generating">
            <div class="generating-animation">
                <div class="generating-spinner"></div>
                <div class="generating-icon">🤖</div>
            </div>
            <h4 class="generating-title">AI создаёт коллекцию...</h4>
            <div class="generating-steps">
                <div class="generating-step active" id="genStep1">
                    <span class="step-icon">🎨</span>
                    <span>Создание палитры</span>
                </div>
                <div class="generating-step" id="genStep2">
                    <span class="step-icon">👔</span>
                    <span>Формирование образов</span>
                </div>
                <div class="generating-step" id="genStep3">
                    <span class="step-icon">📦</span>
                    <span>Генерация артикулов</span>
                </div>
                <div class="generating-step" id="genStep4">
                    <span class="step-icon">✨</span>
                    <span>Создание промптов</span>
                </div>
            </div>
            <p class="generating-hint">Не закрывайте окно</p>
        </div>
    `;
}

// =============================================
// STEP 6: REVIEW RESULTS
// =============================================
function renderStep6_Review() {
    const result = wizardState.result;

    if (!result || !result.success) {
        return `
            <div class="wizard-step-content wizard-error">
                <div class="error-icon">❌</div>
                <h4>Ошибка генерации</h4>
                <p>${result?.error || 'Неизвестная ошибка'}</p>
                <button class="btn btn-primary" onclick="wizardGoToStep(5)">
                    ← Попробовать снова
                </button>
            </div>
        `;
    }

    const data = result.data;

    return `
        <div class="wizard-step-content wizard-review">
            <div class="wizard-step-header">
                <h4>🎉 Коллекция создана!</h4>
                <p>Просмотрите результат и сохраните</p>
            </div>

            <!-- Analysis -->
            ${data.analysis ? `
            <div class="review-section">
                <h5 class="review-section-title">📊 Анализ бестселлера</h5>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <span class="analysis-label">Формула цвета:</span>
                        <span class="analysis-value">${data.analysis.colorFormula || '-'}</span>
                    </div>
                    <div class="analysis-item">
                        <span class="analysis-label">Драйверы продаж:</span>
                        <span class="analysis-value">${Array.isArray(data.analysis.salesDrivers?.keyDrivers) ? data.analysis.salesDrivers.keyDrivers.join(', ') : (Array.isArray(data.analysis.salesDrivers) ? data.analysis.salesDrivers.join(', ') : data.analysis.salesDrivers?.visualImpact || '-')}</span>
                    </div>
                    <div class="analysis-item">
                        <span class="analysis-label">Ключевые детали:</span>
                        <span class="analysis-value">${Array.isArray(data.analysis.keyFeatures) ? data.analysis.keyFeatures.join(', ') : data.analysis.keyFeatures || '-'}</span>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Palette -->
            <div class="review-section">
                <h5 class="review-section-title">🎨 Палитра (${data.palette?.length || 0} цветов)</h5>
                <div class="palette-preview">
                    ${(data.palette || []).map(c => `
                        <div class="palette-color" style="background: ${c.hex || '#ccc'}">
                            <span class="color-code">${c.code || ''}</span>
                            <span class="color-name">${c.name || ''}</span>
                            <span class="color-percent">${c.percent || 0}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Looks -->
            <div class="review-section">
                <h5 class="review-section-title">👔 Образы (${data.looks?.length || 0})</h5>
                <div class="looks-preview">
                    ${(data.looks || []).map(look => `
                        <div class="look-card">
                            <div class="look-header">
                                <span class="look-name">${look.name}</span>
                            </div>
                            <p class="look-description">${look.description || ''}</p>
                            <div class="look-pieces">
                                ${(look.keyPieces || []).map(p => `<span class="look-piece">${p}</span>`).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Items -->
            <div class="review-section">
                <h5 class="review-section-title">📦 Артикулы (${data.items?.length || 0})</h5>
                <div class="items-preview">
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Название</th>
                                <th>Категория</th>
                                <th>Цена</th>
                                <th>Промпт</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(data.items || []).slice(0, 15).map(item => `
                                <tr>
                                    <td><code>${item.id}</code></td>
                                    <td>${item.name}</td>
                                    <td>${item.category}</td>
                                    <td>${item.targetPrice ? item.targetPrice + '₽' : '-'}</td>
                                    <td>
                                        ${item.prompt ?
                                            `<span class="prompt-badge" title="${item.prompt.substring(0, 200)}...">✅ Готов</span>` :
                                            `<span class="prompt-badge missing">❌</span>`
                                        }
                                    </td>
                                </tr>
                            `).join('')}
                            ${(data.items || []).length > 15 ? `
                                <tr class="more-row">
                                    <td colspan="5">... и ещё ${data.items.length - 15} артикулов</td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="review-stats">
                <div class="stat">
                    <span class="stat-value">${data.palette?.length || 0}</span>
                    <span class="stat-label">цветов</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${data.looks?.length || 0}</span>
                    <span class="stat-label">образов</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${data.items?.length || 0}</span>
                    <span class="stat-label">артикулов</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${data.items?.filter(i => i.prompt)?.length || 0}</span>
                    <span class="stat-label">промптов</span>
                </div>
            </div>
        </div>
    `;
}

// =============================================
// NAVIGATION
// =============================================
function wizardNextStep() {
    if (wizardState.step === 5) {
        runAIGeneration();
        return;
    }

    if (!validateWizardStep()) return;

    wizardState.step++;
    renderWizardModal();
}

function wizardPrevStep() {
    if (wizardState.step > 1) {
        wizardState.step--;
        renderWizardModal();
    }
}

function wizardGoToStep(step) {
    wizardState.step = step;
    wizardState.isGenerating = false;
    renderWizardModal();
}

function validateWizardStep() {
    switch (wizardState.step) {
        case 1:
            if (!wizardState.bestseller.imageBase64) {
                showToast('Загрузите фото бестселлера', 'error');
                return false;
            }
            return true;

        case 2:
            if (!wizardState.analysis) {
                showToast('Дождитесь завершения анализа', 'error');
                return false;
            }
            return true;

        case 3:
            if (wizardState.selectedCategories.length === 0) {
                showToast('Выберите хотя бы одну категорию', 'error');
                return false;
            }
            return true;

        case 4:
            if (!wizardState.collection.name) {
                showToast('Укажите название коллекции', 'error');
                return false;
            }
            return true;

        default:
            return true;
    }
}

function initWizardStep() {
    // Drag & drop for step 1
    if (window.wizardState.step === 1) {
        const uploadArea = document.getElementById('imageUploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('drag-over');
            });
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                const file = e.dataTransfer.files[0];
                if (file) {
                    document.getElementById('wizardImageInput').files = e.dataTransfer.files;
                    handleWizardImage({ target: { files: [file] } });
                }
            });
        }
    }

    // Sliders for step 4
    if (window.wizardState.step === 4) {
        updateSliderDisplays();
    }
}

// =============================================
// AI GENERATION
// =============================================
async function runAIGeneration() {
    wizardState.isGenerating = true;
    renderWizardModal();

    // Animate steps
    const animateSteps = async () => {
        const steps = ['genStep1', 'genStep2', 'genStep3', 'genStep4'];
        for (let i = 0; i < steps.length; i++) {
            await new Promise(r => setTimeout(r, 1200));
            const prev = document.getElementById(steps[i]);
            const next = document.getElementById(steps[i + 1]);
            if (prev) prev.classList.add('completed');
            if (next) next.classList.add('active');
        }
    };
    animateSteps();

    try {
        const totalItems = wizardState.selectedCategories.reduce((s, c) => s + c.count, 0);

        const result = await generateCapsuleWithAI({
            bestseller: {
                sku: wizardState.bestseller.sku,
                name: wizardState.analysis?.category || '',
                description: wizardState.analysis?.description || '',
                colors: (wizardState.analysis?.colors || []).map(c => `${c.name} (${c.code})`).join(', '),
                price: wizardState.bestseller.price,
                cost: wizardState.bestseller.cost,
                sold: wizardState.bestseller.sold,
                imageBase64: wizardState.bestseller.imageBase64,
                hasImage: !!wizardState.bestseller.imageBase64
            },
            collection: {
                name: wizardState.collection.name,
                description: wizardState.collection.description,
                season: wizardState.collection.season,
                ageGroup: wizardState.collection.ageGroup,
                gender: wizardState.collection.gender,
                segment: wizardState.collection.segment
            },
            requirements: {
                looksCount: wizardState.requirements.looksCount,
                itemsCount: totalItems,
                notes: wizardState.requirements.notes
            },
            analysis: wizardState.analysis,
            selectedCategories: wizardState.selectedCategories
        });

        wizardState.result = result;
        wizardState.isGenerating = false;
        wizardState.step = 6;
        renderWizardModal();

        if (result.success) {
            showToast('Коллекция успешно создана!', 'success');
        } else {
            showToast('Ошибка генерации: ' + result.error, 'error');
        }

    } catch (error) {
        console.error('[AI Wizard] Error:', error);
        wizardState.result = { success: false, error: error.message };
        wizardState.isGenerating = false;
        wizardState.step = 6;
        renderWizardModal();
        showToast('Ошибка: ' + error.message, 'error');
    }
}

// =============================================
// SAVE CAPSULE
// =============================================
async function saveGeneratedCapsule() {
    const result = wizardState.result;
    if (!result?.success || !result?.data) {
        showToast('Нет данных для сохранения', 'error');
        return;
    }

    const data = result.data;
    const collection = wizardState.collection;

    // Create capsule
    // Преобразовать selectedCategories → categories для совместимости с items.js generateItems()
    const categoriesObj = {};
    (wizardState.selectedCategories || []).forEach(cat => {
        categoriesObj[cat.id] = cat.count || 1;
    });

    const capsule = {
        id: 'capsule-' + Date.now(),
        name: collection.name,
        season: collection.season,
        ageGroup: collection.ageGroup,
        gender: collection.gender,
        segment: collection.segment,
        description: wizardState.collection.description || `AI-generated from bestseller analysis`,
        createdAt: new Date().toISOString(),
        aiGenerated: true,
        bestsellerImage: wizardState.bestseller.imageBase64,
        bestsellerAnalysis: wizardState.analysis,
        categories: categoriesObj,
        selectedCategories: wizardState.selectedCategories,
        looks: data.looks || [],
        palette: data.palette || [],
        analysis: data.analysis || {}
    };

    // Save capsule
    let capsules = [];
    try {
        const parsed = JSON.parse(localStorage.getItem('kari-capsules') || '[]');
        capsules = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        capsules = [];
    }
    capsules.push(capsule);
    try {
        localStorage.setItem('kari-capsules', JSON.stringify(capsules));
    } catch (e) {
        console.error('[AI Wizard] Error saving capsule:', e);
        showToast('Ошибка сохранения', 'error');
        return;
    }

    // Create items — сохраняем в формате объекта {capsuleId: [items]} (как ожидает items.js loadItems)
    const newItems = (data.items || []).map(item => ({
        id: item.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        capsuleId: capsule.id,
        lookId: item.lookId,
        name: item.name,
        category: item.category,
        colors: item.colors || [],
        sizes: item.sizes || '',
        price: item.targetPrice || null,
        materials: item.materials || '',
        features: item.features || [],
        prompt: item.prompt || '',
        description: item.description || '',
        status: 'draft',
        createdAt: new Date().toISOString()
    }));

    try {
        let allItems = {};
        try {
            const parsed = JSON.parse(localStorage.getItem('kari-items') || '{}');
            // Миграция: если старый формат (массив) — начинаем с чистого объекта
            allItems = (parsed && !Array.isArray(parsed) && typeof parsed === 'object') ? parsed : {};
        } catch (e2) {
            allItems = {};
        }
        allItems[capsule.id] = newItems;
        localStorage.setItem('kari-items', JSON.stringify(allItems));
        console.log(`[AI Wizard] Saved ${newItems.length} items for capsule ${capsule.id} (object format)`);
    } catch (e) {
        console.error('[AI Wizard] Error saving items:', e);
    }

    // Create palette
    if (data.palette?.length) {
        let palettes = [];
        try {
            const parsed = JSON.parse(localStorage.getItem('kari-palettes') || '[]');
            palettes = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            palettes = [];
        }

        const newPalette = {
            id: 'palette-' + Date.now(),
            capsuleId: capsule.id,
            name: `Палитра ${collection.name}`,
            colors: data.palette,
            createdAt: new Date().toISOString()
        };
        palettes.push(newPalette);

        try {
            localStorage.setItem('kari-palettes', JSON.stringify(palettes));
        } catch (e) {
            console.error('[AI Wizard] Error saving palette:', e);
        }

        // Link palette to capsule
        capsule.paletteId = newPalette.id;
        let updatedCapsules = [];
        try {
            const parsed = JSON.parse(localStorage.getItem('kari-capsules') || '[]');
            updatedCapsules = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            updatedCapsules = [];
        }
        const idx = updatedCapsules.findIndex(c => c.id === capsule.id);
        if (idx !== -1) {
            updatedCapsules[idx] = capsule;
            try {
                localStorage.setItem('kari-capsules', JSON.stringify(updatedCapsules));
            } catch (e) {}
        }
    }

    showToast(`Капсула "${collection.name}" сохранена! (${newItems.length} артикулов)`, 'success');

    closeAIWizard();

    if (typeof renderCapsules === 'function') {
        renderCapsules();
    }
}

// =============================================
// HELPERS
// =============================================
function getAgeLabel(age) {
    const labels = { baby: '0-24 мес', toddler: '2-7 лет', kid: '7-14 лет', teen: '14-18 лет', women: 'Женщины', men: 'Мужчины' };
    return labels[age] || age;
}

function getSegmentLabel(segment) {
    const labels = { economy: '💚 Эконом', standard: '💛 Стандарт', premium: '🧡 Премиум' };
    return labels[segment] || segment;
}

// =============================================
// EXPORTS
// =============================================
window.openAIWizard = openAIWizard;
window.closeAIWizard = closeAIWizard;
window.wizardNextStep = wizardNextStep;
window.wizardPrevStep = wizardPrevStep;
window.wizardGoToStep = wizardGoToStep;
window.triggerImageUpload = triggerImageUpload;
window.handleWizardImage = handleWizardImage;
window.updateSliderDisplays = updateSliderDisplays;
window.runAIGeneration = runAIGeneration;
window.saveGeneratedCapsule = saveGeneratedCapsule;
window.toggleCategory = toggleCategory;
window.changeCategoryCount = changeCategoryCount;
window.rerunImageAnalysis = rerunImageAnalysis;
window.editGeneratedCapsule = () => { showToast('Редактирование в разработке', 'info'); };

console.log('[AI Wizard] v10.0 loaded (6-step flow)');
