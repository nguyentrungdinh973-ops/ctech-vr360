// =========================================================================
// FILE XỬ LÝ LOGIC TRUNG TÂM (app.js) - ĐỒNG BỘ 100% VỚI THƯ MỤC img/
// - Nạp thẳng img/anh360.jpg, img/anh360_2.jpg, img/Chi 1.png ngay lượt đầu (0 lỗi 404)
// - Tự động ẩn #webgl-stage khi mở #marzipano-frame để điện thoại mượt & không nóng máy
// - Đầy đủ số phòng P.101, P.102, P.103, P.105 (N03), P.106 (N04) & 10 nút gợi ý Chatbox
// =========================================================================

let currentLang = 'vi';
let currentSceneKey = 'overview';
let currentMarzipanoId = null;
let isSpeaking = true;
let hasStartedFromSplash = false;

const MARZIPANO_NAME_OVERRIDES = {
  '3-phng-cng-tc-tuyn-sinh': 'Phòng Công tác Học sinh - Sinh viên (Tòa N01)',
  '36-phng-thc-hnh-iu-dng': 'Phòng thực hành Điều dưỡng (P.101 - Tòa N03)',
  '37-phng-thc-hnh-sc-p-trang-im': 'Phòng thực hành Sắc đẹp - Trang điểm (P.102 - Tòa N03)',
  '38-phng-thc-hnh-sc-p-iu-tr-da-mt': 'Phòng thực hành Điều trị da mặt (P.103 - Tòa N03)',
  '39-phng-chng-by-ca-thit-k--ha': 'Phòng trưng bày Thiết kế đồ họa (P.105 - Tòa N03)',
  '47-phng-y-t-n04': 'Phòng Y tế (P.101 - Tòa N04)',
  '50-phng-thc-hnh-ch-bin': 'Phòng thực hành Chế biến món ăn (P.106 - Tòa N04)'
};

// -------------------------------------------------------------------------
// PHẦN 1: NẠP ẢNH CÔ GÁI TỪ img/Chi 1.png & TỰ ĐỘNG TÁCH NỀN ĐEN/TRẮNG
// -------------------------------------------------------------------------
(function loadStudentCutoutImage() {
  const candidateNames = [
    'img/chi-1.png',
    './img/chi-1.png',
    'chi-1.png',
    'img/Chi 1.png'
  ];
  let idx = 0;

  function tryLoadGirl() {
    if (idx >= candidateNames.length) return;
    const src = candidateNames[idx++];
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.getElementById('student-cutout-canvas');
      if (!canvas) return;
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        const bgR = d[0], bgG = d[1], bgB = d[2], bgA = d[3];
        const isLightBg = (bgR > 180 && bgG > 180 && bgB > 180);
        const isDarkBg  = (bgR < 45 && bgG < 45 && bgB < 45);

        if (bgA > 200 && (isLightBg || isDarkBg)) {
          const w = canvas.width, h = canvas.height;
          const visited = new Uint8Array(w * h);
          const queue = new Int32Array(w * h);
          let head = 0, tail = 0;

          function pushPixel(x, y) {
            const pos = y * w + x;
            if (!visited[pos]) {
              visited[pos] = 1;
              queue[tail++] = pos;
            }
          }

          for (let x = 0; x < w; x++) { pushPixel(x, 0); pushPixel(x, h - 1); }
          for (let y = 0; y < h; y++) { pushPixel(0, y); pushPixel(w - 1, y); }

          while (head < tail) {
            const pos = queue[head++];
            const i = pos * 4;
            const r = d[i], g = d[i + 1], b = d[i + 2];
            const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
            const isNeutralLight = isLightBg && (r > 195 && g > 195 && b > 195 && Math.abs(r - g) < 18 && Math.abs(g - b) < 18);
            const isNeutralDark  = isDarkBg && (r < 35 && g < 35 && b < 35 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15);

            if (diff < 65 || isNeutralLight || isNeutralDark) {
              d[i + 3] = 0;
              const x = pos % w;
              const y = (pos / w) | 0;
              if (x > 0) pushPixel(x - 1, y);
              if (x < w - 1) pushPixel(x + 1, y);
              if (y > 0) pushPixel(x, y - 1);
              if (y < h - 1) pushPixel(x, y + 1);
            } else if (diff < 95) {
              d[i + 3] = Math.round(((diff - 65) / 30) * 255);
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }
      } catch (e) {}
    };
    img.onerror = tryLoadGirl;
    img.src = src;
  }
  tryLoadGirl();
})();

// -------------------------------------------------------------------------
// PHẦN 1.5: KHỞI TẠO & ĐIỀU KHIỂN KHUNG 62 CẢNH MARZIPANO (NGẮT WEBGL-STAGE KHI MỞ)
// -------------------------------------------------------------------------
let marzipanoFrame = null;
let marzipanoReady = false;
let pendingMarzipanoSceneId = null;

function ensureMarzipanoIframe() {
  if (marzipanoFrame) return marzipanoFrame;

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    #marzipano-frame {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      border: none;
      z-index: 25;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 0.35s ease, visibility 0.35s ease;
      background: #032215;
    }
    #marzipano-frame.active {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }
    .sub-nav-btn.active-sub {
      color: #fde047 !important;
      font-weight: 700 !important;
      padding-left: 14px !important;
      background: rgba(250, 204, 21, 0.14) !important;
      border-left: 2px solid #facc15 !important;
    }
  `;
  document.head.appendChild(styleEl);

  marzipanoFrame = document.getElementById('marzipano-frame');
  if (!marzipanoFrame) {
    marzipanoFrame = document.createElement('iframe');
    marzipanoFrame.id = 'marzipano-frame';
    marzipanoFrame.setAttribute('allow', 'fullscreen');
    marzipanoFrame.src = 'app-files/index.html';
    const stageEl = document.getElementById('webgl-stage');
    if (stageEl && stageEl.parentNode) {
      stageEl.parentNode.insertBefore(marzipanoFrame, stageEl.nextSibling);
    } else {
      document.body.appendChild(marzipanoFrame);
    }
  } else if (marzipanoFrame.getAttribute('src') === 'marzipano/index.html') {
    marzipanoFrame.src = 'app-files/index.html';
  }

  marzipanoFrame.addEventListener('load', () => {
    try {
      const innerDoc = marzipanoFrame.contentDocument || marzipanoFrame.contentWindow?.document;
      if (!innerDoc) return;

      const hideStyle = innerDoc.createElement('style');
      hideStyle.textContent = `
        #titleBar, #sceneList, #sceneListToggle, #autorotateToggle, #fullscreenToggle, .viewControlButton {
          display: none !important;
        }
        .link-hotspot {
          width: 60px !important;
          height: 60px !important;
          margin-left: -30px !important;
          margin-top: -30px !important;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 2px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
          transition: all 0.3s ease;
        }
        .link-hotspot:hover {
          background: rgba(0, 140, 60, 0.65);
          border-color: #ffd700;
          transform: translateY(-5px) scale(1.12);
          box-shadow: 0 10px 25px rgba(0, 200, 83, 0.6);
        }
        .link-hotspot-icon {
          width: 100% !important;
          height: 100% !important;
          content: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='M30 62 L50 42 L70 62' fill='none' stroke='%23ffffff' stroke-width='8' stroke-linecap='round' stroke-linejoin='round'/><path d='M36 45 L50 31 L64 45' fill='none' stroke='%2300ff88' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/></svg>");
        }
      `;
      innerDoc.head.appendChild(hideStyle);

      const tooltipMap = {
        'phòng công tác tuyển sinh': 'Phòng Công tác Học sinh - Sinh viên',
        'phòng thực hành điều dưỡng': 'Phòng thực hành Điều dưỡng (P.101)',
        'phòng thực hành sắc đẹp trang điểm': 'Phòng thực hành Sắc đẹp - Trang điểm (P.102)',
        'phòng thực hành sắc đẹp điều trị da mặt': 'Phòng thực hành Điều trị da mặt (P.103)',
        'phòng chưng bầy của thiết kế đồ họa': 'Phòng trưng bày Thiết kế đồ họa (P.105)',
        'phòng y tế n04': 'Phòng Y tế (P.101 - N04)',
        'phòng thực hành chế biến': 'Phòng thực hành Chế biến món ăn (P.106)'
      };

      innerDoc.querySelectorAll('.link-hotspot-tooltip').forEach(tip => {
        const key = tip.textContent.trim().toLowerCase();
        if (tooltipMap[key]) {
          tip.textContent = tooltipMap[key];
        }
      });

      const titleNode = innerDoc.querySelector('#titleBar .sceneName');
      if (titleNode) {
        const observer = new MutationObserver(() => {
          let currentName = titleNode.textContent.trim();
          const currentActiveEl = innerDoc.querySelector('#sceneList .scene.current');
          if (currentActiveEl) {
            currentMarzipanoId = currentActiveEl.getAttribute('data-id');
            if (MARZIPANO_NAME_OVERRIDES[currentMarzipanoId]) {
              currentName = MARZIPANO_NAME_OVERRIDES[currentMarzipanoId];
            }
            highlightActiveSubItem();
          }
          if (currentName && marzipanoFrame.classList.contains('active')) {
            document.getElementById('scene-blue-badge').textContent = currentName + ' - Cao đẳng CTECH';
            document.getElementById('info-title').textContent = currentName;
          }
        });
        observer.observe(titleNode, { childList: true, characterData: true, subtree: true });
      }

      marzipanoReady = true;
      if (pendingMarzipanoSceneId) {
        triggerMarzipanoSceneInIframe(pendingMarzipanoSceneId);
        pendingMarzipanoSceneId = null;
      }
    } catch (err) {}
  });

  return marzipanoFrame;
}

function triggerMarzipanoSceneInIframe(sceneId) {
  const frame = ensureMarzipanoIframe();
  if (!marzipanoReady) {
    pendingMarzipanoSceneId = sceneId;
    return;
  }
  try {
    const innerDoc = frame.contentDocument || frame.contentWindow?.document;
    if (innerDoc) {
      const sceneLink = innerDoc.querySelector(`#sceneList .scene[data-id="${sceneId}"]`);
      if (sceneLink) {
        sceneLink.click();
        return;
      }
    }
    if (frame.contentWindow && typeof frame.contentWindow.switchMarzipanoById === 'function') {
      frame.contentWindow.switchMarzipanoById(sceneId);
    } else if (frame.contentWindow) {
      frame.contentWindow.postMessage({ type: 'GO_TO_SCENE', sceneId: sceneId }, '*');
    }
  } catch (e) {}
}

function openMarzipanoScene(marzipanoId, customTitle, customDesc) {
  const frame = ensureMarzipanoIframe();
  currentMarzipanoId = marzipanoId;

  isAnimatingCamera = false;
  if (infoPopupTimer) clearTimeout(infoPopupTimer);

  // ẨN HOÀN TOÀN #webgl-stage KHI MỞ #marzipano-frame ĐỂ ĐIỆN THOẠI MƯỢT GẤP ĐÔI & KHÔNG NÓNG MÁY
  const stageEl = document.getElementById('webgl-stage');
  if (stageEl) stageEl.style.display = 'none';

  frame.classList.add('active');
  document.getElementById('hotspots-3d-layer').classList.remove('visible');
  document.getElementById('bottom-center-walk').classList.add('visible');

  triggerMarzipanoSceneInIframe(marzipanoId);
  highlightActiveSubItem();

  const resolvedTitle = MARZIPANO_NAME_OVERRIDES[marzipanoId]
    ? MARZIPANO_NAME_OVERRIDES[marzipanoId] + ' - Cao đẳng CTECH'
    : customTitle;

  if (resolvedTitle) {
    document.getElementById('scene-blue-badge').textContent = resolvedTitle;
    document.getElementById('info-title').textContent = MARZIPANO_NAME_OVERRIDES[marzipanoId] || customTitle;
  }
  if (customDesc) {
    document.getElementById('info-desc').textContent = customDesc;
  }
}

function closeMarzipanoView() {
  currentMarzipanoId = null;
  if (marzipanoFrame) {
    marzipanoFrame.classList.remove('active');
  }
  // BẬT LẠI #webgl-stage KHI QUAY VỀ CẢNH TỔNG QUAN TRÊN CAO
  const stageEl = document.getElementById('webgl-stage');
  if (stageEl) {
    stageEl.style.display = 'block';
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.uAspect.value = window.innerWidth / window.innerHeight;
  }
  highlightActiveSubItem();
}

function highlightActiveSubItem() {
  document.querySelectorAll('.sub-nav-btn').forEach(btn => {
    btn.classList.toggle('active-sub', btn.getAttribute('data-marz-id') === currentMarzipanoId);
  });
}

// -------------------------------------------------------------------------
// PHẦN 2: KHỞI TẠO KHÔNG GIAN 360° WEBGL (THREE.JS SHADER CHO ẢNH FLYCAM)
// -------------------------------------------------------------------------
const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
const stage = document.getElementById('webgl-stage');

const renderer = new THREE.WebGLRenderer({
  antialias: !isMobileDevice,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileDevice ? 1.5 : 2.0));
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const uniforms = {
  uTexture:      { value: null },
  uAspect:       { value: window.innerWidth / window.innerHeight },
  uScale:        { value: 2.55 },
  uPlanetFactor: { value: 1.0 },
  uPitch:        { value: -1.5707 },
  uYaw:          { value: -1.85 }
};

const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    uniform float uAspect;
    uniform float uScale;
    uniform float uPlanetFactor;
    uniform float uPitch;
    uniform float uYaw;
    varying vec2 vUv;

    const float PI = 3.14159265359;

    void main() {
      vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0) * uScale;
      float r = length(p);
      float c = mix(atan(r), 2.0 * atan(r), uPlanetFactor);

      vec3 dir = vec3(0.0, 0.0, 1.0);
      if (r > 0.0001) {
        dir = vec3(p.x * sin(c) / r, p.y * sin(c) / r, cos(c));
      }

      float cp = cos(uPitch), sp = sin(uPitch);
      vec3 d1 = vec3(
        dir.x,
        dir.y * cp + dir.z * sp,
        -dir.y * sp + dir.z * cp
      );

      float cy = cos(uYaw), sy = sin(uYaw);
      vec3 worldDir = vec3(
        d1.x * cy + d1.z * sy,
        d1.y,
        -d1.x * sy + d1.z * cy
      );

      float lon = atan(worldDir.x, worldDir.z);
      float lat = asin(clamp(worldDir.y, -1.0, 1.0));

      vec2 eqUv = vec2(lon / (2.0 * PI) + 0.5, lat / PI + 0.5);
      gl_FragColor = texture2D(uTexture, eqUv);
    }
  `
});

scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

// -------------------------------------------------------------------------
// PHẦN 3: BỘ NẠP ẢNH PANORAMA TRÊN CAO TỪ THƯ MỤC img/ (img/anh360.jpg)
// -------------------------------------------------------------------------
const textureCache = {};
const pendingCallbacks = {};
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
let minimapThumbCreated = false;

function createMinimapThumbAsync(imgEl) {
  if (minimapThumbCreated) return;
  minimapThumbCreated = true;
  setTimeout(() => {
    try {
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 680;
      thumbCanvas.height = 410;
      const tCtx = thumbCanvas.getContext('2d');
      const sw = imgEl.naturalWidth || imgEl.width;
      const sh = imgEl.naturalHeight || imgEl.height;
      tCtx.drawImage(imgEl, sw * 0.22, sh * 0.45, sw * 0.56, sh * 0.48, 0, 0, 680, 410);
      const mapImg = document.getElementById('minimap-bg-img');
      if (mapImg) mapImg.src = thumbCanvas.toDataURL('image/jpeg', 0.82);
    } catch (e) {}
  }, 200);
}

function loadPanoramaFile(filename, callback) {
  if (textureCache[filename]) {
    callback(textureCache[filename]);
    return;
  }
  if (pendingCallbacks[filename]) {
    pendingCallbacks[filename].push(callback);
    return;
  }
  pendingCallbacks[filename] = [callback];

  const base = filename.replace(/\.(jpg|jpeg|png)$/i, '');
  // Ưu tiên nạp thẳng img/anh360.jpg và img/anh360_2.jpg (chữ thường) ngay lượt đầu tiên
  const candidates = Array.from(new Set([
    'img/' + base + '.jpg',
    'img/' + filename,
    base + '.jpg',
    filename,
    'img/' + base + '.JPG',
    base + '.JPG'
  ]));
  let idx = 0;

  function tryNext() {
    if (idx >= candidates.length) {
      delete pendingCallbacks[filename];
      return;
    }
    const src = candidates[idx++];
    const img = new Image();
    img.decoding = 'async';

    img.onload = () => {
      const tex = new THREE.Texture(img);
      tex.flipY = true;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = maxAnisotropy;
      tex.generateMipmaps = false;
      tex.needsUpdate = true;

      textureCache[filename] = tex;
      createMinimapThumbAsync(img);

      const cbs = pendingCallbacks[filename] || [];
      delete pendingCallbacks[filename];
      cbs.forEach(cb => cb(tex));
    };

    img.onerror = tryNext;
    img.src = src;
  }
  tryNext();
}

loadPanoramaFile(FILE_OVERVIEW, (tex) => {
  uniforms.uTexture.value = tex;
  setTimeout(() => {
    loadPanoramaFile(FILE_CLOSEUP, () => {});
    ensureMarzipanoIframe();
  }, 600);
});

// -------------------------------------------------------------------------
// PHẦN 4: LOGIC CHUYỂN CẢNH (KẾT HỢP ẢNH FLYCAM TRÊN CAO & 62 CẢNH MARZIPANO)
// -------------------------------------------------------------------------
let isAnimatingCamera = false;
let animStartTime = 0;
let animDuration = 3200;

let startPitch = -1.5707, startYaw = -1.85, startScale = 2.55, startPlanet = 1.0;
let targetPitch = -0.60,  targetYaw = -0.03, targetScale = 0.88, targetPlanet = 0.0;
let infoPopupTimer = null;
let activeHotspotItems = [];

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function startTourFromSplash() {
  hasStartedFromSplash = true;
  const splashEl = document.getElementById('ctech-splash');
  if (splashEl) splashEl.classList.add('hide-splash');
  selectScene('overview', true);
}

function reopenSplashScreen() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  const splashEl = document.getElementById('ctech-splash');
  if (splashEl) splashEl.classList.remove('hide-splash');
}

function selectScene(sceneKey, playLittlePlanetIntro = false, specificMarzipanoId = null) {
  const resolvedKey = SCENES[sceneKey] ? sceneKey : 'overview';
  const data = SCENES[resolvedKey];
  if (!data) return;

  currentSceneKey = resolvedKey;
  renderSidebarMenu();
  updateTextsForCurrentLanguage();

  document.querySelectorAll('.map-blue-pin').forEach(p => p.classList.remove('active-pin'));
  const activePin = document.getElementById('pin-' + resolvedKey);
  if (activePin) activePin.classList.add('active-pin');
  if (data.pinPos) {
    const radarGroup = document.getElementById('minimap-radar-group');
    if (radarGroup) radarGroup.setAttribute('transform', `translate(${data.pinPos.x}, ${data.pinPos.y})`);
  }

  const targetMarzId = specificMarzipanoId || data.marzipanoId;

  if (targetMarzId) {
    openMarzipanoScene(
      targetMarzId,
      data.title[currentLang] || data.title.vi,
      data.desc[currentLang] || data.desc.vi
    );
    if (infoPopupTimer) clearTimeout(infoPopupTimer);
    infoPopupTimer = setTimeout(() => {
      document.getElementById('info-card').classList.add('visible');
      if (isSpeaking && hasStartedFromSplash) speakCurrentDescription();
    }, 350);
    return;
  }

  closeMarzipanoView();

  targetYaw    = (data.lookAtU - 0.5) * 2.0 * Math.PI;
  targetPitch  = (0.5 - data.lookAtVFromTop) * Math.PI;
  targetScale  = data.scale;
  targetPlanet = 0.0;

  buildHotspotsDOM(data.hotspots || []);

  const shouldPlayPlanet = (resolvedKey === 'overview' && playLittlePlanetIntro === true);

  loadPanoramaFile(data.photo, (tex) => {
    uniforms.uTexture.value = tex;

    if (infoPopupTimer) clearTimeout(infoPopupTimer);

    if (shouldPlayPlanet) {
      document.getElementById('hotspots-3d-layer').classList.remove('visible');
      document.getElementById('bottom-center-walk').classList.remove('visible');
      document.getElementById('info-card').classList.remove('visible');

      startPlanet = 1.0;
      startScale  = 2.55;
      startPitch  = -1.5707;
      startYaw    = targetYaw - 1.85;

      uniforms.uPlanetFactor.value = startPlanet;
      uniforms.uScale.value        = startScale;
      uniforms.uPitch.value        = startPitch;
      uniforms.uYaw.value          = startYaw;

      animDuration = 3200;
      isAnimatingCamera = true;
      animStartTime = performance.now();
    } else {
      startPlanet = 0.0;
      uniforms.uPlanetFactor.value = 0.0;
      startScale  = uniforms.uScale.value;
      startPitch  = uniforms.uPitch.value;
      startYaw    = uniforms.uYaw.value;

      document.getElementById('hotspots-3d-layer').classList.add('visible');
      document.getElementById('bottom-center-walk').classList.add('visible');

      animDuration = 650;
      isAnimatingCamera = true;
      animStartTime = performance.now();
    }
  });
}

function buildHotspotsDOM(list) {
  const container = document.getElementById('hotspots-3d-layer');
  container.innerHTML = '';
  activeHotspotItems = list.map(h => {
    const div = document.createElement('div');
    div.className = 'tlu-hotspot-tag';
    div.innerHTML = h.label[currentLang] || h.label.vi;
    div.onclick = (e) => {
      e.stopPropagation();
      selectScene(h.target, false);
    };
    container.appendChild(div);
    const lon = (h.u - 0.5) * 2.0 * Math.PI;
    const lat = (0.5 - h.vFromTop) * Math.PI;
    return { el: div, lon: lon, lat: lat, rawLabel: h.label };
  });
}

function updateHotspotsScreenCoords() {
  if (uniforms.uPlanetFactor.value > 0.15) return;

  const uYaw = uniforms.uYaw.value;
  const uPitch = uniforms.uPitch.value;
  const uAspect = uniforms.uAspect.value;
  const uScale = uniforms.uScale.value;

  const cy = Math.cos(uYaw), sy = Math.sin(uYaw);
  const cp = Math.cos(uPitch), sp = Math.sin(uPitch);

  activeHotspotItems.forEach(item => {
    const wx = Math.cos(item.lat) * Math.sin(item.lon);
    const wy = Math.sin(item.lat);
    const wz = Math.cos(item.lat) * Math.cos(item.lon);

    const d1x = wx * cy - wz * sy;
    const d1y = wy;
    const d1z = wx * sy + wz * cy;

    const dirX = d1x;
    const dirY = d1y * cp - d1z * sp;
    const dirZ = d1y * sp + d1z * cp;

    if (dirZ <= 0.15) {
      item.el.style.display = 'none';
      return;
    }

    const px = dirX / dirZ;
    const py = dirY / dirZ;

    const screenU = 0.5 + px / (uAspect * uScale);
    const screenV = 0.5 + py / uScale;

    if (screenU < 0.03 || screenU > 0.97 || screenV < 0.05 || screenV > 0.95) {
      item.el.style.display = 'none';
      return;
    }

    item.el.style.display = 'block';
    const rawX = screenU * window.innerWidth;
    const safeX = Math.max(115, Math.min(window.innerWidth - 115, rawX));
    item.el.style.left = safeX + 'px';
    item.el.style.top  = ((1.0 - screenV) * window.innerHeight) + 'px';
  });
}

// -------------------------------------------------------------------------
// PHẦN 5: VÒNG LẶP ĐỒ HỌA 60FPS (TỰ NGẮT KHI ĐANG MỞ MARZIPANO)
// -------------------------------------------------------------------------
let isDragging = false, prevX = 0, prevY = 0;
const radarConeEl = document.getElementById('minimap-radar-cone');

function animate(now) {
  requestAnimationFrame(animate);

  // Nếu đang mở khung 360° Marzipano dưới mặt đất -> Ngắt hoàn toàn render WebGL của Three.js
  if (currentMarzipanoId) return;

  if (isAnimatingCamera && uniforms.uTexture.value) {
    const elapsed = now - animStartTime;
    const p = Math.min(1, Math.max(0, elapsed / animDuration));
    const e = easeInOutCubic(p);

    uniforms.uPlanetFactor.value = startPlanet + (targetPlanet - startPlanet) * e;
    uniforms.uScale.value        = startScale  + (targetScale  - startScale)  * e;
    uniforms.uPitch.value        = startPitch  + (targetPitch  - startPitch)  * e;
    uniforms.uYaw.value          = startYaw    + (targetYaw    - startYaw)    * e;

    if (p >= 1) {
      isAnimatingCamera = false;
      document.getElementById('hotspots-3d-layer').classList.add('visible');
      document.getElementById('bottom-center-walk').classList.add('visible');

      infoPopupTimer = setTimeout(() => {
        document.getElementById('info-card').classList.add('visible');
        if (isSpeaking && hasStartedFromSplash) speakCurrentDescription();
      }, 300);
    }
  } else if (!isAnimatingCamera && !isDragging && uniforms.uTexture.value && currentSceneKey === 'overview') {
    const timeSec = now * 0.00025;
    uniforms.uYaw.value = targetYaw + Math.sin(timeSec) * 0.04;
  }

  updateHotspotsScreenCoords();

  if (radarConeEl) {
    const deg = (uniforms.uYaw.value * 180) / Math.PI;
    radarConeEl.style.transform = `rotate(${deg}deg)`;
  }

  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

stage.addEventListener('mousedown', (e) => {
  if (isAnimatingCamera || currentMarzipanoId) return;
  isDragging = true;
  prevX = e.clientX;
  prevY = e.clientY;
});
window.addEventListener('mousemove', (e) => {
  if (!isDragging || currentMarzipanoId) return;
  const dx = e.clientX - prevX;
  const dy = e.clientY - prevY;
  prevX = e.clientX;
  prevY = e.clientY;
  uniforms.uYaw.value   -= dx * 0.0022 * uniforms.uScale.value;
  uniforms.uPitch.value  = Math.max(-1.55, Math.min(0.85, uniforms.uPitch.value + dy * 0.0022 * uniforms.uScale.value));
  targetYaw = uniforms.uYaw.value;
});
window.addEventListener('mouseup', () => { isDragging = false; });

stage.addEventListener('touchstart', (e) => {
  if (isAnimatingCamera || currentMarzipanoId || e.touches.length !== 1) return;
  isDragging = true;
  prevX = e.touches[0].clientX;
  prevY = e.touches[0].clientY;
}, { passive: true });
window.addEventListener('touchmove', (e) => {
  if (!isDragging || currentMarzipanoId || e.touches.length !== 1) return;
  const dx = e.touches[0].clientX - prevX;
  const dy = e.touches[0].clientY - prevY;
  prevX = e.touches[0].clientX;
  prevY = e.touches[0].clientY;
  uniforms.uYaw.value   -= dx * 0.0025 * uniforms.uScale.value;
  uniforms.uPitch.value  = Math.max(-1.55, Math.min(0.85, uniforms.uPitch.value + dy * 0.0025 * uniforms.uScale.value));
  targetYaw = uniforms.uYaw.value;
}, { passive: true });
window.addEventListener('touchend', () => { isDragging = false; });

stage.addEventListener('wheel', (e) => {
  if (isAnimatingCamera || currentMarzipanoId) return;
  e.preventDefault();
  uniforms.uScale.value = Math.max(0.30, Math.min(2.2, uniforms.uScale.value + e.deltaY * 0.0008));
}, { passive: false });

window.addEventListener('resize', () => {
  if (!currentMarzipanoId) {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.uAspect.value = window.innerWidth / window.innerHeight;
  }
});

// -------------------------------------------------------------------------
// PHẦN 6: MENU ĐA CẤP (MŨI TÊN ▼), ĐA NGÔN NGỮ & GIỌNG ĐỌC THUYẾT MINH
// -------------------------------------------------------------------------
function setLanguage(langCode) {
  if (!UI_TEXT[langCode]) return;
  currentLang = langCode;

  document.querySelectorAll('.lang-circle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === langCode);
  });

  const ui = UI_TEXT[langCode];
  document.getElementById('splash-sub-title').innerHTML    = ui.splashSub;
  document.getElementById('splash-main-title').innerHTML   = ui.splashMain;
  document.getElementById('splash-ribbon-title').innerHTML = ui.splashRibbon;
  document.getElementById('splash-btn-text').innerHTML     = ui.splashBtn;
  document.getElementById('ui-map-btn').textContent        = ui.mapBtn;
  document.getElementById('ui-sidebar-footer').innerHTML   = ui.footer;

  renderSidebarMenu();
  updateTextsForCurrentLanguage();

  activeHotspotItems.forEach(item => {
    item.el.innerHTML = item.rawLabel[currentLang] || item.rawLabel.vi;
  });

  if (hasStartedFromSplash && isSpeaking) {
    speakCurrentDescription();
  }
}

function updateTextsForCurrentLanguage() {
  const data = SCENES[currentSceneKey];
  if (!data) return;
  document.getElementById('scene-blue-badge').textContent = data.badge[currentLang] || data.badge.vi;
  document.getElementById('info-title').textContent       = data.title[currentLang] || data.title.vi;
  document.getElementById('info-desc').textContent        = data.desc[currentLang]  || data.desc.vi;
}

function renderSidebarMenu() {
  const ul = document.getElementById('menu-list');
  if (!ul) return;
  ul.innerHTML = '';

  Object.keys(SCENES).forEach(key => {
    const sceneObj = SCENES[key];
    const hasSub = Array.isArray(sceneObj.subItems) && sceneObj.subItems.length > 0;

    const li = document.createElement('li');
    li.className = 'nav-item' + (key === currentSceneKey ? ' open' : '');

    const btn = document.createElement('button');
    btn.className = 'nav-link' + (key === currentSceneKey ? ' active' : '');

    const textSpan = document.createElement('span');
    textSpan.textContent = sceneObj.menu[currentLang] || sceneObj.menu.vi;
    btn.appendChild(textSpan);

    if (hasSub) {
      const arrowSpan = document.createElement('span');
      arrowSpan.className = 'nav-dropdown-arrow';
      arrowSpan.textContent = '▼';
      btn.appendChild(arrowSpan);
    }

    btn.onclick = () => {
      if (key === currentSceneKey && hasSub) {
        li.classList.toggle('open');
      } else {
        selectScene(key, key === 'overview');
      }
    };
    li.appendChild(btn);

    if (hasSub) {
      const subUl = document.createElement('ul');
      subUl.className = 'sub-nav-list';
      sceneObj.subItems.forEach(sub => {
        const subLi = document.createElement('li');
        const subBtn = document.createElement('button');
        subBtn.className = 'sub-nav-btn';
        if (sub.marzipanoId) {
          subBtn.setAttribute('data-marz-id', sub.marzipanoId);
          if (sub.marzipanoId === currentMarzipanoId) {
            subBtn.classList.add('active-sub');
          }
        }
        subBtn.textContent = '- ' + (sub.label[currentLang] || sub.label.vi);

        subBtn.onclick = (e) => {
          e.stopPropagation();
          currentSceneKey = key;

          if (sub.marzipanoId) {
            const subTitle = (sub.title && sub.title[currentLang]) || sub.label[currentLang] || sub.label.vi;
            openMarzipanoScene(
              sub.marzipanoId,
              subTitle + ' - Cao đẳng CTECH',
              (sub.desc && (sub.desc[currentLang] || sub.desc.vi)) || sceneObj.desc[currentLang] || sceneObj.desc.vi
            );
            document.getElementById('info-card').classList.add('visible');
            return;
          }

          closeMarzipanoView();
          targetYaw    = ((sub.lookAtU ?? 0.5) - 0.5) * 2.0 * Math.PI;
          targetPitch  = (0.5 - (sub.lookAtVFromTop ?? 0.5)) * Math.PI;
          targetScale  = sub.scale || 0.52;
          targetPlanet = 0.0;
          startYaw     = uniforms.uYaw.value;
          startPitch   = uniforms.uPitch.value;
          startScale   = uniforms.uScale.value;
          startPlanet  = 0.0;

          animDuration = 600;
          isAnimatingCamera = true;
          animStartTime = performance.now();

          document.getElementById('info-title').textContent = (sub.title && sub.title[currentLang]) || sub.label[currentLang] || sub.label.vi;
          document.getElementById('info-card').classList.add('visible');
        };

        subLi.appendChild(subBtn);
        subUl.appendChild(subLi);
      });
      li.appendChild(subUl);
    }

    ul.appendChild(li);
  });
}

function goForwardScene() {
  const data = SCENES[currentSceneKey];
  const nextKey = (data && data.next) ? data.next : 'campus';
  selectScene(nextKey, false);
}

function toggleSidebarMenu(event) {
  if (event) event.stopPropagation();
  const sb = document.getElementById('sidebar');
  const btn = document.getElementById('toggle-sidebar-btn');
  sb.classList.toggle('collapsed');
  document.body.classList.toggle('sidebar-closed');
  if (btn) btn.textContent = sb.classList.contains('collapsed') ? '▶' : '◀';
}

function toggleMinimap(show) {
  const mapEl = document.getElementById('tlu-aerial-minimap');
  if (!mapEl) return;
  mapEl.classList.toggle('closed', !show);
}

function toggleInfoCard(event) {
  if (event) event.stopPropagation();
  const card = document.getElementById('info-card');
  if (card) card.classList.toggle('visible');
}

function speakCurrentDescription() {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const data = SCENES[currentSceneKey];
  if (!data) return;
  let spokenText = data.desc[currentLang] || data.desc.vi;

  if (currentLang === 'vi') {
    spokenText = spokenText
      .replace(/\([^)]*College[^)]*\)/gi, '')
      .replace(/\([^)]*Technology[^)]*\)/gi, '')
      .replace(/CTECH/gi, 'Xi Tếch')
      .replace(/22\.000m²/g, '22 nghìn mét vuông')
      .replace(/m²/g, ' mét vuông')
      .replace(/CCG/g, 'C C G')
      .replace(/N0/g, 'Nờ không ');
  }

  const utter = new SpeechSynthesisUtterance(spokenText);
  utter.lang = UI_TEXT[currentLang].voiceLang;
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}

function toggleVoiceNarration() {
  isSpeaking = !isSpeaking;
  if (isSpeaking) speakCurrentDescription();
  else if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

// =========================================================================
// PHẦN 7: TRỢ LÝ ẢO CTECH (ĐẦY ĐỦ SỐ PHÒNG 101, 102, 103, 105, 106 & 10 NÚT GỢI Ý)
// =========================================================================
const GEMINI_API_KEY = 'AQ.Ab8RN6KGRNzWrObzEyhZ4y_ut6sqhn5mr9qp7iE4lw3RzcAueA';

const chatbotBox = document.getElementById('ctech-chatbot');
const chatMessagesEl = document.getElementById('chatbot-messages');
let chatbotInitialized = false;
let geminiChatHistory = [];

if (chatbotBox) {
  ['mousedown', 'mousemove', 'wheel', 'touchstart', 'touchmove', 'click'].forEach(evt => {
    chatbotBox.addEventListener(evt, (e) => e.stopPropagation());
  });
}

const CTECH_SYSTEM_PROMPT = `
Bạn là "Trợ lý ảo AI CTECH" của Trường Cao đẳng Kỹ thuật – Công nghệ Bách Khoa (CTECH - Mã trường: CCG).
Hãy trả lời ngắn gọn, thân thiện, chính xác bằng tiếng Việt dựa trên SƠ ĐỒ PHÒNG HỌC & THỰC HÀNH MỚI NHẤT sau đây:

