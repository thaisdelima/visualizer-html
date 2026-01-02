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
    
    display(h) {
        noStroke();
        fill((h + this.life) % 360, 200, 255, this.life);
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
    
    show(h) {
        let sx = map(this.x / this.z, 0, 1, 0, width);
        let sy = map(this.y / this.z, 0, 1, 0, height);
        let px = map(this.x / this.pz, 0, 1, 0, width);
        let py = map(this.y / this.pz, 0, 1, 0, height);
        this.pz = this.z;
        stroke((h + this.z / 10) % 360, 150, 255);
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
    
    show(h, bass) {
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
                        fill(h, 255, 255, map(i, 0, this.len, 255, 10));
                    }
                }
                text(this.chars[i], this.x, cy);
            }
        }
    }
}

