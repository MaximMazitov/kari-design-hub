// =============================================
// KARI Design Hub - Export Module v2.1
// Excel Export via SheetJS
// =============================================

function downloadFile(filename, content, mimeType) {
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function getGenderLabel(gender) {
    return { boys: 'Мальчики', girls: 'Девочки', unisex: 'Унисекс' }[gender] || gender || '';
}

function getStatusLabel(status) {
    return { 
        draft: 'Черновик', active: 'В работе', review: 'На проверке', completed: 'Завершена',
        brief: 'Бриф', prompt: 'Промпт', generation: 'Генерация', approved: 'Утверждён'
    }[status] || status || '';
}

const categoryLabels = {
    jackets: 'Куртка', hoodies: 'Худи', pants: 'Брюки',
    tshirts: 'Футболка', accessories: 'Аксессуар', shoes: 'Обувь'
};

// =============================================
// SHEETJS LOADER
// =============================================
let xlsxLoaded = false;

function loadXLSX() {
    return new Promise((resolve, reject) => {
        if (xlsxLoaded && window.XLSX) {
            resolve(window.XLSX);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = () => {
            xlsxLoaded = true;
            resolve(window.XLSX);
        };
        script.onerror = () => reject(new Error('Не удалось загрузить SheetJS'));
        document.head.appendChild(script);
    });
}

// =============================================
// EXPORT MODAL
// =============================================
function openExportModal(capsuleId) {
    const capsule = getCapsuleById(capsuleId);
    if (!capsule) return;
    
    const items = getItemsForCapsule(capsuleId);
    const stats = {
        total: items.length,
        approved: items.filter(i => i.status === 'approved').length,
        withPrompts: items.filter(i => i.prompt).length
    };
    
    document.getElementById('itemModalTitle').textContent = '📤 Экспорт капсулы';
    document.getElementById('itemModalBody').innerHTML = `
        <div class="export-modal">
            <div class="export-summary">
                <h3>${capsule.name}</h3>
                <p>${capsule.season} • ${capsule.totalItems} SKU</p>
            </div>
            
            <div class="export-stats">
                <div class="export-stat">
                    <span class="export-stat-value">${stats.total}</span>
                    <span class="export-stat-label">Артикулов</span>
                </div>
                <div class="export-stat">
                    <span class="export-stat-value">${stats.approved}</span>
                    <span class="export-stat-label">Утверждено</span>
                </div>
                <div class="export-stat">
                    <span class="export-stat-value">${stats.withPrompts}</span>
                    <span class="export-stat-label">С промптами</span>
                </div>
            </div>
            
            <div class="export-options">
                <h4>Для производства</h4>
                
                <div class="export-option excel-primary" onclick="exportTechDoc('${capsuleId}')">
                    <div class="export-option-icon">📋</div>
                    <div class="export-option-content">
                        <div class="export-option-title">ТЗ на производство</div>
                        <div class="export-option-desc">Спецификация по категориям, цвета, материалы</div>
                    </div>
                    <span class="export-option-arrow">→</span>
                </div>
                
                <h4 style="margin-top:20px;">Отчёты</h4>
                
                <div class="export-option" onclick="exportAsExcel('${capsuleId}')">
                    <div class="export-option-icon">📗</div>
                    <div class="export-option-content">
                        <div class="export-option-title">Excel (.xlsx)</div>
                        <div class="export-option-desc">Полный отчёт: сводка, артикулы, палитра</div>
                    </div>
                    <span class="export-option-arrow">→</span>
                </div>
                
                <div class="export-option" onclick="exportAsExcelItems('${capsuleId}')">
                    <div class="export-option-icon">📊</div>
                    <div class="export-option-content">
                        <div class="export-option-title">Excel (артикулы)</div>
                        <div class="export-option-desc">Только таблица артикулов</div>
                    </div>
                    <span class="export-option-arrow">→</span>
                </div>
                
                <div class="export-option" onclick="exportAsCSV('${capsuleId}')">
                    <div class="export-option-icon">📄</div>
                    <div class="export-option-content">
                        <div class="export-option-title">CSV (артикулы)</div>
                        <div class="export-option-desc">Простая таблица для импорта</div>
                    </div>
                    <span class="export-option-arrow">→</span>
                </div>
                
                <div class="export-option" onclick="exportPrompts('${capsuleId}')">
                    <div class="export-option-icon">✨</div>
                    <div class="export-option-content">
                        <div class="export-option-title">Промпты (TXT)</div>
                        <div class="export-option-desc">Все промпты для Midjourney</div>
                    </div>
                    <span class="export-option-arrow">→</span>
                </div>
                
                <div class="export-option" onclick="exportAsJSON('${capsuleId}')">
                    <div class="export-option-icon">{ }</div>
                    <div class="export-option-content">
                        <div class="export-option-title">JSON (бэкап)</div>
                        <div class="export-option-desc">Для импорта/восстановления</div>
                    </div>
                    <span class="export-option-arrow">→</span>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeItemModal()">Закрыть</button>
            </div>
        </div>
    `;
    
    document.getElementById('itemModal').classList.add('active');
}

// =============================================
// EXCEL EXPORT - FULL REPORT
// =============================================
async function exportAsExcel(capsuleId) {
    showToast('Подготовка Excel...', 'success');
    
    try {
        const XLSX = await loadXLSX();
        const capsule = getCapsuleById(capsuleId);
        const items = getItemsForCapsule(capsuleId);
        const palettes = typeof loadPalettes === 'function' ? loadPalettes() : [];
        const palette = capsule.paletteId ? palettes.find(p => p.id === capsule.paletteId) : null;
        
        const wb = XLSX.utils.book_new();
        
        // ===== ЛИСТ 1: СВОДКА =====
        const summaryData = [
            ['KARI Design Hub — Отчёт по капсуле'],
            [],
            ['Параметр', 'Значение'],
            ['Название', capsule.name],
            ['Сезон', capsule.season],
            ['Целевая группа', capsule.targetGroup === 'kids' ? 'Дети' : capsule.targetGroup === 'teens' ? 'Подростки' : 'Взрослые'],
            ['Возраст', capsule.ageRange || '—'],
            ['Пол', getGenderLabel(capsule.gender)],
            ['Ценовой сегмент', capsule.priceSegment === 'premium' ? 'Premium (до 19990₽)' : 'Standard (890-9990₽)'],
            ['Статус', getStatusLabel(capsule.status)],
            [],
            ['СТРУКТУРА КАПСУЛЫ'],
            ['Категория', 'Количество SKU'],
        ];
        
        Object.entries(capsule.categories || {}).forEach(([cat, count]) => {
            if (count > 0) summaryData.push([categoryLabels[cat] || cat, count]);
        });
        
        summaryData.push([], ['Всего SKU', capsule.totalItems]);
        
        summaryData.push([], ['ПРОГРЕСС ПО СТАТУСАМ']);
        summaryData.push(['Статус', 'Количество', '% от общего']);
        const statuses = capsule.itemsByStatus || {};
        const total = capsule.totalItems || 1;
        Object.entries(statuses).forEach(([st, cnt]) => {
            summaryData.push([getStatusLabel(st), cnt, Math.round(cnt / total * 100) + '%']);
        });
        
        summaryData.push([], ['Дата создания', new Date(capsule.createdAt).toLocaleDateString('ru-RU')]);
        summaryData.push(['Дата обновления', new Date(capsule.updatedAt).toLocaleDateString('ru-RU')]);
        summaryData.push(['Экспортировано', new Date().toLocaleString('ru-RU')]);
        
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        wsSummary['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Сводка');
        
        // ===== ЛИСТ 2: АРТИКУЛЫ =====
        const itemsHeader = [
            'SKU', 'Название', 'Категория', 'Статус',
            'Базовый цвет', 'Pantone TCX', 'HEX',
            'Акцентный цвет', 'Pantone TCX', 'HEX',
            'Материал', 'Размеры', 'Целевая цена', 'Промпт'
        ];
        
        const itemsData = [itemsHeader];
        items.forEach(item => {
            itemsData.push([
                item.sku,
                item.name,
                categoryLabels[item.category] || item.category,
                getStatusLabel(item.status),
                item.baseColor?.name || '',
                item.baseColor?.code || '',
                item.baseColor?.hex || '',
                item.accentColor?.name || '',
                item.accentColor?.code || '',
                item.accentColor?.hex || '',
                item.materials || '',
                item.sizes || '',
                item.priceTarget || '',
                item.prompt || ''
            ]);
        });
        
        const wsItems = XLSX.utils.aoa_to_sheet(itemsData);
        wsItems['!cols'] = [
            { wch: 18 }, { wch: 25 }, { wch: 12 }, { wch: 12 },
            { wch: 15 }, { wch: 15 }, { wch: 10 },
            { wch: 15 }, { wch: 15 }, { wch: 10 },
            { wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 60 }
        ];
        XLSX.utils.book_append_sheet(wb, wsItems, 'Артикулы');
        
        // ===== ЛИСТ 3: ПАЛИТРА =====
        if (palette) {
            const paletteData = [
                [`Палитра: ${palette.name}`],
                ['Сезон: ' + palette.season],
                [palette.description || ''],
                [],
                ['Название цвета', 'Pantone TCX', 'HEX', 'Роль', 'Доля %']
            ];
            
            palette.colors.forEach(c => {
                const role = c.role === 'base' ? 'Базовый' : c.role === 'accent' ? 'Акцент' : 'Нейтральный';
                paletteData.push([c.name, c.code, c.hex, role, c.percent]);
            });
            
            paletteData.push([]);
            paletteData.push(['Итого', '', '', '', palette.colors.reduce((s, c) => s + (c.percent || 0), 0) + '%']);
            
            const wsPalette = XLSX.utils.aoa_to_sheet(paletteData);
            wsPalette['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
            XLSX.utils.book_append_sheet(wb, wsPalette, 'Палитра');
        }
        
        // ===== ЛИСТ 4: СТАТИСТИКА ПО КАТЕГОРИЯМ =====
        const catStats = {};
        items.forEach(item => {
            if (!catStats[item.category]) {
                catStats[item.category] = { total: 0, approved: 0, withPrompt: 0, avgPrice: 0 };
            }
            catStats[item.category].total++;
            if (item.status === 'approved') catStats[item.category].approved++;
            if (item.prompt) catStats[item.category].withPrompt++;
            catStats[item.category].avgPrice += (item.priceTarget || 0);
        });
        
        const statsData = [
            ['Статистика по категориям'],
            [],
            ['Категория', 'Всего', 'Утверждено', '% готовности', 'С промптами', 'Ср. цена']
        ];
        
        Object.entries(catStats).forEach(([cat, st]) => {
            statsData.push([
                categoryLabels[cat] || cat,
                st.total,
                st.approved,
                Math.round(st.approved / st.total * 100) + '%',
                st.withPrompt,
                Math.round(st.avgPrice / st.total) + '₽'
            ]);
        });
        
        const wsStats = XLSX.utils.aoa_to_sheet(statsData);
        wsStats['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, wsStats, 'Статистика');
        
        // Генерация файла
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        const filename = `${capsule.name}_${capsule.season}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        downloadBlob(filename, blob);
        
        showToast('Excel экспортирован', 'success');
        closeItemModal();
        
    } catch (err) {
        console.error('Excel export error:', err);
        showToast('Ошибка экспорта: ' + err.message, 'error');
    }
}

// =============================================
// EXCEL EXPORT - ITEMS ONLY
// =============================================
async function exportAsExcelItems(capsuleId) {
    showToast('Подготовка Excel...', 'success');
    
    try {
        const XLSX = await loadXLSX();
        const capsule = getCapsuleById(capsuleId);
        const items = getItemsForCapsule(capsuleId);
        
        const wb = XLSX.utils.book_new();
        
        const itemsHeader = [
            'SKU', 'Название', 'Категория', 'Статус',
            'Базовый цвет', 'Pantone', 'Акцентный цвет', 'Pantone',
            'Материал', 'Размеры', 'Цена'
        ];
        
        const itemsData = [itemsHeader];
        items.forEach(item => {
            itemsData.push([
                item.sku,
                item.name,
                categoryLabels[item.category] || item.category,
                getStatusLabel(item.status),
                item.baseColor?.name || '',
                item.baseColor?.code || '',
                item.accentColor?.name || '',
                item.accentColor?.code || '',
                item.materials || '',
                item.sizes || '',
                item.priceTarget || ''
            ]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(itemsData);
        ws['!cols'] = [
            { wch: 18 }, { wch: 28 }, { wch: 12 }, { wch: 12 },
            { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
            { wch: 25 }, { wch: 10 }, { wch: 10 }
        ];
        
        // Заморозка первой строки
        ws['!freeze'] = { xSplit: 0, ySplit: 1 };
        
        XLSX.utils.book_append_sheet(wb, ws, 'Артикулы');
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        const filename = `${capsule.name}_артикулы.xlsx`;
        downloadBlob(filename, blob);
        
        showToast('Excel скачан', 'success');
        closeItemModal();
        
    } catch (err) {
        console.error('Excel export error:', err);
        showToast('Ошибка экспорта', 'error');
    }
}

// =============================================
// EXCEL EXPORT - TECH DOCUMENTATION (ТЗ на производство)
// =============================================
async function exportTechDoc(capsuleId) {
    showToast('Генерация ТЗ...', 'success');
    
    try {
        const XLSX = await loadXLSX();
        const capsule = getCapsuleById(capsuleId);
        const items = getItemsForCapsule(capsuleId);
        const palettes = typeof loadPalettes === 'function' ? loadPalettes() : [];
        const palette = capsule.paletteId ? palettes.find(p => p.id === capsule.paletteId) : null;
        
        const wb = XLSX.utils.book_new();
        
        // ===== 1. ТИТУЛЬНЫЙ ЛИСТ =====
        const titleData = [
            ['ТЕХНИЧЕСКОЕ ЗАДАНИЕ НА ПРОИЗВОДСТВО'],
            ['KARI GROUP — Детская одежда'],
            [],
            ['ИНФОРМАЦИЯ О КОЛЛЕКЦИИ'],
            ['Название:', capsule.name],
            ['Сезон:', capsule.season],
            ['Целевая аудитория:', `${capsule.targetGroup === 'kids' ? 'Дети' : capsule.targetGroup === 'teens' ? 'Подростки' : 'Взрослые'}`],
            ['Возрастная группа:', capsule.ageRange ? capsule.ageRange + ' лет' : '—'],
            ['Пол:', getGenderLabel(capsule.gender)],
            ['Ценовой сегмент:', capsule.priceSegment === 'premium' ? 'Premium (до 19 990₽)' : 'Standard (890-9 990₽)'],
            [],
            ['ОБЪЁМ ЗАКАЗА'],
            ['Всего SKU:', capsule.totalItems],
            ['Куртки/Бомберы:', (capsule.categories?.jackets || 0) + ' шт.'],
            ['Худи/Свитшоты:', (capsule.categories?.hoodies || 0) + ' шт.'],
            ['Брюки/Джоггеры:', (capsule.categories?.pants || 0) + ' шт.'],
            ['Футболки:', (capsule.categories?.tshirts || 0) + ' шт.'],
            ['Аксессуары:', (capsule.categories?.accessories || 0) + ' шт.'],
            ['Обувь:', (capsule.categories?.shoes || 0) + ' шт.'],
            [],
            ['ДОКУМЕНТ'],
            ['Дата формирования:', new Date().toLocaleDateString('ru-RU')],
            ['Версия:', '1.0'],
            ['Статус:', getStatusLabel(capsule.status)],
            [],
            ['ТРЕБОВАНИЯ К МАТЕРИАЛАМ'],
            ['• Смесовые ткани (ПЭ+хлопок, акрил+шерсть)'],
            ['• Эко-кожа вместо натуральной'],
            ['• Машинная стирка обязательна'],
            ['• Устойчивость к истиранию']
        ];
        
        const wsTitle = XLSX.utils.aoa_to_sheet(titleData);
        wsTitle['!cols'] = [{ wch: 25 }, { wch: 45 }];
        XLSX.utils.book_append_sheet(wb, wsTitle, '1. Титул');
        
        // ===== 2. СПЕЦИФИКАЦИЯ ЦВЕТОВ =====
        const colorSpec = [
            ['СПЕЦИФИКАЦИЯ ЦВЕТОВ КОЛЛЕКЦИИ'],
            [],
            ['Палитра:', palette ? palette.name : 'Не указана'],
            ['Сезон:', palette ? palette.season : capsule.season],
            [],
            ['№', 'Pantone TCX', 'Название цвета', 'HEX', 'Роль', 'Доля %', 'Применение']
        ];
        
        if (palette && palette.colors) {
            palette.colors.forEach((c, idx) => {
                const role = c.role === 'base' ? 'Базовый' : c.role === 'accent' ? 'Акцент' : 'Нейтральный';
                const usage = c.role === 'base' 
                    ? 'Основной цвет изделий, крупные детали' 
                    : c.role === 'accent' 
                        ? 'Детали, принты, молнии, шнурки' 
                        : 'Подкладка, окантовка, этикетки';
                colorSpec.push([idx + 1, c.code, c.name, c.hex, role, c.percent + '%', usage]);
            });
        } else {
            colorSpec.push(['', 'Палитра не привязана', '', '', '', '', '']);
        }
        
        colorSpec.push([]);
        colorSpec.push(['ВАЖНО: Все цвета должны соответствовать кодам Pantone TCX']);
        colorSpec.push(['Допустимое отклонение: ΔE ≤ 2.0']);
        
        const wsColors = XLSX.utils.aoa_to_sheet(colorSpec);
        wsColors['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 18 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 35 }];
        XLSX.utils.book_append_sheet(wb, wsColors, '2. Цвета');
        
        // ===== 3-8. СПЕЦИФИКАЦИЯ ПО КАТЕГОРИЯМ =====
        const categories = [
            { key: 'jackets', label: 'Куртки', sheetNum: 3 },
            { key: 'hoodies', label: 'Худи', sheetNum: 4 },
            { key: 'pants', label: 'Брюки', sheetNum: 5 },
            { key: 'tshirts', label: 'Футболки', sheetNum: 6 },
            { key: 'accessories', label: 'Аксессуары', sheetNum: 7 },
            { key: 'shoes', label: 'Обувь', sheetNum: 8 }
        ];
        
        categories.forEach(cat => {
            const catItems = items.filter(i => i.category === cat.key);
            if (catItems.length === 0) return;
            
            const catData = [
                [`СПЕЦИФИКАЦИЯ: ${cat.label.toUpperCase()}`],
                [`Количество SKU: ${catItems.length}`],
                [],
                ['№', 'SKU', 'Название модели', 'Основной цвет', 'Pantone TCX', 'Акцентный цвет', 'Pantone TCX', 'Состав ткани', 'Размерный ряд', 'Целевая РРЦ']
            ];
            
            catItems.forEach((item, idx) => {
                catData.push([
                    idx + 1,
                    item.sku,
                    item.name,
                    item.baseColor?.name || '—',
                    item.baseColor?.code || '—',
                    item.accentColor?.name || '—',
                    item.accentColor?.code || '—',
                    item.materials || '—',
                    item.sizes || '—',
                    item.priceTarget ? item.priceTarget.toLocaleString() + '₽' : '—'
                ]);
            });
            
            catData.push([]);
            catData.push(['', '', '', '', '', '', '', '', 'ИТОГО:', catItems.length + ' SKU']);
            
            // Добавляем требования к категории
            catData.push([]);
            catData.push(['ТРЕБОВАНИЯ К КАТЕГОРИИ:']);
            
            if (cat.key === 'jackets') {
                catData.push(['• Водоотталкивающая пропитка обязательна']);
                catData.push(['• Утеплитель: синтепон 150-200 г/м²']);
                catData.push(['• Молнии: YKK или аналог']);
                catData.push(['• Светоотражающие элементы по запросу']);
            } else if (cat.key === 'hoodies') {
                catData.push(['• Футер 3-нитка с начёсом']);
                catData.push(['• Карман-кенгуру']);
                catData.push(['• Капюшон на подкладке']);
                catData.push(['• Рибана на манжетах и поясе']);
            } else if (cat.key === 'pants') {
                catData.push(['• Эластичный пояс с кулиской']);
                catData.push(['• Усиленные колени (опционально)']);
                catData.push(['• Карманы на молнии']);
            } else if (cat.key === 'tshirts') {
                catData.push(['• Кулирка 180-200 г/м²']);
                catData.push(['• Усиленный ворот']);
                catData.push(['• Принт: DTF или шелкография']);
            }
            
            const wsCat = XLSX.utils.aoa_to_sheet(catData);
            wsCat['!cols'] = [
                { wch: 4 }, { wch: 16 }, { wch: 25 }, { wch: 15 }, { wch: 14 },
                { wch: 15 }, { wch: 14 }, { wch: 22 }, { wch: 12 }, { wch: 12 }
            ];
            XLSX.utils.book_append_sheet(wb, wsCat, `${cat.sheetNum}. ${cat.label}`);
        });
        
        // ===== СВОДНАЯ ТАБЛИЦА ЗАКАЗА =====
        const summaryData = [
            ['СВОДНАЯ ТАБЛИЦА ЗАКАЗА'],
            ['Коллекция: ' + capsule.name],
            ['Сезон: ' + capsule.season],
            [],
            ['Категория', 'Кол-во SKU', 'Мин. РРЦ', 'Макс. РРЦ', 'Средняя РРЦ', 'Примечание']
        ];
        
        let totalSku = 0;
        categories.forEach(cat => {
            const catItems = items.filter(i => i.category === cat.key);
            if (catItems.length === 0) return;
            
            totalSku += catItems.length;
            const prices = catItems.map(i => i.priceTarget || 0).filter(p => p > 0);
            const minPrice = prices.length ? Math.min(...prices) : 0;
            const maxPrice = prices.length ? Math.max(...prices) : 0;
            const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
            
            summaryData.push([
                cat.label,
                catItems.length,
                minPrice ? minPrice.toLocaleString() + '₽' : '—',
                maxPrice ? maxPrice.toLocaleString() + '₽' : '—',
                avgPrice ? avgPrice.toLocaleString() + '₽' : '—',
                ''
            ]);
        });
        
        summaryData.push([]);
        summaryData.push(['ИТОГО', totalSku, '', '', '', '']);
        summaryData.push([]);
        summaryData.push(['Дата формирования ТЗ:', new Date().toLocaleDateString('ru-RU')]);
        summaryData.push(['Ответственный:', '___________________']);
        summaryData.push(['Подпись:', '___________________']);
        
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        wsSummary['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, '9. Сводка');
        
        // Генерация файла
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        const filename = `ТЗ_${capsule.name}_${capsule.season}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        downloadBlob(filename, blob);
        
        showToast('ТЗ на производство готово', 'success');
        closeItemModal();
        
    } catch (err) {
        console.error('Tech doc export error:', err);
        showToast('Ошибка генерации ТЗ: ' + err.message, 'error');
    }
}
        
// =============================================
// CSV EXPORT (legacy)
// =============================================
function exportAsCSV(capsuleId) {
    const capsule = getCapsuleById(capsuleId);
    const items = getItemsForCapsule(capsuleId);
    
    let csv = 'SKU,Название,Категория,Статус,Базовый цвет,Pantone,Акцентный цвет,Pantone,Материал,Размеры,Цена\n';
    
    items.forEach(item => {
        csv += `${item.sku},"${item.name}",${categoryLabels[item.category] || item.category},${getStatusLabel(item.status)},`;
        csv += `${item.baseColor?.name || ''},${item.baseColor?.code || ''},`;
        csv += `${item.accentColor?.name || ''},${item.accentColor?.code || ''},`;
        csv += `"${item.materials || ''}",${item.sizes || ''},${item.priceTarget || ''}\n`;
    });
    
    downloadFile(`${capsule.name}_артикулы.csv`, csv, 'text/csv;charset=utf-8');
    showToast('CSV скачан', 'success');
    closeItemModal();
}

// =============================================
// JSON EXPORT
// =============================================
function exportAsJSON(capsuleId) {
    const capsule = getCapsuleById(capsuleId);
    const items = getItemsForCapsule(capsuleId);
    const palettes = typeof loadPalettes === 'function' ? loadPalettes() : [];
    const palette = capsule.paletteId ? palettes.find(p => p.id === capsule.paletteId) : null;
    
    const data = { 
        exportedAt: new Date().toISOString(), 
        version: '2.1',
        capsule, 
        items, 
        palette 
    };
    downloadFile(`${capsule.name}_backup.json`, JSON.stringify(data, null, 2), 'application/json');
    showToast('JSON скачан', 'success');
    closeItemModal();
}

// =============================================
// PROMPTS EXPORT
// =============================================
function exportPrompts(capsuleId) {
    const capsule = getCapsuleById(capsuleId);
    const items = getItemsForCapsule(capsuleId);
    const itemsWithPrompts = items.filter(i => i.prompt);
    
    let txt = `ПРОМПТЫ ДЛЯ КАПСУЛЫ: ${capsule.name}\n`;
    txt += `Сезон: ${capsule.season}\n`;
    txt += `Экспортировано: ${new Date().toLocaleString('ru-RU')}\n`;
    txt += `${'='.repeat(60)}\n\n`;
    
    if (itemsWithPrompts.length === 0) {
        txt += 'Нет артикулов с готовыми промптами.\n';
    } else {
        itemsWithPrompts.forEach((item, idx) => {
            txt += `[${idx + 1}] ${item.sku} - ${item.name}\n`;
            txt += `-`.repeat(40) + '\n';
            txt += item.prompt + '\n\n';
        });
    }
    
    txt += `${'='.repeat(60)}\n`;
    txt += `Всего промптов: ${itemsWithPrompts.length} / ${items.length}\n`;
    
    downloadFile(`${capsule.name}_промпты.txt`, txt, 'text/plain;charset=utf-8');
    showToast(`${itemsWithPrompts.length} промптов экспортировано`, 'success');
    closeItemModal();
}

// =============================================
// FULL BACKUP / RESTORE
// =============================================
async function exportFullBackup() {
    showToast('Создание полного бэкапа...', 'success');
    
    try {
        const XLSX = await loadXLSX();
        const wb = XLSX.utils.book_new();
        
        // Все капсулы
        const capsules = loadCapsules();
        const capsulesData = [['ID', 'Название', 'Сезон', 'Статус', 'SKU', 'Дата создания']];
        capsules.forEach(c => {
            capsulesData.push([c.id, c.name, c.season, getStatusLabel(c.status), c.totalItems, c.createdAt]);
        });
        const wsCapsules = XLSX.utils.aoa_to_sheet(capsulesData);
        XLSX.utils.book_append_sheet(wb, wsCapsules, 'Капсулы');
        
        // Все артикулы
        const allItems = JSON.parse(localStorage.getItem('kari-items') || '{}');
        const itemsFlat = [];
        Object.values(allItems).forEach(arr => itemsFlat.push(...arr));
        
        if (itemsFlat.length > 0) {
            const itemsData = [['SKU', 'Капсула', 'Название', 'Категория', 'Статус', 'Базовый', 'Акцент', 'Цена']];
            itemsFlat.forEach(i => {
                itemsData.push([
                    i.sku, i.capsuleId, i.name, categoryLabels[i.category] || i.category,
                    getStatusLabel(i.status), i.baseColor?.code || '', i.accentColor?.code || '', i.priceTarget || ''
                ]);
            });
            const wsItems = XLSX.utils.aoa_to_sheet(itemsData);
            XLSX.utils.book_append_sheet(wb, wsItems, 'Все артикулы');
        }
        
        // Палитры
        const palettes = typeof loadPalettes === 'function' ? loadPalettes() : [];
        if (palettes.length > 0) {
            const palData = [['ID', 'Название', 'Сезон', 'Цвета (Pantone)']];
            palettes.forEach(p => {
                palData.push([p.id, p.name, p.season, p.colors.map(c => c.code).join(', ')]);
            });
            const wsPal = XLSX.utils.aoa_to_sheet(palData);
            XLSX.utils.book_append_sheet(wb, wsPal, 'Палитры');
        }
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        const filename = `KARI_Hub_backup_${new Date().toISOString().slice(0, 10)}.xlsx`;
        downloadBlob(filename, blob);
        
        // Также сохраняем JSON для полного восстановления
        const jsonData = {
            exportedAt: new Date().toISOString(),
            version: '2.1',
            capsules: loadCapsules(),
            items: JSON.parse(localStorage.getItem('kari-items') || '{}'),
            prompts: typeof loadPrompts === 'function' ? loadPrompts() : [],
            palettes: typeof loadPalettes === 'function' ? loadPalettes() : [],
            reports: typeof loadReports === 'function' ? loadReports() : [],
            checklists: typeof loadChecklists === 'function' ? loadChecklists() : [],
            checklistResults: JSON.parse(localStorage.getItem('kari-checklist-results') || '[]')
        };
        downloadFile(`KARI_Hub_backup_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(jsonData, null, 2), 'application/json');
        
        showToast('Полный бэкап создан (Excel + JSON)', 'success');
        
    } catch (err) {
        // Fallback на JSON
        const data = {
            exportedAt: new Date().toISOString(),
            version: '2.1',
            capsules: loadCapsules(),
            items: JSON.parse(localStorage.getItem('kari-items') || '{}'),
            prompts: typeof loadPrompts === 'function' ? loadPrompts() : [],
            palettes: typeof loadPalettes === 'function' ? loadPalettes() : [],
            reports: typeof loadReports === 'function' ? loadReports() : [],
            checklists: typeof loadChecklists === 'function' ? loadChecklists() : [],
            checklistResults: JSON.parse(localStorage.getItem('kari-checklist-results') || '[]')
        };
        
        const filename = `KARI_Hub_backup_${new Date().toISOString().slice(0, 10)}.json`;
        downloadFile(filename, JSON.stringify(data, null, 2), 'application/json');
        showToast('Бэкап создан (JSON)', 'success');
    }
}

function importBackup(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.capsules) localStorage.setItem('kari-capsules', JSON.stringify(data.capsules));
            if (data.items) localStorage.setItem('kari-items', JSON.stringify(data.items));
            if (data.prompts) localStorage.setItem('kari-prompts', JSON.stringify(data.prompts));
            if (data.palettes) localStorage.setItem('kari-palettes', JSON.stringify(data.palettes));
            if (data.reports) localStorage.setItem('kari-claude-reports', JSON.stringify(data.reports));
            if (data.checklists) localStorage.setItem('kari-checklists', JSON.stringify(data.checklists));
            if (data.checklistResults) localStorage.setItem('kari-checklist-results', JSON.stringify(data.checklistResults));
            showToast('Бэкап восстановлен. Обновите страницу.', 'success');
            setTimeout(() => location.reload(), 1500);
        } catch (err) {
            showToast('Ошибка чтения файла', 'error');
        }
    };
    reader.readAsText(file);
}

// =============================================
// HELPER: Get items for capsule (if not available globally)
// =============================================
function getItemsForCapsule(capsuleId) {
    if (typeof loadItems === 'function') {
        return loadItems(capsuleId);
    }
    const all = JSON.parse(localStorage.getItem('kari-items') || '{}');
    return all[capsuleId] || [];
}

// =============================================
// EXPORT ITEM TECH DOC (ТЗ на один артикул)
// =============================================
async function exportItemTechDoc(itemId) {
    showToast('Генерация ТЗ артикула...', 'success');
    
    try {
        const XLSX = await loadXLSX();
        
        // Находим артикул и капсулу
        const allItems = JSON.parse(localStorage.getItem('kari-items') || '{}');
        let item = null;
        let capsuleId = null;
        
        for (const [capId, items] of Object.entries(allItems)) {
            const found = items.find(i => i.id === itemId);
            if (found) {
                item = found;
                capsuleId = capId;
                break;
            }
        }
        
        if (!item) {
            showToast('Артикул не найден', 'error');
            return;
        }
        
        const capsule = getCapsuleById(capsuleId);
        const palettes = typeof loadPalettes === 'function' ? loadPalettes() : [];
        const palette = capsule?.paletteId ? palettes.find(p => p.id === capsule.paletteId) : null;
        
        const wb = XLSX.utils.book_new();
        
        // Определяем категорию
        const catNames = {
            jackets: 'Куртка/Бомбер',
            hoodies: 'Худи/Свитшот', 
            pants: 'Брюки/Джоггеры',
            tshirts: 'Футболка',
            accessories: 'Аксессуар',
            shoes: 'Обувь'
        };
        
        // Материалы по умолчанию для категории
        const defaultMaterials = {
            jackets: {
                outer: 'Таслан 100% ПЭ с водоотталкивающей пропиткой',
                lining: 'Подкладка: полиэстер 100%',
                insulation: 'Утеплитель: синтепон 150-200 г/м²',
                hardware: 'Молния: YKK или аналог, пластиковая'
            },
            hoodies: {
                outer: 'Футер 3-нитка с начёсом (80% хлопок, 20% ПЭ)',
                lining: '—',
                insulation: '—',
                hardware: 'Люверсы: металл никель, шнур: х/б'
            },
            pants: {
                outer: 'Футер 2-нитка (65% хлопок, 35% ПЭ)',
                lining: '—',
                insulation: '—',
                hardware: 'Шнур в поясе, рибана на манжетах'
            },
            tshirts: {
                outer: 'Кулирка 180-200 г/м² (95% хлопок, 5% эластан)',
                lining: '—',
                insulation: '—',
                hardware: '—'
            },
            accessories: {
                outer: 'По спецификации изделия',
                lining: '—',
                insulation: '—',
                hardware: 'По спецификации'
            },
            shoes: {
                outer: 'Эко-кожа / текстиль',
                lining: 'Текстиль',
                insulation: '—',
                hardware: 'Шнурки / липучки'
            }
        };
        
        const materials = defaultMaterials[item.category] || defaultMaterials.tshirts;
        
        // Размерная сетка
        const sizeGrids = {
            '104-152': [
                ['Размер', '104', '110', '116', '122', '128', '134', '140', '146', '152'],
                ['Рост (см)', '104', '110', '116', '122', '128', '134', '140', '146', '152'],
                ['Обхват груди', '56', '58', '60', '62', '64', '68', '72', '76', '80'],
                ['Обхват талии', '51', '52', '53', '54', '56', '58', '60', '62', '64'],
                ['Длина рукава', '36', '38', '40', '43', '46', '49', '52', '55', '58']
            ],
            '28-35': [
                ['Размер', '28', '29', '30', '31', '32', '33', '34', '35'],
                ['Длина стельки (см)', '17.5', '18', '18.5', '19', '20', '20.5', '21.5', '22']
            ]
        };
        
        const sizeGrid = sizeGrids[item.sizes] || sizeGrids['104-152'];
        
        // ===== ЛИСТ 1: ОСНОВНАЯ ИНФОРМАЦИЯ =====
        const mainData = [
            ['ТЕХНИЧЕСКОЕ ЗАДАНИЕ НА ПРОИЗВОДСТВО'],
            ['KARI GROUP — Детская одежда'],
            [],
            ['ИДЕНТИФИКАЦИЯ'],
            ['SKU:', item.sku],
            ['Название модели:', item.name],
            ['Категория:', catNames[item.category] || item.category],
            ['Коллекция:', capsule?.name || '—'],
            ['Сезон:', capsule?.season || '—'],
            [],
            ['ЦЕЛЕВАЯ АУДИТОРИЯ'],
            ['Возрастная группа:', capsule?.ageRange ? capsule.ageRange + ' лет' : '—'],
            ['Пол:', getGenderLabel(capsule?.gender)],
            ['Ценовой сегмент:', capsule?.priceSegment === 'premium' ? 'Premium' : 'Standard'],
            [],
            ['ЦЕНООБРАЗОВАНИЕ'],
            ['Целевая РРЦ:', item.priceTarget ? item.priceTarget.toLocaleString() + ' ₽' : '—'],
            ['Мин. маржа:', '45%'],
            ['Целевая себестоимость:', item.priceTarget ? Math.round(item.priceTarget * 0.35).toLocaleString() + ' ₽' : '—'],
            [],
            ['СТАТУС'],
            ['Текущий статус:', getStatusLabel(item.status)],
            ['Дата создания:', new Date(item.createdAt).toLocaleDateString('ru-RU')],
            ['Дата обновления:', new Date(item.updatedAt).toLocaleDateString('ru-RU')],
            [],
            ['ДОКУМЕНТ'],
            ['Дата формирования ТЗ:', new Date().toLocaleDateString('ru-RU')],
            ['Версия:', '1.0']
        ];
        
        const wsMain = XLSX.utils.aoa_to_sheet(mainData);
        wsMain['!cols'] = [{ wch: 25 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(wb, wsMain, '1. Основное');
        
        // ===== ЛИСТ 2: ЦВЕТОВАЯ СПЕЦИФИКАЦИЯ =====
        const colorData = [
            ['ЦВЕТОВАЯ СПЕЦИФИКАЦИЯ'],
            [],
            ['ОСНОВНОЙ ЦВЕТ'],
            ['Название:', item.baseColor?.name || '—'],
            ['Pantone TCX:', item.baseColor?.code || '—'],
            ['HEX:', item.baseColor?.hex || '—'],
            ['Применение:', 'Основная ткань изделия, крупные детали'],
            [],
            ['АКЦЕНТНЫЙ ЦВЕТ'],
            ['Название:', item.accentColor?.name || '—'],
            ['Pantone TCX:', item.accentColor?.code || '—'],
            ['HEX:', item.accentColor?.hex || '—'],
            ['Применение:', 'Детали, принты, молнии, шнурки, этикетки'],
            [],
            ['ТРЕБОВАНИЯ К ЦВЕТУ'],
            ['Допустимое отклонение:', 'ΔE ≤ 2.0'],
            ['Метод проверки:', 'Спектрофотометр'],
            ['Эталон:', 'Pantone TCX каталог текущего года'],
            [],
            ['ПАЛИТРА КОЛЛЕКЦИИ:', palette?.name || '—']
        ];
        
        if (palette && palette.colors) {
            colorData.push([]);
            colorData.push(['Код Pantone', 'Название', 'HEX', 'Роль', 'Доля']);
            palette.colors.forEach(c => {
                colorData.push([c.code, c.name, c.hex, c.role === 'base' ? 'Базовый' : 'Акцент', c.percent + '%']);
            });
        }
        
        const wsColor = XLSX.utils.aoa_to_sheet(colorData);
        wsColor['!cols'] = [{ wch: 20 }, { wch: 35 }];
        XLSX.utils.book_append_sheet(wb, wsColor, '2. Цвета');
        
        // ===== ЛИСТ 3: МАТЕРИАЛЫ =====
        const materialsData = [
            ['СПЕЦИФИКАЦИЯ МАТЕРИАЛОВ'],
            [],
            ['СОСТАВ ИЗДЕЛИЯ'],
            ['Указанный состав:', item.materials || '—'],
            [],
            ['РЕКОМЕНДУЕМЫЕ МАТЕРИАЛЫ'],
            ['Основная ткань:', materials.outer],
            ['Подкладка:', materials.lining],
            ['Утеплитель:', materials.insulation],
            ['Фурнитура:', materials.hardware],
            [],
            ['ТРЕБОВАНИЯ К МАТЕРИАЛАМ'],
            ['• Машинная стирка при 30-40°C'],
            ['• Устойчивость окраски к стирке: мин. 4 балла'],
            ['• Устойчивость к истиранию: мин. 20 000 циклов'],
            ['• Пиллингуемость: мин. 4 балла'],
            [],
            ['СЕРТИФИКАЦИЯ'],
            ['• ГОСТ Р ИСО 9001'],
            ['• Сертификат соответствия ТР ТС'],
            ['• Отсутствие вредных веществ (OEKO-TEX желательно)']
        ];
        
        const wsMaterials = XLSX.utils.aoa_to_sheet(materialsData);
        wsMaterials['!cols'] = [{ wch: 25 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(wb, wsMaterials, '3. Материалы');
        
        // ===== ЛИСТ 4: РАЗМЕРНАЯ СЕТКА =====
        const sizeData = [
            ['РАЗМЕРНАЯ СЕТКА'],
            [],
            ['Размерный ряд:', item.sizes || '—'],
            []
        ];
        
        sizeGrid.forEach(row => sizeData.push(row));
        
        sizeData.push([]);
        sizeData.push(['ДОПУСКИ']);
        sizeData.push(['Линейные размеры:', '±1 см']);
        sizeData.push(['Длина изделия:', '±1.5 см']);
        sizeData.push(['Симметричность:', '±0.5 см']);
        
        const wsSize = XLSX.utils.aoa_to_sheet(sizeData);
        wsSize['!cols'] = [{ wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, wsSize, '4. Размеры');
        
        // ===== ЛИСТ 5: КОНСТРУКЦИЯ =====
        const constructionData = [
            ['КОНСТРУКТИВНЫЕ ТРЕБОВАНИЯ'],
            [],
            ['КАТЕГОРИЯ:', catNames[item.category] || item.category],
            []
        ];
        
        if (item.category === 'jackets') {
            constructionData.push(['ЭЛЕМЕНТЫ КОНСТРУКЦИИ']);
            constructionData.push(['Застёжка:', 'Центральная молния YKK']);
            constructionData.push(['Капюшон:', 'Несъёмный, с регулировкой']);
            constructionData.push(['Карманы:', '2 боковых на молнии']);
            constructionData.push(['Манжеты:', 'Рибана или резинка']);
            constructionData.push(['Низ изделия:', 'Кулиска с фиксаторами']);
            constructionData.push([]);
            constructionData.push(['ДОПОЛНИТЕЛЬНО']);
            constructionData.push(['• Светоотражающие элементы (опционально)']);
            constructionData.push(['• Внутренний карман для телефона']);
            constructionData.push(['• Защита подбородка от молнии']);
        } else if (item.category === 'hoodies') {
            constructionData.push(['ЭЛЕМЕНТЫ КОНСТРУКЦИИ']);
            constructionData.push(['Капюшон:', 'Двойной, с кулиской']);
            constructionData.push(['Карман:', 'Карман-кенгуру']);
            constructionData.push(['Манжеты:', 'Рибана 2x2']);
            constructionData.push(['Низ изделия:', 'Рибана 2x2']);
            constructionData.push([]);
            constructionData.push(['ДОПОЛНИТЕЛЬНО']);
            constructionData.push(['• Люверсы металлические']);
            constructionData.push(['• Шнур х/б с наконечниками']);
        } else if (item.category === 'pants') {
            constructionData.push(['ЭЛЕМЕНТЫ КОНСТРУКЦИИ']);
            constructionData.push(['Пояс:', 'Эластичный с кулиской']);
            constructionData.push(['Карманы:', '2 боковых + 1 задний']);
            constructionData.push(['Низ брючин:', 'Рибана или резинка']);
            constructionData.push([]);
            constructionData.push(['ДОПОЛНИТЕЛЬНО']);
            constructionData.push(['• Шнур в поясе']);
            constructionData.push(['• Усиленные колени (опционально)']);
        } else if (item.category === 'tshirts') {
            constructionData.push(['ЭЛЕМЕНТЫ КОНСТРУКЦИИ']);
            constructionData.push(['Горловина:', 'Круглая, рибана 1x1']);
            constructionData.push(['Рукав:', 'Короткий, с подгибом']);
            constructionData.push(['Низ изделия:', 'Подгиб 2 см']);
            constructionData.push([]);
            constructionData.push(['ПРИНТ/ДЕКОР']);
            constructionData.push(['Технология:', 'DTF / шелкография']);
            constructionData.push(['Расположение:', 'По эскизу']);
        }
        
        constructionData.push([]);
        constructionData.push(['ШВЫ И СТРОЧКИ']);
        constructionData.push(['Основные швы:', 'Оверлок 4-нитка']);
        constructionData.push(['Отделочные швы:', 'Двойная строчка']);
        constructionData.push(['Плотность строчки:', '4-5 стежков/см']);
        
        const wsConstruction = XLSX.utils.aoa_to_sheet(constructionData);
        wsConstruction['!cols'] = [{ wch: 25 }, { wch: 45 }];
        XLSX.utils.book_append_sheet(wb, wsConstruction, '5. Конструкция');
        
        // ===== ЛИСТ 6: ПРОМПТ ДЛЯ AI =====
        const promptData = [
            ['ПРОМПТ ДЛЯ AI-ГЕНЕРАЦИИ'],
            [],
            ['Текст промпта:'],
            [item.prompt || 'Промпт не создан'],
            [],
            ['ПАРАМЕТРЫ ГЕНЕРАЦИИ'],
            ['Платформа:', 'Midjourney v6'],
            ['Соотношение сторон:', '3:4'],
            ['Стиль:', '--style raw'],
            [],
            ['ТРЕБОВАНИЯ К РЕЗУЛЬТАТУ'],
            ['• Professional child model'],
            ['• Fully clothed'],
            ['• Commercial studio photography'],
            ['• Safe content'],
            ['• Возраст модели: ' + (capsule?.ageRange || '8-12') + ' лет']
        ];
        
        const wsPrompt = XLSX.utils.aoa_to_sheet(promptData);
        wsPrompt['!cols'] = [{ wch: 80 }];
        XLSX.utils.book_append_sheet(wb, wsPrompt, '6. AI-промпт');
        
        // ===== ЛИСТ 7: ПОДПИСИ =====
        const signaturesData = [
            ['ЛИСТ СОГЛАСОВАНИЯ'],
            [],
            ['Артикул:', item.sku],
            ['Название:', item.name],
            [],
            ['СОГЛАСОВАНИЕ'],
            [],
            ['Дизайнер:', '___________________', 'Дата:', '___________'],
            [],
            ['Технолог:', '___________________', 'Дата:', '___________'],
            [],
            ['Менеджер:', '___________________', 'Дата:', '___________'],
            [],
            [],
            ['ПРИМЕЧАНИЯ:'],
            [''],
            [''],
            [''],
            [],
            ['Дата формирования:', new Date().toLocaleDateString('ru-RU')]
        ];
        
        const wsSignatures = XLSX.utils.aoa_to_sheet(signaturesData);
        wsSignatures['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 10 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsSignatures, '7. Согласование');
        
        // Генерация файла
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        const filename = `ТЗ_${item.sku}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        downloadBlob(filename, blob);
        
        showToast('ТЗ артикула готово', 'success');
        
    } catch (err) {
        console.error('Item tech doc export error:', err);
        showToast('Ошибка генерации ТЗ: ' + err.message, 'error');
    }
}

// =============================================
// ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ
// =============================================
window.downloadFile = downloadFile;
window.downloadBlob = downloadBlob;
window.openExportModal = openExportModal;
window.exportAsCSV = exportAsCSV;
window.exportAsJSON = exportAsJSON;
window.exportAsExcel = exportAsExcel;
window.exportAsExcelItems = exportAsExcelItems;
window.exportTechDoc = exportTechDoc;
window.exportPrompts = exportPrompts;
window.exportFullBackup = exportFullBackup;
window.importBackup = importBackup;
window.exportItemTechDoc = exportItemTechDoc;
window.getItemsForCapsule = getItemsForCapsule;

// Алиас для совместимости с app.js
window.renderExport = openExportModal;

console.log('📤 Export module loaded');
