(() => {
        'use strict';

        // ---------- DOM ----------
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const scoreVal = document.getElementById('score-val');
        const livesVal = document.getElementById('lives-val');
        const finalScore = document.getElementById('final-score');
        const gameOverScreen = document.getElementById('game-over-screen');
        const restartBtn = document.getElementById('restart-btn');

        // ---------- Constants ----------
        const W = canvas.width;
        const H = canvas.height;
        const FRAME_MS = 1000 / 60;      // all speeds are tuned for 60 FPS
        const FIRE_COOLDOWN_MS = 180;
        const FIRST_BOSS_SCORE = 100;
        const BOSS_SCORE_STEP = 150;     // extra score between bosses

        // ---------- State ----------
        let score, isGameOver, loopId, lastTime, clock;
        let spawnTimer, fireTimer, nextBossScore, bossesDefeated;
        let bullets, enemyBullets, enemies, particles;
        let touchFiring = false;
        let mouseFiring = false;
        const keys = {};

        const player = { x: 0, y: H - 85, width: 50, height: 55, speed: 6, lives: 3, invincible: false, invincibleTimer: 0 };

        // Player hitbox is smaller than the sprite (wings and halo don't count)
        function playerHitbox() {
            return { x: player.x + 10, y: player.y + 8, width: player.width - 20, height: player.height - 16 };
        }

        const boss = {
            active: false, x: 0, y: -100, targetY: 60,
            width: 120, height: 50, speed: 3, direction: 1,
            maxHp: 30, hp: 30, shotTimer: 0, shootInterval: 900
        };

        // Static starfield
        const stars = Array.from({ length: 40 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 2 + 1
        }));

        // ---------- Input ----------
        window.addEventListener('keydown', (e) => {
            if (['ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
            if (e.code === 'Enter' && isGameOver) { resetGame(); return; }
            keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => { keys[e.code] = false; });
        window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; touchFiring = false; mouseFiring = false; });

        function movePlayerToPointer(e) {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (W / rect.width) - player.width / 2;
            player.x = Math.max(0, Math.min(W - player.width, x));
        }
        canvas.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse') return; // mouse users use the keyboard
            touchFiring = true;
            movePlayerToPointer(e);
        });
        canvas.addEventListener('pointermove', (e) => {
            if (touchFiring) movePlayerToPointer(e);
        });
        window.addEventListener('pointerup', () => { touchFiring = false; });
        window.addEventListener('pointercancel', () => { touchFiring = false; });
        restartBtn.addEventListener('click', resetGame);

        // Right-click to shoot
        canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault(); });

       canvas.addEventListener('mousedown', (e) => {
       if (e.button === 0) {
          mouseFiring = true;
         e.preventDefault();}
        });
        
        window.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            mouseFiring = false;}
        });

        // ---------- Helpers ----------
        function checkCollision(a, b) {
            return a.x < b.x + b.width &&
                   a.x + a.width > b.x &&
                   a.y < b.y + b.height &&
                   a.y + a.height > b.y;
        }

        function setScore(value) {
            score = value;
            scoreVal.textContent = score;
        }

        function updateLivesUI() {
            livesVal.textContent = player.lives > 0 ? '❤️'.repeat(player.lives) : '💀 LOST';
        }

        function createExplosion(x, y, count, color) {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 4 + 2;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: Math.random() * 3 + 2,
                    alpha: 1,
                    decay: Math.random() * 0.02 + 0.015,
                    color
                });
            }
        }

        // ---------- Spawning ----------
        function spawnEnemy() {
            const size = Math.random() * 20 + 20;
            enemies.push({
                x: Math.random() * (W - size),
                y: -size,
                width: size,
                height: size,
                speed: Math.random() * 2 + 2,
                color: '#ff0055'
            });
        }

        function spawnBoss() {
            boss.active = true;
            boss.maxHp = 30 + bossesDefeated * 10;
            boss.hp = boss.maxHp;
            boss.x = W / 2 - boss.width / 2;
            boss.y = -100;
            boss.direction = 1;
            boss.shotTimer = 0;
            // Later bosses shoot a little faster (but never below 500ms)
            boss.shootInterval = Math.max(500, 900 - bossesDefeated * 100);
        }

        function fireBullet() {
            bullets.push({
                x: player.x + player.width / 2 - 3,
                y: player.y,
                width: 6,
                height: 15,
                speed: 8,
                color: '#fffb00'
            });
        }

        function bossFire() {
            const cx = boss.x + boss.width / 2;
            const by = boss.y + boss.height;
            const isPhase2 = boss.hp <= boss.maxHp / 2;

            if (isPhase2) {
                // Triple spread
                enemyBullets.push({ x: cx, y: by, width: 8, height: 16, vx: -2, vy: 5, color: '#ff00ff' });
                enemyBullets.push({ x: cx, y: by, width: 8, height: 16, vx: 0,  vy: 6, color: '#ffff00' });
                enemyBullets.push({ x: cx, y: by, width: 8, height: 16, vx: 2,  vy: 5, color: '#ff00ff' });
            } else {
                // Dual wing blasts
                enemyBullets.push({ x: boss.x + 15, y: by, width: 8, height: 16, vx: 0, vy: 5, color: '#bd00ff' });
                enemyBullets.push({ x: boss.x + boss.width - 23, y: by, width: 8, height: 16, vx: 0, vy: 5, color: '#bd00ff' });
            }
        }

        // ---------- Damage ----------
        function handlePlayerHit() {
            if (player.invincible || isGameOver) return;

            player.lives--;
            updateLivesUI();
            createExplosion(player.x + player.width / 2, player.y + player.height / 2, 15, '#66fcf1');

            if (player.lives <= 0) {
                isGameOver = true;
                finalScore.textContent = 'FINAL SCORE: ' + score;
                gameOverScreen.style.display = 'flex';
            } else {
                player.invincible = true;
                player.invincibleTimer = 90; // frames @60fps, ~1.5s
            }
        }

        // ---------- Reset ----------
        function resetGame() {
            cancelAnimationFrame(loopId);   // guarantees only one loop ever runs

            setScore(0);
            isGameOver = false;
            clock = 0;
            spawnTimer = 800;
            fireTimer = 0;
            nextBossScore = FIRST_BOSS_SCORE;
            bossesDefeated = 0;
            bullets = [];
            enemyBullets = [];
            enemies = [];
            particles = [];

            player.x = W / 2 - player.width / 2;
            player.lives = 3;
            player.invincible = false;
            player.invincibleTimer = 0;
            updateLivesUI();

            boss.active = false;
            gameOverScreen.style.display = 'none';

            lastTime = performance.now();
            loopId = requestAnimationFrame(loop);
        }

        // ---------- Drawing ----------
        function drawAemeath(x, y, w, h) {
            // Flicker while invincible
            if (player.invincible && Math.floor(player.invincibleTimer / 4) % 2 === 0) return;

            const wingOsc = Math.sin(clock * 0.15) * 8;
            const haloOsc = Math.cos(clock * 0.08) * 4;

            ctx.save();

            // Ice halo
            ctx.save();
            ctx.strokeStyle = '#66fcf1';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#66fcf1';
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h * 0.15 + haloOsc, w * 0.35, Math.PI, 0);
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + w / 2 - 3, y - 5 + haloOsc, 6, 6);
            ctx.restore();

            // Mech wings
            ctx.fillStyle = '#c5c6c7';
            ctx.strokeStyle = '#45f3ff';
            ctx.lineWidth = 1.5;

            ctx.beginPath();
            ctx.moveTo(x + w * 0.2, y + h * 0.6);
            ctx.lineTo(x - w * 0.3, y + h * 0.8 + wingOsc);
            ctx.lineTo(x - w * 0.1, y + h * 0.9 + wingOsc);
            ctx.lineTo(x + w * 0.2, y + h * 0.7);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x + w * 0.8, y + h * 0.6);
            ctx.lineTo(x + w * 1.3, y + h * 0.8 - wingOsc);
            ctx.lineTo(x + w * 1.1, y + h * 0.9 - wingOsc);
            ctx.lineTo(x + w * 0.8, y + h * 0.7);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Hair
            ctx.fillStyle = '#ff99bb';
            ctx.beginPath();
            ctx.ellipse(x + w / 2, y + h * 0.45, w * 0.45, h * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(x + w * 0.05, y + h * 0.5, w * 0.15, h * 0.3);
            ctx.fillRect(x + w * 0.8, y + h * 0.5, w * 0.15, h * 0.3);

            // Face
            ctx.fillStyle = '#ffe0cc';
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h * 0.5, w * 0.32, 0, Math.PI * 2);
            ctx.fill();

            // Eyes (blink every ~2s)
            if (Math.floor(clock) % 120 > 8) {
                ctx.fillStyle = '#ffcc00';
                ctx.fillRect(x + w * 0.32, y + h * 0.44, w * 0.1, h * 0.12);
                ctx.fillRect(x + w * 0.58, y + h * 0.44, w * 0.1, h * 0.12);
            } else {
                ctx.strokeStyle = '#332200';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(x + w * 0.32, y + h * 0.5); ctx.lineTo(x + w * 0.42, y + h * 0.5);
                ctx.moveTo(x + w * 0.58, y + h * 0.5); ctx.lineTo(x + w * 0.68, y + h * 0.5);
                ctx.stroke();
            }

            // Bodysuit
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + w * 0.35, y + h * 0.72, w * 0.3, h * 0.25);
            ctx.fillStyle = '#1f2833';
            ctx.fillRect(x + w * 0.42, y + h * 0.75, w * 0.16, h * 0.15);

            ctx.restore();
        }

        function drawBoss() {
            const isPhase2 = boss.hp <= boss.maxHp / 2;

            ctx.fillStyle = isPhase2 ? '#ff5500' : '#ff0033';
            ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
            ctx.fillStyle = isPhase2 ? '#ffcc00' : '#80001a';
            ctx.fillRect(boss.x + 10, boss.y + 10, boss.width - 20, boss.height - 20);

            // Health bar
            const barW = 200, barH = 12;
            const barX = W / 2 - barW / 2, barY = 20;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barW, barH);
            ctx.fillStyle = isPhase2 ? '#ffaa00' : '#ff0000';
            ctx.fillRect(barX, barY, Math.max(0, boss.hp / boss.maxHp) * barW, barH);
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Courier New';
            ctx.fillText(isPhase2 ? 'PHASE 2: ENRAGED SHIP' : 'COMMANDER ALIEN SHIP', barX, barY - 5);
        }

        // ---------- Main loop ----------
        function loop(now) {
            if (isGameOver) return;

            // Delta time: 1.0 = one frame at 60 FPS. Capped so tab-switching doesn't cause huge jumps.
            const dt = Math.min((now - lastTime) / FRAME_MS, 3);
            lastTime = now;
            const dtMs = dt * FRAME_MS;
            clock += dt;

            ctx.clearRect(0, 0, W, H);

            // Invincibility
            if (player.invincible) {
                player.invincibleTimer -= dt;
                if (player.invincibleTimer <= 0) player.invincible = false;
            }

            // Stars
            ctx.fillStyle = '#ffffff';
            for (const star of stars) {
                ctx.fillRect(star.x, star.y, star.size, star.size);
                star.y += star.speed * dt;
                if (star.y > H) star.y = 0;
            }

            // Player movement
            if (keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed * dt;
            if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed * dt;
            player.x = Math.max(0, Math.min(W - player.width, player.x));

            // Player firing: Space, right-click, or touch
            fireTimer -= dtMs;
            if ((keys['Space'] || mouseFiring || touchFiring) && fireTimer <= 0) {
                fireBullet();
                fireTimer = FIRE_COOLDOWN_MS;
            }

            drawAemeath(player.x, player.y, player.width, player.height);

            // Spawning
            if (!boss.active) {
                if (score >= nextBossScore) {
                    spawnBoss();
                } else {
                    spawnTimer -= dtMs;
                    if (spawnTimer <= 0) {
                        spawnEnemy();   
                        spawnTimer = Math.max(400, 1500 - score * 10);
                    }
                }
            }

            // Boss
            if (boss.active) {
                const isPhase2 = boss.hp <= boss.maxHp / 2;
                if (boss.y < boss.targetY) {
                    boss.y += 2 * dt;
                } else {
                    boss.x += (isPhase2 ? boss.speed * 1.5 : boss.speed) * boss.direction * dt;
                    if (boss.x <= 0) { boss.x = 0; boss.direction = 1; }
                    if (boss.x >= W - boss.width) { boss.x = W - boss.width; boss.direction = -1; }

                    boss.shotTimer += dtMs;
                    if (boss.shotTimer >= boss.shootInterval) {
                        bossFire();
                        boss.shotTimer = 0;
                    }
                }
                drawBoss();
            }

            // Player bullets (iterate backwards so splice is safe)
            for (let i = bullets.length - 1; i >= 0; i--) {
                const b = bullets[i];
                b.y -= b.speed * dt;
                ctx.fillStyle = b.color;
                ctx.fillRect(b.x, b.y, b.width, b.height);

                if (b.y + b.height < 0) { bullets.splice(i, 1); continue; }

                // Hit boss
                if (boss.active && boss.y >= boss.targetY && checkCollision(b, boss)) {
                    bullets.splice(i, 1);
                    boss.hp--;
                    createExplosion(b.x, b.y, 3, '#ffcc00');
                    if (boss.hp <= 0) {
                        boss.active = false;
                        bossesDefeated++;
                        setScore(score + 100);
                        nextBossScore = score + BOSS_SCORE_STEP;
                        enemyBullets = [];
                        createExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2, 60, '#ff3300');
                        spawnTimer = 1000;
                    }
                    continue;
                }

                // Hit enemies
                for (let j = enemies.length - 1; j >= 0; j--) {
                    const e = enemies[j];
                    if (checkCollision(b, e)) {
                        createExplosion(e.x + e.width / 2, e.y + e.height / 2, 8, '#ff0055');
                        enemies.splice(j, 1);
                        bullets.splice(i, 1);
                        setScore(score + 10);
                        break; // this bullet is used up
                    }
                }
            }

            // Boss bullets
            const hitbox = playerHitbox();
            for (let i = enemyBullets.length - 1; i >= 0; i--) {
                const eb = enemyBullets[i];
                eb.x += (eb.vx || 0) * dt;
                eb.y += eb.vy * dt;
                ctx.fillStyle = eb.color;
                ctx.fillRect(eb.x, eb.y, eb.width, eb.height);

                if (checkCollision(eb, hitbox)) {
                    enemyBullets.splice(i, 1);
                    handlePlayerHit();
                    if (isGameOver) break;
                } else if (eb.y > H || eb.x + eb.width < 0 || eb.x > W) {
                    enemyBullets.splice(i, 1);
                }
            }

            // Enemies
            for (let i = enemies.length - 1; i >= 0; i--) {
                const e = enemies[i];
                e.y += e.speed * dt;
                ctx.fillStyle = e.color;
                ctx.fillRect(e.x, e.y, e.width, e.height);

                if (checkCollision(playerHitbox(), e)) {
                    createExplosion(e.x + e.width / 2, e.y + e.height / 2, 8, '#ff0055');
                    enemies.splice(i, 1);
                    handlePlayerHit();
                    if (isGameOver) break;
                } else if (e.y > H) {
                    enemies.splice(i, 1);
                }
            }

            // Particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.alpha -= p.decay * dt;
                if (p.alpha <= 0) {
                    particles.splice(i, 1);
                } else {
                    ctx.save();
                    ctx.globalAlpha = p.alpha;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            if (!isGameOver) loopId = requestAnimationFrame(loop);
        }

        // ---------- Start ----------
        resetGame();
    })();