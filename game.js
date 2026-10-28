const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        // Game state
        let score = 0;
        let highScore = 0;
        try { highScore = Number(localStorage.getItem('pivot-best')) || 0; } catch {}
        let started = false;
        let paused = false;
        const overlay = document.getElementById('overlay');
        const playButton = document.getElementById('playButton');
        const pauseButton = document.getElementById('pauseButton');
        function syncUI() {
            document.getElementById('score').textContent = String(score).padStart(2, '0');
            document.getElementById('best').textContent = String(Math.max(score, highScore)).padStart(2, '0');
            document.getElementById('balls').textContent = balls.length + pendingSpawns.length;
            document.getElementById('threshold').textContent = nextBallThreshold;
            document.getElementById('progress').style.width = Math.min(100, score / nextBallThreshold * 100) + '%';
        }
        function begin() {
            resetGame(); started = true; paused = false;
            overlay.hidden = true;
            pauseButton.disabled = false; pauseButton.textContent = 'Pause';
            canvas.focus({preventScroll:true});
        }
        playButton.addEventListener('click', () => paused ? setPaused(false) : begin());
        document.getElementById('restartButton').addEventListener('click', begin);
        function setPaused(value) {
            if (!started || isGameOver) return;
            paused = value; isHolding = false;
            pauseButton.textContent = paused ? 'Resume' : 'Pause';
            overlay.hidden = !paused;
            if (paused) {
                document.getElementById('overlayTitle').textContent = 'Take a breath.';
                document.getElementById('overlayText').textContent = 'Your game will be right here.';
                playButton.textContent = 'Resume game';
            }
        }
        pauseButton.addEventListener('click', () => setPaused(!paused));
        playButton.addEventListener('click', () => canvas.focus({preventScroll:true}));
        document.addEventListener('visibilitychange', () => { if(document.hidden) setPaused(true); });
        window.addEventListener('blur', () => { isHolding = false; setPaused(true); });
        window.addEventListener('pointerup', () => { isHolding = false; });
        canvas.addEventListener('pointercancel', () => { isHolding = false; });
        let isGameOver = false;
        let nextBallThreshold = 5; // Starts at 5 for the 2nd ball
        const MAX_BALLS = 10;

        // Control mechanics state
        let spinDirection = 1;
        let isHolding = false;
        let targetAngleOffset = 0;
        let currentAngleOffset = 0;

        // Balls array & Incoming Spawns Queue
        let balls = [];
        let pendingSpawns = [];

        // Obstacle properties pivoted at one end
        let obstacle = {
            pivotX: 100,
            pivotY: 550,
            width: 290,
            height: 17,
            baseAngle: -0.2
        };

        function queueNewBall() {
            if (balls.length + pendingSpawns.length < MAX_BALLS) {
                pendingSpawns.push({
                    x: 195 + (Math.random() * 100 - 50),
                    y: 120,
                    timer: 60
                });
            }
        }

        function resetGame() {
            score = 0;
            spinDirection = 1; targetAngleOffset = 0; currentAngleOffset = 0; isHolding = false;
            nextBallThreshold = 5; // Reset to 5 for the first threshold
            isGameOver = false;
            balls = [];
            pendingSpawns = [];
            balls.push({
                x: 195,
                y: 120,
                vx: 0,
                vy: 1.2,
                radius: 11,
                gravity: 0.16,
                bounce: -0.82,
                history: [],
                invincibleTimer: 0,
                hitCooldownTimer: 0
            });
        }

        function triggerAction() {
            if (!started || paused) return;
            if (isGameOver) {
                begin();
            } else {
                spinDirection *= -1;
                targetAngleOffset += (Math.PI * 2) * spinDirection;
            }
        }

        // Input Listeners
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && document.activeElement === canvas) {
                e.preventDefault();
                if (!isHolding) {
                    isHolding = true;
                    triggerAction();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                isHolding = false;
            }
        });

        canvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            canvas.focus({preventScroll:true});
            canvas.setPointerCapture(e.pointerId);
            if (!isHolding) {
                isHolding = true;
                triggerAction();
            }
        });

        canvas.addEventListener('pointerup', (e) => {
            e.preventDefault();
            isHolding = false;
        });

        function checkObstacleCollision(ball) {
            let currentTotalAngle = obstacle.baseAngle + currentAngleOffset;

            let cos = Math.cos(-currentTotalAngle);
            let sin = Math.sin(-currentTotalAngle);
            let bx = ball.x - obstacle.pivotX;
            let by = ball.y - obstacle.pivotY;
            let rx = cos * bx - sin * by;
            let ry = sin * bx + cos * by;

            if (rx > -ball.radius &&
                rx < obstacle.width + ball.radius &&
                ry > -obstacle.height / 2 - ball.radius &&
                ry < obstacle.height / 2 + ball.radius) {

                let snapVelocity = Math.abs(targetAngleOffset - currentAngleOffset);
                let snapSpeed = (targetAngleOffset - currentAngleOffset) * 0.4;

                ball.vy = -8.5 + (snapSpeed * -7);
                ball.vx += (rx / obstacle.width) * 4.5;

                if (snapVelocity > 0.01 && ball.hitCooldownTimer <= 0) {
                    score += 1;

                    ball.invincibleTimer = 180;
                    ball.hitCooldownTimer = 35;

                    if (score >= nextBallThreshold) {
                        queueNewBall();
                        // Double the threshold for the next ball (5 -> 10 -> 20 -> 40 -> etc.)
                        nextBallThreshold *= 2;
                    }
                }

                if (ry > 0) {
                    ball.y = obstacle.pivotY - 40;
                }

                let clampedRx = Math.max(0, Math.min(obstacle.width, rx));
                let outX = obstacle.pivotX + Math.cos(currentTotalAngle) * clampedRx - Math.sin(currentTotalAngle) * (Math.sign(ry || 1) * (obstacle.height / 2 + ball.radius));
                let outY = obstacle.pivotY + Math.sin(currentTotalAngle) * clampedRx + Math.cos(currentTotalAngle) * (Math.sign(ry || 1) * (obstacle.height / 2 + ball.radius));
                ball.x = outX;
                ball.y = outY;
            }
        }

        function update() {
            if (started && !paused && !isGameOver) {
                currentAngleOffset += (targetAngleOffset - currentAngleOffset) * 0.18;

                for (let i = pendingSpawns.length - 1; i >= 0; i--) {
                    pendingSpawns[i].timer--;
                    if (pendingSpawns[i].timer <= 0) {
                        balls.push({
                            x: pendingSpawns[i].x,
                            y: pendingSpawns[i].y,
                            vx: (Math.random() - 0.5) * 4,
                            vy: 1.2,
                            radius: 11,
                            gravity: 0.16,
                            bounce: -0.82,
                            history: [],
                            invincibleTimer: 0,
                            hitCooldownTimer: 0
                        });
                        pendingSpawns.splice(i, 1);
                    }
                }

                for (let i = balls.length - 1; i >= 0; i--) {
                    let ball = balls[i];

                    if (ball.invincibleTimer > 0) {
                        ball.invincibleTimer--;
                    }
                    if (ball.hitCooldownTimer > 0) {
                        ball.hitCooldownTimer--;
                    }

                    ball.history.unshift({ x: ball.x, y: ball.y });
                    if (ball.history.length > 12) {
                        ball.history.pop();
                    }

                    ball.vy += ball.gravity;
                    ball.x += ball.vx;
                    ball.y += ball.vy;

                    if (ball.x - ball.radius < 0) {
                        ball.x = ball.radius;
                        ball.vx *= ball.bounce;
                    } else if (ball.x + ball.radius > canvas.width) {
                        ball.x = canvas.width - ball.radius;
                        ball.vx *= ball.bounce;
                    }

                    if (ball.y - ball.radius < 0) {
                        ball.y = ball.radius;
                        ball.vy *= ball.bounce;
                    }

                    checkObstacleCollision(ball);

                    if (ball.y - ball.radius > canvas.height + 200) {
                        isGameOver = true;
                        if (score > highScore) highScore = score;
                        try { localStorage.setItem('pivot-best', String(highScore)); } catch {}
                        pauseButton.disabled = true;
                        overlay.hidden = false;
                        document.getElementById('overlayTitle').textContent = 'One more round?';
                        document.getElementById('overlayText').textContent = 'You scored ' + score + '. A little timing goes a long way.';
                        playButton.textContent = 'Play again';
                        break;
                    }
                }
            }
        }

        function draw() {
            ctx.fillStyle = '#162524';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // --- MASSIVE BACKGROUND SCORE ---
            ctx.save();
            ctx.font = 'bold 160px -apple-system, sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(score, canvas.width / 2, canvas.height / 2 - 40);
            ctx.restore();

            ctx.strokeStyle = '#30413d';
            ctx.lineWidth = 4;
            ctx.strokeRect(0, 0, canvas.width, canvas.height);

            for (let spawn of pendingSpawns) {
                let progress = 1 - (spawn.timer / 60);
                let radius = progress * 30;
                let alpha = spawn.timer / 60;

                ctx.save();
                ctx.beginPath();
                ctx.arc(spawn.x, spawn.y, radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(157, 201, 180, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.closePath();

                ctx.beginPath();
                ctx.arc(spawn.x, spawn.y, 6, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + alpha * 0.6})`;
                ctx.fill();
                ctx.closePath();
                ctx.restore();
            }

            let currentTotalAngle = obstacle.baseAngle + currentAngleOffset;
            ctx.save();
            ctx.translate(obstacle.pivotX, obstacle.pivotY);
            ctx.rotate(currentTotalAngle);
            ctx.fillStyle = spinDirection === 1 ? '#e9a16e' : '#9dc9b4';
            ctx.shadowColor = spinDirection === 1 ? '#e9a16e' : '#9dc9b4';
            ctx.shadowBlur = 18;
            ctx.fillRect(0, -obstacle.height / 2, obstacle.width, obstacle.height);
            ctx.restore();

            ctx.beginPath();
            ctx.arc(obstacle.pivotX, obstacle.pivotY, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.closePath();

            for (let ball of balls) {
                for (let j = 0; j < ball.history.length; j++) {
                    let pos = ball.history[j];
                    let ratio = 1 - (j / ball.history.length);
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, ball.radius * ratio * 0.8, 0, Math.PI * 2);
                    let tailColor = ball.invincibleTimer > 0 ? `rgba(255, 204, 0, ${ratio * 0.4})` : (spinDirection === 1 ? `rgba(233, 161, 110, ${ratio * 0.35})` : `rgba(157, 201, 180, ${ratio * 0.35})`);
                    ctx.fillStyle = tailColor;
                    ctx.fill();
                    ctx.closePath();
                }

                ctx.beginPath();
                ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
                
                if (ball.invincibleTimer > 0) {
                    ctx.fillStyle = '#ffcc00';
                    ctx.shadowColor = '#ffcc00';
                    ctx.shadowBlur = 18;
                } else {
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = '#ffffff';
                    ctx.shadowBlur = 10;
                }
                
                ctx.fill();
                ctx.closePath();
                ctx.shadowBlur = 0;
            }


        }

        let previous = 0, accumulator = 0;
        function loop(time) {
            accumulator += Math.min(time - (previous || time), 100);
            previous = time;
            while(accumulator >= 1000/60) { update(); accumulator -= 1000/60; }
            draw(); syncUI();
            requestAnimationFrame(loop);
        }

        resetGame();
        requestAnimationFrame(loop);
    
