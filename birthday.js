(() => {
  const STORE = "gigiBirthdayV1";
  const TZ = "America/Sao_Paulo";
  const TARGET = "2026-07-30";
  const params = new URLSearchParams(location.search);
  const preview = params.get("birthday") === "preview";
  const reset = params.get("reset") === "1";

  const nowInZone = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const y = parts.find((part) => part.type === "year")?.value || "0000";
    const m = parts.find((part) => part.type === "month")?.value || "00";
    const d = parts.find((part) => part.type === "day")?.value || "00";
    return `${y}-${m}-${d}`;
  };

  const parseDate = (value) => {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  };

  const diffDays = (from, to) =>
    Math.max(0, Math.round((parseDate(to) - parseDate(from)) / 86400000));

  const phase = () => {
    if (preview) return "preview";
    const today = nowInZone();
    if (today < TARGET) return "countdown";
    if (today === TARGET) return "birthday";
    return "after";
  };

  const readState = () => {
    try {
      return JSON.parse(localStorage.getItem(STORE) || "{}") || {};
    } catch {
      return {};
    }
  };

  const saveState = (next) => {
    localStorage.setItem(STORE, JSON.stringify(next));
  };

  if (reset) localStorage.removeItem(STORE);

  const state = readState();
  state.memories = Array.isArray(state.memories) ? state.memories : [];
  state.introSeenAt = state.introSeenAt || "";
  state.badgeUnlockedAt = state.badgeUnlockedAt || "";
  if (!state.memories.length && preview && reset) saveState(state);

  const today = nowInZone();
  const currentPhase = phase();
  const specialActive = currentPhase === "birthday" || currentPhase === "preview";
  const specialSeen = state.introSeenAt === today && currentPhase === "birthday";
  const specialDaysLeft = diffDays(today, TARGET);

  const injectStyles = () => {
    if (document.getElementById("birthdayStyles")) return;
    const style = document.createElement("style");
    style.id = "birthdayStyles";
    style.textContent = `
      .bdayChapter{overflow:hidden;background:linear-gradient(160deg,#fff8fc 0%,#fff 48%,#fff0f8 100%);border-color:#efb9cf}
      .bdayShell{display:grid;gap:14px;padding:18px;position:relative}
      .bdayShell:before{content:"";position:absolute;inset:auto -12% -35% auto;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,#ff9ac34d,transparent 68%);filter:blur(8px);pointer-events:none}
      .bdayTop{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
      .bdayKicker{font:900 9px ui-monospace,monospace;letter-spacing:.18em;color:var(--p);text-transform:uppercase}
      .bdayTop h3{margin:4px 0 0;font:700 26px Georgia;letter-spacing:-.03em}
      .bdayTop p{margin:6px 0 0;color:var(--m);font-size:12px;line-height:1.55}
      .bdayBadge{border:1px solid #edbfd3;background:#fff;border-radius:999px;padding:9px 11px;min-width:110px;text-align:center;font-size:10px;font-weight:800;color:var(--r)}
      .bdayBadge strong{display:block;font-size:16px;color:var(--p);margin-bottom:2px}
      .bdayGrid{display:grid;grid-template-columns:1.2fr .8fr;gap:12px}
      .bdayPanel{border:1px solid #ecd0dc;background:#fff;border-radius:18px;padding:14px}
      .bdayPanel h4{margin:0 0 8px;font-size:14px}
      .bdayPanel .mut{font-size:11px}
      .bdayMeter{height:10px;background:#f4dfe8;border-radius:999px;overflow:hidden;border:1px solid #edcfdd}
      .bdayMeter i{display:block;height:100%;width:100%;background:linear-gradient(90deg,var(--p2),var(--p))}
      .bdayList{display:grid;gap:8px}
      .bdayMemory{padding:12px 13px;border-left:4px solid var(--p);background:#fff;border-radius:14px;box-shadow:0 10px 24px #b73e6f0f}
      .bdayMemory b{display:block;font-size:11px;color:var(--p);margin-bottom:4px}
      .bdayMemory p{margin:0;color:var(--t);font-size:12px;line-height:1.5;white-space:pre-wrap}
      .bdayActions{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
      .bdayActions .btn{flex:1 1 160px}
      .bdayModal{width:min(100vw,760px);max-height:100dvh;padding:0}
      .bdayModal .modal{min-height:100dvh;border-radius:0;background:radial-gradient(circle at top left,#ffe0ef 0,#fff 36%,#fff8fc 100%);padding:0;display:grid;grid-template-rows:auto 1fr}
      .bdayHero{padding:22px 18px 18px;border-bottom:1px solid #eed3df;position:relative;overflow:hidden}
      .bdayHero:after{content:"✦ ✦ ✦";position:absolute;right:18px;top:18px;color:#e7498d55;letter-spacing:6px;font-size:18px}
      .bdayHero h2{margin:8px 0 10px;font:700 clamp(32px,8vw,56px)/.95 Georgia;letter-spacing:-.05em}
      .bdayHero p{margin:0;color:var(--m);font-size:13px;line-height:1.65;max-width:52ch}
      .bdayHero .meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
      .bdayHero .meta span{border:1px solid #ebc7d8;background:#fff;border-radius:999px;padding:8px 10px;font-size:10px;font-weight:800;color:var(--r)}
      .bdayHero .meta strong{display:block;color:var(--p);font-size:14px;margin-top:2px}
      .bdayBody{padding:18px;display:grid;gap:12px;overflow:auto}
      .bdayCard{border:1px solid #ecd0dc;background:#fff;border-radius:20px;padding:16px;box-shadow:0 20px 50px #b73e6f10}
      .bdayCard h3{margin:0 0 6px;font-size:16px}
      .bdayCard p{margin:0;color:var(--m);font-size:12px;line-height:1.6}
      .bdayMemoryForm{display:grid;gap:10px}
      .bdayMemoryForm textarea{min-height:96px}
      .bdayEmpty{padding:14px;border:1px dashed #e3bfd0;border-radius:16px;color:var(--m);font-size:12px;text-align:center}
      .bdayClose{width:40px;height:40px;border:0;border-radius:12px;background:#fff0f7;font-size:24px;line-height:1}
      .bdayCloseRow{display:flex;justify-content:flex-end;padding:14px 18px 0}
      @media (max-width:700px){
        .bdayGrid{grid-template-columns:1fr}
      }
      @media (prefers-reduced-motion: reduce){
        .bdayHero:after{animation:none}
      }
    `;
    document.head.appendChild(style);
  };

  const ensureJourneyCard = () => {
    const arcs = document.getElementById("arcs");
    const journey = document.getElementById("journey");
    if (!arcs || !journey) return null;
    let card = document.getElementById("birthdayChapter");
    if (!card) {
      card = document.createElement("article");
      card.id = "birthdayChapter";
      card.className = "c bdayChapter";
      arcs.insertAdjacentElement("afterend", card);
    }
    return card;
  };

  const renderJourneyCard = () => {
    const card = ensureJourneyCard();
    if (!card) return;
    const unlocked = preview || state.badgeUnlockedAt === today || currentPhase === "after";
    const headline = currentPhase === "birthday"
      ? "Hoje o espaço inteiro é dela."
      : currentPhase === "preview"
        ? "Prévia do capítulo especial."
        : currentPhase === "countdown"
          ? `Faltam ${specialDaysLeft} dias para 30/07/2026.`
          : "O capítulo especial já ficou guardado.";
    const sub = currentPhase === "birthday"
      ? "Esse espaço nasce para celebrar a Gi com a mesma linguagem do app: rotina, afeto e memória."
      : currentPhase === "preview"
        ? "Use essa prévia para validar a experiência sem tocar nos dados reais."
        : currentPhase === "countdown"
          ? "A contagem existe para deixar a data viva sem poluir o restante do app."
          : "Depois da data, o registro continua disponível como arquivo afetivo.";
    const memories = state.memories.slice().reverse().map(item => `<article class="bdayMemory"><b>${item.day}</b><p>${item.text}</p></article>`).join("");
    card.innerHTML = `
      <div class="bdayShell">
        <div class="bdayTop">
          <div>
            <span class="bdayKicker">CAPÍTULO ESPECIAL</span>
            <h3>${headline}</h3>
            <p>${sub}</p>
          </div>
          <div class="bdayBadge"><strong>${unlocked ? "Badge ativa" : currentPhase === "countdown" ? "Contagem" : "Arquivo"}</strong>${unlocked ? "Memória preservada" : currentPhase === "countdown" ? `${specialDaysLeft} dias restantes` : "30/07/2026 · America/Sao_Paulo"}</div>
        </div>
        <div class="bdayGrid">
          <div class="bdayPanel">
            <h4>Estado do capítulo</h4>
            <p>${currentPhase === "birthday" ? "Hoje está aberto." : currentPhase === "preview" ? "Prévia isolada para teste." : currentPhase === "countdown" ? "A data ainda está chegando." : "A data passou, mas o capítulo continua acessível."}</p>
            <div class="bdayMeter" aria-hidden="true"><i></i></div>
          </div>
          <div class="bdayPanel">
            <h4>Badge da Gi</h4>
            <p>${unlocked ? "A insígnia deste capítulo já está desbloqueada neste aparelho." : "Quando 30/07/2026 chegar, a badge vai acender aqui."}</p>
          </div>
        </div>
        <div class="bdayPanel">
          <h4>Memórias guardadas</h4>
          <div class="bdayList">${memories || '<div class="bdayEmpty">Ainda não há memórias salvas neste capítulo.</div>'}</div>
          ${specialActive ? `
            <div class="bdayMemoryForm">
              <label>Nova memória
                <textarea id="birthdayMemoryInput" placeholder="Escreva uma lembrança curta para guardar no capítulo da Gi."></textarea>
              </label>
              <div class="bdayActions">
                <button class="btn pri" id="birthdaySaveMemory">Salvar memória</button>
                <button class="btn sec" id="birthdayOpenIntro">Reabrir apresentação</button>
              </div>
            </div>
          ` : ""}
        </div>
      </div>
    `;

    const saveButton = document.getElementById("birthdaySaveMemory");
    if (saveButton) {
      saveButton.onclick = () => {
        const input = document.getElementById("birthdayMemoryInput");
        const text = (input?.value || "").trim();
        if (!text) {
          if (window.toastMsg) window.toastMsg("Escreva uma memória para salvar");
          return;
        }
        state.memories.push({ day: today, text });
        if (currentPhase === "birthday") {
          state.badgeUnlockedAt = today;
        }
        saveState(state);
        renderJourneyCard();
        if (window.toastMsg) window.toastMsg("Memória guardada no capítulo da Gi");
      };
    }
    const introButton = document.getElementById("birthdayOpenIntro");
    if (introButton) introButton.onclick = openIntro;
  };

  const ensureModal = () => {
    let dialog = document.getElementById("birthdayModal");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "birthdayModal";
    dialog.className = "bdayModal";
    dialog.innerHTML = `
      <div class="modal">
        <div class="bdayCloseRow"><button class="bdayClose" type="button" aria-label="Fechar">×</button></div>
        <div class="bdayHero">
          <span class="ey">ANIVERSÁRIO DA GIGI</span>
          <h2 id="birthdayTitle"></h2>
          <p id="birthdaySubtitle"></p>
          <div class="meta">
            <span><strong id="birthdayMetaDate"></strong>30/07/2026</span>
            <span><strong id="birthdayMetaDays"></strong>${currentPhase === "countdown" ? "dias para abrir" : "camada do dia"}</span>
            <span><strong id="birthdayMetaBadge"></strong>badge</span>
          </div>
        </div>
        <div class="bdayBody">
          <div class="bdayCard">
            <h3 id="birthdayCardTitle"></h3>
            <p id="birthdayCardBody"></p>
          </div>
          <div class="bdayCard">
            <h3>Memória rápida</h3>
            <p id="birthdayCardMemory"></p>
          </div>
          <div class="bdayActions">
            <button class="btn pri" id="birthdayPrimary"></button>
            <button class="btn sec" id="birthdaySecondary">Fechar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
    dialog.querySelector(".bdayClose").onclick = () => dialog.close();
    dialog.querySelector("#birthdaySecondary").onclick = () => dialog.close();
    dialog.addEventListener("close", () => {
      if (currentPhase === "birthday") {
        state.introSeenAt = today;
        state.badgeUnlockedAt = today;
        saveState(state);
        renderJourneyCard();
      }
    });
    return dialog;
  };

  function openIntro() {
    const dialog = ensureModal();
    const title = dialog.querySelector("#birthdayTitle");
    const subtitle = dialog.querySelector("#birthdaySubtitle");
    const metaDate = dialog.querySelector("#birthdayMetaDate");
    const metaDays = dialog.querySelector("#birthdayMetaDays");
    const metaBadge = dialog.querySelector("#birthdayMetaBadge");
    const cardTitle = dialog.querySelector("#birthdayCardTitle");
    const cardBody = dialog.querySelector("#birthdayCardBody");
    const cardMemory = dialog.querySelector("#birthdayCardMemory");
    const primary = dialog.querySelector("#birthdayPrimary");

    const lines = {
      preview: {
        title: "Prévia do aniversário da Gi",
        subtitle: "Tudo aqui roda em modo seguro: a experiência aparece, mas não grava nada no estado real.",
        metaDays: "preview",
        metaBadge: "teste",
        cardTitle: "Capítulo em prévia",
        cardBody: "Você pode validar texto, layout e comportamento do iPhone sem afetar o dia real.",
        cardMemory: "Se quiser, salve uma memória na prévia apenas para testar o fluxo. Use o reset para voltar ao começo.",
        primary: "Abrir capítulo",
      },
      birthday: {
        title: "Hoje é o dia da Gi",
        subtitle: "O app muda de camada, mas continua com a mesma identidade: rotina, afeto e memória guardada.",
        metaDays: "hoje",
        metaBadge: "ativa",
        cardTitle: "Capítulo vivo",
        cardBody: "Este é o momento em que a página deixa de ser só rotina e vira lembrança oficial do espaço da Gi.",
        cardMemory: "A badge fica salva neste aparelho, junto com as memórias que você registrar hoje.",
        primary: "Ver capítulo",
      },
    }[currentPhase] || {
      title: "Capítulo guardado",
      subtitle: "A data já passou, mas o registro permanece disponível como arquivo afetivo.",
      metaDays: "arquivo",
      metaBadge: "salva",
      cardTitle: "Arquivo do dia 30",
      cardBody: "O aniversário já foi, mas o capítulo pode ser revisitado quando você quiser.",
      cardMemory: "Use a seção de memórias para rever o que ficou guardado.",
      primary: "Reabrir capítulo",
    };

    title.textContent = lines.title;
    subtitle.textContent = lines.subtitle;
    metaDate.textContent = "Data: ";
    metaDays.textContent = lines.metaDays;
    metaBadge.textContent = lines.metaBadge;
    cardTitle.textContent = lines.cardTitle;
    cardBody.textContent = lines.cardBody;
    cardMemory.textContent = lines.cardMemory;
    primary.textContent = lines.primary;

    primary.onclick = () => {
      dialog.close();
      const card = document.getElementById("birthdayChapter");
      if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    if (!dialog.open) dialog.showModal();
  }

  const wrapRender = () => {
    const original = window.render;
    if (typeof original !== "function" || original.__birthdayWrapped) return;
    const wrapped = (...args) => {
      const result = original.apply(window, args);
      renderJourneyCard();
      return result;
    };
    wrapped.__birthdayWrapped = true;
    window.render = wrapped;
  };

  injectStyles();
  wrapRender();
  renderJourneyCard();

  if (specialActive && !specialSeen) {
    setTimeout(() => openIntro(), 250);
  } else if (currentPhase === "after" && preview) {
    setTimeout(() => openIntro(), 250);
  }
})();
