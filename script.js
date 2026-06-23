/* ==============================================
   KONSTANTA
   ============================================== */
var HARI  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
var BULAN = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'
];

/* ==============================================
   STATE
   ============================================== */
var formData        = {};
var currentRHK      = null;
var uidCounter      = 0;
var allRhkData      = {};
var imageData       = {};
var activeDateCell  = null;
var currentImageUid = null;
var deleteConfirm   = false;
var deleteTimer     = null;

for (var i = 1; i <= 12; i++) allRhkData[i] = [];

/* ==============================================
   REFERENSI DOM
   ============================================== */
var pageForm      = document.getElementById('pageForm');
var pageLogbook   = document.getElementById('pageLogbook');
var formError     = document.getElementById('formError');
var rhkGrid       = document.getElementById('rhkGrid');
var rhkTabs       = document.getElementById('rhkTabs');
var pageInfo      = document.getElementById('pageInfo');
var tableBody     = document.getElementById('tableBody');
var emptyState    = document.getElementById('emptyState');
var btnBack       = document.getElementById('btnBack');
var btnAddRow     = document.getElementById('btnAddRow');
var btnDelete     = document.getElementById('btnDelete');
var btnExportWord = document.getElementById('btnExportWord');
var btnPrev       = document.getElementById('btnPrev');
var btnNext       = document.getElementById('btnNext');
var navIndicator  = document.getElementById('navIndicator');
var datePicker    = document.getElementById('datePicker');
var dpDay         = document.getElementById('dpDay');
var dpMonth       = document.getElementById('dpMonth');
var dpYear        = document.getElementById('dpYear');
var dpPreview     = document.getElementById('dpPreview');
var dpOk          = document.getElementById('dpOk');
var imageInput    = document.getElementById('imageInput');
var lightbox      = document.getElementById('lightbox');
var lbImg         = document.getElementById('lbImg');
var lbClose       = document.getElementById('lbClose');

var fieldIds = [
    'fNama','fNip','fPangkat','fJabatan',
    'fUnitKerja','fUnitOrg','fRencanaHasil',
    'fRencanaAksi','fBulanRealisasi','fRealisasi'
];

/* ==============================================
   INISIALISASI DROPDOWN DATE PICKER
   ============================================== */
(function initDatePicker() {
    /* Tanggal 1-31 */
    for (var d = 1; d <= 31; d++) {
        var o = document.createElement('option');
        o.value = d; o.textContent = d;
        dpDay.appendChild(o);
    }

    /* Bulan */
    BULAN.forEach(function (b, i) {
        var o = document.createElement('option');
        o.value = i; o.textContent = b;
        dpMonth.appendChild(o);
    });

    /* Tahun 2000 - 2040 */
    for (var y = 2000; y <= 2040; y++) {
        var o = document.createElement('option');
        o.value = y; o.textContent = y;
        dpYear.appendChild(o);
    }

    /* Set default ke hari ini */
    var now = new Date();
    dpDay.value = now.getDate();
    dpMonth.value = now.getMonth();
    dpYear.value = now.getFullYear();
    updateDpPreview();
})();

/* Update preview hari saat dropdown berubah */
dpDay.addEventListener('change', updateDpPreview);
dpMonth.addEventListener('change', updateDpPreview);
dpYear.addEventListener('change', updateDpPreview);

function updateDpPreview() {
    var d = parseInt(dpDay.value);
    var m = parseInt(dpMonth.value);
    var y = parseInt(dpYear.value);

    /* Cek tanggal valid (misal 31 Februari) */
    var maxDay = new Date(y, m + 1, 0).getDate();
    var validDay = Math.min(d, maxDay);

    var date = new Date(y, m, validDay);
    var text = HARI[date.getDay()] + ', ' + validDay + ' ' + BULAN[m] + ' ' + y;
    dpPreview.textContent = text;
}

function getSelectedDateText() {
    var d = parseInt(dpDay.value);
    var m = parseInt(dpMonth.value);
    var y = parseInt(dpYear.value);
    var maxDay = new Date(y, m + 1, 0).getDate();
    var validDay = Math.min(d, maxDay);
    var date = new Date(y, m, validDay);
    return HARI[date.getDay()] + ', ' + validDay + ' ' + BULAN[m] + ' ' + y;
}

function getSelectedDateKey() {
    var d = parseInt(dpDay.value);
    var m = parseInt(dpMonth.value);
    var y = parseInt(dpYear.value);
    var maxDay = new Date(y, m + 1, 0).getDate();
    return y + '-' + m + '-' + Math.min(d, maxDay);
}

/* ==============================================
   HALAMAN 1: GRID RHK
   ============================================== */
