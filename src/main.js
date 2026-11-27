/* SAC Custom Widget prototype. XLSX is loaded from a separately hosted, approved SheetJS build. */
(function () {
  const template = document.createElement('template');
  template.innerHTML = `<style>:host{display:block;font-family:Arial,sans-serif}button{width:100%;padding:10px 14px;background:#eaf5ff;color:#063d75;border:1px solid #8bb9e5;border-radius:5px;cursor:pointer}button:disabled{opacity:.6}</style><button type="button">Excel exportieren</button>`;
  class FlatExcelExport extends HTMLElement {
    constructor() {
      super(); this.attachShadow({mode:'open'}); this.shadowRoot.appendChild(template.content.cloneNode(true));
      this._payload = ''; this._fileName = 'sac-export.xlsx';
      this.shadowRoot.querySelector('button').addEventListener('click', () => this.exportExcel());
    }
    onCustomWidgetAfterUpdate(changedProperties) {
      if (Object.prototype.hasOwnProperty.call(changedProperties, 'payload')) this._payload = changedProperties.payload;
      if (Object.prototype.hasOwnProperty.call(changedProperties, 'fileName')) this._fileName = changedProperties.fileName;
    }
    exportExcel() {
      try {
        if (!window.XLSX) throw new Error('SheetJS XLSX library not loaded. Host and load an approved build before main.js.');
        const payload = typeof this._payload === 'string' ? JSON.parse(this._payload) : this._payload;
        if (!payload || !Array.isArray(payload.columns) || !Array.isArray(payload.rows)) throw new Error('Expected payload {columns:[{key,label}],rows:[...]}');
        const keys = payload.columns.map(c => c.key);
        const headings = payload.columns.map(c => c.label || c.key);
        const aoa = [headings];
        for (const row of payload.rows) aoa.push(keys.map(k => {
          const v = row[k];
          // Neutralize spreadsheet formula injection in user-provided strings.
          return typeof v === 'string' && /^[\s]*[=+@-]/.test(v) ? "'" + v : (v == null ? '' : v);
        }));
        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.aoa_to_sheet(aoa);
        XLSX.utils.book_append_sheet(workbook, sheet, 'Export');
        XLSX.writeFile(workbook, this._fileName || 'sac-export.xlsx');
      } catch (e) {
        console.error('Excel export failed', e);
        this.dispatchEvent(new CustomEvent('onExportError', {detail: {message: String(e.message || e)}}));
      }
    }
  }
  customElements.define('orior-flat-excel-export', FlatExcelExport);
})();
