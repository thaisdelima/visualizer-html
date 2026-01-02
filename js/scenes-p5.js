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
            d.fall(params.speed, audioData.bass);
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
        let res =100;
        let cols = floor(width / res);
        let rows = floor(height / res);
        noStroke();
        
        // Calcular zoom baseado no áudio (pulse ao ritmo da música)
        let bassPulse = map(audioData.bass, 0, 255, 0.8, 1.4) * params.sens;
        let levelPulse = map(audioData.level, 0, 1, 0.9, 1.2);
        let pulseScale = bassPulse * levelPulse;
        
        // Aplicar zoom global
        push();
        translate(width / 2, height / 2);
        scale(pulseScale);
        translate(-width / 2, -height / 2);
        
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
                rect(0, 0, map(audioData.treble, 0, 255, 5, res * 1.2), 5);
                pop();
                xoff += 0.1;
            }
            yoff += 0.1;
        }
        pop();
    },
    
    // Cena 15: Partículas de Cor - Partículas baseadas nas cores da imagem
    sceneColorParticles(params, particles, audioData) {
        translate(width / 2, height / 2);
        
        if (!MediaManager.hasImage() || !MediaManager.currentImage) {
            fill(0, 0, 100);
            textAlign(CENTER, CENTER);
            text('Carregue uma imagem nos controles', width / 2, height / 2);
            return;
        }
        
        let img = MediaManager.currentImage;
        
        // Calcular dimensões da imagem para ocupar toda a tela mantendo proporção
        let imgAspect = img.width / img.height;
        let screenAspect = width / height;
        let displayWidth, displayHeight;
        let offsetX = 0, offsetY = 0;
        
        if (imgAspect > screenAspect) {
            displayWidth = width;
            displayHeight = width / imgAspect;
            offsetY = (height - displayHeight) / 2;
        } else {
            displayHeight = height;
            displayWidth = height * imgAspect;
            offsetX = (width - displayWidth) / 2;
        }
        
        // Desenhar imagem de fundo (opcional, pode ser comentado para efeito mais limpo)
        // tint(255, 100);
        // image(img, offsetX, offsetY, displayWidth, displayHeight);
        // noTint();
        
        // Criar partículas baseadas nas cores da imagem, nas posições da imagem
        let particleRate = map(audioData.bass, 0, 255, 1, 5);
        if (frameCount % max(1, floor(4 / particleRate)) === 0 && audioData.bass > 80) {
            // Amostrar pontos da imagem para criar partículas
            let sampleRate = 50; // Espaçamento entre amostras
            let maxParticles = floor(audioData.bass / 50);
            
            for (let i = 0; i < maxParticles; i++) {
                // Escolher posição aleatória na imagem
                let imgX = random(0, img.width);
                let imgY = random(0, img.height);
                
                // Obter cor da imagem nessa posição
                let imgColor = MediaManager.getImageColor(imgX, imgY);
                
                // Converter coordenadas da imagem para coordenadas da tela
                let screenX = map(imgX, 0, img.width, offsetX, offsetX + displayWidth) - width / 2;
                let screenY = map(imgY, 0, img.height, offsetY, offsetY + displayHeight) - height / 2;
                
                // Criar partícula na posição da imagem
                particles.push(new ColorParticle(imgColor, screenX, screenY));
            }
        }
        
        // Atualizar e desenhar partículas (ordenar por profundidade para renderização correta)
        // Partículas mais distantes (z menor) devem ser desenhadas primeiro
        particles.sort((a, b) => (a.z || 0) - (b.z || 0));
        
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.update(audioData.level, params.speed);
            p.display();
            if (p.isDead()) {
                particles.splice(i, 1);
            }
        }
    },
    
    // Cena 17: Pixel Art - Pixeliza imagem baseado no áudio
    scenePixelArt(params, audioData) {
        
        if (!MediaManager.hasImage() || !MediaManager.currentImage) {
            fill(0, 0, 100);
            textAlign(CENTER, CENTER);
            text('Carregue uma imagem nos controles', width / 2, height / 2);
            return;
        }
        
        let img = MediaManager.currentImage;
        
        // Pixelização reativa ao ritmo da música
        let basePixelSize = map(audioData.bass, 0, 255, 4, 20) * params.sens;
        let levelPulse = map(audioData.level, 0, 1, 0.85, 1.15);
        let midVariation = sin(frameCount * 0.1 + audioData.mid * 0.01) * 2;
        let pixelSize = basePixelSize * levelPulse + midVariation;
        pixelSize = max(4, min(25, pixelSize));
        
        noStroke();
        
        // Mudar para modo RGB uma vez antes do loop
        push();
        colorMode(RGB, 255);
        
        // Calcular dimensões para COBRIR toda a tela (cover mode)
        let imgAspect = img.width / img.height;
        let screenAspect = width / height;
        
        // Calcular escala para cobrir toda a tela
        let scaleX = width / img.width;
        let scaleY = height / img.height;
        let coverScale = max(scaleX, scaleY);
        
        // Calcular offset da imagem para centralizar
        let scaledWidth = img.width * coverScale;
        let scaledHeight = img.height * coverScale;
        let offsetX = (scaledWidth - width) / 2;
        let offsetY = (scaledHeight - height) / 2;
        
        // Desenhar pixels da imagem ocupando TODA a tela
        for (let y = 0; y < height; y += pixelSize) {
            for (let x = 0; x < width; x += pixelSize) {
                // Mapear coordenadas da tela para coordenadas da imagem
                let imgX = ((x + offsetX) / coverScale);
                let imgY = ((y + offsetY) / coverScale);
                
                // Garantir que está dentro dos limites
                imgX = constrain(floor(imgX), 0, img.width - 1);
                imgY = constrain(floor(imgY), 0, img.height - 1);
                
                // Obter cor da imagem
                let imgColor = img.get(imgX, imgY);
                
                // Obter componentes RGB
                let r = red(imgColor);
                let g = green(imgColor);
                let b = blue(imgColor);
                
                // Brilho reativo ao ritmo
                let brightness = map(audioData.level, 0, 1, 0.9, 1.1);
                r = constrain(r * brightness, 0, 255);
                g = constrain(g * brightness, 0, 255);
                b = constrain(b * brightness, 0, 255);
                
                // Efeito de brilho nos picos
                if (audioData.bass > 200) {
                    let glow = map(audioData.bass, 200, 255, 0, 0.25);
                    r = constrain(r * (1 + glow), 0, 255);
                    g = constrain(g * (1 + glow), 0, 255);
                    b = constrain(b * (1 + glow), 0, 255);
                }
                
                // Desenhar pixel
                fill(r, g, b);
                rect(x, y, pixelSize, pixelSize);
            }
        }
        
        // Restaurar modo HSB
        pop();
    },
    
    // Cena 18: Contornos Reativos - Desenha contornos da imagem processada que reagem ao som
    sceneReactiveContours(params, audioData) {
        translate(width / 2, height / 2);
        
        if (!MediaManager.hasImage() || !MediaManager.currentImage) {
            fill(0, 0, 100);
            textAlign(CENTER, CENTER);
            text('Carregue uma imagem nos controles', 0, 0);
            return;
        }
        
        let contours = MediaManager.getContours();
        let bounds = MediaManager.getSubjectBounds();
        
        if (!bounds || contours.length === 0) {
            fill(0, 0, 100);
            textAlign(CENTER, CENTER);
            text('Processando imagem...', 0, 0);
            return;
        }
        
        // Calcular escala para centralizar a imagem inteira ocupando todo o espaço
        let img = MediaManager.currentImage;
        let imgAspect = img.width / img.height;
        let screenAspect = width / height;
        let scaleX = width / img.width;
        let scaleY = height / img.height;
        let imgScale = min(scaleX, scaleY); // Ocupa 100% da tela mantendo proporção
        
        // Calcular dimensões da imagem escalada
        let scaledWidth = img.width * imgScale;
        let scaledHeight = img.height * imgScale;
        
        // Como a origem está no centro (0, 0), centralizamos a imagem inteira
        // Os contornos estão em coordenadas da imagem original, então precisamos
        // mover a imagem para que seu centro fique em (0, 0)
        let offsetX =scaledWidth / 2;
        let offsetY = scaledHeight / 2;
        
        // Desenhar contornos com efeitos reativos ao áudio
        let bassIntensity = map(audioData.bass, 0, 255, 0.5, 2);
        let midIntensity = map(audioData.mid, 0, 255, 0.8, 1.5);
        let trebleIntensity = map(audioData.treble, 0, 255, 0.7, 1.3);
        
        noFill();
        
        // Desenhar múltiplas camadas de contornos
        for (let layer = 0; layer < 3; layer++) {
            let layerOffset = layer * map(audioData.bass, 0, 255, 2, 8);
            let strokeW = map(audioData.level, 0, 1, 1, 4) - layer * 0.5;
            strokeW = max(0.5, strokeW);
            
            for (let i = 0; i < contours.length; i++) {
                let contour = contours[i];
                if (contour.length < 3) continue;
                
                // Cor baseada na posição e áudio
                let colorIndex = (i + layer) % 4;
                let hueOffset = map(i, 0, contours.length, 0, 60) + 
                               map(audioData.bass, 0, 255, 0, 30) + 
                               params.hue;
                let color = this.getPaletteColor(params, audioData, colorIndex, hueOffset);
                
                let alpha = map(layer, 0, 2, 255, 100) * 
                           map(audioData.level, 0, 1, 0.6, 1);
                stroke(color.h, color.s, color.b, alpha);
                strokeWeight(strokeW);
                
                beginShape();
                for (let j = 0; j < contour.length; j += max(1, floor(contour.length / 200))) {
                    let x = contour[j].x * imgScale + offsetX + 
                           sin(frameCount * 0.05 + j * 0.1) * layerOffset * bassIntensity;
                    let y = contour[j].y * imgScale + offsetY + 
                           cos(frameCount * 0.05 + j * 0.1) * layerOffset * midIntensity;
                    
                    // Adicionar distorção baseada no áudio
                    let distortion = map(audioData.treble, 0, 255, 0, 5) * trebleIntensity;
                    x += sin(frameCount * 0.1 + j * 0.2) * distortion;
                    y += cos(frameCount * 0.1 + j * 0.2) * distortion;
                    
                    vertex(x, y);
                }
                endShape(CLOSE);
            }
        }
        
        // Adicionar partículas nos pontos de contorno nos picos de áudio
        if (audioData.bass > 200) {
            noStroke();
            for (let i = 0; i < contours.length; i++) {
                let contour = contours[i];
                if (contour.length === 0) continue;
                
                // Amostrar alguns pontos do contorno
                for (let j = 0; j < contour.length; j += max(5, floor(contour.length / 20))) {
                    let x = contour[j].x * imgScale + offsetX;
                    let y = contour[j].y * imgScale + offsetY;
                    
                    let colorIndex = i % 4;
                    let color = this.getPaletteColor(params, audioData, colorIndex, params.hue);
                    fill(color.h, color.s, color.b, 200);
                    
                    let size = map(audioData.bass, 200, 255, 2, 8);
                    ellipse(x, y, size, size);
                }
            }
        }
    },
    
    // Cena 19: Formas Reativas - Usa as formas da imagem para criar efeitos visuais reativos
    sceneReactiveShapes(params, audioData) {
        translate(width / 2, height / 2);
        
        if (!MediaManager.hasImage() || !MediaManager.currentImage) {
            fill(0, 0, 100);
            textAlign(CENTER, CENTER);
            text('Carregue uma imagem nos controles', 0, 0);
            return;
        }
        
        let processedImg = MediaManager.getProcessedImage();
        let bounds = MediaManager.getSubjectBounds();
        
        if (!bounds || !processedImg) {
            fill(0, 0, 100);
            textAlign(CENTER, CENTER);
            text('Processando imagem...', 0, 0);
            return;
        }
        
        // Calcular escala para centralizar a imagem inteira ocupando todo o espaço
        let img = MediaManager.currentImage;
        let imgAspect = img.width / img.height;
        let screenAspect = width / height;
        let scaleX = width / img.width;
        let scaleY = height / img.height;
        let imgScale = min(scaleX, scaleY);
        
        // Calcular dimensões da imagem escalada
        let scaledWidth = img.width * imgScale;
        let scaledHeight = img.height * imgScale;
        
        // Como a origem está no centro (0, 0), centralizamos a imagem inteira
        let offsetX = -scaledWidth / 2;
        let offsetY = -scaledHeight / 2;
        
        // Efeitos baseados no áudio
        let bassScale = map(audioData.bass, 0, 255, 0.95, 1.15) * params.sens;
        let rotation = sin(frameCount * 0.02 * params.speed) * map(audioData.mid, 0, 255, 0, 10);
        let pulse = map(audioData.level, 0, 1, 0.9, 1.1);
        
        push();
        translate(0, 0);
        rotate(rotation);
        scale(bassScale * pulse);
        
        // Desenhar imagem processada com efeitos
        tint(255, map(audioData.treble, 0, 255, 150, 255));
        image(processedImg, offsetX, offsetY, scaledWidth, scaledHeight);
        noTint();
        pop();
        
        // Adicionar efeitos de brilho e partículas
        let contours = MediaManager.getContours();
        if (contours.length > 0 && audioData.bass > 180) {
            blendMode(ADD);
            noStroke();
            
            for (let i = 0; i < min(5, contours.length); i++) {
                let contour = contours[i];
                if (contour.length === 0) continue;
                
                // Encontrar centro do contorno
                let sumX = 0, sumY = 0;
                for (let point of contour) {
                    sumX += point.x;
                    sumY += point.y;
                }
                let contourCenterX = (sumX / contour.length) * imgScale + offsetX;
                let contourCenterY = (sumY / contour.length) * imgScale + offsetY;
                
                // Brilho pulsante
                let colorIndex = i % 4;
                let color = this.getPaletteColor(params, audioData, colorIndex, params.hue + i * 30);
                let glowSize = map(audioData.bass, 180, 255, 50, 200) * params.sens;
                let alpha = map(audioData.bass, 180, 255, 50, 150);
                
                fill(color.h, color.s, color.b, alpha);
                ellipse(contourCenterX, contourCenterY, glowSize, glowSize);
            }
            
            blendMode(BLEND);
        }
        
        // Adicionar linhas conectando contornos nos picos
        if (audioData.treble > 200 && contours.length > 1) {
            strokeWeight(1);
            for (let i = 0; i < min(10, contours.length); i++) {
                for (let j = i + 1; j < min(10, contours.length); j++) {
                    if (contours[i].length === 0 || contours[j].length === 0) continue;
                    
                    let p1 = contours[i][floor(contours[i].length / 2)];
                    let p2 = contours[j][floor(contours[j].length / 2)];
                    
                    let x1 = p1.x * imgScale + offsetX;
                    let y1 = p1.y * imgScale + offsetY;
                    let x2 = p2.x * imgScale + offsetX;
                    let y2 = p2.y * imgScale + offsetY;
                    
                    let color = this.getPaletteColor(params, audioData, (i + j) % 4, params.hue);
                    stroke(color.h, color.s, color.b, 100);
                    line(x1, y1, x2, y2);
                }
            }
        }
    },
    
    // Cena 20: Partículas de Forma - Partículas que seguem as formas da imagem
    sceneShapeParticles(params, particles, audioData) {
        translate(-width / 2, -height / 2);
        
        if (!MediaManager.hasImage() || !MediaManager.currentImage) {
            fill(0, 0, 100);
            textAlign(CENTER, CENTER);
            text('Carregue uma imagem nos controles', width / 2, height / 2);
            return;
        }
        
        let contours = MediaManager.getContours();
        let bounds = MediaManager.getSubjectBounds();
        
        if (!bounds || contours.length === 0) {
            fill(0, 0, 100);
            textAlign(CENTER, CENTER);
            text('Processando imagem...', width / 2, height / 2);
            return;
        }
        
        // Calcular escala
        let img = MediaManager.currentImage;
        let scaleX = width / img.width;
        let scaleY = height / img.height;
        let imgScale = min(scaleX, scaleY) * 0.8;
        
        let centerX = width / 2;
        let centerY = height / 2;
        let offsetX = centerX - bounds.centerX * imgScale;
        let offsetY = centerY - bounds.centerY * imgScale;
        
        // Criar partículas baseadas nos contornos
        if (frameCount % 2 === 0 && audioData.bass > 100) {
            for (let i = 0; i < contours.length; i++) {
                if (contours[i].length === 0) continue;
                
                // Amostrar pontos do contorno
                let sampleRate = max(1, floor(contours[i].length / 50));
                for (let j = 0; j < contours[i].length; j += sampleRate) {
                    if (random(1) < 0.1) { // 10% de chance
                        let point = contours[i][j];
                        let x = point.x * imgScale + offsetX;
                        let y = point.y * imgScale + offsetY;
                        
                        let imgColor = MediaManager.getImageColor(point.x, point.y);
                        particles.push(new ShapeParticle(x, y, imgColor, audioData));
                    }
                }
            }
        }
        
        // Atualizar e desenhar partículas
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.update(audioData, params);
            p.display();
            if (p.isDead()) {
                particles.splice(i, 1);
            }
        }
    }
};