1. TÒA N01 (Ngay đầu cổng trường đi vào - Mã cảnh: n01):
   - Phòng Công tác Học sinh - Sinh viên (P. Công tác HS-SV) & Phòng Tuyển sinh: Đặt tại Tầng 1 - Tòa N01.
   - Hội trường lớn N01.
   - Phòng Tiếng Nhật lớn & Phòng Tiếng Nhật bé (Không gian Văn hóa Nhật Bản).
   - Phòng thực hành máy tính Khoa Công nghệ thông tin (CNTT).

2. TÒA N02 (Tòa trung tâm mái Cờ Đỏ Sao Vàng, mặt sau là Quảng trường CTECH - Mã cảnh: n02):
   - Tầng 1: Xưởng thực hành Công nghệ Ô tô & Cơ khí.
   - Tầng 2: Phòng thực hành Điện & Sân cầu lông trong nhà.
   - Tầng 3: Khu Ký túc xá (KTX) sinh viên (ưu đãi giảm 50% phí 3 tháng đầu, giảm 20% các tháng tiếp theo).

3. TÒA N03 (Khối nhà bên phải - Mã cảnh: n03):
   - Phòng 101 (P.101 - Tòa N03): Phòng thực hành Điều dưỡng.
   - Phòng 102 (P.102 - Tòa N03): Phòng thực hành Chăm sóc sắc đẹp - Trang điểm.
   - Phòng 103 (P.103 - Tòa N03): Phòng thực hành Chăm sóc sắc đẹp - Điều trị da mặt (Spa).
   - Phòng 105 (P.105 - Tòa N03): Phòng trưng bày Thiết kế đồ họa.
   - Tầng 2 N03: Hệ thống Phòng họp & Phòng học lớn.

4. TÒA N04 (Giáp Quảng trường - Mã cảnh: n04):
   - Phòng 101 (P.101 - Tòa N04): Phòng Y tế chăm sóc sức khỏe.
   - Phòng 106 (P.106 - Tòa N04): Phòng thực hành Kỹ thuật Chế biến món ăn (Ẩm thực).
   - Phòng học Tiếng Hán & Phòng thực hành Thiết kế đồ họa N04.
   - Tầng 2 N04: Trung tâm Ngoại ngữ CTECH.

5. TÒA N05 (Khối nhà đa năng & Hiệu bộ - Mã cảnh: n05):
   - Tầng 1: Căng tin (Canteen) sinh viên.
   - Tầng 2: Văn phòng Hiệu bộ gồm Ban Giám hiệu (BGH), Văn phòng Khoa (VPK), Phòng Kế toán (thu nộp học phí, học bổng), Phòng Đào tạo.
   - Tầng 4: Thư viện CTECH & Phòng họp thư viện.

6. THÔNG TIN ĐÀO TẠO & TUYỂN SINH:
   - Đào tạo 34 ngành thuộc 5 khoa (CNTT, Cơ khí - Ô tô, Chăm sóc sức khỏe - Sắc đẹp, Ngoại ngữ, Kinh tế - Du lịch - Truyền thông) với Hệ Cao đẳng chính quy và Hệ THPT - Cao đẳng (9+ dành cho học sinh tốt nghiệp THCS).
   - Cam kết 70% thực hành, 100% sinh viên được thực tập hưởng lương và giới thiệu việc làm tại 500+ doanh nghiệp đối tác (Nissan, Sun Group, Pegatron, LG...).
   - Địa chỉ: Số 60 Quốc lộ 1A, Thường Tín, Hà Nội (22.000m²); Cơ sở Cần Thơ: 57 CMT8, Bình Thủy. Hotline: 1800 6770 | 0986 301 916.

