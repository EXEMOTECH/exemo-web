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
