/* 사진첩 그림 (SVG). 글자가 들어간 그림은 lang("ko"/"en")에 따라 한국어·영어로 바뀌어요. 나중에 AI 생성 이미지로 바꿀 수 있어요.
   이미지 파일을 쓰려면 story.js 사진 항목에 img: "images/파일이름.jpg" 를 넣으면 됩니다.
   모든 그림에 필름 질감(grain)과 가장자리 어둡게(vignette)를 넣어 폰 사진처럼 보이게 했어요. */
window.ART = (function () {
  /* k = 그림 이름. 같은 화면에 여러 장이 있어도 id가 겹치지 않도록 앞에 붙여요. */
  const wrap = (k, defs, inner, opt = {}) => `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs>${defs}
      <filter id="${k}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/>
        <feColorMatrix values=".33 .33 .33 0 0  .33 .33 .33 0 0  .33 .33 .33 0 0  0 0 0 0 1"/></filter>
      <filter id="${k}-soft"><feGaussianBlur stdDeviation="${opt.blur || 2}"/></filter>
      <filter id="${k}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      <linearGradient id="${k}-psh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".34"/></linearGradient>
      <radialGradient id="${k}-vig" cx=".5" cy=".5" r=".72"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${opt.vig ?? .55}"/></radialGradient>
    </defs>
    ${inner}
    <rect width="300" height="300" fill="url(#${k}-vig)"/>
    <rect width="300" height="300" filter="url(#${k}-grain)" opacity="${opt.grain ?? .16}" style="mix-blend-mode:overlay"/>
  </svg>`;

  /* 앞모습 얼굴: 귀, 눈썹, 눈, 코 그림자, 웃는 입. 안경은 o.glasses */
  const face = (skin, hair, o) => `
      <ellipse cx="-10.2" cy="-108" rx="2" ry="3" fill="${skin}"/><ellipse cx="10.2" cy="-108" rx="2" ry="3" fill="${skin}"/>
      <ellipse cx="0" cy="-104" rx="9" ry="7" fill="#000" opacity=".06"/>
      <path d="M-6.4 -113.2 q2.4 -1.2 4.4 0 M2 -113.2 q2.4 -1.2 4.4 0" stroke="${hair}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
      <ellipse cx="-3.8" cy="-110" rx="1.15" ry="${o.squint ? .5 : .95}" fill="#1a1210"/><ellipse cx="3.8" cy="-110" rx="1.15" ry="${o.squint ? .5 : .95}" fill="#1a1210"/>
      <path d="M.4 -109 q1 3.4 -.8 4.2" stroke="#000" stroke-width=".7" opacity=".22" fill="none"/>
      <path d="${o.flat ? "M-2.6 -102.6 h5.2" : "M-3.2 -103.2 q3.2 2.6 6.4 0"}" stroke="#7a3a34" stroke-width="1" fill="none" stroke-linecap="round"/>
      <circle cx="-5.6" cy="-105.6" r="2" fill="#e07a6a" opacity=".16"/><circle cx="5.6" cy="-105.6" r="2" fill="#e07a6a" opacity=".16"/>
      ${o.glasses ? `<g fill="none" stroke="#1a1a1a" stroke-width=".8"><circle cx="-3.8" cy="-110" r="2.8"/><circle cx="3.8" cy="-110" r="2.8"/><path d="M-1 -110 h2 M-6.6 -110.4 l-3 -.6 M6.6 -110.4 l3 -.6"/></g>` : ""}
      <path d="M-10.4 -111 Q-11 -104 -9.4 -103 M10.4 -111 Q11 -104 9.4 -103" stroke="${hair}" stroke-width="1.4" fill="none"/>`;

  /* 사람 (뒷모습/앞모습 공통 실루엣). 발 위치가 (x, y). */
  const person = (x, y, s, o = {}) => {
    const skin = o.skin || "#141018", hair = o.hair || skin, shirt = o.shirt || skin, pants = o.pants || skin, shoe = o.shoe || "#0a080c";
    const longHair = o.long ? `<path d="M-12 -112 Q-14 -92 -16 -78 Q-6 -82 0 -82 Q6 -82 16 -78 Q14 -92 12 -112Z" fill="${hair}"/>` : "";
    const rim = o.rim ? `<path d="M-19 -92 C-10 -95 10 -95 19 -92 C24 -90 27 -86 28 -80 L31 -46" fill="none" stroke="${o.rim}" stroke-width="1.6" opacity=".7"/>
      ${o.front ? "" : `<path d="M-10 -116 Q0 -124 10 -116" fill="none" stroke="${o.rim}" stroke-width="1.6" opacity=".8"/>`}` : "";
    return `<g transform="translate(${x} ${y}) scale(${s})">
      ${longHair}
      <rect x="-4" y="-100" width="8" height="10" fill="${skin}"/>
      <ellipse cx="0" cy="-109" rx="10" ry="12" fill="${skin}"/>
      <path d="M-10.5 -110 Q-11 -123 0 -123 Q11 -123 10.5 -110 Q${o.front ? "6 -117 0 -117 Q-6 -117 -10.5 -110" : "11 -100 0 -99 Q-11 -100 -10.5 -110"}Z" fill="${hair}"/>
      <path d="M-19 -46 L19 -46 L17 -2 L5 -2 L1.5 -32 L-1.5 -32 L-5 -2 L-17 -2Z" fill="${pants}"/>
      <path d="M-19 -92 C-10 -95 10 -95 19 -92 C24 -90 27 -86 28 -80 L31 -48 L24.5 -47 L21 -72 L20 -44 L-20 -44 L-21 -72 L-24.5 -47 L-31 -48 L-28 -80 C-27 -86 -24 -90 -19 -92Z" fill="${shirt}"/>
      <ellipse cx="-28" cy="-44" rx="3.6" ry="4.6" fill="${skin}"/><ellipse cx="28" cy="-44" rx="3.6" ry="4.6" fill="${skin}"/>
      <path d="M-18 -2 H-4 V1 H-19Z M4 -2 H18 L19 1 H4Z" fill="${shoe}"/>
      <path d="M6 -94 C13 -94 17 -93 19 -92 C24 -90 27 -86 28 -80 L31 -48 L24.5 -47 L21 -72 L20 -44 L6 -44Z M2 -46 H19 L17 -2 H5Z" fill="url(#${o.k}-psh)"/>
      <path d="M-19 -91 C-24 -89 -27 -85 -28 -79 L-30.5 -50" fill="none" stroke="#fff" stroke-width="1.2" opacity=".14"/>
      ${o.front ? face(skin, hair, o) : ""}
      ${rim}
    </g>`;
  };

  /* 꽃무늬 셔츠 (사장님이 늘 입던 것) */
  const floral = (id, base, a, b) => `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
      <rect width="14" height="14" fill="${base}"/>
      <g fill="${a}"><circle cx="4" cy="4" r="1.9"/><circle cx="6.4" cy="4" r="1.9"/><circle cx="5.2" cy="2" r="1.9"/><circle cx="5.2" cy="6" r="1.9"/></g>
      <circle cx="5.2" cy="4" r="1.1" fill="${b}"/>
      <path d="M10 10 q2 -3 4 0 q-2 2 -4 0Z" fill="${b}" opacity=".8"/></pattern>`;

  /* 해 질 녘 해변 (삭제된 사진 두 장이 같은 장소) */
  const sunset = (k) => ({
    defs: `<linearGradient id="${k}-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1c2150"/><stop offset=".32" stop-color="#6a3a78"/><stop offset=".48" stop-color="#d9605a"/><stop offset=".56" stop-color="#f59a5c"/><stop offset=".6" stop-color="#ffd08a"/></linearGradient>
      <linearGradient id="${k}-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a4a6a"/><stop offset=".4" stop-color="#3c2e58"/><stop offset="1" stop-color="#1c1a34"/></linearGradient>
      <linearGradient id="${k}-sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b3c44"/><stop offset="1" stop-color="#1e1418"/></linearGradient>
      <radialGradient id="${k}-sun"><stop offset="0" stop-color="#fff4d0"/><stop offset=".35" stop-color="#ffd27a" stop-opacity=".9"/><stop offset="1" stop-color="#ff8a50" stop-opacity="0"/></radialGradient>`,
    bg: `<rect width="300" height="300" fill="url(#${k}-sky)"/>
      <circle cx="150" cy="176" r="70" fill="url(#${k}-sun)" opacity=".8"/>
      <g filter="url(#${k}-soft)" opacity=".75">
        <ellipse cx="70" cy="96" rx="70" ry="5" fill="#3a2450"/><ellipse cx="78" cy="99" rx="54" ry="2.5" fill="#ff9d7a"/>
        <ellipse cx="236" cy="72" rx="80" ry="6" fill="#2c2050"/><ellipse cx="230" cy="76" rx="60" ry="2.5" fill="#f07c78"/>
        <ellipse cx="200" cy="140" rx="48" ry="3" fill="#7a3a60"/><ellipse cx="60" cy="150" rx="40" ry="2.5" fill="#c05a62"/>
      </g>
      <circle cx="150" cy="174" r="15" fill="#fff1c8"/>
      <rect y="176" width="300" height="56" fill="url(#${k}-sea)"/>
      <g fill="#ffd89a">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<rect x="${150 - (14 - i) * (1 + i * .25)}" y="${179 + i * 5.6}" width="${(14 - i) * (2 + i * .5)}" height="1.6" rx=".8" opacity="${.85 - i * .08}"/>`).join("")}</g>
      <g stroke="#e8a0a8" stroke-width=".8" opacity=".35" fill="none">
        <path d="M10 192 q20 -2 40 0 M200 188 q30 -2 60 0 M60 206 q30 -2 60 0 M220 212 q25 -2 50 0 M20 222 q30 -2 60 0"/></g>
      <path d="M0 232 Q60 224 130 230 T300 226 V300 H0Z" fill="url(#${k}-sand)"/>
      <path d="M0 232 Q60 224 130 230 T300 226" fill="none" stroke="#f3d0c8" stroke-width="2" opacity=".55"/>
      <path d="M0 240 Q70 233 140 239 T300 235 L300 248 Q160 244 0 250Z" fill="#c78a7a" opacity=".22"/>
      <rect x="135" y="236" width="30" height="40" fill="#ffd08a" opacity=".08" filter="url(#${k}-soft)"/>`
  });

  return {
    /* 6/4 해변: 두 사람의 뒷모습. 왼쪽이 꽃무늬 셔츠 (사장님) */
    sunsetTwo: () => {
      const k = "s2", s = sunset(k);
      return wrap(k, s.defs + floral(`${k}-fl`, "#241824", "#6e3446", "#8a6a3a"), s.bg + `
        <ellipse cx="112" cy="282" rx="18" ry="2.6" fill="#000" opacity=".35"/><ellipse cx="196" cy="282" rx="18" ry="2.6" fill="#000" opacity=".35"/>
        ${person(112, 282, .82, { k, skin: "#1a1218", hair: "#0e0a0e", shirt: `url(#${k}-fl)`, pants: "#1c1620", rim: "#ffb27a" })}
        ${person(196, 282, .86, { k, skin: "#1a1218", hair: "#0e0a0e", shirt: "#1d1a26", pants: "#141018", rim: "#ffb27a" })}`, { vig: .45 });
    },
    /* 6/20 같은 해변: 바닷가에 차려진 2인분 식탁 */
    sunsetTable: () => {
      const k = "st", s = sunset(k);
      const chair = (x, flip) => `<g transform="translate(${x} 0) scale(${flip ? -1 : 1} 1)">
        <path d="M0 236 L4 236 L6 262 L24 262 L24 266 L6 266 L4 286 L0 286Z" fill="#1a1216"/><rect x="20" y="266" width="3" height="20" fill="#1a1216"/></g>`;
      return wrap(k, s.defs + `<linearGradient id="${k}-cloth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6d8c8"/><stop offset="1" stop-color="#8a6a72"/></linearGradient>`, s.bg + `
        <ellipse cx="150" cy="288" rx="80" ry="5" fill="#000" opacity=".35"/>
        ${chair(76, false)}${chair(224, true)}
        <path d="M96 252 H204 L210 282 H90Z" fill="url(#${k}-cloth)" opacity=".92"/>
        <rect x="94" y="249" width="112" height="5" rx="2" fill="#f8e4d6"/>
        <ellipse cx="122" cy="250" rx="12" ry="2.6" fill="#fff" opacity=".9"/><ellipse cx="178" cy="250" rx="12" ry="2.6" fill="#fff" opacity=".9"/>
        <g fill="none" stroke="#f4e6e0" stroke-width="1" opacity=".9"><path d="M136 249 V240 M132 232 Q136 242 140 232 Z M164 249 V240 M160 232 Q164 242 168 232 Z"/></g>
        <path d="M133 234 Q136 239 139 234Z M161 234 Q164 239 167 234Z" fill="#8a1f3a"/>
        <rect x="148" y="238" width="4" height="11" fill="#f0e4cc"/>
        <circle cx="150" cy="234" r="10" fill="#ffc36a" opacity=".5" filter="url(#${k}-glow)"/>
        <ellipse cx="150" cy="235" rx="1.6" ry="3.2" fill="#fff0b0"/>`, { vig: .45 });
    },
    /* 작년 11/03 생일 케이크 (희주가 사 온 것) */
    cake: () => {
      const k = "ck";
      const bokeh = [[30, 50, 14, "#ffcf7a"], [70, 30, 9, "#ff9f6a"], [250, 40, 16, "#ffd98a"], [280, 90, 10, "#ffb07a"], [210, 20, 8, "#ffe0a0"], [20, 120, 10, "#ffb88a"], [120, 26, 7, "#ffd0a0"]];
      const flame = (x, y) => `<circle cx="${x}" cy="${y}" r="16" fill="#ffb84a" opacity=".55" filter="url(#${k}-glow)"/>
        <path d="M${x} ${y - 10} Q${x + 5} ${y - 2} ${x} ${y + 6} Q${x - 5} ${y - 2} ${x} ${y - 10}Z" fill="#ffe08a"/><ellipse cx="${x}" cy="${y + 2}" rx="1.6" ry="3" fill="#fffbe8"/>`;
      return wrap(k, `<radialGradient id="${k}-room" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#5a3622"/><stop offset=".6" stop-color="#22140e"/><stop offset="1" stop-color="#0c0806"/></radialGradient>
        <linearGradient id="${k}-side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c9a898"/><stop offset=".35" stop-color="#fbeadf"/><stop offset=".7" stop-color="#f2d8c8"/><stop offset="1" stop-color="#9a7a6c"/></linearGradient>
        <linearGradient id="${k}-tbl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2e1e"/><stop offset="1" stop-color="#140c08"/></linearGradient>`, `
        <rect width="300" height="300" fill="url(#${k}-room)"/>
        <g filter="url(#${k}-glow)">${bokeh.map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity=".45"/>`).join("")}</g>
        <rect y="222" width="300" height="78" fill="url(#${k}-tbl)"/>
        <ellipse cx="150" cy="236" rx="92" ry="12" fill="#e9e2da" opacity=".9"/><ellipse cx="150" cy="234" rx="84" ry="9" fill="#fff"/>
        <path d="M82 162 V224 Q150 240 218 224 V162Z" fill="url(#${k}-side)"/>
        <ellipse cx="150" cy="162" rx="68" ry="14" fill="#fff6ee"/>
        <path d="M82 164 Q86 176 92 168 Q96 182 104 170 Q110 180 118 172 Q124 184 132 174 Q140 182 148 175 Q156 184 164 174 Q172 182 180 172 Q188 182 196 170 Q204 180 210 168 Q214 176 218 164 Q150 186 82 164Z" fill="#e88aa4"/>
        <ellipse cx="150" cy="160" rx="66" ry="12" fill="#f4a0b6"/>
        <g>${[[116, 156], [184, 156], [150, 168], [130, 166], [170, 166]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#c8243c"/><circle cx="${x - 1.4}" cy="${y - 1.4}" r="1.2" fill="#ff8a9a"/>`).join("")}</g>
        <rect x="118" y="124" width="5" height="34" rx="1.5" fill="#9fd3f5"/><rect x="147.5" y="120" width="5" height="40" rx="1.5" fill="#f5e29f"/><rect x="177" y="124" width="5" height="34" rx="1.5" fill="#b9f59f"/>
        ${flame(120.5, 116)}${flame(150, 112)}${flame(179.5, 116)}
        <ellipse cx="150" cy="190" rx="70" ry="40" fill="#ffc070" opacity=".12" filter="url(#${k}-glow)"/>`, { vig: .6, grain: .2 });
    },
    /* 3/20 22:30 바다정 마감 후: 사장님(꽃무늬), 지훈이 형, 나 */
    restaurant: (lang) => {
      const k = "rs", en = lang === "en";
      const sign = en ? "BADAJEONG" : "바다정", fs = en ? 22 : 28, ls = en ? 4 : 6;
      return wrap(k, floral(`${k}-fl`, "#2a2030", "#b04a5a", "#e0b050") + `
        <linearGradient id="${k}-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf8a"/><stop offset="1" stop-color="#c8743a"/></linearGradient>
        <linearGradient id="${k}-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2420"/><stop offset="1" stop-color="#0a0908"/></linearGradient>`, `
        <rect width="300" height="300" fill="#0d1218"/>
        <rect x="0" y="0" width="300" height="230" fill="#1a1e24"/>
        <rect x="14" y="20" width="272" height="44" rx="4" fill="#2c2018" stroke="#6a4a2a" stroke-width="2"/>
        <text x="150" y="${en ? 51 : 53}" font-size="${fs}" text-anchor="middle" fill="#ffe2a8" font-family="'Nanum Myeongjo','Batang',serif" font-weight="700" letter-spacing="${ls}">${sign}</text>
        <text x="150" y="${en ? 51 : 53}" font-size="${fs}" text-anchor="middle" fill="#ffb84a" font-family="'Nanum Myeongjo','Batang',serif" font-weight="700" letter-spacing="${ls}" filter="url(#${k}-glow)" opacity=".7">${sign}</text>
        <rect x="26" y="78" width="160" height="150" fill="url(#${k}-win)"/>
        <g stroke="#3a2a1e" stroke-width="5"><path d="M106 78 V228 M26 150 H186"/></g>
        <g fill="#7a4020" opacity=".55"><rect x="40" y="170" width="50" height="6"/><rect x="120" y="170" width="50" height="6"/><rect x="48" y="176" width="3" height="40"/><rect x="160" y="176" width="3" height="40"/>
          <circle cx="66" cy="98" r="9"/><circle cx="146" cy="98" r="9"/></g>
        <g fill="#fff3c8" opacity=".85"><circle cx="66" cy="100" r="4"/><circle cx="146" cy="100" r="4"/></g>
        <rect x="200" y="78" width="80" height="150" fill="#22181a"/><rect x="204" y="82" width="72" height="146" fill="#3a2a22"/>
        <text x="240" y="120" font-size="12" text-anchor="middle" fill="#e8d8b8" font-family="sans-serif">CLOSED</text>
        <rect x="216" y="106" width="48" height="20" rx="2" fill="none" stroke="#e8d8b8" stroke-width="1"/>
        <rect y="228" width="300" height="72" fill="url(#${k}-ground)"/>
        <rect x="26" y="228" width="160" height="30" fill="#ffb060" opacity=".12" filter="url(#${k}-soft)"/>
        ${person(92, 290, 1.16, { k, skin: "#c89a7c", hair: "#5a5452", squint: true, shirt: `url(#${k}-fl)`, pants: "#2a2a30", front: true, rim: "#ffcf8a" })}
        ${person(152, 290, 1.12, { k, skin: "#d0a284", hair: "#1a1414", glasses: true, shirt: "#ece6dc", pants: "#2a3446", front: true, rim: "#ffcf8a" })}
        ${person(210, 290, 1.04, { k, skin: "#d6aa8c", hair: "#18120e", flat: true, shirt: "#2c4a5c", pants: "#1e1e24", front: true, rim: "#ffcf8a" })}
        <rect x="0" y="0" width="300" height="300" fill="#ffffff" opacity=".04"/>`, { vig: .6 });
    },
    /* 5/05 어린이날, 엄마 아빠랑 */
    family: () => {
      const k = "fm";
      const tree = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-3" y="-10" width="6" height="40" fill="#5a4030"/>
        <circle cx="0" cy="-26" r="22" fill="#4a8a4a"/><circle cx="-14" cy="-14" r="16" fill="#3f7a40"/><circle cx="14" cy="-16" r="17" fill="#559a50"/><circle cx="4" cy="-38" r="14" fill="#62a85a"/></g>`;
      return wrap(k, `<linearGradient id="${k}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5aa0e0"/><stop offset="1" stop-color="#cfe6f6"/></linearGradient>
        <linearGradient id="${k}-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8cc46a"/><stop offset="1" stop-color="#4a8a3a"/></linearGradient>`, `
        <rect width="300" height="300" fill="url(#${k}-sky)"/>
        <g fill="#fff" opacity=".85" filter="url(#${k}-soft)"><ellipse cx="60" cy="50" rx="40" ry="12"/><ellipse cx="86" cy="42" rx="24" ry="12"/><ellipse cx="220" cy="80" rx="46" ry="10"/><ellipse cx="240" cy="72" rx="22" ry="10"/></g>
        <g filter="url(#${k}-soft)" opacity=".8">${tree(30, 190, 1.1)}${tree(80, 186, .8)}${tree(250, 192, 1.2)}${tree(290, 188, .9)}${tree(200, 184, .7)}</g>
        <rect y="196" width="300" height="104" fill="url(#${k}-grass)"/>
        <g fill="#ff6a7a"><circle cx="60" cy="236" r="2"/><circle cx="240" cy="250" r="2"/><circle cx="34" cy="266" r="2"/><circle cx="270" cy="230" r="1.6"/></g>
        <g fill="#fff4a0"><circle cx="80" cy="256" r="1.8"/><circle cx="220" cy="270" r="1.8"/><circle cx="256" cy="282" r="1.6"/></g>
        <path d="M228 120 Q232 150 222 178" stroke="#eee" stroke-width=".8" fill="none"/>
        <ellipse cx="228" cy="110" rx="12" ry="15" fill="#ff5a6a"/><ellipse cx="224" cy="104" rx="3" ry="5" fill="#fff" opacity=".5"/>
        <ellipse cx="150" cy="282" rx="80" ry="6" fill="#2a5a20" opacity=".35"/>
        ${person(100, 280, 1.02, { k, skin: "#f0c8a8", hair: "#2a1a14", shirt: "#d86a74", pants: "#e8e0d4", long: true, front: true })}
        ${person(150, 280, .98, { k, skin: "#f2cdb0", hair: "#14100e", flat: true, shirt: "#6a9ad8", pants: "#3a4a6a", front: true })}
        ${person(202, 280, 1.12, { k, skin: "#e6b896", hair: "#3a3634", glasses: true, shirt: "#e8e2d2", pants: "#5a5040", front: true })}`, { vig: .3, grain: .12 });
    },
    /* 5/18 18:40 희주. 창가 역광 */
    heeju: () => {
      const k = "hj";
      return wrap(k, `<linearGradient id="${k}-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb37a"/><stop offset=".6" stop-color="#ffd8a0"/><stop offset="1" stop-color="#f4a07a"/></linearGradient>
        <linearGradient id="${k}-face" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#ffd0b0"/><stop offset=".35" stop-color="#b88470"/><stop offset="1" stop-color="#6a4a44"/></linearGradient>`, `
        <rect width="300" height="300" fill="url(#${k}-win)"/>
        <g filter="url(#${k}-glow)" opacity=".7"><circle cx="230" cy="70" r="18" fill="#fff4d8"/><circle cx="40" cy="60" r="10" fill="#fff"/><circle cx="270" cy="150" r="12" fill="#ffe8c0"/><circle cx="70" cy="140" r="8" fill="#fff0d0"/></g>
        <g fill="#6a4030" opacity=".35" filter="url(#${k}-soft)"><rect x="0" y="180" width="80" height="120"/><rect x="230" y="160" width="70" height="140"/><rect x="110" y="0" width="8" height="300"/></g>
        <path d="M84 300 Q86 220 120 206 Q150 196 180 206 Q214 220 218 300Z" fill="#7a5a6a"/>
        <path d="M120 206 Q150 196 180 206 Q214 220 218 300" fill="none" stroke="#ffd8b0" stroke-width="2" opacity=".7"/>
        <path d="M100 150 Q96 70 150 64 Q206 68 204 140 Q206 196 212 236 Q190 222 184 200 L118 200 Q112 222 92 236 Q102 196 100 150Z" fill="#241414"/>
        <path d="M118 120 Q120 92 150 90 Q182 92 184 124 Q184 168 150 184 Q118 168 118 120Z" fill="url(#${k}-face)"/>
        <path d="M184 124 Q184 168 150 184" fill="none" stroke="#ffe0c0" stroke-width="2.2" opacity=".85"/>
        <path d="M110 120 Q114 74 150 72 Q194 74 196 130 Q186 96 152 96 Q122 98 110 120Z" fill="#2c1a18"/>
        <path d="M196 130 Q194 76 150 70" fill="none" stroke="#ffb88a" stroke-width="2" opacity=".75"/>
        <path d="M138 152 Q150 160 162 152" stroke="#5a3432" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>
        <g fill="none" stroke="#3a2422" stroke-linecap="round" opacity=".75"><path d="M131 130 q7 5 14 0 M157 130 q7 5 14 0" stroke-width="2"/><path d="M130 121 q7 -4 14 -1 M158 120 q7 -3 14 1" stroke-width="1.8"/></g>
        <path d="M152 134 q3 8 -1 11" stroke="#4a2c2a" stroke-width="1.2" fill="none" opacity=".4"/>
        <circle cx="134" cy="146" r="6" fill="#e88a7a" opacity=".18"/><circle cx="168" cy="146" r="6" fill="#ffb090" opacity=".22"/>
        <g transform="translate(176 232)"><path d="M0 0 H34 L30 46 H4Z" fill="#f4ece4" opacity=".9"/><rect x="-2" y="-4" width="38" height="6" rx="2" fill="#3a2a2a"/>
          <rect x="2" y="16" width="30" height="12" fill="#8a5a3a" opacity=".7"/></g>
        <ellipse cx="184" cy="268" rx="12" ry="8" fill="#c08a74"/>`, { vig: .4, grain: .18 });
    },
    /* 7/7 아빠 차 트렁크. 스페어타이어 칸 아래 약 봉투와 배터리 상자 (플래시로 찍은 느낌) */
    trunk: (lang) => {
      const k = "tr", en = lang === "en";
      return wrap(k, `<radialGradient id="${k}-flash" cx=".5" cy=".62" r=".6"><stop offset="0" stop-color="#4a4a52"/><stop offset=".6" stop-color="#1e1e24"/><stop offset="1" stop-color="#08080a"/></radialGradient>
        <radialGradient id="${k}-tire" cx=".5" cy=".5" r=".5"><stop offset=".3" stop-color="#2a2a2e"/><stop offset=".55" stop-color="#121214"/><stop offset=".8" stop-color="#1e1e22"/><stop offset="1" stop-color="#0a0a0c"/></radialGradient>
        <pattern id="${k}-carpet" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#26262c"/><rect width="2" height="2" fill="#2e2e36"/></pattern>`, `
        <rect width="300" height="300" fill="url(#${k}-carpet)"/>
        <path d="M0 0 H300 V52 L260 70 H40 L0 52Z" fill="#141418"/>
        <path d="M40 70 H260 L250 82 H50Z" fill="#3a3a42"/>
        <rect x="40" y="80" width="220" height="200" rx="18" fill="#0e0e12"/>
        <rect x="44" y="84" width="212" height="192" rx="16" fill="url(#${k}-flash)"/>
        <circle cx="150" cy="168" r="78" fill="url(#${k}-tire)"/>
        <g stroke="#08080a" stroke-width="3" opacity=".7">${Array.from({ length: 24 }, (_, i) => { const a = i * Math.PI / 12; return `<line x1="${150 + Math.cos(a) * 64}" y1="${168 + Math.sin(a) * 64}" x2="${150 + Math.cos(a) * 77}" y2="${168 + Math.sin(a) * 77}"/>`; }).join("")}</g>
        <circle cx="150" cy="168" r="40" fill="#5a5a62"/><circle cx="150" cy="168" r="36" fill="#3a3a42"/><circle cx="150" cy="168" r="12" fill="#6a6a72"/>
        ${[0, 1, 2, 3, 4].map((i) => { const a = i * Math.PI * 2 / 5 - Math.PI / 2; return `<circle cx="${150 + Math.cos(a) * 22}" cy="${168 + Math.sin(a) * 22}" r="3" fill="#8a8a92"/>`; }).join("")}
        <g transform="rotate(-9 104 222)">
          <rect x="62" y="194" width="86" height="56" rx="3" fill="#ebe6d8"/>
          <path d="M62 194 H148 L140 204 H70Z" fill="#d8d0bc"/>
          <rect x="62" y="210" width="86" height="1.5" fill="#2f7a5a"/>
          <text x="76" y="230" font-size="${en ? 11 : 14}" font-weight="700" fill="#2f7a5a" font-family="sans-serif">${en ? "PHARMACY" : "약 봉투"}</text>
          <text x="76" y="244" font-size="8" fill="#6a6a60" font-family="sans-serif">${en ? "1 tablet at bedtime" : "복용법: 1일 1회 취침 전"}</text>
        </g>
        <g transform="rotate(4 200 218)">
          <rect x="160" y="196" width="84" height="48" rx="2" fill="#2f5d86"/>
          <path d="M160 196 H244 L238 190 H166Z" fill="#4a7aa8"/>
          <rect x="166" y="202" width="20" height="36" rx="3" fill="#f2c230"/><rect x="170" y="198" width="12" height="5" rx="1" fill="#c8c8c8"/>
          <text x="192" y="218" font-size="12" font-weight="700" fill="#eef4fa" font-family="sans-serif">18650</text>
          <text x="192" y="232" font-size="11" fill="#eef4fa" font-family="sans-serif">×2</text>
        </g>
        <ellipse cx="150" cy="210" rx="110" ry="70" fill="#fff" opacity=".05" filter="url(#${k}-glow)"/>`, { vig: .75, grain: .22 });
    },
    /* 6/13 빈 강의실 칠판. 점 아홉 개 패턴은 1-5-3-6-9 순서 (시크릿 검색 잠금 답) */
    board: (lang) => {
      const k = "bd", en = lang === "en";
      return wrap(k, `<filter id="${k}-chalk"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2"/></filter>
        <radialGradient id="${k}-slate" cx=".45" cy=".4" r=".8"><stop offset="0" stop-color="#3a5a4a"/><stop offset="1" stop-color="#1e3229"/></radialGradient>
        <filter id="${k}-dust"><feTurbulence type="fractalNoise" baseFrequency=".02 .2" numOctaves="3"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 -.18"/></filter>`, `
        <rect width="300" height="300" fill="#c8c0b0"/>
        <rect x="8" y="10" width="284" height="244" fill="#6b5034"/>
        <rect x="14" y="14" width="272" height="232" fill="url(#${k}-slate)"/>
        <rect x="14" y="14" width="272" height="232" filter="url(#${k}-dust)" opacity=".5"/>
        <g filter="url(#${k}-chalk)">
          <g stroke="#eef4ee" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".88">
            <path d="M40 70 H90 L100 55 L110 85 L120 55 L130 85 L140 70 H180"/>
            <rect x="190" y="58" width="24" height="24"/><path d="M180 70 H190 M214 70 H250 V140 H40 V70"/>
            <path d="M196 76 L208 64" stroke-width="1.5"/>
            <circle cx="60" cy="170" r="5"/><circle cx="100" cy="170" r="5"/><circle cx="140" cy="170" r="5"/>
            <circle cx="60" cy="200" r="5"/><circle cx="100" cy="200" r="5"/><circle cx="140" cy="200" r="5"/>
            <circle cx="60" cy="230" r="5"/><circle cx="100" cy="230" r="5"/><circle cx="140" cy="230" r="5"/>
            <path d="M60 170 L100 200 L140 170 L140 200 L140 230" stroke-width="3"/>
            <circle cx="60" cy="170" r="9" stroke-width="1.5"/>
          </g>
          <text x="190" y="205" font-size="16" fill="#eef4ee" opacity=".85" font-family="'Comic Sans MS','Nanum Pen Script',sans-serif">Li-ion</text>
          <text x="190" y="225" font-size="13" fill="#eef4ee" opacity=".75" font-family="sans-serif">3.7V · ${en ? "short↑" : "단락↑"}</text>
          <text x="70" y="114" font-size="11" fill="#f0e0a0" opacity=".7" font-family="sans-serif">R</text><text x="196" y="100" font-size="11" fill="#f0e0a0" opacity=".7" font-family="sans-serif">SW</text>
        </g>
        <path d="M30 40 Q90 30 150 44" stroke="#fff" stroke-width="16" opacity=".05" fill="none" filter="url(#${k}-soft)"/>
        <rect x="4" y="252" width="292" height="10" fill="#5a4028"/><rect x="4" y="252" width="292" height="3" fill="#7a5a3a"/>
        <rect x="40" y="248" width="18" height="5" rx="2" fill="#f4f4ec"/><rect x="66" y="249" width="10" height="4" rx="2" fill="#f4e6a0"/>
        <rect x="220" y="246" width="34" height="8" rx="1" fill="#3a3a3a"/><rect x="220" y="246" width="34" height="3" fill="#6a5a4a"/>
        <rect y="262" width="300" height="38" fill="#b0a898"/>`, { vig: .4, grain: .14, blur: 3 });
    }
  };
})();

