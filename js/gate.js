/* =====================================================================
   입장 비밀번호
   ---------------------------------------------------------------------
   스토리는 js/story.enc.js 에 암호화되어 있어서, 비밀번호를 맞게
   입력해야 풀리고 게임이 시작돼요. 한 번 맞히면 그 기기에서는
   다시 묻지 않아요.
   ===================================================================== */
(function () {
  const SAVED = "mulddae_gate_pw";
  const ENG = !/^ko/i.test(navigator.language || "ko");
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  async function unlock(pw) {
    const E = window.STORY_ENC;
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: b64(E.salt), iterations: E.it, hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(E.iv) }, key, b64(E.ct));
    return new TextDecoder().decode(plain);
  }

  function load(src) {
    return new Promise((ok, fail) => {
      const s = document.createElement("script");
      s.src = src; s.onload = ok; s.onerror = fail;
      document.body.appendChild(s);
    });
  }

  async function start(code) {
    (0, eval)(code);
    const tag = (document.querySelector('script[src*="gate.js"]').src.split("?")[1] || "");
    const q = tag ? "?" + tag : "";
    await load("js/art.js" + q);
    await load("js/engine.js" + q);
  }

  async function tryPw(pw) {
    pw = (pw || "").trim().toLowerCase();
    if (!pw) return false;
    try { const code = await unlock(pw); try { localStorage.setItem(SAVED, pw); } catch (e) {} await start(code); return true; }
    catch (e) { return false; }
  }

  function showForm() {
    const box = document.createElement("div");
    box.id = "gate";
    box.innerHTML =
      `<div class="gate-card">
         <div class="gate-title">${ENG ? "Meridian of Silence" : "침묵의 자오선"}<small>${ENG ? "Invisible Meridian" : "보이지 않는 선"}</small></div>
         <div class="gate-sub">${ENG ? "This game is invite-only.<br>Enter the password you were given." : "초대받은 사람만 플레이할 수 있어요.<br>전달받은 비밀번호를 입력하세요."}</div>
         <form><input type="password" autocomplete="off" autocapitalize="off" spellcheck="false"
           placeholder="${ENG ? "Password" : "비밀번호"}">
         <button type="submit">${ENG ? "Enter" : "입장"}</button></form>
         <div class="gate-err"></div>
       </div>`;
    document.body.appendChild(box);
    const input = box.querySelector("input"), err = box.querySelector(".gate-err"), btn = box.querySelector("button");
    box.querySelector("form").onsubmit = async (ev) => {
      ev.preventDefault();
      btn.disabled = true; err.textContent = "";
      if (await tryPw(input.value)) box.remove();
      else { err.textContent = ENG ? "Wrong password." : "비밀번호가 맞지 않아요."; input.select(); }
      btn.disabled = false;
    };
    setTimeout(() => input.focus(), 50);
  }

  (async () => {
    let saved = null;
    try { saved = localStorage.getItem(SAVED); } catch (e) {}
    if (saved && await tryPw(saved)) return;
    try { localStorage.removeItem(SAVED); } catch (e) {}
    showForm();
  })();
})();
