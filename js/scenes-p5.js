// Cenas 2D usando p5.js

const P5Scenes = {
    // Helper para obter cor da paleta
    getPaletteColor(params, audioData, index = 0, offset = 0) {
        let paletteName = params.palette || 'neon';
        let color = ColorPalettes.getColor(paletteName, index, params.hue + offset, audioData);
        return color;
    },
    
    sceneSpectrum(params, audioData) {
        let spectrum = audioData.spectrum;
        if (!spectrum) return;
        
        noFill();
        let centerSize = map(audioData.bass, 0, 255, 50, 200);
        let centerColor = this.getPaletteColor(params, audioData, 1, 180);
        stroke(centerColor.h, centerColor.s, centerColor.b);
        strokeWeight(2);
        ellipse(0, 0, centerSize, centerSize);
        
        let len = spectrum.length / 2;
        for (let i = 0; i < len; i += 10) {
            let angle = map(i, 0, len, 0, 360) + frameCount * params.speed;
            let amp = spectrum[i];
            let r = map(amp, 0, 255, 100, windowHeight / 2 * params.sens);
            let colorIndex = floor(map(i, 0, len, 0, 4));
            let color = this.getPaletteColor(params, audioData, colorIndex, map(i, 0, len, 0, 100) + audioData.bass);
            stroke(color.h, color.s, color.b);
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
            p.display(params.hue, params, audioData);
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
            let color = this.getPaletteColor(params, audioData, i % 4, i * 10);
            stroke(color.h, color.s, color.b, alpha);
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
                let colorIndex = floor(random(4));
                let color = this.getPaletteColor(params, audioData, colorIndex, random(60));
                fill(color.h, color.s, color.b, 200);
                rect(x + gridSize / 2, random(height), gridSize, gridSize);
            }
        }
        
        stroke(255, 100);
        line(0, (frameCount * 10) % height, width, (frameCount * 10) % height);
    },
    
    sceneWaveform(params, audioData) {
        translate(-width / 2, 0);
        let waveform = audioData.waveform;
        
        // Camada de fundo com brilho suave
        push();
        noFill();
        strokeWeight(8);
        let bgColor = this.getPaletteColor(params, audioData, 1, 180);
        stroke(bgColor.h, bgColor.s * 0.4, bgColor.b * 0.8, 30);
        beginShape();
        for (let i = 0; i < waveform.length; i += 5) {
            let y = map(waveform[i], -1, 1, -height / 2, height / 2);
            vertex(map(i, 0, waveform.length, 0, width), y);
        }
        endShape();
        pop();
        
        // Múltiplas camadas de onda com diferentes opacidades e cores
        for (let j = 0; j < 3; j++) {
            push();
            noFill();
            
            // Variação de espessura baseada na amplitude
            let baseWeight = map(audioData.level, 0, 1, 2, 6);
            strokeWeight(baseWeight - j * 0.8);
            
            // Cor da paleta baseada na camada
            let color = this.getPaletteColor(params, audioData, j, j * 40 + audioData.bass * 0.5);
            let alpha = map(j, 0, 2, 180, 255);
            
            stroke(color.h, color.s, color.b, alpha);
            
            beginShape();
            for (let i = 0; i < waveform.length; i += 8) {
                // Suavização adicional para movimento mais fluido
                let smoothY = waveform[i];
                if (i > 0 && i < waveform.length - 1) {
                    smoothY = (waveform[i - 1] + waveform[i] + waveform[i + 1]) / 3;
                }
                
                // Amplitude variável por camada
                let amplitude = (1 + j * 0.3) * (1 + audioData.level * 0.5);
                let y = map(smoothY, -1, 1, -height / 2, height / 2) * amplitude;
                
                // Adicionar pequena variação baseada na frequência
                let freqOffset = sin(i * 0.1 + frameCount * 0.05) * 5 * audioData.level;
                y += freqOffset;
                
                vertex(map(i, 0, waveform.length, 0, width), y);
            }
            endShape();
            pop();
        }
        
        // Pontos brilhantes nos picos da onda
        push();
        noStroke();
        for (let i = 0; i < waveform.length; i += 15) {
            let amp = abs(waveform[i]);
            if (amp > 0.3) {
                let x = map(i, 0, waveform.length, 0, width);
                let y = map(waveform[i], -1, 1, -height / 2, height / 2);
                
                // Brilho mais intenso nos picos
                let glowSize = map(amp, 0.3, 1, 3, 12) * (1 + audioData.bass / 255);
                let glowAlpha = map(amp, 0.3, 1, 100, 255);
                
                let glowColor = this.getPaletteColor(params, audioData, i % 4, i * 0.5);
                fill(glowColor.h, glowColor.s, glowColor.b, glowAlpha);
                ellipse(x, y, glowSize, glowSize);
                
                // Núcleo brilhante
                fill(255, 255, 255, glowAlpha * 0.8);
                ellipse(x, y, glowSize * 0.4, glowSize * 0.4);
            }
        }
        pop();
        
        // Linha central de referência com brilho sutil
        push();
        let refColor = this.getPaletteColor(params, audioData, 2, 90);
        stroke(refColor.h, refColor.s * 0.6, refColor.b * 0.8, 50);
        strokeWeight(1);
        line(0, 0, width, 0);
        pop();
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
                let color = this.getPaletteColor(params, audioData, j % 4, j * 2);
                fill(color.h, color.s, color.b, 150);
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
            d.show(params.hue, audioData.bass, params, audioData);
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
                    let colorIndex = (i + j) % 4;
                    let color = this.getPaletteColor(params, audioData, colorIndex, amp);
                    fill(color.h, color.s, color.b, map(amp, 0, 255, 50, 255));
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
            s.show(params.hue, params, audioData);
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
                let colorIndex = (x + y) % 4;
                let color = this.getPaletteColor(params, audioData, colorIndex, ang / 2);
                fill(color.h, color.s, color.b, 150);
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
