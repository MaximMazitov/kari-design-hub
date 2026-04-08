// =============================================
// KARI Design Hub — Claude API Integration v3.0
// С улучшенной логикой принятия решений
// =============================================

// API proxy — автоопределение: Vercel serverless (/api/proxy) или локальный сервер
const CLAUDE_PROXY_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8082'
    : '/api/proxy';
window.CLAUDE_PROXY_URL = CLAUDE_PROXY_URL;

// API Status tracking
let apiStatus = 'idle';
let lastApiCall = null;
let apiCallCount = 0;

// =============================================
// ОБЯЗАТЕЛЬНЫЕ SAFETY MARKERS (для валидации)
// =============================================
const REQUIRED_SAFETY_MARKERS = [
    'fully clothed',
    'safe content'
];

// =============================================
// ОПРЕДЕЛЕНИЕ ТИПА МОДЕЛИ (ребёнок / взрослый)
// =============================================
function getModelInfo(capsule) {
    // Поддерживаем оба поля: targetGroup (ручное создание) и ageGroup (AI Wizard)
    const target = (capsule?.targetGroup || capsule?.ageGroup || '').toLowerCase();
    const isWomen = target === 'women' || target === 'female';
    const isMen = target === 'men' || target === 'male';

    if (isWomen) {
        return {
            type: 'adult',
            modelPhrase: 'Professional adult female fashion model, 25-year-old woman',
            gender: 'woman',
            age: 25,
            styleRef: 'Zara Woman aesthetic, contemporary womenswear catalog'
        };
    }
    if (isMen) {
        return {
            type: 'adult',
            modelPhrase: 'Professional adult male fashion model, 27-year-old man',
            gender: 'man',
            age: 27,
            styleRef: 'Zara Man aesthetic, contemporary menswear catalog'
        };
    }

    // По умолчанию — ребёнок
    const age = getModelAge(capsule);
    const g = capsule?.gender;
    const childGender = (g === 'boys' || g === 'male') ? 'boy'
                      : (g === 'girls' || g === 'female') ? 'girl'
                      : 'child';
    return {
        type: 'child',
        modelPhrase: `Professional child model, ${age}-year-old ${childGender}`,
        gender: childGender,
        age: age,
        styleRef: 'Zara Kids aesthetic, H&M Kids'
    };
}

// =============================================
// КОМПАКТНАЯ БАЗА ЗНАНИЙ KARI (оптимизированная)
// =============================================
const KARI_CONTEXT = `KARI GROUP — масс-маркет детская одежда (890-9990₽).
Приоритеты: 1) Себестоимость 2) Практичность 3) Внешний вид.
Материалы: смесовые ткани (ПЭ+хлопок), эко-кожа, пластиковая фурнитура.
Визуал: светлый студийный фон, полный рост, естественные позы, 3:4 формат.
Стиль референс: Zara Kids aesthetic, H&M Kids.`;

// =============================================
// FEW-SHOT ПРИМЕРЫ ПО КАТЕГОРИЯМ (эталонные промпты)
// =============================================
const PROMPT_EXAMPLES = {
    jackets: `Professional child model, 10-year-old boy, fully clothed, commercial studio photography, safe content. Standing confidently with hands in pockets, slight smile, natural relaxed pose. Wearing oversized boxy bomber jacket in matte polyester twill shell (19-4005 TCX Jet Black), full-zip closure with branded rubber pull tab, ribbed stand collar, two side welt pockets with snap closure, one sleeve zip pocket. Lime green (13-0550 TCX Lime Punch) accent on zip tape, ribbed collar stripe, and embroidered sleeve patch. Ribbed elastic cuffs and hem in black, clean topstitching on yoke seam, lightweight quilted lining visible at cuff. Clean light gray studio backdrop, soft diffused professional lighting, high-end children's fashion catalog style. Full body shot, 4K resolution, Zara Kids aesthetic. --ar 3:4 --v 6 --style raw`,

    hoodies: `Professional child model, 9-year-old girl, fully clothed, commercial studio photography, safe content. Playful stance with one hand on hip, genuine happy expression. Wearing oversized drop-shoulder pullover hoodie in brushed cotton-blend fleece (17-4402 TCX Neutral Gray), peach-touch inside finish, lined hood with flat woven drawcord, front kangaroo pocket with hidden zip opening, ribbed cuffs and banded hem. Coral pink (16-1546 TCX Living Coral) accent on drawcord tips, pocket trim piping, and small embroidered heart logo on chest. Relaxed hip length, tonal topstitching on shoulder seams. Clean white studio backdrop, bright even lighting, editorial quality. Full body shot, 4K resolution, modern streetwear kids style. --ar 3:4 --v 6 --style raw`,

    pants: `Professional child model, 11-year-old boy, fully clothed, commercial studio photography, safe content. Casual standing pose, hands relaxed at sides, friendly expression. Wearing slim tapered jogger pants in brushed stretch cotton twill (19-4026 TCX Dress Blues), elastic waistband with flat woven drawstring, two deep side pockets, one back welt pocket with snap closure, ribbed ankle cuffs. Orange (16-1462 TCX Vermillion Orange) accent on side seam stripe, drawstring tips, and small woven label at back waistband. Contrast topstitching on outseam, reinforced knees. Clean light gray studio backdrop, professional studio lighting. Full body shot, 4K resolution, sporty casual aesthetic. --ar 3:4 --v 6 --style raw`,

    tshirts: `Professional child model, 8-year-old girl, fully clothed, commercial studio photography, safe content. Natural pose with arms relaxed, warm genuine smile. Wearing regular-fit crew neck t-shirt in soft combed cotton-blend jersey (11-0601 TCX Bright White), ribbed round neckline with taped seam inside, short set-in sleeves with clean hem, straight bottom hem with small side vents. Dusty pink (14-1318 TCX Powder Pink) screen-printed floral graphic on center chest, small woven brand label at lower left hem. Smooth matte fabric finish, gentle drape. Clean white studio backdrop, soft natural lighting, minimalist catalog style. Full body shot, 4K resolution, clean Scandinavian kids aesthetic. --ar 3:4 --v 6 --style raw`,

    accessories: `Professional child model, 10-year-old boy, fully clothed, commercial studio photography, safe content. Standing straight, looking at camera with confident expression. Wearing casual outfit with focus on structured six-panel baseball cap in cotton twill (19-4005 TCX Jet Black), pre-curved brim with contrast stitching, adjustable plastic snap-back closure, ventilation eyelets on crown panels. Electric blue (18-4252 TCX Princess Blue) embroidered logo on front panel, matching woven flag label on side. Also wearing matching polyester backpack with padded straps, main compartment zip, front zip pocket. Clean light gray studio backdrop, even professional lighting. Full body shot showing accessories clearly, 4K resolution. --ar 3:4 --v 6 --style raw`,

    shoes: `Professional child model, 9-year-old girl, fully clothed, commercial studio photography, safe content. Dynamic pose showing shoes clearly, one foot slightly forward, cheerful expression. Wearing low-top sneakers in smooth synthetic leather upper (11-0601 TCX Bright White), chunky EVA platform sole, double hook-and-loop strap closure, padded collar and tongue, breathable mesh side panels. Mint green (13-5714 TCX Cabbage) accent on sole edge, heel tab pull loop, and strap logo detail. Perforated toe box, rubber toe cap, cushioned insole. Clean white studio backdrop, lighting emphasizing shoe details. Full body shot with clear shoe visibility, 4K resolution, sporty kids style. --ar 3:4 --v 6 --style raw`
};

