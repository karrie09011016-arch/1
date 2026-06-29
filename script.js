// 三关数据：使用你仓库中的图片（A1/A2 为第一关，B1/B2 第二关，C1/C2 第三关）
// hotspots 用百分比 (x,y) 和 半径 r (百分比)
// 永久修复：
// - 优先匹配最近的 hotspot（nearest-first）
// - marker 为 absolute、中心对齐、pointer-events: none，并短暂淡出后移除
// - overlay 强制置顶并开启 pointer-events，避免 marker 或其他元素遮挡
// - 第2关坐标/半径按用户测试更新并微调为 r=6
// debug 模式：在 URL 中加 ?debug=1 可显示热点区域辅助校准
const levels = [
  {
    left: 'A1.jpg',
    right: 'A2.jpg',
    hotspots: [
      { x: 39, y: 63, r: 6 },
      { x: 78, y: 80, r: 6 },
      { x: 26, y: 23, r: 6 },
    ]
  },
  {
    left: 'B1.jpg',
    right: 'B2.jpg',
    // 已按用户测试更新为下面坐标，r=6（增大一点容错）
    hotspots: [
      { x: 20, y: 44, r: 6 },
      { x: 65, y: 45, r: 6 },
      { x: 66, y: 33, r: 6 },
    ]
  },
  {
    left: 'C1.jpg',
    right: 'C2.jpg',
    hotspots: [
      { x: 21, y: 37, r: 6 },
      { x: 50, y: 65, r: 6 },
      { x: 73, y: 32, r: 6 },
    ]
  }
];

let current = 0;
let found = []; // boolean per hotspot

const imgLeft = document.getElementById('imgLeft');
const imgRight = document.getElementById('imgRight');
const overlay = document.getElementById('overlay');
const foundCountEl = document.getElementById('foundCount');
const totalCountEl = document.getElementById('totalCount');
const levelLabel = document.getElementById('levelLabel');
const modal = document.getElementById('modal');
const modalText = document.getElementById('modalText');
const modalNextBtn = document.getElementById('nextBtn');

// debug 模式：在 URL 中加 ?debug=1 可显示热点区域辅助校准
const debugMode = new URLSearchParams(location.search).get('debug') === '1';

function ensureOverlayTop(){
  if(!overlay) return;
  // 确保 overlay 可接收事件并在最上层
  overlay.style.position = overlay.style.position || 'relative';
  overlay.style.zIndex = '9999';
  overlay.style.pointerEvents = 'auto';
  // 改善移动端触控响应
  overlay.style.touchAction = overlay.style.touchAction || 'manipulation';
}

function loadLevel(idx){
  // ensure internal current stays in sync with any external callers
  current = idx;
  window.current = current;

  ensureOverlayTop();

  const lvl = levels[idx];
  imgLeft.src = lvl.left;
  imgRight.src = lvl.right;
  found = new Array(lvl.hotspots.length).fill(false);
  clearMarkers();
  clearDebugHotspots();
  updateInfo();
  levelLabel.textContent = `第 ${idx+1} 关 / 共 ${levels.length} 关`;
  totalCountEl.textContent = lvl.hotspots.length;
  hideModal();
  if(debugMode) renderDebugHotspots(lvl.hotspots);
}

// 把已找到的 marker DOM 清掉
function clearMarkers(){
  const existing = document.querySelectorAll('.marker');
  existing.forEach(n=>n.remove());
}

function clearDebugHotspots(){
  const existing = document.querySelectorAll('.hotspot-debug');
  existing.forEach(n=>n.remove());
}

// 计算点击相对百分比并判断是否命中
function onClickEvent(e){
  // 支持 touch 和 mouse
  const rect = overlay.getBoundingClientRect();
  const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
  const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
  const px = ((clientX - rect.left) / rect.width) * 100;
  const py = ((clientY - rect.top) / rect.height) * 100;

  // debug log
  console.log('click at', Math.round(px), Math.round(py));

  // debug visual dot so you��以 see click position on mobile
  try{
    const dot = document.createElement('div');
    dot.className = 'debug-dot';
    dot.style.position = 'absolute';
    dot.style.left = px + '%';
    dot.style.top = py + '%';
    dot.style.transform = 'translate(-50%,-50%)';
    dot.style.width = '6px';
    dot.style.height = '6px';
    dot.style.background = 'rgba(0,0,0,0.5)';
    dot.style.borderRadius = '50%';
    dot.style.pointerEvents = 'none';
    overlay.appendChild(dot);
    setTimeout(()=>dot.remove(),900);
  }catch(e){console.warn(e)}

  checkHit(px, py);
}