/* 앱 아이콘 (이모지 대신 직접 그린 그림 → 어느 폰에서나 똑같이 보여요) */
window.ICONS = (function () {
  const svg = (inner) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  return {
    messenger: svg(`<path d="M24 10C15.2 10 8 15.6 8 22.6c0 4.5 3 8.4 7.4 10.6l-1.6 5.6 6.4-4.1c1.2.2 2.5.3 3.8.3 8.8 0 16-5.6 16-12.4S32.8 10 24 10Z" fill="#3a1d1d"/>`),
    calls: svg(`<path d="M17.5 10.5c-.9-1-2.4-1.1-3.4-.2l-3 2.7c-1.4 1.3-1.9 3.3-1.2 5.1 3.6 9.3 10.6 16.3 19.9 19.9 1.8.7 3.8.2 5.1-1.2l2.7-3c.9-1 .8-2.5-.2-3.4l-4.5-3.8c-.9-.8-2.3-.8-3.2 0l-2.6 2.3c-4.1-2-7.4-5.3-9.4-9.4l2.3-2.6c.8-.9.8-2.3 0-3.2Z" fill="#fff"/>`),
    card: svg(`<rect x="7" y="13" width="34" height="23" rx="4" fill="#fff"/><rect x="7" y="18" width="34" height="5" fill="#0b5a50"/><rect x="11" y="28" width="9" height="3" rx="1.5" fill="#0b5a50" opacity=".5"/>`),
    mail: svg(`<rect x="8" y="13" width="32" height="23" rx="4" fill="#fff"/><path d="M9.5 15.5 24 26l14.5-10.5" stroke="#1f64d6" stroke-width="2.6"/>`),
    photos: svg(`${[["#ff9f0a", 0], ["#ffd60a", 45], ["#34c759", 90], ["#30b0c7", 135], ["#007aff", 180], ["#af52de", 225], ["#ff2d55", 270], ["#ff6a3a", 315]].map(([c, a]) =>
      `<ellipse cx="24" cy="15" rx="5.2" ry="9" fill="${c}" opacity=".88" transform="rotate(${a} 24 24)"/>`).join("")}`),
    search: svg(`<circle cx="21" cy="21" r="10" stroke="#fff" stroke-width="4"/><path d="m28.5 28.5 9 9" stroke="#fff" stroke-width="5"/>`),
    sns: svg(`<rect x="10" y="10" width="28" height="28" rx="9" stroke="#fff" stroke-width="3.2"/><circle cx="24" cy="24" r="6.6" stroke="#fff" stroke-width="3.2"/><circle cx="32.2" cy="15.8" r="2" fill="#fff"/>`),
    notes: svg(`<path d="M14 8h17l5 5v27H14Z" fill="#fff"/><path d="M31 8v5h5" fill="#ffd9a0"/><path d="M18 20h13M18 26h13M18 32h8" stroke="#c46a00" stroke-width="2.4"/><circle cx="14" cy="11" r="4" fill="#ff3b30"/>`),
    memo: svg(`<rect x="10" y="8" width="28" height="32" rx="4" fill="#fff"/><rect x="10" y="8" width="28" height="8" rx="4" fill="#ffd60a"/><rect x="10" y="12" width="28" height="4" fill="#ffd60a"/><path d="M15 23h18M15 29h18M15 35h11" stroke="#c9c2a8" stroke-width="2"/>`),
    settings: svg(`<g fill="#e8e8ec">${Array.from({ length: 8 }, (_, i) => `<rect x="21.5" y="7" width="5" height="9" rx="1.5" transform="rotate(${i * 45} 24 24)"/>`).join("")}</g>
      <circle cx="24" cy="24" r="11" fill="#e8e8ec"/><circle cx="24" cy="24" r="5.5" fill="#6e6e76"/>`),
    /* 상태 표시줄 */
    signal: `<svg viewBox="0 0 18 12" width="17" height="11"><g fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></g></svg>`,
    wifi: `<svg viewBox="0 0 16 12" width="15" height="11"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1.5 4.4a9.4 9.4 0 0 1 13 0"/><path d="M4 7a5.8 5.8 0 0 1 8 0"/></g><circle cx="8" cy="10" r="1.5" fill="currentColor"/></svg>`,
    battery: (pct) => `<svg viewBox="0 0 27 13" width="25" height="12"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="${Math.max(2, 20 * pct)}" height="9" rx="2" fill="currentColor"/><path d="M25 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2Z" fill="currentColor" opacity=".45"/></svg>`
  };
})();

