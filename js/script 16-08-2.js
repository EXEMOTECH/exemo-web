const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".main-nav");

if (menuButton && navigation) {
  menuButton.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navigation.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    });
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

const year = document.querySelector("#current-year");
if (year) {
  year.textContent = new Date().getFullYear();
}


const siteHeader = document.querySelector(".site-header");
if (siteHeader) {
  const updateHeader = () => {
    siteHeader.classList.toggle("scrolled", window.scrollY > 20);
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}


document.querySelectorAll("[data-counter]").forEach((counter) => {
  const target = Number(counter.dataset.counter);
  let started = false;

  const counterObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting || started) return;
      started = true;
      const start = performance.now();
      const duration = 1100;

      const animate = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        counter.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
      counterObserver.disconnect();
    },
    { threshold: 0.6 }
  );

  counterObserver.observe(counter);
});

const contactForm = document.querySelector("#contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(contactForm);
    const subject = encodeURIComponent(
      `Solicitud web EXEMO Tech — ${data.get("service") || "Consulta"}`
    );
    const body = encodeURIComponent(
      `Nombre: ${data.get("name") || ""}\n` +
      `Empresa: ${data.get("company") || ""}\n` +
      `Correo: ${data.get("email") || ""}\n` +
      `Teléfono: ${data.get("phone") || ""}\n` +
      `Servicio: ${data.get("service") || ""}\n\n` +
      `${data.get("message") || ""}`
    );

    const status = contactForm.querySelector(".form-status");
    status.textContent = "Abriendo tu aplicación de correo…";
    window.location.href = `mailto:info@exemo.es?subject=${subject}&body=${body}`;
  });
}

// V9 — selección, validación y vista previa de facturas.
const invoiceInput = document.querySelector("#invoice-file");
const invoiceDropZone = document.querySelector("#invoice-drop-zone");
const invoicePreview = document.querySelector("#invoice-preview");
const invoicePreviewFrame = document.querySelector("#invoice-preview-frame");
const invoiceFileName = document.querySelector("#invoice-file-name");
const invoiceFileMeta = document.querySelector("#invoice-file-meta");
const invoiceFeedback = document.querySelector("#file-feedback");
const removeInvoiceButton = document.querySelector("#remove-invoice");
const invoiceConsent = document.querySelector("#invoice-consent");
const processInvoiceButton = document.querySelector("#process-invoice");
const ocrStatus = document.querySelector("#ocr-status");

