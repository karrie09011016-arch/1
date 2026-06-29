// 三关数据：使用你仓库中的图片（A1/A2 为第一关，B1/B2 第二关，C1/C2 第三关）
// hotspots 用百分比 (x,y) 和 半径 r (百分比)
const levels = [
  {
    left: 'A1.jpg',
    right: 'A2.jpg',
    hotspots: [
      { x: 28, y: 35, r: 6 },
      { x: 65, y: 22, r: 6 },
      { x: 48, y: 70, r: 7 },
    ]
  },
  {
    left: 'B1.jpg',
    right: 'B2.jpg',
    hotspots: [
      { x: 22, y: 42, r: 6 },
      { x: 60, y: 50, r: 6 },
      { x: 80, y: 25, r: 6 },
    ]
  },
  {
    left: 'C1.jpg',
    right: 'C2.jpg',
    hotspots: [
      { x: 34, y: 30, r: 6 },
      { x: 55, y: 55, r: 7 },
      { x: 78, y: 68, r: 6 },
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
const nextBtn = document.getElementById('nextBtn');

function loadLevel(idx){
  const lvl = levels[idx];
  imgLeft.src = lvl.left;
  imgRight.src = lvl.right;
  found = new Array(lvl.hotspots.length).fill(false);
  clearMarkers();
  updateInfo();
  levelLabel.textContent = `第 ${idx+1} 关 / 共 ${levels.length} 关`;
  totalCountEl.textContent = lvl.hotspots.length;
  hideModal();
}

// 把已找到的 marker DOM 清掉
function clearMarkers(){
  const existing = document.querySelectorAll('.marker');
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

  checkHit(px, py);
}

// 检查是否命中未找到的热点
function checkHit(px, py){
  const lvl = levels[current];
  for(let i=0;i<lvl.hotspots.length;i++){
    if(found[i]) continue;
    const h = lvl.hotspots[i];
    // 判断圆形：以图片宽度百分比为单位（用 x/y 都可，因为都是百分比）
    const dx = px - h.x;
    const dy = py - h.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if(dist <= h.r){
      // 命中
      found[i] = true;
      addMarker(h.x, h.y, h.r);
      updateInfo();
      // 简单提示（震动）
      if(navigator.vibrate) navigator.vibrate(50);
      // 若全部找到，显示过关
      if(found.every(Boolean)){
        setTimeout(()=> showLevelComplete(), 400);
      }
      return;
    }
  }
}

function addMarker(xPercent,yPercent,rPercent){
  const marker = document.createElement('div');
  marker.className = 'marker';
  const size = (rPercent * 2); // 直径百分比
  marker.style.width = size + '%';
  marker.style.height = size + '%';
  marker.style.left = xPercent + '%';
  marker.style.top = yPercent + '%';
  overlay.appendChild(marker);
}

function updateInfo(){
  const foundCount = found.filter(Boolean).length;
  foundCountEl.textContent = foundCount;
  totalCountEl.textContent = levels[current].hotspots.length;
}

function showLevelComplete(){
  modalText.textContent = current < levels.length - 1 ? '恭喜过关！准备进入下一关' : '全部完成，恭喜！';
  nextBtn.textContent = current < levels.length - 1 ? '下一关' : '完成';
  showModal();
}

function showModal(){ modal.classList.remove('hidden'); }
function hideModal(){ modal.classList.add('hidden'); }

// 下一关按钮处理
nextBtn.addEventListener('click', ()=>{
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

// 初始加载
loadLevel(current);
