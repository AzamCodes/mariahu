"use strict";
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const menuButton = $(".menu-toggle");
const nav = $("#site-nav");
const closeMenu = () => {
  nav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation");
  document.body.classList.remove("menu-open");
};
menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  nav.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
});
$$('a[href^="#"]', nav).forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });
$("#year").textContent = new Date().getFullYear();
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const poopCursor = $("#poopCursor");
if (poopCursor && window.matchMedia("(pointer: fine)").matches) {
  document.body.classList.add("poop-cursor-active");
  let pointerX = 0;
  let pointerY = 0;
  let cursorFrame = 0;
  document.addEventListener("pointermove", (event) => {
    pointerX = event.clientX - 12;
    pointerY = event.clientY - 9;
    if (cursorFrame) return;
    cursorFrame = requestAnimationFrame(() => {
      poopCursor.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
      poopCursor.classList.add("is-visible");
      cursorFrame = 0;
    });
  }, { passive: true });
  document.addEventListener("pointerover", (event) => {
    poopCursor.classList.toggle("is-hovering", Boolean(event.target.closest("a, button, [role=button], input[type=submit], select")));
  }, { passive: true });
  document.addEventListener("pointerleave", () => poopCursor.classList.remove("is-visible"));
  document.addEventListener("pointerenter", () => poopCursor.classList.add("is-visible"));
}

// Keep the glass navigation fixed and padded; reveal it on upward scroll.
let previousY = window.scrollY;
let scrollDirection = 0;
let directionTravel = 0;
let scrollTicking = false;
window.addEventListener("scroll", () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    const currentY = window.scrollY;
    const delta = currentY - previousY;
    const nextDirection = Math.sign(delta);
    if (nextDirection && nextDirection === scrollDirection) directionTravel += Math.abs(delta);
    else { scrollDirection = nextDirection; directionTravel = Math.abs(delta); }
    const header = $(".header");
    header.classList.toggle("is-scrolled", currentY > 24);
    if (currentY < 90) { header.classList.remove("is-hidden"); directionTravel = 0; }
    else if (directionTravel > 16) {
      header.classList.toggle("is-hidden", scrollDirection > 0);
      directionTravel = 0;
    }
    previousY = currentY;
    scrollTicking = false;
  });
}, { passive: true });

const gallery = $(".gallery-carousel");
if (gallery) {
  const slides = $$(".swiper-slide", gallery);
  const pagination = $(".swiper-pagination", gallery);
  let activeSlide = 0;
  const showSlide = (index) => {
    activeSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === activeSlide);
      slide.setAttribute("aria-hidden", String(slideIndex !== activeSlide));
    });
    $$(".gallery-dot", pagination).forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === activeSlide);
      dot.setAttribute("aria-current", dotIndex === activeSlide ? "true" : "false");
    });
  };
  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.className = "gallery-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Show gallery image ${index + 1}`);
    dot.addEventListener("click", () => showSlide(index));
    pagination.append(dot);
  });
  $(".gallery-prev", gallery).addEventListener("click", () => showSlide(activeSlide - 1));
  $(".gallery-next", gallery).addEventListener("click", () => showSlide(activeSlide + 1));
  showSlide(0);
}

let lenis = null;
if (!reduceMotion && window.Lenis) {
  lenis = new Lenis({
    autoRaf: true,
    anchors: true,
    smoothWheel: true,
    duration: 0.85,
    wheelMultiplier: 1
  });
}

const canAnimate = !reduceMotion && window.gsap && window.ScrollTrigger;
if (canAnimate) {
  gsap.registerPlugin(ScrollTrigger);
  if (lenis) lenis.on("scroll", ScrollTrigger.update);

  // A choreographed opening: the image settles first, then type and details arrive in beats.
  const opening = gsap.timeline({ defaults: { ease: "power3.out" } });
  opening.fromTo(".hero-photo", { scale: 1.13 }, { scale: 1, duration: 2.1, ease: "power2.out" }, 0);
  opening.fromTo(".hero-inner .eyebrow", { autoAlpha: 0, y: 16, letterSpacing: ".32em" }, { autoAlpha: 1, y: 0, letterSpacing: ".18em", duration: .75 }, .24);
  opening.fromTo(".hero h1", { autoAlpha: 0, y: 38 }, { autoAlpha: 1, y: 0, duration: .95 }, .46);
  opening.fromTo(".hero-bottom", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .8 }, .93);
  opening.fromTo(".hero-index, .hero-label", { autoAlpha: 0 }, { autoAlpha: 1, duration: .6, stagger: .12 }, 1.12);

  // Reveal related cards together with a deliberate cascading rhythm.
  const stagedGroups = [
    { selector: ".course", trigger: ".course-list", stagger: .13, distance: 42 },
    { selector: ".person", trigger: ".people-grid", stagger: .12, distance: 38 },
    { selector: ".notice", trigger: ".notice-list", stagger: .1, distance: 28 }
  ];
  const stagedElements = new Set();
  stagedGroups.forEach(({ selector, trigger, stagger, distance }) => {
    const items = $$(selector);
    items.forEach((item) => stagedElements.add(item));
    gsap.fromTo(items,
      { autoAlpha: 0, y: distance },
      { autoAlpha: 1, y: 0, duration: .72, stagger, ease: "power2.out",
        scrollTrigger: { trigger, start: "top 78%", once: true } }
    );
  });
  const revealObserver = new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    gsap.to(entry.target, { autoAlpha: 1, y: 0, duration: .62, ease: "power2.out", overwrite: "auto" });
    observer.unobserve(entry.target);
  }), { threshold: .12, rootMargin: "0px 0px -35px 0px" });
  $$(".reveal").filter((element) => !stagedElements.has(element) && !element.closest(".hero")).forEach((element) => revealObserver.observe(element));
} else if (!reduceMotion && "IntersectionObserver" in window) {
  const stagedGroups = [".course", ".person", ".notice"];
  const stagedElements = new Set(stagedGroups.flatMap((selector) => $$(selector)));
  const makeVisible = (element, delay = 0) => {
    window.setTimeout(() => element.classList.add("is-visible"), delay);
  };
  stagedGroups.forEach((selector) => {
    const elements = $$(selector);
    const parent = elements[0]?.parentElement;
    if (parent) {
      const groupObserver = new IntersectionObserver((entries, observer) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          elements.forEach((element, index) => makeVisible(element, index * 105));
          observer.disconnect();
        }
      }, { threshold: .12 });
      groupObserver.observe(parent);
    }
  });
  const observer = new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
    if (entry.isIntersecting) { makeVisible(entry.target); observer.unobserve(entry.target); }
  }), { threshold: .12, rootMargin: "0px 0px -35px 0px" });
  $$(".reveal").filter((element) => !stagedElements.has(element) && !element.closest(".hero")).forEach((element) => observer.observe(element));
  $$(".hero .reveal").forEach((element, index) => makeVisible(element, 200 + index * 250));
} else {
  $$(".reveal").forEach((element) => { element.style.opacity = "1"; element.style.transform = "none"; });
}

