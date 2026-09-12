/**
 * מנוע המשחק: השעשועון הגדול – אמא מול שלי 🎬🎵
 * תמיכה במסך מלא (Full Screen), ניהול סיבובים, מסך סיום חגיגי, צלילים וקונפטי
 */

// --- מנוע צלילים נעים (Web Audio API) ---
class ShowSoundManager {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playPop() {
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1040, this.ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch (e) {}
  }

  playChime() {
    try {
      this.init();
      const notes = [587.33, 739.99, 880.00]; // D5, F#5, A5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = this.ctx.currentTime + idx * 0.08;
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.005, start + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.4);
      });
    } catch (e) {}
  }

  playVictory() {
    try {
      this.init();
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const start = this.ctx.currentTime + idx * 0.12;
        gain.gain.setValueAtTime(0.35, start);
        gain.gain.exponentialRampToValueAtTime(0.005, start + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.6);
      });
    } catch (e) {}
  }
}

const sounds = new ShowSoundManager();

// --- מנוע קונפטי רציף ---
class ShowConfetti {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animId = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(count = 80) {
    const colors = ['#f43f5e', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#fbbf24'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: this.canvas.width / 2 + (Math.random() - 0.5) * 300,
        y: this.canvas.height / 3 + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 1) * 16 - 3,
        size: Math.random() * 9 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        life: 1
      });
    }
    if (!this.animId) {
      this.loop();
    }
  }

  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.45;
      p.rotation += p.rotSpeed;
      p.life -= 0.009;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.life);
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();

      if (p.life <= 0 || p.y > this.canvas.height + 40) {
        this.particles.splice(i, 1);
      }
    }

    if (this.particles.length > 0) {
      this.animId = requestAnimationFrame(() => this.loop());
    } else {
      this.animId = null;
    }
  }
}

// --- ניהול מצב המשחק (State) ---
const STORAGE_KEY = 'mom_shelly_show_state_v1';

let gameState = {
  shellyScore: 0,
  momScore: 0,
  gameLength: 15, // 10, 15, 25 או 'endless'
  activeCategory: 'all',
  currentDeck: [],
  currentIndex: 0,
  isFinished: false
};

let confetti = null;

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (typeof parsed.shellyScore === 'number' && typeof parsed.momScore === 'number') {
        gameState.shellyScore = parsed.shellyScore;
        gameState.momScore = parsed.momScore;
        if (parsed.gameLength) gameState.gameLength = parsed.gameLength;
        if (parsed.activeCategory) gameState.activeCategory = parsed.activeCategory;
      }
    } catch (e) {}
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    shellyScore: gameState.shellyScore,
    momScore: gameState.momScore,
    gameLength: gameState.gameLength,
    activeCategory: gameState.activeCategory
  }));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initDeck() {
  let list = SHOW_QUESTIONS;
  if (gameState.activeCategory !== 'all') {
    list = SHOW_QUESTIONS.filter(q => q.category === gameState.activeCategory);
  }
  gameState.currentDeck = shuffle(list);
  gameState.currentIndex = 0;
  gameState.isFinished = false;
}

// --- אתחול היישום ---
window.addEventListener('DOMContentLoaded', () => {
  loadState();

  const canvas = document.getElementById('confettiCanvas');
  if (canvas) {
    confetti = new ShowConfetti(canvas);
  }

  initDeck();
  setupUIEventListeners();
  renderScores();
  renderQuestion();
  updateCategoryChipsUI();
});

function setupUIEventListeners() {
  // כפתור חשיפת תשובה
  document.getElementById('btnReveal').addEventListener('click', () => {
    sounds.playPop();
    document.getElementById('revealBox').style.display = 'block';
    document.getElementById('btnReveal').style.display = 'none';
    document.getElementById('scoringControls').style.display = 'flex';
  });

  // חלוקת נקודות
  document.getElementById('btnScoreShelly').addEventListener('click', () => handleScore('shelly'));
  document.getElementById('btnScoreMom').addEventListener('click', () => handleScore('mom'));
  document.getElementById('btnScoreBoth').addEventListener('click', () => handleScore('both'));
  document.getElementById('btnScoreNone').addEventListener('click', () => handleScore('none'));

  // כפתור סיום משחק בראש המסך
  document.getElementById('btnTriggerFinish').addEventListener('click', () => {
    showVictoryScreen();
  });

  // כפתור משחק חוזר במסך הסיום
  document.getElementById('btnRematch').addEventListener('click', () => {
    document.getElementById('victoryOverlay').style.display = 'none';
    gameState.shellyScore = 0;
    gameState.momScore = 0;
    saveState();
    renderScores();
    initDeck();
    renderQuestion();
    sounds.playPop();
  });

  // צ'יפים של סינון קטגוריות
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      gameState.activeCategory = btn.dataset.category;
      saveState();
      updateCategoryChipsUI();
      initDeck();
      renderQuestion();
      sounds.playPop();
    });
  });
}

