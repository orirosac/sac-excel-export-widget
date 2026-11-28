
/* SAC Flat Excel Export Widget */

(function () {
  "use strict";

  const XLSX_URL =
    "https://orirosac.github.io/sac-excel-export-widget/src/xlsx.full.min.js";

  let xlsxLoading = null;

  // SHEETJS LADEN
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
          reject(new Error("SheetJS konnte nicht geladen werden."));
        }
      };

      script.onerror = () => {
        reject(new Error("SheetJS konnte nicht geladen werden."));
      };

      document.head.appendChild(script);

    }).catch(error => {
      xlsxLoading = null;
      throw error;
    });

    return xlsxLoading;
  }

  // WIDGET DESIGN
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

  // CUSTOM WIDGET
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

    // DATEN AUS SAC
    setPayload(payload) {
      this._payload = payload;
    }

    // DATEINAME AUS SAC
    setFileName(fileName) {
      this._fileName = fileName || "sac-export.xlsx";
    }

    // SAC EIGENSCHAFTEN
    onCustomWidgetAfterUpdate(changedProperties) {

      if (
        Object.prototype.hasOwnProperty.call(
          changedProperties, "payload"
        )
      ) {
        this.setPayload(changedProperties.payload);
      }

      if (
        Object.prototype.hasOwnProperty.call(
          changedProperties, "fileName"
        )
      ) {
        this.setFileName(changedProperties.fileName);
      }
    }

    // EXCEL EXPORT
    async exportExcel() {

      if (this._button.disabled) {
        return;
      }

      this._button.disabled = true;

      try {

        if (!this._payload) {
          throw new Error("Keine Exportdaten vorhanden.");
        }

        const payload =
          typeof this._payload === "string"
            ? JSON.parse(this._payload)
            : this._payload;

        if (
          !payload ||
          !Array.isArray(payload.columns) ||
          !Array.isArray(payload.rows)
        ) {
          throw new Error("Ungueltige Exportdaten.");
        }

        const keys = payload.columns.map(c => c.key);

        const headings = payload.columns.map(
          c => c.label || c.key
        );

        const aoa = [headings];

        for (const row of payload.rows) {

          aoa.push(keys.map(key => {

            const value = row[key];

            if (value == null) {
              return "";
            }

            if (typeof value === "string") {

              // EINZELNER BINDESTRICH
              if (value.trim() === "-") {
                return "-";
              }

              // EXCEL-FORMELSCHUTZ
              if (/^\s*[=+@-]/.test(value)) {
                return "'" + value;
              }
            }

            return value;
          }));
        }

        // EXCEL ERSTELLEN
        const XLSX = await loadXLSX();

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(aoa);

        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          "Export"
        );

        // AKTUELLES DATUM
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        const dateString = `${year}-${month}-${day}`;

        // DATEINAME OHNE DOPPELTES .XLSX
        const baseName = (this._fileName || "sac-export.xlsx")
          .replace(/\.xlsx$/i, "");

        const fileName = `${baseName}_${dateString}.xlsx`;

        // DOWNLOAD
        XLSX.writeFile(workbook, fileName);

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

  if (!customElements.get("orior-flat-excel-export")) {
    customElements.define(
      "orior-flat-excel-export",
      FlatExcelExport
    );
  }

})();
