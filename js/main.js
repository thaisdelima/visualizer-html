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
    strobe: false
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

// --- Configuração p5.js ---
function setup() {
    p5Canvas = createCanvas(windowWidth, windowHeight);
    
    colorMode(HSB, 360, 255, 255, 255);
    rectMode(CENTER);
    angleMode(DEGREES);
    
    // Inicializar objetos p5
    initP5Objects();
    
    // Inicializar Three.js
    ThreeScenes.initThreeJS();
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
    ThreeScenes.resizeThreeJS();
}

// --- Loop Principal (p5.js conduz tudo) ---
function draw() {
    // Análise de Áudio (sempre rodando)
    AudioManager.analyzeAudio(params);
    
    if (AudioManager.getAudioStarted()) {
        Controls.updateAudioUI(AudioManager.audioData);
    }

    // Controle de Renderização
    if (currentScene > 10) {
        // MODO 3D: Three.js
        clear();
        ThreeScenes.getThreeRenderer().domElement.style.display = 'block';
        ThreeScenes.drawThreeJS(currentScene, params, AudioManager.audioData);

        if (params.strobe) {
            background(255);
        }
    } else {
        // MODO 2D: p5.js
        ThreeScenes.getThreeRenderer().domElement.style.display = 'none';

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
        if (![7, 8, 10].includes(currentScene)) {
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
        }
        pop();
    }

    // FPS
    if (frameCount % 30 === 0) {
        document.getElementById('fps-counter').innerText = `FPS: ${floor(frameRate())}`;
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
}

function keyReleased() {
    if (key === ' ') Controls.triggerStrobe(params, false);
}
