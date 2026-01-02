// Cenas 3D usando Three.js

const ThreeScenes = {
    threeScene: null,
    threeCamera: null,
    threeRenderer: null,
    threeGroup1: null,
    threeGroup2: null,
    threeGroup3: null,
    threeObjects: {
        cubes: [],
        tunnelParticles: null,
        sphere: null,
        sphereWire: null
    },
    
    initThreeJS() {
        // Cena
        this.threeScene = new THREE.Scene();
        this.threeScene.fog = new THREE.FogExp2(0x000000, 0.002);

        // Câmera
        this.threeCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.threeCamera.position.z = 50;

        // Renderizador
        this.threeRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
        this.threeRenderer.domElement.id = 'three-canvas';
        document.body.appendChild(this.threeRenderer.domElement);

        // --- Cena 11: City (Cubos) ---
        this.threeGroup1 = new THREE.Group();
        let geo = new THREE.BoxGeometry(2, 2, 2);
        let mat = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true });
        
        // Grid de cubos
        for (let x = -10; x <= 10; x++) {
            for (let z = -10; z <= 10; z++) {
                let mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(x * 3, 0, z * 3);
                mesh.userData = { initialY: 0, offset: Math.random() * 100 };
                this.threeGroup1.add(mesh);
                this.threeObjects.cubes.push(mesh);
            }
        }
        
        // Luz para os cubos
        let light1 = new THREE.PointLight(0xffffff, 1, 100);
        light1.position.set(0, 20, 0);
        this.threeGroup1.add(light1);
        let ambLight = new THREE.AmbientLight(0x404040);
        this.threeGroup1.add(ambLight);
        
        this.threeGroup1.visible = false;
        this.threeScene.add(this.threeGroup1);

        // --- Cena 12: Vortex (Partículas) ---
        this.threeGroup2 = new THREE.Group();
        let starsGeometry = new THREE.BufferGeometry();
        let starsCount = 5000;
        let posArray = new Float32Array(starsCount * 3);
        for (let i = 0; i < starsCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 200;
        }
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        let starsMaterial = new THREE.PointsMaterial({ size: 0.5, color: 0xffffff });
        this.threeObjects.tunnelParticles = new THREE.Points(starsGeometry, starsMaterial);
        this.threeGroup2.add(this.threeObjects.tunnelParticles);
        
        this.threeGroup2.visible = false;
        this.threeScene.add(this.threeGroup2);

        // --- Cena 13: Planet (Esfera Reativa) ---
        this.threeGroup3 = new THREE.Group();
        let sGeo = new THREE.IcosahedronGeometry(15, 3);
        let sMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.8 });
        this.threeObjects.sphereWire = new THREE.Mesh(sGeo, sMat);
        
        let sMat2 = new THREE.MeshPhongMaterial({ color: 0x000000, shininess: 100 });
        this.threeObjects.sphere = new THREE.Mesh(sGeo, sMat2);
        
        this.threeGroup3.add(this.threeObjects.sphereWire);
        this.threeGroup3.add(this.threeObjects.sphere);
        
        // Luzes para o planeta
        let dirLight = new THREE.DirectionalLight(0xff00ff, 1);
        dirLight.position.set(1, 1, 1);
        this.threeGroup3.add(dirLight);
        let dirLight2 = new THREE.DirectionalLight(0x00ffff, 1);
        dirLight2.position.set(-1, -1, 1);
        this.threeGroup3.add(dirLight2);

        this.threeGroup3.visible = false;
        this.threeScene.add(this.threeGroup3);
    },
    
    drawThreeJS(currentScene, params, audioData) {
        if (!this.threeScene) return;

        // Obter cor da paleta atual
        let paletteName = params.palette || 'neon';
        let baseColor = ColorPalettes.getColor(paletteName, 0, params.hue, audioData);
        // Converter HSB para HSL (Three.js usa HSL com valores 0-1)
        let h = (baseColor.h % 360) / 360;
        let s = Math.max(0, Math.min(1, baseColor.s / 255));
        let l = Math.max(0, Math.min(1, baseColor.b / 255));
        let color = new THREE.Color();
        color.setHSL(h, s, l);

        // Dados de Áudio
        let bass = audioData.bass;
        let mid = audioData.mid;
        let treble = audioData.treble;
        let time = frameCount * 0.01 * params.speed;

        // --- Cena 11: City ---
        if (currentScene === 11) {
            this.threeGroup1.visible = true;
            this.threeGroup2.visible = false;
            this.threeGroup3.visible = false;
            
            this.threeCamera.position.x = Math.sin(time * 0.5) * 40;
            this.threeCamera.position.z = Math.cos(time * 0.5) * 40;
            this.threeCamera.position.y = 20 + map(mid, 0, 255, 0, 10);
            this.threeCamera.lookAt(0, 0, 0);

            let spectrum = audioData.spectrum;
            
            // Atualizar cubos
            this.threeObjects.cubes.forEach((cube, i) => {
                let freqIdx = i % 64;
                let val = spectrum ? spectrum[freqIdx] : 0;
                
                let scaleY = map(val, 0, 255, 0.1, 10) * params.sens;
                cube.scale.y = cube.scale.y + (scaleY - cube.scale.y) * 0.1;
                cube.position.y = cube.scale.y / 2;
                
                // Usar cor da paleta
                let cubeColor = ColorPalettes.getColor(paletteName, i % 4, params.hue + val, audioData);
                let cubeH = (cubeColor.h % 360) / 360;
                let cubeS = Math.max(0, Math.min(1, cubeColor.s / 255));
                let cubeL = Math.max(0, Math.min(1, cubeColor.b / 255 * 0.5));
                cube.material.color.setHSL(cubeH, cubeS, cubeL);
            });
        }

        // --- Cena 12: Vortex ---
        if (currentScene === 12) {
            this.threeGroup1.visible = false;
            this.threeGroup2.visible = true;
            this.threeGroup3.visible = false;
            
            this.threeObjects.tunnelParticles.rotation.z += 0.005 * params.speed;
            if (bass > 180) {
                this.threeObjects.tunnelParticles.rotation.z += 0.05;
            }

            // Usar cor da paleta para partículas
            let particleColor = ColorPalettes.getColor(paletteName, 0, params.hue, audioData);
            let particleH = (particleColor.h % 360) / 360;
            let particleS = Math.max(0, Math.min(1, particleColor.s / 255));
            let particleL = Math.max(0, Math.min(1, particleColor.b / 255 * 0.8));
            this.threeObjects.tunnelParticles.material.color.setHSL(particleH, particleS, particleL);
            
            let speedZ = map(bass, 0, 255, 0.5, 5) * params.speed;
            this.threeCamera.position.z -= speedZ;
            
            if (this.threeCamera.position.z < -100) {
                this.threeCamera.position.z = 50;
            }
            
            if (bass > 200) {
                this.threeCamera.position.x = (Math.random() - 0.5) * 2;
                this.threeCamera.position.y = (Math.random() - 0.5) * 2;
            } else {
                this.threeCamera.position.x = 0;
                this.threeCamera.position.y = 0;
            }
        }

        // --- Cena 13: Planet ---
        if (currentScene === 13) {
            this.threeGroup1.visible = false;
            this.threeGroup2.visible = false;
            this.threeGroup3.visible = true;

            this.threeCamera.position.set(0, 0, 40);
            this.threeCamera.lookAt(0, 0, 0);

            let scale = map(bass, 0, 255, 1, 1.5) * params.sens;
            this.threeObjects.sphereWire.scale.setScalar(scale);
            this.threeObjects.sphere.scale.setScalar(scale * 0.95);

            this.threeObjects.sphereWire.rotation.y += 0.01 * params.speed;
            this.threeObjects.sphereWire.rotation.z += 0.005;

            // Usar cor da paleta para esfera
            let sphereColor = ColorPalettes.getColor(paletteName, 0, params.hue, audioData);
            let sphereH = (sphereColor.h % 360) / 360;
            let sphereS = Math.max(0, Math.min(1, sphereColor.s / 255));
            let sphereL = Math.max(0, Math.min(1, sphereColor.b / 255 * 0.5));
            this.threeObjects.sphereWire.material.color.setHSL(sphereH, sphereS, sphereL);
            
            if (treble > 150) {
                this.threeObjects.sphereWire.material.wireframeLinewidth = 2;
            } else {
                this.threeObjects.sphereWire.material.wireframeLinewidth = 1;
            }
        }

        this.threeRenderer.render(this.threeScene, this.threeCamera);
    },
    
    getThreeRenderer() {
        return this.threeRenderer;
    },
    
    resizeThreeJS() {
        if (this.threeCamera && this.threeRenderer) {
            this.threeCamera.aspect = window.innerWidth / window.innerHeight;
            this.threeCamera.updateProjectionMatrix();
            this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
        }
    }
};
