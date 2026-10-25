/* ==========================================================
   GALIAN – intro animée
   La moto (img/moto-hero.png) traverse la bannière, phare allumé,
   et la fumée de ses échappements dessine « GALIAN » derrière elle.
   ========================================================== */
(() => {
  const hero = document.querySelector('.hero');
  const canvas = document.getElementById('hero3d');
  const logo = hero.querySelector('.hero-logo');
  const fail = () => hero.classList.add('no-webgl');
  if (!window.THREE) return fail();

  /* à chaque arrivée ou refresh : retour en haut de page et l'intro rejoue depuis le début */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) scrollTo(0, 0);

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); } catch (e) { return fail(); }

  const T = THREE;
  const DBG = parseFloat(new URLSearchParams(location.search).get('t'));   // ?t=2.5 : avance l'animation jusqu'à 2,5 s (test)
  const TEXT = 'galian';
  const FOV = 35;
  const BIKE_SRC = 'img/moto-hero.png';
  const IMG_W = 612, IMG_H = 408, TIRE_BOTTOM = 364;       // dimensions de l'image et ligne du sol (px)
  const SC = 3.0 / IMG_W;                                  // 3 unités de large dans la scène
  const px = (x, y) => V(0, 0, 0).set((x - IMG_W / 2) * SC, (IMG_H / 2 - y) * SC + (TIRE_BOTTOM - IMG_H / 2) * SC, 0);
  function V(x, y, z) { return new T.Vector3(x, y, z); }

  renderer.setClearColor(0x000000, 1);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(FOV, 1, 0.1, 80);

  const canvasTex = (w, h, draw) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const tx = new T.CanvasTexture(c); return tx;
  };
  const basic = (tex, o = {}) => new T.MeshBasicMaterial(Object.assign({ map: tex, transparent: true, depthWrite: false }, o));

  /* ---------- la moto (groupe qui avance) ---------- */
  const bike = new T.Group(); scene.add(bike);
  let bikeSprite;

  function buildBike(img) {
    const tex = new T.Texture(img); tex.anisotropy = 8; tex.needsUpdate = true;
    const W = IMG_W * SC, H = IMG_H * SC, cy = px(IMG_W / 2, IMG_H / 2).y;

    /* halo + contour lumineux derrière la moto : détache la silhouette noire du fond noir */
    const halo = new T.Mesh(new T.PlaneGeometry(6.2, 3.8), basic(canvasTex(256, 160, (g, w, h) => {
      g.scale(1, h / w); const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      gr.addColorStop(0, 'rgba(255,255,255,.26)'); gr.addColorStop(.5, 'rgba(255,255,255,.08)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, w);
    })));
    halo.position.set(0, cy + 0.15, -0.3); bike.add(halo);

    const pad = 70, small = document.createElement('canvas'); small.width = (IMG_W + pad * 2) / 6; small.height = (IMG_H + pad * 2) / 6;
    const big = document.createElement('canvas'); big.width = IMG_W + pad * 2; big.height = IMG_H + pad * 2;
    const bg = big.getContext('2d'); bg.drawImage(img, pad, pad); bg.globalCompositeOperation = 'source-in'; bg.fillStyle = '#fff'; bg.fillRect(0, 0, big.width, big.height);
    const sg = small.getContext('2d'); sg.imageSmoothingQuality = 'high'; sg.drawImage(big, 0, 0, small.width, small.height);
    const glowTex = new T.CanvasTexture(small);
    const glow = new T.Mesh(new T.PlaneGeometry((IMG_W + pad * 2) * SC, (IMG_H + pad * 2) * SC), basic(glowTex, { opacity: 0.55 }));
    glow.position.set(0, cy, -0.2); bike.add(glow);

    bikeSprite = new T.Mesh(new T.PlaneGeometry(W, H), basic(tex, { depthWrite: true }));
    bikeSprite.position.set(0, cy, 0); bike.add(bikeSprite);

    /* reflet du phare */
    const lamp = px(460, 115);
    const flare = new T.Mesh(new T.PlaneGeometry(0.9, 0.9), basic(canvasTex(64, 64, (g, w) => {
      const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,245,220,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, w);
    }), { blending: T.AdditiveBlending }));
    flare.position.set(lamp.x + 0.06, lamp.y, 0.05); bike.add(flare);

    /* ombre sous les roues */
    const shadow = new T.Mesh(new T.PlaneGeometry(3.6, 0.36), basic(canvasTex(128, 16, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,.2)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.save(); g.scale(1, h / w); g.fillStyle = gr; g.fillRect(0, 0, w, w); g.restore();
    })));
    shadow.position.set(0, 0.01, -0.05); bike.add(shadow);

  }

  /* ---------- particules de fumée ---------- */
  function softTexture() {
    return canvasTex(64, 64, g => {
      const blob = (x, y, r, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); };
      blob(32, 32, 30, 0.75); blob(24, 28, 16, 0.35); blob(40, 38, 15, 0.3);
    });
  }
  const makeMat = tex => new T.ShaderMaterial({
    uniforms: { map: { value: tex }, scale: { value: 600 } },
    vertexShader: `attribute float aSize; attribute float aAlpha; varying float vA; uniform float scale;
      void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = aSize * scale / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D map; varying float vA;
      void main(){ float a = texture2D(map, gl_PointCoord).a * vA; gl_FragColor = vec4(vec3(0.93,0.94,0.96), a); }`,
    transparent: true, depthWrite: false
  });
  const smokeMat = makeMat(softTexture());
  /* grain net pour les lettres : bord franc, pour un texte lisible */
  const crispTex = canvasTex(32, 32, g => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.55, "rgba(255,255,255,.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
  const textMat = makeMat(crispTex);
  function makePoints(n, mat = smokeMat) {
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('aSize', new T.BufferAttribute(new Float32Array(n), 1));
    geo.setAttribute('aAlpha', new T.BufferAttribute(new Float32Array(n), 1));
    const p = new T.Points(geo, mat); p.frustumCulled = false; p.renderOrder = 5; scene.add(p); return p;
  }

  /* échantillonnage du texte « GALIAN » */
  const TW_MAX = 5.6;            // largeur max du texte dans le monde
  const TEXT_Y = 2.65;
  let tp = null, N = 0;
  const S = {};
  function buildText() {
    const cv = document.createElement('canvas'); cv.width = 1400; cv.height = 560;
    const g = cv.getContext('2d');
    const family = '"Alte Schwabacher", "Uncial Antiqua", serif';
    g.font = `200px ${family}`;
    const k = 1150 / g.measureText(TEXT).width;
    g.font = `${200 * k}px ${family}`;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
    g.fillText(TEXT, 700, 280);
    const data = g.getImageData(0, 0, cv.width, cv.height).data;
    let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
    for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (data[(y * cv.width + x) * 4 + 3] > 128) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const W = x1 - x0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const step = 3, pts = [];
    for (let y = y0; y <= y1; y += step) for (let x = x0; x <= x1; x += step) {
      if (data[((y | 0) * cv.width + (x | 0)) * 4 + 3] > 128) pts.push([(x - cx) / W + (Math.random() - .5) * step / W, -(y - cy) / W + (Math.random() - .5) * step / W]);
    }
    N = pts.length;
    S.u = new Float32Array(N); S.v = new Float32Array(N); S.t0 = new Float32Array(N).fill(-1);
    S.seed = new Float32Array(N); S.dur = new Float32Array(N); S.z = new Float32Array(N);
    S.sx = new Float32Array(N); S.sy = new Float32Array(N); S.sz = new Float32Array(N);
    S.vx = new Float32Array(N); S.vy = new Float32Array(N); S.vz = new Float32Array(N);
    pts.forEach((p, i) => { S.u[i] = p[0]; S.v[i] = p[1]; S.seed[i] = Math.random(); S.dur[i] = 1.4 + Math.random() * 1.0; S.z[i] = (Math.random() - .5) * 0.25;
      const r = 0.6 + Math.random();                         // vitesse d'explosion : du centre du mot vers l'extérieur
      S.vx[i] = (p[0] * 4 + (Math.random() - .5) * 1.6) * r; S.vy[i] = (p[1] * 9 + (Math.random() - .5) * 1.6) * r; S.vz[i] = (Math.random() * 2.2) * r; });
    tp = makePoints(N, textMat);
  }

  /* fumée d'échappement continue */
  const M = 2400;
  const pp = makePoints(M);
  const P = { life: new Float32Array(M), age: new Float32Array(M).fill(99), vel: new Float32Array(M * 3), s0: new Float32Array(M), next: 0 };
  const PIPES = [px(92, 272), px(98, 297)];            // sorties des deux échappements sur l'image

  /* ---------- cadrage, taille ---------- */
  let dist = 7.4, visW = 10, textW = TW_MAX, startX = -9, endX = 9;
  function resize() {
    const w = hero.clientWidth, h = hero.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    const aspect = w / h; camera.aspect = aspect;
    dist = Math.max(7.4, 7.2 / (2 * Math.tan(FOV * Math.PI / 360) * aspect));
    visW = 2 * Math.tan(FOV * Math.PI / 360) * dist * aspect;
    textW = Math.min(TW_MAX, visW * 0.8);
    startX = -visW / 2 - 3; endX = visW / 2 + 3;
    camera.updateProjectionMatrix();
    camera.position.set(0, 1.25, dist); camera.lookAt(0, 1.7, 0); camera.updateMatrixWorld();
    /* logo : plus de 2 fois plus grand que le texte de fumée, centré dans la zone libre de la bannière */
    const lw = Math.min(textW / visW * 2.2 * w, h * 0.72 * 879 / 339, w * 0.98);
    logo.style.width = lw + 'px'; logo.style.top = '40%';
    smokeMat.uniforms.scale.value = textMat.uniforms.scale.value = (h * dpr) / (2 * Math.tan(FOV * Math.PI / 360));
  }
  addEventListener('resize', resize);

  /* ---------- boucle ---------- */
  const DURATION = 6.2;
  const EXPLODE = DURATION + 1.7;       // la moto est partie et le mot est formé : la fumée explose
  let t = 0, done = false, visible = true, last = performance.now();
  let mx = 0, my = 0, cmx = 0, cmy = 0, dbgDone = false;
  hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); mx = ((e.clientX - r.left) / r.width - .5) * 2; my = ((e.clientY - r.top) / r.height - .5) * 2; });
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(hero);

  function replay() {
    t = 0; done = false; hero.classList.remove('done', 'logo');
    if (tp) S.t0.fill(-1);
    P.age.fill(99);
  }
  canvas.addEventListener('click', () => { if (done) replay(); });
  addEventListener('pageshow', e => { if (e.persisted) replay(); });

  const ease = k => 1 - Math.pow(1 - k, 3);

  function update(dt, el) {
    t += dt;
    /* trajet de gauche à droite à vitesse constante */
    const bx = startX + (endX - startX) * (t / DURATION);
    bike.position.x = bx;
    bike.visible = bx < endX;
    bike.position.y = Math.sin(t * 15) * 0.004 + Math.sin(t * 6.1) * 0.005;
    bike.rotation.z = Math.sin(t * 4.3) * 0.004;

    /* caméra : léger travelling, parallaxe souris, vibration au passage */
    cmx += (mx - cmx) * 0.05; cmy += (my - cmy) * 0.05;
    const dolly = 1 - Math.pow(1 - Math.min(t / 7, 1), 3);
    const shake = Math.max(0, 1 - Math.abs(bx) / 3) * 0.012;
    camera.position.set(-1.4 * (1 - dolly) + cmx * 0.6 + Math.sin(el * 70) * shake, 1.25 - cmy * 0.2 + Math.cos(el * 63) * shake, dist);
    camera.lookAt(0, 1.7, 0);

    const exX = bx + PIPES[0].x, exY = PIPES[0].y, exZ = 0.1;
    const bt = Math.max(t - EXPLODE, 0);                                         // temps écoulé depuis l'explosion du texte de fumée
    const fade = Math.pow(Math.max(0, 1 - bt / 1.1), 2.2), burst = (1 - Math.exp(-bt * 2.2)) / 2.2;

    /* fumée dessinant GALIAN */
    const pos = tp.geometry.attributes.position, sz = tp.geometry.attributes.aSize, al = tp.geometry.attributes.aAlpha;
    for (let i = 0; i < N; i++) {
      const gx = S.u[i] * textW, gy = TEXT_Y + S.v[i] * textW, gz = S.z[i];
      /* la fumée de la traînée, déjà épaisse derrière la moto, est aspirée vers les lettres */
      if (S.t0[i] < 0 && exX >= gx + 1.4) {
        S.t0[i] = t; S.sx[i] = gx + (Math.random() - .5) * 0.7; S.sy[i] = exY + 0.05 + Math.random() * 0.4; S.sz[i] = exZ + (Math.random() - .5) * 0.2;
      }
      let x = 0, y = 0, z = 0, a = 0, s = 0.1;
      if (S.t0[i] >= 0) {
        const kk = Math.min(Math.max((t - S.t0[i]) / S.dur[i], 0), 1), e = ease(kk), sd = S.seed[i];
        const c = (1 - e) * e * 4 * 0.45;
        x = S.sx[i] + (gx - S.sx[i]) * e + Math.sin(sd * 40 + el * 1.3) * c;
        y = S.sy[i] + (gy - S.sy[i]) * e + Math.abs(Math.cos(sd * 23)) * c * 0.6;
        z = S.sz[i] + (gz - S.sz[i]) * e;
        if (kk >= 1) { x += Math.sin(el * .7 + sd * 50) * 0.004; y += Math.cos(el * .6 + sd * 31) * 0.004; }
        a = Math.min(kk * 3, 1) * (0.75 + Math.sin(el * 1.1 + sd * 20) * 0.05) * fade;
        s = 0.3 - 0.254 * e;
      }
      if (bt > 0) { x += S.vx[i] * burst; y += S.vy[i] * burst; z += S.vz[i] * burst; s *= 1 + bt * 1.1; }
      pos.setXYZ(i, x, y, z); sz.setX(i, s); al.setX(i, a);
    }
    pos.needsUpdate = sz.needsUpdate = al.needsUpdate = true;

    /* fumée d'échappement : dense, sortie des deux silencieux */
    if (bike.visible && bx > startX + 0.2) {
      PIPES.forEach(p => {
        const n = Math.round(200 * dt + Math.random());
        for (let j = 0; j < n; j++) {
          const i = P.next; P.next = (P.next + 1) % M;
          P.age[i] = 0; P.life[i] = 1.4 + Math.random() * 1.6; P.s0[i] = 0.14 + Math.random() * 0.1;
          pp.geometry.attributes.position.setXYZ(i, bx + p.x - 0.05, p.y + (Math.random() - .5) * 0.05, 0.1 + (Math.random() - .5) * 0.06);
          P.vel[i * 3] = -0.6 - Math.random() * 0.8; P.vel[i * 3 + 1] = 0.1 + Math.random() * 0.3; P.vel[i * 3 + 2] = (Math.random() - .5) * 0.35;
        }
      });
    }
    const pp3 = pp.geometry.attributes.position, ps = pp.geometry.attributes.aSize, pa = pp.geometry.attributes.aAlpha;
    for (let i = 0; i < M; i++) {
      if (P.age[i] >= P.life[i]) { pa.setX(i, 0); continue; }
      P.age[i] += dt; const kk = P.age[i] / P.life[i];
      P.vel[i * 3] *= 1 - dt * 1.4; P.vel[i * 3 + 1] += dt * 0.08;
      pp3.setXYZ(i, pp3.getX(i) + P.vel[i * 3] * dt, pp3.getY(i) + P.vel[i * 3 + 1] * dt, pp3.getZ(i) + P.vel[i * 3 + 2] * dt);
      ps.setX(i, P.s0[i] + kk * 0.75); pa.setX(i, 0.4 * Math.pow(1 - kk, 1.4));
    }
    pp3.needsUpdate = ps.needsUpdate = pa.needsUpdate = true;

    if (t > EXPLODE + 0.85) hero.classList.add('logo');             // l'explosion s'est fondue (opacité faible) : le logo arrive
    if (!done && t > EXPLODE + 3) { done = true; hero.classList.add('done'); }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || !tp || !bikeSprite) return;
    if (!isNaN(DBG)) {
      if (!dbgDone) { dbgDone = true; while (t < DBG) update(1 / 60, t); }
      update(0, t); renderer.render(scene, camera); return;
    }
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    update(dt, now / 1000);
    renderer.render(scene, camera);
  }

  function start(img) {
    buildBike(img); buildText(); resize();
    last = performance.now();
    requestAnimationFrame(frame);
  }
  const fonts = document.fonts && document.fonts.load ? Promise.race([document.fonts.load('200px "Alte Schwabacher"'), new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
  const image = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = window.BIKE_DATA || BIKE_SRC; });
  Promise.all([fonts.catch(() => {}), image]).then(([, img]) => start(img), fail);
})();
