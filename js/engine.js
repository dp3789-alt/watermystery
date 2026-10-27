/* 게임 엔진. 스토리 내용은 story.js 에 있고, 여기는 화면과 진행 규칙만 다룹니다. */
(function () {
  "use strict";
  const ART = window.ART, IC = window.ICONS;
  const $ = (s) => document.querySelector(s);
  const screen = $("#screen"), overlay = $("#overlay"), toast = $("#toast"), notifLayer = $("#notif-layer"), phone = $("#phone");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s).replace(/[\s\-]+/g, "").toLowerCase();

  /* ================= 언어 ================= */
  /* 화면에 나오는 글자. 스토리 내용은 story.js(한국어) / story_en.js(영어) 에 있어요. */
  const UI = {
    ko: {
      apps: { messenger: "메신저", calls: "전화", card: "카드", mail: "메일", photos: "사진", search: "검색", sns: "SNS", notes: "수첩", memo: "메모", settings: "설정" },
      back: "뒤로", home: "홈",
      thoughtLab: "속마음 · 눌러서 닫기 · 수첩에서 다시 볼 수 있어요",
      pinned: "📌 수첩에 적어 둠", pin: "📌 수첩에 적기",
      call: { in: "수신", out: "발신", miss: "부재중", fail: "연결 안 됨" },
      me: "(나) ", lCall: "통화", lCard: "카드", lCard2: "숨겨진 카드", lMail: "메일", lMail2: "두 번째 메일", lNews: "뉴스", lPhoto: "사진",
      lDeleted: "최근 삭제된 사진", lWeb: "검색", lDm: "SNS DM", lSecret: "시크릿 검색",
      cont: "이어하기", newGame: "새 게임", load: "불러오기",
      noticeHead: "시작하기 전에",
      notice: ["이 게임은 창작된 허구의 이야기입니다.",
        "등장하는 인물, 단체, 장소, 사건은 모두 지어낸 것입니다. 실제와 같거나 비슷한 이름이 나오더라도 실제 인물·단체·장소·사건과는 아무런 관련이 없습니다.",
        "게임 속에 그려진 범죄를 미화하거나 권장하려는 의도는 없습니다."],
      noticeOk: "확인했습니다.",
      tip: "소리를 켜 주세요. 알림음과 진동이 있어요.<br>힌트는 없습니다. 모든 답은 이 핸드폰 안에 있어요.",
      askNew: "새 게임을 시작할까요? 저장 슬롯에 저장한 게임은 그대로 남아 있어요.",
      advance: "⏩ 시간 보내기 <small>다음 일을 기다린다</small>", decide: "🔎 결정을 내린다 <small>마지막 추리</small>", sleepBtn: "🌙 잠자기 <small>오늘을 마친다</small>",
      year: "202×년",
      messenger: "메신저", chatHint: "말풍선을 누르면 수첩에 적어요", chatInput: "메시지 입력",
      recents: "최근 통화", noCalls: "통화 기록이 없습니다", callInfo: "통화 정보", duration: "통화 시간 ",
      approved: "승인", addCard: "＋ 다른 카드 등록", cardTitle: "카드 내역", payDetail: "결제 상세",
      payBody: (amt, card) => `결제 금액  ${amt}\n결제 수단  ${card}\n상태  승인 완료`,
      addCardTitle: "카드 등록", newCard: "새 카드", cardNeedStatement: "카드 정보를 확인할 수 없습니다. 명세서를 먼저 확인하세요.", cardBad: "등록할 수 없는 카드 번호입니다.",
      mail: "메일", myMail: "내 메일", otherAcc: "다른 계정 🔒", signedOut: "로그아웃됨 · 이 기기에 저장된 계정", recover: "비밀번호 찾기 · 보안 질문",
      answer: "답 입력", ok: "확인", noMail: "메일이 없습니다", wrongAnswer: "답이 일치하지 않습니다.",
      photos: "사진", recentPhotos: (n) => `최근 항목 · ${n}장`, other: "기타", deleted: "최근 삭제된 항목", nPhotos: (n) => `${n}장`, locked: "잠김 🔒",
      deletedNote: "삭제한 항목은 이곳에 보관됩니다.", noDeleted: "삭제된 항목이 없습니다", deletedOn: "삭제한 날: ", taken: "촬영: ",
      secQ: "보안 질문", memo: "메모", lockedMemo: "잠긴 메모 · 1개", memoEmpty: "아직 아무것도 적혀 있지 않다.", wrong: "틀렸습니다.",
      search: "검색", news: "뉴스", secret: "시크릿", secretMode: "시크릿 모드", noNews: "뉴스가 없습니다", secretHist: "시크릿 모드 검색 기록",
      searchPh: "검색어 입력", recentQ: "최근 검색어", noResult: (q) => `'${q}'에 대한 검색 결과가 없습니다.`,
      patLocked: "시크릿 모드는 잠겨 있습니다", patDraw: "패턴을 그려 주세요", patHint: "점을 순서대로 누르거나 손가락으로 이어 그리세요", clear: "지우기", patWrong: "패턴이 일치하지 않습니다.",
      searchedAt: (q, t) => `🕶 "${q}" · ${t} 검색`,
      trending: "인기 게시물", dms: "메시지", noDm: "주고받은 메시지가 없습니다", noPosts: "아직 눈에 띄는 게시물이 없습니다",
      casebook: "수사 수첩", clues: "단서", thoughts: "속마음", thoughtCount: (n) => `떠올랐던 속마음 · ${n}개`, noThoughts: "아직 떠오른 속마음이 없다.",
      clueCount: (n) => `시간 순서대로 · ${n}개`, noClues: "아직 적어 둔 단서가 없다.<br><br>메시지·메일·사진·뉴스에서<br>📌 를 눌러 단서를 모아 보세요.",
      settings: "설정", game: "게임", saveLoad: "저장 · 불러오기", fiveSlots: "슬롯 5개", sound: "알림음", vibe: "진동", vibeNote: "아이폰에선 화면 흔들림으로 대신해요",
      on: "켬", off: "끔", language: "언어 · Language", toTitle: "처음 화면으로", autoNote: "진행 상황은 자동 저장돼요",
      pickLoad: "불러올 저장을 고르세요", anytime: "언제든 저장한 시점으로 돌아갈 수 있어요", slot: (i) => `슬롯 ${i}`, nClues: (n) => `단서 ${n}개`, empty: "비어 있음",
      save: "저장", beforeFinal: "마지막 추리 직전", autoSaved: "자동 저장", overwrite: (i) => `슬롯 ${i}에 덮어쓸까요?`, overwriteBtn: "덮어쓰기",
      askLoad: "이 저장 시점으로 돌아갈까요? 지금 진행 상황은 사라져요.",
      final: "마지막 추리", accIntro: "틀리면 되돌릴 수 없다. 누가, 어떻게 죽였는지 내 말로 정확히 적어야 한다.", accuse: "지목한다", askAccuse: "이대로 지목할까요? 한 번 정하면 돌이킬 수 없어요.",
      overSub: "세 번째 희생자가 나왔다.<br>내가 적은 답은 진실이 아니었다.", retry: "마지막 추리 직전으로",
      theEnd: (t, n) => `${t} · 끝<br>모은 단서 ${n}개`,
      cancel: "취소", tap: "눌러서 계속", askSleep: "아직 읽지 않은 메시지가 있어요. 그래도 잠들까요?", sleep: "잠자기",
      more: (n) => `외 ${n}개`, count: (n) => `${n}개 · `, now: "지금",
      missed: "부재중 전화", cardOk: "카드 승인", newMail: "새 메일", breaking: "뉴스 속보", pressBreaking: (p) => `${p} 속보`
    },
    en: {
      apps: { messenger: "Messages", calls: "Phone", card: "Card", mail: "Mail", photos: "Photos", search: "Search", sns: "Social", notes: "Casebook", memo: "Notes", settings: "Settings" },
      back: "Back", home: "Home",
      thoughtLab: "Thought · tap to close · saved in your Casebook",
      pinned: "📌 In your Casebook", pin: "📌 Add to Casebook",
      call: { in: "Incoming", out: "Outgoing", miss: "Missed", fail: "Call failed" },
      me: "(me) ", lCall: "Call", lCard: "Card", lCard2: "Hidden card", lMail: "Mail", lMail2: "Second account", lNews: "News", lPhoto: "Photo",
      lDeleted: "Recently deleted photo", lWeb: "Search", lDm: "Social DM", lSecret: "Incognito search",
      cont: "Continue", newGame: "New Game", load: "Load Game",
      noticeHead: "Before you begin",
      notice: ["This game is a work of fiction.",
        "All characters, organizations, places, and events in it are invented. Any resemblance to real people, living or dead, or to real organizations, places, or events is purely coincidental.",
        "The crimes depicted in this game are not intended to glorify or encourage crime of any kind."],
      noticeOk: "I understand",
      tip: "Turn your sound on. There are notification sounds and vibrations.<br>There are no hints. Every answer is somewhere on this phone.",
      askNew: "Start a new game? Anything saved in your save slots will stay as it is.",
      advance: "⏩ Let time pass <small>Wait for what comes next</small>", decide: "🔎 Make a decision <small>Final deduction</small>", sleepBtn: "🌙 Go to sleep <small>End the day</small>",
      year: "202×",
      messenger: "Messages", chatHint: "Tap a message to add it to your Casebook", chatInput: "Message",
      recents: "Recents", noCalls: "No recent calls", callInfo: "Call Details", duration: "Duration ",
      approved: "Approved", addCard: "＋ Add another card", cardTitle: "Card Activity", payDetail: "Transaction Details",
      payBody: (amt, card) => `Amount  ${amt}\nPaid with  ${card}\nStatus  Approved`,
      addCardTitle: "Add Card", newCard: "New card", cardNeedStatement: "We couldn't verify this card. Please check your statement first.", cardBad: "This card number can't be added.",
      mail: "Mail", myMail: "My Inbox", otherAcc: "Other account 🔒", signedOut: "Signed out · Account saved on this device", recover: "Forgot password · Security question",
      answer: "Your answer", ok: "OK", noMail: "No mail", wrongAnswer: "That answer doesn't match.",
      photos: "Photos", recentPhotos: (n) => `Recents · ${n} ${n === 1 ? "photo" : "photos"}`, other: "Other", deleted: "Recently Deleted", nPhotos: (n) => `${n} ${n === 1 ? "photo" : "photos"}`, locked: "Locked 🔒",
      deletedNote: "Deleted items are kept here.", noDeleted: "No deleted items", deletedOn: "Deleted: ", taken: "Taken: ",
      secQ: "Security question", memo: "Notes", lockedMemo: "Locked note · 1", memoEmpty: "Nothing has been written yet.", wrong: "Incorrect.",
      search: "Search", news: "News", secret: "Incognito", secretMode: "Incognito", noNews: "No news", secretHist: "Incognito search history",
      searchPh: "Search", recentQ: "Recent searches", noResult: (q) => `No results for '${q}'.`,
      patLocked: "Incognito mode is locked", patDraw: "Draw your pattern", patHint: "Tap the dots in order, or drag your finger to connect them", clear: "Clear", patWrong: "Wrong pattern.",
      searchedAt: (q, t) => `🕶 "${q}" · searched ${t}`,
      trending: "Trending", dms: "Messages", noDm: "No messages yet", noPosts: "Nothing trending yet",
      casebook: "Casebook", clues: "Clues", thoughts: "Thoughts", thoughtCount: (n) => `Thoughts so far · ${n}`, noThoughts: "No thoughts yet.",
      clueCount: (n) => `In order of time · ${n}`, noClues: "No clues noted yet.<br><br>Tap 📌 on messages, mail,<br>photos, and news to collect clues.",
      settings: "Settings", game: "Game", saveLoad: "Save / Load", fiveSlots: "5 slots", sound: "Notification sounds", vibe: "Vibration", vibeNote: "On iPhone, the screen shakes instead",
      on: "On", off: "Off", language: "Language · 언어", toTitle: "Back to title screen", autoNote: "Your progress is saved automatically",
      pickLoad: "Choose a save to load", anytime: "You can go back to a saved point at any time", slot: (i) => `Slot ${i}`, nClues: (n) => `${n} ${n === 1 ? "clue" : "clues"}`, empty: "Empty",
      save: "Save", beforeFinal: "Before the final deduction", autoSaved: "Autosave", overwrite: (i) => `Overwrite Slot ${i}?`, overwriteBtn: "Overwrite",
      askLoad: "Go back to this save? Your current progress will be lost.",
      final: "Final Deduction", accIntro: "If I'm wrong, there's no taking it back. I have to write down, in my own words, exactly who killed them and how.", accuse: "Make the accusation", askAccuse: "Make this accusation? Once you decide, there's no going back.",
      overSub: "A third victim has been found.<br>What I wrote was not the truth.", retry: "Retry the final deduction",
      theEnd: (t, n) => `${t} · The End<br>Clues collected: ${n}`,
      cancel: "Cancel", tap: "Tap to continue", askSleep: "You still have unread messages. Go to sleep anyway?", sleep: "Sleep",
      more: (n) => `+${n} more`, count: (n) => `${n} · `, now: "now",
      missed: "Missed call", cardOk: "Card approved", newMail: "New mail", breaking: "Breaking news", pressBreaking: (p) => `${p} · Breaking`
    }
  };
  const STORIES = { ko: window.STORY, en: window.STORY_EN };
  let LANG = "ko", S = STORIES.ko;
  const L = (k, ...a) => { const v = UI[LANG][k]; return typeof v === "function" ? v(...a) : v; };

  /* ================= 시간 ================= */
  function T(s) {
    let y = 2025; s = s.trim();
    if (s.startsWith("작년")) { y = 2024; s = s.slice(2).trim(); }
    const [md, hm = "00:00"] = s.split(/\s+/);
    const [m, d] = md.split("/").map(Number), [h, mi] = hm.split(":").map(Number);
    return new Date(y, m - 1, d, h, mi).getTime();
  }
  const WD = "일월화수목금토";
  const WD_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MON_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const pad2 = (n) => String(n).padStart(2, "0");
  const D = (ts) => new Date(ts);
  const hhmm = (ts) => `${pad2(D(ts).getHours())}:${pad2(D(ts).getMinutes())}`;
  const ampm = (ts) => { const h = D(ts).getHours(), m = pad2(D(ts).getMinutes());
    return LANG === "en" ? `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}` : `${h < 12 ? "오전" : "오후"} ${h % 12 || 12}:${m}`; };
  const dateLabel = (ts) => { const d = D(ts);
    return LANG === "en" ? `${WD_EN[d.getDay()].slice(0, 3)}, ${MON_EN[d.getMonth()].slice(0, 3)} ${d.getDate()}` : `${d.getMonth() + 1}월 ${d.getDate()}일 (${WD[d.getDay()]})`; };
  const longDay = (ts) => { const d = D(ts);
    if (LANG === "en") return d.getFullYear() < 2025 ? `${MON_EN[d.getMonth()]} ${d.getDate()}, last year` : `${WD_EN[d.getDay()]}, ${MON_EN[d.getMonth()]} ${d.getDate()}, 202×`;
    return d.getFullYear() < 2025 ? `작년 ${d.getMonth() + 1}월 ${d.getDate()}일` : `202×년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${WD[d.getDay()]}요일`; };
  const sameDay = (a, b) => D(a).toDateString() === D(b).toDateString();
  function when(ts) {
    if (sameDay(ts, state.now)) return ampm(ts);
    if (sameDay(ts, state.now - 864e5)) return LANG === "en" ? "Yesterday" : "어제";
    const d = D(ts); return d.getFullYear() < 2025 ? `${LANG === "en" ? "Last year" : "작년"} ${d.getMonth() + 1}/${d.getDate()}` : `${d.getMonth() + 1}/${d.getDate()}`;
  }
  const full = (ts) => `${longDay(ts)} ${ampm(ts)}`;
  const won = (n) => LANG === "en" ? "₩" + n.toLocaleString("en-US") : n.toLocaleString("ko-KR") + "원";

  /* ================= 항목 정리 ================= */
  const items = {}; // id -> {id, kind, t, data}
  function add(id, kind, t, data, extra) { items[id] = Object.assign({ id, kind, t: T(t), data }, extra); return items[id]; }
  /* 언어를 바꾸면 그 언어의 스토리로 항목을 다시 만들어요. 항목 번호는 두 언어가 같아서 저장한 게임은 그대로 이어져요. */
  function build() {
  Object.keys(items).forEach((k) => delete items[k]);
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
  }

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
  const fresh = () => ({ v: 2, lang: LANG, day: 0, now: dayStart(0), read: {}, thoughts: {}, pins: [], flags: {}, queries: [] });
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(KEY + k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(KEY + k); } catch (e) {} }
  };
  const prefs = Object.assign({ sound: true, vibe: true }, store.get("_prefs") || {});
  /* 처음 온 사람은 브라우저 언어로 정해요 (한국어가 아니면 영어) */
  if (!STORIES[prefs.lang]) prefs.lang = /^ko/i.test(navigator.language || "ko") ? "ko" : "en";
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
    messenger: { name: "메신저", bg: "linear-gradient(160deg,#ffe94a,#f7d300)" },
    calls: { name: "전화", bg: "linear-gradient(160deg,#5fe07a,#22b44a)" },
    card: { name: "카드", bg: "linear-gradient(160deg,#1aa58f,#0b5a50)" },
    mail: { name: "메일", bg: "linear-gradient(160deg,#4fa0ff,#1f64d6)" },
    photos: { name: "사진", bg: "linear-gradient(160deg,#ffffff,#e9e9ee)" },
    search: { name: "검색", bg: "linear-gradient(160deg,#22d873,#03a84a)" },
    sns: { name: "SNS", bg: "radial-gradient(circle at 25% 105%,#ffd25a 0%,#fa6a3a 30%,#d6249f 60%,#6a3ad8 100%)" },
    notes: { name: "수첩", bg: "linear-gradient(160deg,#ffb340,#ff8a00)" },
    memo: { name: "메모", bg: "linear-gradient(160deg,#fbfbf8,#e6e4dc)" },
    settings: { name: "설정", bg: "linear-gradient(160deg,#a2a2aa,#6e6e76)" }
  };
  Object.keys(APPS).forEach((k) => { APPS[k].ic = IC[k]; });
  function setLang(l) {
    if (!STORIES[l]) l = "ko";
    LANG = l; S = STORIES[l]; build();
    Object.keys(APPS).forEach((k) => { APPS[k].name = UI[l].apps[k]; });
    document.documentElement.lang = l; document.title = S.title;
    prefs.lang = l; store.set("_prefs", prefs);
    if (state) state.lang = l;
  }
  setLang(prefs.lang);
  /* 대화 상대마다 다른 프로필 색 */
  const AV = ["#e8846a", "#6a9ae8", "#5ac08a", "#c07ae0", "#e0b04a", "#e06a8a", "#4ab8c8", "#8a8ae0"];
  const avStyle = (name) => { let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0; const c = AV[h % AV.length]; return `background:linear-gradient(150deg,${c},${c}99)`; };
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
  /* 화면을 옮길 때만 짧은 전환 효과 (같은 화면을 다시 그릴 땐 없음) */
  let navAnim = "";
  function go(view, p) { clearThoughts(); stack.push({ view, p: p || {} }); navAnim = "in"; render(); }
  function back() { clearThoughts(); stack.pop(); if (!stack.length) stack.push({ view: "home", p: {} }); navAnim = "back"; render(); }
  function home() { clearThoughts(); stack = [{ view: "home", p: {} }]; navAnim = "home"; render(); }
  const NO_BAR = ["title", "over", "end", "call", "blank"];
  function render() {
    const cur = stack[stack.length - 1];
    const bar = state && !NO_BAR.includes(cur.view);
    $("#sb-time").textContent = bar ? hhmm(state.now) : "";
    $("#sb-date").textContent = bar ? dateLabel(state.now) : "";
    /* 배터리는 하루 동안 조금씩 닳아요 */
    const hr = bar ? new Date(state.now).getHours() : 8;
    $("#sb-icons").innerHTML = IC.signal + IC.wifi + IC.battery(Math.max(.15, Math.min(1, 1 - (hr - 7) * .045)));
    phone.appendChild(toast);
    screen.innerHTML = VIEWS[cur.view](cur.p);
    if (navAnim && screen.firstElementChild) screen.firstElementChild.classList.add("nav-" + navAnim);
    navAnim = "";
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
      <div class="app-head"><button class="back" data-back aria-label="${L("back")}">‹</button><h2>${esc(title)}</h2></div>
      ${opts.top || ""}
      <div class="app-body" id="body">${body}</div>
      ${opts.foot || ""}
      <div class="home-bar"><button data-home aria-label="${L("home")}"></button></div>
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
    toast.innerHTML = `<div class="lab">${L("thoughtLab")}</div>${esc(q.text)}`;
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
  /* 수첩의 속마음은 지금 언어로 다시 찾아서 보여 줘요 */
  function thoughtOf(key) {
    if (items[key]) return items[key].data.thought;
    const fixed = { card2_open: S.card2.thought, card_empty: S.card.thoughtEmptyDay, secret_open: S.secret.thought, memo_open: S.memo.thought };
    if (fixed[key]) return fixed[key];
    if (key.startsWith("trap_")) return (S.deletedPhotos.lock.trap || {})[key.slice(5)];
  }
  const langTag = (s) => s.lang === "en" ? " · EN" : s.lang === "ko" ? " · 한국어" : "";
  toast.addEventListener("click", () => { toast.classList.remove("show"); setTimeout(showThought, 120); });

  const pinned = (id) => state.pins.includes(id);
  function togglePin(id) {
    if (pinned(id)) state.pins = state.pins.filter((x) => x !== id); else state.pins.push(id);
    autosave();
  }
  const pinBtn = (id) => `<button class="pin-btn ${pinned(id) ? "on" : ""}" data-pin="${esc(id)}">${pinned(id) ? L("pinned") : L("pin")}</button>`;
  function bindPins() {
    screen.querySelectorAll("[data-pin]").forEach((b) => b.addEventListener("click", () => { togglePin(b.dataset.pin); render(); }));
  }
  const CALL_IC = { in: "↙", out: "↗", miss: "↙", fail: "↗" };
  const callType = (t) => UI[LANG].call[t];
  function label(it) {
    const d = it.data;
    switch (it.kind) {
      case "msg": return `${it.thread.name}: ${d.who === "me" ? L("me") : ""}${d.text}`;
      case "call": return `${L("lCall")} · ${d.name} (${callType(d.type)})`;
      case "card": return `${L("lCard")} · ${d.shop} ${won(d.amount)}`;
      case "card2": return `${L("lCard2")} · ${d.shop} ${won(d.amount)}`;
      case "mail": return `${L("lMail")} · ${d.subject}`;
      case "mail2": return `${L("lMail2")} · ${d.subject}`;
      case "news": return `${L("lNews")} · ${d.title}`;
      case "photo": case "dphoto": return `${L("lPhoto")} · ${d.caption || (it.kind === "dphoto" ? L("lDeleted") : "")}`;
      case "web": return `${L("lWeb")} · ${d.title}`;
      case "post": return `${APPS.sns.name} · ${d.name}: ${d.text.split("\n")[0]}`;
      case "dm": return `${L("lDm")} · ${d.who === "me" ? L("me") : S.sns.dmName + ": "}${d.text}`;
      case "secret": return `${L("lSecret")} · ${d.q}`;
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

  /* 픽션 안내 (게임을 열 때마다 처음 한 번) */
  const langPick = () => `<div class="lang-pick" role="group" aria-label="Language">${[["ko", "한국어"], ["en", "English"]].map(([k, n]) => `<button class="${LANG === k ? "on" : ""}" data-lang="${k}" lang="${k}">${n}</button>`).join("")}</div>`;
  VIEWS.notice = () => `<div class="title notice">
      ${langPick()}
      <div class="notice-head">${L("noticeHead")}</div>
      ${L("notice").map((t, i) => `<p class="${i ? "" : "lead"}">${esc(t)}</p>`).join("")}
      <button class="btn" id="n-ok">${L("noticeOk")}</button>
    </div>`;
  AFTER.notice = () => {
    screen.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => { setLang(b.dataset.lang); render(); }));
    $("#n-ok").onclick = () => { stack = [{ view: "title", p: {} }]; render(); };
  };

  /* 타이틀 */
  VIEWS.title = () => {
    const auto = store.get("_auto");
    return `<div class="title">
      ${langPick()}
      <h1>${esc(S.title.split(": ")[0])}${S.title.includes(": ") ? `<small>${esc(S.title.split(": ")[1])}</small>` : ""}</h1><div class="sub">${esc(S.subtitle)}</div>
      ${auto ? `<button class="btn" id="t-cont">${L("cont")} <small style="opacity:.6">(${dateLabel(auto.now)} ${hhmm(auto.now)})</small></button>` : ""}
      <button class="btn" id="t-new">${L("newGame")}</button>
      <button class="btn" id="t-load">${L("load")}</button>
      <div class="tip">${L("tip")}</div>
    </div>`;
  };
  AFTER.title = () => {
    const auto = store.get("_auto");
    screen.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => { setLang(b.dataset.lang); render(); }));
    $("#t-new").onclick = () => {
      unlockAudio();
      const start = () => { state = fresh(); stack = [{ view: "home", p: {} }]; render(); dayIntro(); };
      if (auto) ask(L("askNew"), L("newGame"), start); else start();
    };
    const c = $("#t-cont"); if (c) c.onclick = () => { unlockAudio(); state = auto; state.lang = LANG; home(); };
    $("#t-load").onclick = () => { unlockAudio(); stack.push({ view: "slots", p: { loadOnly: true } }); render(); };
  };

  /* 홈 */
  VIEWS.home = () => {
    const ns = nextStep(), d = S.days[state.day];
    const btn = ns ? L("advance") : d.final ? L("decide") : L("sleepBtn");
    const apps = Object.entries(APPS).map(([k, a]) => {
      const b = badge(k);
      return `<button class="app" data-go="${k}"><div class="ic" style="background:${a.bg}">${a.ic}</div>${a.name}${b ? `<span class="badge">${b}</span>` : ""}</button>`;
    }).join("");
    return `<div class="home">
      <div class="widget"><div class="big">${hhmm(state.now)}</div><div class="small">${dateLabel(state.now)} · ${L("year")}</div></div>
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
    return shell(L("messenger"), rows.map(({ th, last, un }) => `
      <button class="row" data-go="thread" data-p="${P({ id: th.id })}">
        <div class="avatar" style="${avStyle(th.name)}">${esc(th.avatar)}</div>
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
    return `<div class="chat">${html}<div style="font-size:11px;opacity:.5;text-align:center;margin-top:14px">${L("chatHint")}</div></div>`;
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
    return shell(th.name, chatHtml(threadItems(id), th.group), { style: "background:#b2c7d9",
      foot: `<div class="chat-input"><span class="ci-plus">＋</span><div class="ci-box">${L("chatInput")}</div><span class="ci-send">#</span></div>` });
  };
  AFTER.thread = ({ id }) => bindChat(threadItems(id));

  /* 전화 */
  VIEWS.calls = () => {
    const v = Object.values(items).filter((it) => it.kind === "call" && visible(it)).sort((a, b) => b.t - a.t);
    return shell(L("recents"), v.map((it) => `
      <button class="row ${it.data.type}" data-go="callDetail" data-p="${P({ id: it.id })}">
        <div class="call-ic">${CALL_IC[it.data.type]}</div>
        <div class="main"><div class="t1">${esc(it.data.name)}</div><div class="t2">${callType(it.data.type)}${it.data.dur ? " · " + it.data.dur : ""}</div></div>
        <div class="meta">${when(it.t)}</div></button>`).join("") || `<div class="empty">${L("noCalls")}</div>`);
  };
  AFTER.calls = () => { Object.values(items).forEach((it) => { if (it.kind === "call" && visible(it)) state.read[it.id] = 1; }); };
  VIEWS.callDetail = ({ id }) => {
    const it = items[id], d = it.data;
    return shell(L("callInfo"), `<div class="doc"><h3>${esc(d.name)}</h3>
      <div class="from">${full(it.t)}</div>
      <div class="body">${callType(d.type)}${d.dur ? `\n${L("duration")}${d.dur}` : ""}</div></div>${pinBtn(id)}`);
  };
  AFTER.callDetail = ({ id }) => { bindPins(); think(items[id]); };

  /* 카드 */
  VIEWS.card = ({ tab = "main" }) => {
    const two = tab === "two" && state.flags.card2;
    const C = two ? S.card2 : S.card, kind = two ? "card2" : "card";
    const v = Object.values(items).filter((it) => it.kind === kind && visible(it)).sort((a, b) => b.t - a.t);
    let html = `<div class="card-face ${two ? "dark" : ""}"><div class="cf-top"><span>${esc(C.name)}</span><span class="cf-nfc">)))</span></div>
      <div class="cf-chip"></div><div class="cf-bot"><span class="num">**** **** **** ${esc(C.last4)}</span><span class="cf-brand">${two ? "Master" : "VISA"}</span></div></div>`, last = null;
    v.forEach((it) => {
      if (!last || !sameDay(last, it.t)) html += `<div class="section">${longDay(it.t)}</div>`;
      last = it.t;
      html += `<button class="row" data-go="cardDetail" data-p="${P({ id: it.id })}"><div class="main"><div class="t1">${esc(it.data.shop)}</div><div class="t2">${ampm(it.t)} · ${L("approved")}</div></div><div class="amount">-${won(it.data.amount)}</div></button>`;
    });
    if (!state.flags.card2) html += `<button class="row" data-go="card2Lock" style="justify-content:center;color:#4ea1ff">${L("addCard")}</button>`;
    const top = state.flags.card2 ? tabsHtml([["main", `${S.card.short} ${S.card.last4}`], ["two", `${S.card2.short} ${S.card2.last4}`]], two ? "two" : "main") : "";
    return shell(L("cardTitle"), html, { top });
  };
  AFTER.card = ({ tab }) => {
    bindTabs();
    if (tab === "two" && state.flags.card2) thinkText("card2_open", S.card2.thought);
    else if (S.card.thoughtEmptyDay && state.now > T("6/21 12:00")) thinkText("card_empty", S.card.thoughtEmptyDay);
  };
  VIEWS.cardDetail = ({ id }) => {
    const it = items[id], d = it.data, C = it.kind === "card2" ? S.card2 : S.card;
    return shell(L("payDetail"), `<div class="doc"><h3>${esc(d.shop)}</h3><div class="from">${full(it.t)}</div>
      <div class="body">${L("payBody", won(d.amount), `${esc(C.name)} (****${esc(C.last4)})`)}</div></div>${pinBtn(id)}`);
  };
  AFTER.cardDetail = ({ id }) => { bindPins(); think(items[id]); };
  VIEWS.card2Lock = () => pinView(L("addCardTitle"), S.card2.lockQuestion, 4, L("newCard"));
  AFTER.card2Lock = () => bindPin(4, (c) => {
    if (c === S.card2.last4 && state.flags.statement) { state.flags.card2 = 1; ding(); stack.pop(); stack[stack.length - 1].p = { tab: "two" }; render(); return true; }
    $("#lockmsg").textContent = c === S.card2.last4 ? L("cardNeedStatement") : L("cardBad");
    return false;
  });

  /* 메일 */
  VIEWS.mail = ({ tab = "main" }) => {
    const top = tabsHtml([["main", L("myMail")], ["two", state.flags.mail2 ? S.email2.address.split("@")[0] : L("otherAcc")]], tab);
    if (tab === "two" && !state.flags.mail2) {
      return shell(L("mail"), `<div class="lock">
        <div style="font-size:36px">✉️</div>
        <div class="q">${esc(S.email2.address)}<br><span style="font-size:13px">${L("signedOut")}</span></div>
        <div class="q" style="margin-top:8px">${L("recover")}<b>${esc(S.email2.question)}</b></div>
        <form id="tform" style="display:flex;gap:8px;width:100%;max-width:300px"><input id="tans" class="tinput" placeholder="${L("answer")}" autocomplete="off"><button class="tbtn">${L("ok")}</button></form>
        <div class="msg" id="lockmsg"></div></div>`, { top });
    }
    const kind = tab === "two" ? "mail2" : "mail";
    const v = Object.values(items).filter((it) => it.kind === kind && visible(it)).sort((a, b) => b.t - a.t);
    return shell(L("mail"), v.map((it) => `
      <button class="row ${state.read[it.id] ? "" : "unread"}" data-go="mailDetail" data-p="${P({ id: it.id })}">
        <div class="main"><div class="t1">${esc(it.data.from)}</div><div class="t2" style="opacity:.9">${esc(it.data.subject)}</div><div class="t2">${esc(it.data.body.split("\n")[0])}</div></div>
        <div class="meta">${when(it.t)}</div></button>`).join("") || `<div class="empty">${L("noMail")}</div>`, { top });
  };
  AFTER.mail = () => {
    bindTabs();
    const f = $("#tform"); if (!f) return;
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const a = norm($("#tans").value);
      /* 두 언어의 답을 모두 받아요 (예: 갈매 해변 / Galmae Beach) */
      if (Object.values(STORIES).some((st) => st.email2.answers.some((x) => norm(x) === a))) { state.flags.mail2 = 1; ding(); render(); }
      else { $("#lockmsg").textContent = L("wrongAnswer"); $("#tans").value = ""; }
    });
  };
  VIEWS.mailDetail = ({ id }) => {
    const it = items[id], d = it.data;
    return shell(L("mail"), `<div class="doc"><h3>${esc(d.subject)}</h3><div class="from">${esc(d.from)} · ${full(it.t)}</div><div class="body">${esc(d.body)}</div></div>${pinBtn(id)}`);
  };
  AFTER.mailDetail = ({ id }) => { const it = items[id]; state.read[id] = 1; if (it.data.flag) state.flags[it.data.flag] = 1; bindPins(); think(it); };

  /* 사진 */
  const art = (d) => d.img ? `<img src="${esc(d.img)}" alt="">` : (ART[d.art] ? ART[d.art](LANG) : "");
  VIEWS.photos = () => {
    const v = Object.values(items).filter((it) => it.kind === "photo" && visible(it)).sort((a, b) => a.t - b.t);
    const dv = Object.values(items).filter((it) => it.kind === "dphoto" && visible(it));
    return shell(L("photos"), `<div class="section">${L("recentPhotos", v.length)}</div>
      <div class="grid">${v.map((it) => `<button class="thumb" data-go="photo" data-p="${P({ id: it.id })}">${art(it.data)}</button>`).join("")}</div>
      <div class="section" style="margin-top:14px">${L("other")}</div>
      <button class="row" data-go="${state.flags.deleted ? "deleted" : "deletedLock"}">
        <div class="call-ic">🗑️</div><div class="main"><div class="t1">${L("deleted")}</div><div class="t2">${state.flags.deleted ? L("nPhotos", dv.length) : L("locked")}</div></div><div class="meta">›</div></button>`);
  };
  VIEWS.deleted = () => {
    const v = Object.values(items).filter((it) => it.kind === "dphoto" && visible(it));
    return shell(L("deleted"), `<div class="section">${L("deletedNote")}</div>
      <div class="grid">${v.map((it) => `<button class="thumb" data-go="photo" data-p="${P({ id: it.id })}">${art(it.data)}</button>`).join("")}</div>
      ${v.length ? "" : `<div class="empty">${L("noDeleted")}</div>`}`);
  };
  VIEWS.photo = ({ id }) => {
    const it = items[id], d = it.data;
    const extra = it.kind === "dphoto" ? `<div class="d">${L("deletedOn")}${full(it.shownAt)}</div>` : "";
    return shell(it.kind === "dphoto" ? L("deleted") : L("photos"), `<div class="photo-full">${art(d)}</div>
      <div class="photo-cap">${esc(d.caption || "")}<div class="d">${L("taken")}${full(it.t)}</div>${extra}</div>${pinBtn(id)}`);
  };
  AFTER.photo = ({ id }) => { bindPins(); think(items[id]); };

  /* 숫자 잠금 */
  function pinView(title, question, len, sub) {
    return shell(title, `<div class="lock">
      <div style="font-size:40px">🔒</div>
      <div class="q">${esc(sub || L("secQ"))}<b>${esc(question)}</b></div>
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
  VIEWS.deletedLock = () => pinView(L("deleted"), S.deletedPhotos.lock.question, 4);
  AFTER.deletedLock = () => bindPin(4, (c) => {
    const L = S.deletedPhotos.lock;
    if (c === L.answer) { state.flags.deleted = 1; ding(); stack.pop(); go("deleted"); return true; }
    $("#lockmsg").textContent = L.wrong;
    if (L.trap && L.trap[c]) thinkText("trap_" + c, L.trap[c]);
    return false;
  });

  /* 메모 (두 번째 인격의 일기) */
  VIEWS.memo = () => {
    if (!state.flags.memo) return pinView(L("memo"), S.memo.question, S.memo.answer.length, L("lockedMemo"));
    const es = S.memo.entries.filter((e) => !e.t || T(e.t) <= state.now);
    return shell(L("memo"), es.length ? `<div class="doc diary">${es.map((e) => `<h3>${esc(e.d)}</h3><div class="body">${esc(e.text)}</div>`).join("")}</div>` : `<div class="empty">${L("memoEmpty")}</div>`);
  };
  AFTER.memo = () => {
    if (state.flags.memo) { thinkText("memo_open", S.memo.thought); return; }
    bindPin(S.memo.answer.length, (c) => {
      if (c === S.memo.answer) { state.flags.memo = 1; ding(); render(); return true; }
      $("#lockmsg").textContent = L("wrong"); return false;
    });
  };

  /* 검색 · 뉴스 · 시크릿 */
  function searchResults(q) {
    /* 영어는 두 글자로는 너무 많이 걸려서 세 글자부터 찾아요 */
    q = norm(q); if (q.length < (LANG === "en" ? 3 : 2)) return [];
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
    const top = tabsHtml([["web", L("search")], ["news", `${L("news")}${nb ? ` (${nb})` : ""}`], ["secret", `${L("secret")}${state.flags.secret ? "" : " 🔒"}`]], tab);
    let body;
    if (tab === "news") {
      const v = Object.values(items).filter((it) => it.kind === "news" && visible(it)).sort((a, b) => b.t - a.t);
      body = v.map((it) => `<button class="row ${state.read[it.id] ? "" : "unread"}" data-go="doc" data-p="${P({ id: it.id })}"><div class="main"><div class="t1" style="white-space:normal">${esc(it.data.title)}</div><div class="t2">${esc(it.data.press)} · ${when(it.t)}</div></div></button>`).join("") || `<div class="empty">${L("noNews")}</div>`;
    } else if (tab === "secret") {
      if (!state.flags.secret) return shell(L("secretMode"), patternHtml(), { top });
      const v = Object.values(items).filter((it) => it.kind === "secret" && visible(it)).sort((a, b) => b.t - a.t);
      body = `<div class="section">${L("secretHist")}</div>` + v.map((it) => `<button class="row" data-go="doc" data-p="${P({ id: it.id })}"><div class="call-ic">🕶</div><div class="main"><div class="t1" style="font-weight:400;white-space:normal">${esc(it.data.q)}</div><div class="t2">${full(it.t)}</div></div><div class="meta">${pinned(it.id) ? "📌" : ""}</div></button>`).join("");
    } else {
      const res = q ? searchResults(q) : null;
      const hist = [...state.queries].reverse().concat(S.searchHistory).filter((x, i, a) => a.indexOf(x) === i).slice(0, 8);
      body = `<form class="searchbox" id="sform"><input id="sq" placeholder="${L("searchPh")}" value="${esc(q)}" autocomplete="off" enterkeyhint="search"><button>${L("search")}</button></form>` +
        (res === null ? `<div class="section">${L("recentQ")}</div>${hist.map((h) => `<button class="row" data-q="${esc(h)}"><div class="call-ic">🕘</div><div class="main"><div class="t1" style="font-weight:400">${esc(h)}</div></div></button>`).join("")}`
          : res.length ? res.map((it) => `<button class="row result" data-go="doc" data-p="${P({ id: it.id })}"><div class="main"><div class="url">${esc(it.kind === "news" ? it.data.press : it.data.url)}</div><div class="t1">${esc(it.data.title)}</div><div class="t2">${esc((it.data.body || "").split("\n")[0])}</div></div></button>`).join("")
          : `<div class="empty">${L("noResult", esc(q))}</div>`);
    }
    return shell(tab === "news" ? L("news") : tab === "secret" ? L("secretMode") : L("search"), body, { top });
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
      <div class="q">${L("patLocked")}<b>${L("patDraw")}</b></div>
      <svg id="pat" viewBox="0 0 240 240" width="240" height="240" style="max-width:100%;touch-action:none">
        <polyline id="patline" fill="none" stroke="#4ea1ff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" points=""/>
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => { const [x, y] = DOT(n); return `<circle class="pdot" data-n="${n}" cx="${x}" cy="${y}" r="13" fill="#3a3a46"/>`; }).join("")}
      </svg>
      <div style="font-size:12px;opacity:.5">${L("patHint")}</div>
      <div style="display:flex;gap:10px"><button class="tbtn ghost" id="pat-clear">${L("clear")}</button><button class="tbtn" id="pat-ok">${L("ok")}</button></div>
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
      else { $("#lockmsg").textContent = L("patWrong"); seq = []; draw(); }
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
    const sq = it.kind === "secret" ? `<div class="secret-q">${L("searchedAt", esc(it.data.q), full(it.t))}</div>` : "";
    return shell(it.kind === "news" ? L("news") : it.kind === "secret" ? L("secretMode") : L("search"), `${sq}<div class="doc"><h3>${esc(d.title)}</h3><div class="from">${meta}</div>${table}<div class="body">${esc(d.body || "")}</div></div>${pinBtn(id)}`);
  };
  AFTER.doc = ({ id }) => { state.read[id] = 1; bindPins(); think(items[id]); };

  /* SNS */
  const dmItems = () => Object.values(items).filter((it) => it.kind === "dm" && visible(it)).sort((a, b) => a.t - b.t);
  VIEWS.sns = ({ tab = "feed" }) => {
    const top = tabsHtml([["feed", L("trending")], ["dm", L("dms")]], tab);
    if (tab === "dm") {
      const v = dmItems();
      if (!v.length) return shell(APPS.sns.name, `<div class="empty">${L("noDm")}</div>`, { top });
      return shell(`${APPS.sns.name} · ${S.sns.dmName}`, chatHtml(v, false), { top, style: "background:#b2c7d9" });
    }
    const v = Object.values(items).filter((it) => it.kind === "post" && visible(it)).sort((a, b) => b.t - a.t);
    return shell(APPS.sns.name, v.map((it) => `<div class="post">
        <div class="post-head"><div class="avatar" style="width:36px;height:36px;${avStyle(S.sns.dmName)}">${esc(S.sns.avatar)}</div><div><b>${esc(it.data.name)}</b> <span style="opacity:.5">${esc(it.data.handle)}</span><div style="font-size:12px;opacity:.5">${when(it.t)}</div></div></div>
        ${it.data.bio ? `<div class="post-bio">${esc(it.data.bio)}</div>` : ""}
        <div class="post-text">${esc(it.data.text)}</div>${pinBtn(it.id)}</div>`).join("")
      || `<div class="empty">${L("noPosts")}</div>`, { top });
  };
  AFTER.sns = ({ tab = "feed" }) => {
    bindTabs();
    if (tab === "dm") { if (dmItems().length) bindChat(dmItems()); }
    else { bindPins(); Object.values(items).forEach((it) => { if (it.kind === "post" && visible(it)) { state.read[it.id] = 1; think(it); } }); }
  };

  /* 수첩 (핀 모음) */
  VIEWS.notes = ({ tab = "clues" }) => {
    const top = tabsHtml([["clues", L("clues")], ["thoughts", L("thoughts")]], tab);
    if (tab === "thoughts") {
      const log = (state.thoughtLog || []).slice().reverse();
      return shell(L("casebook"), log.length ? `<div class="section">${L("thoughtCount", log.length)}</div>` + log.map((q) => `
        <div class="row" style="display:block"><div class="t2" style="margin:0 0 4px">${full(q.t)}</div><div style="font-size:14.5px;line-height:1.6;white-space:pre-wrap;word-break:keep-all">${esc(thoughtOf(q.key) || q.text)}</div></div>`).join("")
        : `<div class="empty">${L("noThoughts")}</div>`, { top });
    }
    const v = state.pins.map((id) => items[id]).filter(Boolean).sort((a, b) => (a.kind === "web") - (b.kind === "web") || a.t - b.t);
    return shell(L("casebook"), v.length ? `<div class="section">${L("clueCount", v.length)}</div>` + v.map((it) => `
      <button class="row" data-open="${esc(it.id)}"><div class="main"><div class="t1" style="white-space:normal;font-weight:500">${esc(label(it))}</div><div class="t2">${it.kind === "web" ? esc(it.data.url) : full(it.t)}</div></div></button>`).join("")
      : `<div class="empty">${L("noClues")}</div>`, { top });
  };
  AFTER.notes = () => bindTabs() || screen.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => open(items[b.dataset.open])));

  /* 설정 · 저장 슬롯 */
  VIEWS.settings = () => shell(L("settings"), `
    <div class="section">${L("game")}</div>
    <button class="row" data-go="slots"><div class="main"><div class="t1">${L("saveLoad")}</div><div class="t2">${L("fiveSlots")}</div></div><div class="meta">›</div></button>
    <div class="row"><div class="main"><div class="t1">${L("language")}</div></div><div class="lang-pick small">${[["ko", "한국어"], ["en", "English"]].map(([k, n]) => `<button class="${LANG === k ? "on" : ""}" data-lang="${k}" lang="${k}">${n}</button>`).join("")}</div></div>
    <div class="row"><div class="main"><div class="t1">${L("sound")}</div></div><button class="toggle ${prefs.sound ? "on" : ""}" id="tg-sound">${prefs.sound ? L("on") : L("off")}</button></div>
    <div class="row"><div class="main"><div class="t1">${L("vibe")}</div><div class="t2">${L("vibeNote")}</div></div><button class="toggle ${prefs.vibe ? "on" : ""}" id="tg-vibe">${prefs.vibe ? L("on") : L("off")}</button></div>
    <button class="row" id="to-title"><div class="main"><div class="t1">${L("toTitle")}</div><div class="t2">${L("autoNote")}</div></div></button>`);
  AFTER.settings = () => {
    screen.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => { setLang(b.dataset.lang); render(); }));
    $("#tg-sound").onclick = () => { prefs.sound = !prefs.sound; store.set("_prefs", prefs); unlockAudio(); ding(); render(); };
    $("#tg-vibe").onclick = () => { prefs.vibe = !prefs.vibe; store.set("_prefs", prefs); render(); };
    $("#to-title").onclick = () => { autosave(); stack = [{ view: "title", p: {} }]; render(); };
  };
  VIEWS.slots = ({ loadOnly }) => {
    let html = `<div class="section">${loadOnly ? L("pickLoad") : L("anytime")}</div>`;
    for (let i = 1; i <= 5; i++) {
      const s = store.get("_slot" + i);
      html += `<div class="slot"><div class="main"><div class="t1">${L("slot", i)}</div><div class="t2" style="opacity:.6;font-size:13px">${s ? `${dateLabel(s.now)} ${hhmm(s.now)} · ${L("nClues", s.pins.length)}${langTag(s)}` : L("empty")}</div></div>
        ${loadOnly ? "" : `<button data-save="${i}">${L("save")}</button>`}
        <button class="primary" data-load="${i}" ${s ? "" : "disabled"}>${L("load")}</button></div>`;
    }
    const cp = store.get("_checkpoint");
    if (cp) html += `<div class="slot"><div class="main"><div class="t1">${L("beforeFinal")}</div><div class="t2" style="opacity:.6;font-size:13px">${L("autoSaved")} · ${dateLabel(cp.now)} ${hhmm(cp.now)}</div></div><button class="primary" id="load-cp">${L("load")}</button></div>`;
    return shell(L("saveLoad"), html);
  };
  AFTER.slots = () => {
    screen.querySelectorAll("[data-save]").forEach((b) => b.addEventListener("click", () => {
      const i = b.dataset.save;
      const save = () => { store.set("_slot" + i, Object.assign(copy(state), { savedAt: Date.now() })); render(); };
      if (store.get("_slot" + i)) ask(L("overwrite", i), L("overwriteBtn"), save); else save();
    }));
    /* 저장한 언어와 상관없이, 지금 고른 언어로 이어서 해요 */
    const load = (s) => { const go2 = () => { state = copy(s); state.lang = LANG; home(); }; if (state) ask(L("askLoad"), L("load"), go2); else go2(); };
    screen.querySelectorAll("[data-load]").forEach((b) => b.addEventListener("click", () => { const s = store.get("_slot" + b.dataset.load); if (s) load(s); }));
    const cp = $("#load-cp"); if (cp) cp.onclick = () => load(store.get("_checkpoint"));
  };

  /* ================= 마지막 추리 ================= */
  /* 플레이어가 직접 쓴 답을 채점해요. 정답 조건은 story.js 의 accusation 에 있어요. */
  const KO = () => LANG === "ko";
  const ansNorm = (t) => {
    t = String(t || "").toLowerCase().replace(/[^0-9a-z\uac00-\ud7a3]+/g, " ").trim();
    return KO() ? t.replace(/ /g, "") : " " + t + " ";
  };
  /* text 어딘가에 key 와 거의 같은 부분이 있는지 (틀린 글자 max 개까지 허용) */
  const fuzzyIn = (key, text, max) => {
    let prev = new Array(key.length + 1).fill(0).map((_, i) => i);
    for (let j = 1, best = prev[key.length]; j <= text.length; j++) {
      const cur = [0];
      for (let i = 1; i <= key.length; i++)
        cur[i] = Math.min(prev[i] + 1, cur[i - 1] + 1, prev[i - 1] + (key[i - 1] === text[j - 1] ? 0 : 1));
      best = Math.min(best, cur[key.length]); prev = cur;
      if (best <= max) return true;
    }
    return false;
  };
  const hasKey = (k, text) => {
    if (KO()) {
      k = ansNorm(k); if (text.includes(k)) return true;
      return k.length >= 4 && fuzzyIn(k, text, k.length >= 7 ? 2 : 1);
    }
    k = ansNorm(k).trim();
    if (k.length <= 4) return text.includes(" " + k + " ");  /* 짧은 영어 낱말은 낱말 전체가 같아야 해요 */
    if (text.includes(" " + k)) return true;
    /* 영어는 낱말 1~3개를 붙인 것과 통째로 비교해요 (lithiumion, batery 같은 오타) */
    const kk = k.replace(/ /g, ""), max = kk.length >= 10 ? 2 : kk.length >= 6 ? 1 : 0, w = text.trim().split(" ");
    if (!max) return false;
    for (let n = 1; n <= 3; n++) for (let i = 0; i + n <= w.length; i++) {
      const c = w.slice(i, i + n).join("");
      if (Math.abs(c.length - kk.length) <= max && lev(c, kk) <= max) return true;
    }
    return false;
  };
  const lev = (a, b) => {
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  };
  const similarity = (a, b) => {
    a = a.replace(/ /g, ""); b = b.replace(/ /g, "");
    const grams = (s) => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const g = s.slice(i, i + 2); m.set(g, (m.get(g) || 0) + 1); } return m; };
    const A = grams(a), B = grams(b); let both = 0, total = 0;
    A.forEach((n, g) => { both += Math.min(n, B.get(g) || 0); total += n; }); B.forEach((n) => { total += n; });
    return total ? (2 * both) / total : 0;
  };
  function checkAnswer(answer) {
    const A = S.accusation, text = ansNorm(answer);
    const hit = A.keys.map((alts) => alts.some((k) => hasKey(k, text)));
    if (hit.every(Boolean)) return true;
    return A.core.every((i) => hit[i]) && similarity(text, ansNorm(A.model)) >= A.similar;
  }
  VIEWS.accuse = () => {
    const A = S.accusation, ans = state.flags.answer || "";
    return shell(L("final"), `<div class="accuse">
      <div class="acc-intro">${L("accIntro")}</div>
      <label class="acc-q" for="acc-text">${esc(A.q)}</label>
      <textarea id="acc-text" rows="7" placeholder="${esc(A.placeholder)}" spellcheck="false">${esc(ans)}</textarea>
      <button class="advance final" id="acc-go" ${ans.trim() ? "" : "disabled"}>${L("accuse")}</button>
      <div style="height:20px"></div></div>`);
  };
  AFTER.accuse = () => {
    const box = $("#acc-text"), go2 = $("#acc-go");
    box.addEventListener("input", () => { state.flags.answer = box.value; go2.disabled = !box.value.trim(); });
    go2.onclick = () => ask(L("askAccuse"), L("accuse"), judge);
  };
  function judge() {
    const ok = checkAnswer(state.flags.answer);
    store.set("_lastAnswer", state.flags.answer || "");
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
        notifyRaw(APPS.search, E.press, E.news); ding();
        setTimeout(() => showScene(E.after, null, () => { stack = [{ view: "over", p: {} }]; render(); }, { dark: true }), 3200);
      }, 900);
    }, { dark: true });
  }
  VIEWS.over = () => `<div class="title over"><h1 style="font-size:40px;letter-spacing:6px">GAME OVER</h1>
    <div class="sub">${L("overSub")}</div>
    <button class="btn" id="o-retry">${L("retry")}</button>
    <button class="btn" id="o-title">${L("toTitle")}</button></div>`;
  AFTER.over = () => {
    $("#o-retry").onclick = () => { const cp = store.get("_checkpoint"); if (!cp) return; state = copy(cp); state.lang = LANG; delete state.flags.pick; state.flags.answer = store.get("_lastAnswer") || ""; home(); };
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
    <div class="sub" style="margin-top:40px">${L("theEnd", esc(S.title), state.pins.length)}</div>
    <button class="btn" id="e-title">${L("toTitle")}</button></div>`;
  AFTER.end = () => { $("#e-title").onclick = () => { stack = [{ view: "title", p: {} }]; render(); }; };

  /* ================= 진행 ================= */
  function ask(text, yes, onYes) {
    overlay.innerHTML = `<div class="scene" style="cursor:default;align-items:center;text-align:center">
      <p class="line" style="opacity:1;animation:none">${esc(text)}</p>
      <div style="display:flex;gap:10px;margin-top:10px"><button class="pin-btn" style="margin:0" id="ask-no">${L("cancel")}</button><button class="pin-btn on" style="margin:0" id="ask-yes">${esc(yes)}</button></div></div>`;
    overlay.classList.add("show"); overlay.onclick = null;
    $("#ask-no").onclick = () => overlay.classList.remove("show");
    $("#ask-yes").onclick = () => { overlay.classList.remove("show"); onYes(); };
  }
  function showScene(lines, dateTs, cb, opt = {}) {
    if (!lines || !lines.length) { cb && cb(); return; }
    /* 장면 배경 그림 (기억을 잃는 장면·엔딩처럼 dark 인 장면은 검은 화면 그대로) */
    const bg = !opt.dark && window.SCENES ? `<div class="scene-bg">${window.SCENES.pick(lines.join(" "), dateTs || (state && state.now))}</div>` : "";
    overlay.innerHTML = `${bg}<div class="scene ${opt.dark ? "dark" : ""} ${bg ? "has-bg" : ""}">${dateTs ? `<div class="date">${esc(longDay(dateTs))} · ${ampm(dateTs)}</div>` : ""}
      ${lines.map((l, i) => `<p class="line" style="animation-delay:${i * 0.9}s">${esc(l)}</p>`).join("")}<div class="tap">${L("tap")}</div></div>`;
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
    if (unread && force !== true) return ask(L("askSleep"), L("sleep"), () => sleep(true));
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
    const more = lines.length > 4 ? `<div class="nb more">${L("more", lines.length - 4)}</div>` : "";
    el.innerHTML = `<div class="ic" style="background:${app.bg}">${app.ic}</div><div style="flex:1;min-width:0"><div style="display:flex"><span class="nt">${esc(title)}</span><span class="nm">${lines.length > 1 ? L("count", lines.length) : ""}${L("now")}</span></div>${lines.slice(0, 4).map((l) => `<div class="nb">${esc(l)}</div>`).join("")}${more}</div>`;
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
        call: () => [APPS.calls, L("missed")],
        card: () => [APPS.card, L("cardOk")],
        mail: () => [APPS.mail, many ? L("newMail") : it.data.from],
        news: () => [APPS.search, many ? L("breaking") : L("pressBreaking", it.data.press)],
        dm: () => [APPS.sns, `${S.sns.dmName} (${S.sns.dmHandle})`]
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
  stack = [{ view: "notice", p: {} }];
  render();
})();
