(function () {
  const HUD_ID = "rise-custom-hud";
  const lessonStartBlockId = "cmkzi45wn02rr3b7koi13gri5";
  const knowledgeCheckBlockIds = "cmkzi45wn02rr3b7koi13gri5, cml5j6ba000x13b7kz9rhbf1f".split(",").map(s => s.trim()).filter(Boolean);

  const pointValues = {
    "cmkzi45wn02rr3b7koi13gri5": 1,
    "cml5j6ba000x13b7kz9rhbf1f": 1,
  };

  const totalPossiblePoints = Object.values(pointValues).reduce((a, b) => a + b, 0);
  const submittedBlocks = new Set();
  const awardedPoints = new Set();
  const wiredBlocks = new Set();

  const waitFor = (selector, within = document) => new Promise(resolve => {
    const hit = within.querySelector(selector);
    if (hit) return resolve(hit);
    const mo = new MutationObserver(() => {
      const el = within.querySelector(selector);
      if (el) { mo.disconnect(); resolve(el); }
    });
    mo.observe(within, { childList: true, subtree: true });
  });

  const initHUD = async () => {
    if (document.getElementById(HUD_ID)) return;
    const gate = await waitFor(`[data-block-id="${lessonStartBlockId}"]`).catch(() => null);
    if (!gate) return;

    if (!document.getElementById("hud-style")) {
      const style = document.createElement("style");
      style.id = "hud-style";
      style.textContent = `
        @media (prefers-reduced-motion: reduce) {
          .floating-point { animation: none !important; transform: translate(-50%, -50%) scale(1) !important; }
          #${HUD_ID} .stats span { transition: none !important; }
        }
        @keyframes riseFade {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 0.8; transform: translate(-50%, -80%) scale(1.2); }
          100% { opacity: 0; transform: translate(-50%, -100%) scale(1); }
        }
        #${HUD_ID} {
          position: fixed !important; top: 20px !important; right: 20px !important; z-index: 99999 !important;
          width: 95% !important; max-width: 480px !important; border-radius: 50px !important;
          padding: 16px 36px !important; display: flex !important; align-items: center !important; justify-content: space-between !important;
          background-color: #ffffff !important; font-family: Inter, sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif !important;
          border: 2px solid #36533B !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
        }
        #${HUD_ID} .stats { display: flex !important; flex-direction: column !important; gap: 6px !important; }
        .points-text { font-size: 20px !important; font-weight: 700 !important; color: #ee2a25 !important; line-height: 1.3 !important; }
        .progress-text { font-size: 16px !important; font-weight: 600 !important; color: #000000 !important; }
        .avatar-container { display: flex !important; flex-direction: column !important; align-items: center !important; margin-right: 12px !important; }
        .avatar { width: 60px !important; height: 60px !important; border-radius: 50% !important; margin-bottom: 4px !important; object-fit: cover !important;  }
        .name-text { font-size: 21px !important; font-weight: 600 !important; color: #ee2a25 !important; }
        .floating-point {
          position: fixed !important; left: 50% !important; top: 50% !important; transform: translate(-50%, -50%) !important;
          z-index: 100000 !important; font-size: 36px !important; font-weight: 700 !important; color: #ee2a24 !important;
          background: none !important; pointer-events: none !important; animation: riseFade 1.2s ease-out forwards !important; white-space: nowrap !important;
        }
        @media (max-width: 600px) { #${HUD_ID} { left: 50% !important; transform: translateX(-50%) !important; right: auto !important; padding: 12px 24px !important; } }
      `;
      document.head.appendChild(style);
    }

    const totalQuestions = knowledgeCheckBlockIds.length;
    const hud = document.createElement("div");
    hud.id = HUD_ID;
    hud.setAttribute("role", "region");
    hud.setAttribute("aria-label", "Course progress tracker");
    hud.innerHTML = `
      <div id="aria-updates" aria-live="polite" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;"></div>
      <div class="avatar-container">
        <img class="avatar" src="https://raw.githubusercontent.com/laimuf/articulate-tools/frontpage_BRC/assets/BRC/kaibig.png" alt="Player profile picture" />
        <div class="name-text">Kai</div>
      </div>
      <div class="stats">
        <div class="progress-text">Progress: <span id="progress-count" aria-live="polite">0</span> of ${totalQuestions}</div>
        <div class="points-text">Points: <span id="points-count" aria-live="polite">0</span> / ${totalPossiblePoints}</div>
      </div>`;
    document.body.prepend(hud);

    // HUD API
    const pointSound = new Audio("https://raw.githubusercontent.com/laimuf/articulate-tools/main/assets/sounds/email_success.mp3");

    window.incrementPoints = (() => {
      let points = 0;
      return (val = 1) => {
        points += val;
        const el = document.getElementById("points-count");
        if (!el) return;
        el.textContent = String(points);
        el.style.transition = "transform 0.3s ease";
        el.style.transform = "scale(1.4)";
        requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = "scale(1)"; }));
        pointSound.currentTime = 0;
        pointSound.play().catch(() => {});
      };
    })();

    window.incrementProgress = (() => {
      let count = 0;
      return () => {
        if (count >= totalQuestions) return;
        count += 1;
        const el = document.getElementById("progress-count");
        if (!el) return;
        el.textContent = String(count);
        el.style.transition = "transform 0.3s ease";
        el.style.transform = "scale(1.4)";
        requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = "scale(1)"; }));
      };
    })();

    window.showFloatingPoint = (text = "+1 point 😊") => {
      const float = document.createElement("div");
      float.className = "floating-point";
      float.textContent = text;
      document.body.appendChild(float);
      float.addEventListener("animationend", () => float.remove());
      const aria = document.getElementById("aria-updates");
      if (aria) aria.textContent = text;
    };

    // Wire each KC block
    knowledgeCheckBlockIds.forEach(wireKC);
  };

  const wireKC = async (blockId) => {
    if (wiredBlocks.has(blockId)) return;
    const block = await waitFor(`[data-block-id="${blockId}"]`).catch(() => null);
    if (!block) return;
    wiredBlocks.add(blockId);

    // Prefer a stable container inside the block for quiz state changes
    const kcRoot = block.querySelector('[data-test-id="block-kc-card"]') || block;

    // Observe feedback visibility/state instead of attaching to "first button" (video controls exist)
    const ensureFeedbackObserver = () => {
      let feedback = kcRoot.querySelector('.quiz-card__feedback');
      if (!feedback) return; // will be picked up by root observer when it appears

      const onAnswered = () => {
        if (!submittedBlocks.has(blockId)) {
          submittedBlocks.add(blockId);
          window.incrementProgress?.();
        }
        const verdict = getVerdict(kcRoot);
        if (verdict === true && !awardedPoints.has(blockId)) {
          awardedPoints.add(blockId);
          const val = pointValues[blockId] || 1;
          window.incrementPoints?.(val);
          window.showFloatingPoint?.(`+${val} point${val === 1 ? "" : "s"}`);
        }
      };

      // If already active (retake-after-submit), process once
      if (!feedback.hasAttribute("aria-hidden") || /\bquiz-card__feedback--active\b/.test(feedback.className)) {
        onAnswered();
      }

      const fbObserver = new MutationObserver(() => {
        // Activation toggles either aria-hidden or adds --active
        const active = !feedback.hasAttribute("aria-hidden") || /\bquiz-card__feedback--active\b/.test(feedback.className);
        if (active) onAnswered();
      });
      fbObserver.observe(feedback, { attributes: true, attributeFilter: ["aria-hidden", "class"] });
    };

    const rootObserver = new MutationObserver(() => {
      // feedback may (re)render after submit/retake
      ensureFeedbackObserver();
    });
    rootObserver.observe(kcRoot, { childList: true, subtree: true });

    // Initial pass
    ensureFeedbackObserver();
  };

  const getVerdict = (kcRoot) => {
    // Try based on selected option icons (data-test-id are relatively stable)
    const selectedLabel = kcRoot.querySelector('[data-test-id="quiz-card-option"] > label.is-selected');
    if (selectedLabel) {
      if (selectedLabel.querySelector('[data-test-id="incorrect-x-active"]')) return false;
      if (selectedLabel.querySelector('[data-test-id="correct-check-active"]')) return true;
    }
    // Fallback to feedback text (localized variants may differ)
    const fbLabel = kcRoot.querySelector('.quiz-card__feedback-label');
    const txt = (fbLabel?.textContent || "").trim().toLowerCase();
    if (txt) {
      if (/\bcorrect\b/.test(txt) && !/\bincorrect\b/.test(txt)) return true;
      if (/\bincorrect\b/.test(txt)) return false;
    }
    return null;
  };

  const gateObserver = new MutationObserver(() => {
    const block = document.querySelector(`[data-block-id="${lessonStartBlockId}"]`);
    if (block) { gateObserver.disconnect(); initHUD(); }
  });
  gateObserver.observe(document.body, { childList: true, subtree: true });
})();