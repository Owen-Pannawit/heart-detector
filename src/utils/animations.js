// --- 1. Animation Logic ---

// --- Heart Utils ---
export function drawHeartPath(ctx, x, y, size) {
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(x, y + topCurveHeight);
  ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2, x, y + size);
  ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
  ctx.closePath();
}

// --- Class สำหรับ Heart Pulse ---
export class HeartRipple {
  constructor(x, y, maxSize) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.growthSpeed = 40; 
    this.maxSize = maxSize; 
    this.isDone = false;    
  }
  update() {
    if (!this.isDone) {
      this.size += this.growthSpeed;
      if (this.size >= this.maxSize) {
        this.size = this.maxSize;
        this.isDone = true;
      }
    }
  }
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = "#ec4899"; 
    ctx.shadowColor = "rgba(236, 72, 153, 0.5)";
    ctx.shadowBlur = 30;
    drawHeartPath(ctx, this.x, this.y - this.size/2, this.size);
    ctx.fill(); 
    ctx.restore();
  }
}

export class HeartPulseEmitter {
  constructor() {
    this.activeRipple = null; 
    this.frameCount = 0;
    this.isTriggered = false; 
  }
  reset() {
    this.activeRipple = null;
    this.frameCount = 0;
    this.isTriggered = false;
  }
  animate(ctx, centerX, centerY, detected, canvasWidth, canvasHeight) {
    let shouldTriggerCard = false;
    if (detected) {
        if (!this.startTime) {
        this.startTime = Date.now();
      }

      this.frameCount++;
      const beat = Math.sin(this.frameCount * 0.15) * 8;
      const baseSize = 60;
      const currentSize = baseSize + beat;
      ctx.save();
      ctx.fillStyle = "#ec4899";
      ctx.shadowColor = "rgba(236, 72, 153, 0.6)";
      ctx.shadowBlur = 30;
      drawHeartPath(ctx, centerX, centerY - currentSize/2, currentSize);
      ctx.fill();
      ctx.restore();

      const maxRippleSize = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight) * 1.5;

      if (!this.activeRipple && !this.isTriggered) {
        this.activeRipple = new HeartRipple(centerX, centerY, maxRippleSize);
      }
      if (this.activeRipple) {
        this.activeRipple.update();
        this.activeRipple.draw(ctx);
        if (this.activeRipple.isDone && !this.isTriggered) {
          shouldTriggerCard = true;
          this.isTriggered = true; 
        }
      }
    } else {
      this.reset();
    }
    return shouldTriggerCard;
  }
}

// --- NEW FLOWER LOGIC (V6 - Smoothing Anti-Jitter) ---

export class BottomStem {
  constructor() {
    this.angle = (Math.random() - 0.5) * 0.5; 
    this.length = 0;
    this.maxLength = 40 + Math.random() * 40; 
    this.width = 3 + Math.random() * 2;
    this.color = "#88C999"; 
    this.growSpeed = 5 + Math.random() * 3;
    this.offsetX = (Math.random() - 0.5) * 20; 
  }

  update() {
    if (this.length < this.maxLength) {
      this.length += this.growSpeed;
    }
  }

  draw(ctx, startX, startY, handAngle) {
    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate(handAngle + Math.PI / 2);
    ctx.translate(this.offsetX, 0);

    const tipX = Math.sin(this.angle) * this.length;
    const tipY = Math.cos(this.angle) * this.length;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(tipX, tipY);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  }
}

export class BouquetFlower {
  constructor() {
    this.angle = (Math.random() - 0.5) * 2.0; 

    this.stemHeight = 0;
    this.maxStemHeight = 80 + Math.random() * 100; 
    
    this.bloomSize = 0;
    this.maxBloomSize = 40 + Math.random() * 30; 
    
    const colors = ['#FFB7B2', '#FF9AA2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', '#FFF5BA', '#FF99CC', '#FFCC99'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    
    this.growSpeed = 6 + Math.random() * 4;
    
    this.offsetX = (Math.random() - 0.5) * 30;
    this.offsetY = (Math.random() - 0.5) * 10;
  }

  update() {
    if (this.stemHeight < this.maxStemHeight) {
      this.stemHeight += this.growSpeed;
    } 
    if (this.stemHeight > this.maxStemHeight * 0.3 && this.bloomSize < this.maxBloomSize) {
      this.bloomSize += 2;
    }
  }

  draw(ctx, startX, startY, handAngle) {
    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate(handAngle + Math.PI / 2); 
    
    ctx.translate(this.offsetX, this.offsetY);

    const tipX = Math.sin(this.angle) * this.stemHeight;
    const tipY = -Math.cos(this.angle) * this.stemHeight; 

    const midX = tipX / 2 + Math.sin(this.angle) * 20;
    const midY = tipY / 2;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.strokeStyle = "#88C999"; 
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.stroke();

    if (this.bloomSize > 0) {
      ctx.translate(tipX, tipY);
      
      ctx.fillStyle = this.color;
      const petalCount = 5 + Math.floor(Math.random() * 2); 
      for (let i = 0; i < petalCount; i++) {
        ctx.rotate((Math.PI * 2) / petalCount);
        ctx.beginPath();
        ctx.ellipse(0, this.bloomSize * 0.6, this.bloomSize * 0.5, this.bloomSize * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.beginPath();
      ctx.arc(0, 0, this.bloomSize * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = "#FFD700"; 
      ctx.fill();
    }
    ctx.restore();
  }
}

export class FlowerGarden {
  constructor() {
    this.flowers = []; 
    this.stems = [];   
    this.frameCount = 0;

    this.smoothTopX = 0;
    this.smoothTopY = 0;
    this.smoothBottomX = 0;
    this.smoothBottomY = 0;
    this.smoothAngle = 0;
    this.isInitialized = false;
  }

  reset() {
    this.flowers = [];
    this.stems = [];
    this.frameCount = 0;
    this.isInitialized = false;
  }

  lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  animate(ctx, targetTopX, targetTopY, targetBottomX, targetBottomY, isFist, targetAngle) {
    if (isFist) {
      const smoothFactor = 0.08; 

      if (!this.isInitialized) {
        this.smoothTopX = targetTopX;
        this.smoothTopY = targetTopY;
        this.smoothBottomX = targetBottomX;
        this.smoothBottomY = targetBottomY;
        this.smoothAngle = targetAngle;
        this.isInitialized = true;
      } else {
        this.smoothTopX = this.lerp(this.smoothTopX, targetTopX, smoothFactor);
        this.smoothTopY = this.lerp(this.smoothTopY, targetTopY, smoothFactor);
        this.smoothBottomX = this.lerp(this.smoothBottomX, targetBottomX, smoothFactor);
        this.smoothBottomY = this.lerp(this.smoothBottomY, targetBottomY, smoothFactor);
        this.smoothAngle = this.lerp(this.smoothAngle, targetAngle, smoothFactor);
      }

      this.frameCount++;
      
      if (this.frameCount % 3 === 0) {
          if (this.flowers.length < 12) {
              this.flowers.push(new BouquetFlower());
          }
          if (this.stems.length < 8) {
              this.stems.push(new BottomStem());
          }
      }

      this.stems.forEach(stem => {
        stem.update();
        stem.draw(ctx, this.smoothBottomX, this.smoothBottomY, this.smoothAngle);
      });

      this.flowers.sort((a, b) => b.stemHeight - a.stemHeight);
      this.flowers.forEach(flower => {
        flower.update();
        flower.draw(ctx, this.smoothTopX, this.smoothTopY, this.smoothAngle);
      });

    } else {
      this.reset();
    }
  }
}