// FEW-SHOT для ВЗРОСЛЫХ моделей (женщины/мужчины)
const ADULT_PROMPT_EXAMPLES = {
    jackets: `Professional adult male fashion model, 27-year-old man, fully clothed, commercial studio photography, safe content. Standing confidently, hands in pockets, neutral confident expression. Wearing oversized boxy bomber jacket in matte polyester twill shell (19-4005 TCX Jet Black), full-zip closure with branded metal pull, ribbed stand collar, two side welt pockets with snap closure, one sleeve zip pocket. Olive green (18-0316 TCX Olive Branch) accent on zip tape and embroidered sleeve patch. Ribbed cuffs and hem, clean topstitching, lightweight quilted lining visible at cuff. Clean light gray studio backdrop, soft diffused professional lighting, high-end menswear catalog style. Full body shot, 4K resolution, Zara Man aesthetic. --ar 3:4 --v 6 --style raw`,
    hoodies: `Professional adult female fashion model, 25-year-old woman, fully clothed, commercial studio photography, safe content. Relaxed pose, hand in pocket, calm confident expression. Wearing oversized drop-shoulder pullover hoodie in brushed cotton-blend fleece (17-4402 TCX Neutral Gray), peach-touch inside finish, lined hood with flat woven drawcord, front kangaroo pocket, ribbed cuffs and banded hem. Coral pink (16-1546 TCX Living Coral) accent on drawcord tips and small embroidered logo on chest. Tonal topstitching on shoulder seams, longline hip cut. Clean white studio backdrop, bright editorial lighting. Full body shot, 4K resolution, contemporary womenswear catalog. --ar 3:4 --v 6 --style raw`,
    pants: `Professional adult male fashion model, 27-year-old man, fully clothed, commercial studio photography, safe content. Casual standing pose, hands relaxed at sides. Wearing slim tapered jogger pants in brushed stretch cotton twill (19-4026 TCX Dress Blues), elastic waistband with flat woven drawstring, two deep side pockets, one back welt pocket with snap closure, ribbed ankle cuffs. Vermillion orange (16-1462 TCX) accent on side seam stripe and woven label at back waistband. Contrast topstitching on outseam. Clean light gray studio backdrop, professional studio lighting. Full body shot, 4K resolution, Zara Man aesthetic. --ar 3:4 --v 6 --style raw`,
    tshirts: `Professional adult female fashion model, 25-year-old woman, fully clothed, commercial studio photography, safe content. Natural pose, arms relaxed, soft confident expression. Wearing regular-fit crew neck t-shirt in soft combed cotton-blend jersey (11-0601 TCX Bright White), ribbed round neckline with taped seam inside, short set-in sleeves, straight bottom hem with side vents. Powder pink (14-1318 TCX) screen-printed graphic on center chest, small woven brand label at lower hem. Smooth matte fabric finish, gentle drape. Clean white studio backdrop, soft natural lighting, minimalist editorial style. Full body shot, 4K resolution. --ar 3:4 --v 6 --style raw`,
    accessories: `Professional adult male fashion model, 27-year-old man, fully clothed, commercial studio photography, safe content. Standing straight, looking at camera, confident expression. Wearing structured six-panel baseball cap in cotton twill (19-4005 TCX Jet Black), pre-curved brim with contrast stitching, adjustable metal snap-back closure, ventilation eyelets. Princess blue (18-4252 TCX) embroidered logo on front panel. Also wearing matching polyester backpack with padded straps, main compartment zip, front zip pocket. Clean light gray studio backdrop, even professional lighting. Full body shot, 4K resolution, contemporary menswear catalog. --ar 3:4 --v 6 --style raw`,
    shoes: `Professional adult female fashion model, 25-year-old woman, fully clothed, commercial studio photography, safe content. Dynamic pose showing shoes clearly, one foot slightly forward. Wearing low-top sneakers in smooth synthetic leather upper (11-0601 TCX Bright White), chunky EVA platform sole, lace-up closure, padded collar and tongue, breathable mesh side panels. Cabbage green (13-5714 TCX) accent on sole edge and heel tab pull loop. Perforated toe box, rubber toe cap, cushioned insole. Clean white studio backdrop, lighting emphasizing shoe details. Full body shot with clear shoe visibility, 4K resolution, contemporary womenswear catalog. --ar 3:4 --v 6 --style raw`
};

// =============================================
// ИНДИКАТОР СТАТУСА API
// =============================================
function updateApiStatus(status, message = '') {
    apiStatus = status;
    
    const indicator = document.getElementById('apiStatusIndicator');
    if (!indicator) return;
    
    const statusConfig = {
        idle: { icon: '⚪', text: 'Готов', class: 'idle' },
        loading: { icon: '🔄', text: 'Запрос...', class: 'loading' },
        success: { icon: '🟢', text: 'Успешно', class: 'success' },
        error: { icon: '🔴', text: 'Ошибка', class: 'error' }
    };
    
    const config = statusConfig[status] || statusConfig.idle;
    indicator.innerHTML = `
        <span class="api-status-icon ${config.class}">${config.icon}</span>
        <span class="api-status-text">${config.text}${message ? ': ' + message : ''}</span>
    `;
    indicator.className = `api-status-indicator ${config.class}`;
    
    if (status === 'success' || status === 'error') {
        setTimeout(() => {
            if (apiStatus === status) updateApiStatus('idle');
        }, 5000);
    }
}