QUY TẮC TRẢ LỜI:
- Chỉ dùng thẻ HTML <b>in đậm</b> và <br> xuống dòng (không dùng **).
- Cuối câu trả lời luôn gắn nhãn điều hướng 360° theo cú pháp: [SCENE:mã_cảnh] (chọn 1 trong: overview, campus, n01, n02, n03, n04, n05, square, sports).
`;

const SCENE_BUTTON_NAMES = {
  overview: 'Xem Toàn Cảnh Trên Cao Trường CTECH',
  campus:   'Đi tới Cổng Trường & Khuôn Viên CTECH',
  n01:      'Đi vào Tòa N01 (CT HSSV, Tuyển Sinh, Hội Trường, CNTT)',
  n02:      'Đi vào Tòa N02 (Xưởng Ô Tô, Phòng Điện, Ký Túc Xá)',
  n03:      'Đi vào Tòa N03 (P.101 Điều Dưỡng, P.102-103 Sắc Đẹp, P.105 Đồ Họa)',
  n04:      'Đi vào Tòa N04 (P.106 Chế Biến, P.101 Y Tế, TT Ngoại Ngữ)',
  n05:      'Đi vào Tòa N05 (Tầng 1 Căng Tin, Tầng 2 Kế Toán, Tầng 4 Thư Viện)',
  square:   'Đi tới Quảng Trường Hoa Sen CTECH',
  sports:   'Đi tới Khu Thể Chất & Sân Bóng Đá'
};

function toggleChatbot(show, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (!chatbotBox) return;

  if (show === true) {
    chatbotBox.classList.remove('chatbot-hidden');
    if (!chatbotInitialized) {
      chatbotInitialized = true;
      appendBotMessage(
        'Xin chào! 👋 Mình là <b>Trợ lý ảo AI CTECH</b>.<br>Mình nắm rõ vị trí từng phòng học & thực hành 360° tại 5 tòa <b>N01 – N05</b>:<br>' +
        '• <b>Tòa N01:</b> Phòng Công tác HSSV & Tuyển sinh, Hội trường, Thực hành CNTT, Tiếng Nhật.<br>' +
        '• <b>Tòa N02:</b> Xưởng Ô tô, Phòng Điện, Sân cầu lông, Ký túc xá (Tầng 3).<br>' +
        '• <b>Tòa N03:</b> <b>P.101</b> Điều dưỡng, <b>P.102</b> Sắc đẹp - Trang điểm, <b>P.103</b> Điều trị da mặt, <b>P.105</b> Trưng bày Thiết kế đồ họa.<br>' +
        '• <b>Tòa N04:</b> <b>P.101</b> Phòng Y tế, <b>P.106</b> Thực hành Chế biến món ăn, TT Ngoại ngữ, Tiếng Hán.<br>' +
        '• <b>Tòa N05:</b> Tầng 1 Căng tin, Tầng 2 Kế toán - Đào tạo, Tầng 4 Thư viện.<br>' +
        'Bạn có thể gõ <b>số phòng (101, 102, 103, 105, 106...)</b> hoặc bấm các nút bên dưới nhé!',
        null
      );
    }
    setTimeout(() => document.getElementById('chatbot-input')?.focus(), 150);
  } else {
    chatbotBox.classList.add('chatbot-hidden');
  }
}

function appendUserMessage(text) {
  const div = document.createElement('div');
  div.className = 'chat-msg user';
  div.textContent = text;
  chatMessagesEl.appendChild(div);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function appendBotMessage(htmlText, targetSceneKey, targetLabel, specificMarzId = null, extraButtons = null) {
  const div = document.createElement('div');
  div.className = 'chat-msg bot';
  div.innerHTML = htmlText;

  if (Array.isArray(extraButtons) && extraButtons.length > 0) {
    extraButtons.forEach(btnInfo => {
      if (!btnInfo || !SCENES[btnInfo.scene]) return;
      const br = document.createElement('br');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chat-jump-btn';
      btn.innerHTML = '📍 ' + btnInfo.btnText;
      btn.onclick = (e) => {
        e.stopPropagation();
        selectScene(btnInfo.scene, false, btnInfo.marzId || null);
      };
      div.appendChild(br);
      div.appendChild(btn);
    });
  } else if (targetSceneKey && SCENES[targetSceneKey]) {
    const br = document.createElement('br');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chat-jump-btn';
    btn.innerHTML = '📍 ' + (targetLabel || SCENE_BUTTON_NAMES[targetSceneKey] || 'Di chuyển tới khu vực này');
    btn.onclick = (e) => {
      e.stopPropagation();
      selectScene(targetSceneKey, false, specificMarzId);
    };
    div.appendChild(br);
    div.appendChild(btn);
  }

  chatMessagesEl.appendChild(div);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

async function callGeminiAI(userQuestion) {
  const cleanKey = (GEMINI_API_KEY || '').trim();
  if (!cleanKey || cleanKey === 'DÁN_API_KEY_CỦA_BẠN_VÀO_ĐÂY') {
    throw new Error('NO_API_KEY');
  }

  const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash'];
  const fullPromptText = `${CTECH_SYSTEM_PROMPT}\n\nCâu hỏi của người dùng: "${userQuestion}"`;

  for (const modelName of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(cleanKey)}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            ...geminiChatHistory,
            {
              role: 'user',
              parts: [{ text: fullPromptText }]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500
          }
        })
      });

      if (!response.ok) continue;

      const data = await response.json();
      let rawReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!rawReply) continue;

      geminiChatHistory.push(
        { role: 'user', parts: [{ text: userQuestion }] },
        { role: 'model', parts: [{ text: rawReply }] }
      );
      if (geminiChatHistory.length > 8) {
        geminiChatHistory = geminiChatHistory.slice(-8);
      }

      let detectedScene = 'overview';
      const sceneMatch = rawReply.match(/\[SCENE:\s*([a-z0-9_]+)\s*\]/i);
      if (sceneMatch && sceneMatch[1]) {
        const candidateScene = sceneMatch[1].toLowerCase();
        if (SCENES[candidateScene]) detectedScene = candidateScene;
        rawReply = rawReply.replace(sceneMatch[0], '').trim();
      }

      return {
        text: rawReply.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'),
        scene: detectedScene,
        btnText: SCENE_BUTTON_NAMES[detectedScene]
      };
    } catch (e) {}
  }

  throw new Error('FALLBACK_TO_SMART_LOCAL');
}

async function sendQuickQuestion(questionText) {
  appendUserMessage(questionText);

  const typingId = 'typing-' + Date.now();
  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-msg bot';
  typingDiv.id = typingId;
  typingDiv.innerHTML = '<i>✨ Trợ lý AI CTECH đang tra cứu thông tin...</i>';
  chatMessagesEl.appendChild(typingDiv);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;

  setTimeout(async () => {
    const localReply = getLocalSmartFallback(questionText);
    if (!localReply.isDefaultFallback) {
      document.getElementById(typingId)?.remove();
      appendBotMessage(localReply.text, localReply.scene, localReply.btnText, localReply.marzId, localReply.extraButtons);
      return;
    }

    try {
      const geminiReply = await callGeminiAI(questionText);
      document.getElementById(typingId)?.remove();
      appendBotMessage(geminiReply.text, geminiReply.scene, geminiReply.btnText, geminiReply.marzId);
    } catch (err) {
      document.getElementById(typingId)?.remove();
      appendBotMessage(localReply.text, localReply.scene, localReply.btnText, localReply.marzId, localReply.extraButtons);
    }
  }, 320);
}

function handleChatSubmit(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const input = document.getElementById('chatbot-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  sendQuickQuestion(text);
}

function removeAccents(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFC')
    .toLowerCase();
}

function getLocalSmartFallback(rawInput) {
  const q = removeAccents(rawInput);

  // -----------------------------------------------------------------------
  // BƯỚC A: PHÁT HIỆN NẾU NGƯỜI DÙNG HỎI NHIỀU SỐ PHÒNG CÙNG LÚC (VD: "102 và 106")
  // -----------------------------------------------------------------------
  const roomCatalog = [
    {
      match: /\b(102|p102|p\.102)\b|102号|102室|102호/,
      info: '• <b>Phòng 102 – Tòa N03:</b> Phòng thực hành Chăm sóc sắc đẹp – Trang điểm (Makeup Lab / メイク実習室 / 메이크업 실습실).',
      btn: { scene: 'n03', marzId: '37-phng-thc-hnh-sc-p-trang-im', btnText: 'Đi vào P.102 - Thực Hành Trang Điểm (Tòa N03)' }
    },
    {
      match: /\b(103|p103|p\.103)\b|103号|103室|103호/,
      info: '• <b>Phòng 103 – Tòa N03:</b> Phòng thực hành Điều trị da mặt – Spa (Facial Lab / フェイシャル実習室 / 피부관리 실습실).',
      btn: { scene: 'n03', marzId: '38-phng-thc-hnh-sc-p-iu-tr-da-mt', btnText: 'Đi vào P.103 - Thực Hành Điều Trị Da Mặt (Tòa N03)' }
    },
    {
      match: /\b(105|p105|p\.105)\b|105号|105室|105호/,
      info: '• <b>Phòng 105 – Tòa N03:</b> Phòng trưng bày Thiết kế đồ họa (Design Showroom / デザイン展示室 / 그래픽디자인 전시실).',
      btn: { scene: 'n03', marzId: '39-phng-chng-by-ca-thit-k--ha', btnText: 'Đi vào P.105 - Trưng Bày Thiết Kế Đồ Họa (Tòa N03)' }
    },
    {
      match: /\b(106|p106|p\.106)\b|106号|106室|106호/,
      info: '• <b>Phòng 106 – Tòa N04:</b> Phòng thực hành Kỹ thuật Chế biến món ăn (Culinary Lab / 調理技術実習室 / 조리기술 실습실).',
      btn: { scene: 'n04', marzId: '50-phng-thc-hnh-ch-bin', btnText: 'Đi vào P.106 - Thực Hành Chế Biến Món Ăn (Tòa N04)' }
    }
  ];

  const matchedMultiRooms = roomCatalog.filter(r => r.match.test(q));
  if (matchedMultiRooms.length >= 2) {
    return {
      text: '📍 <b>Đã tìm thấy các phòng bạn yêu cầu tại CTECH:</b><br>' +
            matchedMultiRooms.map(r => r.info).join('<br>'),
      scene: matchedMultiRooms[0].btn.scene,
      extraButtons: matchedMultiRooms.map(r => r.btn)
    };
  }

  // -----------------------------------------------------------------------
  // BƯỚC B: CƠ SỞ DỮ LIỆU CHUYÊN SÂU ĐA NGÔN NGỮ (VI - EN - JA - KO)
  // -----------------------------------------------------------------------
  if (
    q.includes('so do') || (q.includes('n01') && q.includes('n05')) || q.includes('5 toa') ||
    q.includes('campus map') || q.includes('all buildings') || q.includes('5 buildings') ||
    q.includes('マップ') || q.includes('地図') || q.includes('全体') ||
    q.includes('캠퍼스맵') || q.includes('전체지도') || q.includes('건물배치')
  ) {
    return {
      text: '🏢 <b>Sơ đồ chi tiết 5 tòa nhà N01 – N05 tại CTECH (Campus Map / キャンパスマップ / 캠퍼스 안내):</b><br>' +
            '• <b>Tòa N01 (Đầu cổng):</b> Sảnh chính, Phòng Công tác HSSV & Tuyển sinh, Hội trường lớn, Phòng thực hành máy CNTT, Phòng Tiếng Nhật lớn & bé.<br>' +
            '• <b>Tòa N02 (Giữa trường):</b> Tầng 1 Xưởng thực hành Ô tô; Tầng 2 Phòng thực hành Điện & Sân cầu lông; Tầng 3 Ký túc xá sinh viên.<br>' +
            '• <b>Tòa N03:</b> <b>P.101</b> Thực hành Điều dưỡng; <b>P.102</b> Thực hành Sắc đẹp – Trang điểm; <b>P.103</b> Thực hành Điều trị da mặt (Spa); <b>P.105</b> Trưng bày Thiết kế đồ họa; Tầng 2 Phòng học lớn.<br>' +
            '• <b>Tòa N04:</b> <b>P.101</b> Phòng Y tế; <b>P.106</b> Thực hành Chế biến món ăn; Phòng học Tiếng Hán; Phòng Đồ họa N04; Tầng 2 Trung tâm Ngoại ngữ.<br>' +
            '• <b>Tòa N05:</b> Tầng 1 Căng tin; Tầng 2 Văn phòng Giáo viên, Kế toán, Đào tạo; Tầng 4 Thư viện & Phòng họp.',
      scene: 'overview',
      btnText: SCENE_BUTTON_NAMES.overview
    };
  }

  if ((q.includes('y te') || q.includes('medical') || q.includes('医務') || q.includes('보건')) &&
      (q.includes('ke toan') || q.includes('accounting') || q.includes('経理') || q.includes('회계'))) {
    return {
      text: '🏥💼 <b>Vị trí Phòng Y tế và Phòng Kế toán tại CTECH:</b><br>' +
            '• <b>Phòng Y tế (Medical Clinic / 医務室 / 보건실):</b> Đặt tại <b>Phòng 101 – Tầng 1 Tòa N04</b>.<br>' +
            '• <b>Phòng Kế toán (Accounting Office / 経理課 / 회계과):</b> Đặt tại <b>Tầng 2 – Tòa N05</b>.',
      scene: 'n04',
      extraButtons: [
        { scene: 'n04', marzId: '47-phng-y-t-n04', btnText: 'Đi vào Phòng Y Tế (P.101 - Tòa N04)' },
        { scene: 'n05', marzId: '27-phng-gio-vin-k-ton-o-to', btnText: 'Đi vào Phòng Kế Toán (Tầng 2 - Tòa N05)' }
      ]
    };
  }

  if (
    q.includes('gioi thieu') || (q.includes('truong ctech') && !q.includes('quang truong')) ||
    q.includes('about ctech') || q.includes('introduction') ||
    q.includes('学校紹介') || q.includes('概要') || q.includes('학교소개')
  ) {
    return {
      text: '🏫 <b>Trường Cao đẳng Kỹ thuật – Công nghệ Bách Khoa (CTECH – Mã trường: CCG):</b><br>' +
            '• <b>Quy mô:</b> Diện tích <b>22.000m²</b> tại số 60 Quốc lộ 1A, Thường Tín, Hà Nội với 5 tòa nhà hiện đại <b>N01 – N05</b>, Quảng trường Hoa Sen và Sân bóng đá cỏ nhân tạo.<br>' +
            '• <b>Mô hình đào tạo:</b> <b>70% Thực hành – 30% Lý thuyết</b>, học trực tiếp tại xưởng Ô tô, phòng Spa, phòng Điều dưỡng, bếp Chế biến món ăn và phòng Lab CNTT.<br>' +
            '• <b>Cam kết đầu ra:</b> 100% sinh viên được bố trí thực tập hưởng lương và giới thiệu việc làm tại hơn 500 doanh nghiệp đối tác.',
      scene: 'overview',
      btnText: SCENE_BUTTON_NAMES.overview
    };
  }

  if (
    q.includes('nganh') || q.includes('34 nganh') || q.includes('cac khoa') ||
    q.includes('major') || q.includes('faculty') || q.includes('faculties') || q.includes('department') ||
    q.includes('学部') || q.includes('学科') || q.includes('専攻') ||
    q.includes('학부') || q.includes('학과') || q.includes('전공')
  ) {
    return {
      text: '🎓 <b>CTECH đào tạo 34 ngành nghề trọng điểm thuộc 5 Khoa:</b><br>' +
            '1. <b>Khoa CNTT:</b> Công nghệ thông tin, Lập trình, Thiết kế đồ họa (P.105 N03 & N04), Quản trị mạng (Tòa N01).<br>' +
            '2. <b>Khoa Cơ khí – Động lực:</b> Công nghệ Ô tô, Cơ khí, Điện công nghiệp – Dân dụng (Xưởng N02).<br>' +
            '3. <b>Khoa Chăm sóc sức khỏe & Sắc đẹp:</b> Điều dưỡng (<b>P.101 N03</b>), Chăm sóc sắc đẹp – Trang điểm (<b>P.102 N03</b>), Điều trị da mặt – Spa (<b>P.103 N03</b>).<br>' +
            '4. <b>Khoa Ngoại ngữ:</b> Tiếng Nhật (Tòa N01), Tiếng Hàn, Tiếng Trung/Hán (Tòa N04), Tiếng Anh, Tiếng Đức.<br>' +
            '5. <b>Khoa Kinh tế – Du lịch – Truyền thông:</b> Kỹ thuật Chế biến món ăn (<b>P.106 N04</b>), Quản trị khách sạn, Thương mại điện tử, Kế toán, Marketing.',
      scene: 'n01',
      marzId: '3-phng-cng-tc-tuyn-sinh',
      btnText: 'Đi tới Phòng Tư Vấn Tuyển Sinh & HSSV (Tòa N01)'
    };
  }

  if (
    q.includes('hoc phi') || q.includes('hoc bong') ||
    q.includes('tuition') || q.includes('scholarship') ||
    q.includes('学費') || q.includes('授業料') || q.includes('奨学金') ||
    q.includes('학비') || q.includes('등록금') || q.includes('장학금')
  ) {
    return {
      text: '💰 <b>Thông tin Học phí & Chính sách Học bổng tại CTECH:</b><br>' +
            '• <b>Học phí:</b> Thu theo tín chỉ với mức ưu đãi, ổn định trong suốt khóa học. Học sinh tốt nghiệp THCS học hệ 9+ được miễn 100% học phí trung cấp nghề theo quy định Nhà nước.<br>' +
            '• <b>Học bổng CTECH:</b> Quỹ học bổng hàng tỷ đồng gồm Học bổng Tân sinh viên nhập học sớm và Học bổng Khuyến khích học tập từng học kỳ.<br>' +
            '• <b>Địa điểm làm thủ tục:</b> <b>Phòng Kế toán – Tầng 2 Tòa N05</b>.',
      scene: 'n05',
      marzId: '27-phng-gio-vin-k-ton-o-to',
      btnText: 'Đi vào Phòng Kế Toán - Học Bổng (Tầng 2 Tòa N05)'
    };
  }

  if (
    q.includes('ky tuc') || q.includes('ki tuc') || q.includes('ktx') || q.includes('noi tru') || q.includes('uu dai') ||
    q.includes('dormitory') || q.includes('dorm') || q.includes('hostel') || q.includes('accommodation') ||
    q.includes('学生寮') || q.includes('寮') || q.includes('宿舎') || q.includes('ドミトリー') ||
    q.includes('기숙사') || q.includes('숙소') || q.includes('생활관')
  ) {
    return {
      text: '🛏️ <b>Khu Ký túc xá (Student Dormitory / 学生寮 / 학생 기숙사) – Tầng 3 Tòa N02:</b><br>' +
            '• <b>Vị trí:</b> Đặt tại <b>Tầng 3 – Tòa nhà N02</b> ngay trong khuôn viên trường.<br>' +
            '• <b>Tiện nghi:</b> Phòng ở khép kín sạch đẹp, trang bị điều hòa, bình nóng lạnh, giường tầng tiêu chuẩn, Wifi tốc độ cao, an ninh 24/7.<br>' +
            '• 🎁 <b>Ưu đãi phí KTX:</b> <b>Giảm 50% phí KTX trong 3 tháng đầu tiên</b> và <b>giảm 20% các tháng tiếp theo</b>.',
      scene: 'n02',
      marzId: '22-bn-trong-phng-k-tc',
      btnText: 'Đi vào Xem Phòng Ký Túc Xá (Tầng 3 - Tòa N02)'
    };
  }

  if (q.includes('9+') || q.includes('thcs') || q.includes('he thpt') || q.includes('9 plus')) {
    return {
      text: '📘 <b>Chương trình Hệ THPT – Cao đẳng (Hệ 9+) tại CTECH:</b><br>' +
            '• <b>Đối tượng:</b> Dành cho học sinh đã tốt nghiệp <b>THCS (Lớp 9)</b>.<br>' +
            '• <b>Quyền lợi:</b> Nhận <b>2 bằng chính quy</b> (Bằng Tốt nghiệp THPT Quốc gia & Bằng Cao đẳng chính quy) chỉ sau 3 – 3,5 năm và được miễn giảm học phí trung cấp nghề theo quy định.',
      scene: 'n01',
      marzId: '3-phng-cng-tc-tuyn-sinh',
      btnText: 'Đi vào Phòng Công Tác HSSV & Tuyển Sinh (Tòa N01)'
    };
  }

  if (
    q.includes('thuc tap') || q.includes('viec lam') || q.includes('doanh nghiep') || q.includes('du hoc') ||
    q.includes('internship') || q.includes('career') || q.includes('employment') ||
    q.includes('インターン') || q.includes('就職') || q.includes('인턴') || q.includes('취업')
  ) {
    return {
      text: '✈️ <b>Cơ hội Thực tập hưởng lương & Việc làm tại CTECH:</b><br>' +
            '• <b>Thực tập hưởng lương:</b> Sinh viên được đi thực tập thực tế tại doanh nghiệp với mức phụ cấp hấp dẫn.<br>' +
            '• <b>Cam kết việc làm:</b> Hợp tác chiến lược cùng <b>500+ doanh nghiệp lớn</b> (Nissan, Sun Group, Pegatron, LG, Canon, Bệnh viện, Thẩm mỹ viện, Khách sạn 5 sao).',
      scene: 'n02',
      marzId: '14-bn-trong-xng--t',
      btnText: 'Tham quan Xưởng Thực Hành Ô Tô (Tòa N02)'
    };
  }

  if (
    q.includes('ho so') || q.includes('xet tuyen') || q.includes('nhap hoc') || q.includes('dang ky hoc') ||
    q.includes('application') || q.includes('enroll') || q.includes('出願') || q.includes('원서')
  ) {
    return {
      text: '📝 <b>Hồ sơ xét tuyển vào Cao đẳng CTECH:</b><br>' +
            '1. Phiếu đăng ký xét tuyển (theo mẫu CTECH).<br>' +
            '2. Bản sao công chứng Học bạ & Bằng tốt nghiệp THPT/THCS.<br>' +
            '3. Bản sao công chứng CCCD, Giấy khai sinh & 04 ảnh 3×4.<br>' +
            '• 📍 <b>Nộp hồ sơ tại:</b> Tầng 1 – Tòa N01 (Hotline: <b>1800 6770</b>).',
      scene: 'n01',
      marzId: '3-phng-cng-tc-tuyn-sinh',
      btnText: 'Đi vào Phòng Tuyển Sinh & Công Tác HSSV (Tòa N01)'
    };
  }

  if (
    /\b(102|p102|p\.102)\b/.test(q) || q.includes('102号') || q.includes('102室') || q.includes('102호') ||
    q.includes('trang diem') || q.includes('makeup') || q.includes('make up') || q.includes('make-up') || q.includes('cosmetic') ||
    q.includes('メイク') || q.includes('化粧') || q.includes('메이크업') || q.includes('화장')
  ) {
    return {
      text: '💄 <b>Phòng 102 – Tòa nhà N03 (Beauty & Makeup Lab / 美容・メイク実習室 / 뷰티·메이크업 실습실):</b><br>• Là <b>Phòng thực hành Chăm sóc sắc đẹp – Trang điểm</b>, được trang bị hệ thống gương đèn chuyên nghiệp và dụng cụ trang điểm hiện đại cho sinh viên thực hành.',
      scene: 'n03',
      marzId: '37-phng-thc-hnh-sc-p-trang-im',
      btnText: 'Đi vào Phòng 102 - Thực Hành Trang Điểm (Tòa N03)'
    };
  }

  if (
    /\b(103|p103|p\.103)\b/.test(q) || q.includes('103号') || q.includes('103室') || q.includes('103호') ||
    q.includes('da mat') || q.includes('dieu tri da') || q.includes('cham soc da') || q.includes('spa') ||
    q.includes('facial') || q.includes('skincare') || q.includes('skin care') || q.includes('esthetic') ||
    q.includes('フェイシャル') || q.includes('スキンケア') || q.includes('エステ') || q.includes('スパ') ||
    q.includes('피부') || q.includes('피부관리') || q.includes('스킨케어') || q.includes('스파') || q.includes('에스테틱')
  ) {
    return {
      text: '💆‍♀️ <b>Phòng 103 – Tòa nhà N03 (Facial Skincare & Spa Lab / フェイシャル実習室 / 피부관리 실습실):</b><br>• Là <b>Phòng thực hành Chăm sóc sắc đẹp – Điều trị da mặt (Spa)</b>, trang bị hệ thống giường Spa, máy soi da và thiết bị chăm sóc da công nghệ cao.',
      scene: 'n03',
      marzId: '38-phng-thc-hnh-sc-p-iu-tr-da-mt',
      btnText: 'Đi vào Phòng 103 - Thực Hành Điều Trị Da Mặt (Tòa N03)'
    };
  }

  if (
    /\b(105|p105|p\.105)\b/.test(q) || q.includes('105号') || q.includes('105室') || q.includes('105호') ||
    q.includes('trung bay') || q.includes('chung bay') || (q.includes('do hoa') && q.includes('n03')) ||
    q.includes('showroom') || q.includes('exhibition') || q.includes('gallery') ||
    q.includes('展示室') || q.includes('デザイン展示') || q.includes('전시실') || q.includes('디자인전시')
  ) {
    return {
      text: '🎨 <b>Phòng 105 – Tòa nhà N03 (Graphic Design Showroom / デザイン展示室 / 그래픽디자인 전시실):</b><br>• Là <b>Phòng trưng bày Thiết kế đồ họa</b>, nơi trưng bày các đồ án, tác phẩm sáng tạo và ấn phẩm thiết kế của sinh viên ngành Thiết kế đồ họa CTECH.',
      scene: 'n03',
      marzId: '39-phng-chng-by-ca-thit-k--ha',
      btnText: 'Đi vào Phòng 105 - Trưng Bày Thiết Kế Đồ Họa (Tòa N03)'
    };
  }

  if (
    /\b(106|p106|p\.106)\b/.test(q) || q.includes('106号') || q.includes('106室') || q.includes('106호') ||
    q.includes('che bien') || q.includes('mon an') || q.includes('nau an') || q.includes('am thuc') || q.includes('bep') ||
    q.includes('culinary') || q.includes('cooking') || q.includes('kitchen') || q.includes('chef') ||
    q.includes('調理') || q.includes('料理') || q.includes('キッチン') ||
    q.includes('조리') || q.includes('요리') || q.includes('주방')
  ) {
    return {
      text: '👨‍🍳 <b>Phòng 106 – Tòa nhà N04 (Culinary Arts Lab / 調理技術実習室 / 조리기술 실습실):</b><br>• Là <b>Phòng thực hành Kỹ thuật Chế biến món ăn</b>, trang bị hệ thống bếp Á – Âu, bàn sơ chế inox và thiết bị ẩm thực đạt chuẩn nhà hàng – khách sạn.',
      scene: 'n04',
      marzId: '50-phng-thc-hnh-ch-bin',
      btnText: 'Đi vào Phòng 106 - Thực Hành Chế Biến Món Ăn (Tòa N04)'
    };
  }

  if (
    q.includes('dieu duong') || q.includes('y ta') ||
    q.includes('nursing') || q.includes('nurse') ||
    q.includes('看護') || q.includes('ナース') || q.includes('介護') ||
    q.includes('간호') ||
    ((/\b(101|p101|p\.101)\b/.test(q) || q.includes('101号') || q.includes('101호')) && q.includes('n03'))
  ) {
    return {
      text: '🩺 <b>Phòng 101 – Tòa nhà N03 (Nursing Practice Lab / 看護実習室 / 간호 실습실):</b><br>• Là <b>Phòng thực hành Điều dưỡng</b>, trang bị giường bệnh tiêu chuẩn, mô hình giải phẫu và dụng cụ y khoa phục vụ sinh viên khối ngành Sức khỏe.',
      scene: 'n03',
      marzId: '36-phng-thc-hnh-iu-dng',
      btnText: 'Đi vào Phòng 101 - Thực Hành Điều Dưỡng (Tòa N03)'
    };
  }

  if (
    q.includes('y te') || q.includes('benh xa') || q.includes('kham suc khoe') || q.includes('thuoc') || q.includes('so cuu') ||
    q.includes('medical') || q.includes('clinic') || q.includes('infirmary') || q.includes('health room') || q.includes('first aid') ||
    q.includes('医務室') || q.includes('保健室') || q.includes('クリニック') || q.includes('救護') ||
    q.includes('보건실') || q.includes('양호실') || q.includes('의무실') || q.includes('진료실') ||
    ((/\b(101|p101|p\.101)\b/.test(q) || q.includes('101号') || q.includes('101호')) && q.includes('n04'))
  ) {
    return {
      text: '🏥 <b>Phòng Y tế CTECH (Campus Medical Clinic / 医務室 / 보건실):</b><br>• Đặt tại <b>Phòng 101 – Tòa nhà N04</b>, luôn túc trực chăm sóc sức khỏe ban đầu cho sinh viên.',
      scene: 'n04',
      marzId: '47-phng-y-t-n04',
      btnText: 'Đi vào Phòng Y Tế (P.101 - Tòa N04)'
    };
  }

  if (/\b(101|p101|p\.101)\b/.test(q) || q.includes('101号') || q.includes('101室') || q.includes('101호')) {
    return {
      text: '📍 <b>Các phòng 101 tại trường CTECH (Room 101 / 101号室 / 101호):</b><br>' +
            '• <b>Phòng 101 – Tòa N03:</b> <b>Phòng thực hành Điều dưỡng</b> (Nursing Lab / 看護実習室 / 간호 실습실).<br>' +
            '• <b>Phòng 101 – Tòa N04:</b> <b>Phòng Y tế</b> (Medical Clinic / 医務室 / 보건실).<br>' +
            '• <b>Tầng 1 – Tòa N01:</b> <b>Phòng Công tác Học sinh - Sinh viên & Tuyển sinh</b>.',
      scene: 'n03',
      extraButtons: [
        { scene: 'n03', marzId: '36-phng-thc-hnh-iu-dng', btnText: 'Đi vào P.101 N03 (Thực Hành Điều Dưỡng)' },
        { scene: 'n04', marzId: '47-phng-y-t-n04', btnText: 'Đi vào P.101 N04 (Phòng Y Tế)' },
        { scene: 'n01', marzId: '3-phng-cng-tc-tuyn-sinh', btnText: 'Đi vào Phòng Công Tác HSSV (Tòa N01)' }
      ]
    };
  }

  if (
    q.includes('sac dep') || q.includes('tham my') || q.includes('lam dep') ||
    q.includes('beauty') || q.includes('cosmetology') ||
    q.includes('美容') || q.includes('ビューティ') ||
    q.includes('뷰티') || q.includes('미용')
  ) {
    return {
      text: '💄💆‍♀️ <b>Khu thực hành Chăm sóc sắc đẹp tại Tòa nhà N03 (Beauty Labs / 美容実習室 / 뷰티 실습실):</b><br>' +
            '• <b>Phòng 102 – Tòa N03:</b> Phòng thực hành Chăm sóc sắc đẹp – Trang điểm (Makeup Lab).<br>' +
            '• <b>Phòng 103 – Tòa N03:</b> Phòng thực hành Chăm sóc sắc đẹp – Điều trị da mặt (Facial & Spa Lab).',
      scene: 'n03',
      extraButtons: [
        { scene: 'n03', marzId: '37-phng-thc-hnh-sc-p-trang-im', btnText: 'Đi vào P.102 - Thực Hành Trang Điểm (N03)' },
        { scene: 'n03', marzId: '38-phng-thc-hnh-sc-p-iu-tr-da-mt', btnText: 'Đi vào P.103 - Thực Hành Điều Trị Da Mặt (N03)' }
      ]
    };
  }

  if (
    q.includes('do hoa') || q.includes('thiet ke') ||
    q.includes('graphic') || q.includes('design') ||
    q.includes('グラフィック') || q.includes('デザイン') ||
    q.includes('그래픽') || q.includes('디자인')
  ) {
    return {
      text: '🎨💻 <b>Khu vực ngành Thiết kế đồ họa tại CTECH (Graphic Design / デザイン / 그래픽디자인):</b><br>' +
            '• <b>Phòng 105 – Tòa N03:</b> Phòng trưng bày các tác phẩm Thiết kế đồ họa (Showroom).<br>' +
            '• <b>Tòa N04:</b> Phòng thực hành máy tính Thiết kế đồ họa (Graphic Design Lab).',
      scene: 'n03',
      extraButtons: [
        { scene: 'n03', marzId: '39-phng-chng-by-ca-thit-k--ha', btnText: 'Đi vào P.105 N03 (Phòng Trưng Bày Đồ Họa)' },
        { scene: 'n04', marzId: '48-phng-thc-hnh-thit-k--ha-n04', btnText: 'Đi vào Phòng Thực Hành Đồ Họa (Tòa N04)' }
      ]
    };
  }

  if (
    q.includes('hoc sinh') || q.includes('sinh vien') || q.includes('hssv') || q.includes('hs-sv') || q.includes('hs sv') || q.includes('cong tac') || q.includes('tuyen sinh') ||
    q.includes('student affairs') || q.includes('admission') || q.includes('student office') || q.includes('student support') ||
    q.includes('学生課') || q.includes('学生支援') || q.includes('入学課') || q.includes('入学相談') || q.includes('入試') ||
    q.includes('학생처') || q.includes('학생지원') || q.includes('학생과') || q.includes('입학처') || q.includes('입학상담')
  ) {
    return {
      text: '🎓 <b>Phòng Công tác Học sinh – Sinh viên & Tuyển sinh (Student Affairs & Admissions / 学生支援課・入学課 / 학생지원처·입학처):</b><br>• Đặt tại <b>Tầng 1 – Tòa nhà N01</b> (đi từ Sảnh chính N01 vào).<br>• 📞 Hotline: <b>1800 6770</b> | <b>0986 301 916</b>.',
      scene: 'n01',
      marzId: '3-phng-cng-tc-tuyn-sinh',
      btnText: 'Đi vào Phòng Công Tác Học Sinh - Sinh Viên (Tòa N01)'
    };
  }

  if (
    q.includes('hoi truong') ||
    q.includes('auditorium') || q.includes('assembly hall') || q.includes('main hall') ||
    q.includes('講堂') || q.includes('大講堂') || q.includes('ホール') ||
    q.includes('강당') || q.includes('대강당')
  ) {
    return {
      text: '🎤 <b>Hội trường lớn CTECH (Grand Auditorium / 大講堂 / 대강당):</b><br>• Nằm tại <b>Tầng 1 – Tòa nhà N01</b>, được trang bị sân khấu lớn, màn hình LED và hệ thống âm thanh ánh sáng hiện đại.',
      scene: 'n01',
      marzId: '1-hi-trng-n01',
      btnText: 'Đi vào Hội Trường Lớn (Tòa N01)'
    };
  }

  if (
    q.includes('tieng nhat') || q.includes('van hoa nhat') || q.includes('phong nhat') ||
    q.includes('japanese') || q.includes('japan culture') ||
    q.includes('日本語') || q.includes('日本文化') ||
    q.includes('일본어') || q.includes('일본문화')
  ) {
    return {
      text: '🌸 <b>Phòng Tiếng Nhật lớn & Phòng Tiếng Nhật bé (Japanese Classrooms / 日本語教室・日本文化室 / 일본어 강의실):</b><br>• Nằm tại <b>Tòa nhà N01</b>.',
      scene: 'n01',
      extraButtons: [
        { scene: 'n01', marzId: '6-phng-ting-nht-ln', btnText: 'Đi vào Phòng Tiếng Nhật Lớn (Tòa N01)' },
        { scene: 'n01', marzId: '7-phng-ting-nht-b', btnText: 'Đi vào Phòng Tiếng Nhật Bé (Tòa N01)' }
      ]
    };
  }

  if (
    q.includes('ngoai ngu') || q.includes('tieng anh') || q.includes('tieng han') || q.includes('tieng trung') || q.includes('tieng hoa') ||
    q.includes('foreign language') || q.includes('language center') || q.includes('chinese') ||
    q.includes('外国語') || q.includes('中国語') || q.includes('語学') ||
    q.includes('외국어') || q.includes('중국어') || q.includes('어학')
  ) {
    return {
      text: '🌏 <b>Trung tâm Ngoại ngữ (Tầng 2) & Phòng học Tiếng Hán (Foreign Language Center & Chinese Classroom / 外国語センター・中国語教室 / 외국어센터·중국어 강의실):</b><br>• Đặt tại <b>Tòa nhà N04</b>.',
      scene: 'n04',
      extraButtons: [
        { scene: 'n04', marzId: '49-trung-tm-ngoi-ng-tng-2-n04', btnText: 'Đi vào Trung Tâm Ngoại Ngữ (Tầng 2 - N04)' },
        { scene: 'n04', marzId: '41-phng-hc-ting-hn-ta-n04', btnText: 'Đi vào Phòng Học Tiếng Hán (Tòa N04)' }
      ]
    };
  }

  if (
    q.includes('cntt') || q.includes('cong nghe thong tin') || q.includes('lap trinh') || q.includes('may tinh') || q.includes('phan mem') || q.includes('phong may') ||
    q.includes('computer') || q.includes('it lab') || q.includes('information technology') || q.includes('programming') || q.includes('software') ||
    q.includes('コンピュータ') || q.includes('パソコン') || q.includes('情報技術') || q.includes('プログラミング') || q.includes('it実習') ||
    q.includes('컴퓨터') || q.includes('정보기술') || q.includes('프로그래밍') || q.includes('it실습')
  ) {
    return {
      text: '💻 <b>Phòng thực hành máy tính Khoa CNTT (IT Computer Lab / コンピュータ実習室 / 컴퓨터 실습실):</b><br>• Nằm tại <b>Tòa nhà N01</b>.',
      scene: 'n01',
      marzId: '4-phng-thc-hnh-my',
      btnText: 'Đi vào Phòng Thực Hành Máy Tính CNTT (Tòa N01)'
    };
  }

  if (
    q.includes('o to') || q.includes('oto') || q.includes('xuong') || q.includes('co khi') ||
    q.includes('automotive') || q.includes('car workshop') || q.includes('auto workshop') || q.includes('garage') || q.includes('mechanical') || q.includes('automobile') ||
    q.includes('自動車') || q.includes('車') || q.includes('工房') || q.includes('機械') ||
    q.includes('자동차') || q.includes('공방') || q.includes('기계') || q.includes('정비')
  ) {
    return {
      text: '🚗 <b>Xưởng thực hành Công nghệ Ô tô (Automotive Workshop / 自動車実習工房 / 자동차 실습공방):</b><br>• Nằm ngay tầng 1 <b>Tòa nhà N02</b>.',
      scene: 'n02',
      marzId: '14-bn-trong-xng--t',
      btnText: 'Đi vào Bên Trong Xưởng Ô Tô (Tòa N02)'
    };
  }

  if (
    q.includes('phong dien') || q.includes('thuc hanh dien') || q.includes('dien cong nghiep') ||
    q.includes('electrical') || q.includes('electric lab') || q.includes('electricity') || q.includes('electronics') ||
    q.includes('電気') || q.includes('電子') ||
    q.includes('전기') || q.includes('전자')
  ) {
    return {
      text: '⚡ <b>Phòng thực hành Điện (Electrical Lab / 電気実習室 / 전기 실습실):</b><br>• Nằm tại <b>Tầng 2 – Tòa nhà N02</b>.',
      scene: 'n02',
      marzId: '17-bn-trong-phng-in-n02',
      btnText: 'Đi vào Phòng Thực Hành Điện (Tầng 2 - N02)'
    };
  }

  if (
    q.includes('cau long') || q.includes('badminton') ||
    q.includes('バドミントン') || q.includes('배드민턴')
  ) {
    return {
      text: '🏸 <b>Sân cầu lông trong nhà (Indoor Badminton Court / 屋内バドミントンコート / 실내 배드민턴장):</b><br>• Nằm tại <b>Tầng 2 – Tòa nhà N02</b>.',
      scene: 'n02',
      marzId: '19-sn-cu-lng-n02',
      btnText: 'Đi vào Sân Cầu Lông Trong Nhà (Tòa N02)'
    };
  }

  if (
    q.includes('cang tin') || q.includes('can tin') || q.includes('canteen') || q.includes('an uong') ||
    q.includes('cafeteria') || q.includes('dining') || q.includes('food court') ||
    q.includes('食堂') || q.includes('学食') || q.includes('カフェテリア') ||
    q.includes('식당') || q.includes('학생식당') || q.includes('학식') || q.includes('구내식당') || q.includes('카페테리아')
  ) {
    return {
      text: '🍽️ <b>Căng tin sinh viên (Student Canteen / 学生食堂 / 학생식당):</b><br>• Nằm tại <b>Tầng 1 – Tòa nhà N05</b>.',
      scene: 'n05',
      marzId: '26-cng-tin-n05',
      btnText: 'Đi vào Căng Tin Tầng 1 (Tòa N05)'
    };
  }

  if (
    q.includes('thu vien') || q.includes('muon sach') || q.includes('doc sach') ||
    q.includes('library') || q.includes('reading room') ||
    q.includes('図書館') || q.includes('図書室') ||
    q.includes('도서관') || q.includes('열람실')
  ) {
    return {
      text: '📚 <b>Thư viện trung tâm & Phòng họp thư viện (CTECH Central Library / 中央図書館 / 중앙도서관):</b><br>• Nằm tại <b>Tầng 4 – Tòa nhà N05</b>.',
      scene: 'n05',
      marzId: '28-th-vin-n05',
      btnText: 'Đi vào Thư Viện Tầng 4 (Tòa N05)'
    };
  }

  if (
    q.includes('hieu bo') || q.includes('ban giam hieu') || q.includes('bgh') || q.includes('van phong khoa') || q.includes('vpk') || q.includes('ke toan') || q.includes('dao tao') || q.includes('giao vien') ||
    q.includes('accounting') || q.includes('training office') || q.includes('academic affairs') || q.includes('administration') || q.includes('executive board') || q.includes('faculty office') ||
    q.includes('経理') || q.includes('教務') || q.includes('理事会') || q.includes('教員室') || q.includes('事務室') || q.includes('本部') || q.includes('会計') ||
    q.includes('회계') || q.includes('교무') || q.includes('교무실') || q.includes('학부사무실') || q.includes('이사회') || q.includes('대학본부') || q.includes('행정실')
  ) {
    return {
      text: '🏢 <b>Phòng Giáo viên, Phòng Kế toán và Phòng Đào tạo (Faculty, Accounting & Training Offices / 教員室・経理課・教務課 / 교무실·회계과·교육과):</b><br>• Đặt tại <b>Tầng 2 – Tòa nhà N05</b>.',
      scene: 'n05',
      marzId: '27-phng-gio-vin-k-ton-o-to',
      btnText: 'Đi vào Phòng Giáo Viên, Kế Toán, Đào Tạo (Tòa N05)'
    };
  }

  if (
    q.includes('quang truong') || q.includes('hoa sen') ||
    q.includes('square') || q.includes('lotus') || q.includes('courtyard') || q.includes('plaza') ||
    q.includes('広場') || q.includes('ロータス') || q.includes('コートヤード') ||
    q.includes('광장') || q.includes('연꽃')
  ) {
    return {
      text: '🌸 <b>Quảng trường Hoa Sen CTECH (CTECH Lotus Square / ロータス広場 / 연꽃 광장):</b><br>• Nằm ngay phía mặt sau của <b>Tòa N02</b>, là không gian sinh hoạt chung và tổ chức sự kiện lớn của sinh viên.',
      scene: 'square',
      marzId: '54-gia-sn-ctech',
      btnText: SCENE_BUTTON_NAMES.square
    };
  }

  if (
    q.includes('san bong') || q.includes('the chat') || q.includes('the thao') ||
    q.includes('football') || q.includes('soccer') || q.includes('stadium') || q.includes('sports') || q.includes('pitch') ||
    q.includes('サッカー') || q.includes('スポーツ') || q.includes('体育') || q.includes('グラウンド') ||
    q.includes('축구') || q.includes('체육') || q.includes('운동장') || q.includes('스포츠')
  ) {
    return {
      text: '⚽ <b>Khu Thể chất & Sân bóng đá cỏ nhân tạo (Sports Complex & Football Pitch / サッカー場 / 인조잔디 축구장):</b><br>• Nằm ở phía bên trái khuôn viên trường.',
      scene: 'sports',
      marzId: '58-sn-bng',
      btnText: SCENE_BUTTON_NAMES.sports
    };
  }

  if (
    q.includes('cong chinh') || q.includes('cong truong') || q.includes('cong phu') || q.includes('vom hoa') ||
    q.includes('main gate') || q.includes('school gate') || q.includes('secondary gate') || q.includes('flower arch') ||
    q.includes('正門') || q.includes('校門') || q.includes('通用門') || q.includes('副門') || q.includes('フラワーアーチ') ||
    q.includes('정문') || q.includes('교문') || q.includes('부문') || q.includes('꽃아치')
  ) {
    const isArch = q.includes('vom hoa') || q.includes('flower arch') || q.includes('フラワーアーチ') || q.includes('꽃아치');
    return {
      text: isArch
        ? '🌺 <b>Khu Vòm hoa khuôn viên CTECH (Flower Arch / フラワーアーチ / 꽃아치):</b><br>• Lối đi cảnh quan xanh mát kết nối giữa các tòa nhà.'
        : '🏫 <b>Cổng chính Trường Cao đẳng CTECH (Main Gate / 正門 / 정문):</b><br>• Lối vào chính tại Số 60 Quốc lộ 1A, Thường Tín, Hà Nội.',
      scene: 'campus',
      marzId: isArch ? '44-bn-trong-vm-hoa-gia-hai-ta' : '9-ngoi-cng-chnh',
      btnText: isArch ? 'Đi tới Vòm Hoa Giữa Hai Tòa' : 'Đi tới Cổng Chính Trường CTECH'
    };
  }

  if (/\b(n01|no1|n1|toa 1|building 1|block 1)\b/.test(q) || q.includes('n01棟') || q.includes('n01동')) {
    return {
      text: '🏢 <b>Tòa N01 (Ngay đầu cổng vào):</b> Gồm Sảnh N01, Phòng Công tác Học sinh - Sinh viên & Tuyển sinh, Hội trường lớn, Phòng thực hành máy CNTT và Phòng Tiếng Nhật lớn & bé.',
      scene: 'n01',
      marzId: '2-bn-ngoi-n01',
      btnText: SCENE_BUTTON_NAMES.n01
    };
  }
  if (/\b(n02|no2|n2|toa 2|building 2|block 2)\b/.test(q) || q.includes('n02棟') || q.includes('n02동')) {
    return {
      text: '🏢 <b>Tòa N02 (Trung tâm trường):</b> Gồm Xưởng thực hành Ô tô (Tầng 1), Phòng thực hành Điện & Sân cầu lông (Tầng 2), Khu Ký túc xá sinh viên (Tầng 3).',
      scene: 'n02',
      marzId: '13-mt-chnh-xng--t',
      btnText: SCENE_BUTTON_NAMES.n02
    };
  }
  if (/\b(n03|no3|n3|toa 3|building 3|block 3)\b/.test(q) || q.includes('n03棟') || q.includes('n03동')) {
    return {
      text: '🏢 <b>Tòa N03:</b><br>' +
            '• <b>Phòng 101:</b> Phòng thực hành Điều dưỡng.<br>' +
            '• <b>Phòng 102:</b> Phòng thực hành Sắc đẹp – Trang điểm.<br>' +
            '• <b>Phòng 103:</b> Phòng thực hành Sắc đẹp – Điều trị da mặt (Spa).<br>' +
            '• <b>Phòng 105:</b> Phòng trưng bày Thiết kế đồ họa.<br>' +
            '• <b>Tầng 2:</b> Hệ thống Phòng học lớn.',
      scene: 'n03',
      marzId: '35-chnh-gia-ta-n03',
      btnText: SCENE_BUTTON_NAMES.n03
    };
  }
  if (/\b(n04|no4|n4|toa 4|building 4|block 4)\b/.test(q) || q.includes('n04棟') || q.includes('n04동')) {
    return {
      text: '🏢 <b>Tòa N04:</b><br>' +
            '• <b>Phòng 101:</b> Phòng Y tế.<br>' +
            '• <b>Phòng 106:</b> Phòng thực hành Kỹ thuật Chế biến món ăn.<br>' +
            '• Phòng học Tiếng Hán & Phòng thực hành Thiết kế đồ họa N04.<br>' +
            '• <b>Tầng 2:</b> Trung tâm Ngoại ngữ CTECH.',
      scene: 'n04',
      marzId: '46-chnh-gia-ta-n04',
      btnText: SCENE_BUTTON_NAMES.n04
    };
  }
  if (/\b(n05|no5|n5|toa 5|building 5|block 5)\b/.test(q) || q.includes('n05棟') || q.includes('n05동')) {
    return {
      text: '🏢 <b>Tòa N05:</b><br>• <b>Tầng 1:</b> Căng tin sinh viên.<br>• <b>Tầng 2:</b> Văn phòng Giáo viên, Kế toán, Đào tạo.<br>• <b>Tầng 4:</b> Thư viện & Phòng họp thư viện.',
      scene: 'n05',
      marzId: '25-trc-ca-ta-n05-cng-tin',
      btnText: SCENE_BUTTON_NAMES.n05
    };
  }

  // -----------------------------------------------------------------------
  // BƯỚC C: THUẬT TOÁN CHẤM ĐIỂM TỪ KHÓA (SMART TOKEN SCORING) TRÊN 62 CẢNH
  // (Giúp bắt trúng mọi câu hỏi dài bằng Tiếng Việt, Anh, Nhật, Hàn mà không cần API)
  // -----------------------------------------------------------------------
  if (typeof SCENES === 'object' && q.length >= 2) {
    const stopWords = new Set([
      'cho', 'hoi', 'minh', 'em', 'anh', 'chi', 'toi', 'muon', 'tim', 'xem', 'di', 'vao', 'toi', 'den', 'dau', 'la', 'gi', 'o', 'nao', 'cua', 'truong', 'ctech', 'toa', 'nha', 'khu', 'vuc', 'phong', 'tang',
      'where', 'is', 'the', 'how', 'to', 'go', 'find', 'show', 'me', 'take', 'can', 'i', 'see', 'in', 'at', 'of', 'building', 'room', 'floor',
      'どこ', 'ですか', 'にありますか', '行く', '見たい', '場所', '어디', '에', '있나요', '있어요', '가는길', '보여줘'
    ]);

    const tokens = q
      .replace(/[?,!.()[\]"':;/-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !stopWords.has(w));

    let bestMatch = null;
    let bestScore = 0;

    for (const sceneKey of Object.keys(SCENES)) {
      const sceneObj = SCENES[sceneKey];
      if (!Array.isArray(sceneObj.subItems)) continue;

      for (const sub of sceneObj.subItems) {
        const lblVi = removeAccents(sub.label?.vi || '');
        const lblEn = removeAccents(sub.label?.en || '');
        const lblJa = removeAccents(sub.label?.ja || '');
        const lblKo = removeAccents(sub.label?.ko || '');
        const combined = `${lblVi} | ${lblEn} | ${lblJa} | ${lblKo}`;

        let score = 0;
        if (lblVi && (q.includes(lblVi) || lblVi.includes(q))) score += 10;
        if (lblEn && (q.includes(lblEn) || lblEn.includes(q))) score += 10;
        if (lblJa && (q.includes(lblJa) || lblJa.includes(q))) score += 10;
        if (lblKo && (q.includes(lblKo) || lblKo.includes(q))) score += 10;

        for (const tk of tokens) {
          if (combined.includes(tk)) {
            score += (tk.length >= 4 ? 3 : 2);
          }
        }

        if (score > bestScore && score >= 4) {
          bestScore = score;
          bestMatch = { sceneKey, sub };
        }
      }
    }

    if (bestMatch) {
      const { sceneKey, sub } = bestMatch;
      return {
        text: `📍 <b>${sub.label.vi}</b><br>` +
              `• <b>EN:</b> ${sub.label.en || ''}<br>` +
              `• <b>JA:</b> ${sub.label.ja || ''}<br>` +
              `• <b>KO:</b> ${sub.label.ko || ''}`,
        scene: sceneKey,
        marzId: sub.marzipanoId,
        btnText: 'Đi vào ' + sub.label.vi
      };
    }
  }

  if (
    q.includes('dien thoai') || q.includes('lien he') || q.includes('hotline') || q.includes('dia chi') || q.includes('o dau') ||
    q.includes('contact') || q.includes('address') || q.includes('phone') || q.includes('location') ||
    q.includes('住所') || q.includes('連絡先') || q.includes('電話') || q.includes('場所') ||
    q.includes('주소') || q.includes('연락처') || q.includes('전화') || q.includes('위치')
  ) {
    return {
      text: '📞 <b>Thông tin Liên hệ Trường Cao đẳng Kỹ thuật – Công nghệ Bách Khoa (CTECH):</b><br>' +
            '• <b>Cơ sở Hà Nội:</b> Số 60 Quốc lộ 1A, Thường Tín, Hà Nội.<br>' +
            '• <b>Cơ sở Cần Thơ:</b> Số 57 Cách Mạng Tháng 8, Q. Bình Thủy, TP. Cần Thơ.<br>' +
            '• <b>Hotline miễn phí:</b> <b>1800 6770</b> | <b>0986 301 916</b>.<br>' +
            '• <b>Website:</b> ctech.edu.vn',
      scene: 'campus',
      marzId: '9-ngoi-cng-chnh',
      btnText: 'Đi tới Cổng Chính Trường CTECH'
    };
  }

  return {
    isDefaultFallback: true,
    text: `🏫 <b>Sơ đồ chi tiết 5 tòa nhà & số phòng CTECH (cho câu hỏi <i>"${rawInput}"</i>):</b><br>` +
          `• <b>Tòa N01 (Đầu cổng):</b> Sảnh N01, Phòng Công tác HSSV & Tuyển sinh, Hội trường, Thực hành CNTT, Tiếng Nhật.<br>` +
          `• <b>Tòa N02 (Giữa trường):</b> Xưởng Ô tô, Phòng Điện, Sân cầu lông, Ký túc xá (Tầng 3).<br>` +
          `• <b>Tòa N03:</b> <b>P.101</b> Điều dưỡng, <b>P.102</b> Sắc đẹp - Trang điểm, <b>P.103</b> Điều trị da mặt, <b>P.105</b> Trưng bày Đồ họa, Phòng học lớn.<br>` +
          `• <b>Tòa N04:</b> <b>P.101</b> Phòng Y tế, <b>P.106</b> Thực hành Chế biến món ăn, TT Ngoại ngữ, Tiếng Hán.<br>` +
          `• <b>Tòa N05:</b> Tầng 1 Căng tin; Tầng 2 Kế toán, Đào tạo; Tầng 4 Thư viện.`,
    scene: 'overview',
    btnText: SCENE_BUTTON_NAMES.overview
  };
}

window.toggleChatbot = toggleChatbot;
window.sendQuickQuestion = sendQuickQuestion;
window.handleChatSubmit = handleChatSubmit;
window.getCTECHBotResponse = getLocalSmartFallback;

window.addEventListener('DOMContentLoaded', () => {
  renderSidebarMenu();
  updateTextsForCurrentLanguage();
});

// =========================================================================
// TỰ ĐỘNG KHÔI PHỤC HÌNH ẢNH TRƯỜNG CTECH Ở BÊN TRÁI MÀN HÌNH MỞ ĐẦU
// =========================================================================
(function restoreLeftSplashImages() {
  // Ưu tiên nạp thẳng từ thư mục img/ với đuôi chữ thường .jpg
  const candidates1 = ['img/anh360.jpg', 'anh360.jpg', 'img/anh360.JPG', 'anh360.JPG'];
  const candidates2 = ['img/anh360_2.jpg', 'anh360_2.jpg', 'img/anh360_2.JPG', 'anh360_2.JPG'];

  function setWedgeBg(list, selector) {
    let idx = 0;
    function tryNext() {
      if (idx >= list.length) return;
      const src = list[idx++];
      const img = new Image();
      img.onload = () => {
        document.querySelectorAll(selector).forEach(el => {
          el.style.backgroundImage = `url('${src}')`;
        });
      };
      img.onerror = tryNext;
      img.src = src;
    }
    tryNext();
  }

  setWedgeBg(candidates1, '.wedge-1');
  setWedgeBg(candidates2, '.wedge-2, .wedge-3');
})();

// =========================================================================
// TỐI ƯU TƯƠNG TÁC ĐIỆN THOẠI: TỰ THU GỌN MENU, CÂN CHỈNH GÓC NHÌN & ZOOM 2 NGÓN
// =========================================================================
(function setupMobileExperience() {
  let wasMobileView = null;

  function syncMobileLayout() {
    const isMobileNow = window.innerWidth <= 768;
    const sb = document.getElementById('sidebar');
    const btn = document.getElementById('toggle-sidebar-btn');

    if (isMobileNow && wasMobileView !== true) {
      if (sb) sb.classList.add('collapsed');
      document.body.classList.add('sidebar-closed');
      if (btn) btn.textContent = '▶';

      if (!isAnimatingCamera && uniforms && uniforms.uScale) {
        uniforms.uScale.value = Math.min(1.65, Math.max(uniforms.uScale.value, 1.25));
      }
    } else if (!isMobileNow && wasMobileView === true) {
      if (sb) sb.classList.remove('collapsed');
      document.body.classList.remove('sidebar-closed');
      if (btn) btn.textContent = '◀';
    }
    wasMobileView = isMobileNow;
  }

  window.addEventListener('DOMContentLoaded', syncMobileLayout);
  window.addEventListener('resize', syncMobileLayout);
  syncMobileLayout();

  const menuListEl = document.getElementById('menu-list');
  if (menuListEl) {
    menuListEl.addEventListener('click', (e) => {
      if (window.innerWidth > 768) return;
      const clickedSub = e.target.closest('.sub-nav-btn');
      const clickedMain = e.target.closest('.nav-link');

      if (clickedSub || (clickedMain && !clickedMain.querySelector('.nav-dropdown-arrow'))) {
        setTimeout(() => {
          const sb = document.getElementById('sidebar');
          const btn = document.getElementById('toggle-sidebar-btn');
          if (sb && !sb.classList.contains('collapsed')) {
            sb.classList.add('collapsed');
            document.body.classList.add('sidebar-closed');
            if (btn) btn.textContent = '▶';
          }
        }, 180);
      }
    });
  }

  let initialPinchDistance = null;
  let initialScaleValue = 1.0;

  stage.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistance = Math.hypot(dx, dy);
      initialScaleValue = uniforms.uScale.value;
    }
  }, { passive: true });

  stage.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && initialPinchDistance) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      const ratio = initialPinchDistance / Math.max(10, currentDist);
      uniforms.uScale.value = Math.max(0.35, Math.min(2.2, initialScaleValue * ratio));
    }
  }, { passive: true });

  stage.addEventListener('touchend', () => {
    initialPinchDistance = null;
  });
})();
// =========================================================================
// BẢNG HƯỚNG DẪN SỬ DỤNG MÀU XANH LÁ CÂY CTECH (HIỆN SAU KHI XOAY XONG)
// =========================================================================
(function setupCTECHUserGuideModal() {
  const GUIDE_TEXT = {
    vi: {
      header: 'HƯỚNG DẪN SỬ DỤNG',
      row1: 'Di chuyển con trỏ chuột (hoặc chạm nhẹ trên điện thoại) vào các điểm được đánh dấu để xem trước thông tin.',
      row2: 'Nhấp chuột trái (hoặc chạm tay) vào các nhãn tòa nhà và mũi tên để di chuyển đến điểm tham quan mong muốn.',
      col1: 'Cuộn nút chuột giữa (hoặc chụm/mở 2 ngón tay trên điện thoại) để phóng to hay thu nhỏ hình ảnh.',
      col2: 'Nhấp giữ chuột trái và kéo (hoặc vuốt 1 ngón tay trên màn hình) để thay đổi hướng nhìn 360° tại điểm tham quan.',
      col3: 'Sử dụng menu bên trái, Trợ lý CTECH và thanh công cụ phía dưới để chọn các nội dung (hoặc tính năng) mong muốn.'
    },
    en: {
      header: 'USER GUIDE',
      row1: 'Move the mouse cursor (or tap on mobile) over marked points to preview building information.',
      row2: 'Left-click (or tap) on building tags and arrows to move to the desired tour location.',
      col1: 'Scroll the middle mouse wheel (or pinch with 2 fingers on mobile) to zoom in or out.',
      col2: 'Click and drag with the left mouse button (or swipe with 1 finger) to rotate the 360° view.',
      col3: 'Use the left sidebar menu, AI Assistant, and bottom toolbar to select desired rooms or features.'
    },
    ja: {
      header: 'ご利用ガイド',
      row1: 'マークされたポイントにカーソルを合わせる（スマホではタップする）と、建物の情報が表示されます。',
      row2: '左クリック（またはタップ）して、希望する見学ポイントへ移動します。',
      col1: 'マウスホイールをスクロール（スマホでは2本指でピンチ）して拡大・縮小します。',
      col2: '左クリックしたままドラッグ（スマホでは1本指でスワイプ）して360°の視点を変更します。',
      col3: '左側のメニューや下部のツールバーを使用して、目的の施設や機能を選択します。'
    },
    ko: {
      header: '이용 가이드',
      row1: '표시된 지점에 마우스 커서를 올리면(모바일은 터치) 건물 정보를 미리 볼 수 있습니다.',
      row2: '마우스 왼쪽 버튼을 클릭(또는 터치)하여 원하는 참관 지점으로 이동합니다.',
      col1: '마우스 휠을 스크롤(모바일은 두 손가락으로 확대/축소)하여 화면을 확대하거나 축소합니다.',
      col2: '마우스 왼쪽 버튼을 누른 채 드래그(모바일은 한 손가락으로 스와이프)하여 360° 시점을 회전합니다.',
      col3: '왼쪽 메뉴와 하단 도구 모음을 사용하여 원하는 공간이나 기능을 선택합니다.'
    }
  };

  // 1. Tự động chèn CSS giao diện bảng Hướng dẫn màu xanh lá cây CTECH
  const style = document.createElement('style');
  style.id = 'ctech-guide-modal-style';
  style.textContent = `
    #ctech-guide-overlay {
      position: fixed;
      inset: 0;
      z-index: 450;
      background: rgba(0, 24, 14, 0.55);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 0.35s ease, visibility 0.35s ease;
    }
    #ctech-guide-overlay.show-guide {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }
    .ctech-guide-box {
      position: relative;
      width: 780px;
      max-width: 95vw;
      background: linear-gradient(180deg, rgba(0, 107, 63, 0.96) 0%, rgba(0, 78, 45, 0.97) 100%);
      border-radius: 10px;
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(110, 231, 183, 0.35);
      padding: 14px 16px 16px 16px;
      color: #ffffff;
      transform: scale(0.92) translateY(12px);
      transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
    }
    #ctech-guide-overlay.show-guide .ctech-guide-box {
      transform: scale(1) translateY(0);
    }
    .ctech-guide-header {
      position: relative;
      text-align: center;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding-bottom: 11px;
      color: #ffffff;
    }
    .ctech-guide-close {
      position: absolute;
      top: -2px;
      right: 2px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 1.5px solid rgba(255, 255, 255, 0.85);
      background: transparent;
      color: #ffffff;
      font-size: 14px;
      font-weight: 700;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, transform 0.2s, border-color 0.2s;
    }
    .ctech-guide-close:hover {
      background: rgba(250, 204, 21, 0.25);
      border-color: #fde047;
      color: #fde047;
      transform: scale(1.1);
    }
    .ctech-guide-inner {
      border: 1.5px solid rgba(255, 255, 255, 0.88);
      border-radius: 12px;
      padding: 26px 34px 24px 34px;
      background: rgba(0, 60, 34, 0.28);
    }
    .ctech-guide-top-rows {
      display: flex;
      flex-direction: column;
      gap: 22px;
      margin-bottom: 28px;
    }
    .ctech-guide-row {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    .ctech-guide-row-icons {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 195px;
      flex-shrink: 0;
    }
    .ctech-guide-row-text {
      font-size: 14.5px;
      font-style: italic;
      line-height: 1.5;
      color: #f0fdf4;
    }
    .ctech-guide-bottom-cols {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      padding-top: 6px;
      border-top: 1px dashed rgba(255, 255, 255, 0.25);
    }
    .ctech-guide-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: left;
      padding-top: 14px;
    }
    .ctech-guide-col svg {
      width: 68px;
      height: 68px;
      margin-bottom: 12px;
      flex-shrink: 0;
    }
    .ctech-guide-col-text {
      font-size: 13.8px;
      font-style: italic;
      line-height: 1.48;
      color: #f0fdf4;
    }

    @media (max-width: 768px) {
      .ctech-guide-box {
        padding: 12px;
        max-height: 88vh;
        display: flex;
        flex-direction: column;
      }
      .ctech-guide-header {
        font-size: 14px;
        padding-bottom: 8px;
      }
      .ctech-guide-inner {
        padding: 14px 14px;
        overflow-y: auto;
      }
      .ctech-guide-top-rows {
        gap: 14px;
        margin-bottom: 16px;
      }
      .ctech-guide-row {
        gap: 12px;
      }
      .ctech-guide-row-icons {
        width: 112px;
      }
      .ctech-guide-row-icons svg {
        width: 44px;
        height: 44px;
      }
      .ctech-guide-row-text {
        font-size: 12px;
      }
      .ctech-guide-bottom-cols {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      .ctech-guide-col {
        flex-direction: row;
        gap: 14px;
        padding-top: 8px;
      }
      .ctech-guide-col svg {
        width: 48px;
        height: 48px;
        margin-bottom: 0;
      }
      .ctech-guide-col-text {
        font-size: 12px;
      }
    }
  `;
  document.head.appendChild(style);

  // 2. Tự động tạo khung HTML bảng Hướng dẫn sử dụng
  const overlay = document.createElement('div');
  overlay.id = 'ctech-guide-overlay';
  overlay.innerHTML = `
    <div class="ctech-guide-box" onclick="event.stopPropagation()">
      <div class="ctech-guide-header">
        <span id="guide-ui-header">HƯỚNG DẪN SỬ DỤNG</span>
        <button type="button" class="ctech-guide-close" id="ctech-guide-close-btn" title="Đóng hướng dẫn">✕</button>
      </div>
      <div class="ctech-guide-inner">
        <div class="ctech-guide-top-rows">
          <!-- Hàng 1: Điểm đánh dấu + Con trỏ chuột -->
          <div class="ctech-guide-row">
            <div class="ctech-guide-row-icons">
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="27" fill="none" stroke="#ffffff" stroke-width="2.2"/>
                <circle cx="32" cy="32" r="20" fill="none" stroke="#ffffff" stroke-width="2"/>
                <circle cx="32" cy="32" r="6" fill="none" stroke="#f97316" stroke-width="2.5"/>
              </svg>
              <svg width="56" height="56" viewBox="0 0 64 64">
                <path d="M18 14 L46 28 L34 33 L43 45 L37 49 L28 37 L22 45 Z" fill="none" stroke="#ffffff" stroke-width="2.8" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="ctech-guide-row-text" id="guide-ui-row1"></div>
          </div>

          <!-- Hàng 2: Mũi tên di chuyển + Click chuột/chạm tay -->
          <div class="ctech-guide-row">
            <div class="ctech-guide-row-icons">
              <svg width="64" height="54" viewBox="0 0 64 54">
                <path d="M8 32 L32 18 L56 32 L56 41 L32 27 L8 41 Z" fill="none" stroke="#f97316" stroke-width="2.4" stroke-linejoin="round"/>
              </svg>
              <svg width="60" height="60" viewBox="0 0 64 64">
                <line x1="22" y1="8" x2="22" y2="15" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="10" y1="20" x2="17" y2="20" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="13" y1="11" x2="18" y2="16" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="31" y1="11" x2="26" y2="16" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="13" y1="29" x2="18" y2="24" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M22 22 L48 34 L37 39 L45 50 L39 54 L31 43 L25 50 Z" fill="none" stroke="#ffffff" stroke-width="2.8" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="ctech-guide-row-text" id="guide-ui-row2"></div>
          </div>
        </div>

        <!-- 3 Cột bên dưới: Phóng to/thu nhỏ - Xoay góc nhìn - Menu -->
        <div class="ctech-guide-bottom-cols">
          <div class="ctech-guide-col">
            <svg viewBox="0 0 68 68">
              <path d="M23 13 Q34 5 45 13" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
              <polyline points="26,9 22,13 27,15" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="42,9 46,13 41,15" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <rect x="21" y="18" width="26" height="42" rx="13" fill="#ffffff"/>
              <line x1="21" y1="35" x2="47" y2="35" stroke="#006b3f" stroke-width="2.5"/>
              <line x1="34" y1="18" x2="34" y2="35" stroke="#006b3f" stroke-width="2.5"/>
              <rect x="31" y="23" width="6" height="9" rx="3" fill="#f97316"/>
            </svg>
            <div class="ctech-guide-col-text" id="guide-ui-col1"></div>
          </div>

          <div class="ctech-guide-col">
            <svg viewBox="0 0 68 68">
              <line x1="24" y1="14" x2="24" y2="20" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/>
              <line x1="12" y1="26" x2="18" y2="26" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/>
              <line x1="15" y1="17" x2="20" y2="22" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/>
              <line x1="33" y1="17" x2="28" y2="22" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/>
              <line x1="37" y1="22" x2="46" y2="13" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
              <polyline points="40,13 46,13 46,19" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="23" y1="38" x2="14" y2="47" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
              <polyline points="14,41 14,47 20,47" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M25 27 L51 39 L40 44 L48 55 L42 59 L34 48 L28 55 Z" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linejoin="round"/>
            </svg>
            <div class="ctech-guide-col-text" id="guide-ui-col2"></div>
          </div>

          <div class="ctech-guide-col">
            <svg viewBox="0 0 68 68">
              <rect x="12" y="14" width="44" height="40" rx="5" fill="none" stroke="#ffffff" stroke-width="3"/>
              <rect x="16" y="18" width="16" height="8" rx="1.5" fill="#ffffff"/>
              <circle cx="20" cy="22" r="2" fill="#006b3f"/>
              <circle cx="26" cy="22" r="2" fill="#006b3f"/>
              <rect x="16" y="29" width="16" height="21" rx="1.5" fill="#ffffff"/>
              <line x1="35" y1="18" x2="35" y2="50" stroke="#ffffff" stroke-width="2.2"/>
            </svg>
            <div class="ctech-guide-col-text" id="guide-ui-col3"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  function updateGuideTexts() {
    const t = GUIDE_TEXT[currentLang] || GUIDE_TEXT.vi;
    document.getElementById('guide-ui-header').textContent = t.header;
    document.getElementById('guide-ui-row1').textContent   = t.row1;
    document.getElementById('guide-ui-row2').textContent   = t.row2;
    document.getElementById('guide-ui-col1').textContent   = t.col1;
    document.getElementById('guide-ui-col2').textContent   = t.col2;
    document.getElementById('guide-ui-col3').textContent   = t.col3;
  }

  function openGuideModal() {
    updateGuideTexts();
    overlay.classList.add('show-guide');
  }

  function closeGuideModal() {
    overlay.classList.remove('show-guide');
  }

  document.getElementById('ctech-guide-close-btn').addEventListener('click', closeGuideModal);
  overlay.addEventListener('click', closeGuideModal);

  window.openCTECHGuideModal = openGuideModal;
  window.closeCTECHGuideModal = closeGuideModal;

  // 3. Tự động theo dõi: Khi người dùng bấm "BẮT ĐẦU", đợi quả cầu xoay xong (isAnimatingCamera === false) thì hiện bảng
  const origStartTour = window.startTourFromSplash;
  let waitingForIntroFinish = false;

  window.startTourFromSplash = function() {
    waitingForIntroFinish = true;
    if (typeof origStartTour === 'function') {
      origStartTour();
    }
  };

  setInterval(() => {
    if (waitingForIntroFinish && hasStartedFromSplash && !isAnimatingCamera && uniforms.uTexture.value) {
      waitingForIntroFinish = false;
      setTimeout(() => {
        openGuideModal();
      }, 250);
    }
  }, 150);

  // Cập nhật ngôn ngữ bảng hướng dẫn khi bấm đổi cờ
  const origSetLang = window.setLanguage;
  if (typeof origSetLang === 'function') {
    window.setLanguage = function(langCode) {
      origSetLang(langCode);
      updateGuideTexts();
    };
  }
})();
// 1. Tự động hút đỉnh nhọn của quạt Radar vào đúng tâm chấm màu cam (active-pin)
function syncRadarPositionWithActivePin() {
  var activePin = document.querySelector('#minimap-overlay-svg .map-blue-pin.active-pin');
  var radarGroup = document.getElementById('minimap-radar-group');
  if (activePin && radarGroup) {
    var cx = activePin.getAttribute('cx');
    var cy = activePin.getAttribute('cy');
    radarGroup.style.transform = '';
    radarGroup.setAttribute('transform', 'translate(' + cx + ', ' + cy + ')');
  }
}
setInterval(syncRadarPositionWithActivePin, 100);