if (invoiceInput && invoiceDropZone) {
  const MAX_FILE_SIZE = 15 * 1024 * 1024;
  const allowedExtensions = ["pdf", "jpg", "jpeg", "png", "bmp", "tif", "tiff", "webp"];
  let selectedInvoice = null;
  let previewUrl = null;

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  };

  const updateProcessState = () => {
    processInvoiceButton.disabled = !(selectedInvoice && invoiceConsent.checked);
  };

  const clearPreviewUrl = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
  };

  const resetInvoice = () => {
    selectedInvoice = null;
    invoiceInput.value = "";
    clearPreviewUrl();
    invoicePreview.hidden = true;
    invoicePreviewFrame.replaceChildren();
    invoiceFileName.textContent = "";
    invoiceFileMeta.textContent = "";
    invoiceFeedback.textContent = "";
    ocrStatus.textContent = "";
    updateProcessState();
  };

  const renderPreview = (file, extension) => {
    clearPreviewUrl();
    invoicePreviewFrame.replaceChildren();
    previewUrl = URL.createObjectURL(file);

    if (file.type.startsWith("image/") || ["jpg", "jpeg", "png", "bmp", "tif", "tiff", "webp"].includes(extension)) {
      const image = document.createElement("img");
      image.src = previewUrl;
      image.alt = `Vista previa de ${file.name}`;
      image.addEventListener("error", () => {
        invoicePreviewFrame.innerHTML = '<div class="generic-preview"><strong>Imagen seleccionada</strong><span>El navegador no puede previsualizar este formato, pero el archivo es válido.</span></div>';
      });
      invoicePreviewFrame.append(image);
      return;
    }

    if (extension === "pdf") {
      const frame = document.createElement("iframe");
      frame.src = previewUrl;
      frame.title = `Vista previa de ${file.name}`;
      invoicePreviewFrame.append(frame);
      return;
    }

    invoicePreviewFrame.innerHTML = '<div class="generic-preview"><strong>Documento preparado</strong><span>Archivo válido para su posterior tratamiento OCR.</span></div>';
  };

  const selectInvoice = (file) => {
    invoiceFeedback.textContent = "";
    ocrStatus.textContent = "";

    if (!file) return;

    const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
    if (!allowedExtensions.includes(extension)) {
      resetInvoice();
      invoiceFeedback.textContent = "Formato no admitido. Utiliza PDF, JPG, PNG, BMP, TIFF o WEBP.";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      resetInvoice();
      invoiceFeedback.textContent = "El archivo supera el límite de 15 MB.";
      return;
    }

    if (file.size === 0) {
      resetInvoice();
      invoiceFeedback.textContent = "El archivo está vacío.";
      return;
    }

    selectedInvoice = file;
    invoiceFileName.textContent = file.name;
    invoiceFileMeta.textContent = `${extension.toUpperCase()} · ${formatBytes(file.size)}`;
    invoicePreview.hidden = false;
    renderPreview(file, extension);
    updateProcessState();
  };

  invoiceInput.addEventListener("change", () => selectInvoice(invoiceInput.files?.[0]));
  invoiceConsent.addEventListener("change", updateProcessState);
  removeInvoiceButton.addEventListener("click", resetInvoice);

  invoiceDropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      invoiceInput.click();
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    invoiceDropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      invoiceDropZone.classList.add("drag-active");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    invoiceDropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      invoiceDropZone.classList.remove("drag-active");
    });
  });

  invoiceDropZone.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    selectInvoice(file);
  });

  const OCR_BASE_URL = "https://exemo-ocr.old-night-9cc3.workers.dev";
  const OCR_ENDPOINT = `${OCR_BASE_URL}/ocr`;
  const SAVE_ENDPOINT = `${OCR_BASE_URL}/save-invoice`;
  let latestOcrPayload = null;
  let latestDetectedInvoice = null;

  const getAzureFieldValue = (field) => {
    if (!field) return "";
    if (field.valueCurrency && typeof field.valueCurrency.amount === "number") {
      const currency = field.valueCurrency.currencyCode || "EUR";
      return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(field.valueCurrency.amount);
    }
    if (field.valueDate) return field.valueDate;
    if (field.valueNumber !== undefined) return String(field.valueNumber);
    if (field.valueString) return field.valueString;
    if (field.content) return field.content;
    return "";
  };

  const getAzureNumber = (field) => {
    if (!field) return null;
    if (field.valueCurrency && typeof field.valueCurrency.amount === "number") {
      return field.valueCurrency.amount;
    }
    if (typeof field.valueNumber === "number") return field.valueNumber;
    const raw = field.content || field.valueString || "";
    if (!raw) return null;
    const normalized = String(raw)
      .replace(/\s/g, "")
      .replace(/[€$£]/g, "")
      .replace(/\.(?=\d{3}(?:\D|$))/g, "")
      .replace(",", ".")
      .replace(/[^0-9.-]/g, "");
    const value = Number.parseFloat(normalized);
    return Number.isFinite(value) ? value : null;
  };

  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const detectInvoiceData = (payload) => {
    const analyzeResult = payload?.result?.analyzeResult;
    const invoiceDocument = analyzeResult?.documents?.[0];
    const fields = invoiceDocument?.fields || {};
    const fullText = analyzeResult?.content || "";

    const cupsMatch = fullText.match(/\bES[A-Z0-9]{18,24}\b/i);
    const taxIdMatch = fullText.match(/\b(?:[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]|\d{8}[A-Z]|[XYZ]\d{7}[A-Z])\b/i);
    const gasTariffMatch = fullText.match(/\bRL\.?\s*\d{1,2}\b/i);
    const electricityTariffMatch = fullText.match(/\b(?:2\.0TD|3\.0TD|6\.1TD|6\.2TD|6\.3TD|6\.4TD)\b/i);
    const lowerText = fullText.toLowerCase();
    const supplyType = /gas natural|peaje de gas|kwh gas|rl\.?\s*\d/.test(lowerText)
      ? "gas"
      : "electricity";

    return {
      supplier: getAzureFieldValue(fields.VendorName),
      customerName: getAzureFieldValue(fields.CustomerName) || "Cliente sin identificar",
      customerTaxId: taxIdMatch?.[0]?.toUpperCase() || null,
      cups: cupsMatch?.[0]?.toUpperCase() || "",
      invoiceNumber: getAzureFieldValue(fields.InvoiceId),
      issueDate: getAzureFieldValue(fields.InvoiceDate),
      periodStart: getAzureFieldValue(fields.ServiceStartDate),
      periodEnd: getAzureFieldValue(fields.ServiceEndDate),
      subtotal: getAzureNumber(fields.SubTotal),
      taxes: getAzureNumber(fields.TotalTax),
      total: getAzureNumber(fields.InvoiceTotal),
      currency: fields.InvoiceTotal?.valueCurrency?.currencyCode || "EUR",
      supplyType,
      tariff: (gasTariffMatch?.[0] || electricityTariffMatch?.[0] || "").replace(/\s+/g, ""),
      originalFilename: payload?.filename || selectedInvoice?.name || "factura",
      documentType: "invoice",
      address: getAzureFieldValue(fields.ServiceAddress) || getAzureFieldValue(fields.CustomerAddress),
      postalCode: null,
      city: null,
      distributor: null,
      consumptions: [],
      powers: [],
      charges: [],
      azureRaw: payload?.result || {}
    };
  };

  const formatMoney = (value, currency = "EUR") => {
    if (typeof value !== "number" || !Number.isFinite(value)) return "";
    return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value);
  };

  const showOcrResult = (payload) => {
    let resultPanel = document.querySelector("#ocr-result-panel");
    if (!resultPanel) {
      resultPanel = document.createElement("div");
      resultPanel.id = "ocr-result-panel";
      resultPanel.className = "ocr-result-panel";
      ocrStatus.insertAdjacentElement("afterend", resultPanel);
    }

    latestOcrPayload = payload;
    latestDetectedInvoice = detectInvoiceData(payload);
    const invoice = latestDetectedInvoice;

    const rows = [
      ["Proveedor", invoice.supplier],
      ["Cliente", invoice.customerName],
      ["CUPS detectado", invoice.cups],
      ["Número de factura", invoice.invoiceNumber],
      ["Fecha", invoice.issueDate],
      ["Tarifa", invoice.tariff],
      ["Subtotal", formatMoney(invoice.subtotal, invoice.currency)],
      ["Impuestos", formatMoney(invoice.taxes, invoice.currency)],
      ["Total", formatMoney(invoice.total, invoice.currency)]
    ].filter(([, value]) => value !== null && value !== undefined && value !== "");

    if (rows.length === 0) {
      resultPanel.innerHTML = `
        <strong>Análisis completado</strong>
        <p>Azure ha leído el documento, pero no ha identificado campos estructurados suficientes para guardarlo.</p>
      `;
      return;
    }

    resultPanel.innerHTML = `
      <div class="ocr-result-heading">
        <strong>Datos detectados</strong>
        <span>Revísalos antes de guardarlos.</span>
      </div>
      <dl class="ocr-result-grid">
        ${rows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
      </dl>
      <div class="customer-type-box">
        <label><input type="radio" name="customerType" value="empresa"> Empresa</label>
        <label><input type="radio" name="customerType" value="particular"> Particular</label>
      </div>
      <div id="rgpd-container" style="display:none;margin:12px 0;">
        <input id="rgpdNombre" placeholder="Nombre y apellidos">
        <input id="rgpdDni" placeholder="DNI">
        <input id="rgpdEmail" placeholder="Email">
        <input id="rgpdTelefono" placeholder="Teléfono">
      </div>
      <button class="button invoice-save" id="save-invoice" type="button">
        Confirmar y guardar
      </button>
      <p class="ocr-save-status" id="ocr-save-status" role="status" aria-live="polite"></p>
    `;

    const saveButton = resultPanel.querySelector("#save-invoice");
    const saveStatus = resultPanel.querySelector("#ocr-save-status");

    resultPanel.querySelectorAll('input[name="customerType"]').forEach(r=>{
      r.addEventListener("change",()=>{
        const rgpd=resultPanel.querySelector("#rgpd-container");
        if(r.value==="particular"){ rgpd.style.display="block"; }
        else { rgpd.style.display="none"; }
      });
    });

    saveButton.addEventListener("click", async () => {
      if (!latestDetectedInvoice || !latestOcrPayload) return;

      if (!latestDetectedInvoice.cups) {
        saveStatus.textContent = "No se puede guardar: Azure no ha detectado el CUPS.";
        return;
      }

      const originalText = saveButton.textContent;
      saveButton.disabled = true;
      saveButton.textContent = "Guardando…";
      saveStatus.textContent = "Guardando la factura en la base de datos de EXEMO…";

      try {
        const response = await fetch(SAVE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(latestDetectedInvoice)
        });

        let result;
        try {
          result = await response.json();
        } catch {
          throw new Error(`El servidor devolvió una respuesta no válida (${response.status}).`);
        }

        if (!response.ok) {
          if (response.status === 409) {
            throw new Error("Esta factura ya estaba guardada en la base de datos.");
          }
          const detail = result?.details ? ` ${result.details}` : "";
          throw new Error(`${result?.error || "No se pudo guardar la factura."}${detail}`);
        }

        saveStatus.textContent = `Factura guardada correctamente. ID: ${result.invoiceId}`;
        saveButton.textContent = "Factura guardada";
        saveButton.disabled = true;
      } catch (error) {
        console.error("Error guardando factura EXEMO:", error);
        saveStatus.textContent = error instanceof Error ? error.message : "No se pudo guardar la factura.";
        saveButton.disabled = false;
        saveButton.textContent = originalText;
      }
    });
  };

  processInvoiceButton.addEventListener("click", async () => {
    if (!selectedInvoice || !invoiceConsent.checked) return;

    const originalText = processInvoiceButton.textContent;
    processInvoiceButton.disabled = true;
    processInvoiceButton.textContent = "Analizando factura…";
    ocrStatus.textContent = "Enviando la factura de forma segura al OCR de EXEMO…";
    invoiceFeedback.textContent = "";

    const previousPanel = document.querySelector("#ocr-result-panel");
    if (previousPanel) previousPanel.remove();
    latestOcrPayload = null;
    latestDetectedInvoice = null;

    try {
      const formData = new FormData();
      formData.append("invoice", selectedInvoice, selectedInvoice.name);

      const response = await fetch(OCR_ENDPOINT, {
        method: "POST",
        body: formData
      });

      let payload;
      try {
        payload = await response.json();
      } catch {
        throw new Error(`El servidor OCR devolvió una respuesta no válida (${response.status}).`);
      }

      if (!response.ok) {
        const detail = payload?.details ? ` ${payload.details}` : "";
        throw new Error(`${payload?.error || "No se pudo analizar la factura."}${detail}`);
      }

      console.log("Resultado OCR EXEMO:", payload);
      ocrStatus.textContent = "Factura analizada correctamente. Revisa los datos detectados.";
      showOcrResult(payload);
    } catch (error) {
      console.error("Error OCR EXEMO:", error);
      ocrStatus.textContent = error instanceof Error ? error.message : "No se pudo analizar la factura.";
    } finally {
      processInvoiceButton.textContent = originalText;
      updateProcessState();
    }
  });
}

