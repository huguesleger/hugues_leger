import * as THREE from 'three';

export class TouchTexture {
  constructor() {
    this.size = 128;
    this.radius = 0.20; // Plus large pour plus de fluidité
    this.maxAge = 80; // Dure plus longtemps
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.ctx = this.canvas.getContext('2d');
    
    // Couleur neutre (RG = 0.5 -> correspond à 0 déplacement)
    this.ctx.fillStyle = 'rgba(128, 128, 0, 1)';
    this.ctx.fillRect(0, 0, this.size, this.size);

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.trail = [];
    this.last = null;
  }

  addTouch(point) {
    let dx = 0;
    let dy = 0;
    if (this.last) {
      dx = point.x - this.last.x;
      dy = point.y - this.last.y;
    }
    
    this.trail.push({ x: point.x, y: point.y, dx, dy, age: 0 });
    this.last = point;
  }

  update() {
    // Effacer *complètement* à chaque frame avec la couleur neutre
    // Cela garantit que le texte revient parfaitement à sa forme d'origine
    this.ctx.fillStyle = 'rgba(128, 128, 0, 1)';
    this.ctx.fillRect(0, 0, this.size, this.size);

    this.trail.forEach((p, i) => {
      p.age++;
      if (p.age > this.maxAge) {
        this.trail.splice(i, 1);
      }
    });

    this.trail.forEach((p) => {
      this.drawTouch(p);
    });

    this.texture.needsUpdate = true;
  }

  drawTouch(p) {
    const pos = { x: p.x * this.size, y: p.y * this.size };
    const radius = this.size * this.radius;

    const intensity = 1 - (p.age / this.maxAge);
    
    // Calcul de la couleur basée sur la vélocité directionnelle
    const vx = Math.max(-1, Math.min(1, p.dx * 100)); // Amplification
    const vy = Math.max(-1, Math.min(1, p.dy * 100));
    
    const r = Math.round((vx + 1) * 127.5);
    const g = Math.round((vy + 1) * 127.5);

    // Dégradé radial
    const grd = this.ctx.createRadialGradient(pos.x, pos.y, radius * 0.1, pos.x, pos.y, radius);
    grd.addColorStop(0, `rgba(${r}, ${g}, 0, ${intensity})`);
    grd.addColorStop(1, `rgba(128, 128, 0, 0)`);

    this.ctx.beginPath();
    this.ctx.fillStyle = grd;
    this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
}
