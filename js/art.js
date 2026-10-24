/* 사진첩용 임시 그림 (SVG). 나중에 AI 생성 이미지로 바꿀 자리예요.
   이미지 파일을 쓰려면 story.js 사진 항목에 img: "images/파일이름.jpg" 를 넣으면 됩니다. */
window.ART = (function () {
  const wrap = (bg, inner) =>
    `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">${bg}${inner}</svg>`;

  const sunsetBg = `
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2b2d5c"/><stop offset=".45" stop-color="#e06a4e"/><stop offset=".62" stop-color="#f6b56b"/>
    </linearGradient></defs>
    <rect width="300" height="300" fill="url(#sky)"/>
    <circle cx="150" cy="182" r="26" fill="#ffd9a0" opacity=".9"/>
    <rect y="186" width="300" height="114" fill="#3a3550"/>
    <path d="M0 200 Q75 194 150 200 T300 200 V300 H0Z" fill="#2c2840"/>
    <path d="M0 236 Q90 228 180 238 T300 232 V300 H0Z" fill="#1f1c2e"/>`;

  const person = (x, y, s, fill, shirt) => `
    <g transform="translate(${x} ${y}) scale(${s})">
      <circle cx="0" cy="-58" r="11" fill="${fill}"/>
      <path d="M-16 -44 Q0 -50 16 -44 L20 0 H-20Z" fill="${shirt || fill}"/>
      <rect x="-14" y="0" width="11" height="34" fill="${fill}"/><rect x="3" y="0" width="11" height="34" fill="${fill}"/>
    </g>`;

  const flowers = `<pattern id="fl" width="10" height="10" patternUnits="userSpaceOnUse">
      <rect width="10" height="10" fill="#1a1626"/><circle cx="5" cy="5" r="2.2" fill="#7a3b4a"/></pattern>`;

  return {
    sunsetTwo: () => wrap(sunsetBg, `<defs>${flowers}</defs>
      ${person(122, 262, 1, "#15121f", "url(#fl)")}${person(176, 262, 1.04, "#15121f")}`),
    sunsetTable: () => wrap(sunsetBg, `
      <rect x="90" y="236" width="120" height="8" fill="#15121f"/>
      <rect x="98" y="244" width="6" height="30" fill="#15121f"/><rect x="196" y="244" width="6" height="30" fill="#15121f"/>
      <ellipse cx="125" cy="233" rx="14" ry="4" fill="#15121f"/><ellipse cx="175" cy="233" rx="14" ry="4" fill="#15121f"/>
      <rect x="146" y="218" width="6" height="16" fill="#15121f"/>
      <rect x="70" y="240" width="14" height="34" fill="#15121f"/><rect x="216" y="240" width="14" height="34" fill="#15121f"/>`),
    cake: () => wrap(`<rect width="300" height="300" fill="#2a1f1a"/>`, `
      <circle cx="150" cy="120" r="90" fill="#ffb347" opacity=".12"/>
      <rect x="85" y="160" width="130" height="70" rx="8" fill="#f4e1d2"/>
      <rect x="85" y="160" width="130" height="18" rx="8" fill="#e8a0b4"/>
      <rect x="100" y="125" width="6" height="35" fill="#9fd3f5"/><rect x="147" y="120" width="6" height="40" fill="#f5e29f"/><rect x="194" y="125" width="6" height="35" fill="#b9f59f"/>
      <ellipse cx="103" cy="118" rx="4" ry="8" fill="#ffcf5a"/><ellipse cx="150" cy="113" rx="4" ry="8" fill="#ffcf5a"/><ellipse cx="197" cy="118" rx="4" ry="8" fill="#ffcf5a"/>
      <rect x="60" y="230" width="180" height="10" rx="5" fill="#5a4136"/>`),
    restaurant: () => wrap(`<rect width="300" height="300" fill="#1f2a30"/>`, `
      <rect x="0" y="0" width="300" height="70" fill="#2c3b44"/>
      <text x="150" y="48" font-size="28" text-anchor="middle" fill="#e9d8a6" font-family="serif">바다정</text>
      <rect x="0" y="230" width="300" height="70" fill="#141c20"/>
      <defs>${flowers}</defs>
      ${person(90, 262, 1.15, "#0d1215", "url(#fl)")}${person(150, 262, 1.05, "#0d1215", "#2f4a5a")}${person(210, 262, 1, "#0d1215", "#4a3a2f")}`),
    family: () => wrap(`<rect width="300" height="300" fill="#8fc1e3"/>`, `
      <rect y="200" width="300" height="100" fill="#7bb36a"/>
      <circle cx="240" cy="60" r="24" fill="#fff3b0"/>
      ${person(100, 262, 1.05, "#3a3a3a", "#c96d6d")}${person(150, 262, 1, "#3a3a3a", "#6d8ec9")}${person(200, 262, 1.1, "#3a3a3a", "#6da36a")}`),
    heeju: () => wrap(`<rect width="300" height="300" fill="#f2d7d0"/>`, `
      <circle cx="150" cy="120" r="44" fill="#3b2a2a"/>
      <path d="M95 300 Q100 190 150 186 Q200 190 205 300Z" fill="#c9a0a0"/>
      <path d="M104 118 Q106 60 150 62 Q196 60 198 120 Q200 190 186 210 L114 210 Q100 190 104 118Z" fill="#2a1d1d"/>
      <circle cx="150" cy="128" r="36" fill="#e8c3b0"/>`),
    board: () => wrap(`<rect width="300" height="300" fill="#22392f"/>`, `
      <rect x="14" y="14" width="272" height="230" fill="#2f4d3f" stroke="#6b5a3a" stroke-width="8"/>
      <g stroke="#e8efe8" stroke-width="2" fill="none" opacity=".85">
        <path d="M40 70 H90 L100 55 L110 85 L120 55 L130 85 L140 70 H180"/>
        <rect x="190" y="58" width="24" height="24"/><path d="M180 70 H190 M214 70 H250 V140 H40 V70"/>
        <circle cx="70" cy="190" r="6"/><circle cx="110" cy="190" r="6"/><circle cx="150" cy="190" r="6"/>
        <circle cx="70" cy="220" r="6"/><circle cx="110" cy="220" r="6"/><circle cx="150" cy="220" r="6"/>
        <path d="M70 190 L110 220 L150 190 L150 220"/>
      </g>
      <text x="190" y="205" font-size="16" fill="#e8efe8" opacity=".8" font-family="sans-serif">Li-ion</text>
      <text x="190" y="225" font-size="13" fill="#e8efe8" opacity=".7" font-family="sans-serif">3.7V · 단락↑</text>`)
  };
})();