/* ============================================================
   EXEMO RGPD - FIRMA TACTIL v13
   Integración sobre el script.js original.
   ============================================================ */
(function initExemoSignature() {
  let signaturePad = null;

  function loadSignaturePad() {
    if (window.SignaturePad) {
      setupSignaturePad();
      return;
    }
    if (document.getElementById("exemo-signaturepad-script")) return;

    const script = document.createElement("script");
    script.id = "exemo-signaturepad-script";
    script.src = "https://cdn.jsdelivr.net/npm/signature_pad@4.2.0/dist/signature_pad.umd.min.js";
    script.onload = setupSignaturePad;
    script.onerror = () => console.error("EXEMO: no se pudo cargar SignaturePad.");
    document.head.appendChild(script);
  }

  function setupSignaturePad() {
    const canvas = document.getElementById("signature-pad");
    if (!canvas || !window.SignaturePad || signaturePad) return;

    signaturePad = new window.SignaturePad(canvas, {
      backgroundColor: "rgb(255,255,255)",
      penColor: "rgb(20,20,20)"
    });

    const clearButton = document.getElementById("clearSignatureBtn");
    if (clearButton && clearButton.dataset.exemoBound !== "1") {
      clearButton.dataset.exemoBound = "1";
      clearButton.addEventListener("click", () => signaturePad.clear());
    }

    window.exemoGetSignature = () =>
      signaturePad && !signaturePad.isEmpty()
        ? signaturePad.toDataURL("image/png")
        : null;
  }

  function refresh() {
    const selected = document.querySelector('input[name="customerType"]:checked');
    const rgpd = document.getElementById("rgpd-container");

    if (rgpd && selected) {
      rgpd.style.display = selected.value === "particular" ? "block" : "none";
    }

    if (selected?.value === "particular") {
      setTimeout(loadSignaturePad, 0);
    }

    const saveButton = document.getElementById("saveInvoiceBtn");
    if (saveButton && saveButton.dataset.exemoSignatureBound !== "1") {
      saveButton.dataset.exemoSignatureBound = "1";
      saveButton.addEventListener("click", event => {
        const current = document.querySelector('input[name="customerType"]:checked');
        if (current?.value !== "particular") return;

        const signature = window.exemoGetSignature ? window.exemoGetSignature() : null;
        if (!signature) {
          event.preventDefault();
          event.stopImmediatePropagation();
          alert("Para continuar, el cliente particular debe firmar el consentimiento.");
          return false;
        }
        window.exemoFirmaRGPD = signature;
      }, true);
    }
  }

  const start = () => {
    new MutationObserver(refresh).observe(document.body, { childList: true, subtree: true });
    refresh();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
