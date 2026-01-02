// Cenas 2D usando p5.js

const P5Scenes = {
    sceneSpectrum(params, audioData) {
        let spectrum = audioData.spectrum;
        if (!spectrum) return;
        
        noFill();
        let centerSize = map(audioData.bass, 0, 255, 50, 200);
        stroke((params.hue + 180) % 360, 200, 255);
        strokeWeight(2);
        ellipse(0, 0, centerSize, centerSize);
        
        let len = spectrum.length / 2;
        for (let i = 0; i < len; i += 10) {
            let angle = map(i, 0, len, 0, 360) + frameCount * params.speed;
            let amp = spectrum[i];
            let r = map(amp, 0, 255, 100, windowHeight / 2 * params.sens);
            let hue = (params.hue + map(i, 0, len, 0, 100) + audioData.bass) % 360;
            stroke(hue, 200, 255);
            strokeWeight(map(audioData.mid, 0, 255, 1, 5));
            line(0, 0, r * cos(angle), r * sin(angle));
        }
    },
    
    sceneParticles(params, particles, audioData) {
        if (audioData.bass > 200) {
            for (let i = 0; i < 5; i++) {
                particles.push(new Particle(true));
            }
        }
        if (frameCount % 5 === 0) {
            particles.push(new Particle(false));
        }
        
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.update(audioData.level, params.speed);
            p.display(params.hue);
            if (p.isDead()) {
                particles.splice(i, 1);
            }
        }
    },
    
    sceneTunnel(params, audioData) {
        noFill();
        let count = 20;
        rotate(frameCount * params.speed * 0.5 + audioData.treble);
        
        for (let i = 0; i < count; i++) {
            let size = (frameCount * params.speed * 2 + i * 50) % (max(width, height));
            let alpha = map(size, 0, max(width, height), 255, 0);
            push();
            let hue = (params.hue + i * 10) % 360;
            stroke(hue, 200, 255, alpha);
            strokeWeight(map(audioData.bass, 0, 255, 1, 8));
            if (i % 2 === 0) {
                rect(0, 0, size, size);
            } else {
                ellipse(0, 0, size, size);
            }
            pop();
        }
    },
    
    sceneGlitch(params, audioData) {
        if (audioData.bass > 180) {
            translate(random(-10, 10), random(-10, 10));
        }
        
        let gridSize = 50;
        noStroke();
        translate(-width / 2, -height / 2);
        
        for (let x = 0; x < width; x += gridSize) {
            if (random(1) < audioData.level * 0.2) {
                fill((params.hue + random(60)) % 360, 200, 255, 200);
                rect(x + gridSize / 2, random(height), gridSize, gridSize);
            }
        }
        
        stroke(255, 100);
        line(0, (frameCount * 10) % height, width, (frameCount * 10) % height);
    },
    
    sceneWaveform(params, audioData) {
        translate(-width / 2, 0);
        let waveform = audioData.waveform;
        noFill();
        strokeWeight(3);
        
        for (let j = 0; j < 2; j++) {
            beginShape();
            stroke((params.hue + j * 30) % 360, 200, 255);
            for (let i = 0; i < waveform.length; i += 10) {
                let y = map(waveform[i], -1, 1, -height / 2, height / 2) * (1 + j * 0.5);
                vertex(map(i, 0, waveform.length, 0, width), y);
            }
            endShape();
        }
    },
    
    sceneMandala(params, audioData) {
        let symmetry = 8;
        let angle = 360 / symmetry;
        rotate(frameCount * 0.2 * params.speed);
        
        for (let i = 0; i < symmetry; i++) {
            rotate(angle);
            push();
            let len = 50;
            for (let j = 0; j < len; j += 5) {
                let amp = audioData.spectrum[j * 2] || 0;
                fill((params.hue + j * 2) % 360, 200, 255, 150);
                noStroke();
                let r = map(amp, 0, 255, 10, 300);
                ellipse(r, 0, map(amp, 0, 255, 2, 30));
            }
            pop();
        }
    },
    
    sceneMatrix(params, drops, audioData) {
        for (let d of drops) {
            d.fall(params.speed);
            d.show(params.hue, audioData.bass);
        }
    },
    
    scenePixels(params, audioData) {
        let res = 40;
        let cols = width / res;
        let rows = height / res;
        noStroke();
        
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                let amp = audioData.spectrum[floor(map(i + j, 0, cols + rows, 0, 64))] || 0;
                if (amp > 50) {
                    fill((params.hue + amp) % 360, 200, 255, map(amp, 0, 255, 50, 255));
                    rect(i * res + res / 2, j * res + res / 2, res * 0.8);
                }
            }
        }
    },
    
    sceneStarfield(params, stars, audioData) {
        let speed = map(audioData.bass, 0, 255, 2, 20) * params.speed;
        translate(0, 0);
        for (let s of stars) {
            s.update(speed);
            s.show(params.hue);
        }
    },
    
    sceneFlow(params, audioData) {
        let res = 20;
        let cols = floor(width / res);
        let rows = floor(height / res);
        noStroke();
        
        let yoff = 0;
        for (let y = 0; y < rows; y++) {
            let xoff = 0;
            for (let x = 0; x < cols; x++) {
                let ang = noise(xoff, yoff, frameCount * 0.01) * 720;
                fill((params.hue + ang / 2) % 360, 200, 255, 150);
                push();
                translate(x * res, y * res);
                rotate(ang);
                rect(0, 0, map(audioData.treble, 0, 255, 2, res * 1.5), 2);
                pop();
                xoff += 0.1;
            }
            yoff += 0.1;
        }
    }
};