const courseInfo = {
  "BA": "Bachelor’s degree in Arts with diverse subjects like English, Hindi, History, Geography, and more.",
  "B.Com.": "Bachelor’s degree in Commerce with a focus on global business and accounting.",
  "B.Sc.": "Bachelor’s degree in Science with multiple options.",
  "BCA": "Bachelor’s degree in Computer Application with multiple options.",
  "MA": "Master’s degree course in subjects like English, Hindi, Ancient History, and more.",
  "M.Com": "Postgraduate course in Commerce, responding to the demands of students.",
  "M.Sc": "Postgraduate course in Science, with specialization in Chemistry.",
  "MCA": "Postgraduate course in Computer Application, with specializations."
};
const courseModal = $("#courseModal");
const loginModal = $("#loginModal");
const openDialog = (dialog) => {
  dialog.classList.remove("is-closing");
  dialog.showModal();
  if (lenis) lenis.stop();
};
const closeDialog = (dialog) => {
  if (!dialog.open || dialog.classList.contains("is-closing")) return;
  dialog.classList.add("is-closing");
  window.setTimeout(() => {
    if (dialog.open) dialog.close();
    dialog.classList.remove("is-closing");
    if (lenis && !courseModal.open && !loginModal.open) lenis.start();
  }, 230);
};

$$(".course").forEach((card) => $("button", card).addEventListener("click", () => {
  const course = card.dataset.course;
  $("#courseTitle").textContent = $("h3", card).textContent;
  $("#courseText").textContent = courseInfo[course] || "Contact the college office for more information.";
  openDialog(courseModal);
}));
$(".login-open").addEventListener("click", () => {
  closeMenu();
  $("#loginStatus").textContent = "";
  $("#loginForm").reset();
  openDialog(loginModal);
});
$$('[data-close-dialog]').forEach((button) => button.addEventListener("click", () => closeDialog(button.closest("dialog"))));
courseModal.addEventListener("click", (event) => { if (event.target === courseModal) closeDialog(courseModal); });
loginModal.addEventListener("click", (event) => { if (event.target === loginModal) closeDialog(loginModal); });
[courseModal, loginModal].forEach((dialog) => dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeDialog(dialog);
}));
$(".modal-close", courseModal).addEventListener("click", () => closeDialog(courseModal));
$(".under-link", courseModal).addEventListener("click", (event) => {
  event.preventDefault();
  closeDialog(courseModal);
  window.setTimeout(() => {
    if (lenis) lenis.scrollTo("#contact", { duration: 1.1 });
    else $("#contact").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }, 250);
});

$("#loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const studentId = $("#studentId").value.trim();
  const password = $("#studentPassword").value;
  $("#loginStatus").textContent = studentId && password
    ? `Demo portal only: sign-in is not connected to a student account (${studentId}).`
    : "Enter your student ID and password.";
});

const CONTACT_STORAGE_KEY = "Mariahu P. G. College Jaunpur DemoMessages";
$("#contactForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = {
    name: $("#contactName").value.trim(), email: $("#contactEmail").value.trim(),
    subject: $("#contactSubject").value, message: $("#contactMessage").value.trim(),
    submittedAt: new Date().toISOString()
  };
  const status = $("#contactStatus");
  if (!message.name || !message.email || !message.subject || !message.message) {
    status.textContent = "Please complete all fields.";
    return;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(CONTACT_STORAGE_KEY) || "[]");
    saved.push(message);
    localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(saved));
    status.textContent = "Message saved in this browser for demo purposes. It has not been emailed.";
    form.reset();
  } catch {
    status.textContent = "Browser storage is unavailable. Your message was not saved.";
  }
});

const sections = $$("main section[id]");
if ("IntersectionObserver" in window) {
  const activeObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    $$(".nav a").forEach((link) => link.classList.toggle("active", link.hash === `#${entry.target.id}`));
  }), { rootMargin: "-35% 0px -55% 0px" });
  sections.forEach((section) => activeObserver.observe(section));
}