// =============================================
// БАЗОВЫЙ ЗАПРОС К CLAUDE API (через прокси)
// =============================================
async function callClaudeAPI(systemPrompt, userMessage, maxTokens = 1024) {
    updateApiStatus('loading');
    apiCallCount++;
    lastApiCall = new Date();
    
    console.log(`[Claude API] Запрос #${apiCallCount}`, { maxTokens });
    
    try {
        const response = await fetch(CLAUDE_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // API ключ хранится на сервере proxy
                model: 'claude-sonnet-4-20250514',
                max_tokens: maxTokens,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: userMessage }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message || 'Claude API error');
        }
        
        updateApiStatus('success');
        console.log('[Claude API] Успешный ответ');
        
        return {
            success: true,
            content: data.content[0].text
        };

    } catch (error) {
        console.error('[Claude API] Ошибка:', error);
        updateApiStatus('error', error.message);
        
        return {
            success: false,
            error: error.message
        };
    }
}

// =============================================
// ВАЛИДАЦИЯ ПРОМПТА (проверка safety markers)
// =============================================
function validatePrompt(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    const missing = [];
    
    for (const marker of REQUIRED_SAFETY_MARKERS) {
        if (!lowerPrompt.includes(marker.toLowerCase())) {
            missing.push(marker);
        }
    }
    
    // Проверяем наличие возраста
    const hasAge = /\d{1,2}-year-old/.test(lowerPrompt);
    if (!hasAge) {
        missing.push('age specification (X-year-old)');
    }
    
    // Проверяем Pantone код
    const hasPantone = /\d{2}-\d{4}\s*tcx/i.test(prompt);
    if (!hasPantone) {
        missing.push('Pantone TCX color code');
    }
    
    // Проверяем параметры Midjourney
    const hasMJParams = prompt.includes('--ar') && prompt.includes('--v');
    if (!hasMJParams) {
        missing.push('Midjourney parameters (--ar, --v)');
    }
    
    return {
        isValid: missing.length === 0,
        missing: missing,
        score: Math.max(0, 100 - (missing.length * 20))
    };
}

// =============================================
// ИСПРАВЛЕНИЕ ПРОМПТА (добавление missing markers)
// =============================================
function fixPrompt(prompt, item, capsule) {
    let fixed = prompt;
    const info = getModelInfo(capsule);
    const modelRegex = info.type === 'adult'
        ? /professional adult (?:female|male) fashion model[^,]*,\s*\d{1,2}-year-old (?:woman|man),?\s*/i
        : /professional child model[^,]*,?\s*(?:\d{1,2}-year-old (?:boy|girl|child),?\s*)?/i;

    // Если в промпте нет нужного описания модели — подставляем
    if (!modelRegex.test(fixed)) {
        // Удаляем любое старое упоминание модели (детское или взрослое)
        fixed = fixed.replace(/professional (?:child|adult (?:female|male) fashion) model[^.]*?\d{1,2}-year-old (?:boy|girl|child|woman|man),?\s*/i, '');
        fixed = `${info.modelPhrase}, ` + fixed.replace(/^\s*/, '');
    }

    if (!fixed.toLowerCase().includes('fully clothed')) {
        fixed = fixed.replace(new RegExp(`(${info.gender}),?\\s*`, 'i'), `$1, fully clothed, `);
    }

    if (!fixed.toLowerCase().includes('safe content')) {
        fixed = fixed.replace(/fully clothed,?\s*/i, 'fully clothed, safe content, ');
    }

    if (!fixed.toLowerCase().includes('commercial studio photography')) {
        fixed = fixed.replace(/safe content,?\s*/i, 'safe content, commercial studio photography. ');
    }
    
    // Добавляем Midjourney параметры если отсутствуют
    if (!fixed.includes('--ar')) {
        fixed = fixed.trim() + ' --ar 3:4';
    }
    if (!fixed.includes('--v')) {
        fixed = fixed.trim() + ' --v 6';
    }
    if (!fixed.includes('--style')) {
        fixed = fixed.trim() + ' --style raw';
    }
    
    return fixed;
}

// =============================================
// ПОЛУЧЕНИЕ ВОЗРАСТА МОДЕЛИ
// =============================================
function getModelAge(capsule) {
    if (capsule?.ageRange) {
        const ages = capsule.ageRange.match(/\d+/g);
        if (ages && ages.length >= 2) {
            return Math.round((parseInt(ages[0]) + parseInt(ages[1])) / 2).toString();
        }
    }
    return '10';
}

