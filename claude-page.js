// =============================================
// KARI Design Hub - Claude Page Functions
// Добавить в конец соответствующих скриптов или в app.js
// =============================================

// Инициализация страницы Claude
function initClaudePage() {
    updateClaudeStats();
    renderReportsHistory();
}

// Обновление статистики
function updateClaudeStats() {
    const capsules = loadCapsules();
    const reports = loadAnalysisReports();
    
    // Подсчёт промптов
    let totalPrompts = 0;
    capsules.forEach(capsule => {
        const items = loadItems(capsule.id);
        totalPrompts += items.filter(i => i.prompt && i.prompt.trim() !== '').length;
    });
    
    document.getElementById('claudeStatReports').textContent = reports.length;
    document.getElementById('claudeStatPrompts').textContent = totalPrompts;
    document.getElementById('claudeStatCapsules').textContent = capsules.length;
}

// Рендер истории отчётов
function renderReportsHistory() {
    const container = document.getElementById('reportsHistory');
    const reports = loadAnalysisReports();
    const capsules = loadCapsules();
    
    if (reports.length === 0) {
        container.innerHTML = '<p class="empty-state">Отчёты появятся здесь после анализа капсул</p>';
        return;
    }
    
    // Сортируем по дате (новые сверху)
    const sorted = [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    container.innerHTML = sorted.map(report => {
        const capsule = capsules.find(c => c.id === report.capsuleId);
        const date = new Date(report.createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="report-item" onclick="viewReport('${report.id}')">
                <div class="report-info">
                    <div class="report-title">📊 ${capsule ? capsule.name : 'Капсула удалена'}</div>
                    <div class="report-meta">${date}</div>
                </div>
                <div class="report-actions">
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); copyReportById('${report.id}')">📋</button>
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); deleteReport('${report.id}')">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

// Просмотр отчёта
function viewReport(reportId) {
    const reports = loadAnalysisReports();
    const report = reports.find(r => r.id === reportId);
    
    if (!report) {
        showToast('Отчёт не найден', 'error');
        return;
    }
    
    const capsules = loadCapsules();
    const capsule = capsules.find(c => c.id === report.capsuleId);
    
    // Конвертируем markdown в HTML
    let htmlContent = report.content
        .replace(/## (.*)/g, '<h3 style="color: var(--kari-orange); margin-top: 24px; margin-bottom: 12px;">$1</h3>')
        .replace(/### (.*)/g, '<h4 style="margin-top: 16px; margin-bottom: 8px;">$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^- (.*)/gm, '<li style="margin-left: 20px;">$1</li>')
        .replace(/\n\n/g, '</p><p style="margin-bottom: 12px;">')
        .replace(/\n/g, '<br>');
    
    const modal = document.getElementById('itemModal');
    const modalTitle = document.getElementById('itemModalTitle');
    const modalBody = document.getElementById('itemModalBody');
    
    if (modalTitle) modalTitle.textContent = '📊 ' + (capsule ? capsule.name : 'Отчёт');
    modalBody.innerHTML = `
        <div style="max-height: 70vh; overflow-y: auto;">
            <div style="background: var(--gray-50); padding: 20px; border-radius: 12px; line-height: 1.7; font-size: 14px;">
                <p style="margin-bottom: 12px;">${htmlContent}</p>
            </div>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 20px;">
            <button class="btn btn-secondary" onclick="copyReportById('${reportId}')" style="flex: 1;">📋 Копировать</button>
            <button class="btn btn-secondary" onclick="closeItemModal()" style="flex: 1;">Закрыть</button>
        </div>
    `;
    modal.classList.add('active');
}

// Копировать отчёт
function copyReportById(reportId) {
    const reports = loadAnalysisReports();
    const report = reports.find(r => r.id === reportId);
    
    if (report) {
        navigator.clipboard.writeText(report.content);
        showToast('Отчёт скопирован!', 'success');
    }
}

// Удалить отчёт
function deleteReport(reportId) {
    showConfirmDialog({
        title: 'Удалить отчёт?',
        message: 'Этот отчёт будет удалён безвозвратно.',
        confirmText: '🗑️ Удалить',
        danger: true,
        onConfirm: () => {
            let reports = loadAnalysisReports();
            reports = reports.filter(r => r.id !== reportId);
            localStorage.setItem('kari-claude-reports', JSON.stringify(reports));
            renderReportsHistory();
            updateClaudeStats();
            showToast('Отчёт удалён', 'success');
        }
    });
}

// Модалка выбора капсулы для анализа
function openClaudeAnalysisModal() {
    const capsules = loadCapsules();
    
    if (capsules.length === 0) {
        showToast('Сначала создайте капсулу', 'error');
        return;
    }
    
    const modal = document.getElementById('itemModal');
    const modalTitle = document.getElementById('itemModalTitle');
    const modalBody = document.getElementById('itemModalBody');
    
    if (modalTitle) modalTitle.textContent = '📊 Анализ капсулы';
    modalBody.innerHTML = `
        <p style="margin-bottom: 16px; color: var(--gray-600);">Выберите капсулу для анализа:</p>
        <div class="capsule-select-list">
            ${capsules.map(c => {
                const items = loadItems(c.id);
                return `
                    <div class="capsule-select-item" onclick="runCapsuleAnalysis('${c.id}')" style="padding: 16px; border: 1px solid var(--gray-200); border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: 600;">${c.name}</div>
                                <div style="font-size: 12px; color: var(--gray-500);">${c.season} • ${items.length} артикулов</div>
                            </div>
                            <span style="font-size: 20px;">→</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        <button class="btn btn-secondary" onclick="closeItemModal()" style="width: 100%; margin-top: 16px;">Отмена</button>
    `;
    modal.classList.add('active');
    
    // Добавляем hover эффект
    document.querySelectorAll('.capsule-select-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.borderColor = 'var(--kari-orange)';
            item.style.background = 'var(--kari-orange-light)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.borderColor = 'var(--gray-200)';
            item.style.background = 'white';
        });
    });
}

// Запуск анализа капсулы
async function runCapsuleAnalysis(capsuleId) {
    closeItemModal();
    await analyzeCapsulewithAI(capsuleId);
    updateClaudeStats();
    renderReportsHistory();
}

// Модалка выбора капсулы для генерации промптов
function openClaudePromptsModal() {
    const capsules = loadCapsules();
    
    if (capsules.length === 0) {
        showToast('Сначала создайте капсулу', 'error');
        return;
    }
    
    const modal = document.getElementById('itemModal');
    const modalTitle = document.getElementById('itemModalTitle');
    const modalBody = document.getElementById('itemModalBody');
    
    if (modalTitle) modalTitle.textContent = '✨ Генерация промптов';
    modalBody.innerHTML = `
        <p style="margin-bottom: 16px; color: var(--gray-600);">Выберите капсулу для генерации промптов:</p>
        <div class="capsule-select-list">
            ${capsules.map(c => {
                const items = loadItems(c.id);
                const withoutPrompts = items.filter(i => !i.prompt || i.prompt.trim() === '').length;
                return `
                    <div class="capsule-select-item" onclick="runPromptsGeneration('${c.id}')" style="padding: 16px; border: 1px solid var(--gray-200); border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; ${withoutPrompts === 0 ? 'opacity: 0.5;' : ''}">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: 600;">${c.name}</div>
                                <div style="font-size: 12px; color: var(--gray-500);">
                                    ${withoutPrompts > 0 ? `${withoutPrompts} артикулов без промптов` : '✅ Все промпты готовы'}
                                </div>
                            </div>
                            <span style="font-size: 20px;">${withoutPrompts > 0 ? '→' : '✓'}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        <button class="btn btn-secondary" onclick="closeItemModal()" style="width: 100%; margin-top: 16px;">Отмена</button>
    `;
    modal.classList.add('active');
    
    // Добавляем hover эффект
    document.querySelectorAll('.capsule-select-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.borderColor = 'var(--kari-orange)';
            item.style.background = 'var(--kari-orange-light)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.borderColor = 'var(--gray-200)';
            item.style.background = 'white';
        });
    });
}

// Запуск генерации промптов
async function runPromptsGeneration(capsuleId) {
    closeItemModal();
    await generatePromptsForCapsule(capsuleId);
    updateClaudeStats();
}

// Модалка выбора капсулы для подбора палитры
function openClaudePaletteModal() {
    const capsules = loadCapsules();
    
    if (capsules.length === 0) {
        showToast('Сначала создайте капсулу', 'error');
        return;
    }
    
    const modal = document.getElementById('itemModal');
    const modalTitle = document.getElementById('itemModalTitle');
    const modalBody = document.getElementById('itemModalBody');
    
    if (modalTitle) modalTitle.textContent = '🎨 Подбор палитры';
    modalBody.innerHTML = `
        <p style="margin-bottom: 16px; color: var(--gray-600);">Выберите капсулу для AI-подбора палитры:</p>
        <div class="capsule-select-list">
            ${capsules.map(c => `
                <div class="capsule-select-item" onclick="runPaletteSuggestion('${c.id}')" style="padding: 16px; border: 1px solid var(--gray-200); border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600;">${c.name}</div>
                            <div style="font-size: 12px; color: var(--gray-500);">${c.season} • ${c.gender}</div>
                        </div>
                        <span style="font-size: 20px;">→</span>
                    </div>
                </div>
            `).join('')}
        </div>
        <button class="btn btn-secondary" onclick="closeItemModal()" style="width: 100%; margin-top: 16px;">Отмена</button>
    `;
    modal.classList.add('active');
    
    // Hover эффект
    document.querySelectorAll('.capsule-select-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.borderColor = 'var(--kari-orange)';
            item.style.background = 'var(--kari-orange-light)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.borderColor = 'var(--gray-200)';
            item.style.background = 'white';
        });
    });
}

// Запуск подбора палитры
async function runPaletteSuggestion(capsuleId) {
    closeItemModal();
    const result = await suggestColorsForCapsule(capsuleId);
    
    if (result.success && result.colors) {
        // Показываем результат
        const modal = document.getElementById('itemModal');
        const modalTitle = document.getElementById('itemModalTitle');
        const modalBody = document.getElementById('itemModalBody');
        
        if (modalTitle) modalTitle.textContent = '🎨 Рекомендуемая палитра';
        modalBody.innerHTML = `
            <div style="display: grid; gap: 12px; margin-bottom: 20px;">
                ${result.colors.map(c => `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--gray-50); border-radius: 8px;">
                        <div style="width: 48px; height: 48px; background: ${c.hex}; border-radius: 8px; border: 1px solid var(--gray-200);"></div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600;">${c.name}</div>
                            <div style="font-size: 12px; color: var(--gray-500);">${c.code}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 12px; color: var(--gray-500);">${c.role === 'base' ? 'Базовый' : 'Акцент'}</div>
                            <div style="font-weight: 600; color: var(--kari-orange);">${c.percent}%</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="btn btn-primary" onclick="applyPaletteToCapsule('${capsuleId}', ${JSON.stringify(result.colors).replace(/"/g, '&quot;')})" style="flex: 1;">✅ Применить</button>
                <button class="btn btn-secondary" onclick="closeItemModal()" style="flex: 1;">Отмена</button>
            </div>
        `;
        modal.classList.add('active');
    }
}

// Применить палитру к капсуле
function applyPaletteToCapsule(capsuleId, colors) {
    // Создаём новую палитру
    const palettes = loadPalettes();
    const capsule = getCapsuleById(capsuleId);
    
    const newPalette = {
        id: 'palette-' + Date.now(),
        name: `Палитра ${capsule.name}`,
        colors: colors,
        createdAt: new Date().toISOString()
    };
    
    palettes.push(newPalette);
    savePalettes(palettes);
    
    // Привязываем к капсуле
    updateCapsule(capsuleId, { paletteId: newPalette.id });
    
    closeItemModal();
    showToast('Палитра применена!', 'success');
}

// Экспорт функций
window.initClaudePage = initClaudePage;
window.updateClaudeStats = updateClaudeStats;
window.renderReportsHistory = renderReportsHistory;
window.viewReport = viewReport;
window.copyReportById = copyReportById;
window.deleteReport = deleteReport;
window.openClaudeAnalysisModal = openClaudeAnalysisModal;
window.openClaudePromptsModal = openClaudePromptsModal;
window.openClaudePaletteModal = openClaudePaletteModal;
window.runCapsuleAnalysis = runCapsuleAnalysis;
window.runPromptsGeneration = runPromptsGeneration;
window.runPaletteSuggestion = runPaletteSuggestion;
window.applyPaletteToCapsule = applyPaletteToCapsule;

// Алиас для совместимости с app.js
window.renderClaudePage = initClaudePage;

console.log('🤖 Claude Page functions loaded');
