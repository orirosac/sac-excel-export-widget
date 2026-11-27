
/* ORIOR SAC Flat Excel Export Widget */

(function () {

  const XLSX_URL =
    "https://orirosac.github.io/sac-excel-export-widget/src/xlsx.full.min.js";

  let xlsxLoading = null;

  //====================================================
  // SHEETJS LADEN
  //====================================================

  function loadXLSX() {

    if (window.XLSX) {
      return Promise.resolve(window.XLSX);
    }

    if (xlsxLoading) {
      return xlsxLoading;
    }

    xlsxLoading = new Promise((resolve, reject) => {

      const script = document.createElement("script");
      script.src = XLSX_URL;

      script.onload = () => {
        if (window.XLSX) {
          resolve(window.XLSX);
        } else {
          reject(new Error("SheetJS konnte nicht initialisiert werden."));
        }
      };

      script.onerror = () => {
        reject(new Error("SheetJS konnte nicht geladen werden."));
      };

      document.head.appendChild(script);
    });

    return xlsxLoading;
  }

  //====================================================
  // WIDGET DESIGN
  //====================================================

  const template = document.createElement("template");

  template.innerHTML = `
    <style>
      :host {
        display: block;
        font-family: Arial, sans-serif;
      }

      button {
        width: 100%;
        padding: 10px 14px;
        background: #EBF8FF;
        color: #063D75;
        border: 1px solid #8BB9E5;
        border-radius: 5px;
        cursor: pointer;
      }

      button:disabled {
        opacity: 0.6;
        cursor: wait;
      }
    </style>

    <button type="button">Excel exportieren</button>
  `;

  //====================================================
  // CUSTOM WIDGET
  //====================================================

  class FlatExcelExport extends HTMLElement {

    constructor() {
      super();

      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(
        template.content.cloneNode(true)
      );

      this._payload = "";
      this._fileName = "sac-export.xlsx";

      this._button = this.shadowRoot.querySelector("button");

      this._button.addEventListener("click", () => {
        this.exportExcel();
      });
    }

    //==================================================
    // SAC EIGENSCHAFTEN
    //==================================================

    onCustomWidgetAfterUpdate(changedProperties) {

      if (Object.prototype.hasOwnProperty.call(
        changedProperties, "payload"
      )) {
        this._payload = changedProperties.payload;
      }

      if (Object.prototype.hasOwnProperty.call(
        changedProperties, "fileName"
      )) {
        this._fileName = changedProperties.fileName;
      }
    }

    //==================================================
    // EXCEL EXPORT
    //==================================================

    async exportExcel() {

      this._button.disabled = true;

      try {

        const XLSX = await loadXLSX();

        const payload =
          typeof this._payload === "string"
            ? JSON.parse(this._payload)
            : this._payload;

        if (
          !payload ||
          !Array.isArray(payload.columns) ||
          !Array.isArray(payload.rows)
        ) {
          throw new Error(
            "Ungültige Exportdaten. Erwartet: columns und rows."
          );
        }

        const keys = payload.columns.map(c => c.key);

        const headings = payload.columns.map(
          c => c.label || c.key
        );

        // Eine einzige Kopfzeile
        const aoa = [headings];

        for (const row of payload.rows) {

          aoa.push(keys.map(k => {

            const value = row[k];

            if (value == null) {
              return "";
            }

            // Schutz vor Excel-Formeln aus Textwerten
            if (
              typeof value === "string" &&
              /^[\s]*[=+@-]/.test(value)
            ) {
              return "'" + value;
            }

            return value;
          }));
        }

        // Excel-Datei erstellen
        const workbook = XLSX.utils.book_new();

        const worksheet = XLSX.utils.aoa_to_sheet(aoa);

        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          "Export"
        );

        XLSX.writeFile(
          workbook,
          this._fileName || "sac-export.xlsx"
        );

      } catch (error) {

        console.error("Excel Export Fehler:", error);

        this.dispatchEvent(
          new CustomEvent("onExportError", {
            detail: {
              message: String(error.message || error)
            }
          })
        );

      } finally {

        this._button.disabled = false;
      }
    }
  }

  customElements.define(
    "orior-flat-excel-export",
    FlatExcelExport
  );

})();