/* 나레이션 장면 뒤에 깔리는 배경 그림. 장면 글에 나오는 낱말(해변, 강의실, 버스…)과
   그 시각(아침·낮·노을·밤)을 보고 고르며, 글이 잘 읽히도록 흐리고 어둡게 깔아요. */
window.SCENES = (function () {
  const sv = (inner) => `<svg viewBox="0 0 300 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs><filter id="sc-b"><feGaussianBlur stdDeviation="10"/></filter><filter id="sc-s"><feGaussianBlur stdDeviation="3"/></filter></defs>${inner}</svg>`;
  /* 시간대별 하늘 */
  const SKY = { dawn: ["#2a3358", "#c78a8a", "#f2c39a"], day: ["#4f8fd0", "#9cc4e8", "#dfeef8"], dusk: ["#241c4a", "#c0505a", "#f6a35a"], night: ["#05070f", "#0c1428", "#1a2440"] };
  const sky = (t, x, y, w, h) => { const c = SKY[t]; return `<defs><linearGradient id="sk-${t}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".6" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient></defs>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#sk-${t})"/>`; };
  const glow = (x, y, r, c, o = .6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${o}" filter="url(#sc-b)"/>`;

  const B = {
    /* 내 방: 창밖 하늘 + 침대, 밤엔 스탠드 불빛 */
    room: (t) => sv(`<rect width="300" height="600" fill="#14121a"/>
      <rect x="40" y="90" width="190" height="230" fill="#000"/>${sky(t, 46, 96, 178, 218)}
      ${t === "night" ? glow(180, 150, 6, "#e8eeff", .9) : ""}
      <path d="M135 90 V320 M40 205 H230" stroke="#1e1a24" stroke-width="8"/>
      <rect x="0" y="420" width="300" height="180" fill="#201a22"/><rect x="0" y="380" width="230" height="70" rx="10" fill="#3a3040"/>
      <rect x="10" y="360" width="70" height="30" rx="12" fill="#5a4a5a"/>
      ${t === "night" || t === "dawn" ? glow(262, 330, 60, "#ffb050", .55) + `<path d="M248 320 h28 l-6 -26 h-16z" fill="#c08040"/>` : glow(135, 300, 120, "#fff2d8", .25)}`),
    /* 바다정(횟집): 따뜻한 조명, 수족관의 푸른 빛 */
    restaurant: () => sv(`<rect width="300" height="600" fill="#1c140e"/>
      ${[60, 150, 240].map((x) => `<path d="M${x} 0 V120" stroke="#3a2a1a" stroke-width="2"/>${glow(x, 140, 40, "#ffb35a", .7)}<path d="M${x - 18} 132 h36 l-8 -16 h-20z" fill="#7a4a20"/>`).join("")}
      <rect x="10" y="250" width="140" height="160" rx="6" fill="#0a3a52"/>${glow(80, 330, 80, "#3ab0e0", .5)}
      <g fill="#9ad8f0" opacity=".6"><ellipse cx="60" cy="310" rx="12" ry="4"/><ellipse cx="110" cy="350" rx="10" ry="3.5"/><circle cx="40" cy="280" r="2"/><circle cx="130" cy="300" r="2"/></g>
      <rect x="0" y="430" width="300" height="170" fill="#2a1c12"/><rect x="0" y="420" width="300" height="16" fill="#5a3a20"/>
      <rect x="180" y="260" width="100" height="150" fill="#3a2418"/><rect x="190" y="270" width="80" height="60" fill="#e8d0a0" opacity=".25"/>`),
    /* 퇴근길 버스 창문: 밤거리 불빛이 번져요 */
    bus: () => sv(`<rect width="300" height="600" fill="#08080e"/>
      <rect x="20" y="120" width="260" height="300" rx="18" fill="#0e1424"/>
      ${[[60, 200, "#ffb050"], [140, 260, "#ff5a5a"], [220, 210, "#5ab0ff"], [90, 330, "#ffd080"], [250, 320, "#ffb050"], [180, 360, "#a0ffb0"]].map(([x, y, c]) => glow(x, y, 26, c, .6)).join("")}
      <g stroke="#ffd8a0" stroke-width="3" opacity=".35" filter="url(#sc-s)"><path d="M30 290 H270 M30 300 H200"/></g>
      <rect x="20" y="120" width="260" height="300" rx="18" fill="none" stroke="#2a2a34" stroke-width="10"/>
      <rect x="0" y="440" width="300" height="160" fill="#14141c"/><rect x="30" y="460" width="110" height="140" rx="16" fill="#26324a"/><rect x="160" y="460" width="110" height="140" rx="16" fill="#26324a"/>`),
    /* 강의실: 칠판과 책상, 창으로 드는 빛 */
    classroom: (t) => sv(`<rect width="300" height="600" fill="#2a2a28"/>
      <rect x="20" y="110" width="260" height="140" fill="#22402e"/><rect x="20" y="246" width="260" height="8" fill="#5a4630"/>
      <g stroke="#e8f0e8" stroke-width="2" opacity=".35" fill="none"><path d="M50 150 H140 L150 135 L160 165 L170 150 H240"/><path d="M60 200 h80 M60 215 h50"/></g>
      ${glow(290, 200, 90, t === "night" ? "#304060" : "#fff0c8", .4)}
      ${[330, 400, 470, 540].map((y, i) => `<rect x="${20 - i * 10}" y="${y}" width="${260 + i * 20}" height="16" rx="3" fill="#5a4a38"/><rect x="${40 - i * 10}" y="${y + 16}" width="6" height="40" fill="#3a3028"/><rect x="${254 + i * 10}" y="${y + 16}" width="6" height="40" fill="#3a3028"/>`).join("")}`),
    /* 갯벌 해변: 하늘은 시각에 따라 */
    beach: (t) => sv(`${sky(t, 0, 0, 300, 340)}
      ${t === "dusk" ? glow(150, 330, 60, "#ffd080", .9) : t === "night" ? glow(220, 120, 14, "#e8eeff", .9) : t === "day" ? glow(230, 90, 30, "#fffbe8", .9) : glow(150, 330, 50, "#ffc0a0", .7)}
      <rect y="330" width="300" height="70" fill="${t === "night" ? "#0a1222" : t === "day" ? "#5a8ab0" : "#4a3a5a"}"/>
      <path d="M0 400 Q80 390 160 398 T300 394 V600 H0Z" fill="${t === "night" ? "#0c0e16" : t === "day" ? "#8a7a62" : "#3a2a30"}"/>
      <path d="M0 440 Q100 430 200 442 T300 436" stroke="#fff" stroke-width="2" opacity=".18" fill="none"/>
      <path d="M0 500 Q120 486 300 504 V600 H0Z" fill="#000" opacity=".25"/>`),
    /* 거실: 텔레비전의 푸른 빛과 소파 */
    tv: () => sv(`<rect width="300" height="600" fill="#0a0c12"/>
      ${glow(150, 230, 120, "#4a7ad8", .55)}<rect x="70" y="170" width="160" height="100" rx="4" fill="#9ab8f0" opacity=".85"/><rect x="70" y="170" width="160" height="100" rx="4" fill="none" stroke="#111" stroke-width="6"/>
      <rect x="100" y="274" width="100" height="8" fill="#16161c"/>
      <rect x="10" y="420" width="280" height="110" rx="24" fill="#1c2030"/><rect x="20" y="380" width="260" height="60" rx="20" fill="#232838"/>
      <path d="M30 430 Q150 410 270 430" stroke="#6a8ad0" stroke-width="2" opacity=".25" fill="none"/>`),
    /* 경찰·구급차: 밤의 빨강·파랑 불빛 */
    police: () => sv(`<rect width="300" height="600" fill="#06060a"/>
      ${glow(80, 260, 90, "#ff2a3a", .55)}${glow(220, 280, 90, "#2a6aff", .55)}
      <rect x="30" y="100" width="240" height="320" fill="#121218"/>
      ${[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => `<rect x="${55 + c * 70}" y="${130 + r * 72}" width="44" height="40" fill="${(r + c) % 3 ? "#1a1a24" : "#5a4a30"}"/>`).join("")).join("")}
      <rect y="420" width="300" height="180" fill="#0c0c10"/>${glow(150, 470, 40, "#ffffff", .2)}`),
    /* 병원 복도 */
    hospital: () => sv(`<rect width="300" height="600" fill="#2a343c"/>
      <path d="M0 0 L110 220 V380 L0 600Z" fill="#1e262e"/><path d="M300 0 L190 220 V380 L300 600Z" fill="#1e262e"/>
      <rect x="110" y="220" width="80" height="160" fill="#4a5a66"/><path d="M0 600 L110 380 H190 L300 600Z" fill="#161c22"/>
      ${[40, 120, 180].map((y, i) => `<rect x="${150 - 50 + i * 15}" y="${y}" width="${100 - i * 30}" height="6" fill="#d8f0ff" opacity=".8"/>`).join("")}${glow(150, 110, 70, "#c8e8ff", .35)}
      <rect x="20" y="300" width="40" height="120" fill="#3a4a3a" opacity=".6"/>${glow(40, 280, 10, "#6aff9a", .7)}`),
    /* 현관문 */
    door: () => sv(`<rect width="300" height="600" fill="#16141a"/>
      <rect x="80" y="90" width="140" height="380" fill="#3a2e28"/><rect x="88" y="98" width="124" height="364" fill="#4a3a30"/>
      <rect x="190" y="280" width="16" height="6" rx="3" fill="#c8b080"/>${glow(150, 60, 70, "#ffd8a0", .45)}
      <rect y="470" width="300" height="130" fill="#24201e"/><g fill="#0e0e12"><rect x="60" y="500" width="40" height="14" rx="6"/><rect x="110" y="506" width="40" height="14" rx="6"/></g>`)
  };

  /* 글에 나오는 낱말 → 장소 (앞에 있을수록 먼저 고름) */
  const PLACES = [
    ["hospital", /병원|응급실|의사|hospital|doctor|\bER\b/i],
    ["police", /구급|사이렌|paramedic|siren|ambulance/i],
    ["beach", /해변|갯벌|바닷가|방파제|beach|mudflat|shore|seawall/i],
    ["restaurant", /바다정|식당|횟집|가게|마감|badajeong|restaurant|shop|closing/i],
    ["bus", /버스|퇴근길|\bbus\b/i],
    ["room", /침대|in bed|my bed/i],
    ["classroom", /강의실|학교|수업|칠판|classroom|lecture|campus|chalkboard|blackboard|\bclass\b|lecture hall/i],
    ["tv", /텔레비전|티비|소파|tv\b|television|sofa|couch/i],
    ["door", /현관|front door|doorway/i]
  ];
  const tod = (h) => (h >= 5 && h < 8 ? "dawn" : h >= 8 && h < 17 ? "day" : h >= 17 && h < 20 ? "dusk" : "night");
  const place = (text) => { const hit = PLACES.find(([, re]) => re.test(text)); return hit ? hit[0] : "room"; };
  return {
    place,
    pick(text, ts) { return B[place(text)](tod(ts ? new Date(ts).getHours() : 22)); }
  };
})();
