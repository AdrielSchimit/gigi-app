(() => {
  const params = new URLSearchParams(location.search);
  const preview = params.get("birthday") === "preview";
  const reset = params.get("reset") === "1";
  const TZ = "America/Sao_Paulo";
  const TARGET = "2026-07-30";
  const STORE = preview ? "gigiBirthdayPreviewV1" : "gigiBirthdayV1";

  const nowInZone = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const pick = (type) => parts.find((part) => part.type === type)?.value || "00";
    return `${pick("year")}-${pick("month")}-${pick("day")}`;
  };

  if (reset) {
    localStorage.removeItem(STORE);
    const url = new URL(location.href);
    url.searchParams.delete("reset");
    history.replaceState({}, "", `${url.pathname}${url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""}${url.hash}`);
  }

  const today = nowInZone();
  const phase = preview ? "preview" : today < TARGET ? "countdown" : today === TARGET ? "birthday" : "after";
  const isSpecial = preview || phase === "birthday";
  const readState = () => {
    try {
      return JSON.parse(localStorage.getItem(STORE) || "{}") || {};
    } catch {
      return {};
    }
  };
  const saveState = (next) => localStorage.setItem(STORE, JSON.stringify(next));
  const state = readState();
  state.step = Number.isInteger(state.step) ? state.step : 0;
  state.completed = !!state.completed;
  state.completedAt = state.completedAt || "";
  state.memories = Array.isArray(state.memories) ? state.memories : [];
  let currentStep = state.step;
  let dialog = null;

  const css = `
    .bdayPreviewSeal{position:fixed;top:calc(10px + env(safe-area-inset-top));left:calc(10px + env(safe-area-inset-left));z-index:9999;pointer-events:none;font:900 8px ui-monospace,monospace;letter-spacing:.24em;text-transform:uppercase;color:#a34a72;background:#fff8;border:1px solid #f1c8db;border-radius:999px;padding:7px 9px;backdrop-filter:blur(10px);box-shadow:0 10px 22px #b73e6f14}
    .bdayModal{width:100%;max-width:none;height:100dvh;padding:0;margin:0;border:0}
    .bdayModal .modal{min-height:100dvh;border:0;border-radius:0;padding:0;display:grid;grid-template-rows:auto 1fr;background:
      radial-gradient(circle at 16% 16%,#ffd2e84f,transparent 14%),
      radial-gradient(circle at 82% 14%,#ffdce94a,transparent 12%),
      radial-gradient(circle at 14% 78%,#fff3c84a,transparent 10%),
      radial-gradient(circle at 82% 68%,#f8c6e54a,transparent 11%),
      linear-gradient(180deg,#fff2f8 0%,#fff9fc 42%,#fff 100%)}
    .bdayCloseRow{display:flex;justify-content:flex-end;padding:14px 14px 0}
    .bdayClose{width:40px;height:40px;border:0;border-radius:12px;background:#fff0f7;font-size:24px;line-height:1}
    .bdayIntro,.bdayInner{width:min(100%,760px);margin:0 auto;display:grid;grid-template-columns:minmax(220px,.92fr) minmax(0,1.08fr);gap:18px;align-items:center;padding:clamp(12px,3vw,26px);min-height:calc(100dvh - 68px)}
    .bdayArt{position:relative;display:grid;place-items:center;min-height:300px;border-radius:28px;background:radial-gradient(circle at 50% 35%,#fff 0,#fff7fb 52%,#ffe4ef 100%);border:1px solid #f0cfde;box-shadow:0 24px 60px #b73e6f12;overflow:hidden}
    .bdayArt img{width:min(100%,330px);height:auto;display:block;object-fit:contain}
    .bdayHat{position:absolute;top:22px;right:24px;font-size:34px;transform:rotate(8deg);filter:drop-shadow(0 10px 12px #b73e6f26)}
    .bdaySpark{position:absolute;border-radius:50%;background:radial-gradient(circle,#fff,transparent 65%);opacity:.72;pointer-events:none}
    .bdaySpark.s1{width:8px;height:8px;left:16%;top:18%}.bdaySpark.s2{width:6px;height:6px;right:18%;top:16%}.bdaySpark.s3{width:7px;height:7px;left:20%;bottom:18%}.bdaySpark.s4{width:5px;height:5px;right:24%;bottom:14%}
    .bdayIntroText,.bdayStepText{display:grid;gap:14px;padding:14px 6px}
    .bdaySubtle{display:flex;align-items:center;gap:10px;color:var(--r);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.14em}
    .bdaySubtle:before{content:"";width:34px;height:1px;background:#e8b7ce}
    .bdayIntroText h2,.bdayStepText h2{margin:0;font:700 clamp(36px,6vw,64px)/.95 Georgia;letter-spacing:-.06em;max-width:12ch}
    .bdayIntroText p,.bdayStepText p{margin:0;max-width:46ch;color:var(--m);font-size:15px;line-height:1.7;white-space:pre-wrap}
    .bdayIntroButtons,.bdayStepButtons{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px}
    .bdayIntroButtons .btn,.bdayStepButtons .btn{min-width:170px}
    .bdayInvite{display:grid;gap:12px;justify-items:center}
    .bdayInviteCard{width:min(100%,420px);margin:0 auto;border:1px solid #efd5e1;background:#fff;border-radius:24px;padding:12px;box-shadow:0 22px 48px #b73e6f14}
    .bdayInviteCard button{all:unset;display:block;width:100%;cursor:pointer;border-radius:18px;overflow:hidden}
    .bdayInviteCard img{display:block;width:100%;height:auto;border-radius:18px;object-fit:contain;background:#fff}
    .bdayInviteFallback{display:grid;place-items:center;min-height:220px;padding:18px;border-radius:18px;background:#fff7fb;border:1px dashed #e3bfd0;color:var(--m);font-size:13px;text-align:center;line-height:1.6}
    .bdayInviteActions{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
    .bdayInviteActions .btn{min-width:168px}
    .bdayInviteNote{font-size:11px;color:var(--m);text-align:center}
    .bdayLightbox{width:min(100%,980px);padding:0;margin:0 auto;border:0;background:transparent}
    .bdayLightbox::backdrop{background:#301922c7;backdrop-filter:blur(7px)}
    .bdayLightbox .modal{padding:14px;background:#fff;border-radius:24px;box-shadow:0 28px 90px #29131f66}
    .bdayLightbox figure{margin:0}
    .bdayLightbox img{display:block;width:100%;height:auto;max-height:84dvh;object-fit:contain;border-radius:18px;background:#fff}
    .bdayLightbox .bdayLightboxTop{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}
    .bdayLightbox .bdayLightboxTop strong{font:700 16px Georgia;color:var(--t)}
    .bdayLightbox .x{flex:0 0 auto}
    .bdayQuote{padding:14px 16px;border:1px solid #f0cfde;border-radius:18px;background:#fff7fb;box-shadow:0 14px 28px #b73e6f0d}
    .bdayQuote p{margin:0;font:700 15px/1.7 Georgia;color:var(--t)}
    .bdayQuote small{display:block;margin-top:8px;color:var(--m);font-size:11px}
    .bdayDecor{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
    .bdayDecor span{border:1px solid #f0cfde;background:#fff;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:800;color:var(--r)}
    .bdayCards{width:min(100%,760px);margin:0 auto;padding:0 clamp(12px,3vw,26px) 26px;display:grid;gap:12px}
    .bdayCard{border:1px solid #ecd0dc;background:#fff;border-radius:20px;padding:16px;box-shadow:0 20px 50px #b73e6f10}
    .bdayCard h3{margin:0 0 6px;font-size:16px}
    .bdayCard p{margin:0;color:var(--m);font-size:12px;line-height:1.6}
    .bdayList{display:grid;gap:8px;margin-top:10px}
    .bdayMemory{padding:12px 13px;border-left:4px solid var(--p);background:#fff;border-radius:14px;box-shadow:0 10px 24px #b73e6f0f}
    .bdayMemory b{display:block;font-size:11px;color:var(--p);margin-bottom:4px}
    .bdayMemory p{margin:0;color:var(--t);font-size:12px;line-height:1.5;white-space:pre-wrap}
    .bdayEmpty{padding:14px;border:1px dashed #e3bfd0;border-radius:16px;color:var(--m);font-size:12px;text-align:center}
    .bdayMemoryForm{display:grid;gap:10px}
    .bdayMemoryForm textarea{min-height:96px}
    .bdayActions{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
    .bdayActions .btn{flex:1 1 160px}
    @media (max-width:700px){
      .bdayIntro,.bdayInner{grid-template-columns:1fr;min-height:auto;padding:12px 14px 18px}
      .bdayArt{min-height:240px}
      .bdayIntroText h2,.bdayStepText h2{max-width:none}
      .bdayIntroButtons .btn,.bdayStepButtons .btn{min-width:0;flex:1 1 100%}
    }
    @media (prefers-reduced-motion: reduce){
      .bdayModal .modal,.bdayArt img{animation:none}
    }
  `;

  const stepData = {
    0: {
      eyebrow: "CAPÍTULO ESPECIAL",
      title: "Parabéns, personagem principal.",
      text: "Hoje não existem metas impossíveis, cobranças ou pressa. Só um lembrete de que o mundo ficou mais bonito no dia em que você chegou.",
      primary: "Abrir meu capítulo",
      secondary: "Guardar para depois",
    },
    1: {
      eyebrow: "MENSAGEM DE ADRIEL",
      title: "Parabéns, protagonista!",
      text: "Desejo muitos anos de vida, saúde, prosperidade e conquistas. Que este novo capítulo seja cheio de histórias bonitas, momentos inesquecíveis e motivos sinceros para sorrir.\n\nEu já te disse tantas vezes que seus olhos são lindos... então, desta vez, quero te dizer algo diferente:\n\nnunca perca o brilho que você carrega no olhar.\n\nFeliz aniversário, Gigi. 🤍",
      quote: "nunca perca o brilho que você carrega no olhar.",
      signer: "Com carinho, Adriel.",
      primary: "Continuar",
      secondary: "Voltar",
    },
    2: {
      eyebrow: "30 DE JULHO",
      title: "Um novo capítulo começa agora.",
      text: "Que este novo ano traga histórias bonitas, livros inesquecíveis, conquistas, saúde, tranquilidade e muitos motivos para sorrir.\n\nQue você continue descobrindo o mundo, defendendo aquilo em que acredita e construindo uma vida que tenha o seu jeito.",
      decor: ["livros", "páginas", "flores", "estrelas", "caminhos", "café"],
      primary: "Descobrir meu presente",
      secondary: "Voltar",
    },
    3: {
      eyebrow: "MISSÃO ESPECIAL DESBLOQUEADA",
      title: "Um café com o Adriel",
      text: "Sem metas. Sem notificações. Só uma conversa boa.",
      note: "Este convite não tem prazo de validade.",
      inviteAlt: "Convite especial Um café com o Adriel para Gigi",
      primary: "Guardar meu convite",
      secondary: "Voltar",
    },
    4: {
      eyebrow: "CONCLUSÃO",
      title: "Capítulo guardado com carinho.",
      text: "Esta memória agora faz parte do seu Espaço da Gi.",
      badge: "Capítulo 30/07",
      description: "Um dia dedicado à personagem principal.",
      primary: "Voltar ao meu espaço",
      secondary: "Rever capítulo",
    },
  };

  const injectStyles = () => {
    if (document.getElementById("birthdayStyles")) return;
    const style = document.createElement("style");
    style.id = "birthdayStyles";
    style.textContent = css;
    document.head.appendChild(style);
  };

  const ensureSeal = () => {
    if (!preview || document.getElementById("birthdayPreviewSeal")) return;
    const seal = document.createElement("div");
    seal.id = "birthdayPreviewSeal";
    seal.className = "bdayPreviewSeal";
    seal.textContent = "Modo de prévia";
    document.body.appendChild(seal);
  };

  const ensureCard = () => {
    const arcs = document.getElementById("arcs");
    if (!arcs) return null;
    let card = document.getElementById("birthdayChapter");
    if (!card) {
      card = document.createElement("article");
      card.id = "birthdayChapter";
      card.className = "c";
      arcs.insertAdjacentElement("afterend", card);
    }
    return card;
  };

  const inviteSrc = "/assets/convite-especial.png";
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const ensureLightbox = () => {
    let box = document.getElementById("birthdayLightbox");
    if (box) return box;
    box = document.createElement("dialog");
    box.id = "birthdayLightbox";
    box.className = "bdayLightbox";
    box.innerHTML = `
      <div class="modal">
        <div class="bdayLightboxTop">
          <strong>Convite especial</strong>
          <button class="x" type="button" aria-label="Fechar">×</button>
        </div>
        <figure>
          <img src="${inviteSrc}" alt="${stepData[3].inviteAlt}">
        </figure>
      </div>
    `;
    document.body.appendChild(box);
    box.querySelector("button.x").onclick = () => box.close();
    box.addEventListener("cancel", (event) => {
      event.preventDefault();
      box.close();
    });
    return box;
  };

  const openInvitePreview = () => {
    const box = ensureLightbox();
    const img = box.querySelector("img");
    if (img && !img.dataset.bound) {
      img.dataset.bound = "1";
      img.addEventListener("error", () => {
        img.replaceWith(Object.assign(document.createElement("div"), {
          className: "bdayInviteFallback",
          textContent: "Convite especial indisponível no momento.",
        }));
      }, { once: true });
    }
    if (!box.open) box.showModal();
  };

  const saveInvite = async () => {
    if (isIOS) {
      window.open(inviteSrc, "_blank", "noopener,noreferrer");
      return;
    }
    const link = document.createElement("a");
    link.href = inviteSrc;
    link.download = "Convite_Especial_Gigi.png";
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const renderCard = () => {
    const card = ensureCard();
    if (!card) return;
    const heading = state.completed ? "O capítulo continua guardado." : "Hoje o espaço inteiro é dela.";
    const text = state.completed ? "A lembrança permanece disponível para ser revisitada quando quiser." : "O aniversário ganha um espaço próprio, com afeto e sem pressa.";
    const memories = state.memories.slice().reverse().map((item) => `<article class="bdayMemory"><b>${item.day}</b><p>${item.text}</p></article>`).join("");
    card.innerHTML = `
      <div class="bdayCards">
        <div class="bdayCard">
          <span class="bdaySubtle">CAPÍTULO ESPECIAL</span>
          <h3>${heading}</h3>
          <p>${text}</p>
        </div>
        <div class="bdayCard">
          <h3>Memórias guardadas</h3>
          <div class="bdayList">${memories || '<div class="bdayEmpty">Ainda não há memórias salvas neste capítulo.</div>'}</div>
        </div>
      </div>
    `;
  };

  const ensureDialog = () => {
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "birthdayModal";
    dialog.className = "bdayModal";
    dialog.innerHTML = `
      <div class="modal">
        <div class="bdayCloseRow"><button class="bdayClose" type="button" aria-label="Fechar">×</button></div>
        <div class="bdayIntro">
          <div class="bdayArt" aria-hidden="true">
            <span class="bdaySpark s1"></span><span class="bdaySpark s2"></span><span class="bdaySpark s3"></span><span class="bdaySpark s4"></span>
            <img src="/assets/gigi-chibi-ceci.webp" alt="">
            <div class="bdayHat">🎩</div>
          </div>
          <div class="bdayIntroText">
            <span class="bdaySubtle" id="bdayEyebrow"></span>
            <h2 id="birthdayTitle"></h2>
            <p id="birthdaySubtitle"></p>
            <div id="birthdayBody"></div>
            <div class="bdayIntroButtons" id="birthdayButtons"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
    dialog.querySelector(".bdayClose").onclick = closeExperience;
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeExperience();
    });
    return dialog;
  };

  const renderCurrentStep = () => {
    const dlg = ensureDialog();
    const data = stepData[currentStep] || stepData[0];
    const eyebrow = dlg.querySelector("#bdayEyebrow");
    const title = dlg.querySelector("#birthdayTitle");
    const subtitle = dlg.querySelector("#birthdaySubtitle");
    const body = dlg.querySelector("#birthdayBody");
    const buttons = dlg.querySelector("#birthdayButtons");
    eyebrow.textContent = data.eyebrow;
    title.textContent = data.title;
    buttons.innerHTML = "";
    body.innerHTML = "";

    if (currentStep === 0) {
      subtitle.textContent = data.text;
      buttons.insertAdjacentHTML("beforeend", `
        <button class="btn pri" data-act="open">${data.primary}</button>
        <button class="btn sec" data-act="close">${data.secondary}</button>
      `);
    }

    if (currentStep === 1) {
      subtitle.textContent = data.text;
      body.insertAdjacentHTML("beforeend", `
        <div class="bdayQuote">
          <p>${data.quote}</p>
          <small>${data.signer}</small>
        </div>
      `);
      buttons.insertAdjacentHTML("beforeend", `
        <button class="btn pri" data-act="next">${data.primary}</button>
        <button class="btn sec" data-act="back">${data.secondary}</button>
      `);
    }

    if (currentStep === 2) {
      subtitle.textContent = data.text;
      body.insertAdjacentHTML("beforeend", `
        <div class="bdayDecor">
          ${data.decor.map((item) => `<span>${item}</span>`).join("")}
        </div>
      `);
      buttons.insertAdjacentHTML("beforeend", `
        <button class="btn pri" data-act="next">${data.primary}</button>
        <button class="btn sec" data-act="back">${data.secondary}</button>
      `);
    }

    if (currentStep === 3) {
      subtitle.textContent = data.text;
      body.insertAdjacentHTML("beforeend", `
        <div class="bdayInvite">
          <div class="bdayInviteCard">
            <button type="button" id="birthdayInviteThumb" aria-label="Ver convite especial">
              <img src="${inviteSrc}" alt="${data.inviteAlt}">
            </button>
          </div>
          <div class="bdayQuote">
            <p>${data.note}</p>
            <small>Convite especial</small>
          </div>
          ${isIOS ? '<div class="bdayInviteNote">No iPhone, toque e segure para salvar.</div>' : ""}
        </div>
      `);
      buttons.insertAdjacentHTML("beforeend", `
        <button class="btn sec" data-act="preview">Ver convite</button>
        <button class="btn sec" data-act="save">Salvar PNG</button>
        <button class="btn pri" data-act="complete">${data.primary}</button>
        <button class="btn sec" data-act="back">${data.secondary}</button>
      `);
    }

    if (currentStep === 4) {
      subtitle.textContent = data.text;
      body.insertAdjacentHTML("beforeend", `
        <div class="bdayQuote">
          <p>${data.badge}</p>
          <small>${data.description}</small>
        </div>
      `);
      buttons.insertAdjacentHTML("beforeend", `
        <button class="btn pri" data-act="close">${data.primary}</button>
        <button class="btn sec" data-act="review">${data.secondary}</button>
      `);
    }

    buttons.querySelectorAll("[data-act]").forEach((button) => {
      button.onclick = () => {
        const act = button.dataset.act;
        if (act === "open") return goToStep(1);
        if (act === "next") return goToStep(currentStep + 1);
        if (act === "back") return goToStep(Math.max(0, currentStep - 1));
        if (act === "review") return goToStep(1);
        if (act === "preview") return openInvitePreview();
        if (act === "save") return saveInvite();
        if (act === "complete") return completeExperience();
        if (act === "close") return closeExperience();
      };
    });

    const thumb = dlg.querySelector("#birthdayInviteThumb");
    if (thumb) thumb.onclick = openInvitePreview;
    const thumbImg = dlg.querySelector("#birthdayInviteThumb img");
    if (thumbImg && !thumbImg.dataset.bound) {
      thumbImg.dataset.bound = "1";
      thumbImg.addEventListener("error", () => {
        thumbImg.closest(".bdayInviteCard").innerHTML = '<div class="bdayInviteFallback">Convite especial indisponível no momento.</div>';
      }, { once: true });
    }
  };

  const openExperience = (startStep = 0) => {
    currentStep = Math.max(0, Math.min(4, startStep));
    ensureDialog();
    renderCurrentStep();
    if (!dialog.open) dialog.showModal();
  };

  const closeExperience = () => {
    state.step = currentStep;
    saveState(state);
    if (dialog?.open) dialog.close();
  };

  const goToStep = (step) => {
    currentStep = Math.max(0, Math.min(4, step));
    state.step = currentStep;
    saveState(state);
    renderCurrentStep();
    if (dialog && !dialog.open) dialog.showModal();
  };

  const completeExperience = () => {
    state.completed = true;
    state.completedAt = today;
    state.step = 4;
    const memoryText = "Capítulo 30/07 - convite especial guardado com carinho.";
    if (!state.memories.some((item) => item.text === memoryText)) {
      state.memories.push({ day: today, text: memoryText });
    }
    saveState(state);
    currentStep = 4;
    renderCard();
    renderCurrentStep();
  };

  const wrapRender = () => {
    const original = window.render;
    if (typeof original !== "function" || original.__birthdayWrapped) return;
    const wrapped = (...args) => {
      const result = original.apply(window, args);
      renderCard();
      return result;
    };
    wrapped.__birthdayWrapped = true;
    window.render = wrapped;
  };

  injectStyles();
  ensureSeal();
  wrapRender();
  renderCard();
  window.openExperience = openExperience;
  window.closeExperience = closeExperience;
  window.goToStep = goToStep;
  window.completeExperience = completeExperience;
  window.renderCurrentStep = renderCurrentStep;
  if (isSpecial) setTimeout(() => openExperience(0), 120);
})();
