// ================= HEADER & FOOTER LOADER =================
let basePath = "/";

if (window.location.pathname.includes("/recruiter/")) {
  basePath = "/";
}

// Job Seeker Header
const headerEl = document.getElementById("header");
if (headerEl) {
  fetch(basePath + "components/header.html")
    .then(res => res.text())
    .then(data => headerEl.innerHTML = data);
}

// Recruiter Header
const recruiterHeaderEl = document.getElementById("recruiter-header");
if (recruiterHeaderEl) {
  fetch(basePath + "components/recruiterHeader.html")
    .then(res => res.text())
    .then(data => recruiterHeaderEl.innerHTML = data);
}

// Footer
const footerEl = document.getElementById("footer");
if (footerEl) {
  fetch(basePath + "components/footer.html")
    .then(res => res.text())
    .then(data => footerEl.innerHTML = data);
}
// Footer
const footerRecruiterEl = document.getElementById("recruiter-footer");
if (footerRecruiterEl) {
  fetch(basePath + "components/recruiterFooter.html")
    .then(res => res.text())
    .then(data => footerRecruiterEl.innerHTML = data);
}

// ================= HERO TEXT TYPING EFFECT =================

const textElement = document.getElementById("changing-word");

if (textElement) {
  const words = ["Confidence.", "Passion.", "Purpose.", "Opportunity.", "JobsHunt."];
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  const speed = 120;
  const eraseSpeed = 80;
  const delay = 1500;

  textElement.style.color = "#18a99c";

  function typeEffect() {
    const currentWord = words[wordIndex];

    if (!isDeleting) {
      textElement.textContent = currentWord.substring(0, charIndex++);
    } else {
      textElement.textContent = currentWord.substring(0, charIndex--);
    }

    let typingSpeed = isDeleting ? eraseSpeed : speed;

    if (!isDeleting && charIndex === currentWord.length + 1) {
      typingSpeed = delay;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
    }

    setTimeout(typeEffect, typingSpeed);
  }

  typeEffect();
}


// ================= TESTIMONIAL SLIDER =================

const testimonials = document.querySelectorAll(".testimonial");
const nextBtn = document.querySelector(".next");
const prevBtn = document.querySelector(".prev");

let tIndex = 0;

function showTestimonial(i) {
  testimonials.forEach(t => t.classList.remove("active"));
  testimonials[i].classList.add("active");
}

if (testimonials.length > 0) {
  showTestimonial(tIndex);

  if (nextBtn) {
    nextBtn.onclick = () => {
      tIndex = (tIndex + 1) % testimonials.length;
      showTestimonial(tIndex);
    };
  }

  if (prevBtn) {
    prevBtn.onclick = () => {
      tIndex = (tIndex - 1 + testimonials.length) % testimonials.length;
      showTestimonial(tIndex);
    };
  }

  setInterval(() => {
    tIndex = (tIndex + 1) % testimonials.length;
    showTestimonial(tIndex);
  }, 3000);
}
