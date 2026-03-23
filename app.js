// ===== Invoice App =====
(function () {
  'use strict';

  // --- State ---
  const state = {
    currency: 'EUR',
    currencySymbol: '€',
    logo: null,
    invoiceTitle: 'INVOICE',
    invoiceNumber: '201',
    fromName: 'Saransh Sharma',
    fromAddress: 'Romain-Rolland-Str. 69\n13089 Berlin',
    billToLabel: 'Bill To:',
    billToName: 'RISE FX GmbH',
    billToAddress: 'Schlesische Str. 28\n10997 Berlin',
    date: '2022-09-01',
    taxOffice: 'Pankow, Berlin',
    dueDate: '2022-09-15',
    taxNumber: '431/ 261/ 58104',
    taxPercent: 0,
    items: [
      {
        description: 'Motion Design for Project - Blue Beetle (From 22nd August to 31st August)',
        days: 8,
        rate: 375,
        amount: 3000,
      },
    ],
    bankName: 'Taunus Sparkasse',
    bankIBAN: 'DE67512500000055479925',
    bankBIC: 'HELADEF1TSK',
    bankHolder: 'Saransh Sharma',
    paypalEmail: '',
    colItem: 'Item',
    colQty: 'Days',
    colRate: 'Daily Rate',
    terms: 'I charge no tax, because I have a small business and I succumb the §19 Kleinunternehmerregelung',
  };

  // --- DOM refs ---
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // --- Currency ---
  function setCurrency(cur) {
    state.currency = cur;
    state.currencySymbol = cur === 'EUR' ? '€' : '$';
    $$('.currency-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.cur === cur);
    });
    renderPreview();
    recalcItems();
    saveState();
  }

  function formatMoney(val) {
    const num = parseFloat(val) || 0;
    return state.currencySymbol + num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // --- Logo ---
  function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      state.logo = ev.target.result;
      renderLogoUploadArea();
      renderPreview();
      saveState();
    };
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    state.logo = null;
    $('#logo-input').value = '';
    renderLogoUploadArea();
    renderPreview();
    saveState();
  }

  function renderLogoUploadArea() {
    const area = $('.logo-upload-area');
    const removeBtn = $('.remove-logo-btn');
    if (state.logo) {
      area.innerHTML = `<img src="${state.logo}" alt="Logo"><input type="file" id="logo-input" accept="image/*">`;
      removeBtn.style.display = 'inline-block';
      $('#logo-input').addEventListener('change', handleLogoUpload);
    } else {
      area.innerHTML = `<div class="upload-icon">🖼️</div><div class="upload-text">Click to upload logo</div><input type="file" id="logo-input" accept="image/*">`;
      removeBtn.style.display = 'none';
      $('#logo-input').addEventListener('change', handleLogoUpload);
    }
  }

  function recalcItems() {
    state.items.forEach((item) => {
      item.amount = (parseFloat(item.days) || 0) * (parseFloat(item.rate) || 0);
    });
    renderLineItems();
    renderPreview();
    saveState();
  }

  function addItem() {
    state.items.push({ description: '', days: 0, rate: 0, amount: 0 });
    renderLineItems();
    renderPreview();
    saveState();
  }

  function removeItem(index) {
    if (state.items.length <= 1) return;
    state.items.splice(index, 1);
    renderLineItems();
    renderPreview();
    saveState();
  }

  function renderLineItems() {
    const container = $('#line-items-container');
    container.innerHTML = '';
    state.items.forEach((item, i) => {
      const row = document.createElement('div');
      row.className = 'line-item-row';
      row.innerHTML = `
        <input type="text" class="item-desc" placeholder="Item description" value="${escapeHtml(item.description)}" data-idx="${i}" data-field="description">
        <div class="item-numbers">
          <div class="form-group">
            <label>${escapeHtml(state.colQty)}</label>
            <input type="number" min="0" step="1" value="${item.days}" data-idx="${i}" data-field="days">
          </div>
          <div class="form-group">
            <label>${escapeHtml(state.colRate)} (${state.currencySymbol})</label>
            <input type="number" min="0" step="0.01" value="${item.rate}" data-idx="${i}" data-field="rate">
          </div>
          <div class="form-group">
            <label>Amount</label>
            <input type="text" readonly value="${formatMoney(item.amount)}">
          </div>
        </div>
        ${state.items.length > 1 ? `<button class="remove-item-btn" data-idx="${i}" title="Remove item">×</button>` : ''}
      `;
      container.appendChild(row);
    });

    // Bind events
    container.querySelectorAll('input[data-field]').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        const field = e.target.dataset.field;
        if (field === 'description') {
          state.items[idx].description = e.target.value;
          renderPreview();
          saveState();
        } else {
          state.items[idx][field] = parseFloat(e.target.value) || 0;
          recalcItems();
        }
      });
    });

    container.querySelectorAll('.remove-item-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        removeItem(parseInt(e.target.dataset.idx));
      });
    });
  }

  // --- Calculations ---
  function getSubtotal() {
    return state.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  }

  function getTax() {
    return getSubtotal() * ((parseFloat(state.taxPercent) || 0) / 100);
  }

  function getTotal() {
    return getSubtotal() + getTax();
  }

  // --- Render Preview ---
  function renderPreview() {
    // Logo
    const logoEl = $('#inv-logo');
    if (state.logo) {
      logoEl.innerHTML = `<img src="${state.logo}" alt="Logo">`;
    } else {
      logoEl.innerHTML = `<div class="inv-logo-placeholder">No Logo</div>`;
    }

    // Title & Number
    $('#inv-title').textContent = state.invoiceTitle;
    $('#inv-number').textContent = '# ' + state.invoiceNumber;

    // From
    $('#inv-from-name').textContent = state.fromName;
    $('#inv-from-addr').textContent = state.fromAddress;

    // Bill To
    $('#inv-bill-to-name').textContent = state.billToName;
    $('#inv-bill-to-addr').textContent = state.billToAddress;

    // Meta fields
    $('#inv-date').textContent = formatDate(state.date);
    $('#inv-tax-office').textContent = state.taxOffice;
    $('#inv-due-date').textContent = formatDate(state.dueDate);
    $('#inv-tax-number').textContent = state.taxNumber;

    // Balance Due
    $('#inv-balance-due').textContent = formatMoney(getTotal());

    // Column headers
    $('#inv-th-item').textContent = state.colItem;
    $('#inv-th-qty').textContent = state.colQty;
    $('#inv-th-rate').textContent = state.colRate;

    // Table rows
    const tbody = $('#inv-table-body');
    tbody.innerHTML = '';
    state.items.forEach((item) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(item.description)}</td>
        <td>${item.days}</td>
        <td>${formatMoney(item.rate)}</td>
        <td>${formatMoney(item.amount)}</td>
      `;
      tbody.appendChild(tr);
    });

    // Totals
    $('#inv-subtotal').textContent = formatMoney(getSubtotal());
    $('#inv-tax-label').textContent = `Tax (${state.taxPercent}%):`;
    $('#inv-tax-amount').textContent = formatMoney(getTax());
    $('#inv-total').textContent = formatMoney(getTotal());

    // Bank Details
    $('#inv-bank-details').innerHTML = `
      Bank - ${escapeHtml(state.bankName)}<br>
      IBAN - ${escapeHtml(state.bankIBAN)}<br>
      BIC - ${escapeHtml(state.bankBIC)}<br>
      Name - ${escapeHtml(state.bankHolder)}
    `;

    // PayPal
    const paypalSection = $('#inv-paypal-section');
    if (state.paypalEmail && state.paypalEmail.trim()) {
      paypalSection.style.display = 'block';
      $('#inv-paypal-email').textContent = state.paypalEmail;
    } else {
      paypalSection.style.display = 'none';
    }

    // Terms
    $('#inv-terms-text').textContent = state.terms;
  }

  // --- PDF Download ---
  async function downloadPDF() {
    const btn = $('.download-btn');
    btn.classList.add('downloading');
    btn.innerHTML = '<span class="downloading-indicator">⏳</span> Generating PDF...';

    try {
      const element = $('.invoice-paper');
      const opt = {
        margin: [10, 0, 10, 0],
        filename: `Invoice_${state.invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      const blob = await html2pdf().set(opt).from(element).outputPdf('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${state.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Error generating PDF. Please try again.');
    }

    btn.classList.remove('downloading');
    btn.innerHTML = '📄 Download PDF';
  }

  // --- State Persistence ---
  const STORAGE_KEY = 'invoice_state';

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* quota exceeded, ignore */ }
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach((key) => {
          if (key in state) state[key] = parsed[key];
        });
      }
    } catch (e) { /* corrupt data, ignore */ }
  }

  // --- Helpers ---
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function bindInput(selector, stateKey, isNumber) {
    const el = $(selector);
    if (!el) return;
    el.value = state[stateKey];
    el.addEventListener('input', (e) => {
      state[stateKey] = isNumber ? parseFloat(e.target.value) || 0 : e.target.value;
      if (stateKey === 'taxPercent') recalcItems();
      else if (stateKey === 'colQty' || stateKey === 'colRate') { renderLineItems(); renderPreview(); }
      else renderPreview();
      saveState();
    });
  }

  // --- Init ---
  function init() {
    // Load saved state
    loadState();

    // Currency toggle
    $$('.currency-btn').forEach((btn) => {
      btn.addEventListener('click', () => setCurrency(btn.dataset.cur));
    });
    setCurrency(state.currency);

    // Logo
    renderLogoUploadArea();
    $('.logo-upload-area').addEventListener('click', () => {
      $('#logo-input').click();
    });
    $('.remove-logo-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      removeLogo();
    });

    // Bind text fields
    bindInput('#input-title', 'invoiceTitle');
    bindInput('#input-number', 'invoiceNumber');
    bindInput('#input-from-name', 'fromName');
    bindInput('#input-from-address', 'fromAddress');
    bindInput('#input-bill-to-name', 'billToName');
    bindInput('#input-bill-to-address', 'billToAddress');
    bindInput('#input-date', 'date');
    bindInput('#input-tax-office', 'taxOffice');
    bindInput('#input-due-date', 'dueDate');
    bindInput('#input-tax-number', 'taxNumber');
    bindInput('#input-tax-percent', 'taxPercent', true);
    bindInput('#input-bank-name', 'bankName');
    bindInput('#input-bank-iban', 'bankIBAN');
    bindInput('#input-bank-bic', 'bankBIC');
    bindInput('#input-bank-holder', 'bankHolder');
    bindInput('#input-paypal-email', 'paypalEmail');
    bindInput('#input-col-item', 'colItem');
    bindInput('#input-col-qty', 'colQty');
    bindInput('#input-col-rate', 'colRate');
    bindInput('#input-terms', 'terms');

    // Line items
    renderLineItems();
    $('#add-item-btn').addEventListener('click', addItem);

    // Download
    $('.download-btn').addEventListener('click', downloadPDF);

    // Initial render
    renderPreview();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
