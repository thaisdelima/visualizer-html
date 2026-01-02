// Arquivo principal - inicialização e loop de renderização

// Variáveis globais
let p5Canvas;
let currentScene = 1;
let params = {
    sens: 1.5,
    smooth: 0.8,
    speed: 1.0,
    hue: 0,
    trail: 40,
    strobe: false,
    palette: 'neon'
};

// Elementos auxiliares p5
let particles = [];
let stars = [];
let drops = [];

// Expor funções globais para o HTML
window.startAudio = () => {
    if (typeof AudioManager !== 'undefined') {
        AudioManager.startAudio();
    } else {
        console.error('AudioManager não está definido. Verifique se os scripts foram carregados corretamente.');
    }
};
window.changeScene = (n) => { 
    if (typeof Controls !== 'undefined') {
        currentScene = Controls.changeScene(n, currentScene);
    }
};
window.updateParam = (k, v) => { 
    if (typeof Controls !== 'undefined') {
        Controls.updateParam(params, k, v);
    }
};
window.triggerStrobe = (v) => { 
    if (typeof Controls !== 'undefined') {
        Controls.triggerStrobe(params, v);
    }
};
window.changePalette = (paletteName) => {
    if (typeof Controls !== 'undefined') {
        Controls.changePalette(paletteName);
    }
};
window.toggleControls = () => {
    if (typeof Controls !== 'undefined') {
        Controls.toggleControls();
    }
};

// Expor MediaManager globalmente
if (typeof MediaManager !== 'undefined') {
    window.MediaManager = MediaManager;
    // Pré-carregar modelo TensorFlow em background (opcional, melhora performance)
    // O modelo será carregado quando necessário, mas podemos iniciar o carregamento antecipadamente
    if (typeof bodyPix !== 'undefined' && typeof tf !== 'undefined') {
        // Carregar modelo em background após um pequeno delay para não bloquear a inicialização
        setTimeout(() => {
            MediaManager.initTensorFlowModel().catch(err => {
                console.log('Modelo TensorFlow será carregado sob demanda:', err);
            });
        }, 2000);
    }
}

// Configurar event listeners (funciona mesmo se o DOM já estiver carregado)
function setupControlButtons() {
    // Botão de abrir controles
    let openBtn = document.getElementById('open-controls-btn');
    if (openBtn) {
        // Remover listener anterior se existir
        openBtn.replaceWith(openBtn.cloneNode(true));
        openBtn = document.getElementById('open-controls-btn');
        openBtn.addEventListener('click', function() {
            if (typeof Controls !== 'undefined') {
                Controls.toggleControls();
            }
        });
    }
}

// Executar quando o DOM estiver pronto ou imediatamente se já estiver
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupControlButtons);
} else {
    setupControlButtons();
}

// --- Configuração p5.js ---
function setup() {
    p5Canvas = createCanvas(windowWidth, windowHeight);
    
    colorMode(HSB, 360, 255, 255, 255);
    rectMode(CENTER);
    angleMode(DEGREES);
    
    // Inicializar objetos p5
    initP5Objects();
    
    // Inicializar Three.js
    if (typeof ThreeScenes !== 'undefined') {
        ThreeScenes.initThreeJS();
    } else {
        console.error('ThreeScenes não está definido. Verifique se scenes-three.js foi carregado.');
    }
}

function initP5Objects() {
    for (let i = 0; i < 100; i++) {
        particles.push(new Particle());
    }
    for (let i = 0; i < 400; i++) {
        stars.push(new Star());
    }
    initMatrixDrops();
}

