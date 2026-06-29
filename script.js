// 三关数据：请把 images 放在 assets/ 下或修改路径；hotspots 用百分比 (x,y) 和 半径 r (百分比)
// x,y 表示热点圆心相对于右侧图片盒子的百分比，r 为百分比半径（相对于图片宽度）
const levels = [
  {
    left: 'assets/level1-left.jpg',
    right: 'assets/level1-right.jpg',
    hotspots: [
      { x: 28, y: 35, r: 6 },
      { x: 65, y: 22, r: 6 },
      { x: 48, y: 70, r: 7 },
    ]
  },
  {
    left: 'assets/level2-left.jpg',
    right: 'assets/level2-right.jpg',
    hotspots: [
      { x: 22, y: 42, r: 6 },
      { x: 60, y: 50, r: 6 },
      { x: 80, y: 25, r: 6 },
    ]
  },
  {
    left: 'assets/level3-left.jpg',
    right: 'assets/level3-right.jpg',
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
  // 可选：点击未命中给一个轻微提示
  // if(navigator.vibrate) navigator.vibrate([20]);
}

function addMarker(xPercent,yPercent,rPercent){
  const marker = document.createElement('div');
  marker.className = 'marker';
  // marker 大小按图片宽度百分比设定，且 left/top 为百分比定位
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
    // 完成全部关卡 -> 重置或显示成绩
    current = 0;
    loadLevel(current);
    // 你可以在这里跳转到其他页面，或展示分数页面
  }
});

// 事件监听（支持 touchstart 以便移动端无延迟）
overlay.addEventListener('click', onClickEvent);
overlay.addEventListener('touchstart', function(e){ e.preventDefault(); onClickEvent(e); }, {passive:false});

// 初始加载
loadLevel(current);
