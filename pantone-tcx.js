// =============================================
// PANTONE TCX DATABASE + AUTOCOMPLETE PICKER
// Compact curated database of common fashion TCX colors
// =============================================

const PANTONE_TCX = [
    // Blacks / Grays / Whites
    { code: '19-4005 TCX', name: 'Jet Black', ru: 'Чёрный', hex: '#1A1A1A' },
    { code: '19-3906 TCX', name: 'Phantom', ru: 'Графитовый', hex: '#46434C' },
    { code: '18-0000 TCX', name: 'Castlerock', ru: 'Тёмно-серый', hex: '#5B5A5D' },
    { code: '17-4402 TCX', name: 'Neutral Gray', ru: 'Серый меланж', hex: '#8C9091' },
    { code: '16-3850 TCX', name: 'Silver', ru: 'Серебристый', hex: '#B5B5B5' },
    { code: '14-4002 TCX', name: 'Vapor Blue', ru: 'Светло-серый', hex: '#C1C0BC' },
    { code: '12-0304 TCX', name: 'Bone White', ru: 'Костяной', hex: '#E5DED7' },
    { code: '11-4800 TCX', name: 'Blanc de Blanc', ru: 'Молочный', hex: '#E7E5E0' },
    { code: '11-0601 TCX', name: 'Bright White', ru: 'Белый', hex: '#F4F5F0' },
    { code: '11-4300 TCX', name: 'Cloud Dancer', ru: 'Кремово-белый', hex: '#F0EEE9' },

    // Beige / Brown / Camel
    { code: '13-1106 TCX', name: 'Cream', ru: 'Кремовый', hex: '#EBE3D0' },
    { code: '14-1116 TCX', name: 'Wood Ash', ru: 'Песочный', hex: '#D6C6B0' },
    { code: '16-1334 TCX', name: 'Tan', ru: 'Бежевый', hex: '#BC986A' },
    { code: '17-1230 TCX', name: 'Tannin', ru: 'Тёмно-бежевый', hex: '#A5856A' },
    { code: '17-1147 TCX', name: 'Camel', ru: 'Кэмел', hex: '#B6764A' },
    { code: '18-1142 TCX', name: 'Cathay Spice', ru: 'Кофейный', hex: '#965C36' },
    { code: '19-1314 TCX', name: 'Chocolate Brown', ru: 'Шоколадный', hex: '#553F37' },
    { code: '19-1118 TCX', name: 'Coffee Bean', ru: 'Кофе', hex: '#42342B' },
    { code: '18-1018 TCX', name: 'Caribou', ru: 'Карибу', hex: '#807156' },

    // Reds / Burgundy
    { code: '19-1664 TCX', name: 'True Red', ru: 'Истинно красный', hex: '#BF1932' },
    { code: '18-1763 TCX', name: 'Poppy Red', ru: 'Маковый красный', hex: '#BE3A3E' },
    { code: '19-1763 TCX', name: 'Racing Red', ru: 'Алый', hex: '#BD162C' },
    { code: '18-1438 TCX', name: 'Marsala', ru: 'Марсала', hex: '#964F4C' },
    { code: '19-1934 TCX', name: 'Persian Red', ru: 'Бордовый', hex: '#A33336' },
    { code: '19-1724 TCX', name: 'Rhubarb', ru: 'Винный', hex: '#80272F' },
    { code: '19-1840 TCX', name: 'Cordovan', ru: 'Тёмно-бордовый', hex: '#702F36' },

    // Orange / Coral / Peach
    { code: '16-1462 TCX', name: 'Vermillion Orange', ru: 'Оранжевый', hex: '#E25822' },
    { code: '17-1462 TCX', name: 'Flame', ru: 'Огненный', hex: '#F2552C' },
    { code: '16-1546 TCX', name: 'Living Coral', ru: 'Коралловый', hex: '#FF6F61' },
    { code: '15-1247 TCX', name: 'Cadmium Orange', ru: 'Кадмий', hex: '#F18F4D' },
    { code: '14-1227 TCX', name: 'Peach Cobbler', ru: 'Персиковый', hex: '#F5B07A' },
    { code: '13-1023 TCX', name: 'Peach Quartz', ru: 'Светло-персиковый', hex: '#F5B895' },
    { code: '14-1318 TCX', name: 'Powder Pink', ru: 'Пудровый розовый', hex: '#F2B3B6' },

    // Pinks / Magenta
    { code: '17-2031 TCX', name: 'Hot Pink', ru: 'Ярко-розовый', hex: '#E55982' },
    { code: '18-2436 TCX', name: 'Fuchsia Red', ru: 'Фуксия', hex: '#C9437B' },
    { code: '19-2434 TCX', name: 'Boysenberry', ru: 'Малиновый', hex: '#893950' },
    { code: '13-2807 TCX', name: 'Pink Lady', ru: 'Светло-розовый', hex: '#F0C4D2' },
    { code: '12-2103 TCX', name: 'Heavenly Pink', ru: 'Нежно-розовый', hex: '#EBD3D3' },
    { code: '15-1816 TCX', name: 'Peony', ru: 'Пион', hex: '#E8A0AA' },

    // Yellow / Gold
    { code: '13-0859 TCX', name: 'Cyber Yellow', ru: 'Жёлтый', hex: '#FFD300' },
    { code: '12-0736 TCX', name: 'Lemon Verbena', ru: 'Лимонный', hex: '#F1E788' },
    { code: '14-0848 TCX', name: 'Aspen Gold', ru: 'Золотистый', hex: '#F2C84B' },
    { code: '15-0850 TCX', name: 'Ceylon Yellow', ru: 'Горчичный', hex: '#D8AC50' },
    { code: '16-0950 TCX', name: 'Bright Gold', ru: 'Золотой', hex: '#BD9B60' },
    { code: '12-0633 TCX', name: 'Cream Gold', ru: 'Светлое золото', hex: '#E5D193' },

    // Greens
    { code: '13-0550 TCX', name: 'Lime Punch', ru: 'Лаймовый', hex: '#C0D725' },
    { code: '15-0343 TCX', name: 'Greenery', ru: 'Травяной', hex: '#88B04B' },
    { code: '17-0145 TCX', name: 'Online Lime', ru: 'Сочный зелёный', hex: '#62864F' },
    { code: '18-0135 TCX', name: 'Treetop', ru: 'Лесной', hex: '#4D6A3F' },
    { code: '18-0316 TCX', name: 'Olive Branch', ru: 'Оливковый', hex: '#7D7B4B' },
    { code: '19-0414 TCX', name: 'Kombu Green', ru: 'Тёмно-оливковый', hex: '#3A3B22' },
    { code: '13-5714 TCX', name: 'Cabbage', ru: 'Мятный', hex: '#A8D9A6' },
    { code: '14-6312 TCX', name: 'Sprout Green', ru: 'Светло-зелёный', hex: '#9CCB9C' },
    { code: '18-5841 TCX', name: 'Parakeet', ru: 'Изумрудный', hex: '#009B5C' },
    { code: '19-5511 TCX', name: 'Forest Biome', ru: 'Хаки', hex: '#3F4F3D' },
    { code: '17-0119 TCX', name: 'Sage', ru: 'Шалфей', hex: '#90916D' },

    // Blues
    { code: '19-4052 TCX', name: 'Classic Blue', ru: 'Классический синий', hex: '#0F4C81' },
    { code: '19-4026 TCX', name: 'Dress Blues', ru: 'Тёмно-синий', hex: '#2A2A40' },
    { code: '19-3933 TCX', name: 'Medieval Blue', ru: 'Полуночный синий', hex: '#383E56' },
    { code: '18-4051 TCX', name: 'Strong Blue', ru: 'Электрик', hex: '#005EB8' },
    { code: '18-4252 TCX', name: 'Princess Blue', ru: 'Королевский синий', hex: '#00549F' },
    { code: '17-4139 TCX', name: 'Dutch Blue', ru: 'Голубой деним', hex: '#5878A2' },
    { code: '16-4132 TCX', name: 'Little Boy Blue', ru: 'Голубой', hex: '#6B9CD2' },
    { code: '15-4020 TCX', name: 'Dusk Blue', ru: 'Сине-серый', hex: '#7BA2BD' },
    { code: '14-4318 TCX', name: 'Sky Blue', ru: 'Небесный', hex: '#7CB6CC' },
    { code: '13-4308 TCX', name: 'Crystal Blue', ru: 'Кристальный', hex: '#A6CADD' },
    { code: '12-4607 TCX', name: 'Glacier Lake', ru: 'Ледяной', hex: '#C5D6DA' },
    { code: '19-4324 TCX', name: 'Indigo Bunting', ru: 'Индиго', hex: '#005A8B' },
    { code: '18-4528 TCX', name: 'Caribbean Sea', ru: 'Бирюзовый', hex: '#008EAA' },
    { code: '15-5217 TCX', name: 'Aqua', ru: 'Аква', hex: '#7BCDC8' },

    // Purple / Violet
    { code: '18-3838 TCX', name: 'Ultra Violet', ru: 'Ультрафиолет', hex: '#5F4B8B' },
    { code: '18-3224 TCX', name: 'Purple Heart', ru: 'Лиловый', hex: '#7E5793' },
    { code: '19-3215 TCX', name: 'Plum Perfect', ru: 'Сливовый', hex: '#473C4F' },
    { code: '17-3020 TCX', name: 'Lavender Mist', ru: 'Лавандовый', hex: '#A192B2' },
    { code: '14-3812 TCX', name: 'Purple Heather', ru: 'Светло-фиолетовый', hex: '#B6AECE' },
    { code: '13-3805 TCX', name: 'Lavender Fog', ru: 'Туманная лаванда', hex: '#CFCAD3' }
];