function initMatrixDrops() {
    drops = [];
    let cols = width / 20;
    for (let i = 0; i < cols; i++) {
        drops.push(new MatrixDrop(i * 20));
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    initMatrixDrops();
    if (typeof ThreeScenes !== 'undefined' && ThreeScenes.resizeThreeJS) {
        ThreeScenes.resizeThreeJS();
    }
}

// --- Loop Principal (p5.js conduz tudo) ---
function draw() {
    // Análise de Áudio (sempre rodando)
    AudioManager.analyzeAudio(params);
    
    if (AudioManager.getAudioStarted()) {
        Controls.updateAudioUI(AudioManager.audioData);
    }

    // Controle de Renderização
    if (currentScene > 10 && currentScene <= 13 || currentScene === 14) {
        // MODO 3D: Three.js (cenas 11-13 e 14)
        if (typeof ThreeScenes === 'undefined' || !ThreeScenes.getThreeRenderer) {
            console.error('ThreeScenes não está disponível');
            return;
        }
        clear();
        ThreeScenes.getThreeRenderer().domElement.style.display = 'block';
        ThreeScenes.drawThreeJS(currentScene, params, AudioManager.audioData);

        if (params.strobe) {
            background(255);
        }
    } else {
        // MODO 2D: p5.js (cenas 1-10 e 15-17)
        if (typeof ThreeScenes !== 'undefined' && ThreeScenes.getThreeRenderer) {
            ThreeScenes.getThreeRenderer().domElement.style.display = 'none';
        }

        if (params.strobe) {
            background(0, 0, 255);
            return;
        }
        
        // Background com Trail para cenas 2D
        if ([5, 7].includes(currentScene)) {
            background(0, 0, 0, 80);
        } else {
            background(0, 0, 0, params.trail);
        }

        push();
        if (![7, 8, 10, 14, 15, 16, 17, 18, 19, 20].includes(currentScene)) {
            translate(width / 2, height / 2);
        }

        switch (currentScene) {
            case 1: P5Scenes.sceneSpectrum(params, AudioManager.audioData); break;
            case 2: P5Scenes.sceneParticles(params, particles, AudioManager.audioData); break;
            case 3: P5Scenes.sceneTunnel(params, AudioManager.audioData); break;
            case 4: P5Scenes.sceneGlitch(params, AudioManager.audioData); break;
            case 5: P5Scenes.sceneWaveform(params, AudioManager.audioData); break;
            case 6: P5Scenes.sceneMandala(params, AudioManager.audioData); break;
            case 7: P5Scenes.sceneMatrix(params, drops, AudioManager.audioData); break;
            case 8: P5Scenes.scenePixels(params, AudioManager.audioData); break;
            case 9: P5Scenes.sceneStarfield(params, stars, AudioManager.audioData); break;
            case 10: P5Scenes.sceneFlow(params, AudioManager.audioData); break;
            case 15: P5Scenes.sceneColorParticles(params, particles, AudioManager.audioData); break;
            case 16: P5Scenes.sceneVideoReactive(params, AudioManager.audioData); break;
            case 17: P5Scenes.scenePixelArt(params, AudioManager.audioData); break;
            case 18: P5Scenes.sceneReactiveContours(params, AudioManager.audioData); break;
            case 19: P5Scenes.sceneReactiveShapes(params, AudioManager.audioData); break;
            case 20: P5Scenes.sceneShapeParticles(params, particles, AudioManager.audioData); break;
        }
        pop();
    }

    // FPS
    if (frameCount % 30 === 0) {
        let fpsCounter = document.getElementById('fps-counter');
        if (fpsCounter) {
            fpsCounter.innerText = `FPS: ${floor(frameRate())}`;
        }
        
        // Atualizar FPS na janela popup se estiver aberta
        if (typeof Controls !== 'undefined' && Controls.controlsWindow && !Controls.controlsWindow.closed) {
            try {
                let popupFpsCounter = Controls.controlsWindow.document.getElementById('fps-counter');
                if (popupFpsCounter) {
                    popupFpsCounter.innerText = `FPS: ${floor(frameRate())}`;
                }
            } catch (e) {
                // Ignorar erros de cross-origin se houver
            }
        }
    }
}

function keyPressed() {
    if (key >= '0' && key <= '9') {
        let n = parseInt(key);
        if (n === 0) n = 10;
        currentScene = Controls.changeScene(n, currentScene);
    }
    if (key === 'q' || key === 'Q') currentScene = Controls.changeScene(11, currentScene);
    if (key === 'w' || key === 'W') currentScene = Controls.changeScene(12, currentScene);
    if (key === 'e' || key === 'E') currentScene = Controls.changeScene(13, currentScene);
    
    if (key === ' ') Controls.triggerStrobe(params, true);
    if (key === 'h' || key === 'H') Controls.toggleControls();
    if (keyCode === ESC) {
        let controls = document.getElementById('controls');
        if (!controls.classList.contains('hidden')) {
            Controls.toggleControls();
        }
    }
}

function keyReleased() {
    if (key === ' ') Controls.triggerStrobe(params, false);
}
