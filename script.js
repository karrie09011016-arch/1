// 三关数据：使用你仓库中的图片（A1/A2 为第一关，B1/B2 第二关，C1/C2 第三关）
// hotspots 用百分比 (x,y) 和 半径 r (百分比)
// 修复说明：确保 "found" 与 "current" 在 window 上可访问，并导出 checkHit，保证在不同上下文（htmlpreview/raw）下也能工作。
const levels = [
  {
    left: 'A1.jpg',
    right: 'A2.jpg',
    hotspots: [
      { x: 39, y: 63, r: 9 },
      { x: 78, y: 80, r: 9 },
      { x: 26, y: 23, r: 9 },
    ]
  },
  {
    left: 'B1.jpg',
    right: 'B2.jpg',
    hotspots: [
      { x: 66, y: 43, r: 9 },
      { x: 21, y: 44, r: 9 },
      { x: 43, y: 23, r: 9 },
    ]
  },
  {
    left: 'C1.jpg',
    right: 'C2.jpg',
    hotspots: [
      { x: 34, y: 30, r: 9 },
      { x: 55, y: 55, r: 9 },
      { x: 78, y: 68, r: 9 },
    ]
  }
];

// 保证全局可访问
window.levels = levels;
window.current = window.current || 0;
// 确保 found 在 window 上（页面其他脚本或临时补丁可能读取 window.found��
window.found = window.found || [];

const imgLeft = document.getElementById('imgLeft');
const imgRight = document.getElementById('imgRight');
const overlay = document.getElementById('overlay');
const foundCountEl = document.getElementById('foundCount');
const totalCountEl = document.getElementById('totalCount');
const levelLabel = document.getElementById('levelLabel');
const modal = document.getElementById('modal');
const modalText = document.getElementById('modalText');
const nextBtn = document.getElementById('nextBtn');

// debug 模式：在 URL 中加 ?debug=1 可显示热点区域辅助校准
const debugMode = new URLSearchParams(location.search).get('debug') === '1';

function loadLevel(idx){
  if(!levels[idx]){
    console.error('levels not available or index out of range', idx);
    return;
  }
  // 保持 window.current 与内部索引一致
  window.current = idx;

  const lvl = levels[idx];
  if(imgLeft) imgLeft.src = lvl.left;
  if(imgRight) imgRight.src = lvl.right;

  // 使用 window.found 作为全局状态
  window.found = new Array(lvl.hotspots.length).fill(false);

  clearMarkers();
  clearDebugHotspots();
  updateInfo();
  if(levelLabel) levelLabel.textContent = `第 ${idx+1} 关 / 共 ${levels.length} 关`;
  if(totalCountEl) totalCountEl.textContent = lvl.hotspots.length;
  hideModal();
  if(debugMode) renderDebugHotspots(lvl.hotspots);
  console.log('loaded level', idx, 'hotspots', lvl.hotspots);
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
  if(!overlay) return;
  // 支持 touch 和 mouse
  const rect = overlay.getBoundingClientRect();
  const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
  const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
  const px = ((clientX - rect.left) / rect.width) * 100;
  const py = ((clientY - rect.top) / rect.height) * 100;

  // debug log
  console.log('click at', Math.round(px), Math.round(py));

  // debug visual dot so you can see click position on mobile
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

// 检查是否命中未找到的热点
function checkHit(px, py){
  const lvl = levels[window.current];
  if(!lvl){ console.error('no level data for index', window.current); return; }

  // 确保 window.found 有效且长度与 hotspots 对应
  if(!Array.isArray(window.found) || window.found.length < lvl.hotspots.length){
    window.found = new Array(lvl.hotspots.length).fill(false);
  }

  for(let i=0;i<lvl.hotspots.length;i++){
    if(window.found[i]) continue;
    const h = lvl.hotspots[i];
    // 判断圆形：以图片宽度百分比为单位（用 x/y 都可因为都是百分比）
    const dx = px - h.x;
    const dy = py - h.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if(dist <= h.r){
      // 命中
      window.found[i] = true;
      addMarker(h.x, h.y, h.r);
      updateInfo();
      // 简单提示（震动)
      if(navigator.vibrate) navigator.vibrate(50);
      // 若全部找到，显示过关
      if(window.found.every(Boolean)){
        setTimeout(()=> showLevelComplete(), 400);
      }
      return;
    }
  }
}

function addMarker(xPercent,yPercent,rPercent){
  if(!overlay) return;
  const marker = document.createElement('div');
  marker.className = 'marker';
  const size = (rPercent * 2); // 直径百分比
  marker.style.width = size + '%';
  marker.style.height = size + '%';
  marker.style.left = xPercent + '%';
  marker.style.top = yPercent + '%';
  overlay.appendChild(marker);
}

function renderDebugHotspots(hotspots){
  if(!overlay) return;
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
  const foundCount = (Array.isArray(window.found) ? window.found.filter(Boolean).length : 0);
  if(foundCountEl) foundCountEl.textContent = foundCount;
  if(totalCountEl && levels[window.current]) totalCountEl.textContent = levels[window.current].hotspots.length;
}

function showLevelComplete(){
  if(modalText) modalText.textContent = window.current < levels.length - 1 ? '恭喜过关，准备进入下一关' : '全部完成，恭喜！';
  if(nextBtn) nextBtn.textContent = window.current < levels.length - 1 ? '下一关' : '完成';
  showModal();
}

// 下一关按钮处理
if(nextBtn){
  nextBtn.addEventListener('click', ()=>{
    hideModal();
    if(window.current < levels.length - 1){
      window.current++;
      loadLevel(window.current);
    } else {
      window.current = 0;
      loadLevel(window.current);
    }
  });
}

// 事件监听（支持 touchstart 以便移动端无延迟）
if(overlay){
  overlay.addEventListener('click', onClickEvent);
  overlay.addEventListener('touchstart', function(e){ e.preventDefault(); onClickEvent(e); }, {passive:false});
}

// 暴露到 window 以便 index.html 的控件使用
window.levels = levels;
window.loadLevel = loadLevel;
window.checkHit = checkHit;

// 初始加载
loadLevel(window.current);
