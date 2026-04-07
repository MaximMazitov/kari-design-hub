// =============================================
// PANTONE TCX COLOR PICKER MODAL
// Full database from pantone-data.js (2310 colors)
// =============================================

let pantonePickerModal = null;
let pantonePickerCallback = null;

function ensurePantonePickerModal() {
    if (pantonePickerModal) return pantonePickerModal;

    pantonePickerModal = document.createElement('div');
    pantonePickerModal.id = 'pantonePickerModal';
    pantonePickerModal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.55);
        z-index: 2147483647;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    pantonePickerModal.innerHTML = `
        <div style="background:#fff;border-radius:16px;width:100%;max-width:560px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.3);overflow:hidden;">
            <div style="padding:18px 22px;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between;">
                <h3 style="margin:0;font-size:17px;font-weight:700;color:#222;">🎨 Выбор цвета Pantone TCX</h3>
                <div id="pantonePickerClose" style="cursor:pointer;font-size:24px;color:#888;line-height:1;padding:4px 8px;">×</div>
            </div>
            <div style="padding:14px 22px;border-bottom:1px solid #eee;">
                <input id="pantonePickerSearch" type="text" placeholder="Поиск по коду (19-4005) или названию (black, coral...)"
                       style="width:100%;padding:12px 14px;border:1px solid #ddd;border-radius:10px;font-size:14px;outline:none;box-sizing:border-box;" />
                <div id="pantonePickerCount" style="margin-top:8px;font-size:12px;color:#888;"></div>
            </div>
            <div id="pantonePickerList" style="flex:1;overflow-y:auto;padding:6px 0;"></div>
        </div>
    `;
    document.body.appendChild(pantonePickerModal);

    // Close on backdrop click
    pantonePickerModal.addEventListener('mousedown', (e) => {
        if (e.target === pantonePickerModal) closePantonePicker();
    });
    pantonePickerModal.querySelector('#pantonePickerClose').addEventListener('click', closePantonePicker);

    const searchInput = pantonePickerModal.querySelector('#pantonePickerSearch');
    searchInput.addEventListener('input', () => renderPantonePickerList(searchInput.value));
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePantonePicker();
    });

    return pantonePickerModal;
}

function pantoneSearch(query) {
    const db = window.PANTONE_TCX || [];
    const q = (query || '').toLowerCase().trim().replace(/\s*tcx\s*$/i, '').trim();
    if (!q) return db;
    return db.filter(c =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
    );
}

function renderPantonePickerList(query) {
    const matches = pantoneSearch(query);
    const list = pantonePickerModal.querySelector('#pantonePickerList');
    const count = pantonePickerModal.querySelector('#pantonePickerCount');
    count.textContent = `Найдено: ${matches.length} из ${(window.PANTONE_TCX || []).length}`;

    const visible = matches;
    list.innerHTML = visible.map((c, i) => `
        <div class="pantone-pick-item" data-idx="${i}"
             style="display:flex;align-items:center;gap:12px;padding:10px 22px;cursor:pointer;border-bottom:1px solid #f5f5f5;">
            <div style="width:36px;height:36px;border-radius:8px;background:${c.hex};border:1px solid #ddd;flex-shrink:0;"></div>
            <div style="flex:1;min-width:0;">
                <div style="font-weight:600;color:#222;font-size:14px;">${c.code}</div>
                <div style="font-size:12px;color:#777;">${c.name}</div>
            </div>
            <div style="font-size:11px;color:#aaa;font-family:monospace;">${c.hex}</div>
        </div>
    `).join('');

    list.querySelectorAll('.pantone-pick-item').forEach((el, i) => {
        el.addEventListener('mouseenter', () => el.style.background = '#fdf6ec');
        el.addEventListener('mouseleave', () => el.style.background = '#fff');
        el.addEventListener('click', () => {
            if (typeof pantonePickerCallback === 'function') {
                pantonePickerCallback(visible[i]);
            }
            closePantonePicker();
        });
    });
}

function openPantonePicker(callback) {
    ensurePantonePickerModal();
    pantonePickerCallback = callback;
    pantonePickerModal.style.display = 'flex';
    const search = pantonePickerModal.querySelector('#pantonePickerSearch');
    search.value = '';
    renderPantonePickerList('');
    setTimeout(() => search.focus(), 50);
}

function closePantonePicker() {
    if (pantonePickerModal) pantonePickerModal.style.display = 'none';
    pantonePickerCallback = null;
}

// Helper: fill an existing color row from a color object
function fillColorRow(row, c) {
    const inputs = row.querySelectorAll('input');
    inputs[0].value = c.code;
    inputs[1].value = c.name;
    inputs[2].value = c.hex;
    inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
}

// Override addColor() — when user clicks "+ Добавить цвет", open the picker
// instead of adding an empty row.
window.addEventListener('DOMContentLoaded', () => {
    if (typeof window.addColor === 'function') {
        const originalAddColor = window.addColor;
        window.addColor = function() {
            openPantonePicker((c) => {
                originalAddColor();
                const rows = document.querySelectorAll('#colorsContainer .color-row');
                const lastRow = rows[rows.length - 1];
                if (lastRow) fillColorRow(lastRow, c);
            });
        };
    }
});

// Click on any existing .color-input opens the picker for that row
document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList && target.classList.contains('color-input')) {
        e.preventDefault();
        target.blur();
        const row = target.closest('.color-row');
        openPantonePicker((c) => { if (row) fillColorRow(row, c); });
    }
});

window.openPantonePicker = openPantonePicker;
window.closePantonePicker = closePantonePicker;
window.pantoneSearch = pantoneSearch;
