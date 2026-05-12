/* =====================================================
   Our Fairy Tale — interactions
   Stage-based pot progression using layered cut PNGs.
   Garden status updates as flowers bloom; envelope
   opens a letter that types itself out with a pen.
   ===================================================== */

(function () {
  'use strict';

  const TOTAL_STAGES = 4; // 0=empty -> 1=soil -> 2=seed -> 3=sprout -> 4=bloom

  const beginBtn       = document.getElementById('begin-btn');
  const garden         = document.getElementById('garden');
  const pots           = Array.from(document.querySelectorAll('.pot-slot'));
  const statusEl       = document.getElementById('garden-status');
  const envelopeEl     = document.getElementById('envelope');
  const envStatusEl    = document.getElementById('envelope-status');
  const overlayEl      = document.getElementById('letter-overlay');
  const closeLetterBtn = document.getElementById('letter-close');
  const letterScroll   = document.getElementById('letter-scroll');
  const letterTextEl   = document.getElementById('letter-text');
  const letterPenEl    = document.getElementById('letter-pen');
  const skipHintEl     = document.getElementById('letter-skip-hint');

  // Flowing status text — edit freely.
  const STATUS_INITIAL = 'Complete each pot to plant a seed and watch our garden bloom baby';
  const STATUS_AT = {
    1: 'A rose blooms at last — the first breath of love awakens, and our fairytale begins.',
    2: 'A sunflower opens wide — faithful as the sun itself, my heart will always turn toward you.',
    3: 'Lavender softly blooms — peace in the storm, devotion in the silence, and you in every thought.',
    4: 'A lily rises in bloom — pure, unwavering, and proof that what we hold cannot be broken.',
    5: 'The hydrangea blossoms — a hundred tender petals, and each one carries a promise of forever.'
  };

  // The letter that will be "handwritten" onto the paper.
  const LETTER_TEXT =
`My baby,

Once upon a time, in a world full of distance and different skies, we found each other. And somehow you became my favorite part of every day. In only five months, you turned ordinary moments into magic. You made my heart feel safe, my soul feel understood, and my future feel brighter. Even when the nights feel long and the miles try to test us, I always believe in us. Because what we have isn't just love, it's a story worth fighting for.

So today, I want you to know this:

You are my sweetest chapter.
My rarest treasure.
My forever kind of magic.

And no matter how far the world stretches between us, I promise I will keep choosing you, loving you, and growing with you — until the day this fairytale becomes our real life.

Happy 5 months, my love.
Forever and always,
Ita`;

  if (beginBtn) {
    beginBtn.addEventListener('click', () => {
      garden.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  pots.forEach((pot) => {
    pot.addEventListener('click', () => advanceStage(pot));
    pot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advanceStage(pot);
      }
    });
  });

  function advanceStage(pot) {
    let stage = parseInt(pot.dataset.stage, 10);
    if (stage >= TOTAL_STAGES) return;
    stage += 1;
    pot.dataset.stage = String(stage);

    pot.classList.add('advancing');
    setTimeout(() => pot.classList.remove('advancing'), 520);

    if (stage === TOTAL_STAGES) {
      pot.classList.add('bloomed');
      const n = countBloomed();
      sparkleBurst(pot);
      updateStatus(n);
      if (n === pots.length) unlockEnvelope();
    }
  }

  function countBloomed() {
    return document.querySelectorAll('.pot-slot.bloomed').length;
  }

  function updateStatus(n) {
    if (!statusEl) return;
    statusEl.classList.add('fade');
    setTimeout(() => {
      statusEl.textContent = STATUS_AT[n] || STATUS_INITIAL;
      statusEl.classList.remove('fade');
    }, 320);
  }

  function unlockEnvelope() {
    envelopeEl.classList.remove('locked');
    envelopeEl.classList.add('unlocked');
    if (envStatusEl) {
      envStatusEl.classList.add('unlocked');
      envStatusEl.textContent = 'Your letter is ready baby!';
    }
    setTimeout(() => {
      envelopeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
  }

  envelopeEl.addEventListener('click', () => {
    if (!envelopeEl.classList.contains('unlocked')) return;
    openLetter();
  });

  /* =================================================
     LETTER — typewriter + pen
     ================================================= */
  let typingTimer = null;
  let typingDone = false;

  function openLetter() {
    overlayEl.classList.add('open');
    overlayEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Reset state and start writing
    letterScroll.classList.remove('writing-done');
    letterTextEl.textContent = '';
    letterPenEl.classList.remove('done');
    letterPenEl.classList.add('writing');
    typingDone = false;
    // wait for the open transition to start so layout is ready
    setTimeout(startTyping, 420);
  }

  function closeLetter() {
    overlayEl.classList.remove('open');
    overlayEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    stopTyping();
  }
  function stopTyping() {
    if (typingTimer) { clearTimeout(typingTimer); typingTimer = null; }
  }

  function startTyping() {
    stopTyping();
    let i = 0;
    const text = LETTER_TEXT;
    function step() {
      if (typingDone) return;
      if (i >= text.length) {
        finishTyping();
        return;
      }
      const ch = text[i++];
      letterTextEl.textContent += ch;
      positionPen();
      // Variable delay for natural-feeling typing.
      let delay = 26 + Math.random() * 14;
      if (ch === '\n') delay = 240;
      else if (',;:'.includes(ch)) delay = 150;
      else if ('.!?…'.includes(ch)) delay = 220;
      else if (ch === ' ') delay = 22;
      typingTimer = setTimeout(step, delay);
    }
    step();
  }

  function finishTyping() {
    typingDone = true;
    letterTextEl.textContent = LETTER_TEXT;
    positionPen();
    setTimeout(() => {
      letterPenEl.classList.remove('writing');
      letterPenEl.classList.add('done');
      letterScroll.classList.add('writing-done');
    }, 350);
  }

  function positionPen() {
    if (!letterTextEl.firstChild) return;
    const node = letterTextEl.firstChild;
    if (node.nodeType !== Node.TEXT_NODE || node.length === 0) return;
    const range = document.createRange();
    range.setStart(node, node.length - 1);
    range.setEnd(node, node.length);
    const rect = range.getBoundingClientRect();
    const containerRect = letterScroll.getBoundingClientRect();
    // Current writing point in container coordinates
    const tipX = rect.right - containerRect.left;
    const tipY = rect.bottom - containerRect.top;
    // The pen image's "nib" is roughly at (12%, 88%) of its own box.
    // We use transform-origin: 12% 88%, so we offset by those fractions.
    const penW = letterPenEl.offsetWidth || (letterScroll.offsetWidth * 0.18);
    const penH = letterPenEl.offsetHeight || penW; // approx square
    letterPenEl.style.left = (tipX - penW * 0.12) + 'px';
    letterPenEl.style.top  = (tipY - penH * 0.88) + 'px';
  }

  // Tap the paper to instantly finish writing (skip animation).
  letterScroll.addEventListener('click', (e) => {
    if (e.target === closeLetterBtn) return;
    if (!typingDone) {
      stopTyping();
      finishTyping();
    }
  });

  closeLetterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeLetter();
  });
  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) closeLetter();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlayEl.classList.contains('open')) closeLetter();
  });

  /* Re-position pen on resize while writing */
  window.addEventListener('resize', () => {
    if (overlayEl.classList.contains('open')) positionPen();
  });

  /* =================================================
     SPARKLES
     ================================================= */
  function sparkleBurst(target) {
    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.35;
    const N = 16;
    for (let i = 0; i < N; i++) {
      const s = document.createElement('span');
      const angle = (Math.PI * 2 * i) / N + Math.random() * 0.4;
      const dist = 35 + Math.random() * 70;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      s.style.cssText =
        'position:fixed;' +
        'left:' + cx + 'px;top:' + cy + 'px;' +
        'width:6px;height:6px;margin:-3px 0 0 -3px;' +
        'border-radius:50%;' +
        'background:radial-gradient(circle,#fff5cc 0%,#ffd576 50%,transparent 100%);' +
        'pointer-events:none;z-index:250;opacity:0.95;' +
        'transform:translate(0,0) scale(1);' +
        'transition:transform 0.95s cubic-bezier(0.2,0.8,0.2,1),opacity 1s ease;';
      document.body.appendChild(s);
      requestAnimationFrame(() => {
        s.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(0.4)';
        s.style.opacity = '0';
      });
      setTimeout(() => s.remove(), 1150);
    }
  }
})();
