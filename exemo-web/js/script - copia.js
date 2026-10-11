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

  const OCR_ENDPOINT = "https://exemo-ocr.old-night-9cc3.workers.dev/ocr";

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

  const showOcrResult = (payload) => {
    let resultPanel = document.querySelector("#ocr-result-panel");
    if (!resultPanel) {
      resultPanel = document.createElement("div");
      resultPanel.id = "ocr-result-panel";
      resultPanel.className = "ocr-result-panel";
      ocrStatus.insertAdjacentElement("afterend", resultPanel);
    }

    const analyzeResult = payload?.result?.analyzeResult;
    const invoiceDocument = analyzeResult?.documents?.[0];
    const fields = invoiceDocument?.fields || {};

    const rows = [
      ["Proveedor", getAzureFieldValue(fields.VendorName)],
      ["Cliente", getAzureFieldValue(fields.CustomerName)],
      ["Número de factura", getAzureFieldValue(fields.InvoiceId)],
      ["Fecha", getAzureFieldValue(fields.InvoiceDate)],
      ["Vencimiento", getAzureFieldValue(fields.DueDate)],
      ["Subtotal", getAzureFieldValue(fields.SubTotal)],
      ["Impuestos", getAzureFieldValue(fields.TotalTax)],
      ["Total", getAzureFieldValue(fields.InvoiceTotal)]
    ].filter(([, value]) => value);

    const fullText = analyzeResult?.content || "";
    const cupsMatch = fullText.match(/\bES\d{16}[A-Z0-9]{2}\b/i);
    if (cupsMatch) rows.splice(2, 0, ["CUPS detectado", cupsMatch[0].toUpperCase()]);

    if (rows.length === 0) {
      resultPanel.innerHTML = `
        <strong>Análisis completado</strong>
        <p>Azure ha leído el documento, pero no ha identificado campos de factura estructurados. El resultado completo está disponible en la consola del navegador.</p>
      `;
      return;
    }

    resultPanel.innerHTML = `
      <div class="ocr-result-heading">
        <strong>Datos detectados</strong>
        <span>Revísalos antes de guardarlos.</span>
      </div>
      <dl class="ocr-result-grid">
        ${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${String(value).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</dd></div>`).join("")}
      </dl>
    `;
  };

  processInvoiceButton.addEventListener("click", async () => {
    if (!selectedInvoice || !invoiceConsent.checked) return;

    const originalText = processInvoiceButton.textContent;
    processInvoiceButton.disabled = true;
    processInvoiceButton.textContent = "Analizando factura…";
    ocrStatus.textContent = "Enviando la factura de forma segura al OCR de EXEMO…";
    invoiceFeedback.textContent = "";

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
