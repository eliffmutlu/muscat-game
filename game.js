// --- MOBİL KONTROLLER ---
const jumpBtn = document.getElementById("jumpBtn");
const restartBtn = document.getElementById("restartBtn");

if (jumpBtn) {
  const triggerJump = () => {
    if (gameOver) return;
    if (cat.grounded) {
      cat.dy = -cat.jumpPower;
      cat.grounded = false;
      cat.jumpCount = 1;
    } else if (!cat.grounded && cat.jumpCount < 2) {
      cat.dy = -cat.jumpPower;
      cat.jumpCount = 2;
    }
    if (cat.y < 40) { cat.y = 40; cat.dy = 0; }
  };

  const newJumpBtn = jumpBtn.cloneNode(true);
  jumpBtn.parentNode.replaceChild(newJumpBtn, jumpBtn);
  
  newJumpBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    triggerJump();
  });
}

if (restartBtn) {
  restartBtn.style.display = "none";
  restartBtn.addEventListener("click", () => {
    if (gameOver) restartGame();
  });
}

// --- OYUN DEĞİŞKENLERİ ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Pixel art için yumuşatmayı kapat
ctx.imageSmoothingEnabled = false;

let speed = 5;
let score = 0;
let gameOver = false;
let isNight = false;

let cat = {
  x: 50,
  y: 220,
  width: 60,
  height: 60,
  dy: 0,
  jumpPower: 13,
  gravity: 0.7,
  grounded: true,
  jumpCount: 0
};

let obstacles = [
  { x: 800, y: 240, width: 40, height: 40, type: 1 },
  { x: 1200, y: 240, width: 40, height: 40, type: 2 },
];

// --- PİKSEL BULUT TASARIMLARI ---
// 0: Boş, 1: Beyaz, 2: Gölge
const cloudPatterns = [
  // Görseldeki Bulutun Replikası
  [
    [0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,2,2,2,2,1,1,1,1,2,2,2,2,1,1],
    [1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [0,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
    [0,0,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,0,0],
    [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0]
  ]
];

const PIXEL_SIZE = 4; // Bulutlar daha detaylı olduğu için piksel boyutunu biraz küçülttüm

// Rastgele bulutlar oluştur
const clouds = Array.from({ length: 4 }, () => generateCloud());

function generateCloud(startX) {
  // Şu an tek tip bulut var ama ilerde artırılabilir
  const patternIndex = 0; 
  return {
    x: startX || Math.random() * canvas.width,
    y: 20 + Math.random() * 80, // Gökyüzünde rastgele yükseklik
    speed: 0.3 + Math.random() * 0.4, // Biraz daha yavaş süzülsünler
    pattern: cloudPatterns[patternIndex]
  };
}

// Rastgele yıldızlar oluştur
const stars = Array.from({ length: 40 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * 200,
  size: Math.random() < 0.5 ? 2 : 4
}));

// Oyunu başlat
update();

const block2 = new Image(); block2.src = "bloke-2.png";
const moonImg = new Image(); moonImg.src = "moon.png";
const sunImg = new Image(); sunImg.src = "sun.png";

// --- ARKA PLAN DETAYLARI ---
const moonPattern = [
  [0,0,0,1,1,1,0,0,0],
  [0,0,1,1,2,2,1,1,0],
  [0,1,1,2,0,0,2,1,1],
  [1,1,2,0,0,0,0,2,1,1],
  [1,2,0,0,0,0,0,0,2,1],
  [1,1,2,0,0,0,0,2,1,1],
  [0,1,1,2,0,0,2,1,1,0],
  [0,0,1,1,2,2,1,1,0],
  [0,0,0,1,1,1,0,0,0]
];
const MOON_PIXEL = 4;

// --- KLAVYE KONTROLÜ ---
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !gameOver) { 
    if (cat.grounded) {
      cat.dy = -cat.jumpPower;
      cat.grounded = false;
      cat.jumpCount = 1;
    } else if (!cat.grounded && cat.jumpCount < 2) {
      cat.dy = -cat.jumpPower;
      cat.jumpCount = 2;
    }
  }
  if (e.code === "Enter" && gameOver) restartGame();
});