// 修正：优先匹配最近的未找到 hotspot
function checkHit(px, py){
  const lvl = levels[current];
  let bestIndex = -1;
  let bestDist = Infinity;
  for(let i=0;i<lvl.hotspots.length;i++){
    if(found[i]) continue;
    const h = lvl.hotspots[i];
    const dx = px - h.x;
    const dy = py - h.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    console.log(`hotspot[${i}] dist=${dist.toFixed(2)} r=${h.r} found=${found[i]}`);
    if(dist <= h.r && dist < bestDist){
      bestDist = dist;
      bestIndex = i;
    }
  }
  if(bestIndex !== -1){
    found[bestIndex] = true;
    const h = lvl.hotspots[bestIndex];
    addMarker(h.x, h.y, h.r);
    updateInfo();
    if(navigator.vibrate) navigator.vibrate(50);
    if(found.every(Boolean)){
      setTimeout(()=> showLevelComplete(), 400);
    }
  }
}

// 创建 non-blocking、绝对定位且中心对齐的 marker，并短暂淡出后移除
function addMarker(xPercent,yPercent,rPercent){
  const marker = document.createElement('div');
  marker.className = 'marker';
  const size = (rPercent * 2); // 直径百分比
  marker.style.position = 'absolute';
  marker.style.width = size + '%';
  marker.style.height = size + '%';
  marker.style.left = xPercent + '%';
  marker.style.top = yPercent + '%';
  marker.style.transform = 'translate(-50%,-50%)';
  marker.style.background = 'rgba(255,0,0,0.18)';
  marker.style.border = '2px solid rgba(255,0,0,0.7)';
  marker.style.borderRadius = '50%';
  marker.style.pointerEvents = 'none';
  marker.style.transition = 'opacity 0.25s';
  marker.style.opacity = '1';
  overlay.appendChild(marker);
  // 让 marker 在视觉上保留一瞬间然后淡出并移除，避免遮挡后续点击
  setTimeout(()=> marker.style.opacity = '0', 700);
  setTimeout(()=> marker.remove(), 950);
}

function renderDebugHotspots(hotspots){
  hotspots.forEach(h=>{
    const d = document.createElement('div');
    d.className = 'hotspot-debug';
    const size = (h.r * 2);
    d.style.position = 'absolute';
    d.style.left = h.x + '%';
    d.style.top = h.y + '%';
    d.style.width = size + '%';
    d.style.height = size + '%';
    d.style.transform = 'translate(-50%,-50%)';
    d.style.background = 'rgba(255,0,0,0.10)';
    d.style.border = '2px dashed rgba(255,0,0,0.6)';
    d.style.borderRadius = '50%';
    d.style.pointerEvents = 'none';
    overlay.appendChild(d);
  });
}

function updateInfo(){
  const foundCount = found.filter(Boolean).length;
  foundCountEl.textContent = foundCount;
  totalCountEl.textContent = levels[current].hotspots.length;
}

function showLevelComplete(){
  modalText.textContent = current < levels.length - 1 ? '恭喜过关！准备进入下一关' : '全部完成，恭喜！';
  modalNextBtn.textContent = current < levels.length - 1 ? '下一关' : '完成';
  showModal();
}

function showModal(){ modal.classList.remove('hidden'); }
function hideModal(){ modal.classList.add('hidden'); }

// 下一关按钮处理
modalNextBtn.addEventListener('click', ()=>{
  hideModal();
  if(current < levels.length - 1){
    current++;
    loadLevel(current);
  } else {
    current = 0;
    loadLevel(current);
  }
});

// 事件监听（支持 touchstart 以便移动端无延迟）
overlay.addEventListener('click', onClickEvent);
overlay.addEventListener('touchstart', function(e){ e.preventDefault(); onClickEvent(e); }, {passive:false});

// 暴露到 window 以便 index.html 的控件使用
window.levels = levels;
window.current = current;
window.loadLevel = loadLevel;

// 初始加载
loadLevel(current);
