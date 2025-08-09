// Confetti Effect for Tennis Club
// Based on canvas-confetti library

(function() {
    'use strict';

    // Load canvas-confetti from CDN if not already loaded
    if (typeof confetti === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
        script.onload = function() {
            console.log('Canvas-confetti library loaded');
        };
        document.head.appendChild(script);
    }

    // Tennis-themed confetti configurations
    const tennisConfettiConfigs = {
        // Tennis ball colors - yellow/green theme
        tennisVictory: {
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#CCFF00', '#32CD32', '#FFD700', '#FFFFFF'],
            shapes: ['circle'],
            gravity: 0.8,
            ticks: 200
        },
        
        // Player added celebration
        playerAdded: {
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#4F68CC', '#32CD32', '#FFD700'],
            shapes: ['circle', 'square'],
            gravity: 1,
            ticks: 150,
            startVelocity: 30
        },
        
        // Booking confirmation
        bookingSuccess: {
            particleCount: 80,
            angle: 60,
            spread: 55,
            origin: { x: 0.5, y: 0.6 },
            colors: ['#22c55e', '#16a34a', '#84cc16', '#10b981'],
            shapes: ['circle'],
            gravity: 0.9,
            scalar: 1.1
        },
        
        // Side burst effect
        sideBurst: {
            angle: 60,
            spread: 55,
            particleCount: 40,
            origin: { x: 0 },
            colors: ['#4F68CC', '#FFD700', '#32CD32']
        }
    };

    // Main confetti trigger function
    window.triggerConfetti = function(type = 'playerAdded', customOptions = {}) {
        // Ensure confetti library is loaded
        if (typeof confetti === 'undefined') {
            console.warn('Confetti library not yet loaded');
            return;
        }

        const config = tennisConfettiConfigs[type] || tennisConfettiConfigs.playerAdded;
        const options = { ...config, ...customOptions };

        // Special effects for certain types
        if (type === 'sideBurst') {
            // Fire from both sides
            confetti({
                ...options,
                origin: { x: 0, y: 0.6 }
            });
            confetti({
                ...options,
                angle: 120,
                origin: { x: 1, y: 0.6 }
            });
        } else {
            confetti(options);
        }
    };

    // Trigger confetti from a specific element
    window.triggerConfettiFromElement = function(element, type = 'playerAdded') {
        if (typeof confetti === 'undefined' || !element) {
            return;
        }

        const rect = element.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        triggerConfetti(type, {
            origin: { x: x, y: y }
        });
    };

    // Multiple bursts effect
    window.triggerMultipleConfetti = function(count = 3, delay = 200) {
        let fired = 0;

        const timer = setInterval(function() {
            triggerConfetti('playerAdded', {
                origin: { x: Math.random(), y: Math.random() * 0.5 + 0.3 }
            });

            fired++;
            if (fired === count) {
                clearInterval(timer);
            }
        }, delay);
    };

    // Realistic confetti burst
    window.triggerRealisticConfetti = function() {
        if (typeof confetti === 'undefined') return;

        const count = 200;
        const defaults = {
            origin: { y: 0.7 }
        };

        function fire(particleRatio, opts) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio),
                colors: ['#CCFF00', '#32CD32', '#FFD700', '#4F68CC', '#FFFFFF']
            });
        }

        fire(0.25, {
            spread: 26,
            startVelocity: 55,
        });
        fire(0.2, {
            spread: 60,
        });
        fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8
        });
        fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2
        });
        fire(0.1, {
            spread: 120,
            startVelocity: 45,
        });
    };

    // School pride effect (for tennis club colors)
    window.triggerClubPride = function() {
        if (typeof confetti === 'undefined') return;

        const end = Date.now() + (3 * 1000); // 3 seconds
        const colors = ['#4F68CC', '#FFFFFF']; // Club colors

        (function frame() {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    };

    // Fireworks effect
    window.triggerFireworks = function() {
        if (typeof confetti === 'undefined') return;

        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#CCFF00', '#32CD32', '#FFD700']
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#4F68CC', '#FFFFFF', '#FFD700']
            });
        }, 250);
    };
})();
