// =============================================
// PANTONE TCX AUTOCOMPLETE PICKER
// Uses full database from pantone-data.js (2310 colors)
// =============================================

let pantoneDropdown = null;

function ensurePantoneDropdown() {
    if (pantoneDropdown) return pantoneDropdown;
    pantoneDropdown = document.createElement('div');
    pantoneDropdown.id = 'pantoneDropdown';
    pantoneDropdown.style.cssText = `
        position: fixed;
        z-index: 2147483647;
        background: #fff;
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        box-shadow: 0 12px 32px rgba(0,0,0,0.25);
        max-height: 320px;
        overflow-y: auto;
        min-width: 340px;
        display: none;
        font-size: 13px;
    `;
    document.body.appendChild(pantoneDropdown);

    document.addEventListener('mousedown', (e) => {
        if (pantoneDropdown.style.display !== 'block') return;
        if (pantoneDropdown.contains(e.target)) return;
        if (e.target.classList && e.target.classList.contains('color-input')) return;
        pantoneDropdown.style.display = 'none';
    }, true);

    window.addEventListener('scroll', () => {
        if (pantoneDropdown.style.display === 'block') pantoneDropdown.style.display = 'none';
    }, true);

    return pantoneDropdown;
}

function pantoneSearch(query) {
    const db = window.PANTONE_TCX || [];
    const q = (query || '').toLowerCase().trim().replace(/\s*tcx\s*$/i, '').trim();
    if (!q) return db.slice(0, 50);
    return db.filter(c =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
    ).slice(0, 80);
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
            <div style="width:26px;height:26px;border-radius:6px;background:${c.hex};border:1px solid #ddd;flex-shrink:0;"></div>
            <div style="flex:1;min-width:0;">
                <div style="font-weight:600;color:#222;">${c.code}</div>
                <div style="font-size:11px;color:#777;">${c.name}</div>
            </div>
            <div style="font-size:10px;color:#aaa;font-family:monospace;">${c.hex}</div>
        </div>
    `).join('');

    const rect = input.getBoundingClientRect();
    let left = rect.left;
    let top = rect.bottom + 4;
    // Keep dropdown on screen
    const ddWidth = 340;
    if (left + ddWidth > window.innerWidth - 10) left = window.innerWidth - ddWidth - 10;
    if (top + 320 > window.innerHeight - 10) top = Math.max(10, rect.top - 320 - 4);
    dd.style.left = left + 'px';
    dd.style.top = top + 'px';
    dd.style.display = 'block';

    dd.querySelectorAll('.pantone-item').forEach((el, i) => {
        el.addEventListener('mouseenter', () => el.style.background = '#f8f4ed');
        el.addEventListener('mouseleave', () => el.style.background = '#fff');
        el.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const c = matches[i];
            const row = input.closest('.color-row');
            if (!row) return;
            const inputs = row.querySelectorAll('input');
            inputs[0].value = c.code;
            inputs[1].value = c.name;
            inputs[2].value = c.hex;
            dd.style.display = 'none';
            inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        });
    });
}

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

window.pantoneSearch = pantoneSearch;
window.showPantoneDropdown = showPantoneDropdown;
