// Classes auxiliares para partículas, estrelas e efeitos

class Particle {
    constructor(explosive) {
        this.reset(explosive);
    }
    
    reset(explosive) {
        this.pos = createVector(random(-10, 10), random(-10, 10));
        if (explosive) {
            this.vel = p5.Vector.random2D().mult(random(5, 10));
            this.life = 255;
        } else {
            this.vel = p5.Vector.random2D().mult(random(1, 3));
            this.life = 255;
        }
        this.size = random(2, 6);
    }
    
    update(lvl, spd) {
        this.pos.add(this.vel.copy().mult(spd));
        this.life -= 4;
        if (lvl > 0.5) {
            this.pos.add(p5.Vector.random2D().mult(5));
        }
    }
    
    display(h, params = null, audioData = null) {
        noStroke();
        if (params && audioData && typeof ColorPalettes !== 'undefined') {
            let colorIndex = floor(this.life / 50) % 4;
            let color = ColorPalettes.getColor(params.palette || 'neon', colorIndex, h + this.life, audioData);
            fill(color.h, color.s, color.b, this.life);
        } else {
            fill((h + this.life) % 360, 200, 255, this.life);
        }
        ellipse(this.pos.x, this.pos.y, this.size);
    }
    
    isDead() {
        return this.life <= 0;
    }
}

class Star {
    constructor() {
        this.x = random(-width, width);
        this.y = random(-height, height);
        this.z = random(width);
        this.pz = this.z;
    }
    
    update(spd) {
        this.z -= spd;
        if (this.z < 1) {
            this.z = width;
            this.x = random(-width, width);
            this.y = random(-height, height);
            this.pz = this.z;
        }
    }
    
    show(h, params = null, audioData = null) {
        let sx = map(this.x / this.z, 0, 1, 0, width);
        let sy = map(this.y / this.z, 0, 1, 0, height);
        let px = map(this.x / this.pz, 0, 1, 0, width);
        let py = map(this.y / this.pz, 0, 1, 0, height);
        this.pz = this.z;
        if (params && audioData && typeof ColorPalettes !== 'undefined') {
            let colorIndex = floor(this.z / 100) % 4;
            let color = ColorPalettes.getColor(params.palette || 'neon', colorIndex, h + this.z / 10, audioData);
            stroke(color.h, color.s * 0.6, color.b);
        } else {
            stroke((h + this.z / 10) % 360, 150, 255);
        }
        strokeWeight(map(this.z, 0, width, 5, 0));
        line(px, py, sx, sy);
    }
}

class MatrixDrop {
    constructor(x) {
        this.x = x;
        this.y = random(-500, -50);
        this.speed = random(2, 10);
        this.chars = [];
        this.len = floor(random(5, 20));
        for (let i = 0; i < this.len; i++) {
            this.chars.push(String.fromCharCode(0x30A0 + round(random(96))));
        }
    }
    
    fall(speed) {
        this.y += this.speed * speed;
        if (this.y > height) {
            this.y = random(-200, -100);
            this.speed = random(2, 10);
        }
    }
    
    show(h, bass, params = null, audioData = null) {
        textSize(14);
        let flash = bass > 200;
        for (let i = 0; i < this.len; i++) {
            let cy = this.y - i * 16;
            if (cy > 0 && cy < height) {
                if (i === 0) {
                    fill(255);
                } else {
                    if (flash && i < 3) {
                        fill(255);
                    } else {
                        if (params && audioData && typeof ColorPalettes !== 'undefined') {
                            let colorIndex = i % 4;
                            let color = ColorPalettes.getColor(params.palette || 'neon', colorIndex, h, audioData);
                            fill(color.h, color.s, color.b, map(i, 0, this.len, 255, 10));
                        } else {
                            fill(h, 255, 255, map(i, 0, this.len, 255, 10));
                        }
                    }
                }
                text(this.chars[i], this.x, cy);
            }
        }
    }
}

class ColorParticle {
    constructor(color) {
        this.color = color;
        this.pos = createVector(random(-width/2, width/2), random(-height/2, height/2));
        this.vel = p5.Vector.random2D().mult(random(2, 5));
        this.life = 255;
        this.size = random(3, 8);
    }
    
