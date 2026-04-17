// ============================================
// 🔥 TEMA FIRE - Llamas realistas avanzadas
// ============================================
export function createFireAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;

    const flames = [];
    const flameCount = 25;

    class Flame {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = canvas.width * 0.3 + Math.random() * canvas.width * 0.4;
            this.baseY = canvas.height + Math.random() * 30;
            this.y = this.baseY;
            this.width = 40 + Math.random() * 60;
            this.height = 120 + Math.random() * 180;
            this.speedY = 1.2 + Math.random() * 2.2;
            this.speedX = (Math.random() - 0.5) * 0.8;
            this.turbulence = Math.random() * Math.PI * 2;
            this.turbSpeed = 0.04 + Math.random() * 0.06;
            this.opacity = 0.7 + Math.random() * 0.3;
            this.flicker = Math.random() * Math.PI * 2;
            this.flickerSpeed = 0.08 + Math.random() * 0.12;
        }

        update() {
            this.y -= this.speedY;
            this.turbulence += this.turbSpeed;
            this.flicker += this.flickerSpeed;
            
            const flickerAmount = Math.sin(this.flicker) * 0.15;
            const currentWidth = this.width * (1 + flickerAmount);
            const currentHeight = this.height * (0.7 + flickerAmount * 0.5);

            if (this.y < canvas.height - this.height - 50) {
                this.reset();
            }

            return { currentWidth, currentHeight };
        }

        draw(currentWidth, currentHeight) {
            const xOffset = Math.sin(this.turbulence) * 15;
            
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = this.opacity;

            const baseX = this.x + xOffset;
            const tipY = this.y - currentHeight * 0.3;

            const flameGrad = ctx.createLinearGradient(baseX, this.y, baseX, tipY);
            flameGrad.addColorStop(0, "rgba(255, 80, 0, 0.9)");
            flameGrad.addColorStop(0.3, "rgba(255, 140, 0, 0.85)");
            flameGrad.addColorStop(0.6, "rgba(255, 200, 50, 0.7)");
            flameGrad.addColorStop(0.85, "rgba(255, 240, 150, 0.4)");
            flameGrad.addColorStop(1, "rgba(255, 255, 200, 0)");

            ctx.beginPath();
            ctx.moveTo(baseX - currentWidth * 0.5, this.y);
            ctx.quadraticCurveTo(
                baseX - currentWidth * 0.6, this.y - currentHeight * 0.4,
                baseX - currentWidth * 0.15, tipY
            );
            ctx.quadraticCurveTo(
                baseX, tipY - currentHeight * 0.2,
                baseX + currentWidth * 0.15, tipY
            );
            ctx.quadraticCurveTo(
                baseX + currentWidth * 0.6, this.y - currentHeight * 0.4,
                baseX + currentWidth * 0.5, this.y
            );
            ctx.closePath();
            ctx.fillStyle = flameGrad;
            ctx.fill();

            const innerGrad = ctx.createLinearGradient(baseX, this.y, baseX, tipY);
            innerGrad.addColorStop(0, "rgba(255, 200, 100, 0.4)");
            innerGrad.addColorStop(0.5, "rgba(255, 255, 200, 0.3)");
            innerGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

            ctx.beginPath();
            ctx.moveTo(baseX - currentWidth * 0.2, this.y);
            ctx.quadraticCurveTo(
                baseX - currentWidth * 0.25, this.y - currentHeight * 0.3,
                baseX - currentWidth * 0.05, tipY + currentHeight * 0.2
            );
            ctx.quadraticCurveTo(
                baseX + currentWidth * 0.05, tipY + currentHeight * 0.2,
                baseX + currentWidth * 0.2, this.y
            );
            ctx.closePath();
            ctx.fillStyle = innerGrad;
            ctx.fill();

            ctx.restore();
        }
    }

    for (let i = 0; i < flameCount; i++) {
        flames.push(new Flame());
    }

    const animate = () => {
        if (stopped) return;

        ctx.fillStyle = "rgba(8, 3, 0, 0.25)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        flames.forEach(f => {
            const { currentWidth, currentHeight } = f.update();
            f.draw(currentWidth, currentWidth, currentHeight);
        });

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";

        if (!stopped) animId = requestAnimationFrame(animate);
    };

    animate();

    return {
        stop: () => {
            stopped = true;
            if (animId) cancelAnimationFrame(animId);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };
}