(function buildRhkGrid() {
    for (var n = 1; n <= 12; n++) {
        var card = document.createElement('div');
        card.className = 'rhk-card';
        card.dataset.rhk = n;
        card.innerHTML =
            '<div class="rhk-num">' + n + '</div>' +
            '<div class="rhk-label">RHK</div>';
        card.addEventListener('click', function () {
            openRHK(parseInt(this.dataset.rhk));
        });
        rhkGrid.appendChild(card);
    }
})();

function refreshGridDots() {
    rhkGrid.querySelectorAll('.rhk-card').forEach(function (c) {
        var num = parseInt(c.dataset.rhk);
        c.classList.toggle('has-data', allRhkData[num] && allRhkData[num].length > 0);
    });
}

/* ==============================================
   NAVIGASI HALAMAN
   ============================================== */
function showPage(page) {
    pageForm.classList.remove('active');
    pageLogbook.classList.remove('active');
    page.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function collectFormData() {
    formData = {};
    fieldIds.forEach(function (id) {
        var el = document.getElementById(id);
        formData[id] = el ? el.value.trim() : '';
    });
}

function openRHK(num) {
    collectFormData();
    if (!formData.fNama || !formData.fNip) {
        formError.textContent = 'Silakan isi Nama dan NIP terlebih dahulu';
        formError.style.display = 'block';
        if (!formData.fNama) document.getElementById('fNama').focus();
        else document.getElementById('fNip').focus();
        return;
    }
    formError.style.display = 'none';
    currentRHK = num;
    buildRhkTabs(); renderPageInfo(); renderTable(); updateNavButtons();
    showPage(pageLogbook);
}

btnBack.addEventListener('click', function () {
    saveCurrentPageData(); refreshGridDots(); showPage(pageForm);
});

/* ==============================================
   RHK TABS
   ============================================== */
function buildRhkTabs() {
    rhkTabs.innerHTML = '';
    for (var n = 1; n <= 12; n++) {
        var tab = document.createElement('button');
        tab.type = 'button'; tab.className = 'rhk-tab';
        tab.textContent = n; tab.dataset.rhk = n;
        if (n === currentRHK) tab.classList.add('active');
        if (allRhkData[n] && allRhkData[n].length > 0) tab.classList.add('has-data');
        (function (rkhNum) {
            tab.addEventListener('click', function () { switchRHK(rkhNum); });
        })(n);
        rhkTabs.appendChild(tab);
    }
}

function updateTabStates() {
    rhkTabs.querySelectorAll('.rhk-tab').forEach(function (t) {
        var n = parseInt(t.dataset.rkh);
        t.classList.toggle('active', n === currentRHK);
        t.classList.toggle('has-data', allRhkData[n] && allRhkData[n].length > 0);
    });
}

function switchRHK(num) {
    if (num === currentRHK) return;
    saveCurrentPageData(); currentRHK = num;
    renderPageInfo(); renderTable(); updateNavButtons(); updateTabStates();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

btnPrev.addEventListener('click', function () { if (currentRHK > 1) switchRHK(currentRHK - 1); });
btnNext.addEventListener('click', function () { if (currentRHK < 12) switchRHK(currentRHK + 1); });

function updateNavButtons() {
    btnPrev.disabled = (currentRHK <= 1);
    btnNext.disabled = (currentRHK >= 12);
    navIndicator.textContent = 'RHK ' + currentRHK + ' / 12';
}

function renderPageInfo() {
    var d = formData;
    pageInfo.innerHTML =
        '<div class="pi-title">RHK ' + currentRHK + '</div>' +
        '<div class="pi-detail">' +
            escHtml(d.fNama) +
            ' &nbsp;&bull;&nbsp; NIP: ' + escHtml(d.fNip) +
            ' &nbsp;&bull;&nbsp; ' + escHtml(d.fJabatan) +
        '</div>';
}

/* ==============================================
   SIMPAN & RENDER DATA TABEL
   ============================================== */
function saveCurrentPageData() {
    if (currentRHK === null) return;
    var data = [];
    tableBody.querySelectorAll('tr').forEach(function (row) {
        var cells = row.querySelectorAll('td');
        var uid = parseInt(row.dataset.uid);
        var dateCell = cells[1];
        data.push({
            uid: uid,
            dateKey: dateCell.dataset.dateKey || '',
            dateText: dateCell.classList.contains('filled') ? dateCell.textContent : '',
            kegiatan: cells[2].querySelector('textarea').value,
            uraian: cells[3].querySelector('textarea').value,
            images: (imageData[uid] || []).slice()
        });
    });
    allRhkData[currentRHK] = data;
}

function renderTable() {
    tableBody.innerHTML = ''; imageData = {};
    var rows = allRhkData[currentRHK] || [];
    if (rows.length === 0) { emptyState.style.display = 'block'; return; }
    emptyState.style.display = 'none';
    rows.forEach(function (rowData, idx) {
        tableBody.appendChild(createRowElement(rowData, idx + 1));
    });
}

function createRowElement(rowData, num) {
    var uid = rowData.uid;
    var tr = document.createElement('tr');
    tr.dataset.uid = uid;
    if (uid >= uidCounter) uidCounter = uid + 1;
    if (rowData.images && rowData.images.length > 0) imageData[uid] = rowData.images.slice();

    /* No */
    var tdNo = document.createElement('td');
    tdNo.innerHTML =
        '<div class="col-no"><span class="no-num">' + num + '</span>' +
        '<button class="btn-del-row" title="Hapus baris ini"><i class="fas fa-times"></i></button></div>';
    tdNo.querySelector('.btn-del-row').addEventListener('click', function () {
        deleteRow(uid, this.closest('tr'));
    });
    tr.appendChild(tdNo);

    /* Tanggal */
    var tdDate = document.createElement('td');
    tdDate.className = 'date-cell';
    if (rowData.dateText) {
        tdDate.textContent = rowData.dateText;
        tdDate.classList.add('filled');
        tdDate.dataset.dateKey = rowData.dateKey;
    } else {
        tdDate.innerHTML = '<span class="dp-placeholder">Klik untuk pilih</span>';
    }
    tdDate.addEventListener('click', function (e) { e.stopPropagation(); openDatePicker(this); });
    tr.appendChild(tdDate);

    /* Kegiatan */
    var tdKeg = document.createElement('td');
    var txKeg = document.createElement('textarea');
    txKeg.className = 'cell-input'; txKeg.placeholder = 'Isi kegiatan...';
    txKeg.rows = 2; txKeg.value = rowData.kegiatan || '';
    tdKeg.appendChild(txKeg);
    tr.appendChild(tdKeg);

    /* Uraian */
    var tdUra = document.createElement('td');
    var txUra = document.createElement('textarea');
    txUra.className = 'cell-input'; txUra.placeholder = 'Isi uraian kegiatan...';
    txUra.rows = 2; txUra.value = rowData.uraian || '';
    tdUra.appendChild(txUra);
    tr.appendChild(tdUra);

    /* Bukti Dukung */
    var tdBuk = document.createElement('td');
    tdBuk.className = 'bukti-cell';
    var btnAddImg = document.createElement('button');
    btnAddImg.type = 'button'; btnAddImg.className = 'btn-add-img';
    btnAddImg.innerHTML = '<i class="fas fa-plus"></i> Tambah';
    btnAddImg.addEventListener('click', function () { currentImageUid = uid; imageInput.click(); });
    tdBuk.appendChild(btnAddImg);
    var imgGrid = document.createElement('div');
    imgGrid.className = 'img-grid'; imgGrid.id = 'ig-' + uid;
    tdBuk.appendChild(imgGrid);
    if (rowData.images) rowData.images.forEach(function (b64) { appendThumb(uid, b64); });
    tr.appendChild(tdBuk);

    return tr;
}

/* ==============================================
   TAMBAH BARIS
   ============================================== */
btnAddRow.addEventListener('click', function () {
    emptyState.style.display = 'none';
    var uid = uidCounter++;
    var tr = createRowElement({
        uid: uid, dateKey: '', dateText: '',
        kegiatan: '', uraian: '', images: []
    }, tableBody.children.length + 1);
    tableBody.appendChild(tr);
    tr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

/* ==============================================
   HAPUS BARIS
   ============================================== */
function deleteRow(uid, tr) {
    delete imageData[uid];
    tr.style.transition = 'opacity 0.25s, transform 0.25s';
    tr.style.opacity = '0'; tr.style.transform = 'translateX(20px)';
    setTimeout(function () {
        tr.remove(); renumberRows();
        if (tableBody.children.length === 0) emptyState.style.display = 'block';
    }, 250);
}

function renumberRows() {
    tableBody.querySelectorAll('tr').forEach(function (row, i) {
        var num = row.querySelector('.no-num');
        if (num) num.textContent = i + 1;
    });
}

/* ==============================================
   HAPUS SEMUA
   ============================================== */
btnDelete.addEventListener('click', function () {
    if (tableBody.children.length === 0) { showToast('Tabel sudah kosong'); return; }
    if (!deleteConfirm) {
        deleteConfirm = true;
        btnDelete.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Yakin Hapus?';
        btnDelete.style.background = '#7F1D1D';
        deleteTimer = setTimeout(function () { resetDeleteBtn(); }, 3000);
    } else {
        clearTimeout(deleteTimer);
        tableBody.innerHTML = ''; imageData = {};
        emptyState.style.display = 'block'; resetDeleteBtn();
        showToast('Data RHK ' + currentRHK + ' berhasil dihapus');
    }
});

function resetDeleteBtn() {
    deleteConfirm = false;
    btnDelete.innerHTML = '<i class="fas fa-trash-alt"></i> Hapus Semua';
    btnDelete.style.background = '';
}

/* ==============================================
   DATE PICKER SEDERHANA
   ============================================== */
function openDatePicker(cell) {
    activeDateCell = cell;

    /* Jika sudah ada tanggal, set dropdown ke tanggal tersebut */
    if (cell.dataset.dateKey) {
        var p = cell.dataset.dateKey.split('-');
        var y = parseInt(p[0]);
        var m = parseInt(p[1]);
        var d = parseInt(p[2]);
        dpYear.value = y;
        dpMonth.value = m;
        dpDay.value = d;
        updateDpPreview();
    } else {
        /* Default ke hari ini */
        var now = new Date();
        dpDay.value = now.getDate();
        dpMonth.value = now.getMonth();
        dpYear.value = now.getFullYear();
        updateDpPreview();
    }

    positionDP(cell);
    datePicker.classList.add('active');
}

function positionDP(cell) {
    var r = cell.getBoundingClientRect();
    var top = r.bottom + 8, left = r.left;
    if (top + 300 > window.innerHeight) top = r.top - 310;
    if (left + 280 > window.innerWidth) left = window.innerWidth - 290;
    if (left < 8) left = 8;
    datePicker.style.top = top + 'px';
    datePicker.style.left = left + 'px';
}

/* Tombol Pilih */
dpOk.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!activeDateCell) return;
    var text = getSelectedDateText();
    var key = getSelectedDateKey();
    activeDateCell.textContent = text;
    activeDateCell.classList.add('filled');
    activeDateCell.dataset.dateKey = key;
    closeDatePicker();
});

function closeDatePicker() {
    datePicker.classList.remove('active');
    activeDateCell = null;
}

datePicker.addEventListener('click', function (e) { e.stopPropagation(); });
document.addEventListener('click', function (e) {
    if (!datePicker.contains(e.target) && !e.target.closest('.date-cell')) closeDatePicker();
});

/* ==============================================
   UPLOAD GAMBAR
   ============================================== */
imageInput.addEventListener('change', function () {
    var files = Array.from(this.files);
    if (!files.length || currentImageUid === null) return;
    files.forEach(function (file) {
        if (!file.type.startsWith('image/')) return;
        var reader = new FileReader();
        reader.onload = function (ev) {
            var b64 = ev.target.result;
            if (!imageData[currentImageUid]) imageData[currentImageUid] = [];
            imageData[currentImageUid].push(b64);
            appendThumb(currentImageUid, b64);
        };
        reader.readAsDataURL(file);
    });
    this.value = '';
});

function appendThumb(uid, b64) {
    var grid = document.getElementById('ig-' + uid);
    if (!grid) return;
    var wrap = document.createElement('div');
    wrap.className = 'img-thumb'; wrap.title = 'Klik untuk perbesar';
    var img = document.createElement('img');
    img.src = b64; img.alt = 'Bukti';
    wrap.appendChild(img);
    img.addEventListener('click', function (e) { e.stopPropagation(); openLightbox(b64); });
    var rm = document.createElement('button');
    rm.type = 'button'; rm.className = 'img-remove'; rm.innerHTML = '&times;';
    rm.title = 'Hapus gambar';
    rm.addEventListener('click', function (e) {
        e.stopPropagation();
        if (imageData[uid]) {
            imageData[uid] = imageData[uid].filter(function (b) { return b !== b64; });
            if (imageData[uid].length === 0) delete imageData[uid];
        }
        wrap.remove();
    });
    wrap.appendChild(rm);
    grid.appendChild(wrap);
}

/* ==============================================
   LIGHTBOX
   ============================================== */
function openLightbox(src) { lbImg.src = src; lightbox.classList.add('active'); }
function closeLightbox() { lightbox.classList.remove('active'); setTimeout(function () { lbImg.src = ''; }, 250); }
lbClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeLightbox(); closeDatePicker(); }
});