// =============================================
// ГЕНЕРАЦИЯ ПРОМПТА ДЛЯ АРТИКУЛА (улучшенная v3)
// =============================================
async function generatePromptWithClaude(item, capsule, target = 'midjourney') {
    // Получаем палитру — поддерживаем 3 источника:
    // 1) capsule.palette.colors (manual mode — добавлено вручную)
    // 2) capsule.paletteId → библиотека палитр
    // 3) AI Wizard: capsule.palette как массив
    let resolvedColors = [];
    if (Array.isArray(capsule?.palette)) {
        resolvedColors = capsule.palette;
    } else if (capsule?.palette?.mode === 'manual' && Array.isArray(capsule.palette.colors)) {
        resolvedColors = capsule.palette.colors;
    } else if (capsule?.paletteId) {
        const palettes = typeof loadPalettes === 'function' ? loadPalettes() : [];
        const lib = palettes.find(p => p.id === capsule.paletteId);
        if (lib && Array.isArray(lib.colors)) resolvedColors = lib.colors;
    }

    // Определяем параметры модели (ребёнок / взрослый)
    const modelInfo = getModelInfo(capsule);
    const modelAge = modelInfo.age;
    const gender = modelInfo.gender;
    const category = item.category || 'tshirts';

    // Получаем эталонный пример для категории — детский или взрослый
    const examplesSet = modelInfo.type === 'adult' ? ADULT_PROMPT_EXAMPLES : PROMPT_EXAMPLES;
    const examplePrompt = examplesSet[category] || examplesSet.tshirts;

    // Контекст палитры — с процентами распределения
    let paletteContext = '';
    let paletteRules = '';
    if (resolvedColors.length) {
        // Сортируем по убыванию процента — главные цвета первыми
        const sorted = [...resolvedColors].sort((a, b) => (b.percent || 0) - (a.percent || 0));
        paletteContext = sorted.map(c => {
            const pct = c.percent ? ` — ${c.percent}%` : '';
            return `${c.name || ''} (${c.code || ''})${pct}`.trim();
        }).join('; ');

        const dominant = sorted[0];
        const accents = sorted.slice(1, 3);
        paletteRules = `\n\nПАЛИТРА КАПСУЛЫ (с распределением по процентам — обязательно использовать ВСЕ цвета пропорционально):
${sorted.map(c => `  • ${c.code || '?'} — ${c.name || ''} (${c.percent || 0}% площади изделия)`).join('\n')}

⚠️ ПРАВИЛА ИСПОЛЬЗОВАНИЯ ПАЛИТРЫ:
- Доминирующий цвет (${dominant?.code} — ${dominant?.percent || 0}%) = основной материал/корпус изделия
${accents.length ? '- Акцентные цвета (' + accents.map(c => `${c.code} — ${c.percent || 0}%`).join(', ') + ') = детали: вставки, нашивки, манжеты, фурнитура, кант, принт' : ''}
- В описании цвета ОБЯЗАТЕЛЬНО указывай Pantone TCX коды как они даны выше
- Не добавляй цветов, которых нет в палитре
- Соблюдай пропорции: чем больше % — тем больше площади занимает цвет`;
    }

    const categoryNames = {
        jackets: 'куртка/бомбер',
        hoodies: 'худи/свитшот', 
        pants: 'брюки/джоггеры',
        tshirts: 'футболка/лонгслив',
        accessories: 'аксессуар',
        shoes: 'обувь/кроссовки'
    };

    const audienceLabel = modelInfo.type === 'adult'
        ? (modelInfo.gender === 'woman' ? 'женской одежды' : 'мужской одежды')
        : 'детской одежды';

    if (target === 'gpt') {
        const gptSystem = `Ты генератор промптов для ChatGPT/DALL·E. Создаёшь подробные текстовые описания для ${audienceLabel} KARI на английском языке.

КОНТЕКСТ: ${KARI_CONTEXT}

ТИП МОДЕЛИ: ${modelInfo.type === 'adult' ? 'взрослая (' + modelInfo.gender + ', ' + modelInfo.age + ' лет)' : 'детская (' + modelInfo.gender + ', ' + modelInfo.age + ' лет)'}

ПРАВИЛА:
1. Пиши естественным языком, развернутыми предложениями (НЕ через запятую как для Midjourney).
2. НЕ добавляй параметры --ar / --v / --style — они только для Midjourney.
3. Начни описание с указания модели: "${modelInfo.modelPhrase}, fully clothed, photographed in a commercial studio setting, safe content."
4. Опиши изделие подробно: силуэт, посадка, застёжка, карманы, воротник/капюшон, манжеты, фурнитура, принт/декор, материал и финиш ткани (5-7 деталей).
5. Обязательно укажи Pantone TCX коды цветов в формате XX-XXXX TCX и распиши, на каких частях изделия они используются.
6. Опиши позу, освещение (soft studio light), фон (neutral seamless backdrop) естественной прозой.
7. НЕ описывай тело/кожу/внешность — только одежду и общую сцену.
8. Объём: 180-260 слов в виде связного абзаца (1-3 параграфа).
${capsule?.description ? '9. Учитывай концепцию коллекции — она ПРИОРИТЕТНА для стилистики и настроения.' : ''}
${paletteRules}

Верни ТОЛЬКО готовое описание на английском, без преамбулы и пояснений.`;

        const gptUser = `Создай описание для:

АРТИКУЛ: ${item.name} (${item.sku || item.id || ''})
КАТЕГОРИЯ: ${item.categoryLabel || categoryNames[category] || category}
МОДЕЛЬ: ${modelInfo.modelPhrase}
БАЗОВЫЙ ЦВЕТ: ${item.baseColor?.name || item.colors?.[0]?.name || 'серый'} (${item.baseColor?.code || item.colors?.[0]?.code || '17-4402 TCX'})
АКЦЕНТ: ${item.accentColor?.name || item.colors?.[1]?.name || 'оранжевый'} (${item.accentColor?.code || item.colors?.[1]?.code || '16-1462 TCX'})
МАТЕРИАЛ: ${item.materials || 'смесовая ткань'}
${item.features?.length ? 'ДЕТАЛИ ИЗДЕЛИЯ: ' + item.features.join(', ') : ''}
${item.description ? 'ОПИСАНИЕ: ' + item.description : ''}
КОЛЛЕКЦИЯ: ${capsule?.name || 'KARI'} (${capsule?.season || 'AW26'})
${paletteContext ? 'ПАЛИТРА КАПСУЛЫ (с %): ' + paletteContext : ''}${capsule?.description ? `

КОНЦЕПЦИЯ КОЛЛЕКЦИИ:
${capsule.description}` : ''}`;

        const gptResult = await callClaudeAPI(gptSystem, gptUser, 900);
        if (gptResult.success) {
            let p = gptResult.content.trim();
            p = p.replace(/^["'`]|["'`]$/g, '');
            p = p.replace(/```[\s\S]*?```/g, '').trim();
            p = p.replace(/\s*--ar[^\s]*\s*--v[^\s]*(\s*--style\s*\w+)?/gi, '').trim();
            return p;
        } else {
            throw new Error(gptResult.error || 'Ошибка генерации');
        }
    }

    const systemPrompt = `Ты генератор промптов для Midjourney. Создаёшь промпты для ${audienceLabel} KARI.

КОНТЕКСТ: ${KARI_CONTEXT}

ТИП МОДЕЛИ: ${modelInfo.type === 'adult' ? 'ВЗРОСЛАЯ модель (' + modelInfo.gender + ', ' + modelInfo.age + ' лет)' : 'ДЕТСКАЯ модель (' + modelInfo.gender + ', ' + modelInfo.age + ' лет)'}
СТИЛЬ-РЕФЕРЕНС: ${modelInfo.styleRef}

КРИТИЧЕСКИЕ ПРАВИЛА:
1. ВСЕГДА начинай с: "${modelInfo.modelPhrase}, fully clothed, commercial studio photography, safe content"
2. ВСЕГДА указывай Pantone TCX коды цветов в формате XX-XXXX TCX
3. ВСЕГДА заканчивай: --ar 3:4 --v 6 --style raw
4. НИКОГДА не описывай кожу, тело, внешность кроме одежды
5. Поза должна быть естественной, детской, позитивной
6. Если указана КОНЦЕПЦИЯ КОЛЛЕКЦИИ — это ГЛАВНЫЙ ОРИЕНТИР для стилистики, цветовой палитры, декоративных элементов и настроения промпта. Промпт ДОЛЖЕН соответствовать концепции!

ДЕТАЛИЗАЦИЯ ОДЕЖДЫ (обязательно):
7. Описание одежды ОБЯЗАНО содержать 5-7 конкретных деталей из следующих аспектов:
   - Силуэт/посадка: oversize, regular fit, slim, boxy, drop-shoulder, cropped, elongated
   - Застёжка: full zip, half-zip, snap buttons, pullover, toggle, hook-and-loop
   - Карманы: kangaroo, side zip, patch, cargo, welt, hidden
   - Воротник/капюшон: crew neck, hooded with drawstring, V-neck, funnel neck, stand collar, lined hood
   - Манжеты и низ: ribbed cuffs, elastic hem, drawcord hem, raw edge, taped seams, contrast stitching
   - Финиш ткани: matte finish, peach-touch, satin sheen, washed effect, brushed inside, garment-dyed
   - Фурнитура: metal/plastic zip, rubber logo pull, branded snap buttons, cord locks
   - Принт/декор: embroidered patch on chest, heat-transfer logo, reflective piping, all-over print
8. НЕ пиши абстрактно — описывай КОНКРЕТНО каждую деталь изделия. Промпт ~200-250 слов.

ЭТАЛОННЫЙ ПРИМЕР для категории "${item.categoryLabel || categoryNames[category] || category}":
${examplePrompt}
${paletteRules}

Создай промпт ТОЧНО в таком же формате и с такой же детализацией одежды.`;

    const capsuleDesc = capsule?.description || '';

    const userMessage = `Создай промпт для:

АРТИКУЛ: ${item.name} (${item.sku || item.id || ''})
КАТЕГОРИЯ: ${item.categoryLabel || categoryNames[category] || category}
МОДЕЛЬ: ${modelInfo.modelPhrase}
БАЗОВЫЙ ЦВЕТ: ${item.baseColor?.name || item.colors?.[0]?.name || 'серый'} (${item.baseColor?.code || item.colors?.[0]?.code || '17-4402 TCX'})
АКЦЕНТ: ${item.accentColor?.name || item.colors?.[1]?.name || 'оранжевый'} (${item.accentColor?.code || item.colors?.[1]?.code || '16-1462 TCX'})
МАТЕРИАЛ: ${item.materials || 'смесовая ткань'}
${item.features?.length ? 'ДЕТАЛИ ИЗДЕЛИЯ: ' + item.features.join(', ') : ''}
${item.description ? 'ОПИСАНИЕ: ' + item.description : ''}
КОЛЛЕКЦИЯ: ${capsule?.name || 'KARI'} (${capsule?.season || 'AW26'})
${paletteContext ? 'ПАЛИТРА КАПСУЛЫ (с %): ' + paletteContext : ''}${capsuleDesc ? `

КОНЦЕПЦИЯ КОЛЛЕКЦИИ:
${capsuleDesc}

⚠️ ВАЖНО: Промпт ДОЛЖЕН отражать стилистику и эстетику описанной концепции! Используй цвета, элементы декора, фактуры и настроение из описания коллекции. Концепция имеет ПРИОРИТЕТ над базовыми цветами артикула.` : ''}

⚠️ Описание одежды должно содержать МИНИМУМ 5 конкретных деталей: посадка/силуэт, застёжка, карманы, манжеты/низ, финиш ткани, фурнитура, декор.

Верни ТОЛЬКО готовый промпт на английском, без пояснений.`;

    const result = await callClaudeAPI(systemPrompt, userMessage, 700);
    
    if (result.success) {
        let prompt = result.content.trim();
        
        // Очистка
        prompt = prompt.replace(/^["'`]|["'`]$/g, '');
        prompt = prompt.replace(/```[\s\S]*?```/g, '');
        prompt = prompt.replace(/^prompt:\s*/i, '');
        prompt = prompt.trim();
        
        // Валидация
        const validation = validatePrompt(prompt);
        console.log(`[Claude API] Валидация промпта: ${validation.score}%`, validation);
        
        // Автоисправление если нужно
        if (!validation.isValid) {
            console.log('[Claude API] Автоисправление промпта...');
            prompt = fixPrompt(prompt, item, capsule);
            
            const revalidation = validatePrompt(prompt);
            console.log(`[Claude API] После исправления: ${revalidation.score}%`);
        }
        
        return prompt;
    } else {
        throw new Error(result.error || 'Ошибка генерации');
    }
}

// =============================================
// ГЕНЕРАЦИЯ ПРОМПТА (legacy)
// =============================================
async function generateItemPrompt(item, capsule) {
    try {
        const prompt = await generatePromptWithClaude(item, capsule);
        return { success: true, prompt };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =============================================
// МАССОВАЯ ГЕНЕРАЦИЯ ПРОМПТОВ
// =============================================
async function generatePromptsForCapsule(capsuleId) {
    const capsule = getCapsuleById(capsuleId);
    const items = loadItems(capsuleId);
    
    if (!items || items.length === 0) {
        showToast('Нет артикулов для генерации', 'error');
        return;
    }
    
    // Фильтруем артикулы без промптов или со статусом brief
    const itemsToGenerate = items.filter(i => !i.prompt || i.status === 'brief');
    
    if (itemsToGenerate.length === 0) {
        showToast('Все артикулы уже имеют промпты', 'success');
        return;
    }
    
    showConfirmDialog({
        title: 'Массовая генерация промптов',
        message: `Сгенерировать промпты для ${itemsToGenerate.length} артикулов?\nЭто займёт около ${Math.ceil(itemsToGenerate.length * 3 / 60)} минут.`,
        confirmText: 'Запустить',
        onConfirm: () => doBulkGeneratePrompts(itemsToGenerate, capsuleId)
    });
}

async function doBulkGeneratePrompts(itemsToGenerate, capsuleId) {
    // Показываем индикатор загрузки
    if (typeof showLoading === 'function') {
        showLoading(`Генерация промптов: 0/${itemsToGenerate.length}`);
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < itemsToGenerate.length; i++) {
        const item = itemsToGenerate[i];

        // Обновляем текст загрузки
        if (typeof updateLoadingText === 'function') {
            updateLoadingText(`Генерация: ${i + 1}/${itemsToGenerate.length} (${item.sku})`);
        }

        try {
            console.log(`[Batch] Генерация ${i + 1}/${itemsToGenerate.length}: ${item.sku}`);
            
            const prompt = await generatePromptWithClaude(item, capsule);
            
            if (prompt) {
                updateItem(capsuleId, item.id, { 
                    prompt: prompt,
                    status: 'prompt'
                });
                successCount++;
            }
            
            // Задержка между запросами (rate limiting)
            if (i < itemsToGenerate.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
        } catch (error) {
            console.error(`[Batch] Ошибка для ${item.sku}:`, error);
            errorCount++;
        }
    }
    
    // Скрываем индикатор загрузки
    if (typeof hideLoading === 'function') {
        hideLoading();
    }

    // Обновляем UI
    if (typeof refreshItems === 'function') {
        refreshItems();
    }

    showToast(`Готово: ${successCount} успешно, ${errorCount} ошибок`, successCount > 0 ? 'success' : 'error');
}

// =============================================
// АНАЛИЗ КАПСУЛЫ (улучшенный v3)
// =============================================
async function analyzeCapsuleWithClaude(capsule, items) {
    const palettes = typeof loadPalettes === 'function' ? loadPalettes() : [];
    const palette = capsule?.paletteId ? palettes.find(p => p.id === capsule.paletteId) : null;

    // Собираем статистику
    const stats = {
        total: items.length,
        byStatus: {},
        byCategory: {},
        byPrice: { low: 0, mid: 0, high: 0 },
        withPrompts: 0,
        withImages: 0
    };
    
    items.forEach(item => {
        stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
        stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
        
        if (item.priceTarget < 1500) stats.byPrice.low++;
        else if (item.priceTarget < 4000) stats.byPrice.mid++;
        else stats.byPrice.high++;
        
        if (item.prompt) stats.withPrompts++;
        if (item.images?.length > 0) stats.withImages++;
    });

    // Примеры промптов для оценки качества
    const promptSamples = items
        .filter(i => i.prompt)
        .slice(0, 3)
        .map(i => `[${i.sku}]: ${i.prompt.substring(0, 200)}...`);

    const systemPrompt = `Ты коммерческий аналитик детской одежды KARI. Анализируй капсулы и даёшь конкретные рекомендации.

${KARI_CONTEXT}

ФОРМАТ ОТВЕТА — строго по секциям:

## 📊 ОБЩАЯ ОЦЕНКА
[Оценка X/10] — краткий вердикт в 1 предложении

## ✅ СИЛЬНЫЕ СТОРОНЫ
- Пункт 1
- Пункт 2

## ⚠️ ПРОБЛЕМЫ И РИСКИ  
- Проблема 1: описание → решение
- Проблема 2: описание → решение

## 🎯 ПЛАН ДЕЙСТВИЙ (приоритет)
1. [СРОЧНО] Конкретное действие
2. [ВАЖНО] Конкретное действие
3. [УЛУЧШЕНИЕ] Конкретное действие

## 💡 КАЧЕСТВО ПРОМПТОВ
[Если есть примеры — оцени их, если нет — напиши что нужно сгенерировать]

Будь конкретным, давай цифры и действия.`;

    const userMessage = `Проанализируй капсулу:

КАПСУЛА: ${capsule.name}
СЕЗОН: ${capsule.season}
АУДИТОРИЯ: ${capsule.gender}, ${capsule.ageRange} лет
КОНЦЕПЦИЯ: ${capsule.description || 'не указана'}

СТАТИСТИКА:
- Всего SKU: ${stats.total}
- С промптами: ${stats.withPrompts}
- С изображениями: ${stats.withImages}

КАТЕГОРИИ:
${Object.entries(stats.byCategory).map(([cat, n]) => `- ${cat}: ${n}`).join('\n')}

СТАТУСЫ:
${Object.entries(stats.byStatus).map(([s, n]) => `- ${s}: ${n}`).join('\n')}

ЦЕНЫ:
- Низкий (до 1500₽): ${stats.byPrice.low}
- Средний (1500-4000₽): ${stats.byPrice.mid}
- Высокий (4000+₽): ${stats.byPrice.high}

ПАЛИТРА: ${palette ? palette.colors.map(c => c.name).join(', ') : 'не привязана'}

${promptSamples.length > 0 ? `ПРИМЕРЫ ПРОМПТОВ:\n${promptSamples.join('\n\n')}` : 'ПРОМПТЫ: ещё не сгенерированы'}

Дай структурированный анализ.`;

    // Показываем загрузку
    const modal = document.getElementById('itemModal');
    const modalTitle = document.getElementById('itemModalTitle');
    const modalBody = document.getElementById('itemModalBody');
    
    if (modal && modalBody) {
        modal.classList.add('active');
        if (modalTitle) modalTitle.textContent = '🤖 AI-Анализ капсулы';
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 60px;">
                <div style="font-size: 48px; margin-bottom: 16px;" class="spin-animation">🤖</div>
                <h3 style="margin-bottom: 8px;">Анализирую коллекцию...</h3>
                <p style="color: var(--gray-500);">Claude изучает ${items.length} артикулов</p>
                <div class="api-progress-bar" style="margin-top: 20px;">
                    <div class="api-progress-fill"></div>
                </div>
            </div>
            <style>
                .spin-animation { animation: spin 2s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .api-progress-bar { height: 4px; background: var(--gray-200); border-radius: 2px; overflow: hidden; }
                .api-progress-fill { height: 100%; width: 30%; background: var(--kari-orange); animation: progress 2s ease-in-out infinite; }
                @keyframes progress { 0% { width: 10%; } 50% { width: 70%; } 100% { width: 90%; } }
            </style>
        `;
    }

    const result = await callClaudeAPI(systemPrompt, userMessage, 1500);
    
    if (result.success) {
        window.lastAnalysis = result.content;
        
        // Конвертируем markdown в HTML
        let htmlContent = result.content
            .replace(/## (.*)/g, '<h3 style="color: var(--kari-orange); margin-top: 24px; margin-bottom: 12px; font-size: 16px;">$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\[СРОЧНО\]/g, '<span style="background:#FEE2E2;color:#DC2626;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">СРОЧНО</span>')
            .replace(/\[ВАЖНО\]/g, '<span style="background:#FEF3C7;color:#D97706;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">ВАЖНО</span>')
            .replace(/\[УЛУЧШЕНИЕ\]/g, '<span style="background:#DBEAFE;color:#2563EB;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">УЛУЧШЕНИЕ</span>')
            .replace(/^- (.*)/gm, '<li style="margin-left: 20px; margin-bottom: 8px;">$1</li>')
            .replace(/^\d+\. (.*)/gm, '<li style="margin-left: 20px; margin-bottom: 8px; list-style-type: decimal;">$1</li>')
            .replace(/\n\n/g, '</p><p style="margin-bottom: 12px;">')
            .replace(/\n/g, '<br>');
        
        modalBody.innerHTML = `
            <div style="max-height: 70vh; overflow-y: auto; padding: 0 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; position: sticky; top: 0; background: white; padding: 16px 0; border-bottom: 1px solid var(--gray-200); z-index: 10;">
                    <h2 style="margin: 0; font-size: 18px;">📊 ${capsule.name}</h2>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" onclick="copyAnalysis()">📋 Копировать</button>
                        <button class="btn btn-primary" onclick="saveAnalysisReport('${capsule.id}')">💾 Сохранить</button>
                    </div>
                </div>
                <div style="background: var(--gray-50); padding: 20px; border-radius: 12px; line-height: 1.7; font-size: 14px;">
                    <p style="margin-bottom: 12px;">${htmlContent}</p>
                </div>
            </div>
            <button class="btn btn-secondary" onclick="closeItemModal()" style="margin-top: 20px; width: 100%;">Закрыть</button>
        `;
    } else {
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                <p style="color: var(--red); margin-bottom: 16px;">Ошибка анализа</p>
                <p style="color: var(--gray-500); font-size: 14px;">${result.error}</p>
                <button class="btn btn-secondary" onclick="closeItemModal()" style="margin-top: 20px;">Закрыть</button>
            </div>
        `;
    }
}

// Алиас для совместимости (с обработкой ошибок)
async function analyzeCapsulewithAI(capsuleId) {
    try {
        const capsule = getCapsuleById(capsuleId);
        const items = loadItems(capsuleId);

        if (!capsule) {
            showToast('Капсула не найдена', 'error');
            return;
        }

        await analyzeCapsuleWithClaude(capsule, items);
    } catch (error) {
        console.error('[Claude API] Ошибка анализа:', error);
        showToast('Ошибка анализа: ' + error.message, 'error');
    }
}

// =============================================
// РЕКОМЕНДАЦИИ ПО ЦВЕТАМ (улучшенная + обработка ошибок)
// =============================================
async function suggestColorsForCapsule(capsuleId) {
    try {
        const capsule = getCapsuleById(capsuleId);

        if (!capsule) {
            showToast('Капсула не найдена', 'error');
            return { success: false };
        }

        const systemPrompt = `Ты эксперт по цветовым решениям в детской моде KARI.

ПРАВИЛА:
1. Используй ТОЛЬКО реальные коды Pantone TCX (проверяй формат XX-XXXX TCX)
2. База (60-70%): нейтральные цвета (серый, navy, чёрный, бежевый, белый)
3. Акценты (30-40%): яркие, но не кричащие (коралл, бирюза, горчица, мята)
4. Для детей: жизнерадостные, но не агрессивные цвета
5. Учитывай сезон: SS = светлее, AW = насыщеннее

ФОРМАТ — только JSON массив:
[
  {"name": "Название RU", "code": "XX-XXXX TCX", "hex": "#XXXXXX", "role": "base", "percent": 30},
  ...
]

Верни 5-6 цветов, percent в сумме = 100.`;

    const userMessage = `Палитра для:
КОЛЛЕКЦИЯ: ${capsule.name}
СЕЗОН: ${capsule.season}
ПОЛ: ${capsule.gender}
ВОЗРАСТ: ${capsule.ageRange}
КОНЦЕПЦИЯ: ${capsule.description || 'городской стиль'}

Только JSON, без пояснений.`;

    showToast('🎨 Подбираю палитру...', 'success');
    
    const result = await callClaudeAPI(systemPrompt, userMessage, 600);
    
        if (result.success) {
            try {
                const jsonMatch = result.content.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const colors = JSON.parse(jsonMatch[0]);

                    // Валидация Pantone кодов
                    const validColors = colors.filter(c => /^\d{2}-\d{4}\s*TCX$/i.test(c.code));

                    if (validColors.length >= 4) {
                        showToast('Палитра готова!', 'success');
                        return { success: true, colors: validColors };
                    }
                }
            } catch (e) {
                console.error('[Claude API] JSON parse error:', e);
            }
        }

        showToast('Ошибка генерации палитры', 'error');
        return { success: false };
    } catch (error) {
        console.error('[Claude API] Ошибка подбора цветов:', error);
        showToast('Ошибка: ' + error.message, 'error');
        return { success: false };
    }
}

// =============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =============================================
function copyAnalysis() {
    if (window.lastAnalysis) {
        navigator.clipboard.writeText(window.lastAnalysis);
        showToast('Анализ скопирован!', 'success');
    }
}

function saveAnalysisReport(capsuleId) {
    if (!window.lastAnalysis) return;
    
    const reports = JSON.parse(localStorage.getItem('kari-claude-reports') || '[]');
    reports.push({
        id: 'report-' + Date.now(),
        capsuleId: capsuleId,
        content: window.lastAnalysis,
        createdAt: new Date().toISOString()
    });
    localStorage.setItem('kari-claude-reports', JSON.stringify(reports));
    
    if (typeof syncToCloud === 'function') {
        syncToCloud();
    }
    
    showToast('Отчёт сохранён', 'success');
}

function loadAnalysisReports() {
    return JSON.parse(localStorage.getItem('kari-claude-reports') || '[]');
}

// =============================================
// ТЕСТ ПОДКЛЮЧЕНИЯ API
// =============================================
async function testClaudeConnection() {
    showToast('🔄 Проверка подключения...', 'success');
    
    const result = await callClaudeAPI(
        'Ты помощник KARI Design Hub.',
        'Ответь одним словом: работает ли подключение? Только слово "Да" или "Нет".',
        50
    );
    
    if (result.success && result.content.toLowerCase().includes('да')) {
        showToast('✅ Claude API работает!', 'success');
        return true;
    } else {
        showToast('❌ Ошибка подключения: ' + (result.error || 'неизвестная'), 'error');
        return false;
    }
}

// =============================================
// ЭКСПОРТ ФУНКЦИЙ
// =============================================
// =============================================
// CLAUDE VISION — анализ прототипа изделия
// =============================================
async function callClaudeVision(systemPrompt, userText, imageUrl, maxTokens = 1500) {
    updateApiStatus('loading');
    apiCallCount++;
    try {
        // Загружаем картинку и конвертируем в base64 (Anthropic принимает base64 или url; через proxy удобнее base64)
        const imgResp = await fetch(imageUrl);
        const blob = await imgResp.blob();
        const mediaType = blob.type || 'image/jpeg';
        const base64 = await new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onloadend = () => resolve(r.result.split(',')[1]);
            r.onerror = reject;
            r.readAsDataURL(blob);
        });

        const response = await fetch(CLAUDE_PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: maxTokens,
                system: systemPrompt,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
                        { type: 'text', text: userText }
                    ]
                }]
            })
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        updateApiStatus('success');
        return { success: true, content: data.content[0].text };
    } catch (error) {
        console.error('[Claude Vision] Ошибка:', error);
        updateApiStatus('error', error.message);
        return { success: false, error: error.message };
    }
}

// Анализ прототипа изделия по картинке -> структурированное описание
async function analyzePrototypeImage(imageUrl) {
    const system = `Ты профессиональный fashion-дизайнер и технолог одежды. Проанализируй изделие на фотографии и верни ТОЛЬКО JSON без markdown-обёрток и пояснений. Используй русский язык в значениях.`;
    const user = `Проанализируй это изделие одежды и верни JSON со следующей структурой:
{
  "type": "тип изделия (худи, свитшот, куртка, футболка и т.д.)",
  "fit": "крой (оверсайз / regular / slim / relaxed)",
  "length": "длина (кроп / стандарт / удлинённая / макси)",
  "silhouette": "силуэт (прямой / A-line / приталенный / свободный)",
  "neckline": "горловина/ворот (капюшон / круглый / V-образный / стойка / поло)",
  "sleeves": "рукава (длинные / короткие / 3/4 / реглан / втачные / спущенное плечо)",
  "cuffs": "манжеты (рифлёные / прямые / на резинке / отсутствуют)",
  "hem": "низ изделия (рифлёная резинка / прямой / кулиска / асимметрия)",
  "pockets": "карманы (кенгуру / накладные / прорезные / отсутствуют / количество и расположение)",
  "closure": "застёжка (молния / кнопки / пуговицы / без застёжки / шнуровка)",
  "hood": "капюшон (двухслойный с кулиской / простой / отсутствует)",
  "material_guess": "предполагаемый материал (футер, флис, твил, деним, нейлон и т.д.)",
  "details": "особые детали (нашивки, швы, люверсы, принты, вышивка и т.д.)",
  "construction_notes": "конструктивные особенности важные для повторения кроя"
}
Будь максимально точным и конкретным — это описание будет использовано для генерации промптов другим изделиям в этом же крое.`;
    const result = await callClaudeVision(system, user, imageUrl, 1500);
    if (!result.success) return result;
    // Парсим JSON
    let txt = result.content.trim();
    txt = txt.replace(/^```json\s*/i, '').replace(/^```\s*/,'').replace(/```\s*$/,'').trim();
    try {
        const parsed = JSON.parse(txt);
        return { success: true, analysis: parsed, raw: txt };
    } catch (e) {
        return { success: false, error: 'Не удалось распарсить JSON: ' + e.message, raw: txt };
    }
}

// Генерация финального промпта по SKU с учётом анализа прототипа
async function generatePromptFromPrototype({ capsule, sku, prototypeAnalysis, target }) {
    const targetName = target === 'gpt' ? 'ChatGPT / DALL·E' : target === 'banana' ? 'Google Nano Banana (Gemini)' : 'Midjourney';
    const colorsLine = (capsule.palette || []).map(c => `${c.name || c.code} (${c.code}) — ${c.percent || ''}%`).join(', ');
    const catsLine = (capsule.categories || []).map(c => `${c.name}×${c.count}`).join(', ');

    let formatInstruction;
    if (target === 'midjourney') {
        formatInstruction = `Формат: английский, через запятые, параметры Midjourney в конце (--ar 3:4 --v 6 --style raw). Длина 60-120 слов.`;
    } else if (target === 'gpt') {
        formatInstruction = `Формат: развёрнутое описательное предложение на английском естественным языком для ChatGPT/DALL·E. Без Midjourney-параметров. Длина 80-150 слов.`;
    } else {
        formatInstruction = `Формат: структурированное описание на английском для Google Nano Banana / Gemini. Чёткие блоки: garment, fabric, colors, construction details, styling, photography. Длина 80-150 слов.`;
    }

    const system = `Ты fashion-designer и prompt-engineer. Генерируй промпты для ${targetName} для AI-генерации изделий одежды. Всегда включай Pantone TCX коды и процентное распределение цветов.`;
    const user = `КАПСУЛЬНАЯ КОЛЛЕКЦИЯ:
- Тема: ${capsule.theme || capsule.name}
- Сезон: ${capsule.season || ''}
- Аудитория: ${capsule.audience || ''}
- Настроение: ${capsule.mood || ''}
- Категории: ${catsLine}

ПАЛИТРА PANTONE TCX (обязательно использовать коды):
${colorsLine}

ПРОТОТИП ИЗДЕЛИЯ (результат AI-анализа фото — ОБЯЗАТЕЛЬНО сохранить ВСЕ конструктивные детали):
${JSON.stringify(prototypeAnalysis, null, 2)}

ТЕКУЩЕЕ SKU:
- Категория: ${sku.category}
- Название: ${sku.name || '—'}
- Цвета для этого SKU: ${(sku.colors || []).map(c=>`${c.name||c.code} (${c.code}) ${c.percent||''}%`).join(', ') || 'использовать палитру капсулы'}

ЗАДАЧА:
Сгенерируй один промпт для ${targetName}, где ОБЯЗАТЕЛЬНО:
1. Сохранены ВСЕ конструктивные особенности прототипа (крой, карманы, капюшон, манжеты, низ, застёжка, силуэт, рукава) — это критично для визуальной согласованности капсулы
2. Указаны Pantone TCX коды с процентами
3. Соблюдён стиль/настроение капсулы
4. Указан тип модели, свет, фон (studio, neutral background, natural soft light) — единый для всей капсулы
${formatInstruction}

Верни ТОЛЬКО текст промпта, без заголовков и пояснений.`;
    return await callClaudeAPI(system, user, 1200);
}

window.callClaudeVision = callClaudeVision;
window.analyzePrototypeImage = analyzePrototypeImage;
window.generatePromptFromPrototype = generatePromptFromPrototype;

window.callClaudeAPI = callClaudeAPI;
window.generatePromptWithClaude = generatePromptWithClaude;
window.generateItemPrompt = generateItemPrompt;
window.generatePromptsForCapsule = generatePromptsForCapsule;
window.analyzeCapsulewithAI = analyzeCapsulewithAI;
window.analyzeCapsuleWithClaude = analyzeCapsuleWithClaude;
window.suggestColorsForCapsule = suggestColorsForCapsule;
window.copyAnalysis = copyAnalysis;
window.saveAnalysisReport = saveAnalysisReport;
window.loadAnalysisReports = loadAnalysisReports;
window.testClaudeConnection = testClaudeConnection;
window.updateApiStatus = updateApiStatus;
window.validatePrompt = validatePrompt;
window.fixPrompt = fixPrompt;
window.PROMPT_EXAMPLES = PROMPT_EXAMPLES;

console.log('🤖 Claude API module v3.0 loaded (with improved decision logic)');