function update() {
  if (!gameOver) {
    // Gece/Gündüz Kontrolü
    const cycle = Math.floor(score / 10) % 2;
    isNight = (cycle === 1);

    if (isNight) {
      document.body.classList.add("night");
    } else {
      document.body.classList.remove("night");
    }

    // Kedi Fiziği
    cat.dy += cat.gravity;
    cat.y += cat.dy;
    
    if (cat.y > 220) {
      cat.y = 220;
      cat.dy = 0;
      cat.grounded = true;
      cat.jumpCount = 0;
    }

    // Bulutları hareket ettir
    clouds.forEach((cloud, index) => {
      cloud.x -= cloud.speed;
      // Ekrandan çıkınca başa sar
      if (cloud.x < -150) {
        clouds[index] = generateCloud(canvas.width + 50);
      }
    });

    // Engelleri hareket ettir
    obstacles.forEach((obs) => {
      obs.x -= speed;
      if (obs.x < -50) {
        obs.x = 800 + Math.random() * 400;
        obs.type = Math.random() < 0.5 ? 1 : 2;
        score++;
        speed += 0.1;
      }

      // Çarpışma
      if (
        cat.x < obs.x + obs.width - 15 &&
        cat.x + cat.width > obs.x + 15 &&
        cat.y < obs.y + obs.height &&
        cat.y + cat.height > obs.y
      ) {
        gameOver = true;
      }
    });
  }

  draw();
  requestAnimationFrame(update);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // --- ARKA PLAN DETAYLARI ---
  if (isNight) {
    // Yıldızlar
    ctx.fillStyle = "#ffffff";
    stars.forEach(star => {
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    
    // Ay (PNG)
    ctx.drawImage(moonImg, 690, 40, 60, 60);
  } else {
    // --- PİKSEL BULUT ÇİZİMİ ---
    clouds.forEach(cloud => {
      cloud.pattern.forEach((row, rowIndex) => {
        row.forEach((pixel, colIndex) => {
          if (pixel !== 0) {
            // Renk seçimi: 1 ise Beyaz, 2 ise Gölge Rengi
            if (pixel === 1) {
              ctx.fillStyle = "#ffffff";
            } else if (pixel === 2) {
              ctx.fillStyle = "#dbeeff"; // Hafif mavi/gri gölge
            }
            
            ctx.fillRect(
              cloud.x + (colIndex * PIXEL_SIZE), 
              cloud.y + (rowIndex * PIXEL_SIZE), 
              PIXEL_SIZE, 
              PIXEL_SIZE
            );
          }
        });
      });
    });
    
    // Güneş (PNG)
    ctx.drawImage(sunImg, 675, 25, 90, 90);
  }

  // --- ZEMİN ---
  ctx.fillStyle = isNight ? "#333" : "#654321";
  ctx.fillRect(0, 260, canvas.width, 40);
  
  ctx.fillStyle = isNight ? "#222" : "#4caf50";
  ctx.fillRect(0, 260, canvas.width, 10);

  // --- FONT ---
  ctx.font = "30px 'Press Start 2P'";
  ctx.textBaseline = "top";

  // --- KEDİ ---
  if (gameOver) {
    ctx.fillText("😿", cat.x, cat.y - 10);
  } else {
    ctx.fillText("🐱", cat.x, cat.y - 10);
  }

  // --- ENGELLER ---
  obstacles.forEach((obs) => {
    if (obs.type === 1) {
      ctx.fillText("🌵", obs.x, obs.y - 10);
    } else {
      ctx.fillText("🚧", obs.x, obs.y - 10);
    }
  });

  // --- SKOR ---
  ctx.fillStyle = isNight ? "#fff" : "#333";
  ctx.font = "16px 'Press Start 2P'";
  ctx.textAlign = "left";
  ctx.fillText(`SKOR: ${score}`, 20, 30);

  // --- GAME OVER EKRANI ---
  if (gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ff5555";
    ctx.textAlign = "center";
    ctx.font = "40px 'Press Start 2P'";
    ctx.fillText("OYUN BITTI", canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = "#fff";
    ctx.font = "12px 'Press Start 2P'";
    ctx.fillText("ENTER'a bas veya butona tikla", canvas.width / 2, canvas.height / 2 + 20);

    if (restartBtn) {
      restartBtn.style.display = "block";
      restartBtn.style.position = "absolute";
      restartBtn.style.bottom = "-80px";
      restartBtn.style.right = "50%";
      restartBtn.style.transform = "translateX(50%)";
    }
  }
}

function restartGame() {
  if (restartBtn) restartBtn.style.display = "none";
  
  obstacles.forEach((obs, i) => {
    obs.x = 800 + i * 400;
    obs.y = 240; // Keep obstacle bottom aligned with cat
  });
  
  score = 0;
  gameOver = false;
  cat.y = 220;
  cat.dy = 0;
  cat.grounded = true;
  cat.jumpCount = 0;
  speed = 5;
  
  isNight = false;
  document.body.classList.remove("night");
  
  // Bulutları da sıfırla
  for(let i=0; i<clouds.length; i++) {
    clouds[i] = generateCloud();
  }
}
