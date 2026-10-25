/* 게임 엔진. 스토리 내용은 story.js 에 있고, 여기는 화면과 진행 규칙만 다룹니다. */
(function () {
  "use strict";
  const S = window.STORY, ART = window.ART;
  const $ = (s) => document.querySelector(s);
  const screen = $("#screen"), overlay = $("#overlay"), toast = $("#toast"), notifLayer = $("#notif-layer"), phone = $("#phone");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s).replace(/\s+/g, "").toLowerCase();

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
  const items = {}; // id -> {id, kind, t, data}
  function add(id, kind, t, data, extra) { items[id] = Object.assign({ id, kind, t: T(t), data }, extra); return items[id]; }
  S.messenger.forEach((th) => th.msgs.forEach((m, i) => add(`${th.id}#${i}`, "msg", m.t, m, { thread: th })));
  S.calls.forEach((c, i) => add(`call#${i}`, "call", c.t, c));
  S.card.items.forEach((c, i) => add(`card#${i}`, "card", c.t, c));
  S.card2.items.forEach((c, i) => add(`card2#${i}`, "card2", c.t, c));
  S.email.forEach((m, i) => add(`mail#${i}`, "mail", m.t, m));
  S.email2.items.forEach((m, i) => add(`mail2#${i}`, "mail2", m.t, m));
  S.news.forEach((n) => add(n.id, "news", n.t, n));
  S.photos.forEach((p) => add(p.id, "photo", p.t, p));
  S.deletedPhotos.items.forEach((p) => add(p.id, "dphoto", p.t, p, { shownAt: T(p.deleted) }));
  S.search.forEach((r, i) => { if (!r.newsId) add(`s#${i}`, "web", r.from || "1/1 00:00", r); });
  S.sns.posts.forEach((p) => add(p.id, "post", p.t, p));
  S.sns.dms.forEach((m, i) => add(`dm#${i}`, "dm", m.t, m));
  S.secret.items.forEach((m, i) => add(`sec#${i}`, "secret", m.t, m));

  const NOTIFY_KINDS = ["msg", "call", "card", "mail", "news", "dm"];
  const notifiable = (it) => NOTIFY_KINDS.includes(it.kind) && it.data.who !== "me" && !it.data.silent && (it.kind !== "call" || it.data.type === "miss");
  const visible = (it) => (it.shownAt || it.t) <= state.now;

  /* 하루 진행 단계 만들기 */
  function dayStart(i) { const d = S.days[i]; return T(`${d.date} ${d.start}`); }
  function dayEnd(i) {
    const d = S.days[i], midnight = T(`${d.date} 00:00`) + 864e5;
    if (d.final) return midnight;
    return Math.min(i + 1 < S.days.length ? dayStart(i + 1) : Infinity, midnight + 4 * 36e5);
  }
  function steps(i) {
    const lo = dayStart(i), hi = dayEnd(i);
    const ev = Object.values(items).filter((it) => notifiable(it) && it.t > lo && it.t < hi).map((it) => ({ t: it.t, item: it }));
    (S.days[i].scenes || []).forEach((sc) => ev.push({ t: T(`${S.days[i].date} ${sc.t}`), scene: sc }));
    ev.sort((a, b) => a.t - b.t || (a.scene ? -1 : 1));
    const out = [];
    for (const e of ev) {
      const last = out[out.length - 1];
      /* 15분 안에 이어서 온 알림은 한 번에 묶어서 보여 줘요 */
      if (!e.scene && last && !last.scene && e.t - last.items[last.items.length - 1].t <= 15 * 6e4) last.items.push(e.item);
      else out.push(e.scene ? { t: e.t, scene: e.scene } : { t: e.t, items: [e.item] });
      if (e.scene && e.scene.endDay) break;
    }
    return out;
  }
  const nextStep = () => steps(state.day).find((s) => s.t > state.now);

  /* ================= 상태 · 저장 ================= */
  const KEY = "mulddae_full_v1";
  let state = null;
  const fresh = () => ({ v: 2, day: 0, now: dayStart(0), read: {}, thoughts: {}, pins: [], flags: {}, queries: [] });
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(KEY + k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(KEY + k); } catch (e) {} }
  };
  const prefs = Object.assign({ sound: true, vibe: true }, store.get("_prefs") || {});
  const copy = (o) => JSON.parse(JSON.stringify(o));
  const autosave = () => { if (state && !state.flags.over) store.set("_auto", Object.assign(copy(state), { savedAt: Date.now() })); };

  /* ================= 소리 · 진동 ================= */
  let actx = null;
  function unlockAudio() {
    try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); } catch (e) {}
  }
  function tone(notes) {
    if (!prefs.sound || !actx) return;
    const t0 = actx.currentTime;
    notes.forEach(([f, dt, len = 0.35, vol = 0.22]) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0 + dt); g.gain.linearRampToValueAtTime(vol, t0 + dt + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t0 + dt + len);
      o.connect(g).connect(actx.destination); o.start(t0 + dt); o.stop(t0 + dt + len + 0.05);
    });
  }
  function buzz(pattern) {
    if (!prefs.vibe) return;
    try { navigator.vibrate && navigator.vibrate(pattern || [140, 70, 140]); } catch (e) {}
    phone.classList.remove("shake"); void phone.offsetWidth; phone.classList.add("shake");
  }
  function ding() { tone([[988, 0], [1319, 0.13]]); buzz(); }

  /* ================= 앱 목록 ================= */
  const APPS = {
    messenger: { name: "메신저", ic: "💬", bg: "#fee500" },
    calls: { name: "전화", ic: "📞", bg: "#34c759" },
    card: { name: "카드", ic: "💳", bg: "#0f7a6b" },
    mail: { name: "메일", ic: "✉️", bg: "#2f7cf6" },
    photos: { name: "사진", ic: "🌅", bg: "#f2f2f2" },
    search: { name: "검색", ic: "🔍", bg: "#03c75a" },
    sns: { name: "SNS", ic: "📷", bg: "#c13584" },
    notes: { name: "수첩", ic: "📌", bg: "#ff9f0a" },
    memo: { name: "메모", ic: "📝", bg: "#ffd60a" },
    settings: { name: "설정", ic: "⚙️", bg: "#8e8e93" }
  };
  function badge(app) {
    const v = Object.values(items).filter((it) => visible(it) && !state.read[it.id]);
    if (app === "messenger") return v.filter((it) => it.kind === "msg" && it.data.who !== "me").length;
    if (app === "mail") return v.filter((it) => it.kind === "mail").length;
    if (app === "calls") return v.filter((it) => it.kind === "call" && it.data.type === "miss").length;
    if (app === "search") return v.filter((it) => it.kind === "news").length;
    if (app === "sns") return v.filter((it) => (it.kind === "dm" && it.data.who !== "me") || it.kind === "post").length;
    return 0;
  }

  /* ================= 화면 이동 ================= */
  let stack = [];
  function go(view, p) { clearThoughts(); stack.push({ view, p: p || {} }); render(); }
  function back() { clearThoughts(); stack.pop(); if (!stack.length) stack.push({ view: "home", p: {} }); render(); }
  function home() { clearThoughts(); stack = [{ view: "home", p: {} }]; render(); }
  const NO_BAR = ["title", "over", "end", "call", "blank"];
  function render() {
    const cur = stack[stack.length - 1];
    const bar = state && !NO_BAR.includes(cur.view);
    $("#sb-time").textContent = bar ? hhmm(state.now) : "";
    $("#sb-date").textContent = bar ? dateLabel(state.now) : "";
    phone.appendChild(toast);
    screen.innerHTML = VIEWS[cur.view](cur.p);
    placeToast();
    screen.querySelectorAll("[data-go]").forEach((el) => el.addEventListener("click", () => {
      const p = el.dataset.p ? JSON.parse(el.dataset.p) : {}; go(el.dataset.go, p);
    }));
    screen.querySelectorAll("[data-back]").forEach((el) => el.addEventListener("click", back));
    screen.querySelectorAll("[data-home]").forEach((el) => el.addEventListener("click", home));
    (AFTER[cur.view] || (() => {}))(cur.p);
    if (state && !NO_BAR.includes(cur.view)) autosave();
  }
  const P = (o) => esc(JSON.stringify(o));
  const shell = (title, body, opts = {}) => `
    <div class="app-view" style="${opts.style || ""}">
      <div class="app-head"><button class="back" data-back aria-label="뒤로">‹</button><h2>${esc(title)}</h2></div>
      ${opts.top || ""}
      <div class="app-body" id="body">${body}</div>
      <div class="home-bar"><button data-home aria-label="홈"></button></div>
    </div>`;
  const tabsHtml = (tabs, cur) => `<div class="tabs">${tabs.map(([k, l]) => `<button class="${k === cur ? "on" : ""}" data-tab="${k}">${l}</button>`).join("")}</div>`;
  function bindTabs() {
    const cur = stack[stack.length - 1];
    screen.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { clearThoughts(); cur.p = { tab: b.dataset.tab }; render(); }));
  }

  /* ================= 속마음 · 핀 ================= */
  const thoughtQ = [];
  function think(it) { if (it && it.data.thought) thinkText(it.id, it.data.thought); }
  function thinkText(key, text) {
    if (state.thoughts[key] || thoughtQ.some((q) => q.key === key)) return;
    thoughtQ.push({ key, text }); showThought();
  }
  function showThought() {
    if (toast.classList.contains("show") || !thoughtQ.length) return;
    const q = thoughtQ.shift(); state.thoughts[q.key] = 1;
    (state.thoughtLog = state.thoughtLog || []).push({ key: q.key, text: q.text, t: state.now }); autosave();
    const b = $("#body"), atBottom = b && b.scrollHeight - b.scrollTop - b.clientHeight < 40;
    toast.innerHTML = `<div class="lab">속마음 · 눌러서 닫기 · 수첩에서 다시 볼 수 있어요</div>${esc(q.text)}`;
    toast.classList.add("show");
    if (b && atBottom) b.scrollTop = b.scrollHeight;
  }
  /* 속마음 칸은 앱 화면 아래쪽에 자리를 차지해서, 메시지를 가리지 않아요 */
  function placeToast() {
    const view = screen.querySelector(".app-view"), bar = view && view.querySelector(".home-bar");
    if (bar) { view.insertBefore(toast, bar); toast.classList.add("inflow"); }
    else toast.classList.remove("inflow");
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
  const CALL = { in: ["↙", "수신"], out: ["↗", "발신"], miss: ["↙", "부재중"], fail: ["↗", "연결 안 됨"] };
  function label(it) {
    const d = it.data;
    switch (it.kind) {
      case "msg": return `${it.thread.name}: ${d.who === "me" ? "(나) " : ""}${d.text}`;
      case "call": return `통화 · ${d.name} (${CALL[d.type][1]})`;
      case "card": return `카드 · ${d.shop} ${won(d.amount)}`;
      case "card2": return `숨겨진 카드 · ${d.shop} ${won(d.amount)}`;
      case "mail": return `메일 · ${d.subject}`;
      case "mail2": return `두 번째 메일 · ${d.subject}`;
      case "news": return `뉴스 · ${d.title}`;
      case "photo": case "dphoto": return `사진 · ${d.caption || (it.kind === "dphoto" ? "최근 삭제된 사진" : "")}`;
      case "web": return `검색 · ${d.title}`;
      case "post": return `SNS · ${d.name}: ${d.text.split("\n")[0]}`;
      case "dm": return `SNS DM · ${d.who === "me" ? "(나) " : "한상철: "}${d.text}`;
      case "secret": return `시크릿 검색 · ${d.q}`;
    }
  }
  function open(it) {
    const map = { msg: ["thread", { id: it.thread && it.thread.id }], call: ["callDetail", { id: it.id }], card: ["cardDetail", { id: it.id }],
      card2: ["cardDetail", { id: it.id }], mail: ["mailDetail", { id: it.id }], mail2: ["mailDetail", { id: it.id }],
      news: ["doc", { id: it.id }], web: ["doc", { id: it.id }], photo: ["photo", { id: it.id }], dphoto: ["photo", { id: it.id }],
      post: ["sns", { tab: "feed" }], dm: ["sns", { tab: "dm" }], secret: ["doc", { id: it.id }] };
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
    const ns = nextStep(), d = S.days[state.day];
    const btn = ns ? `⏩ 시간 보내기 <small>다음 일을 기다린다</small>`
      : d.final ? `🔎 결정을 내린다 <small>마지막 추리</small>` : `🌙 잠자기 <small>오늘을 마친다</small>`;
    const apps = Object.entries(APPS).map(([k, a]) => {
      const b = badge(k);
      return `<button class="app" data-go="${k}"><div class="ic" style="background:${a.bg}">${a.ic}</div>${a.name}${b ? `<span class="badge">${b}</span>` : ""}</button>`;
    }).join("");
    return `<div class="home">
      <div class="widget"><div class="big">${hhmm(state.now)}</div><div class="small">${dateLabel(state.now)} · 202×년</div></div>
      <div class="apps">${apps}</div>
      <div class="dock"><button class="advance ${!ns && d.final ? "final" : ""}" id="adv">${btn}</button></div>
    </div>`;
  };
  AFTER.home = () => { $("#adv").onclick = () => advance(); };

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
  function chatHtml(list, group) {
    let html = "", lastDay = null, lastWho = null;
    list.forEach((it) => {
      const m = it.data;
      if (lastDay === null || !sameDay(lastDay, it.t)) { html += `<div class="day">${longDay(it.t)}</div>`; lastWho = null; }
      lastDay = it.t;
      const me = m.who === "me";
      if (!me && group && lastWho !== m.who) html += `<div class="who">${esc(m.who)}</div>`;
      lastWho = m.who;
      html += `<div class="bub-wrap ${me ? "me" : ""} ${pinned(it.id) ? "pinned" : ""}" data-msg="${esc(it.id)}">
        <div class="bub">${esc(m.text)}</div>
        <div class="bub-meta">${m.unread ? `<span class="one">1</span>` : ""}${ampm(it.t)}</div></div>`;
    });
    return `<div class="chat">${html}<div style="font-size:11px;opacity:.5;text-align:center;margin-top:14px">말풍선을 누르면 수첩에 적어요</div></div>`;
  }
  function bindChat(list) {
    const body = $("#body"); body.scrollTop = body.scrollHeight;
    list.forEach((it) => { state.read[it.id] = 1; think(it); });
    screen.querySelectorAll("[data-msg]").forEach((el) => el.addEventListener("click", () => {
      togglePin(el.dataset.msg); el.classList.toggle("pinned", pinned(el.dataset.msg));
    }));
  }
  const threadItems = (id) => S.messenger.find((x) => x.id === id).msgs.map((m, i) => items[`${id}#${i}`]).filter(visible);
  VIEWS.thread = ({ id }) => {
    const th = S.messenger.find((x) => x.id === id);
    return shell(th.name, chatHtml(threadItems(id), th.group), { style: "background:#b2c7d9" });
  };
  AFTER.thread = ({ id }) => bindChat(threadItems(id));

  /* 전화 */
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
  VIEWS.card = ({ tab = "main" }) => {
    const two = tab === "two" && state.flags.card2;
    const C = two ? S.card2 : S.card, kind = two ? "card2" : "card";
    const v = Object.values(items).filter((it) => it.kind === kind && visible(it)).sort((a, b) => b.t - a.t);
    let html = `<div class="card-face ${two ? "dark" : ""}"><div>${esc(C.name)}</div><div class="num">**** **** **** ${esc(C.last4)}</div></div>`, last = null;
    v.forEach((it) => {
      if (!last || !sameDay(last, it.t)) html += `<div class="section">${longDay(it.t)}</div>`;
      last = it.t;
      html += `<button class="row" data-go="cardDetail" data-p="${P({ id: it.id })}"><div class="main"><div class="t1">${esc(it.data.shop)}</div><div class="t2">${ampm(it.t)} · 승인</div></div><div class="amount">-${won(it.data.amount)}</div></button>`;
    });
    if (!state.flags.card2) html += `<button class="row" data-go="card2Lock" style="justify-content:center;color:#4ea1ff">＋ 다른 카드 등록</button>`;
    const top = state.flags.card2 ? tabsHtml([["main", `${S.card.name.split(" ")[1] || "카드"} ${S.card.last4}`], ["two", `${S.card2.name.split(" ")[1] || "카드"} ${S.card2.last4}`]], two ? "two" : "main") : "";
    return shell("카드 내역", html, { top });
  };
  AFTER.card = ({ tab }) => {
    bindTabs();
    if (tab === "two" && state.flags.card2) thinkText("card2_open", S.card2.thought);
    else if (S.card.thoughtEmptyDay && state.now > T("6/21 12:00")) thinkText("card_empty", S.card.thoughtEmptyDay);
  };
  VIEWS.cardDetail = ({ id }) => {
    const it = items[id], d = it.data, C = it.kind === "card2" ? S.card2 : S.card;
    return shell("결제 상세", `<div class="doc"><h3>${esc(d.shop)}</h3><div class="from">${full(it.t)}</div>
      <div class="body">결제 금액  ${won(d.amount)}\n결제 수단  ${esc(C.name)} (****${esc(C.last4)})\n상태  승인 완료</div></div>${pinBtn(id)}`);
  };
  AFTER.cardDetail = ({ id }) => { bindPins(); think(items[id]); };
  VIEWS.card2Lock = () => pinView("카드 등록", S.card2.lockQuestion, 4, "새 카드");
  AFTER.card2Lock = () => bindPin(4, (c) => {
    if (c === S.card2.last4 && state.flags.statement) { state.flags.card2 = 1; ding(); stack.pop(); stack[stack.length - 1].p = { tab: "two" }; render(); return true; }
    $("#lockmsg").textContent = c === S.card2.last4 ? "카드 정보를 확인할 수 없습니다. 명세서를 먼저 확인하세요." : "등록할 수 없는 카드 번호입니다.";
    return false;
  });

  /* 메일 */
  VIEWS.mail = ({ tab = "main" }) => {
    const top = tabsHtml([["main", "내 메일"], ["two", state.flags.mail2 ? S.email2.address.split("@")[0] : "다른 계정 🔒"]], tab);
    if (tab === "two" && !state.flags.mail2) {
      return shell("메일", `<div class="lock">
        <div style="font-size:36px">✉️</div>
        <div class="q">${esc(S.email2.address)}<br><span style="font-size:13px">로그아웃됨 · 이 기기에 저장된 계정</span></div>
        <div class="q" style="margin-top:8px">비밀번호 찾기 · 보안 질문<b>${esc(S.email2.question)}</b></div>
        <form id="tform" style="display:flex;gap:8px;width:100%;max-width:300px"><input id="tans" class="tinput" placeholder="답 입력" autocomplete="off"><button class="tbtn">확인</button></form>
        <div class="msg" id="lockmsg"></div></div>`, { top });
    }
    const kind = tab === "two" ? "mail2" : "mail";
    const v = Object.values(items).filter((it) => it.kind === kind && visible(it)).sort((a, b) => b.t - a.t);
    return shell("메일", v.map((it) => `
      <button class="row ${state.read[it.id] ? "" : "unread"}" data-go="mailDetail" data-p="${P({ id: it.id })}">
        <div class="main"><div class="t1">${esc(it.data.from)}</div><div class="t2" style="opacity:.9">${esc(it.data.subject)}</div><div class="t2">${esc(it.data.body.split("\n")[0])}</div></div>
        <div class="meta">${when(it.t)}</div></button>`).join("") || `<div class="empty">메일이 없습니다</div>`, { top });
  };
  AFTER.mail = () => {
    bindTabs();
    const f = $("#tform"); if (!f) return;
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const a = norm($("#tans").value);
      if (S.email2.answers.some((x) => norm(x) === a)) { state.flags.mail2 = 1; ding(); render(); }
      else { $("#lockmsg").textContent = "답이 일치하지 않습니다."; $("#tans").value = ""; }
    });
  };
  VIEWS.mailDetail = ({ id }) => {
    const it = items[id], d = it.data;
    return shell("메일", `<div class="doc"><h3>${esc(d.subject)}</h3><div class="from">${esc(d.from)} · ${full(it.t)}</div><div class="body">${esc(d.body)}</div></div>${pinBtn(id)}`);
  };
  AFTER.mailDetail = ({ id }) => { const it = items[id]; state.read[id] = 1; if (it.data.flag) state.flags[it.data.flag] = 1; bindPins(); think(it); };

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
    return shell("최근 삭제된 항목", `<div class="section">삭제한 항목은 이곳에 보관됩니다.</div>
      <div class="grid">${v.map((it) => `<button class="thumb" data-go="photo" data-p="${P({ id: it.id })}">${art(it.data)}</button>`).join("")}</div>
      ${v.length ? "" : `<div class="empty">삭제된 항목이 없습니다</div>`}`);
  };
  VIEWS.photo = ({ id }) => {
    const it = items[id], d = it.data;
    const extra = it.kind === "dphoto" ? `<div class="d">삭제한 날: ${full(it.shownAt)}</div>` : "";
    return shell(it.kind === "dphoto" ? "최근 삭제된 항목" : "사진", `<div class="photo-full">${art(d)}</div>
      <div class="photo-cap">${esc(d.caption || "")}<div class="d">촬영: ${full(it.t)}</div>${extra}</div>${pinBtn(id)}`);
  };
  AFTER.photo = ({ id }) => { bindPins(); think(items[id]); };

  /* 숫자 잠금 */
  function pinView(title, question, len, sub) {
    return shell(title, `<div class="lock">
      <div style="font-size:40px">🔒</div>
      <div class="q">${esc(sub || "보안 질문")}<b>${esc(question)}</b></div>
      <div class="dots" id="dots">${"<i></i>".repeat(len)}</div>
      <div class="msg" id="lockmsg"></div>
      <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((k) => k === "" ? "<span></span>" : `<button data-k="${k}">${k}</button>`).join("")}</div>
    </div>`);
  }
  function bindPin(len, onDone) {
    let code = "";
    const draw = () => screen.querySelectorAll("#dots i").forEach((el, i) => el.classList.toggle("f", i < code.length));
    const press = (k) => {
      if (k === "⌫") code = code.slice(0, -1);
      else if (code.length < len) code += k;
      draw();
      if (code.length === len) {
        const c = code; code = "";
        setTimeout(() => { if (!onDone(c)) { const d = $("#dots"); if (!d) return; d.classList.remove("err"); void d.offsetWidth; d.classList.add("err"); draw(); } }, 150);
      }
    };
    screen.querySelectorAll("[data-k]").forEach((b) => b.addEventListener("click", () => press(b.dataset.k)));
    const kb = (e) => { if (e.target.tagName === "INPUT") return; if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === "Backspace") press("⌫"); };
    document.addEventListener("keydown", kb);
    const obs = new MutationObserver(() => { if (!$("#dots")) { document.removeEventListener("keydown", kb); obs.disconnect(); } });
    obs.observe(screen, { childList: true });
  }
  VIEWS.deletedLock = () => pinView("최근 삭제된 항목", S.deletedPhotos.lock.question, 4);
  AFTER.deletedLock = () => bindPin(4, (c) => {
    const L = S.deletedPhotos.lock;
    if (c === L.answer) { state.flags.deleted = 1; ding(); stack.pop(); go("deleted"); return true; }
    $("#lockmsg").textContent = L.wrong;
    if (L.trap && L.trap[c]) thinkText("trap_" + c, L.trap[c]);
    return false;
  });

  /* 메모 (두 번째 인격의 일기) */
  VIEWS.memo = () => {
    if (!state.flags.memo) return pinView("메모", S.memo.question, S.memo.answer.length, "잠긴 메모 · 1개");
    const es = S.memo.entries.filter((e) => !e.t || T(e.t) <= state.now);
    return shell("메모", es.length ? `<div class="doc diary">${es.map((e) => `<h3>${esc(e.d)}</h3><div class="body">${esc(e.text)}</div>`).join("")}</div>` : `<div class="empty">아직 아무것도 적혀 있지 않다.</div>`);
  };
  AFTER.memo = () => {
    if (state.flags.memo) { thinkText("memo_open", S.memo.thought); return; }
    bindPin(S.memo.answer.length, (c) => {
      if (c === S.memo.answer) { state.flags.memo = 1; ding(); render(); return true; }
      $("#lockmsg").textContent = "틀렸습니다."; return false;
    });
  };

  /* 검색 · 뉴스 · 시크릿 */
  function searchResults(q) {
    q = norm(q); if (q.length < 2) return [];
    const out = [], seen = new Set();
    S.search.forEach((r, i) => {
      if (r.from && T(r.from) > state.now) return;
      if (!r.keys.some((k) => q.includes(norm(k)) || (k.length >= 2 && norm(k).includes(q)))) return;
      const id = r.newsId || `s#${i}`; if (seen.has(id) || (r.newsId && !visible(items[id]))) return;
      seen.add(id); out.push(items[id]);
    });
    S.news.forEach((n) => { const it = items[n.id]; if (visible(it) && !seen.has(n.id) && norm(n.title + n.body).includes(q)) { seen.add(n.id); out.push(it); } });
    return out;
  }
  VIEWS.search = ({ tab = "web", q = "" }) => {
    const nb = badge("search");
    const top = tabsHtml([["web", "검색"], ["news", `뉴스${nb ? ` (${nb})` : ""}`], ["secret", `시크릿${state.flags.secret ? "" : " 🔒"}`]], tab);
    let body;
    if (tab === "news") {
      const v = Object.values(items).filter((it) => it.kind === "news" && visible(it)).sort((a, b) => b.t - a.t);
      body = v.map((it) => `<button class="row ${state.read[it.id] ? "" : "unread"}" data-go="doc" data-p="${P({ id: it.id })}"><div class="main"><div class="t1" style="white-space:normal">${esc(it.data.title)}</div><div class="t2">${esc(it.data.press)} · ${when(it.t)}</div></div></button>`).join("") || `<div class="empty">뉴스가 없습니다</div>`;
    } else if (tab === "secret") {
      if (!state.flags.secret) return shell("시크릿 모드", patternHtml(), { top });
      const v = Object.values(items).filter((it) => it.kind === "secret" && visible(it)).sort((a, b) => b.t - a.t);
      body = `<div class="section">시크릿 모드 검색 기록</div>` + v.map((it) => `<button class="row" data-go="doc" data-p="${P({ id: it.id })}"><div class="call-ic">🕶</div><div class="main"><div class="t1" style="font-weight:400;white-space:normal">${esc(it.data.q)}</div><div class="t2">${full(it.t)}</div></div><div class="meta">${pinned(it.id) ? "📌" : ""}</div></button>`).join("");
    } else {
      const res = q ? searchResults(q) : null;
      const hist = [...state.queries].reverse().concat(S.searchHistory).filter((x, i, a) => a.indexOf(x) === i).slice(0, 8);
      body = `<form class="searchbox" id="sform"><input id="sq" placeholder="검색어 입력" value="${esc(q)}" autocomplete="off" enterkeyhint="search"><button>검색</button></form>` +
        (res === null ? `<div class="section">최근 검색어</div>${hist.map((h) => `<button class="row" data-q="${esc(h)}"><div class="call-ic">🕘</div><div class="main"><div class="t1" style="font-weight:400">${esc(h)}</div></div></button>`).join("")}`
          : res.length ? res.map((it) => `<button class="row result" data-go="doc" data-p="${P({ id: it.id })}"><div class="main"><div class="url">${esc(it.kind === "news" ? it.data.press : it.data.url)}</div><div class="t1">${esc(it.data.title)}</div><div class="t2">${esc((it.data.body || "").split("\n")[0])}</div></div></button>`).join("")
          : `<div class="empty">'${esc(q)}'에 대한 검색 결과가 없습니다.</div>`);
    }
    return shell(tab === "news" ? "뉴스" : tab === "secret" ? "시크릿 모드" : "검색", body, { top });
  };
  AFTER.search = ({ tab }) => {
    const cur = stack[stack.length - 1];
    bindTabs();
    const f = $("#sform");
    const run = (q) => { q = q.trim(); if (!q) return; state.queries = state.queries.filter((x) => x !== q).concat(q).slice(-20); cur.p = { tab: "web", q }; render(); };
    if (f) f.addEventListener("submit", (e) => { e.preventDefault(); $("#sq").blur(); run($("#sq").value); });
    screen.querySelectorAll("[data-q]").forEach((b) => b.addEventListener("click", () => run(b.dataset.q)));
    if (tab === "secret") {
      if (state.flags.secret) {
        thinkText("secret_open", S.secret.thought);
      } else bindPattern();
    }
  };
  /* 패턴 잠금 (점을 순서대로 누르거나 이어 그리기) */
  const DOT = (n) => [((n - 1) % 3) * 80 + 40, Math.floor((n - 1) / 3) * 80 + 40];
  function patternHtml() {
    return `<div class="lock"><div style="font-size:36px">🕶</div>
      <div class="q">시크릿 모드는 잠겨 있습니다<b>패턴을 그려 주세요</b></div>
      <svg id="pat" viewBox="0 0 240 240" width="240" height="240" style="max-width:100%;touch-action:none">
        <polyline id="patline" fill="none" stroke="#4ea1ff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" points=""/>
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => { const [x, y] = DOT(n); return `<circle class="pdot" data-n="${n}" cx="${x}" cy="${y}" r="13" fill="#3a3a46"/>`; }).join("")}
      </svg>
      <div style="font-size:12px;opacity:.5">점을 순서대로 누르거나 손가락으로 이어 그리세요</div>
      <div style="display:flex;gap:10px"><button class="tbtn ghost" id="pat-clear">지우기</button><button class="tbtn" id="pat-ok">확인</button></div>
      <div class="msg" id="lockmsg"></div></div>`;
  }
  function bindPattern() {
    let seq = [], drawing = false;
    const svg = $("#pat");
    const draw = () => {
      $("#patline").setAttribute("points", seq.map((n) => DOT(n).join(",")).join(" "));
      svg.querySelectorAll(".pdot").forEach((c) => c.setAttribute("fill", seq.includes(+c.dataset.n) ? "#4ea1ff" : "#3a3a46"));
    };
    const addN = (n) => { if (n && !seq.includes(n)) { seq.push(n); draw(); } };
    const hit = (e) => {
      const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) * 240 / r.width, y = (e.clientY - r.top) * 240 / r.height;
      for (let n = 1; n <= 9; n++) { const [cx, cy] = DOT(n); if (Math.hypot(cx - x, cy - y) < 30) return n; }
      return 0;
    };
    svg.addEventListener("pointerdown", (e) => { drawing = true; addN(hit(e)); });
    svg.addEventListener("pointermove", (e) => { if (drawing) addN(hit(e)); });
    svg.addEventListener("pointerup", () => { drawing = false; });
    svg.addEventListener("pointerleave", () => { drawing = false; });
    $("#pat-clear").onclick = () => { seq = []; draw(); $("#lockmsg").textContent = ""; };
    $("#pat-ok").onclick = () => {
      if (seq.join("") === S.secret.pattern) { state.flags.secret = 1; ding(); render(); }
      else { $("#lockmsg").textContent = "패턴이 일치하지 않습니다."; seq = []; draw(); }
    };
  }
  /* 시크릿 검색 기록의 결과 페이지: r 직접 적기, 또는 r.ref 로 일반 검색 결과 재사용 */
  function secretResult(it) {
    const r = it.data.r || {};
    if (!r.ref) return r;
    const hit = S.search.find((x) => x.keys.some((k) => norm(k) === norm(r.ref)));
    if (!hit) return {};
    return hit.newsId ? Object.assign({}, items[hit.newsId].data, { url: items[hit.newsId].data.press }) : hit;
  }
  VIEWS.doc = ({ id }) => {
    const it = items[id];
    const d = it.kind === "secret" ? secretResult(it) : it.data;
    const table = d.table ? `<div style="overflow-x:auto"><table>${d.table.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table></div>` : "";
    const meta = it.kind === "news" ? `${esc(d.press)} · ${full(it.t)}` : esc(d.url);
    const sq = it.kind === "secret" ? `<div class="secret-q">🕶 "${esc(it.data.q)}" · ${full(it.t)} 검색</div>` : "";
    return shell(it.kind === "news" ? "뉴스" : it.kind === "secret" ? "시크릿 모드" : "검색", `${sq}<div class="doc"><h3>${esc(d.title)}</h3><div class="from">${meta}</div>${table}<div class="body">${esc(d.body || "")}</div></div>${pinBtn(id)}`);
  };
  AFTER.doc = ({ id }) => { state.read[id] = 1; bindPins(); think(items[id]); };

  /* SNS */
  const dmItems = () => Object.values(items).filter((it) => it.kind === "dm" && visible(it)).sort((a, b) => a.t - b.t);
  VIEWS.sns = ({ tab = "feed" }) => {
    const top = tabsHtml([["feed", "인기 게시물"], ["dm", "메시지"]], tab);
    if (tab === "dm") {
      const v = dmItems();
      if (!v.length) return shell("SNS", `<div class="empty">주고받은 메시지가 없습니다</div>`, { top });
      return shell("SNS · 한상철", chatHtml(v, false), { top, style: "background:#b2c7d9" });
    }
    const v = Object.values(items).filter((it) => it.kind === "post" && visible(it)).sort((a, b) => b.t - a.t);
    return shell("SNS", v.map((it) => `<div class="post">
        <div class="post-head"><div class="avatar" style="width:36px;height:36px">한</div><div><b>${esc(it.data.name)}</b> <span style="opacity:.5">${esc(it.data.handle)}</span><div style="font-size:12px;opacity:.5">${when(it.t)}</div></div></div>
        ${it.data.bio ? `<div class="post-bio">${esc(it.data.bio)}</div>` : ""}
        <div class="post-text">${esc(it.data.text)}</div>${pinBtn(it.id)}</div>`).join("")
      || `<div class="empty">아직 눈에 띄는 게시물이 없습니다</div>`, { top });
  };
  AFTER.sns = ({ tab = "feed" }) => {
    bindTabs();
    if (tab === "dm") { if (dmItems().length) bindChat(dmItems()); }
    else { bindPins(); Object.values(items).forEach((it) => { if (it.kind === "post" && visible(it)) { state.read[it.id] = 1; think(it); } }); }
  };

  /* 수첩 (핀 모음) */
  VIEWS.notes = ({ tab = "clues" }) => {
    const top = tabsHtml([["clues", "단서"], ["thoughts", "속마음"]], tab);
    if (tab === "thoughts") {
      const log = (state.thoughtLog || []).slice().reverse();
      return shell("수사 수첩", log.length ? `<div class="section">떠올랐던 속마음 · ${log.length}개</div>` + log.map((q) => `
        <div class="row" style="display:block"><div class="t2" style="margin:0 0 4px">${full(q.t)}</div><div style="font-size:14.5px;line-height:1.6;white-space:pre-wrap;word-break:keep-all">${esc(q.text)}</div></div>`).join("")
        : `<div class="empty">아직 떠오른 속마음이 없다.</div>`, { top });
    }
    const v = state.pins.map((id) => items[id]).filter(Boolean).sort((a, b) => (a.kind === "web") - (b.kind === "web") || a.t - b.t);
    return shell("수사 수첩", v.length ? `<div class="section">시간 순서대로 · ${v.length}개</div>` + v.map((it) => `
      <button class="row" data-open="${esc(it.id)}"><div class="main"><div class="t1" style="white-space:normal;font-weight:500">${esc(label(it))}</div><div class="t2">${it.kind === "web" ? esc(it.data.url) : full(it.t)}</div></div></button>`).join("")
      : `<div class="empty">아직 적어 둔 단서가 없다.<br><br>메시지·메일·사진·뉴스에서<br>📌 를 눌러 단서를 모아 보세요.</div>`, { top });
  };
  AFTER.notes = () => bindTabs() || screen.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => open(items[b.dataset.open])));

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
    const cp = store.get("_checkpoint");
    if (cp) html += `<div class="slot"><div class="main"><div class="t1">마지막 추리 직전</div><div class="t2" style="opacity:.6;font-size:13px">자동 저장 · ${dateLabel(cp.now)} ${hhmm(cp.now)}</div></div><button class="primary" id="load-cp">불러오기</button></div>`;
    return shell("저장 · 불러오기", html);
  };
  AFTER.slots = () => {
    screen.querySelectorAll("[data-save]").forEach((b) => b.addEventListener("click", () => {
      const i = b.dataset.save;
      const save = () => { store.set("_slot" + i, Object.assign(copy(state), { savedAt: Date.now() })); render(); };
      if (store.get("_slot" + i)) ask(`슬롯 ${i}에 덮어쓸까요?`, "덮어쓰기", save); else save();
    }));
    const load = (s) => { const go2 = () => { state = copy(s); home(); }; if (state) ask("이 저장 시점으로 돌아갈까요? 지금 진행 상황은 사라져요.", "불러오기", go2); else go2(); };
    screen.querySelectorAll("[data-load]").forEach((b) => b.addEventListener("click", () => { const s = store.get("_slot" + b.dataset.load); if (s) load(s); }));
    const cp = $("#load-cp"); if (cp) cp.onclick = () => load(store.get("_checkpoint"));
  };

  /* ================= 마지막 추리 ================= */
  /* 잠금을 풀어 단서를 얻은 경우에만 보이는 선택지 */
  const optOpen = (o) => !o.needs || o.needs.some((f) => state.flags[f]);
  VIEWS.accuse = () => {
    const A = S.accusation, pick = state.flags.pick || [];
    A.questions.forEach((q, qi) => { if (pick[qi] != null && !optOpen(q.options[pick[qi]])) pick[qi] = null; });
    return shell("마지막 추리", `<div class="accuse">
      <div class="acc-intro">틀리면 되돌릴 수 없다. 범인, 동기, 수법을 모두 맞혀야 한다.</div>
      ${A.questions.map((q, qi) => `<fieldset><legend>${qi + 1}. ${esc(q.q)}</legend>
        ${q.options.map((o, oi) => optOpen(o) ? `<button class="opt ${pick[qi] === oi ? "on" : ""}" data-q="${qi}" data-o="${oi}">${esc(o.text || o)}</button>` : "").join("")}</fieldset>`).join("")}
      <button class="advance final" id="acc-go" ${A.questions.every((_, i) => pick[i] != null) ? "" : "disabled"}>지목한다</button>
      <div style="height:20px"></div></div>`);
  };
  AFTER.accuse = () => {
    screen.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
      const pick = state.flags.pick || []; pick[+b.dataset.q] = +b.dataset.o; state.flags.pick = pick;
      const sc = $("#body").scrollTop; render(); $("#body").scrollTop = sc;
    }));
    $("#acc-go").onclick = () => ask("이대로 지목할까요? 한 번 정하면 돌이킬 수 없어요.", "지목한다", judge);
  };
  function judge() {
    const ok = S.accusation.questions.every((q, i) => state.flags.pick[i] === q.correct);
    state.flags.over = 1; store.del("_auto");
    stack = [{ view: "blank", p: {} }]; render();
    if (ok) successEnding(); else failEnding();
  }
  VIEWS.blank = () => `<div style="flex:1;background:#000"></div>`;
  function failEnding() {
    const E = S.endings.fail;
    showScene(E.lines, T("7/14 17:00"), () => {
      state.now = T("7/15 06:10");
      setTimeout(() => {
        notifyRaw(APPS.search, "연합뉴스 속보", E.news); ding();
        setTimeout(() => showScene(E.after, null, () => { stack = [{ view: "over", p: {} }]; render(); }, { dark: true }), 3200);
      }, 900);
    }, { dark: true });
  }
  VIEWS.over = () => `<div class="title over"><h1 style="font-size:40px;letter-spacing:6px">GAME OVER</h1>
    <div class="sub">세 번째 희생자가 나왔다.<br>범인, 동기, 수법 중 틀린 것이 있었다.</div>
    <button class="btn" id="o-retry">마지막 추리 직전으로</button>
    <button class="btn" id="o-title">처음 화면으로</button></div>`;
  AFTER.over = () => {
    $("#o-retry").onclick = () => { const cp = store.get("_checkpoint"); if (!cp) return; state = copy(cp); delete state.flags.pick; home(); };
    $("#o-title").onclick = () => { stack = [{ view: "title", p: {} }]; render(); };
  };
  function successEnding() {
    const E = S.endings.success;
    showScene(E.lines, T("7/14 16:40"), () => {
      stack = [{ view: "call", p: {} }]; render();
      let i = 0; const box = $("#call-lines"), timer = $("#call-timer"), t0 = Date.now();
      const tick = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); timer.textContent = `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`; }, 500);
      tone([[440, 0, 0.5, 0.12], [440, 1.2, 0.5, 0.12]]);
      const nextLine = () => {
        if (i < E.call.length) { box.insertAdjacentHTML("beforeend", `<p class="line" style="animation-delay:0s">${esc(E.call[i++])}</p>`); setTimeout(nextLine, 2200); }
        else setTimeout(() => { clearInterval(tick); showScene(E.after, null, () => { store.set("_cleared", 1); stack = [{ view: "end", p: {} }]; render(); }, { dark: true }); }, 1800);
      };
      setTimeout(nextLine, 1600);
    }, { dark: true });
  }
  VIEWS.call = () => `<div class="callscreen"><div class="call-name">112</div><div class="call-timer" id="call-timer">00:00</div>
    <div class="call-lines" id="call-lines"></div><div class="call-end">📞</div></div>`;
  VIEWS.end = () => `<div class="title end"><p class="last">${esc(S.endings.success.last)}</p>
    <div class="sub" style="margin-top:40px">${esc(S.title)} · 끝<br>모은 단서 ${state.pins.length}개</div>
    <button class="btn" id="e-title">처음 화면으로</button></div>`;
  AFTER.end = () => { $("#e-title").onclick = () => { stack = [{ view: "title", p: {} }]; render(); }; };

  /* ================= 진행 ================= */
  function ask(text, yes, onYes) {
    overlay.innerHTML = `<div class="scene" style="cursor:default;align-items:center;text-align:center">
      <p class="line" style="opacity:1;animation:none">${esc(text)}</p>
      <div style="display:flex;gap:10px;margin-top:10px"><button class="pin-btn" style="margin:0" id="ask-no">취소</button><button class="pin-btn on" style="margin:0" id="ask-yes">${esc(yes)}</button></div></div>`;
    overlay.classList.add("show"); overlay.onclick = null;
    $("#ask-no").onclick = () => overlay.classList.remove("show");
    $("#ask-yes").onclick = () => { overlay.classList.remove("show"); onYes(); };
  }
  function showScene(lines, dateTs, cb, opt = {}) {
    if (!lines || !lines.length) { cb && cb(); return; }
    overlay.innerHTML = `<div class="scene ${opt.dark ? "dark" : ""}">${dateTs ? `<div class="date">${esc(longDay(dateTs))} · ${ampm(dateTs)}</div>` : ""}
      ${lines.map((l, i) => `<p class="line" style="animation-delay:${i * 0.9}s">${esc(l)}</p>`).join("")}<div class="tap">눌러서 계속</div></div>`;
    overlay.classList.add("show");
    const t0 = Date.now(); let shown = false;
    overlay.onclick = () => {
      if (!shown && Date.now() - t0 < lines.length * 900) { shown = true; overlay.querySelectorAll(".line").forEach((p) => { p.style.animation = "none"; p.style.opacity = 1; }); return; }
      overlay.classList.remove("show"); overlay.onclick = null; cb && cb();
    };
  }
  function dayIntro() { const d = S.days[state.day]; showScene(d.intro || [], state.now, () => render()); }
  function nextDay() {
    state.day++; state.now = dayStart(state.day); delete state.flags.finalSeen;
    home(); dayIntro();
  }

  let busy = false;
  function advance() {
    if (busy) return;
    const ns = nextStep(), d = S.days[state.day];
    if (!ns) return d.final ? finalStep() : sleep();
    busy = true;
    state.now = ns.items ? ns.items[ns.items.length - 1].t : ns.t;
    if (ns.scene) {
      render();
      showScene(ns.scene.lines, ns.t, () => {
        busy = false;
        if (ns.scene.endDay) return nextDay();
        if (ns.scene.jumpTo) {
          state.now = T(`${d.date} ${ns.scene.jumpTo}`); render();
          showScene(ns.scene.after || [], state.now, () => render());
        } else render();
      });
      return;
    }
    render();
    try { notifyGroup(ns.items); } finally { busy = false; }
  }
  function sleep(force) {
    const d = S.days[state.day];
    const unread = Object.values(items).some((it) => visible(it) && !state.read[it.id] && (it.kind === "msg" || it.kind === "dm") && it.data.who !== "me");
    if (unread && force !== true) return ask("아직 읽지 않은 메시지가 있어요. 그래도 잠들까요?", "잠자기", () => sleep(true));
    showScene(d.outro || [], null, () => { if (state.day + 1 < S.days.length) nextDay(); });
  }
  function finalStep() {
    const d = S.days[state.day];
    const enter = () => { store.set("_checkpoint", Object.assign(copy(state), { savedAt: Date.now() })); go("accuse"); };
    if (state.flags.finalSeen) return enter();
    showScene(d.finalLines || [], state.now, () => { state.flags.finalSeen = 1; enter(); });
  }
  function notifyRaw(app, title, lines, onClick) {
    if (!Array.isArray(lines)) lines = [lines];
    const el = document.createElement("button");
    el.className = "notif";
    const more = lines.length > 4 ? `<div class="nb more">외 ${lines.length - 4}개</div>` : "";
    el.innerHTML = `<div class="ic" style="background:${app.bg}">${app.ic}</div><div style="flex:1;min-width:0"><div style="display:flex"><span class="nt">${esc(title)}</span><span class="nm">${lines.length > 1 ? lines.length + "개 · " : ""}지금</span></div>${lines.slice(0, 4).map((l) => `<div class="nb">${esc(l)}</div>`).join("")}${more}</div>`;
    el.onclick = () => { el.remove(); onClick && onClick(); };
    notifLayer.appendChild(el);
    while (notifLayer.children.length > 4) notifLayer.firstChild.remove();
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 320); }, 4000 + lines.length * 1200);
  }
  /* 같은 대화방·같은 앱에서 온 알림은 배너 하나로 합쳐서 한꺼번에 띄워요 */
  function notifyGroup(list) {
    const groups = [];
    list.forEach((it) => {
      const key = it.kind === "msg" ? "msg:" + it.thread.id : it.kind;
      let g = groups.find((x) => x.key === key);
      if (!g) groups.push(g = { key, items: [] });
      g.items.push(it);
    });
    groups.forEach((g) => {
      const it = g.items[0], many = g.items.length > 1;
      const head = {
        msg: () => [APPS.messenger, it.thread.name],
        call: () => [APPS.calls, "부재중 전화"],
        card: () => [APPS.card, "카드 승인"],
        mail: () => [APPS.mail, many ? "새 메일" : it.data.from],
        news: () => [APPS.search, many ? "뉴스 속보" : it.data.press + " 속보"],
        dm: () => [APPS.sns, "한상철 (@sea_debt)"]
      }[it.kind]();
      const line = (x) => ({
        msg: () => x.data.text, call: () => x.data.name, card: () => `${x.data.shop} ${won(x.data.amount)}`,
        mail: () => many ? `${x.data.from}: ${x.data.subject}` : x.data.subject, news: () => x.data.title, dm: () => x.data.text
      })[x.kind]();
      notifyRaw(head[0], head[1], g.items.map(line), () => open(g.items[g.items.length - 1]));
    });
    ding();
    render();
  }

  /* 시작 */
  stack = [{ view: "title", p: {} }];
  render();
})();
