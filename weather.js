/**
 * Divine Atmosphere Controller v5 (Canvas Physics)
 * Features: "Divine Chaos" Engine for Snow/Rain/Fireworks.
 */

const WeatherController = {
    lat: 37.6190,
    long: -84.5786,
    checkInterval: 60 * 60 * 1000,

    currentState: {
        temp: null,
        condition: 'clear',
        isDay: true,
        season: 'ordinary',
        simulatedDate: null,
    },

    init() {
        DivineChaosEngine.init(); // Boot the physics engine
        this.calculateLiturgicalSeason();
        this.fetchWeather();
        this.setupDebugMenu();

        setInterval(() => {
            this.fetchWeather();
            this.calculateLiturgicalSeason();
        }, this.checkInterval);
    },

    // Timezone safe helper (V4)
    getNow() {
        if (this.currentState.simulatedDate) {
            const parts = this.currentState.simulatedDate.split('-');
            if (parts.length === 3) {
                return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
        }
        return new Date();
    },

    formatDate(date) {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    },

    async fetchWeather() {
        console.log('Fetching weather...');
        try {
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${this.lat}&longitude=${this.long}&current=temperature_2m,is_day,weather_code&temperature_unit=fahrenheit`);
            const data = await response.json();

            const current = data.current;
            this.currentState.temp = Math.round(current.temperature_2m);
            this.currentState.isDay = current.is_day === 1;
            this.currentState.condition = this.mapWmoCode(current.weather_code);

            this.applyAtmosphere();
        } catch (error) {
            console.error('Weather fetch failed:', error);
            const hour = new Date().getHours();
            this.currentState.isDay = hour > 6 && hour < 20;
            this.applyAtmosphere();
        }
    },

    mapWmoCode(code) {
        if (code >= 95) return 'storm';
        if (code >= 71) return 'snow';
        if (code >= 51) return 'rain';
        return 'clear';
    },

    calculateLiturgicalSeason() {
        const now = this.getNow();
        const month = now.getMonth();
        const day = now.getDate();

        this.currentState.season = 'ordinary';

        // Winter Check (Dec=11, Jan=0, Feb=1)
        const isWinter = (month === 11 || month === 0 || month === 1);

        // Strict Baptist Holidays
        if (month === 11 && day === 25) this.currentState.season = 'christmas';
        else if (month === 0 && day === 1) this.currentState.season = 'newyear';
        else if (month === 3 && day === 20) this.currentState.season = 'easter'; // 2025
        else if (isWinter) this.currentState.season = 'winter'; // General Winter

        this.updateDebugDisplay();
        this.updateStatusBadge();
    },

    applyAtmosphere() {
        const body = document.body;

        // CSS Implementation for "Static" Decor (Holidays) and BG tints
        body.classList.remove('weather-clear', 'weather-rain', 'weather-snow', 'weather-storm');
        body.classList.remove('is-day', 'is-night');
        body.classList.remove('season-christmas', 'season-easter', 'season-newyear', 'season-ordinary', 'season-winter');

        body.classList.add(`weather-${this.currentState.condition}`);
        body.classList.add(this.currentState.isDay ? 'is-day' : 'is-night');
        body.classList.add(`season-${this.currentState.season}`);

        // Canvas Implementation for "Chaotic" Physics (Precipitation)
        // Check Season first (Holiday overrides weather visually? Maybe combine?)
        // Rules: 
        // 1. New Year -> Fireworks
        // 2. Snow -> Snow
        // 3. Rain -> Rain

        if (this.currentState.season === 'newyear') {
            DivineChaosEngine.setMode('fireworks');
        } else if (this.currentState.condition === 'snow') {
            DivineChaosEngine.setMode('snow');
        } else if (this.currentState.condition === 'rain' || this.currentState.condition === 'storm') {
            DivineChaosEngine.setMode('rain');
        } else {
            DivineChaosEngine.setMode('clear');
        }

        this.updateStatusBadge();
    },

    updateStatusBadge() {
        let badge = document.getElementById('weather-badge');

        if (!badge) {
            const navContent = document.querySelector('.navbar-content');
            if (navContent) {
                badge = document.createElement('div');
                badge.id = 'weather-badge';
                badge.className = 'glass-pill-sm';
                badge.style.cssText = `
                    font-size: 0.85rem; 
                    padding: 8px 16px; 
                    border-radius: 50px; 
                    display: flex; 
                    align-items: center; 
                    gap: 10px;
                    background: rgba(10, 25, 47, 0.6);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: white;
                    white-space: nowrap;
                    z-index: 1001;
                `;
                navContent.prepend(badge);
            }
        }

        if (badge && (this.currentState.temp !== null || this.currentState.season)) {
            const icons = {
                'clear': this.currentState.isDay ? '☀️' : '🌙',
                'rain': '🌧️',
                'snow': '🌨️',
                'storm': '⚡'
            };

            const seasonNames = {
                'ordinary': '',
                'christmas': 'Christmas Day',
                'easter': 'Resurrection Sunday',
                'newyear': 'Happy New Year'
            };

            badge.innerHTML = `
                <span>${icons[this.currentState.condition] || ''} ${this.currentState.temp != null ? this.currentState.temp + '°F' : ''}</span>
            `;
        }
    },

    // --- DEBUG MENU (V5.6 Refined) ---
    setupDebugMenu() {
        if (document.getElementById('atmos-controls')) return;

        // Container
        const container = document.createElement('div');
        container.id = 'atmos-controls';
        container.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; z-index: 9999;
            display: flex; flex-direction: column; align-items: end; gap: 10px;
            font-family: sans-serif;
        `;

        // Toggle Button (Tools Icon)
        const toggle = document.createElement('button');
        toggle.id = 'atmos-toggle';
        toggle.innerHTML = '🛠️';
        toggle.title = 'Controls';
        toggle.style.cssText = `
            background: rgba(10, 25, 47, 0.85); 
            color: white; 
            border: 1px solid rgba(255,255,255,0.2);
            width: 45px; height: 45px; border-radius: 50%; cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5); 
            font-size: 1.2rem;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.3s ease;
            backdrop-filter: blur(5px);
        `;

        toggle.onclick = (e) => {
            e.stopPropagation();
            const menu = document.getElementById('atmos-menu');
            const isHidden = menu.style.display === 'none';
            menu.style.display = isHidden ? 'block' : 'none';
            toggle.style.background = isHidden ? 'var(--color-gold)' : 'rgba(10, 25, 47, 0.85)';
            toggle.style.color = isHidden ? '#000' : '#fff';
        };

        // Menu Body
        const menu = document.createElement('div');
        menu.id = 'atmos-menu';
        menu.style.display = 'none'; // Start collapsed
        menu.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px; color: var(--color-gold); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px; font-size: 0.9rem;">
                Controls
            </div>
            
            <div style="font-size: 0.75rem; opacity: 0.7; margin-bottom: 5px;">Simulated Date:</div>
            <div id="debug-date-display" style="background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; font-family: monospace; font-size: 0.8rem; margin-bottom: 10px; color: #fff;">
                ${this.formatDate(this.getNow())}
            </div>

            <div style="margin-bottom: 5px; font-size: 0.8em;">Weather</div>
            <div class="dbg-grid">
                <button onclick="WeatherController.force('clear')">☀️ Clear</button>
                <button onclick="WeatherController.force('rain')">🌧️ Rain</button>
                <button onclick="WeatherController.force('snow')">🌨️ Snow</button>
            </div>
            
            <div style="margin: 10px 0 5px; font-size: 0.8em;">Seasons</div>
            <div class="dbg-grid">
                <button onclick="WeatherController.forceDate('2025-12-25')">Christmas</button>
                <button onclick="WeatherController.forceDate('2025-01-15')">Winter</button>
                <button onclick="WeatherController.forceDate('2025-04-20')">Easter</button>
                <button onclick="WeatherController.forceDate('2025-06-15')">Ordinary</button>
                <button onclick="WeatherController.forceDate('2026-01-01')">New Year's</button>
            </div>
        `;

        menu.style.cssText = `
            display: none;
            background: rgba(10, 25, 47, 0.95);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255,255,255,0.1);
            padding: 15px; border-radius: 12px;
            color: white; width: 220px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            margin-bottom: 10px;
        `;

        // Styles
        const style = document.createElement('style');
        style.textContent = `
            .dbg-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
            #atmos-menu button {
                width: 100%; margin-bottom: 0;
                background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                color: #ddd; padding: 8px; cursor: pointer;
                text-align: center; border-radius: 4px; font-size: 0.75rem;
                transition: background 0.2s;
            }
            #atmos-menu button:hover { background: var(--color-gold); color: black; border-color: var(--color-gold); }
        `;

        container.appendChild(menu);
        container.appendChild(toggle);
        document.body.appendChild(container);
        document.head.appendChild(style);

        // Scroll listener to close
        window.addEventListener('scroll', () => {
            const menu = document.getElementById('atmos-menu');
            const btn = document.getElementById('atmos-toggle');
            if (menu && menu.style.display !== 'none') {
                menu.style.display = 'none';
                if (btn) {
                    btn.style.background = 'rgba(10, 25, 47, 0.85)';
                    btn.style.color = '#fff';
                }
            }
        });
    },

    updateDebugDisplay() {
        const display = document.getElementById('debug-date-display');
        if (display) display.textContent = this.formatDate(this.getNow());
    },

    force(condition) {
        this.currentState.condition = condition;
        // If we force weather, we might assume ordinary season if not currently on a holiday?
        // But for testing, let's keep season as is, just change weather.
        this.applyAtmosphere();
        // If forcing snow, ensure Canvas gets the memo
        if (condition === 'snow') DivineChaosEngine.setMode('snow');
        if (condition === 'rain') DivineChaosEngine.setMode('rain');
        if (condition === 'clear') DivineChaosEngine.setMode('clear');
    },

    forceDate(dateString) {
        this.currentState.simulatedDate = dateString;
        this.calculateLiturgicalSeason();
        this.applyAtmosphere();
    }
};

/**
 * V5: The Divine Chaos Engine (Canvas Implementation)
 */
const DivineChaosEngine = {
    canvas: null,
    ctx: null,
    mode: 'clear', // clear, snow, rain, fireworks
    particles: [],
    animationId: null,
    width: 0,
    height: 0,

    init() {
        if (document.getElementById('atmosphere-canvas')) return;

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'atmosphere-canvas';
        this.canvas.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100vh;
            pointer-events: none; z-index: 999;
        `;
        document.body.prepend(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.loop();
    },

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    },

    setMode(newMode) {
        if (this.mode === newMode) return;
        this.mode = newMode;
        this.particles = []; // Reset particles on switch

        // Initial population with Pre-warming
        if (this.mode === 'snow') {
            for (let i = 0; i < 150; i++) this.particles.push(this.createSnowflake());
            // Pre-warm: Simulate 200 frames so they cover the screen instantly
            for (let i = 0; i < 200; i++) this.simulateParticles();
        }
        if (this.mode === 'rain') {
            for (let i = 0; i < 200; i++) this.particles.push(this.createRaindrop());
            // Pre-warm: Simulate 100 frames so rain is already falling "smoothly"
            for (let i = 0; i < 100; i++) this.simulateParticles();
        }
        // Fireworks populates dynamically
    },

    simulateParticles() {
        // Run physics without drawing
        if (this.mode === 'snow') {
            this.particles.forEach(p => {
                p.y += p.vy;
                if (p.y > this.height) { p.y = -10; p.x = Math.random() * this.width; }
            });
        }
        if (this.mode === 'rain') {
            this.particles.forEach(p => {
                p.y += p.vy;
                if (p.y > this.height) { p.y = -p.length; p.x = Math.random() * this.width; }
            });
        }
    },

    createSnowflake() {
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            vx: 0, // Calculated dynamically
            vy: Math.random() * 1 + 0.5, // 0.5 - 1.5 speed
            size: Math.random() * 2 + 1, // 1 - 3px (Varied)
            opacity: Math.random() * 0.6 + 0.2, // 0.2 - 0.8 (Varied)
            swing: Math.random() * 2, // Amplitude
            swaySpeed: Math.random() * 0.05 + 0.01
        };
    },

    createRaindrop() {
        // "Scale" factor: 0 = small/slow/faint, 1 = big/fast/visible
        const scale = Math.random();

        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            // Speed correlates with size (Heavier drops fall faster)
            vy: 6 + (scale * 8), // Range: 6 - 14
            // Length correlates with scale
            length: 5 + (scale * 25), // Range: 5 - 30px
            // Opacity correlates with proximity/size
            opacity: 0.05 + (scale * 0.5) // Range: 0.05 - 0.55
        };
    },

    createFirework(x, y) {
        // A Rocket
        return {
            type: 'rocket',
            x: x,
            y: this.height,
            tx: x,
            ty: y, // Target Y
            vx: 0,
            vy: -15, // Launch speed
            hue: Math.random() * 360
        };
    },

    createSpark(x, y, hue) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1;
        return {
            type: 'spark',
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            gravity: 0.1,
            friction: 0.95,
            opacity: 1,
            hue: hue,
            decay: Math.random() * 0.02 + 0.015
        };
    },

    loop() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // SNOW LOGIC
        if (this.mode === 'snow') {
            const time = Date.now() * 0.001;
            this.particles.forEach(p => {
                p.x += Math.sin(time * p.swaySpeed + p.swing);
                p.y += p.vy;

                // Wrap around
                if (p.x > this.width) p.x = 0;
                if (p.x < 0) p.x = this.width;
                if (p.y > this.height) {
                    p.y = -10;
                    p.x = Math.random() * this.width;
                }

                this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }

        // RAIN LOGIC
        if (this.mode === 'rain') {
            // Individual stroke for opacity variance
            this.ctx.lineWidth = 0.5;

            this.particles.forEach(p => {
                p.y += p.vy;
                if (p.y > this.height) {
                    p.y = -p.length;
                    p.x = Math.random() * this.width;
                }

                this.ctx.beginPath();
                this.ctx.strokeStyle = `rgba(174, 194, 224, ${p.opacity})`;
                this.ctx.moveTo(p.x, p.y);
                this.ctx.lineTo(p.x, p.y + p.length);
                this.ctx.stroke();
            });
        }

        // FIREWORKS LOGIC
        if (this.mode === 'fireworks') {
            // Randomly launch
            if (Math.random() < 0.03) { // 3% chance per frame
                const targetX = Math.random() * this.width * 0.8 + this.width * 0.1;
                const targetY = Math.random() * this.height * 0.5; // Top half
                this.particles.push(this.createFirework(targetX, targetY));
            }

            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];

                if (p.type === 'rocket') {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.2; // Gravity acting on rocket

                    // Trail
                    this.ctx.fillStyle = `hsl(${p.hue}, 100%, 50%)`;
                    this.ctx.fillRect(p.x, p.y, 2, 6);

                    // Explode if slowed down enough (apex) or reached target? 
                    // Simple check: if vy starts turning positive, or close to it.
                    if (p.vy >= -1) {
                        // Explode!
                        for (let j = 0; j < 50; j++) {
                            this.particles.push(this.createSpark(p.x, p.y, p.hue));
                        }
                        this.particles.splice(i, 1);
                    }
                } else if (p.type === 'spark') {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += p.gravity;
                    p.vx *= p.friction;
                    p.vy *= p.friction;
                    p.opacity -= p.decay;

                    if (p.opacity <= 0) {
                        this.particles.splice(i, 1);
                    } else {
                        this.ctx.globalCompositeOperation = 'lighter';
                        this.ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${p.opacity})`;
                        this.ctx.beginPath();
                        this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.globalCompositeOperation = 'source-over';
                    }
                }
            }
        }

        // Fix recursion to call loop()
        this.animationId = requestAnimationFrame(() => this.loop());
    }
};

document.addEventListener('DOMContentLoaded', () => WeatherController.init());
