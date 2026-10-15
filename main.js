const toggle = document.querySelector(".nav-toggle");
const menu = document.querySelector(".nav-links");

if (toggle && menu) {
  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

const items = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && items.length) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -60px" });
  items.forEach(item => observer.observe(item));
} else {
  items.forEach(item => item.classList.add("is-visible"));
}

/* ---- Additions ---- */
const EMAIL = "info@reimvibetechnologies.com";
const ENDPOINT = "https://formsubmit.co/ajax/" + EMAIL;

const header = document.querySelector(".site-header");
const backTop = document.querySelector(".back-top");
const toastEl = document.querySelector(".toast");
window.addEventListener("scroll", () => {
  if (header) header.classList.toggle("scrolled", window.scrollY > 10);
  if (backTop) backTop.hidden = window.scrollY < 600;
}, { passive: true });
if (backTop) backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

function toast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 3500);
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && menu && menu.classList.contains("is-open")) {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus();
  }
});

document.querySelectorAll(".insight-toggle").forEach(btn => {
  btn.addEventListener("click", () => {
    const more = btn.parentElement.querySelector(".insight-more");
    const open = more.hidden;
    more.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    btn.firstChild.textContent = open ? "Show less " : "Read more ";
  });
});

const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

async function submitForm(form, subject, onDone) {
  const status = form.querySelector(".form-status");
  const btn = form.querySelector("button[type=submit]");
  const data = Object.fromEntries(new FormData(form).entries());
  if (data._honey) return;                       // bot trap
  let ok = true;
  form.querySelectorAll("[required]").forEach(f => {
    const bad = !f.value.trim() || (f.type === "email" && !validEmail(f.value.trim())) || (f.minLength > 0 && f.value.trim().length < f.minLength);
    f.classList.toggle("invalid", bad);
    if (bad) ok = false;
  });
  if (!ok) { status.className = "form-status err"; status.textContent = "Please fill in the highlighted fields correctly."; return; }

  btn.disabled = true; status.className = "form-status"; status.textContent = "Sending...";
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ ...data, _subject: subject, _template: "table", _captcha: "false" })
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || out.success === "false") throw new Error("send failed");
    form.reset();
    status.className = "form-status ok";
    status.textContent = "Thank you! Your message has been sent. We will reply by email soon.";
    toast("Message sent");
    if (onDone) onDone();
  } catch (err) {
    // Fallback: open the visitor's email app with the message prefilled
    const body = Object.entries(data).filter(([k]) => !k.startsWith("_")).map(([k, v]) => k + ": " + v).join("\n");
    status.className = "form-status err";
    status.innerHTML = 'We could not send automatically. <a href="mailto:' + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body) + '" style="text-decoration:underline">Click here to send by email</a>.';
  } finally { btn.disabled = false; }
}

const contactForm = document.getElementById("contact-form");
if (contactForm) contactForm.addEventListener("submit", e => { e.preventDefault(); submitForm(contactForm, "New consultation request - EngageSportz website"); });

const nlForm = document.getElementById("newsletter-form");
if (nlForm) nlForm.addEventListener("submit", e => { e.preventDefault(); submitForm(nlForm, "Newsletter signup - EngageSportz website"); });