function updateCategoryChipsUI() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    if (btn.dataset.category === gameState.activeCategory) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function renderScores() {
  document.getElementById('scoreShelly').textContent = gameState.shellyScore;
  document.getElementById('scoreMom').textContent = gameState.momScore;
}

function renderQuestion() {
  const maxQ = gameState.gameLength === 'endless' ? gameState.currentDeck.length : Math.min(gameState.gameLength, gameState.currentDeck.length);

  // בדיקה אם סיימנו את מכסת השאלות
  if (gameState.currentIndex >= maxQ) {
    showVictoryScreen();
    return;
  }

  const q = gameState.currentDeck[gameState.currentIndex];
  if (!q) {
    showVictoryScreen();
    return;
  }

  document.getElementById('stageCatBadge').textContent = q.categoryName;
  document.getElementById('stageTargetBadge').textContent = q.target;
  document.getElementById('questionPrompt').textContent = q.question;

  if (q.hint) {
    document.getElementById('hintPill').textContent = `💡 רמז: ${q.hint}`;
    document.getElementById('hintPill').style.display = 'inline-block';
  } else {
    document.getElementById('hintPill').style.display = 'none';
  }

  document.getElementById('revealedAnswerText').textContent = q.answer;

  document.getElementById('revealBox').style.display = 'none';
  document.getElementById('btnReveal').style.display = 'inline-flex';
  document.getElementById('scoringControls').style.display = 'none';

  // מונה שאלות
  document.getElementById('roundCounterPill').textContent = `שאלה ${gameState.currentIndex + 1} מתוך ${maxQ}`;
}

function handleScore(who) {
  if (who === 'shelly') {
    gameState.shellyScore++;
    sounds.playChime();
    if (confetti) confetti.burst(40);
  } else if (who === 'mom') {
    gameState.momScore++;
    sounds.playChime();
    if (confetti) confetti.burst(40);
  } else if (who === 'both') {
    gameState.shellyScore++;
    gameState.momScore++;
    sounds.playChime();
    if (confetti) confetti.burst(60);
  } else {
    sounds.playPop();
  }

  saveState();
  renderScores();

  gameState.currentIndex++;
  renderQuestion();
}

// --- מסך סיום חגיגי ---
function showVictoryScreen() {
  gameState.isFinished = true;
  sounds.playVictory();
  if (confetti) confetti.burst(150);

  const overlay = document.getElementById('victoryOverlay');
  overlay.style.display = 'flex';

  const sScore = gameState.shellyScore;
  const mScore = gameState.momScore;

  document.getElementById('vicShellyScore').textContent = `${sScore} נק׳`;
  document.getElementById('vicMomScore').textContent = `${mScore} נק׳`;

  const titleElem = document.getElementById('vicWinnerTitle');
  const dareElem = document.getElementById('vicDareText');

  const dares = [
    '☕ משימת המפסידה: להכין למנצחת כוס שוקו/קפה מפנק ישר לספה!',
    '🎤 משימת המפסידה: לשיר בקול רם את כל שיר הפתיחה של גאליס או החממה!',
    '👑 משימת המפסידה: לקוד קידה ולהגיד 3 מחמאות על חוש הסטייל של המנצחת!',
    '🥞 משימת המפסידה: להכין טוסט או נשנוש טעים בליווי שיר של נועה קירל ברקע!'
  ];
  const randomDare = dares[Math.floor(Math.random() * dares.length)];

  if (sScore > mScore) {
    titleElem.textContent = '👑 שלי ניצחה בגדול בקרב הדורות!';
    dareElem.textContent = randomDare;
  } else if (mScore > sScore) {
    titleElem.textContent = '👑 אמא ניצחה והוכיחה מי המלכה של הבית!';
    dareElem.textContent = randomDare;
  } else {
    titleElem.textContent = '👯‍♀️ תיקו אגדי! שתיכן אלופות הקאלט!';
    dareElem.textContent = '🥂 חגיגת שוויון: שתיהן מתחבקות ופותחות חטיף ביחד מול פרק של גאליס!';
  }
}
