// 三关数据：使用你仓库中的图片（A1/A2 为第一关，B1/B2 第二关，C1/C2 第三关）
// hotspots 用百分比 (x,y) 和 半径 r (百分比)
// 永久修复：
// 1) checkHit 改为 nearest-first（若点击落在多个 hotspots 重叠区，优先匹配距离最近的）
// 2) addMarker 创建的 marker 不拦截点击并短暂淡出后移除，避免挡住后续点击
// 3) 第2关 hotspots 使用用户测试坐标，半径 r 设为 6 以提高识别鲁棒性
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

function loadLevel(idx){
  // ensure internal current stays in sync with any external callers
  current = idx;
  window.current = current;

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

  // debug visual dot so you可以 see click position on mobile
  try{
    const dot = document.createElement('div');
    dot.className = 'debug-dot';
    dot.style.left = px + '%';
    dot.style.top = py + '%';
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

// 创建 non-blocking marker 并短暂淡出后移除
function addMarker(xPercent,yPercent,rPercent){
  const marker = document.createElement('div');
  marker.className = 'marker';
  const size = (rPercent * 2); // 直径百分比
  marker.style.width = size + '%';
  marker.style.height = size + '%';
  marker.style.left = xPercent + '%';
  marker.style.top = yPercent + '%';
  marker.style.pointerEvents = 'none';
  marker.style.transition = 'opacity 0.25s';
  overlay.appendChild(marker);
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
    d.style.background = 'rgba(255,0,0,0.12)';
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

{