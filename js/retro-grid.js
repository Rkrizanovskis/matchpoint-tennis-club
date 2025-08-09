// Tennis-themed RetroGrid Background
class RetroGrid {
    constructor(options = {}) {
        this.angle = options.angle || 65;
        this.cellSize = options.cellSize || 60;
        this.opacity = options.opacity || 0.5;
        this.lightLineColor = options.lightLineColor || '#7ed957'; // Tennis ball green
        this.darkLineColor = options.darkLineColor || '#4ade80'; // Court green
        this.canvas = null;
        this.ctx = null;
        this.animationFrame = null;
        this.time = 0;
    }

    init() {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-10'; // Even lower z-index
        this.canvas.style.pointerEvents = 'none';
        this.canvas.id = 'retro-grid-canvas';
        
        // Insert canvas as first child of body
        document.body.insertBefore(this.canvas, document.body.firstChild);
        
        this.ctx = this.canvas.getContext('2d');
        
        // Handle resize
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
        
        // Start animation
        this.animate();
    }

    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    drawGrid() {
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);
        
        // Save context state
        this.ctx.save();
        
        // Set global opacity
        this.ctx.globalAlpha = this.opacity;
        
        // Calculate grid dimensions with perspective
        const angleRad = (this.angle * Math.PI) / 180;
        const perspective = 800;
        const horizonY = height * 0.5;
        
        // Dynamic movement offset - MUCH SLOWER
        const moveSpeed = this.time * 0.0002; // Changed from 0.002 to 0.0002 (10x slower)
        const verticalOffset = (moveSpeed * this.cellSize) % this.cellSize;
        
        // Draw horizontal lines with perspective and movement
        for (let y = -height; y < height * 2; y += this.cellSize) {
            this.ctx.beginPath();
            
            // Add vertical movement
            const movedY = y + verticalOffset;
            
            // Calculate perspective transformation
            const perspectiveScale = perspective / (perspective + (movedY - horizonY));
            const lineY = horizonY + (movedY - horizonY) * perspectiveScale;
            
            // Animate line position with wave effect - SLOWER
            const waveOffset = Math.sin(this.time * 0.0001 + y * 0.01) * 3; // Changed from 0.001 to 0.0001
            
            // Dynamic color based on position
            const colorProgress = (movedY + height) / (height * 3);
            this.ctx.strokeStyle = this.interpolateColor(this.darkLineColor, this.lightLineColor, colorProgress);
            
            // Draw line with perspective
            this.ctx.moveTo(-width, lineY + waveOffset);
            this.ctx.lineTo(width * 2, lineY + waveOffset);
            
            // Line width varies with perspective
            this.ctx.lineWidth = Math.max(0.5, 2 * perspectiveScale);
            this.ctx.stroke();
        }
        
        // Draw vertical lines with perspective and movement - SLOWER
        const horizontalOffset = (moveSpeed * this.cellSize * 0.5) % this.cellSize;
        
        for (let x = -width; x < width * 2; x += this.cellSize) {
            this.ctx.beginPath();
            
            // Add horizontal movement
            const movedX = x + horizontalOffset;
            
            // Calculate perspective-based positions
            const topX = movedX + (movedX - width / 2) * -0.5;
            const bottomX = movedX + (movedX - width / 2) * 0.8;
            
            // Animate line position with wave effect - SLOWER
            const waveOffset = Math.cos(this.time * 0.0001 + x * 0.01) * 3; // Changed from 0.001 to 0.0001
            
            // Dynamic color
            const colorProgress = (movedX + width) / (width * 3);
            this.ctx.strokeStyle = this.interpolateColor(this.darkLineColor, this.lightLineColor, 1 - colorProgress);
            
            // Draw line with perspective
            this.ctx.moveTo(topX + waveOffset, -height);
            this.ctx.lineTo(bottomX + waveOffset, height * 2);
            
            // Variable line width
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
        }
        
        // Add subtle glow effect
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = this.lightLineColor;
        
        // Restore context
        this.ctx.restore();
    }

    interpolateColor(color1, color2, progress) {
        // Convert hex to RGB
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        if (!c1 || !c2) return color1;
        
        // Interpolate
        const r = Math.round(c1.r + (c2.r - c1.r) * progress);
        const g = Math.round(c1.g + (c2.g - c1.g) * progress);
        const b = Math.round(c1.b + (c2.b - c1.b) * progress);
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    animate() {
        this.time += 16; // Approximate frame time
        this.drawGrid();
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        window.removeEventListener('resize', this.handleResize);
    }
}

// Initialize the retro grid when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const retroGrid = new RetroGrid({
        angle: 65,
        cellSize: 60,
        opacity: 0.15, // Lower opacity for white background
        lightLineColor: '#22c55e', // Brighter tennis court green
        darkLineColor: '#16a34a'   // Darker tennis court green
    });
    
    retroGrid.init();
});