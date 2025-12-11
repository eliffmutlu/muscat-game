// --- DOM ELEMENTLERİ ---
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const jumpBtn = document.getElementById("jumpBtn");
    const restartBtn = document.getElementById("restartBtn");
    const saveBtn = document.getElementById("saveBtn");
    const gameOverOverlay = document.getElementById("gameOverOverlay");
    const finalScoreSpan = document.getElementById("finalScore");
    const playerNameInput = document.getElementById("playerName");
    const saveScoreForm = document.getElementById("saveScoreForm");
    const leaderboardList = document.getElementById("leaderboardList");

    // Pixel art ayarı
    ctx.imageSmoothingEnabled = false;

    // --- IMAGE SPRITES ---
    const run1 = new Image(); run1.src = "./run-1.png";
    const run2 = new Image(); run2.src = "./run-2.png";
    const run3 = new Image(); run3.src = "./run-3.png";
    const run4 = new Image(); run4.src = "./run-4.png";
    const deadCat = new Image(); deadCat.src = "./dead.png";

    const block1 = new Image(); block1.src = "./bloke-1.png";
    const block2 = new Image(); block2.src = "./bloke-2.png";
    const moonImg = new Image(); moonImg.src = "./moon.png";
    const sunImg = new Image(); sunImg.src = "./sun.png";

    // --- OYUN DEĞİŞKENLERİ ---
    let speed = 5;
    let score = 0;
    let gameOver = false;
    let isNight = false;
    let animationId;

    let cat = {
      x: 50,
      y: 220,
      width: 60,
      height: 60,
      dy: 0,
      jumpPower: 16, // Artırıldı (Daha seri zıplama için)
      gravity: 1.0,  // Artırıldı (Daha az süzülme hissi için)
      grounded: true,
      jumpCount: 0
    };

    let obstacles = [
      { x: 800, y: 240, width: 40, height: 40, type: 1 },
      { x: 1200, y: 240, width: 40, height: 40, type: 2 },
    ];

    // --- BULUT MATRİSİ (Görseldeki gibi) ---
    // 0: Boş, 1: Beyaz, 2: Gölge
    const cloudPatterns = [
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

    const PIXEL_SIZE = 4;

    function generateCloud(startX) {
      return {
        x: startX || Math.random() * canvas.width,
        y: 20 + Math.random() * 80,
        speed: 0.3 + Math.random() * 0.4,
        pattern: cloudPatterns[0]
      };
    }

    let clouds = Array.from({ length: 4 }, () => generateCloud());

    const stars = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * 200,
      size: Math.random() < 0.5 ? 2 : 4
    }));

    // --- LOCAL STORAGE LİDERLİK TABLOSU FONKSİYONLARI ---

    function fetchLeaderboard() {
      leaderboardList.innerHTML = '<li>Yükleniyor...</li>';
      
      try {
        // Local Storage'dan veriyi çek
        const storedScores = localStorage.getItem('catRunnerScores');
        const data = storedScores ? JSON.parse(storedScores) : [];

        // Skora göre sırala (Büyükten küçüğe)
        data.sort((a, b) => b.score - a.score);

        // İlk 10'u al
        const topScores = data.slice(0, 10);

        leaderboardList.innerHTML = '';
        if (topScores.length === 0) {
          leaderboardList.innerHTML = '<li>Henüz skor yok. İlk sen ol!</li>';
          return;
        }

        topScores.forEach((entry, index) => {
          const li = document.createElement('li');
          
          // Yıldızları belirle
          let starIcon = '';
          if (index === 0) starIcon = '<span class="stars">★★★</span>';
          else if (index === 1) starIcon = '<span class="stars">★★</span>';
          else if (index === 2) starIcon = '<span class="stars">★</span>';

          li.innerHTML = `
            <div>
              <span class="rank">#${index + 1}</span> 
              ${entry.username} 
              ${starIcon}
            </div>
            <span class="score">${entry.score}</span>
          `;
          leaderboardList.appendChild(li);
        });

      } catch (err) {
        console.error('Skorlar çekilemedi:', err);
        leaderboardList.innerHTML = '<li>Skorlar yüklenirken hata oluştu.</li>';
      }
    }

    function saveScore() {
      const name = playerNameInput.value.trim();
      
      // --- VALIDATION (DOĞRULAMA) ---
      if (!name) {
        // İsim boşsa hata sınıfını ekle
        playerNameInput.classList.add('input-error');
        playerNameInput.focus(); // Klavyeyi aç
        return; // Kaydetme işleminden çık
      }

      saveBtn.disabled = true;
      saveBtn.textContent = "KAYDEDİLİYOR...";

      try {
        // Mevcut skorları al
        const storedScores = localStorage.getItem('catRunnerScores');
        const scores = storedScores ? JSON.parse(storedScores) : [];

        // Yeni skoru ekle
        scores.push({ username: name, score: score });

        // Local Storage'a kaydet
        localStorage.setItem('catRunnerScores', JSON.stringify(scores));

        // Başarılı kayıt
        saveScoreForm.style.display = 'none';
        fetchLeaderboard(); // Listeyi güncelle
        
      } catch (err) {
        console.error('Kayıt hatası:', err);
        alert("Skor kaydedilemedi. Tarayıcı hafızası dolu olabilir.");
        saveBtn.disabled = false;
        saveBtn.textContent = "KAYDET";
      }
    }

    // --- OYUN KONTROLLERİ ---

    // Input alanına yazılmaya başlandığında hatayı kaldır
    if (playerNameInput) {
      playerNameInput.addEventListener('input', () => {
        playerNameInput.classList.remove('input-error');
      });
    }

    function handleJump() {
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
    }

    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault(); // Sayfanın kaymasını engeller
        handleJump();
      }
    });

    if (jumpBtn) {
      jumpBtn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        handleJump();
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", saveScore);
    }

    if (restartBtn) {
      restartBtn.addEventListener("click", restartGame);
    }

    // --- OYUN DÖNGÜSÜ ---

    function update() {
      if (!gameOver) {
        // Gece/Gündüz
        const cycle = Math.floor(score / 10) % 2;
        isNight = (cycle === 1);
        if (isNight) document.body.classList.add("night");
        else document.body.classList.remove("night");

        // Kedi
        cat.dy += cat.gravity;
        cat.y += cat.dy;
        
        if (cat.y > 220) {
          cat.y = 220;
          cat.dy = 0;
          cat.grounded = true;
          cat.jumpCount = 0;
        }

        // Bulutlar
        clouds.forEach((cloud, index) => {
          cloud.x -= cloud.speed;
          if (cloud.x < -150) clouds[index] = generateCloud(canvas.width + 50);
        });

        // Engeller
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
            handleGameOver();
          }
        });
      }

      draw();
      animationId = requestAnimationFrame(update);
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Arka Plan
      if (isNight) {
        ctx.fillStyle = "#ffffff";
        stars.forEach(star => ctx.fillRect(star.x, star.y, star.size, star.size));
        ctx.drawImage(moonImg, 690, 40, 60, 60);
      } else {
        clouds.forEach(cloud => {
          cloud.pattern.forEach((row, rowIndex) => {
            row.forEach((pixel, colIndex) => {
              if (pixel !== 0) {
                ctx.fillStyle = pixel === 1 ? "#ffffff" : "#dbeeff";
                ctx.fillRect(cloud.x + (colIndex * PIXEL_SIZE), cloud.y + (rowIndex * PIXEL_SIZE), PIXEL_SIZE, PIXEL_SIZE);
              }
            });
          });
        });
        ctx.drawImage(sunImg, 675, 25, 90, 90);
      }

      // Zemin
      ctx.fillStyle = isNight ? "#333" : "#654321";
      ctx.fillRect(0, 260, canvas.width, 40);
      ctx.fillStyle = isNight ? "#222" : "#4caf50";
      ctx.fillRect(0, 260, canvas.width, 10);

      // Karakterler
      ctx.font = "30px 'Press Start 2P'";
      ctx.textBaseline = "top";
      let frame = Math.floor((Date.now() / 100) % 4);
      let sprite = [run1, run2, run3, run4][frame];

      if (!gameOver) {
        ctx.drawImage(sprite, cat.x, cat.y, cat.width, cat.height);
      } else {
        ctx.drawImage(deadCat, cat.x, cat.y, cat.width, cat.height);
      }

      obstacles.forEach((obs) => {
        const img = obs.type === 1 ? block1 : block2;
        ctx.drawImage(img, obs.x, obs.y, obs.width, obs.height);
      });

      // Skor (Oyun içi)
      ctx.fillStyle = isNight ? "#fff" : "#333";
      ctx.font = "16px 'Press Start 2P'";
      ctx.textAlign = "left";
      ctx.fillText(`SKOR: ${score}`, 20, 30);
    }

    function handleGameOver() {
      gameOver = true;
      finalScoreSpan.textContent = score;
      gameOverOverlay.classList.remove("hidden");
      saveScoreForm.style.display = 'block';
      saveBtn.disabled = false;
      saveBtn.textContent = "KAYDET";
      playerNameInput.value = "";
      playerNameInput.classList.remove('input-error'); // Önceki hatayı temizle
    }

    function restartGame() {
      gameOverOverlay.classList.add("hidden");
      
      obstacles.forEach((obs, i) => {
        obs.x = 800 + i * 400;
        obs.y = 240;
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
      
      for(let i=0; i<clouds.length; i++) {
        clouds[i] = generateCloud();
      }
    }

    // Başlangıçta listeyi çek
    fetchLeaderboard();
    update();