// =============================================
// AUTOCOMPLETE DROPDOWN
// =============================================
let pantoneDropdown = null;

function ensurePantoneDropdown() {
    if (pantoneDropdown) return pantoneDropdown;
    pantoneDropdown = document.createElement('div');
    pantoneDropdown.id = 'pantoneDropdown';
    pantoneDropdown.style.cssText = `
        position: absolute;
        z-index: 99999;
        background: #fff;
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        max-height: 280px;
        overflow-y: auto;
        min-width: 320px;
        display: none;
        font-size: 13px;
    `;
    document.body.appendChild(pantoneDropdown);
    document.addEventListener('mousedown', (e) => {
        if (pantoneDropdown.style.display === 'block' &&
            !pantoneDropdown.contains(e.target) &&
            !e.target.classList.contains('color-input')) {
            pantoneDropdown.style.display = 'none';
        }
    });
    return pantoneDropdown;
}

function pantoneSearch(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) return PANTONE_TCX.slice(0, 30);
    return PANTONE_TCX.filter(c =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.ru.toLowerCase().includes(q)
    ).slice(0, 30);
}

function showPantoneDropdown(input) {
    const dd = ensurePantoneDropdown();
    const matches = pantoneSearch(input.value);
    if (!matches.length) {
        dd.style.display = 'none';
        return;
    }
    dd.innerHTML = matches.map((c, i) => `
        <div class="pantone-item" data-idx="${i}" style="display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;border-bottom:1px solid #f3f3f3;">
            <div style="width:24px;height:24px;border-radius:6px;background:${c.hex};border:1px solid #ddd;flex-shrink:0;"></div>
            <div style="flex:1;min-width:0;">
                <div style="font-weight:600;color:#222;">${c.code}</div>
                <div style="font-size:11px;color:#777;">${c.ru} · ${c.name}</div>
            </div>
        </div>
    `).join('');

    // Position
    const rect = input.getBoundingClientRect();
    dd.style.left = (rect.left + window.scrollX) + 'px';
    dd.style.top = (rect.bottom + window.scrollY + 4) + 'px';
    dd.style.display = 'block';

    // Bind clicks
    dd.querySelectorAll('.pantone-item').forEach((el, i) => {
        el.addEventListener('mouseenter', () => el.style.background = '#f8f4ed');
        el.addEventListener('mouseleave', () => el.style.background = '#fff');
        el.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const c = matches[i];
            const row = input.closest('.color-row');
            if (!row) return;
            const inputs = row.querySelectorAll('input');
            inputs[0].value = c.code;
            inputs[1].value = c.ru;
            inputs[2].value = c.hex;
            dd.style.display = 'none';
            inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        });
    });
}

// Event delegation — works for existing AND dynamically added rows
document.addEventListener('focusin', (e) => {
    if (e.target.classList && e.target.classList.contains('color-input')) {
        showPantoneDropdown(e.target);
    }
});
document.addEventListener('input', (e) => {
    if (e.target.classList && e.target.classList.contains('color-input')) {
        showPantoneDropdown(e.target);
    }
});

window.PANTONE_TCX = PANTONE_TCX;
window.pantoneSearch = pantoneSearch;
