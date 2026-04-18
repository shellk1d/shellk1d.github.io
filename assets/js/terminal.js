// ============================================================
//  terminal.js — Hacker terminal effects
// ============================================================

'use strict';

// ── Typing effect ──────────────────────────────────────────
class TypeWriter {
  constructor(el, options = {}) {
    this.el = el;
    this.text = el.dataset.text || el.textContent;
    this.speed = options.speed || 45;
    this.delay = options.delay || 0;
    this.callback = options.callback || null;
    el.textContent = '';
    el.style.visibility = 'visible';
  }

  start() {
    setTimeout(() => this._type(0), this.delay);
  }

  _type(i) {
    if (i < this.text.length) {
      this.el.textContent += this.text[i];
      setTimeout(() => this._type(i + 1), this.speed + Math.random() * 20);
    } else if (this.callback) {
      this.callback();
    }
  }
}

// ── Boot sequence ──────────────────────────────────────────
class BootSequence {
  constructor(containerId, lines, onComplete) {
    this.container = document.getElementById(containerId);
    this.lines = lines;
    this.onComplete = onComplete;
    this.index = 0;
  }

  run() {
    if (!this.container) return;
    this._printLine();
  }

  _printLine() {
    if (this.index >= this.lines.length) {
      setTimeout(() => {
        if (this.onComplete) this.onComplete();
      }, 300);
      return;
    }

    const line = this.lines[this.index];
    const el = document.createElement('div');
    el.className = 'boot-line';

    if (line.type === 'ok') {
      el.innerHTML = `<span style="color:var(--text-muted)">${line.text}</span> <span style="color:var(--green-bright)">[  OK  ]</span>`;
    } else if (line.type === 'warn') {
      el.innerHTML = `<span style="color:var(--text-muted)">${line.text}</span> <span style="color:var(--amber)">[ WARN ]</span>`;
    } else if (line.type === 'fail') {
      el.innerHTML = `<span style="color:var(--text-muted)">${line.text}</span> <span style="color:var(--red-alert)">[ FAIL ]</span>`;
    } else if (line.type === 'comment') {
      el.innerHTML = `<span style="color:var(--text-muted)"># ${line.text}</span>`;
    } else {
      el.innerHTML = `<span style="color:var(--green-bright)">$</span> <span>${line.text}</span>`;
    }

    this.container.appendChild(el);
    this.container.scrollTop = this.container.scrollHeight;
    this.index++;

    setTimeout(() => this._printLine(), line.delay || 80);
  }
}

// ── Glitch effect on hover ─────────────────────────────────
function initGlitch() {
  document.querySelectorAll('.glitch-text').forEach(el => {
    el.addEventListener('mouseenter', () => {
      el.style.animation = 'glitch 0.4s ease';
      el.addEventListener('animationend', () => {
        el.style.animation = '';
      }, { once: true });
    });
  });
}

// ── Staggered fade-in on scroll ───────────────────────────
function initScrollReveal() {
  const items = document.querySelectorAll('.stagger-1, .stagger-2, .stagger-3, .stagger-4, .stagger-5, .stagger-6');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-up');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  items.forEach(item => observer.observe(item));
}

// ── Active nav link ───────────────────────────────────────
function initActiveNav() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === current) {
      link.classList.add('active');
    }
  });
}

// ── Stat counter animation ────────────────────────────────
function initCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    const duration = 1500;
    const step = target / (duration / 16);
    let current = 0;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            el.textContent = target;
            clearInterval(timer);
          } else {
            el.textContent = Math.floor(current);
          }
        }, 16);
        observer.unobserve(el);
      }
    });

    observer.observe(el);
  });
}

// ── Copy code blocks ──────────────────────────────────────
function initCopyCode() {
  document.querySelectorAll('pre').forEach(pre => {
    const btn = document.createElement('button');
    btn.className = 'btn-copy';
    btn.textContent = 'copy';
    btn.style.cssText = `
      position: absolute; top: 0.5rem; right: 0.5rem;
      background: transparent; border: 1px solid var(--green-dim);
      color: var(--text-muted); font-family: var(--font-mono);
      font-size: 0.65rem; padding: 0.1rem 0.5rem; cursor: pointer;
      letter-spacing: 0.05em; transition: all 0.2s;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.borderColor = 'var(--green-bright)';
      btn.style.color = 'var(--green-bright)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.borderColor = 'var(--green-dim)';
      btn.style.color = 'var(--text-muted)';
    });
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(pre.querySelector('code')?.textContent || pre.textContent);
      btn.textContent = 'copied!';
      btn.style.color = 'var(--green-bright)';
      setTimeout(() => {
        btn.textContent = 'copy';
        btn.style.color = 'var(--text-muted)';
      }, 1500);
    });

    pre.style.position = 'relative';
    pre.appendChild(btn);
  });
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initGlitch();
  initScrollReveal();
  initActiveNav();
  initCounters();
  initCopyCode();

  // Typing effect on elements with data-typewriter
  document.querySelectorAll('[data-typewriter]').forEach((el, i) => {
    new TypeWriter(el, { speed: 40, delay: i * 300 }).start();
  });
});

// Export for use in individual pages
window.TypeWriter = TypeWriter;
window.BootSequence = BootSequence;