// 2. Nhận góc xoay từ Marzipano và quay cánh quạt Radar trên bản đồ mini
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'MARZIPANO_RADAR_ROTATE') {
    var cone = document.getElementById('minimap-radar-cone');
    if (cone) {
      cone.style.transform = ''; // Xóa khóa góc xoay CSS cũ của Three.js
      cone.setAttribute('transform', 'rotate(' + event.data.angle + ')');
    }
  }
});
// 1. Cầu nối mở cảnh 360° mặt đất (Từ Menu & Chatbot)
window.triggerMarzipanoSceneInIframe = function(sceneId, sceneTitle) {
  var iframe = document.getElementById('marzipano-frame') || document.getElementById('marzipano-iframe') || document.querySelector('iframe');
  if (iframe) {
    iframe.style.display = 'block';
    iframe.style.visibility = 'visible';
    iframe.style.opacity = '1';
    iframe.style.pointerEvents = 'auto';
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'GO_TO_SCENE', sceneId: sceneId }, '*');
    }
  }
  if (sceneTitle) {
    var badge = document.getElementById('scene-title-badge') || document.getElementById('current-scene-title');
    if (badge) badge.textContent = sceneTitle + ' - Cao đẳng CTECH';
  }
};

// 2. Cầu nối khi bấm "Tổng Quan Trên Cao" -> Ẩn khung mặt đất, bật lại cảnh Flycam 3D
(function() {
  var origSelectScene = window.selectScene;
  if (typeof origSelectScene === 'function') {
    window.selectScene = function(sceneKey, fromSubMenu) {
      var result = origSelectScene.apply(this, arguments);
      if (sceneKey === 'overview') {
        if (typeof window.closeMarzipanoView === 'function') {
          window.closeMarzipanoView();
        }
        var iframe = document.getElementById('marzipano-frame') || document.getElementById('marzipano-iframe') || document.querySelector('iframe');
        if (iframe) {
          iframe.style.display = 'none';
          iframe.style.visibility = 'hidden';
          iframe.style.opacity = '0';
          iframe.style.pointerEvents = 'none';
          iframe.classList.remove('active');
        }
        var webgl = document.getElementById('webgl-stage');
        if (webgl) {
          webgl.style.display = 'block';
          webgl.style.visibility = 'visible';
          webgl.style.opacity = '1';
        }
        window.dispatchEvent(new Event('resize'));
      }
      return result;
    };
  }
})();
// =========================================================================
// TÍNH NĂNG KÍNH THỰC TẾ ẢO VR 3D (STEREOSCOPIC 2 MẮT + XOAY ĐẦU GYROSCOPE)
// =========================================================================
(function setupCTECHVRGlassesMode() {
  let vrModeActive = false;
  let vrRightIframe = null;
  let vrRightCanvas = null;
  let vrRightCtx = null;
  let gyroEnabled = false;
  let baseAlpha = null;

  // 1. Chèn CSS giao diện Kính thực tế ảo 3D (Chia đôi 2 mắt Trái - Phải)
  const vrStyle = document.createElement('style');
  vrStyle.textContent = `
    #ctech-vr-toggle-btn {
      position: fixed;
      bottom: 18px;
      right: 18px;
      z-index: 220;
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 9px 15px;
      border-radius: 999px;
      border: 1.5px solid rgba(110, 231, 183, 0.85);
      background: linear-gradient(135deg, #006b3f 0%, #004d2c 100%);
      color: #ffffff;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
      transition: all 0.25s ease;
    }
    #ctech-vr-toggle-btn:hover {
      transform: translateY(-2px) scale(1.04);
      border-color: #fde047;
      color: #fde047;
    }
    #ctech-vr-exit-btn {
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      padding: 8px 18px;
      border-radius: 999px;
      border: 1.5px solid #fde047;
      background: rgba(0, 0, 0, 0.78);
      color: #fde047;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: none;
      box-shadow: 0 4px 16px rgba(0,0,0,0.6);
    }
    body.vr-stereoscopic-mode #ctech-vr-exit-btn {
      display: block;
    }
    body.vr-stereoscopic-mode #sidebar,
    body.vr-stereoscopic-mode #toggle-sidebar-btn,
    body.vr-stereoscopic-mode #open-map-pill,
    body.vr-stereoscopic-mode #tlu-aerial-minimap,
    body.vr-stereoscopic-mode #info-card,
    body.vr-stereoscopic-mode #ctech-chatbot,
    body.vr-stereoscopic-mode #ctech-vr-toggle-btn,
    body.vr-stereoscopic-mode #hotspots-3d-layer {
      display: none !important;
    }
    /* Chia màn hình bên trái (50% chiều ngang) */
    body.vr-stereoscopic-mode #webgl-stage,
    body.vr-stereoscopic-mode #marzipano-frame {
      width: 50vw !important;
      left: 0 !important;
      right: auto !important;
    }
    /* Màn hình mắt phải cho Three.js & Marzipano (50% bên phải) */
    #vr-right-eye-canvas,
    #marzipano-vr-right-frame {
      position: fixed;
      top: 0;
      left: 50vw;
      width: 50vw;
      height: 100vh;
      border: none;
      display: none;
      pointer-events: none;
    }
    #vr-right-eye-canvas {
      z-index: 15;
    }
    #marzipano-vr-right-frame {
      z-index: 26;
      background: #032215;
    }
    body.vr-stereoscopic-mode #vr-right-eye-canvas.vr-show,
    body.vr-stereoscopic-mode #marzipano-vr-right-frame.vr-show {
      display: block;
    }
    /* Lớp mặt nạ thấu kính Kính thực tế ảo 3D & Tâm ngắm 2 mắt */
    #vr-lens-overlay {
      position: fixed;
      inset: 0;
      z-index: 9990;
      pointer-events: none;
      display: none;
      background:
        radial-gradient(circle at 25% 50%, transparent 38%, rgba(0, 0, 0, 0.88) 49%),
        radial-gradient(circle at 75% 50%, transparent 38%, rgba(0, 0, 0, 0.88) 49%);
    }
    body.vr-stereoscopic-mode #vr-lens-overlay {
      display: block;
    }
    .vr-center-divider {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      width: 3px;
      transform: translateX(-50%);
      background: rgba(255, 255, 255, 0.35);
    }
    .vr-reticle {
      position: absolute;
      top: 50%;
      width: 14px;
      height: 14px;
      margin-top: -7px;
      margin-left: -7px;
      border: 2px solid rgba(52, 211, 153, 0.9);
      border-radius: 50%;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
    }
    .vr-reticle.left-eye { left: 25%; }
    .vr-reticle.right-eye { left: 75%; }
  `;
  document.head.appendChild(vrStyle);

  // 2. Tạo nút bật Kính VR 3D và lớp phủ thấu kính
  const vrBtn = document.createElement('button');
  vrBtn.id = 'ctech-vr-toggle-btn';
  vrBtn.title = 'Chế độ Kính thực tế ảo 3D (VR Box / Cardboard)';
  vrBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="7" width="20" height="10" rx="3"></rect>
      <path d="M10 17l2-3 2 3"></path>
      <circle cx="7.5" cy="12" r="2"></circle>
      <circle cx="16.5" cy="12" r="2"></circle>
    </svg>
    <span>Kính VR 3D</span>
  `;
   //document.body.appendChild(vrBtn);

  const exitBtn = document.createElement('button');
  exitBtn.id = 'ctech-vr-exit-btn';
  exitBtn.textContent = '✕ Thoát Chế Độ Kính VR 3D';
  document.body.appendChild(exitBtn);

  const lensOverlay = document.createElement('div');
  lensOverlay.id = 'vr-lens-overlay';
  lensOverlay.innerHTML = `
    <div class="vr-center-divider"></div>
    <div class="vr-reticle left-eye"></div>
    <div class="vr-reticle right-eye"></div>
  `;
  document.body.appendChild(lensOverlay);

  // 3. Khởi tạo khung Mắt Phải cho cả Three.js (Flycam) và Marzipano (62 cảnh)
  function ensureRightEyeElements() {
    if (!vrRightCanvas) {
      vrRightCanvas = document.createElement('canvas');
      vrRightCanvas.id = 'vr-right-eye-canvas';
      document.body.appendChild(vrRightCanvas);
      vrRightCtx = vrRightCanvas.getContext('2d');
    }
    if (!vrRightIframe) {
      vrRightIframe = document.createElement('iframe');
      vrRightIframe.id = 'marzipano-vr-right-frame';
      vrRightIframe.name = 'vr-right-eye';
      vrRightIframe.src = 'app-files/index.html';
      document.body.appendChild(vrRightIframe);
    }
  }

  function syncActiveEyeLayers() {
    if (!vrModeActive) return;
    ensureRightEyeElements();
    const isGroundScene = Boolean(currentMarzipanoId);
    vrRightCanvas.classList.toggle('vr-show', !isGroundScene);
    vrRightIframe.classList.toggle('vr-show', isGroundScene);

    if (!isGroundScene && typeof renderer !== 'undefined') {
      const halfW = Math.floor(window.innerWidth / 2);
      const fullH = window.innerHeight;
      renderer.setSize(halfW, fullH);
      uniforms.uAspect.value = halfW / fullH;
      vrRightCanvas.width = halfW;
      vrRightCanvas.height = fullH;
    } else if (isGroundScene && vrRightIframe.contentWindow) {
      vrRightIframe.contentWindow.postMessage({ type: 'GO_TO_SCENE', sceneId: currentMarzipanoId }, '*');
    }
  }

  // Vòng lặp sao chép hình ảnh sang mắt phải khi ở cảnh Flycam Three.js
  function renderVRRightEyeLoop() {
    requestAnimationFrame(renderVRRightEyeLoop);
    if (!vrModeActive || currentMarzipanoId || !vrRightCtx || typeof renderer === 'undefined') return;
    vrRightCtx.clearRect(0, 0, vrRightCanvas.width, vrRightCanvas.height);
    vrRightCtx.drawImage(renderer.domElement, 0, 0, vrRightCanvas.width, vrRightCanvas.height);
  }
  requestAnimationFrame(renderVRRightEyeLoop);

  // Lắng nghe góc quay từ mắt trái Marzipano để truyền sang mắt phải tức thì
  window.addEventListener('message', (event) => {
    if (!vrModeActive || !event.data) return;
    if (event.data.type === 'MARZIPANO_VR_SYNC' && vrRightIframe && vrRightIframe.contentWindow) {
      vrRightIframe.contentWindow.postMessage({
        type: 'APPLY_VR_SYNC',
        sceneId: event.data.sceneId,
        yaw: event.data.yaw,
        pitch: event.data.pitch,
        fov: event.data.fov,
        eyeOffset: 0.012
      }, '*');
    }
  });

  // 4. Cảm biến Con quay hồi chuyển (Gyroscope) khi xoay đầu trên điện thoại
  function handleDeviceOrientation(e) {
    if (!vrModeActive || e.alpha === null) return;
    if (baseAlpha === null) baseAlpha = e.alpha;

    const yawRad = -((e.alpha - baseAlpha) * Math.PI) / 180;
    const rawBeta = e.beta || 0;
    const pitchRad = Math.max(-1.1, Math.min(0.85, ((rawBeta - 65) * Math.PI) / 180));

    if (!currentMarzipanoId && typeof uniforms !== 'undefined') {
      uniforms.uYaw.value = targetYaw + yawRad;
      uniforms.uPitch.value = pitchRad;
    } else {
      const leftFrame = document.getElementById('marzipano-frame');
      if (leftFrame && leftFrame.contentWindow) {
        leftFrame.contentWindow.postMessage({ type: 'VR_GYRO_LOOK', yaw: yawRad, pitch: pitchRad }, '*');
      }
      if (vrRightIframe && vrRightIframe.contentWindow) {
        vrRightIframe.contentWindow.postMessage({ type: 'VR_GYRO_LOOK', yaw: yawRad, pitch: pitchRad }, '*');
      }
    }
  }

  async function enableGyroscope() {
    if (gyroEnabled) return;
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const perm = await DeviceOrientationEvent.requestPermission();
        if (perm === 'granted') {
          window.addEventListener('deviceorientation', handleDeviceOrientation, true);
          gyroEnabled = true;
        }
      } else {
        window.addEventListener('deviceorientation', handleDeviceOrientation, true);
        gyroEnabled = true;
      }
    } catch (e) {}
  }

  // 5. Bật / Tắt chế độ Kính VR 3D
  function toggleVRMode(forceState) {
    vrModeActive = typeof forceState === 'boolean' ? forceState : !vrModeActive;
    baseAlpha = null;
    document.body.classList.toggle('vr-stereoscopic-mode', vrModeActive);

    if (vrModeActive) {
      ensureRightEyeElements();
      enableGyroscope();
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      syncActiveEyeLayers();
      setTimeout(syncActiveEyeLayers, 400);
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      if (typeof renderer !== 'undefined') {
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.uAspect.value = window.innerWidth / window.innerHeight;
      }
    }
  }

  vrBtn.addEventListener('click', () => toggleVRMode(true));
  exitBtn.addEventListener('click', () => toggleVRMode(false));
  window.addEventListener('resize', () => {
    if (vrModeActive) syncActiveEyeLayers();
  });

 // 6. Bắt sự kiện khi bấm vào mục model3d trên thanh menu bên trái để bật Kính VR 3D
  const origSelectScene = window.selectScene;
  if (typeof origSelectScene === 'function') {
    window.selectScene = function(sceneKey, ...args) {
      if (sceneKey === 'model3d') {
        toggleVRMode(true);
        return;
      }
      return origSelectScene.apply(this, [sceneKey, ...args]);
    };
  }

  document.addEventListener('click', (e) => {
    const item = e.target.closest('#menu-list > li');
    if (!item) return;
    const text = item.textContent || '';
    if (text.includes('Mô Hình 3D Hiện Trạng') || text.includes('Kích Hoạt Kính Thực Tế Ảo 3D')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      toggleVRMode(true);
    }
  }, true);
})();
// =========================================================================
// BẢN NÂNG CẤP PRO CHO CHATBOT CTECH (CHẠY SONG SONG CÙNG KÍNH VR 3D):
// 1. Nút Micro 🎤 nhận diện giọng nói (Voice Search)
// 2. Nhận thức vị trí đang đứng ("Tôi đang ở đâu?" / "Where am I?")
// 3. Giải mã từ viết tắt sinh viên & tự động dịch nút bấm theo 4 ngôn ngữ
// =========================================================================
(function upgradeCTECHChatbotPro() {
  // 1. BỘ GIẢI MÃ TỪ VIẾT TẮT PHỔ BIẾN CỦA HỌC SINH - SINH VIÊN
  function expandStudentAbbreviations(text) {
    return String(text || '')
      .replace(/\b(ktx|kituc|kytuc)\b/gi, 'ký túc xá')
      .replace(/\b(cntt|it)\b/gi, 'công nghệ thông tin')
      .replace(/\b(hp)\b/gi, 'học phí')
      .replace(/\b(hb)\b/gi, 'học bổng')
      .replace(/\b(hssv|cthssv)\b/gi, 'công tác học sinh sinh viên')
      .replace(/\b(oto)\b/gi, 'ô tô')
      .replace(/\b(tkdh)\b/gi, 'thiết kế đồ họa')
      .replace(/\b(bgh)\b/gi, 'ban giám hiệu')
      .replace(/\b(vpk)\b/gi, 'văn phòng khoa');
  }

  // 2. BỌC NÂNG CẤP HÀM getLocalSmartFallback
  const baseSmartFallback = window.getCTECHBotResponse || getLocalSmartFallback;

  function enhancedSmartFallback(rawInput) {
    const expandedInput = expandStudentAbbreviations(rawInput);
    const q = removeAccents(expandedInput);

    const isJaInput = /[\u3040-\u30ff\u4e00-\u9faf]/.test(rawInput);
    const isKoInput = /[\uac00-\ud7af\u1100-\u11ff]/.test(rawInput);
    const isEnInput = /\b(where|what|how|room|building|lab|library|canteen|dormitory|admission|tuition)\b/i.test(rawInput);
    const activeLang = isJaInput ? 'ja' : (isKoInput ? 'ko' : (isEnInput ? 'en' : (currentLang || 'vi')));

    // Hỏi vị trí hiện tại ("Tôi đang ở đâu?" / "Where am I?")
    const isAskingCurrentLocation =
      q.includes('toi dang o dau') || q.includes('minh dang o dau') || q.includes('day la dau') ||
      q.includes('phong nay la') || q.includes('khu vuc nay') || q.includes('xung quanh co gi') ||
      q.includes('where am i') || q.includes('what is this room') || q.includes('current location') ||
      rawInput.includes('ここはどこ') || rawInput.includes('現在地') ||
      rawInput.includes('여기가 어디') || rawInput.includes('현재 위치');

    if (isAskingCurrentLocation && typeof SCENES === 'object') {
      const curSceneObj = SCENES[currentSceneKey] || SCENES.overview;
      let curSubLabel = curSceneObj.title?.[activeLang] || curSceneObj.title?.vi || 'Khuôn viên CTECH';

      if (currentMarzipanoId && Array.isArray(curSceneObj.subItems)) {
        const foundSub = curSceneObj.subItems.find(s => s.marzipanoId === currentMarzipanoId);
        if (foundSub) {
          curSubLabel = foundSub.label?.[activeLang] || foundSub.label?.vi || curSubLabel;
        }
      }

      const siblingButtons = (curSceneObj.subItems || [])
        .filter(s => s.marzipanoId && s.marzipanoId !== currentMarzipanoId)
        .slice(0, 3)
        .map(s => ({
          scene: currentSceneKey,
          marzId: s.marzipanoId,
          btnText: (activeLang === 'en' ? 'Go to: ' : activeLang === 'ja' ? '移動: ' : activeLang === 'ko' ? '이동: ' : 'Đi tới: ') +
                   (s.label?.[activeLang] || s.label?.vi)
        }));

      const descText = curSceneObj.desc?.[activeLang] || curSceneObj.desc?.vi || '';
      return {
        text: `🧭 <b>Vị trí hiện tại của bạn (Current Location):</b><br>` +
              `• <b>Không gian:</b> ${curSubLabel}<br>` +
              `• <b>Thông tin:</b> ${descText}<br>` +
              (siblingButtons.length > 0 ? `• 💡 <i>Gợi ý các phòng kế bên trong cùng khu vực:</i>` : ''),
        scene: currentSceneKey,
        marzId: currentMarzipanoId,
        extraButtons: siblingButtons.length > 0 ? siblingButtons : null
      };
    }

    const res = baseSmartFallback(expandedInput);

    if (res && activeLang !== 'vi') {
      const prefixMap = { en: 'Go to: ', ja: '移動: ', ko: '이동: ' };
      const pref = prefixMap[activeLang] || '';
      if (res.btnText && pref && !res.btnText.startsWith(pref)) {
        res.btnText = res.btnText.replace(/^(Đi vào|Đi tới|Tham quan|Xem)\s+/i, pref);
      }
      if (Array.isArray(res.extraButtons)) {
        res.extraButtons = res.extraButtons.map(b => ({
          ...b,
          btnText: (b.btnText || '').replace(/^(Đi vào|Đi tới|Tham quan|Xem)\s+/i, pref)
        }));
      }
    }

    return res;
  }

  getLocalSmartFallback = enhancedSmartFallback;
  window.getCTECHBotResponse = enhancedSmartFallback;

  // 3. KHỞI TẠO NÚT MICRO 🎤 NHẬN DIỆN GIỌNG NÓI NGAY TRONG Ô NHẬP CHAT
  function initChatbotVoiceMic() {
    const inputEl = document.getElementById('chatbot-input');
    if (!inputEl || !inputEl.parentNode || document.getElementById('chatbot-mic-btn')) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const micStyle = document.createElement('style');
    micStyle.textContent = `
      #chatbot-mic-btn {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 1px solid rgba(16, 185, 129, 0.45);
        background: rgba(0, 107, 63, 0.12);
        color: #006b3f;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-right: 4px;
        flex-shrink: 0;
        transition: all 0.2s ease;
      }
      #chatbot-mic-btn:hover {
        background: rgba(0, 107, 63, 0.22);
        transform: scale(1.06);
      }
      #chatbot-mic-btn.listening {
        background: #ef4444 !important;
        color: #ffffff !important;
        border-color: #ef4444 !important;
        animation: ctechMicPulse 1.2s infinite;
      }
      @keyframes ctechMicPulse {
        0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.65); }
        70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
        100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
      }
    `;
    document.head.appendChild(micStyle);

    const micBtn = document.createElement('button');
    micBtn.type = 'button';
    micBtn.id = 'chatbot-mic-btn';
    micBtn.title = 'Tìm phòng bằng giọng nói (Voice Search)';
    micBtn.innerHTML = '🎤';
    inputEl.parentNode.insertBefore(micBtn, inputEl.nextSibling);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    let isListening = false;

    micBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isListening) {
        recognition.stop();
        return;
      }
      const langMap = { vi: 'vi-VN', en: 'en-US', ja: 'ja-JP', ko: 'ko-KR' };
      recognition.lang = langMap[currentLang] || 'vi-VN';
      try {
        recognition.start();
        isListening = true;
        micBtn.classList.add('listening');
        inputEl.placeholder = '🎙️ Đang nghe bạn nói...';
      } catch (err) {}
    });

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript.trim()) {
        inputEl.value = transcript.trim();
        sendQuickQuestion(transcript.trim());
        inputEl.value = '';
      }
    };

    recognition.onend = () => {
      isListening = false;
      micBtn.classList.remove('listening');
      inputEl.placeholder = 'Hỏi về phòng 101, 102, 103, N01-N05...';
    };

    recognition.onerror = () => {
      isListening = false;
      micBtn.classList.remove('listening');
      inputEl.placeholder = 'Hỏi về phòng 101, 102, 103, N01-N05...';
    };
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initChatbotVoiceMic);
  } else {
    initChatbotVoiceMic();
  }
})();
// =========================================================================
// SỬA LỖI ZOOM 2 NGÓN TRÊN ĐIỆN THOẠI:
// 1. Khóa phóng to giao diện HTML (Giữ nguyên thanh công cụ đáy & nút Bản đồ)
// 2. Thu gọn nhãn tòa nhà N01-N05 trên điện thoại để không bị to & đè lên nhau
// =========================================================================
(function fixMobilePinchZoomAndHotspots() {
  // 1. Khóa Viewport không cho trình duyệt điện thoại/Zalo tự phóng to giao diện HTML
  let vpMeta = document.querySelector('meta[name="viewport"]');
  if (!vpMeta) {
    vpMeta = document.createElement('meta');
    vpMeta.name = 'viewport';
    document.head.appendChild(vpMeta);
  }
  vpMeta.setAttribute(
    'content',
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover'
  );

  // 2. Chèn CSS chống zoom trang và thu gọn kích thước nhãn tòa nhà trên điện thoại
  const fixMobileStyle = document.createElement('style');
  fixMobileStyle.textContent = `
    html, body {
      touch-action: none !important;
      overscroll-behavior: none !important;
      -webkit-text-size-adjust: 100% !important;
      overflow: hidden !important;
      position: fixed !important;
      width: 100% !important;
      height: 100% !important;
    }
    #webgl-stage, #hotspots-3d-layer {
      touch-action: none !important;
    }
    @media (max-width: 768px) {
      .tlu-hotspot-tag {
        font-size: 10.5px !important;
        line-height: 1.28 !important;
        padding: 5px 8px !important;
        max-width: 145px !important;
        border-radius: 7px !important;
        white-space: normal !important;
        text-align: center !important;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.45) !important;
      }
      .tlu-hotspot-tag b {
        font-size: 11.5px !important;
      }
    }
  `;
  document.head.appendChild(fixMobileStyle);

  // 3. Chặn trình duyệt điện thoại tự bung to giao diện khi dùng 2 ngón tay
  let pinchStartDist = null;
  let pinchStartScale = 1.0;

  document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length >= 2) {
      if (e.cancelable) e.preventDefault();
      isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist = Math.hypot(dx, dy);
      if (typeof uniforms !== 'undefined' && uniforms.uScale) {
        pinchStartScale = uniforms.uScale.value;
      }
    }
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length >= 2) {
      if (e.cancelable) e.preventDefault();
      if (pinchStartDist && !currentMarzipanoId && typeof uniforms !== 'undefined' && uniforms.uScale) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const curDist = Math.hypot(dx, dy);
        const ratio = pinchStartDist / Math.max(15, curDist);
        uniforms.uScale.value = Math.max(0.35, Math.min(2.1, pinchStartScale * ratio));
      }
    }
  }, { passive: false });

  window.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      pinchStartDist = null;
    }
  }, { passive: false });

  // 4. Tối ưu lại hàm tính tọa độ nhãn 3D trên điện thoại để các tòa N01-N05 không đè lên nhau
  if (typeof window.updateHotspotsScreenCoords === 'function') {
    window.updateHotspotsScreenCoords = function() {
      if (uniforms.uPlanetFactor.value > 0.15) return;

      const uYaw = uniforms.uYaw.value;
      const uPitch = uniforms.uPitch.value;
      const uAspect = uniforms.uAspect.value;
      const uScale = uniforms.uScale.value;

      const cy = Math.cos(uYaw), sy = Math.sin(uYaw);
      const cp = Math.cos(uPitch), sp = Math.sin(uPitch);
      const isMobile = window.innerWidth <= 768;
      const marginX = isMobile ? 54 : 115;

      // Tự động thu nhỏ nhẹ nhãn khi người dùng zoom xa để các nhãn tách rời nhau
      const tagZoomScale = isMobile
        ? Math.max(0.68, Math.min(1.0, 0.85 / Math.pow(uScale, 0.35)))
        : Math.max(0.80, Math.min(1.05, 0.92 / Math.pow(uScale, 0.25)));

      activeHotspotItems.forEach(item => {
        const wx = Math.cos(item.lat) * Math.sin(item.lon);
        const wy = Math.sin(item.lat);
        const wz = Math.cos(item.lat) * Math.cos(item.lon);

        const d1x = wx * cy - wz * sy;
        const d1y = wy;
        const d1z = wx * sy + wz * cy;

        const dirX = d1x;
        const dirY = d1y * cp - d1z * sp;
        const dirZ = d1y * sp + d1z * cp;

        if (dirZ <= 0.15) {
          item.el.style.display = 'none';
          return;
        }

        const px = dirX / dirZ;
        const py = dirY / dirZ;

        const screenU = 0.5 + px / (uAspect * uScale);
        const screenV = 0.5 + py / uScale;

        if (screenU < 0.02 || screenU > 0.98 || screenV < 0.04 || screenV > 0.95) {
          item.el.style.display = 'none';
          return;
        }

        item.el.style.display = 'block';
        const rawX = screenU * window.innerWidth;
        const safeX = Math.max(marginX, Math.min(window.innerWidth - marginX, rawX));
        item.el.style.left = safeX + 'px';
        item.el.style.top  = ((1.0 - screenV) * window.innerHeight) + 'px';
        item.el.style.transform = `translate(-50%, -100%) scale(${tagZoomScale.toFixed(2)})`;
      });
    };
  }
})();
/* === BỘ NÂNG CẤP GIỌNG ĐỌC THUYẾT MINH TRUYỀN CẢM 4 NGÔN NGỮ & MICRO 1 CHẠM (CHUẨN IPHONE/IOS) === */
(function () {
  // 1. Cho phép tải luồng âm thanh mượt trên mọi trình duyệt
  if (!document.querySelector('meta[name="referrer"]')) {
    const meta = document.createElement('meta');
    meta.name = 'referrer';
    meta.content = 'no-referrer';
    document.head.appendChild(meta);
  }

  function showMobileVoiceNotice(msg) {
    let toast = document.getElementById('ctech-voice-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ctech-voice-toast';
      toast.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.95);color:#fff;padding:10px 16px;border-radius:20px;font-size:13px;z-index:999999;box-shadow:0 4px 15px rgba(0,0,0,0.3);border:1px solid #22c55e;text-align:center;max-width:90vw;transition:opacity 0.3s;pointer-events:none;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.display = 'block';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 3000);
  }

  // 2. KỊCH BẢN THUYẾT MINH NGẮN GỌN (< 185 KÝ TỰ) ĐỂ IPHONE ĐỌC LIỀN MỘT HƠI
  const NATURAL_VI_VOICE_SCRIPTS = {
    overview:
      'Chào mừng bạn đến với Cao đẳng Kỹ thuật Công nghệ Bách Khoa tại Thường Tín, Hà Nội. Khuôn viên rộng 22 nghìn mét vuông gồm 5 tòa nhà hiện đại, Quảng trường Hoa Sen và khu thể chất.',
    campus:
      'Khuôn viên trường rộng 22 nghìn mét vuông được quy hoạch xanh mát với lối đi vòm hoa, hàng cây cảnh quan kết nối 5 tòa nhà chính và khu vực Quảng trường trung tâm.',
    n01:
      'Tòa nhà N không 1 nằm ngay đầu cổng trường. Đây là nơi đặt Hội trường lớn, Phòng Tuyển sinh, Công tác Sinh viên, không gian Văn hóa Nhật Bản và phòng thực hành Công nghệ thông tin.',
    n02:
      'Tòa nhà N không 2 nằm ở trung tâm trường với mái cờ đỏ sao vàng. Tầng 1 là Xưởng thực hành Ô tô, tầng 2 là Phòng Điện và Sân cầu lông, tầng 3 là khu Ký túc xá sinh viên.',
    n03:
      'Tòa nhà N không 3 là khu thực hành Chăm sóc sức khỏe và Thẩm mỹ, gồm phòng Điều dưỡng 101, phòng Trang điểm 102, phòng Spa 103, phòng Đồ họa 105 và các giảng đường lớn.',
    n04:
      'Tòa nhà N không 4 gồm Trung tâm Ngoại ngữ ở tầng 2 và phòng Tiếng Hán. Tầng 1 đặt phòng thực hành Chế biến món ăn 106 chuẩn khách sạn, phòng Đồ họa và phòng Y tế.',
    n05:
      'Tòa nhà N không 5 gồm Căng tin sinh viên ở tầng 1. Tầng 2 là khu Hiệu bộ, Ban Giám hiệu, phòng Kế toán và Đào tạo. Tầng 4 là Thư viện trung tâm và phòng họp.',
    square:
      'Quảng trường Hoa Sen nằm ngay phía sau tòa N không 2, là không gian sinh hoạt chung và tổ chức các sự kiện văn hóa lớn của sinh viên nhà trường.',
    sports:
      'Khu thể chất và sân bóng đá cỏ nhân tạo nằm bên trái khuôn viên trường, phục vụ học tập thể chất và các giải đấu thể thao sôi nổi của sinh viên.',
    model3d:
      'Bạn đang ở chế độ Kính thực tế ảo 3D, hỗ trợ chia đôi màn hình hai mắt và xoay góc nhìn 360 độ.'
  };

  function cleanTextForSpeech(rawText, langPrefix) {
    let t = (rawText || '').trim();
    if (!t) return '';

    if (langPrefix === 'vi') {
      t = t.replace(/\([^)]*College[^)]*\)/gi, '');
      t = t.replace(/\([^)]*Technology[^)]*\)/gi, '');
      t = t.replace(/\([^)]*CCG[^)]*\)/gi, '');
      t = t.replace(/En-nờ\s+không\s*(\d)/gi, 'N không $1');
      t = t.replace(/Nờ\s+không\s*(\d)/gi, 'N không $1');
      t = t.replace(/\bN0(\d)\b/gi, 'N không $1');
      t = t.replace(/\(\s*P\.?\s*(\d+)\s*\)/gi, ', phòng $1, ');
      t = t.replace(/\bP\.\s*(\d+)\b/gi, 'phòng $1');
      t = t.replace(/(\d+)\.(\d{3})\b/g, '$1$2');
      t = t.replace(/m²|m2\b/gi, ' mét vuông ');
      t = t.replace(/\s*&\s*/g, ' và ');
      t = t.replace(/\(([^)]+)\)/g, ', $1, ');
      t = t.replace(/\s*[–—-]\s*/g, ', ');
      t = t.replace(/,\s*,/g, ',');
    } else if (langPrefix === 'en') {
      t = t.replace(/(\d+)\.(\d{3})\b/g, '$1,$2');
      t = t.replace(/m²|m2\b/gi, ' square meters ');
      t = t.replace(/\s*[–—]\s*/g, ', ');
    }

    return t.replace(/\s+/g, ' ').trim();
  }

  // 3. TẠO 1 TRÌNH PHÁT AUDIO DUY NHẤT & MỞ KHÓA NGAY KHI CHẠM TAY TRÊN IPHONE (IOS)
  const ttsPlayer = document.createElement('audio');
  ttsPlayer.id = 'ctech-ios-tts-player';
  ttsPlayer.setAttribute('playsinline', 'true');
  ttsPlayer.setAttribute('webkit-playsinline', 'true');
  ttsPlayer.preload = 'auto';
  let currentTargetRate = 1.28;
  let iosAudioUnlocked = false;

  // Khóa chặt tốc độ đọc trên iPhone: Cứ mỗi khi iOS tự trả về 1.0 là ép ngay lên 1.28x
  ['loadedmetadata', 'canplay', 'play', 'playing', 'ratechange'].forEach(evtName => {
    ttsPlayer.addEventListener(evtName, () => {
      if ('preservesPitch' in ttsPlayer) ttsPlayer.preservesPitch = true;
      if ('webkitPreservesPitch' in ttsPlayer) ttsPlayer.webkitPreservesPitch = true;
      if (Math.abs(ttsPlayer.playbackRate - currentTargetRate) > 0.02) {
        try { ttsPlayer.playbackRate = currentTargetRate; } catch (e) {}
      }
    });
  });

  // Mở khóa quyền phát âm thanh trên iOS ngay khi người dùng chạm vào nút BẮT ĐẦU hoặc màn hình
  function unlockIOSAudio() {
    if (iosAudioUnlocked) return;
    iosAudioUnlocked = true;
    try {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      ttsPlayer.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      ttsPlayer.volume = 0.01;
      const p = ttsPlayer.play();
      if (p !== undefined) {
        p.then(() => {
          ttsPlayer.pause();
          ttsPlayer.currentTime = 0;
          ttsPlayer.volume = 1.0;
        }).catch(() => {
          iosAudioUnlocked = false;
        });
      }
    } catch (e) {
      iosAudioUnlocked = false;
    }
  }
  window.addEventListener('touchstart', unlockIOSAudio, { passive: true, capture: true });
  window.addEventListener('click', unlockIOSAudio, { passive: true, capture: true });

  // 4. BỘ PHÁT ÂM THANH ĐỒNG NHẤT (CẤM TUYỆT ĐỐI GIỌNG SIRI "LINH" MẶC ĐỊNH CỦA IPHONE)
  const isIOSDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
                      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  let currentSessionId = 0;
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  const origSpeak = synth ? synth.speak.bind(synth) : null;
  const origCancel = synth ? synth.cancel.bind(synth) : null;

  function stopAllTTS() {
    currentSessionId++;
    try {
      ttsPlayer.onended = null;
      ttsPlayer.onerror = null;
      ttsPlayer.pause();
    } catch (e) {}
    if (origCancel) {
      try { origCancel(); } catch (e) {}
    }
  }

  function detectTargetLang(text, rawLang) {
    const t = text || '';
    if (/[\uac00-\ud7af\u1100-\u11ff]/.test(t)) return 'ko';
    if (/[\u3040-\u30ff\u4e00-\u9faf]/.test(t)) return 'ja';
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(t)) return 'vi';
    const l = (rawLang || '').toLowerCase();
    if (l.startsWith('ko')) return 'ko';
    if (l.startsWith('ja')) return 'ja';
    if (l.startsWith('vi')) return 'vi';
    return 'en';
  }

  function splitTextToChunks(text, maxLen = 190) {
    const clean = (text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return [];
    if (clean.length <= maxLen) return [clean];

    const rawSentences = clean.split(/(?<=[.!?。])\s+/);
    const chunks = [];
    let cur = '';
    for (const s of rawSentences) {
      if ((cur + ' ' + s).trim().length <= maxLen) {
        cur = (cur + ' ' + s).trim();
      } else {
        if (cur) chunks.push(cur);
        cur = s;
      }
    }
    if (cur) chunks.push(cur);
    return chunks;
  }

  function playViaUnlockedPlayer(text, langPrefix) {
    stopAllTTS();
    const sessionId = currentSessionId;
    const cleaned = cleanTextForSpeech(text, langPrefix);
    const chunks = splitTextToChunks(cleaned, 190);
    if (!chunks.length) return;

    // Tốc độ 1.28x trên iPhone giúp giọng đọc lanh lẹ, dứt khoát
    currentTargetRate = langPrefix === 'vi' ? 1.28 : 1.15;
    let idx = 0;

    function playNextChunk() {
      if (sessionId !== currentSessionId || idx >= chunks.length) return;
      const chunkText = chunks[idx++];
      const q = encodeURIComponent(chunkText);

      const primaryUrl = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=${langPrefix}&q=${q}`;
      const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langPrefix}&client=tw-ob&q=${q}`;

      ttsPlayer.volume = 1.0;
      ttsPlayer.src = primaryUrl;
      ttsPlayer.playbackRate = currentTargetRate;

      ttsPlayer.onended = () => {
        if (sessionId !== currentSessionId) return;
        playNextChunk();
      };

      ttsPlayer.onerror = () => {
        if (sessionId !== currentSessionId) return;
        ttsPlayer.onerror = playNextChunk;
        ttsPlayer.src = fallbackUrl;
        ttsPlayer.playbackRate = currentTargetRate;
        ttsPlayer.play().catch(() => {});
      };

      const p = ttsPlayer.play();
      if (p !== undefined) {
        p.then(() => {
          ttsPlayer.playbackRate = currentTargetRate;
        }).catch(() => {
          if (ttsPlayer.onerror) ttsPlayer.onerror();
        });
      }
    }

    playNextChunk();
  }

  window.speakCurrentDescription = function () {
    stopAllTTS();
    if (!isSpeaking || typeof SCENES !== 'object') return;
    const data = SCENES[currentSceneKey];
    if (!data) return;

    let spokenText = '';
    if (currentLang === 'vi' && NATURAL_VI_VOICE_SCRIPTS[currentSceneKey]) {
      spokenText = NATURAL_VI_VOICE_SCRIPTS[currentSceneKey];
    } else {
      spokenText = data.desc[currentLang] || data.desc.vi || '';
      spokenText = cleanTextForSpeech(spokenText, currentLang);
    }

    // Gọi trực tiếp qua bộ phát đã mở khóa cho iPhone & Android
    playViaUnlockedPlayer(spokenText, currentLang || 'vi');
  };

  if (synth) {
    synth.cancel = stopAllTTS;
    synth.speak = function (utterance) {
      if (!utterance || !utterance.text) return;
      const langPrefix = detectTargetLang(utterance.text, utterance.lang);

      // Nếu là iPhone/iPad: 100% đi qua ttsPlayer, không bao giờ gọi giọng Siri của máy
      if (isIOSDevice) {
        playViaUnlockedPlayer(utterance.text, langPrefix);
        return;
      }

      // Trên PC có sẵn giọng Microsoft HoaiMy Neural thì dùng, không có thì dùng ttsPlayer
      const voices = synth.getVoices() || [];
      const edgeNeuralVoice = voices.find(v =>
        v.lang && v.lang.toLowerCase().startsWith(langPrefix) &&
        /HoaiMy|NamMinh|Natural|Neural/i.test(v.name)
      );

      if (edgeNeuralVoice && origSpeak) {
        stopAllTTS();
        utterance.text = cleanTextForSpeech(utterance.text, langPrefix);
        utterance.voice = edgeNeuralVoice;
        utterance.rate = 1.15;
        origSpeak(utterance);
      } else {
        playViaUnlockedPlayer(utterance.text, langPrefix);
      }
    };
  }

  // 5. GIỮ NGUYÊN MICRO 1 CHẠM THÔNG MINH CHO CHATBOT
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRec) {
    const origStart = SpeechRec.prototype.start;
    const origStop = SpeechRec.prototype.stop;
    const origAbort = SpeechRec.prototype.abort;
    let activeRecInstance = null;

    function getChatbotControls() {
      const input =
        document.querySelector('input[placeholder*="Hỏi về"]') ||
        document.querySelector('#chat-input, #chatbot-input, .chat-input input, .chatbot-input input');
      let sendBtn = null;
      if (input && input.parentElement) {
        const btns = Array.from(input.parentElement.querySelectorAll('button'));
        if (btns.length) sendBtn = btns[btns.length - 1];
      }
      return { input, sendBtn };
    }

    function autoSubmitTranscript(text) {
      const cleanText = (text || '').trim();
      if (!cleanText) return;

      const { input, sendBtn } = getChatbotControls();
      if (input) {
        input.value = cleanText;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        const enterEvt = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        });
        input.dispatchEvent(enterEvt);
      }

      setTimeout(() => {
        const ctrl = getChatbotControls();
        if (ctrl.input && ctrl.input.value.trim() !== '' && ctrl.sendBtn) {
          ctrl.sendBtn.click();
        }
      }, 60);
    }

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button, [role="button"]');
      if (!btn) return;
      const sig = ((btn.innerHTML || '') + (btn.id || '') + (btn.className || '') + (btn.title || '')).toLowerCase();
      const { input, sendBtn } = getChatbotControls();
      const isChatMicBtn = (input && input.parentElement && input.parentElement.contains(btn) && btn !== sendBtn) ||
                           /mic|voice|speech|🎙|🎤/.test(sig);

      if (isChatMicBtn && activeRecInstance && !activeRecInstance._isRunning) {
        setTimeout(() => {
          if (activeRecInstance && !activeRecInstance._isRunning) {
            try { activeRecInstance.start(); } catch (err) {}
          }
        }, 80);
      }
    }, true);

    SpeechRec.prototype.start = function () {
      activeRecInstance = this;
      stopAllTTS();

      this.continuous = false;
      this.interimResults = true;
      if (!this.lang) this.lang = 'vi-VN';

      this._latestTranscript = '';
      this._hasAutoSent = false;
      clearTimeout(this._silenceTimer);

      const self = this;

      function finalizeAndSend() {
        if (self._hasAutoSent) return;
        const text = (self._latestTranscript || '').trim();
        if (!text) return;

        self._hasAutoSent = true;
        clearTimeout(self._silenceTimer);
        try { origStop.call(self); } catch (e) {}
        showMobileVoiceNotice('✅ Đã nhận: "' + text + '"');
        autoSubmitTranscript(text);
      }

      if (!this._smartHandlerAttached) {
        this._smartHandlerAttached = true;

        this.addEventListener('result', (event) => {
          if (self._hasAutoSent) return;

          let fullText = '';
          let hasFinalPiece = false;
          for (let i = 0; i < event.results.length; i++) {
            fullText += event.results[i][0].transcript;
            if (event.results[i].isFinal) hasFinalPiece = true;
          }

          fullText = fullText.trim();
          if (!fullText) return;
          self._latestTranscript = fullText;

          const { input } = getChatbotControls();
          if (input) input.value = fullText;

          clearTimeout(self._silenceTimer);
          const waitTime = hasFinalPiece ? 450 : 1200;
          self._silenceTimer = setTimeout(() => {
            finalizeAndSend();
          }, waitTime);
        }, true);
      }

      if (typeof this.onresult === 'function') {
        this._origOnResultBackup = this.onresult;
        this.onresult = null;
      }

      if (!this._mobilePatched) {
        this._mobilePatched = true;
        this.addEventListener('start', () => {
          this._isRunning = true;
          this._latestTranscript = '';
          this._hasAutoSent = false;
          showMobileVoiceNotice('🎙️ Đang nghe... Anh nói xong dừng 1 giây sẽ tự động gửi!');
        });
        this.addEventListener('end', () => {
          this._isRunning = false;
          clearTimeout(this._silenceTimer);
          if (!this._hasAutoSent && this._latestTranscript) {
            finalizeAndSend();
          }
        });
        this.addEventListener('error', (e) => {
          this._isRunning = false;
          clearTimeout(this._silenceTimer);
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            showMobileVoiceNotice('⚠️ Vui lòng bấm "Cho phép" Micro hoặc mở web bằng Chrome/Safari!');
          } else if (e.error === 'no-speech') {
            showMobileVoiceNotice('🎙️ Chưa nghe thấy tiếng, anh bấm Micro và nói lại nhé!');
          }
        });
      }

      try {
        if (this._isRunning) {
          origAbort.call(this);
          this._isRunning = false;
          setTimeout(() => {
            try { origStart.call(this); } catch (err) {}
          }, 150);
          return;
        }
        return origStart.call(this);
      } catch (err) {
        try {
          origAbort.call(this);
          setTimeout(() => {
            try { origStart.call(this); } catch (e2) {}
          }, 200);
        } catch (e) {}
      }
    };
  }
})();
/* === HIỆU ỨNG LƯỚT CHUYỂN CẢNH GOOGLE STREET VIEW (GIỮ NGUYÊN MẪU NÚT CŨ 100%) === */
(function () {
  function attachPureStreetViewGlide() {
    const frame = document.getElementById('marzipano-frame');
    if (!frame) return;

    let innerDoc, innerWin;
    try {
      innerDoc = frame.contentDocument || frame.contentWindow?.document;
      innerWin = frame.contentWindow;
    } catch (e) {
      return;
    }
    if (!innerDoc || !innerDoc.head || !innerDoc.body) return;

    // 1. Xóa bỏ CSS đổi hình dáng nút nếu trước đó từng gắn (Trả lại 100% mẫu nút tròn gốc)
    const oldCustomBtnStyle = innerDoc.getElementById('ctech-streetview-style');
    if (oldCustomBtnStyle) oldCustomBtnStyle.remove();

    // 2. Tạo lớp màng chụp chuyển động (Ghost Motion Layer) để hòa trộn 2 cảnh mượt như Google Maps
    let ghostCanvas = innerDoc.getElementById('ctech-sv-ghost-canvas');
    if (!ghostCanvas) {
      ghostCanvas = innerDoc.createElement('canvas');
      ghostCanvas.id = 'ctech-sv-ghost-canvas';
      ghostCanvas.style.cssText = [
        'position:fixed',
        'inset:0',
        'width:100%',
        'height:100%',
        'pointer-events:none',
        'z-index:20',
        'opacity:0',
        'display:none',
        'will-change:transform,opacity,filter'
      ].join(';');
      innerDoc.body.appendChild(ghostCanvas);
    }

    if (!innerDoc._ctechPureGlideBound) {
      innerDoc._ctechPureGlideBound = true;
      let isGliding = false;

      innerDoc.addEventListener(
        'click',
        function (e) {
          if (e._svGlideBypass) return;
          const hotspot = e.target.closest('.link-hotspot');
          if (!hotspot) return;

          e.stopImmediatePropagation();
          e.preventDefault();
          if (isGliding) return;
          isGliding = true;

          // Tọa độ hướng bấm để lao thẳng vào điểm đó
          const rect = hotspot.getBoundingClientRect();
          const clickX = Math.round(rect.left + rect.width / 2);
          const clickY = Math.round(rect.top + rect.height / 2);

          const panoEl = innerDoc.getElementById('pano');
          const webglCanvas = panoEl ? panoEl.querySelector('canvas') : innerDoc.querySelector('canvas');

          // Chụp lại khung hình WebGL ngay sau nhịp vẽ của Marzipano để làm lớp phóng lao tới
          innerWin.requestAnimationFrame(() => {
            let captured = false;
            if (webglCanvas && ghostCanvas) {
              try {
                ghostCanvas.width = webglCanvas.width || innerWin.innerWidth;
                ghostCanvas.height = webglCanvas.height || innerWin.innerHeight;
                const ctx = ghostCanvas.getContext('2d');
                ctx.drawImage(webglCanvas, 0, 0, ghostCanvas.width, ghostCanvas.height);
                captured = true;
              } catch (err) {}
            }

            // Kích hoạt chuyển sang cảnh mới ngay lập tức ở lớp dưới
            const passEvt = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: innerWin
            });
            passEvt._svGlideBypass = true;
            hotspot.dispatchEvent(passEvt);

            // LỚP TRÊN (Cảnh cũ): Phóng lao mạnh về phía trước + mờ dần + nhòe chuyển động nhẹ như Street View
            if (captured) {
              ghostCanvas.style.display = 'block';
              ghostCanvas.style.transition = 'none';
              ghostCanvas.style.transformOrigin = `${clickX}px ${clickY}px`;
              ghostCanvas.style.transform = 'scale(1)';
              ghostCanvas.style.opacity = '1';
              ghostCanvas.style.filter = 'blur(0px)';
              void ghostCanvas.offsetWidth;

              ghostCanvas.style.transition =
                'transform 0.58s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.52s ease-out, filter 0.52s ease-out';
              ghostCanvas.style.transform = 'scale(2.25)';
              ghostCanvas.style.opacity = '0';
              ghostCanvas.style.filter = 'blur(3.5px)';
            }

            // LỚP DƯỚI (Cảnh mới): Từ xa trượt tiến về phía người xem cùng chiều với cảnh cũ
            if (panoEl) {
              panoEl.style.transition = 'none';
              panoEl.style.transformOrigin = `${clickX}px ${clickY}px`;
              panoEl.style.transform = 'scale(0.82)';
              void panoEl.offsetWidth;

              panoEl.style.transition = 'transform 0.58s cubic-bezier(0.22, 1, 0.36, 1)';
              panoEl.style.transform = 'scale(1)';
            }

            setTimeout(() => {
              if (ghostCanvas) {
                ghostCanvas.style.display = 'none';
                ghostCanvas.style.transition = 'none';
                ghostCanvas.style.transform = 'scale(1)';
                ghostCanvas.style.filter = 'none';
              }
              if (panoEl) {
                panoEl.style.transition = 'none';
                panoEl.style.transform = 'none';
              }
              isGliding = false;
            }, 600);
          });
        },
        true
      );
    }
  }

  window.addEventListener('DOMContentLoaded', attachPureStreetViewGlide);
  window.addEventListener('load', attachPureStreetViewGlide);
  setInterval(attachPureStreetViewGlide, 600);
})();
/* === ĐỒNG BỘ TỌA ĐỘ BẢN ĐỒ MINIMAP CHUẨN GIỐNG HỆT MÁY TÍNH TRÊN MỌI ĐIỆN THOẠI === */
(function () {
  function syncMinimapAllDevices() {
    const svgEl = document.getElementById('minimap-overlay-svg');
    const pinN03 = document.getElementById('pin-n03');
    if (!svgEl) return;

    if (pinN03 && typeof SCENES === 'object' && SCENES.n03 && SCENES.n03.pinPos) {
      SCENES.n03.pinPos.y = parseFloat(pinN03.getAttribute('cy')) || 112;
    }

    // Giữ nguyên hệ tọa độ chuẩn 340x205 của PC cho cả iPhone và Android
    svgEl.setAttribute('viewBox', '0 0 340 205');
    svgEl.setAttribute('preserveAspectRatio', 'none');
  }

  syncMinimapAllDevices();
  window.addEventListener('DOMContentLoaded', syncMinimapAllDevices);
  window.addEventListener('load', syncMinimapAllDevices);
  window.addEventListener('resize', syncMinimapAllDevices);
})();
/* === BẢN VÁ MỞ KHÓA ÂM THANH IPHONE/IOS TỨC THÌ (CHẠY NGAY KHI BẤM NÚT) === */
(function () {
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // Lấy hàm phát giọng đọc gốc từ Prototype của trình duyệt (bỏ qua các lớp khóa cũ)
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  const nativeSpeak = synth && SpeechSynthesis.prototype.speak
    ? SpeechSynthesis.prototype.speak.bind(synth)
    : null;
  const nativeCancel = synth && SpeechSynthesis.prototype.cancel
    ? SpeechSynthesis.prototype.cancel.bind(synth)
    : null;

  // Tạo trình phát Audio gắn trực tiếp vào body cho iOS
  const iosAudio = document.createElement('audio');
  iosAudio.id = 'ctech-ios-direct-audio';
  iosAudio.setAttribute('playsinline', 'true');
  iosAudio.setAttribute('webkit-playsinline', 'true');
  iosAudio.style.display = 'none';
  document.body.appendChild(iosAudio);

  const SHORT_VI_SCRIPTS = {
    overview: 'Chào mừng bạn đến với Cao đẳng Kỹ thuật Công nghệ Bách Khoa tại Thường Tín, Hà Nội. Khuôn viên rộng 22 nghìn mét vuông gồm 5 tòa nhà hiện đại, Quảng trường Hoa Sen và khu thể chất.',
    campus:   'Khuôn viên trường rộng 22 nghìn mét vuông được quy hoạch xanh mát với lối đi vòm hoa, hàng cây cảnh quan kết nối 5 tòa nhà chính và khu vực Quảng trường trung tâm.',
    n01:      'Tòa nhà N không 1 nằm ngay đầu cổng trường, là nơi đặt Hội trường lớn, Phòng Tuyển sinh, Công tác Sinh viên, không gian Văn hóa Nhật Bản và phòng thực hành Công nghệ thông tin.',
    n02:      'Tòa nhà N không 2 nằm ở trung tâm trường với mái cờ đỏ sao vàng. Tầng 1 là Xưởng thực hành Ô tô, tầng 2 là Phòng Điện và Sân cầu lông, tầng 3 là khu Ký túc xá sinh viên.',
    n03:      'Tòa nhà N không 3 là khu thực hành Chăm sóc sức khỏe và Thẩm mỹ, gồm phòng Điều dưỡng 101, phòng Trang điểm 102, phòng Spa 103, phòng Đồ họa 105 và các giảng đường lớn.',
    n04:      'Tòa nhà N không 4 gồm Trung tâm Ngoại ngữ ở tầng 2 và phòng Tiếng Hán. Tầng 1 đặt phòng thực hành Chế biến món ăn 106 chuẩn khách sạn, phòng Đồ họa và phòng Y tế.',
    n05:      'Tòa nhà N không 5 gồm Căng tin sinh viên ở tầng 1. Tầng 2 là khu Hiệu bộ, Ban Giám hiệu, phòng Kế toán và Đào tạo. Tầng 4 là Thư viện trung tâm và phòng họp.',
    square:   'Quảng trường Hoa Sen nằm ngay phía sau tòa N không 2, là không gian sinh hoạt chung và tổ chức các sự kiện văn hóa lớn của sinh viên nhà trường.',
    sports:   'Khu thể chất và sân bóng đá cỏ nhân tạo nằm bên trái khuôn viên trường, phục vụ học tập thể chất và các giải đấu thể thao sôi nổi của sinh viên.',
    model3d:  'Bạn đang ở chế độ Kính thực tế ảo 3D, hỗ trợ chia đôi màn hình hai mắt và xoay góc nhìn 360 độ.'
  };

  function speakFallbackIOS(text, lang) {
    if (!synth || !nativeSpeak) return;
    try {
      nativeCancel();
      const u = new SpeechSynthesisUtterance(text);
      const langMap = { vi: 'vi-VN', en: 'en-US', ja: 'ja-JP', ko: 'ko-KR' };
      u.lang = langMap[lang] || 'vi-VN';
      u.rate = lang === 'vi' ? 1.05 : 1.0;
      const voices = synth.getVoices() || [];
      const v = voices.find(item => item.lang && item.lang.toLowerCase().startsWith(lang));
      if (v) u.voice = v;
      nativeSpeak(u);
    } catch (e) {}
  }

  function playNarrationNow() {
    if (!isSpeaking || typeof SCENES !== 'object') return;
    const data = SCENES[currentSceneKey];
    if (!data) return;

    const lang = currentLang || 'vi';
    const text = (lang === 'vi' && SHORT_VI_SCRIPTS[currentSceneKey])
      ? SHORT_VI_SCRIPTS[currentSceneKey]
      : (data.desc?.[lang] || data.desc?.vi || '');
    if (!text) return;

    try { iosAudio.pause(); } catch (e) {}
    if (nativeCancel) try { nativeCancel(); } catch (e) {}

    const url = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=${lang}&q=${encodeURIComponent(text.slice(0, 190))}`;
    iosAudio.src = url;
    iosAudio.volume = 1.0;

    iosAudio.onplaying = () => {
      try { iosAudio.playbackRate = lang === 'vi' ? 1.12 : 1.05; } catch (e) {}
    };

    iosAudio.onerror = () => speakFallbackIOS(text, lang);

    const playPromise = iosAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => speakFallbackIOS(text, lang));
    }
  }

  // Ghi đè hàm đọc để khi bấm trên iPhone sẽ phát NGAY TRONG NHỊP CHẠM TAY (không bị iOS chặn do chờ 3.5 giây)
  if (isIOS) {
    window.speakCurrentDescription = playNarrationNow;

    const prevStart = window.startTourFromSplash;
    window.startTourFromSplash = function () {
      const r = typeof prevStart === 'function' ? prevStart.apply(this, arguments) : null;
      if (isSpeaking) playNarrationNow();
      return r;
    };

    const prevSelect = window.selectScene;
    window.selectScene = function () {
      const r = typeof prevSelect === 'function' ? prevSelect.apply(this, arguments) : null;
      if (isSpeaking && hasStartedFromSplash) {
        if (typeof infoPopupTimer !== 'undefined' && infoPopupTimer) clearTimeout(infoPopupTimer);
        document.getElementById('info-card')?.classList.add('visible');
        playNarrationNow();
      }
      return r;
    };
  }
})();
/* === TÍNH NĂNG CHỈ ĐƯỜNG TỪNG BƯỚC (STEP-BY-STEP NAVIGATION) TRONG CHATBOT & 360° === */
(function setupCTECHStepByStepNavigation() {
  // 1. BẢN ĐỒ KẾT NỐI CÁC NÚT 360° TRONG KHUÔN VIÊN CTECH (TỪ CỔNG VÀO TỪNG PHÒNG HỌC)
  const CAMPUS_EDGES = [
    // Trục đường chính từ Cổng trường vào các tòa
    ['9-ngoi-cng-chnh', '10-bn-trong-cng'],
    ['11-ngoi-cng-trng-', '9-ngoi-cng-chnh'],
    ['10-bn-trong-cng', '8-trc-mt-ton-n01'],
    ['10-bn-trong-cng', '24-ng-ba-gia-cc-ta'],
    ['24-ng-ba-gia-cc-ta', '13-mt-chnh-xng--t'],
    ['24-ng-ba-gia-cc-ta', '25-trc-ca-ta-n05-cng-tin'],
    ['24-ng-ba-gia-cc-ta', '52-ng-t-gia-cc-ta'],
    ['52-ng-t-gia-cc-ta', '44-bn-trong-vm-hoa-gia-hai-ta'],
    ['44-bn-trong-vm-hoa-gia-hai-ta', '30-trc-vm-hoa-bn-tri'],
    ['44-bn-trong-vm-hoa-gia-hai-ta', '43-trc-vm-hoa-bn-phi'],
    ['52-ng-t-gia-cc-ta', '34-trc-ta-n03'],
    ['52-ng-t-gia-cc-ta', '45-trc-mt-ta-n04'],
    ['52-ng-t-gia-cc-ta', '51-ng-ba-gn-qung-trng-ctech'],

    // Nhánh Tòa N01 (Hội trường, Tuyển sinh, CT HSSV, CNTT, Tiếng Nhật)
    ['8-trc-mt-ton-n01', '2-bn-ngoi-n01'],
    ['8-trc-mt-ton-n01', '12-mt-bn-tri-ton-n01'],
    ['12-mt-bn-tri-ton-n01', '59-ng-ba-cng-ph-gn-n01'],
    ['59-ng-ba-cng-ph-gn-n01', '60-cng-ph'],
    ['2-bn-ngoi-n01', '0-snh-n01'],
    ['0-snh-n01', '3-phng-cng-tc-tuyn-sinh'],
    ['0-snh-n01', '1-hi-trng-n01'],
    ['0-snh-n01', '4-phng-thc-hnh-my'],
    ['4-phng-thc-hnh-my', '5-phng-thc-hng-v-m'],
    ['0-snh-n01', '6-phng-ting-nht-ln'],
    ['6-phng-ting-nht-ln', '7-phng-ting-nht-b'],

    // Nhánh Tòa N02 (Xưởng Ô tô, Phòng Điện, Sân cầu lông, Ký túc xá)
    ['13-mt-chnh-xng--t', '14-bn-trong-xng--t'],
    ['13-mt-chnh-xng--t', '23-ng-i-quay-n02'],
    ['13-mt-chnh-xng--t', '16-tng-hai-ta-n02'],
    ['16-tng-hai-ta-n02', '15-tng-hai-ta-n02-trc-ca-phng-in'],
    ['15-tng-hai-ta-n02-trc-ca-phng-in', '17-bn-trong-phng-in-n02'],
    ['16-tng-hai-ta-n02', '18-trc-ca-i-vo-sn-cu-lng-n02'],
    ['18-trc-ca-i-vo-sn-cu-lng-n02', '19-sn-cu-lng-n02'],
    ['16-tng-hai-ta-n02', '20-tng-ba-ta-n02-k-tc-x'],
    ['20-tng-ba-ta-n02-k-tc-x', '21-hanh-lang-tng-ba-ton-n02'],
    ['21-hanh-lang-tng-ba-ton-n02', '22-bn-trong-phng-k-tc'],

    // Nhánh Tòa N03 (P.101 Điều dưỡng, P.102 Trang điểm, P.103 Spa, P.105 Đồ họa)
    ['34-trc-ta-n03', '35-chnh-gia-ta-n03'],
    ['34-trc-ta-n03', '31-trc-bi-rc-gn-n03'],
    ['31-trc-bi-rc-gn-n03', '32-sau-ta-n03'],
    ['32-sau-ta-n03', '33-sau-ta-n03-s-2'],
    ['35-chnh-gia-ta-n03', '36-phng-thc-hnh-iu-dng'],
    ['35-chnh-gia-ta-n03', '37-phng-thc-hnh-sc-p-trang-im'],
    ['35-chnh-gia-ta-n03', '38-phng-thc-hnh-sc-p-iu-tr-da-mt'],
    ['35-chnh-gia-ta-n03', '39-phng-chng-by-ca-thit-k--ha'],
    ['35-chnh-gia-ta-n03', '40-tng-hai-ta-n03'],
    ['40-tng-hai-ta-n03', '42-phng-hc-ta-n03'],

    // Nhánh Tòa N04 (P.101 Y tế, P.106 Chế biến món ăn, Ngoại ngữ, Tiếng Hán)
    ['45-trc-mt-ta-n04', '46-chnh-gia-ta-n04'],
    ['46-chnh-gia-ta-n04', '47-phng-y-t-n04'],
    ['46-chnh-gia-ta-n04', '50-phng-thc-hnh-ch-bin'],
    ['46-chnh-gia-ta-n04', '41-phng-hc-ting-hn-ta-n04'],
    ['46-chnh-gia-ta-n04', '48-phng-thc-hnh-thit-k--ha-n04'],
    ['46-chnh-gia-ta-n04', '49-trung-tm-ngoi-ng-tng-2-n04'],

    // Nhánh Tòa N05 (Căng tin, Kế toán - Đào tạo, Thư viện)
    ['25-trc-ca-ta-n05-cng-tin', '26-cng-tin-n05'],
    ['25-trc-ca-ta-n05-cng-tin', '27-phng-gio-vin-k-ton-o-to'],
    ['27-phng-gio-vin-k-ton-o-to', '28-th-vin-n05'],
    ['28-th-vin-n05', '29-trong-phng-hp-th-vin'],

    // Nhánh Quảng trường Hoa Sen & Sân bóng đá
    ['51-ng-ba-gn-qung-trng-ctech', '54-gia-sn-ctech'],
    ['54-gia-sn-ctech', '55-qung-trng-ctech'],
    ['59-ng-ba-cng-ph-gn-n01', '61-ng-vo-sn-bng'],
    ['61-ng-vo-sn-bng', '56-on-ng-vo-sn-bng'],
    ['56-on-ng-vo-sn-bng', '53-on-ng-gn-sn-bng'],
    ['53-on-ng-gn-sn-bng', '57-v-tr--xem--bng'],
    ['57-v-tr--xem--bng', '58-sn-bng']
  ];

  // 2. XÂY DỰNG TỪ ĐIỂN TÊN NÚT & ĐỒ THỊ TÌM ĐƯỜNG NGẮN NHẤT (BFS)
  const nodeInfoMap = {};
  if (typeof SCENES === 'object') {
    Object.keys(SCENES).forEach(sceneKey => {
      const sc = SCENES[sceneKey];
      if (sc.marzipanoId && !nodeInfoMap[sc.marzipanoId]) {
        nodeInfoMap[sc.marzipanoId] = {
          sceneKey,
          marzId: sc.marzipanoId,
          label: sc.title?.vi || sc.menu?.vi || sc.marzipanoId
        };
      }
      if (Array.isArray(sc.subItems)) {
        sc.subItems.forEach(sub => {
          if (sub.marzipanoId) {
            nodeInfoMap[sub.marzipanoId] = {
              sceneKey,
              marzId: sub.marzipanoId,
              label: (typeof MARZIPANO_NAME_OVERRIDES === 'object' && MARZIPANO_NAME_OVERRIDES[sub.marzipanoId]) ||
                     sub.label?.vi || sub.marzipanoId
            };
          }
        });
      }
    });
  }

  function getNodeLabel(marzId) {
    if (typeof MARZIPANO_NAME_OVERRIDES === 'object' && MARZIPANO_NAME_OVERRIDES[marzId]) {
      return MARZIPANO_NAME_OVERRIDES[marzId];
    }
    return nodeInfoMap[marzId]?.label || marzId;
  }

  function getNodeSceneKey(marzId) {
    return nodeInfoMap[marzId]?.sceneKey || 'campus';
  }

  function buildAdjacencyGraph() {
    const adj = {};
    function addEdge(a, b) {
      if (!a || !b) return;
      if (!adj[a]) adj[a] = new Set();
      if (!adj[b]) adj[b] = new Set();
      adj[a].add(b);
      adj[b].add(a);
    }
    CAMPUS_EDGES.forEach(([u, v]) => addEdge(u, v));

    // Tự động bổ sung thêm các liên kết hotspot thực tế từ Marzipano nếu đã tải
    try {
      const frame = document.getElementById('marzipano-frame');
      const appData = frame?.contentWindow?.APP_DATA;
      if (appData && Array.isArray(appData.scenes)) {
        appData.scenes.forEach(sc => {
          if (Array.isArray(sc.linkHotspots)) {
            sc.linkHotspots.forEach(lh => addEdge(sc.id, lh.target));
          }
        });
      }
    } catch (e) {}

    return adj;
  }

  function findShortestRoute(startMarzId, targetMarzId) {
    if (!targetMarzId) return [];
    const start = startMarzId || '9-ngoi-cng-chnh';
    if (start === targetMarzId) return [start];

    const adj = buildAdjacencyGraph();
    const queue = [[start]];
    const visited = new Set([start]);

    while (queue.length > 0) {
      const path = queue.shift();
      const curr = path[path.length - 1];
      const neighbors = adj[curr] ? Array.from(adj[curr]) : [];

      for (const nxt of neighbors) {
        if (nxt === targetMarzId) {
          return [...path, nxt];
        }
        if (!visited.has(nxt)) {
          visited.add(nxt);
          queue.push([...path, nxt]);
        }
      }
    }
    // Dự phòng nếu chọn cảnh chưa nối trực tiếp
    return [start, targetMarzId];
  }

  // 3. GIAO DIỆN THANH DẪN ĐƯỜNG TỪNG BƯỚC (NAVIGATION HUD) & NÚT CHAT
  const navStyle = document.createElement('style');
  navStyle.textContent = `
    .chat-nav-btn-group {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 7px;
    }
    .chat-jump-btn {
      margin-top: 0 !important;
    }
    .chat-step-guide-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: linear-gradient(135deg, #d97706 0%, #ea580c 100%);
      color: #ffffff;
      border: 1px solid #fde047;
      border-radius: 5px;
      padding: 5px 10px;
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(234, 88, 12, 0.35);
      transition: transform 0.15s ease, filter 0.15s ease;
    }
    .chat-step-guide-btn:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }

    /* Thanh HUD Chỉ đường từng bước trên màn hình 360 */
    #ctech-step-nav-hud {
      position: fixed;
      top: 14px;
      left: calc(50% + 100px);
      transform: translateX(-50%);
      z-index: 210;
      background: rgba(3, 34, 21, 0.94);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1.5px solid #facc15;
      border-radius: 12px;
      padding: 10px 14px;
      color: #ffffff;
      width: min(560px, 92vw);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);
      display: none;
      flex-direction: column;
      gap: 8px;
      transition: left 0.35s ease;
    }
    body.sidebar-closed #ctech-step-nav-hud {
      left: 50%;
    }
    #ctech-step-nav-hud.active {
      display: flex;
    }
    .step-hud-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .step-hud-title {
      font-size: 12.5px;
      font-weight: 800;
      color: #fde047;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .step-hud-controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .step-hud-btn {
      background: #006b3f;
      color: #ffffff;
      border: 1px solid rgba(250, 204, 21, 0.7);
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
    }
    .step-hud-btn:hover {
      background: #059669;
    }
    .step-hud-btn.auto-active {
      background: #ea580c;
      border-color: #fde047;
    }
    .step-hud-btn.close-btn {
      background: rgba(239, 68, 68, 0.85);
      border-color: rgba(255, 255, 255, 0.4);
      padding: 4px 8px;
    }
    .step-hud-progress {
      font-size: 12px;
      color: #ecfdf5;
      line-height: 1.4;
      background: rgba(0, 107, 63, 0.45);
      padding: 6px 10px;
      border-radius: 7px;
      border-left: 3px solid #f97316;
    }
    .step-hud-nodes {
      display: flex;
      align-items: center;
      gap: 5px;
      overflow-x: auto;
      padding-bottom: 2px;
      scrollbar-width: none;
    }
    .step-hud-nodes::-webkit-scrollbar { display: none; }
    .step-node-pill {
      background: rgba(255, 255, 255, 0.12);
      color: #d1fae5;
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 999px;
      padding: 3px 9px;
      font-size: 10.8px;
      white-space: nowrap;
      cursor: pointer;
      flex-shrink: 0;
    }
    .step-node-pill.done {
      background: rgba(16, 185, 129, 0.3);
      color: #a7f3d0;
      border-color: #10b981;
    }
    .step-node-pill.current {
      background: #f59e0b;
      color: #032215;
      font-weight: 800;
      border-color: #ffffff;
    }
    .step-node-arrow {
      color: #fde047;
      font-size: 11px;
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      #ctech-step-nav-hud {
        top: 52px !important;
        left: 50% !important;
        width: 94vw !important;
        padding: 8px 10px !important;
      }
      .step-hud-title { font-size: 11.5px; }
      .step-hud-progress { font-size: 11.2px; padding: 5px 8px; }
      .step-hud-btn { font-size: 10.8px; padding: 4px 8px; }
    }
  `;
  document.head.appendChild(navStyle);

  const hudEl = document.createElement('div');
  hudEl.id = 'ctech-step-nav-hud';
  hudEl.innerHTML = `
    <div class="step-hud-top">
      <div class="step-hud-title" id="step-hud-title-text">🧭 DẪN ĐƯỜNG TỪNG BƯỚC</div>
      <div class="step-hud-controls">
        <button type="button" class="step-hud-btn" id="step-hud-prev-btn" title="Lùi lại 1 nút">⬅ Lùi</button>
        <button type="button" class="step-hud-btn" id="step-hud-next-btn" title="Đi tới nút tiếp theo">Bước tiếp ➔</button>
        <button type="button" class="step-hud-btn" id="step-hud-auto-btn" title="Tự động đi qua từng nút">▶ Tự động đi</button>
        <button type="button" class="step-hud-btn close-btn" id="step-hud-close-btn" title="Tắt dẫn đường">✕</button>
      </div>
    </div>
    <div class="step-hud-progress" id="step-hud-desc"></div>
    <div class="step-hud-nodes" id="step-hud-nodes-bar"></div>
  `;
  document.body.appendChild(hudEl);

  // 4. LOGIC ĐIỀU KHIỂN CHẶNG ĐƯỜNG & LÀM SÁNG NÚT HOTSPOT TRONG 360°
  let activeRoute = [];
  let activeStepIndex = 0;
  let autoWalkTimer = null;

  function clearHotspotHighlightsInIframe() {
    try {
      const frame = document.getElementById('marzipano-frame');
      const innerDoc = frame?.contentDocument || frame?.contentWindow?.document;
      if (!innerDoc) return;
      innerDoc.querySelectorAll('.ctech-next-step-hotspot').forEach(el => {
        el.classList.remove('ctech-next-step-hotspot');
      });
      innerDoc.querySelectorAll('.ctech-next-step-badge').forEach(el => el.remove());
    } catch (e) {}
  }

  function highlightNextHotspotInIframe(nextMarzId) {
    clearHotspotHighlightsInIframe();
    if (!nextMarzId) return;

    try {
      const frame = document.getElementById('marzipano-frame');
      const innerDoc = frame?.contentDocument || frame?.contentWindow?.document;
      if (!innerDoc) return;

      // Chèn CSS hiệu ứng phát sáng vàng cam cho nút mũi tên chỉ đường trong iframe
      if (!innerDoc.getElementById('ctech-hotspot-guide-css')) {
        const st = innerDoc.createElement('style');
        st.id = 'ctech-hotspot-guide-css';
        st.textContent = `
          @keyframes ctechGuidePulse {
            0% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.9), 0 0 20px #f97316; transform: scale(1.08); }
            70% { box-shadow: 0 0 0 18px rgba(250, 204, 21, 0), 0 0 28px #fde047; transform: scale(1.18); }
            100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0), 0 0 20px #f97316; transform: scale(1.08); }
          }
          .link-hotspot.ctech-next-step-hotspot {
            background: rgba(234, 88, 12, 0.88) !important;
            border: 3px solid #fde047 !important;
            animation: ctechGuidePulse 1.3s infinite !important;
            z-index: 999 !important;
          }
          .ctech-next-step-badge {
            position: absolute;
            bottom: 68px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
            color: #ffffff;
            border: 1.5px solid #fef08a;
            border-radius: 20px;
            padding: 4px 11px;
            font-size: 11.5px;
            font-weight: 800;
            white-space: nowrap;
            box-shadow: 0 4px 14px rgba(0,0,0,0.55);
            pointer-events: none;
          }
        `;
        innerDoc.head.appendChild(st);
      }

      const nextName = removeAccents(getNodeLabel(nextMarzId));
      const allHotspots = Array.from(innerDoc.querySelectorAll('.link-hotspot'));

      allHotspots.forEach(hs => {
        if (hs.offsetParent === null) return; // Chỉ xét hotspot của cảnh đang mở
        const tip = hs.querySelector('.link-hotspot-tooltip');
        const tipText = removeAccents(tip ? tip.textContent : '');

        if (tipText && (nextName.includes(tipText) || tipText.includes(nextName))) {
          hs.classList.add('ctech-next-step-hotspot');
          const badge = innerDoc.createElement('div');
          badge.className = 'ctech-next-step-badge';
          badge.textContent = '👉 ĐI HƯỚNG NÀY: ' + getNodeLabel(nextMarzId);
          hs.appendChild(badge);
        }
      });
    } catch (e) {}
  }

  function renderStepHUD() {
    if (!activeRoute.length) {
      hudEl.classList.remove('active');
      clearHotspotHighlightsInIframe();
      return;
    }

    hudEl.classList.add('active');
    const total = activeRoute.length;
    const currId = activeRoute[activeStepIndex];
    const nextId = activeStepIndex < total - 1 ? activeRoute[activeStepIndex + 1] : null;
    const destId = activeRoute[total - 1];

    document.getElementById('step-hud-title-text').textContent =
      `🧭 CHẶNG ${activeStepIndex + 1}/${total} • ĐÍCH: ${getNodeLabel(destId)}`;

    const descEl = document.getElementById('step-hud-desc');
    if (nextId) {
      descEl.innerHTML =
        `📍 <b>Đang ở:</b> ${getNodeLabel(currId)}<br>` +
        `👉 <b>Đi tiếp tới:</b> <span style="color:#fde047;font-weight:700;">${getNodeLabel(nextId)}</span> <i>(Bấm mũi tên phát sáng trên màn hình hoặc nút "Bước tiếp ➔")</i>`;
    } else {
      descEl.innerHTML =
        `🎉 <b>ĐÃ ĐẾN NƠI:</b> <span style="color:#fde047;font-weight:700;">${getNodeLabel(currId)}</span>! Chúc bạn tham quan trải nghiệm vui vẻ.`;
      stopAutoWalk();
    }

    const prevBtn = document.getElementById('step-hud-prev-btn');
    const nextBtn = document.getElementById('step-hud-next-btn');
    if (prevBtn) prevBtn.style.display = activeStepIndex > 0 ? 'inline-block' : 'none';
    if (nextBtn) nextBtn.style.display = nextId ? 'inline-block' : 'none';

    const nodesBar = document.getElementById('step-hud-nodes-bar');
    nodesBar.innerHTML = '';
    activeRoute.forEach((mId, idx) => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'step-node-pill' +
        (idx < activeStepIndex ? ' done' : '') +
        (idx === activeStepIndex ? ' current' : '');
      pill.textContent = `${idx + 1}. ${getNodeLabel(mId)}`;
      pill.onclick = () => goToRouteStep(idx);
      nodesBar.appendChild(pill);

      if (idx < total - 1) {
        const arr = document.createElement('span');
        arr.className = 'step-node-arrow';
        arr.textContent = '➔';
        nodesBar.appendChild(arr);
      }
    });

    setTimeout(() => {
      const curPill = nodesBar.querySelector('.step-node-pill.current');
      if (curPill) curPill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, 60);
  }

  function goToRouteStep(index) {
    if (index < 0 || index >= activeRoute.length) return;
    activeStepIndex = index;
    const targetMarzId = activeRoute[activeStepIndex];
    const nextMarzId = activeStepIndex < activeRoute.length - 1 ? activeRoute[activeStepIndex + 1] : null;
    const sceneKey = getNodeSceneKey(targetMarzId);

    selectScene(sceneKey, false, targetMarzId);
    renderStepHUD();

    setTimeout(() => {
      highlightNextHotspotInIframe(nextMarzId);
    }, 450);
  }

  function stopAutoWalk() {
    if (autoWalkTimer) {
      clearInterval(autoWalkTimer);
      autoWalkTimer = null;
    }
    const autoBtn = document.getElementById('step-hud-auto-btn');
    if (autoBtn) {
      autoBtn.classList.remove('auto-active');
      autoBtn.textContent = '▶ Tự động đi';
    }
  }

  function toggleAutoWalk() {
    if (autoWalkTimer) {
      stopAutoWalk();
      return;
    }
    if (activeStepIndex >= activeRoute.length - 1) {
      activeStepIndex = 0;
      goToRouteStep(0);
    }
    const autoBtn = document.getElementById('step-hud-auto-btn');
    if (autoBtn) {
      autoBtn.classList.add('auto-active');
      autoBtn.textContent = '⏸ Đang tự đi...';
    }
    autoWalkTimer = setInterval(() => {
      if (activeStepIndex < activeRoute.length - 1) {
        goToRouteStep(activeStepIndex + 1);
      } else {
        stopAutoWalk();
      }
    }, 3400);
  }

  function stopStepNavigation() {
    stopAutoWalk();
    activeRoute = [];
    activeStepIndex = 0;
    renderStepHUD();
  }

  function startStepByStepTo(targetSceneKey, specificMarzId) {
    stopAutoWalk();
    const resolvedMarzId = specificMarzId || (typeof SCENES === 'object' && SCENES[targetSceneKey]?.marzipanoId);
    if (!resolvedMarzId) {
      selectScene(targetSceneKey, false);
      return;
    }

    // Nếu người dùng đang ở cảnh Flycam trên cao (chưa đứng ở nút mặt đất nào), bắt đầu dẫn từ Ngoài cổng chính
    const startMarzId = currentMarzipanoId || '9-ngoi-cng-chnh';
    activeRoute = findShortestRoute(startMarzId, resolvedMarzId);
    activeStepIndex = 0;

    // Thu gọn khung chat trên điện thoại và ẩn hộp thuyết minh để nhìn rõ đường đi
    if (window.innerWidth <= 768 && typeof toggleChatbot === 'function') {
      toggleChatbot(false);
    }
    const infoCard = document.getElementById('info-card');
    if (infoCard) infoCard.classList.remove('visible');

    goToRouteStep(0);
  }

  document.getElementById('step-hud-prev-btn').onclick = () => {
    stopAutoWalk();
    if (activeStepIndex > 0) goToRouteStep(activeStepIndex - 1);
  };
  document.getElementById('step-hud-next-btn').onclick = () => {
    stopAutoWalk();
    if (activeStepIndex < activeRoute.length - 1) goToRouteStep(activeStepIndex + 1);
  };
  document.getElementById('step-hud-auto-btn').onclick = toggleAutoWalk;
  document.getElementById('step-hud-close-btn').onclick = stopStepNavigation;

  // Tự động đồng bộ tiến độ khi người dùng tự bấm trực tiếp vào nút mũi tên 360° trên màn hình
  setInterval(() => {
    if (!activeRoute.length || !currentMarzipanoId) return;
    const idxInRoute = activeRoute.indexOf(currentMarzipanoId);
    if (idxInRoute !== -1 && idxInRoute !== activeStepIndex) {
      activeStepIndex = idxInRoute;
      renderStepHUD();
      const nextId = activeStepIndex < activeRoute.length - 1 ? activeRoute[activeStepIndex + 1] : null;
      setTimeout(() => highlightNextHotspotInIframe(nextId), 350);
    }
  }, 400);

  // 5. TÍCH HỢP NÚT "🧭 CHỈ ĐƯỜNG TỪNG BƯỚC" VÀO MỌI CÂU TRẢ LỜI CỦA CHATBOT
  const origAppendBotMessage = window.appendBotMessage || appendBotMessage;

  function enhancedAppendBotMessage(htmlText, targetSceneKey, targetLabel, specificMarzId = null, extraButtons = null) {
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.innerHTML = htmlText;

    function createActionPair(sceneKey, marzId, jumpLabel) {
      if (!sceneKey || !SCENES[sceneKey]) return;
      const resolvedMarz = marzId || SCENES[sceneKey].marzipanoId;

      const group = document.createElement('div');
      group.className = 'chat-nav-btn-group';

      // Nút 1: Đi thẳng tới phòng (nhảy nhanh)
      const jumpBtn = document.createElement('button');
      jumpBtn.type = 'button';
      jumpBtn.className = 'chat-jump-btn';
      jumpBtn.innerHTML = '📍 ' + (jumpLabel || SCENE_BUTTON_NAMES[sceneKey] || 'Đi thẳng tới đây');
      jumpBtn.onclick = (e) => {
        e.stopPropagation();
        stopStepNavigation();
        selectScene(sceneKey, false, marzId || null);
      };
      group.appendChild(jumpBtn);

      // Nút 2: Chỉ đường từng bước qua các nút 360° (nếu điểm đến là cảnh mặt đất/phòng học)
      if (resolvedMarz) {
        const stepBtn = document.createElement('button');
        stepBtn.type = 'button';
        stepBtn.className = 'chat-step-guide-btn';
        stepBtn.innerHTML = '🧭 Chỉ đường từng bước tới đây';
        stepBtn.onclick = (e) => {
          e.stopPropagation();
          startStepByStepTo(sceneKey, resolvedMarz);
        };
        group.appendChild(stepBtn);
      }

      div.appendChild(group);
    }

    if (Array.isArray(extraButtons) && extraButtons.length > 0) {
      extraButtons.forEach(btnInfo => {
        if (!btnInfo || !SCENES[btnInfo.scene]) return;
        createActionPair(btnInfo.scene, btnInfo.marzId, btnInfo.btnText);
      });
    } else if (targetSceneKey && SCENES[targetSceneKey]) {
      createActionPair(targetSceneKey, specificMarzId, targetLabel);
    }

    chatMessagesEl.appendChild(div);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  }

  appendBotMessage = enhancedAppendBotMessage;
  window.appendBotMessage = enhancedAppendBotMessage;
  window.startCTECHStepByStepNavigation = startStepByStepTo;
})();