    update(level, speed) {
        this.pos.add(this.vel.copy().mult(speed));
        this.life -= 3;
        if (level > 0.3) {
            this.vel.add(p5.Vector.random2D().mult(0.5));
        }
    }
    
    display() {
        noStroke();
        fill(this.color.h, this.color.s, this.color.b, this.life);
        ellipse(this.pos.x, this.pos.y, this.size);
    }
    
    isDead() {
        return this.life <= 0 || 
               this.pos.x < -width/2 - 50 || this.pos.x > width/2 + 50 ||
               this.pos.y < -height/2 - 50 || this.pos.y > height/2 + 50;
    }
}

class ShapeParticle {
    constructor(x, y, color, audioData) {
        this.pos = createVector(x, y);
        this.originalPos = createVector(x, y);
        this.color = color;
        this.vel = p5.Vector.random2D().mult(random(1, 3));
        this.life = 255;
        this.size = random(2, 6);
        this.angle = random(360);
        this.rotationSpeed = random(-2, 2);
    }
    
    update(audioData, params) {
        // Validar parâmetros
        if (!audioData || !params) return;
        
        // Valores padrão se não existirem
        let speed = (params && typeof params.speed === 'number' && isFinite(params.speed)) ? params.speed : 1.0;
        let sens = (params && typeof params.sens === 'number' && isFinite(params.sens)) ? params.sens : 1.0;
        let level = (audioData && typeof audioData.level === 'number' && isFinite(audioData.level)) ? audioData.level : 0.5;
        let bass = (audioData && typeof audioData.bass === 'number' && isFinite(audioData.bass)) ? audioData.bass : 0;
        
        // Movimento baseado no áudio
        let bassForce = map(bass, 0, 255, 0, 5) * sens;
        
        // Adicionar força baseada no áudio
        if (this.vel && typeof this.vel.add === 'function') {
            let randomVec = p5.Vector.random2D();
            if (randomVec && typeof randomVec.mult === 'function') {
                this.vel.add(randomVec.mult(bassForce * 0.1));
            }
            this.vel.mult(0.95); // Fricção
            
            // Validar velocidade antes de usar
            if (this.vel && isFinite(this.vel.x) && isFinite(this.vel.y)) {
                let velCopy = this.vel.copy();
                if (velCopy && typeof velCopy.mult === 'function' && isFinite(speed)) {
                    this.pos.add(velCopy.mult(speed));
                }
            }
        }
        
        // Rotação baseada no áudio
        if (isFinite(level)) {
            this.angle += this.rotationSpeed * (1 + level);
        }
        
        // Atração de volta para posição original (suave)
        if (this.pos && this.originalPos && 
            isFinite(this.pos.x) && isFinite(this.pos.y) &&
            isFinite(this.originalPos.x) && isFinite(this.originalPos.y)) {
            let attraction = p5.Vector.sub(this.originalPos, this.pos);
            if (attraction && typeof attraction.mult === 'function') {
                attraction.mult(0.02);
                if (this.vel && typeof this.vel.add === 'function') {
                    this.vel.add(attraction);
                }
            }
        }
        
        // Reduzir vida
        this.life -= 2;
        
        // Aumentar tamanho com o bass
        if (isFinite(bass) && isFinite(this.size)) {
            this.size = map(bass, 0, 255, this.size * 0.8, this.size * 1.5);
        }
    }
    
    display() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.angle);
        
        noStroke();
        fill(this.color.h, this.color.s, this.color.b, this.life);
        
        // Forma variada baseada na posição
        let shapeType = floor((this.originalPos.x + this.originalPos.y) / 50) % 3;
        
        if (shapeType === 0) {
            ellipse(0, 0, this.size, this.size);
        } else if (shapeType === 1) {
            rect(0, 0, this.size, this.size);
        } else {
            beginShape();
            for (let i = 0; i < 6; i++) {
                let angle = (360 / 6) * i;
                let x = cos(angle) * this.size / 2;
                let y = sin(angle) * this.size / 2;
                vertex(x, y);
            }
            endShape(CLOSE);
        }
        
        pop();
    }
    
    isDead() {
        return this.life <= 0 || 
               this.pos.x < -width/2 - 100 || this.pos.x > width/2 + 100 ||
               this.pos.y < -height/2 - 100 || this.pos.y > height/2 + 100;
    }
}

