/* 게임 엔진. 스토리 내용은 story.js 에 있고, 여기는 화면과 진행 규칙만 다룹니다. */
(function () {
  "use strict";
  const S = window.STORY, ART = window.ART;
  const $ = (s) => document.querySelector(s);
  const screen = $("#screen"), overlay = $("#overlay"), toast = $("#toast"), notifLayer = $("#notif-layer"), phone = $("#phone");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ================= 시간 ================= */
  function T(s) {
    let y = 2025; s = s.trim();
    if (s.startsWith("작년")) { y = 2024; s = s.slice(2).trim(); }
    const [md, hm = "00:00"] = s.split(/\s+/);
    const [m, d] = md.split("/").map(Number), [h, mi] = hm.split(":").map(Number);
    return new Date(y, m - 1, d, h, mi).getTime();
  }
  const WD = "일월화수목금토";
  const pad2 = (n) => String(n).padStart(2, "0");
  const D = (ts) => new Date(ts);
  const hhmm = (ts) => `${pad2(D(ts).getHours())}:${pad2(D(ts).getMinutes())}`;
  const ampm = (ts) => { const h = D(ts).getHours(), m = pad2(D(ts).getMinutes()); return `${h < 12 ? "오전" : "오후"} ${h % 12 || 12}:${m}`; };
  const dateLabel = (ts) => { const d = D(ts); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WD[d.getDay()]})`; };
  const longDay = (ts) => { const d = D(ts); return d.getFullYear() < 2025 ? `작년 ${d.getMonth() + 1}월 ${d.getDate()}일` : `202×년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${WD[d.getDay()]}요일`; };
  const sameDay = (a, b) => D(a).toDateString() === D(b).toDateString();
  function when(ts) {
    if (sameDay(ts, state.now)) return ampm(ts);
    if (sameDay(ts, state.now - 864e5)) return "어제";
    const d = D(ts); return d.getFullYear() < 2025 ? `작년 ${d.getMonth() + 1}/${d.getDate()}` : `${d.getMonth() + 1}/${d.getDate()}`;
  }
  const full = (ts) => `${longDay(ts)} ${ampm(ts)}`;
  const won = (n) => n.toLocaleString("ko-KR") + "원";

  /* ================= 항목 정리 ================= */
  const START = T(S.startTime);
  const items = {}; // id -> {id, kind, t, ...}
  function add(id, kind, t, data, extra) { items[id] = Object.assign({ id, kind, t: T(t), data }, extra); return items[id]; }
  S.messenger.forEach((th) => th.msgs.forEach((m, i) => add(`${th.id}#${i}`, "msg", m.t, m, { thread: th })));
  S.calls.forEach((c, i) => add(`call#${i}`, "call", c.t, c));
  S.card.items.forEach((c, i) => add(`card#${i}`, "card", c.t, c));
  S.email.forEach((m, i) => add(`mail#${i}`, "mail", m.t, m));
  S.news.forEach((n) => add(n.id, "news", n.t, n));
  S.photos.forEach((p) => add(p.id, "photo", p.t, p));
  S.deletedPhotos.items.forEach((p) => add(p.id, "dphoto", p.t, p));
  S.search.forEach((r, i) => { if (!r.newsId) add(`s#${i}`, "web", r.from || "1/1 00:00", r); });

  const notifiable = (it) => it.t > START && it.data.who !== "me" && !it.data.silent && ["msg", "call", "card", "mail", "news"].includes(it.kind);
  const visible = (it) => it.t <= state.now;

  /* 하루 진행 단계 만들기 */
  function dayStart(i) { const d = S.days[i]; return T(`${d.date} ${d.start}`); }
  function steps(i) {
    const lo = dayStart(i), hi = i + 1 < S.days.length ? dayStart(i + 1) : lo + 864e5;
    const ev = Object.values(items).filter((it) => notifiable(it) && it.t > lo && it.t < hi).map((it) => ({ t: it.t, item: it }));
    (S.days[i].scenes || []).forEach((sc) => ev.push({ t: T(`${S.days[i].date} ${sc.t}`), scene: sc }));
    ev.sort((a, b) => a.t - b.t || (a.scene ? -1 : 1));
    const out = [];
    ev.forEach((e) => {
      const last = out[out.length - 1];
      if (!e.scene && last && !last.scene && e.t - last.t <= 3 * 6e4) last.items.push(e.item);
      else out.push(e.scene ? { t: e.t, scene: e.scene } : { t: e.t, items: [e.item] });
    });
    return out;
  }
  const nextStep = () => steps(state.day).find((s) => s.t > state.now);

  /* ================= 상태 · 저장 ================= */
  const KEY = "mulddae_v1";
  let state = null;
  const fresh = () => ({ v: 1, day: 0, now: dayStart(0), read: {}, thoughts: {}, pins: [], flags: {}, queries: [] });
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(KEY + k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(KEY + k); } catch (e) {} }
  };
  const prefs = Object.assign({ sound: true, vibe: true }, store.get("_prefs") || {});
  const autosave = () => { if (state) store.set("_auto", Object.assign({}, state, { savedAt: Date.now() })); };

  /* ================= 소리 · 진동 ================= */
  let actx = null;
  function unlockAudio() {
    try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); } catch (e) {}
  }
  function ding() {
    if (prefs.sound && actx) {
      const t0 = actx.currentTime;
      [[988, 0], [1319, 0.13]].forEach(([f, dt]) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0, t0 + dt); g.gain.linearRampToValueAtTime(0.22, t0 + dt + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t0 + dt + 0.35);
        o.connect(g).connect(actx.destination); o.start(t0 + dt); o.stop(t0 + dt + 0.4);
      });
    }
    if (prefs.vibe) {
      try { navigator.vibrate && navigator.vibrate([140, 70, 140]); } catch (e) {}
      phone.classList.remove("shake"); void phone.offsetWidth; phone.classList.add("shake");
    }
  }

  /* ================= 앱 목록 ================= */
  const APPS = {
    messenger: { name: "메신저", ic: "💬", bg: "#fee500" },
    calls: { name: "전화", ic: "📞", bg: "#34c759" },
    card: { name: "카드", ic: "💳", bg: "#0f7a6b" },
    mail: { name: "메일", ic: "✉️", bg: "#2f7cf6" },
    photos: { name: "사진", ic: "🌅", bg: "#f2f2f2" },
    search: { name: "검색", ic: "🔍", bg: "#03c75a" },
    notes: { name: "수첩", ic: "📌", bg: "#ff9f0a" },
    memo: { name: "메모", ic: "🔒", bg: "#ffd60a" },
    settings: { name: "설정", ic: "⚙️", bg: "#8e8e93" }
  };
  function badge(app) {
    const v = Object.values(items).filter((it) => visible(it) && !state.read[it.id]);
    if (app === "messenger") return v.filter((it) => it.kind === "msg" && it.data.who !== "me").length;
    if (app === "mail") return v.filter((it) => it.kind === "mail").length;
    if (app === "calls") return v.filter((it) => it.kind === "call" && it.data.type === "miss").length;
    if (app === "search") return v.filter((it) => it.kind === "news").length;
    return 0;
  }

  /* ================= 화면 이동 ================= */
  let stack = [];
  function go(view, p) { clearThoughts(); stack.push({ view, p: p || {} }); render(); }
  function back() { clearThoughts(); stack.pop(); if (!stack.length) stack.push({ view: "home", p: {} }); render(); }
  function home() { clearThoughts(); stack = [{ view: "home", p: {} }]; render(); }
  function render() {
    const cur = stack[stack.length - 1];
    $("#sb-time").textContent = state && cur.view !== "title" ? hhmm(state.now) : "";
    $("#sb-date").textContent = state && cur.view !== "title" ? dateLabel(state.now) : "";
    screen.innerHTML = VIEWS[cur.view](cur.p);
    screen.querySelectorAll("[data-go]").forEach((el) => el.addEventListener("click", () => {
      const p = el.dataset.p ? JSON.parse(el.dataset.p) : {}; go(el.dataset.go, p);
    }));
    screen.querySelectorAll("[data-back]").forEach((el) => el.addEventListener("click", back));
    screen.querySelectorAll("[data-home]").forEach((el) => el.addEventListener("click", home));
    (AFTER[cur.view] || (() => {}))(cur.p);
    if (state && cur.view !== "title") autosave();
  }
  const P = (o) => esc(JSON.stringify(o));
  const shell = (title, body, opts = {}) => `
    <div class="app-view" style="${opts.style || ""}">
      <div class="app-head"><button class="back" data-back>‹</button><h2>${esc(title)}</h2></div>
      ${opts.top || ""}
      <div class="app-body" id="body">${body}</div>
      <div class="home-bar"><button data-home aria-label="홈"></button></div>
    </div>`;

  /* ================= 속마음 · 핀 ================= */
  const thoughtQ = [];
  function think(it) { if (it && it.data.thought) thinkText(it.id, it.data.thought); }
  function thinkText(key, text) {
    if (state.thoughts[key] || thoughtQ.some((q) => q.key === key)) return;
    thoughtQ.push({ key, text }); showThought();
  }
  function showThought() {
    if (toast.classList.contains("show") || !thoughtQ.length) return;
    const q = thoughtQ.shift(); state.thoughts[q.key] = 1; autosave();
    toast.innerHTML = `<div class="lab">속마음 · 눌러서 닫기</div>${esc(q.text)}`;
    toast.classList.add("show");
  }
  function clearThoughts() { thoughtQ.length = 0; }
  toast.addEventListener("click", () => { toast.classList.remove("show"); setTimeout(showThought, 120); });

  const pinned = (id) => state.pins.includes(id);
  function togglePin(id) {
    if (pinned(id)) state.pins = state.pins.filter((x) => x !== id); else state.pins.push(id);
    autosave();
  }
  const pinBtn = (id) => `<button class="pin-btn ${pinned(id) ? "on" : ""}" data-pin="${esc(id)}">${pinned(id) ? "📌 수첩에 적어 둠" : "📌 수첩에 적기"}</button>`;
  function bindPins() {
    screen.querySelectorAll("[data-pin]").forEach((b) => b.addEventListener("click", () => { togglePin(b.dataset.pin); render(); }));
  }
  function label(it) {
    const d = it.data;
    switch (it.kind) {
      case "msg": return `${it.thread.name}: ${d.who === "me" ? "(나) " : ""}${d.text}`;
      case "call": return `통화 · ${d.name} (${({ in: "수신", out: "발신", miss: "부재중", fail: "연결 안 됨" })[d.type]})`;
      case "card": return `카드 · ${d.shop} ${won(d.amount)}`;
      case "mail": return `메일 · ${d.subject}`;
      case "news": return `뉴스 · ${d.title}`;
      case "photo": case "dphoto": return `사진 · ${d.caption || "(설명 없음)"}`;
      case "web": return `검색 · ${d.title}`;
    }
  }
  function open(it) {
    const map = { msg: ["thread", { id: it.thread.id }], call: ["callDetail", { id: it.id }], card: ["cardDetail", { id: it.id }],
      mail: ["mailDetail", { id: it.id }], news: ["doc", { id: it.id }], web: ["doc", { id: it.id }],
      photo: ["photo", { id: it.id }], dphoto: ["photo", { id: it.id }] };
    const [v, p] = map[it.kind]; go(v, p);
  }

  /* ================= 화면들 ================= */
  const VIEWS = {}, AFTER = {};

  /* 타이틀 */
  VIEWS.title = () => {
    const auto = store.get("_auto");
    return `<div class="title">
      <h1>${esc(S.title)}</h1><div class="sub">${esc(S.subtitle)}</div>
      ${auto ? `<button class="btn" id="t-cont">이어하기 <small style="opacity:.6">(${dateLabel(auto.now)} ${hhmm(auto.now)})</small></button>` : ""}
      <button class="btn" id="t-new">새 게임</button>
      <button class="btn" id="t-load">불러오기</button>
      <div class="tip">소리를 켜 주세요. 알림음과 진동이 있어요.<br>힌트는 없습니다. 모든 답은 이 핸드폰 안에 있어요.</div>
    </div>`;
  };
  AFTER.title = () => {
    const auto = store.get("_auto");
    $("#t-new").onclick = () => {
      unlockAudio();
      const start = () => { state = fresh(); stack = [{ view: "home", p: {} }]; render(); dayIntro(); };
      if (auto) ask("새 게임을 시작할까요? 저장 슬롯에 저장한 게임은 그대로 남아 있어요.", "새 게임", start); else start();
    };
    const c = $("#t-cont"); if (c) c.onclick = () => { unlockAudio(); state = auto; home(); };
    $("#t-load").onclick = () => { unlockAudio(); stack.push({ view: "slots", p: { loadOnly: true } }); render(); };
  };

  /* 홈 */
  VIEWS.home = () => {
    const ns = nextStep();
    const btn = ns ? `⏩ 시간 보내기 <small>다음 일을 기다린다</small>` : `🌙 잠자기 <small>오늘을 마친다</small>`;
    const apps = Object.entries(APPS).map(([k, a]) => {
      const b = badge(k);
      return `<button class="app" data-go="${k}"><div class="ic" style="background:${a.bg}">${a.ic}</div>${a.name}${b ? `<span class="badge">${b}</span>` : ""}</button>`;
    }).join("");
    return `<div class="home">
      <div class="widget"><div class="big">${hhmm(state.now)}</div><div class="small">${dateLabel(state.now)} · 202×년</div></div>
      <div class="apps">${apps}</div>
      <div class="dock"><button class="advance" id="adv">${btn}</button></div>
    </div>`;
  };
  AFTER.home = () => { $("#adv").onclick = advance; };

  /* 메신저 */
  VIEWS.messenger = () => {
    const rows = S.messenger.map((th) => {
      const ms = th.msgs.map((m, i) => items[`${th.id}#${i}`]).filter(visible);
      if (!ms.length) return null;
      const last = ms[ms.length - 1], un = ms.filter((it) => it.data.who !== "me" && !state.read[it.id]).length;
      return { th, last, un };
    }).filter(Boolean).sort((a, b) => b.last.t - a.last.t);
    return shell("메신저", rows.map(({ th, last, un }) => `
      <button class="row" data-go="thread" data-p="${P({ id: th.id })}">
        <div class="avatar">${esc(th.avatar)}</div>
        <div class="main"><div class="t1">${esc(th.name)}</div><div class="t2">${esc(last.data.text)}</div></div>
        <div class="meta">${when(last.t)}${un ? `<div><span class="badge" style="position:static;display:inline-flex;margin-top:4px">${un}</span></div>` : ""}</div>
      </button>`).join(""));
  };

  VIEWS.thread = ({ id }) => {
    const th = S.messenger.find((x) => x.id === id);
    let html = "", lastDay = null, lastWho = null;
    th.msgs.forEach((m, i) => {
      const it = items[`${id}#${i}`]; if (!visible(it)) return;
      if (lastDay === null || !sameDay(lastDay, it.t)) { html += `<div class="day">${longDay(it.t)}</div>`; lastWho = null; }
      lastDay = it.t;
      const me = m.who === "me";
      if (!me && th.group && lastWho !== m.who) html += `<div class="who">${esc(m.who)}</div>`;
      lastWho = m.who;
      html += `<div class="bub-wrap ${me ? "me" : ""} ${pinned(it.id) ? "pinned" : ""}" data-msg="${esc(it.id)}">
        <div class="bub">${esc(m.text)}</div>
        <div class="bub-meta">${m.unread ? `<span class="one">1</span>` : ""}${ampm(it.t)}</div></div>`;
    });
    return shell(th.name, `<div class="chat">${html}<div style="font-size:11px;opacity:.5;text-align:center;margin-top:14px">말풍선을 누르면 수첩에 적어요</div></div>`, { style: "background:#b2c7d9" });
  };
  AFTER.thread = ({ id }) => {
    const body = $("#body"); body.scrollTop = body.scrollHeight;
    const th = S.messenger.find((x) => x.id === id);
    th.msgs.forEach((m, i) => { const it = items[`${id}#${i}`]; if (visible(it)) { state.read[it.id] = 1; think(it); } });
    screen.querySelectorAll("[data-msg]").forEach((el) => el.addEventListener("click", () => {
      togglePin(el.dataset.msg); el.classList.toggle("pinned", pinned(el.dataset.msg));
    }));
  };

  /* 전화 */
  const CALL = { in: ["↙", "수신"], out: ["↗", "발신"], miss: ["↙", "부재중"], fail: ["↗", "연결 안 됨"] };
  VIEWS.calls = () => {
    const v = Object.values(items).filter((it) => it.kind === "call" && visible(it)).sort((a, b) => b.t - a.t);
    return shell("최근 통화", v.map((it) => `
      <button class="row ${it.data.type}" data-go="callDetail" data-p="${P({ id: it.id })}">
        <div class="call-ic">${CALL[it.data.type][0]}</div>
        <div class="main"><div class="t1">${esc(it.data.name)}</div><div class="t2">${CALL[it.data.type][1]}${it.data.dur ? " · " + it.data.dur : ""}</div></div>
        <div class="meta">${when(it.t)}</div></button>`).join("") || `<div class="empty">통화 기록이 없습니다</div>`);
  };
  AFTER.calls = () => { Object.values(items).forEach((it) => { if (it.kind === "call" && visible(it)) state.read[it.id] = 1; }); };
  VIEWS.callDetail = ({ id }) => {
    const it = items[id], d = it.data;
    return shell("통화 정보", `<div class="doc"><h3>${esc(d.name)}</h3>
      <div class="from">${full(it.t)}</div>
      <div class="body">${CALL[d.type][1]}${d.dur ? `\n통화 시간 ${d.dur}` : ""}</div></div>${pinBtn(id)}`);
  };
  AFTER.callDetail = ({ id }) => { bindPins(); think(items[id]); };

  /* 카드 */
  VIEWS.card = () => {
    const v = Object.values(items).filter((it) => it.kind === "card" && visible(it)).sort((a, b) => b.t - a.t);
    let html = `<div class="card-face"><div>${esc(S.card.name.split(" (")[0])}</div><div class="num">**** **** **** ${esc((S.card.name.match(/\d{4}/) || [""])[0])}</div></div>`, last = null;
    v.forEach((it) => {
      if (!last || !sameDay(last, it.t)) html += `<div class="section">${longDay(it.t)}</div>`;
      last = it.t;
      html += `<button class="row" data-go="cardDetail" data-p="${P({ id: it.id })}"><div class="main"><div class="t1">${esc(it.data.shop)}</div><div class="t2">${ampm(it.t)} · 승인</div></div><div class="amount">-${won(it.data.amount)}</div></button>`;
    });
    return shell("카드 내역", html);
  };
  AFTER.card = () => { if (S.card.thoughtEmptyDay) thinkText("card_empty", S.card.thoughtEmptyDay); };
  VIEWS.cardDetail = ({ id }) => {
    const it = items[id], d = it.data;
    return shell("결제 상세", `<div class="doc"><h3>${esc(d.shop)}</h3><div class="from">${full(it.t)}</div>
      <div class="body">결제 금액  ${won(d.amount)}\n결제 수단  ${esc(S.card.name)}\n상태  승인 완료</div></div>${pinBtn(id)}`);
  };
  AFTER.cardDetail = ({ id }) => { bindPins(); think(items[id]); };

  /* 메일 */
  VIEWS.mail = () => {
    const v = Object.values(items).filter((it) => it.kind === "mail" && visible(it)).sort((a, b) => b.t - a.t);
    return shell("받은편지함", v.map((it) => `
      <button class="row ${state.read[it.id] ? "" : "unread"}" data-go="mailDetail" data-p="${P({ id: it.id })}">
        <div class="main"><div class="t1">${esc(it.data.from)}</div><div class="t2" style="opacity:.9">${esc(it.data.subject)}</div><div class="t2">${esc(it.data.body.split("\n")[0])}</div></div>
        <div class="meta">${when(it.t)}</div></button>`).join("") || `<div class="empty">메일이 없습니다</div>`);
  };
  VIEWS.mailDetail = ({ id }) => {
    const it = items[id], d = it.data;
    return shell("메일", `<div class="doc"><h3>${esc(d.subject)}</h3><div class="from">${esc(d.from)} · ${full(it.t)}</div><div class="body">${esc(d.body)}</div></div>${pinBtn(id)}`);
  };
  AFTER.mailDetail = ({ id }) => { state.read[id] = 1; bindPins(); think(items[id]); };

  /* 사진 */
  const art = (d) => d.img ? `<img src="${esc(d.img)}" alt="">` : (ART[d.art] ? ART[d.art]() : "");
  VIEWS.photos = () => {
    const v = Object.values(items).filter((it) => it.kind === "photo" && visible(it)).sort((a, b) => a.t - b.t);
    const dv = Object.values(items).filter((it) => it.kind === "dphoto" && visible(it));
    return shell("사진", `<div class="section">최근 항목 · ${v.length}장</div>
      <div class="grid">${v.map((it) => `<button class="thumb" data-go="photo" data-p="${P({ id: it.id })}">${art(it.data)}</button>`).join("")}</div>
      <div class="section" style="margin-top:14px">기타</div>
      <button class="row" data-go="${state.flags.deleted ? "deleted" : "deletedLock"}">
        <div class="call-ic">🗑️</div><div class="main"><div class="t1">최근 삭제된 항목</div><div class="t2">${state.flags.deleted ? dv.length + "장" : "잠김 🔒"}</div></div><div class="meta">›</div></button>`);
  };
  VIEWS.deleted = () => {
    const v = Object.values(items).filter((it) => it.kind === "dphoto" && visible(it));
    return shell("최근 삭제된 항목", `<div class="section">항목은 삭제 후 30일이 지나면 영구 삭제됩니다.</div>
      <div class="grid">${v.map((it) => `<button class="thumb" data-go="photo" data-p="${P({ id: it.id })}">${art(it.data)}</button>`).join("")}</div>`);
  };
  VIEWS.photo = ({ id }) => {
    const it = items[id], d = it.data;
    let extra = "";
    if (it.kind === "dphoto") {
      const left = 30 - Math.floor((state.now - T(d.deleted)) / 864e5);
      extra = `<div class="d">삭제한 날: ${full(T(d.deleted))} · ${left > 0 ? left + "일 후 영구 삭제" : "곧 영구 삭제"}</div>`;
    }
    return shell(it.kind === "dphoto" ? "최근 삭제된 항목" : "사진", `<div class="photo-full">${art(d)}</div>
      <div class="photo-cap">${esc(d.caption || "")}<div class="d">촬영: ${full(it.t)}</div>${extra}</div>${pinBtn(id)}`);
  };
  AFTER.photo = ({ id }) => { bindPins(); think(items[id]); };

  /* 잠금 화면 (4자리) */
  function lockView(title, question, sub) {
    return shell(title, `<div class="lock">
      <div style="font-size:40px">🔒</div>
      <div class="q">${esc(sub || "보안 질문")}<b>${esc(question)}</b></div>
      <div class="dots" id="dots">${"<i></i>".repeat(4)}</div>
      <div class="msg" id="lockmsg"></div>
      <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((k) => k === "" ? "<span></span>" : `<button data-k="${k}">${k}</button>`).join("")}</div>
    </div>`);
  }
  function bindLock(onDone) {
    let code = "";
    const draw = () => screen.querySelectorAll("#dots i").forEach((el, i) => el.classList.toggle("f", i < code.length));
    const press = (k) => {
      if (k === "⌫") code = code.slice(0, -1);
      else if (code.length < 4) code += k;
      draw();
      if (code.length === 4) {
        const c = code; code = "";
        setTimeout(() => { if (!onDone(c)) { const d = $("#dots"); d.classList.remove("err"); void d.offsetWidth; d.classList.add("err"); draw(); } }, 150);
      }
    };
    screen.querySelectorAll("[data-k]").forEach((b) => b.addEventListener("click", () => press(b.dataset.k)));
    const kb = (e) => { if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === "Backspace") press("⌫"); };
    document.addEventListener("keydown", kb);
    const obs = new MutationObserver(() => { if (!$("#dots")) { document.removeEventListener("keydown", kb); obs.disconnect(); } });
    obs.observe(screen, { childList: true });
  }
  VIEWS.deletedLock = () => lockView("최근 삭제된 항목", S.deletedPhotos.lock.question);
  AFTER.deletedLock = () => bindLock((c) => {
    const L = S.deletedPhotos.lock;
    if (c === L.answer) { state.flags.deleted = 1; stack.pop(); go("deleted"); return true; }
    $("#lockmsg").textContent = L.wrong;
    if (L.trap && L.trap[c]) thinkText("trap_" + c, L.trap[c]);
    return false;
  });

  VIEWS.memo = () => shell("메모", `<div class="lock"><div style="font-size:40px">🔒</div>
    <div class="q">잠긴 메모 1개</div><div class="msg" style="color:#aaa">${esc(S.memoLock.note)}</div></div>`);

  /* 검색 · 뉴스 */
  function searchResults(q) {
    q = q.replace(/\s+/g, "").toLowerCase(); if (q.length < 2) return [];
    const out = [], seen = new Set();
    S.search.forEach((r, i) => {
      if (r.from && T(r.from) > state.now) return;
      if (!r.keys.some((k) => q.includes(k.toLowerCase()) || (k.length >= 2 && k.toLowerCase().includes(q)))) return;
      const id = r.newsId || `s#${i}`; if (seen.has(id) || (r.newsId && !visible(items[id]))) return;
      seen.add(id); out.push(items[id]);
    });
    S.news.forEach((n) => { const it = items[n.id]; if (visible(it) && !seen.has(n.id) && (n.title + n.body).replace(/\s+/g, "").toLowerCase().includes(q)) { seen.add(n.id); out.push(it); } });
    return out;
  }
  VIEWS.search = ({ tab = "web", q = "" }) => {
    const tabs = `<div class="tabs"><button class="${tab === "web" ? "on" : ""}" data-tab="web">검색</button><button class="${tab === "news" ? "on" : ""}" data-tab="news">뉴스${badge("search") ? ` (${badge("search")})` : ""}</button></div>`;
    let body;
    if (tab === "news") {
      const v = Object.values(items).filter((it) => it.kind === "news" && visible(it)).sort((a, b) => b.t - a.t);
      body = v.map((it) => `<button class="row ${state.read[it.id] ? "" : "unread"}" data-go="doc" data-p="${P({ id: it.id })}"><div class="main"><div class="t1" style="white-space:normal">${esc(it.data.title)}</div><div class="t2">${esc(it.data.press)} · ${when(it.t)}</div></div></button>`).join("");
    } else {
      const res = q ? searchResults(q) : null;
      const hist = [...state.queries].reverse().concat(S.searchHistory).filter((x, i, a) => a.indexOf(x) === i).slice(0, 8);
      body = `<form class="searchbox" id="sform"><input id="sq" placeholder="검색어 입력" value="${esc(q)}" autocomplete="off" enterkeyhint="search"><button>검색</button></form>` +
        (res === null ? `<div class="section">최근 검색어</div>${hist.map((h) => `<button class="row" data-q="${esc(h)}"><div class="call-ic">🕘</div><div class="main"><div class="t1" style="font-weight:400">${esc(h)}</div></div></button>`).join("")}`
          : res.length ? res.map((it) => `<button class="row result" data-go="doc" data-p="${P({ id: it.id })}"><div class="main"><div class="url">${esc(it.kind === "news" ? it.data.press : it.data.url)}</div><div class="t1">${esc(it.data.title)}</div><div class="t2">${esc((it.data.body || "").split("\n")[0])}</div></div></button>`).join("")
          : `<div class="empty">'${esc(q)}'에 대한 검색 결과가 없습니다.</div>`);
    }
    return shell(tab === "news" ? "뉴스" : "검색", body, { top: tabs });
  };
  AFTER.search = (p) => {
    const cur = stack[stack.length - 1];
    screen.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { cur.p = { tab: b.dataset.tab }; render(); }));
    const f = $("#sform");
    const run = (q) => { q = q.trim(); if (!q) return; state.queries = state.queries.filter((x) => x !== q).concat(q).slice(-20); cur.p = { tab: "web", q }; render(); };
    if (f) f.addEventListener("submit", (e) => { e.preventDefault(); $("#sq").blur(); run($("#sq").value); });
    screen.querySelectorAll("[data-q]").forEach((b) => b.addEventListener("click", () => run(b.dataset.q)));
  };
  VIEWS.doc = ({ id }) => {
    const it = items[id], d = it.data;
    const table = d.table ? `<table>${d.table.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table>` : "";
    const meta = it.kind === "news" ? `${esc(d.press)} · ${full(it.t)}` : esc(d.url);
    return shell(it.kind === "news" ? "뉴스" : "검색", `<div class="doc"><h3>${esc(d.title)}</h3><div class="from">${meta}</div>${table}<div class="body">${esc(d.body || "")}</div></div>${pinBtn(id)}`);
  };
  AFTER.doc = ({ id }) => { state.read[id] = 1; bindPins(); think(items[id]); };

  /* 수첩 (핀 모음) */
  VIEWS.notes = () => {
    const v = state.pins.map((id) => items[id]).filter(Boolean).sort((a, b) => (a.kind === "web") - (b.kind === "web") || a.t - b.t);
    return shell("수사 수첩", v.length ? `<div class="section">시간 순서대로 · ${v.length}개</div>` + v.map((it) => `
      <button class="row" data-open="${esc(it.id)}"><div class="main"><div class="t1" style="white-space:normal;font-weight:500">${esc(label(it))}</div><div class="t2">${it.kind === "web" ? esc(it.data.url) : full(it.t)}</div></div></button>`).join("")
      : `<div class="empty">아직 적어 둔 단서가 없다.<br><br>메시지·메일·사진·뉴스에서<br>📌 를 눌러 단서를 모아 보세요.</div>`);
  };
  AFTER.notes = () => screen.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => open(items[b.dataset.open])));

  /* 설정 · 저장 슬롯 */
  VIEWS.settings = () => shell("설정", `
    <div class="section">게임</div>
    <button class="row" data-go="slots"><div class="main"><div class="t1">저장 · 불러오기</div><div class="t2">슬롯 5개</div></div><div class="meta">›</div></button>
    <div class="row"><div class="main"><div class="t1">알림음</div></div><button class="toggle ${prefs.sound ? "on" : ""}" id="tg-sound">${prefs.sound ? "켬" : "끔"}</button></div>
    <div class="row"><div class="main"><div class="t1">진동</div><div class="t2">아이폰에선 화면 흔들림으로 대신해요</div></div><button class="toggle ${prefs.vibe ? "on" : ""}" id="tg-vibe">${prefs.vibe ? "켬" : "끔"}</button></div>
    <button class="row" id="to-title"><div class="main"><div class="t1">처음 화면으로</div><div class="t2">진행 상황은 자동 저장돼요</div></div></button>`);
  AFTER.settings = () => {
    $("#tg-sound").onclick = () => { prefs.sound = !prefs.sound; store.set("_prefs", prefs); unlockAudio(); ding(); render(); };
    $("#tg-vibe").onclick = () => { prefs.vibe = !prefs.vibe; store.set("_prefs", prefs); render(); };
    $("#to-title").onclick = () => { autosave(); stack = [{ view: "title", p: {} }]; render(); };
  };
  VIEWS.slots = ({ loadOnly }) => {
    let html = `<div class="section">${loadOnly ? "불러올 저장을 고르세요" : "언제든 저장한 시점으로 돌아갈 수 있어요"}</div>`;
    for (let i = 1; i <= 5; i++) {
      const s = store.get("_slot" + i);
      html += `<div class="slot"><div class="main"><div class="t1">슬롯 ${i}</div><div class="t2" style="opacity:.6;font-size:13px">${s ? `${dateLabel(s.now)} ${hhmm(s.now)} · 단서 ${s.pins.length}개` : "비어 있음"}</div></div>
        ${loadOnly ? "" : `<button data-save="${i}">저장</button>`}
        <button class="primary" data-load="${i}" ${s ? "" : "disabled"}>불러오기</button></div>`;
    }
    return shell("저장 · 불러오기", html);
  };
  AFTER.slots = () => {
    screen.querySelectorAll("[data-save]").forEach((b) => b.addEventListener("click", () => {
      const i = b.dataset.save;
      const save = () => { store.set("_slot" + i, Object.assign({}, state, { savedAt: Date.now() })); render(); };
      if (store.get("_slot" + i)) ask(`슬롯 ${i}에 덮어쓸까요?`, "덮어쓰기", save); else save();
    }));
    screen.querySelectorAll("[data-load]").forEach((b) => b.addEventListener("click", () => {
      const s = store.get("_slot" + b.dataset.load); if (!s) return;
      const load = () => { state = s; home(); };
      if (state) ask("이 저장 시점으로 돌아갈까요? 지금 진행 상황은 사라져요.", "불러오기", load); else load();
    }));
  };

  /* 체험판 끝 */
  VIEWS.end = () => `<div class="title"><h1>${esc(S.title)}</h1>
    <div class="sub">체험판을 끝까지 해 주셔서 고마워요.<br>수첩에 모은 단서 ${state.pins.length}개</div>
    <button class="btn" id="e-home">핸드폰 더 살펴보기</button>
    <button class="btn" id="e-title">처음 화면으로</button></div>`;
  AFTER.end = () => { $("#e-home").onclick = home; $("#e-title").onclick = () => { stack = [{ view: "title", p: {} }]; render(); }; };

  /* 확인 창 (브라우저 기본 confirm 대신) */
  function ask(text, yes, onYes) {
    overlay.innerHTML = `<div class="scene" style="cursor:default;align-items:center;text-align:center">
      <p class="line" style="opacity:1;animation:none">${esc(text)}</p>
      <div style="display:flex;gap:10px;margin-top:10px"><button class="pin-btn" style="margin:0" id="ask-no">취소</button><button class="pin-btn on" style="margin:0" id="ask-yes">${esc(yes)}</button></div></div>`;
    overlay.classList.add("show"); overlay.onclick = null;
    $("#ask-no").onclick = () => overlay.classList.remove("show");
    $("#ask-yes").onclick = () => { overlay.classList.remove("show"); onYes(); };
  }

  /* ================= 진행 ================= */
  function showScene(lines, dateTs, cb) {
    overlay.innerHTML = `<div class="scene">${dateTs ? `<div class="date">${esc(longDay(dateTs))} · ${ampm(dateTs)}</div>` : ""}
      ${lines.map((l, i) => `<p class="line" style="animation-delay:${i * 0.9}s">${esc(l)}</p>`).join("")}<div class="tap">눌러서 계속</div></div>`;
    overlay.classList.add("show");
    const t0 = Date.now(); let shown = false;
    overlay.onclick = () => {
      if (!shown && Date.now() - t0 < lines.length * 900) { shown = true; overlay.querySelectorAll(".line").forEach((p) => { p.style.animation = "none"; p.style.opacity = 1; }); return; }
      overlay.classList.remove("show"); overlay.onclick = null; cb && cb();
    };
  }
  function dayIntro() { const d = S.days[state.day]; showScene(d.intro || [], state.now, () => render()); }

  let busy = false;
  function advance() {
    if (busy) return;
    const ns = nextStep();
    if (!ns) return sleep();
    busy = true;
    state.now = ns.t;
    if (ns.scene) {
      render();
      showScene(ns.scene.lines, ns.t, () => {
        if (ns.scene.jumpTo) {
          state.now = T(`${S.days[state.day].date} ${ns.scene.jumpTo}`); render();
          showScene(ns.scene.after || [], state.now, () => { busy = false; render(); });
        } else { busy = false; render(); }
      });
      return;
    }
    render();
    ns.items.forEach((it, i) => setTimeout(() => { try { notify(it); } finally { if (i === ns.items.length - 1) busy = false; } }, i * 1100));
  }
  function sleep(force) {
    const d = S.days[state.day];
    const unread = Object.values(items).some((it) => visible(it) && !state.read[it.id] && it.kind === "msg" && it.data.who !== "me");
    if (unread && force !== true) return ask("아직 읽지 않은 메시지가 있어요. 그래도 잠들까요?", "잠자기", () => sleep(true));
    showScene(d.outro || [], null, () => {
      if (d.demoEnd || state.day + 1 >= S.days.length) { state.flags.demoEnd = 1; autosave(); stack = [{ view: "end", p: {} }]; render(); return; }
      state.day++; state.now = dayStart(state.day); home(); dayIntro();
    });
  }
  function notify(it) {
    const d = it.data;
    const n = {
      msg: () => [APPS.messenger, it.thread.name, d.text],
      call: () => [APPS.calls, d.type === "miss" ? "부재중 전화" : "전화", d.name],
      card: () => [APPS.card, "카드 승인", `${d.shop} ${won(d.amount)}`],
      mail: () => [APPS.mail, d.from, d.subject],
      news: () => [APPS.search, d.press + " 속보", d.title]
    }[it.kind]();
    const el = document.createElement("button");
    el.className = "notif";
    el.innerHTML = `<div class="ic" style="background:${n[0].bg}">${n[0].ic}</div><div style="flex:1;min-width:0"><div style="display:flex"><span class="nt">${esc(n[1])}</span><span class="nm">지금</span></div><div class="nb">${esc(n[2])}</div></div>`;
    el.onclick = () => { el.remove(); open(it); };
    notifLayer.appendChild(el);
    while (notifLayer.children.length > 3) notifLayer.firstChild.remove();
    ding();
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 320); }, 5000);
    render();
  }

  /* 시작 */
  stack = [{ view: "title", p: {} }];
  render();
})();