/* ==============================================
   EXPORT WORD
   ============================================== */
btnExportWord.addEventListener('click', function () {
    saveCurrentPageData();
    var rows = allRhkData[currentRHK] || [];
    if (rows.length === 0) { showToast('Tabel RHK ' + currentRHK + ' kosong'); return; }
    showToast('Sedang membuat Word...');

    var d = formData;
    var h = '';
    h += '<div class="exp-title">LOGBOOK KEGIATAN</div>';
    h += '<div class="exp-subtitle">Rencana Hasil Kerja (RHK)</div>';
    h += '<br/>';

    h += '<table class="exp-info-table">';
    var pairs = [
        ['Nama', d.fNama], ['NIP', d.fNip],
        ['Pangkat / Golongan Ruang', d.fPangkat],
        ['Jabatan', d.fJabatan], ['Unit Kerja', d.fUnitKerja],
        ['Unit Organisasi', d.fUnitOrg],
        ['Rencana Hasil Kerja', d.fRencanaHasil],
        ['Rencana Aksi', d.fRencanaAksi],
        ['Bulan Realisasi Kinerja', d.fBulanRealisasi],
        ['Realisasi Kinerja', d.fRealisasi]
    ];
    pairs.forEach(function (pair) {
        var val = pair[1] ? escHtml(pair[1]).replace(/\n/g, '<br/>') : '-';
        h += '<tr><td class="info-label">' + pair[0] + '</td><td>: ' + val + '</td></tr>';
    });
    h += '</table>';

    h += '<div class="exp-rhk-title">RHK ' + currentRHK + '</div><br/>';

    h += '<table class="exp-table"><thead><tr>';
    h += '<th style="width:30px">No</th>';
    h += '<th style="width:140px">Hari / Tanggal</th>';
    h += '<th style="width:150px">Kegiatan</th>';
    h += '<th>Kegiatan Uraian</th>';
    h += '<th style="width:160px">Bukti Dukung</th>';
    h += '</tr></thead><tbody>';

    rows.forEach(function (row, idx) {
        h += '<tr>';
        h += '<td>' + (idx + 1) + '</td>';
        h += '<td>' + escHtml(row.dateText || '-') + '</td>';
        h += '<td style="text-align:left">' + escHtml(row.kegiatan || '-').replace(/\n/g, '<br>') + '</td>';
        h += '<td style="text-align:left">' + escHtml(row.uraian || '-').replace(/\n/g, '<br>') + '</td>';
        h += '<td>';
        if (row.images && row.images.length > 0) {
            row.images.forEach(function (b64) { h += '<img src="' + b64 + '" />'; });
        } else { h += '-'; }
        h += '</td></tr>';
    });

    h += '</tbody></table>';

    var full = '<!DOCTYPE html>' +
        "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
        "xmlns:w='urn:schemas-microsoft-com:office:word' " +
        "xmlns='http://www.w3.org/TR/REC-html40'>" +
        '<head><meta charset="utf-8"><style>' +
        'body{font-family:"Times New Roman",serif;font-size:11pt;margin:20px;}' +
        '.exp-title{text-align:center;font-size:16pt;font-weight:bold;margin-bottom:2px;}' +
        '.exp-subtitle{text-align:center;font-size:11pt;color:#555;margin-bottom:10px;}' +
        '.exp-info-table{width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:14px;}' +
        '.exp-info-table td{padding:3px 8px;border:none;vertical-align:top;}' +
        '.exp-info-table .info-label{font-weight:bold;width:200px;white-space:nowrap;}' +
        '.exp-rhk-title{text-align:center;font-size:11pt;font-weight:bold;margin-bottom:10px;}' +
        '.exp-table{width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;}' +
        '.exp-table th{background-color:#0F766E;color:#fff;padding:8px 6px;border:1px solid #0A5C56;text-align:center;font-weight:bold;font-size:9.5pt;}' +
        '.exp-table td{padding:6px;border:1px solid #444;text-align:center;vertical-align:top;font-size:10pt;}' +
        '.exp-table tr:nth-child(even) td{background-color:#f9f9f9;}' +
        '.exp-table img{max-width:140px;max-height:90px;margin:2px;}' +
        '</style></head><body>' + h + '</body></html>';

    var blob = new Blob(['\ufeff', full], { type: 'application/msword' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'Logbook_RHK_' + currentRHK + '.doc';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('Word RHK ' + currentRHK + ' berhasil di-export');
});

/* ==============================================
   TOAST
   ============================================== */
function showToast(msg) {
    var old = document.querySelector('.toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () {
        requestAnimationFrame(function () { t.classList.add('show'); });
    });
    setTimeout(function () {
        t.classList.remove('show');
        setTimeout(function () { t.remove(); }, 400);
    }, 2600);
}

/* ==============================================
   UTILITAS
   ============================================== */
function escHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}