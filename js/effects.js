// Sistema de gerenciamento de efeitos para as cenas

const EffectsManager = {
    // Estado dos efeitos ativos
    activeEffects: {
        mirror: false,
        kaleidoscope: false,
        invert: false,
        glow: false,
        pixelate: false,
        blur: false,
        rotate: false,
        scale: false
    },
    
    // Parâmetros dos efeitos
    effectParams: {
        mirror: { axis: 'x' }, // 'x', 'y', ou 'both'
        kaleidoscope: { segments: 6 },
        invert: { intensity: 1.0 },
        glow: { intensity: 0.5, radius: 10 },
        pixelate: { size: 8 },
        blur: { amount: 5 },
        rotate: { angle: 0, speed: 0 },
        scale: { factor: 1.0, pulse: false }
    },
    
    // Ativar/desativar efeito
    toggleEffect(effectName) {
        if (this.activeEffects.hasOwnProperty(effectName)) {
            this.activeEffects[effectName] = !this.activeEffects[effectName];
            return this.activeEffects[effectName];
        }
        return false;
    },
    
    // Definir estado do efeito
    setEffect(effectName, enabled) {
        if (this.activeEffects.hasOwnProperty(effectName)) {
            this.activeEffects[effectName] = enabled;
        }
    },
    
    // Obter estado do efeito
    isEffectActive(effectName) {
        return this.activeEffects[effectName] || false;
    },
    
    // Atualizar parâmetro de efeito
    updateEffectParam(effectName, paramName, value) {
        if (this.effectParams[effectName] && this.effectParams[effectName].hasOwnProperty(paramName)) {
            this.effectParams[effectName][paramName] = value;
        }
    },
    
    // Aplicar efeitos antes do desenho (setup de transformações)
    applyPreEffects(params, audioData) {
        // Rotação
        if (this.activeEffects.rotate) {
            let angle = this.effectParams.rotate.angle;
            if (this.effectParams.rotate.speed > 0) {
                angle += frameCount * this.effectParams.rotate.speed;
            }
            rotate(angle);
        }
        
        // Escala
        if (this.activeEffects.scale) {
            let scaleFactor = this.effectParams.scale.factor;
            if (this.effectParams.scale.pulse && audioData) {
                let pulse = map(audioData.level, 0, 1, 0.9, 1.1);
                scaleFactor *= pulse;
            }
            scale(scaleFactor);
        }
        
        // Espelhamento
        if (this.activeEffects.mirror) {
            let axis = this.effectParams.mirror.axis;
            if (axis === 'x' || axis === 'both') {
                scale(-1, 1);
            }
            if (axis === 'y' || axis === 'both') {
                scale(1, -1);
            }
        }
    },
    
    // Aplicar efeitos após o desenho (pós-processamento)
    applyPostEffects(params, audioData) {
        // Inverter cores
        if (this.activeEffects.invert) {
            filter(INVERT);
        }
        
        // Blur
        if (this.activeEffects.blur) {
            filter(BLUR, this.effectParams.blur.amount);
        }
    },
    
    // Aplicar efeito de caleidoscópio (requer renderização especial)
    // Este efeito precisa ser aplicado de forma diferente - renderizando a cena múltiplas vezes
    applyKaleidoscope(params, audioData) {
        if (!this.activeEffects.kaleidoscope) return;
        
        let segments = this.effectParams.kaleidoscope.segments;
        let angleStep = 360 / segments;
        
        // Criar máscara circular
        push();
        noStroke();
        fill(0, 0, 0);
        ellipse(0, 0, width * 2, height * 2);
        pop();
        
        // Desenhar cada segmento espelhado
        for (let i = 0; i < segments; i++) {
            push();
            rotate(i * angleStep);
            
            // Espelhar segmentos alternados para efeito caleidoscópio
            if (i % 2 === 1) {
                scale(1, -1);
            }
            
            // A cena será renderizada dentro deste contexto
            // O caleidoscópio será aplicado através de clipping
            pop();
        }
    },
    
    // Resetar todos os efeitos
    resetAll() {
        for (let effect in this.activeEffects) {
            this.activeEffects[effect] = false;
        }
    },
    
    // Obter lista de efeitos ativos
    getActiveEffects() {
        let active = [];
        for (let effect in this.activeEffects) {
            if (this.activeEffects[effect]) {
                active.push(effect);
            }
        }
        return active;
    }
};

