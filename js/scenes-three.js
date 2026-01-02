// Cenas 3D usando Three.js

const ThreeScenes = {
    threeScene: null,
    threeCamera: null,
    threeRenderer: null,
    threeGroup1: null,
    threeGroup2: null,
    threeGroup3: null,
    threeGroup4: null,
    threeObjects: {
        cubes: [],
        tunnelParticles: null,
        sphere: null,
        sphereWire: null,
        imagePlane: null,
        imageTexture: null,
        imageMaterial: null,
        lastImageId: null,
        orthoCamera: null
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

        // --- Cena 14: Imagem Distorcida ---
        this.threeGroup4 = new THREE.Group();
        
        // Criar shader material para distorção
        const vertexShader = `
            uniform float time;
            uniform float distortion;
            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                vec3 pos = position;
                
                // Aplicar distorção baseada em ondas
                pos.x += sin(uv.y * 10.0 + time) * distortion;
                pos.y += cos(uv.x * 10.0 + time) * distortion * 0.3;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
        
        const fragmentShader = `
            uniform sampler2D imageTexture;
            varying vec2 vUv;
            
            void main() {
                vec4 color = texture2D(imageTexture, vUv);
                gl_FragColor = color;
            }
        `;
        
        // Material com shader (será atualizado quando a imagem for carregada)
        this.threeObjects.imageMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                distortion: { value: 0 },
                imageTexture: { value: null }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.DoubleSide
        });
        
            // Criar plano que ocupa toda a tela
            // Usar OrthographicCamera para renderizar plano 2D
            const planeGeometry = new THREE.PlaneGeometry(2, 2, 100, 100);
            this.threeObjects.imagePlane = new THREE.Mesh(planeGeometry, this.threeObjects.imageMaterial);
            this.threeObjects.imagePlane.position.set(0, 0, 0);
            this.threeObjects.imagePlane.rotation.x = 0;
            this.threeGroup4.add(this.threeObjects.imagePlane);
        
        this.threeGroup4.visible = false;
        this.threeScene.add(this.threeGroup4);
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
            this.threeGroup4.visible = false;

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

        // --- Cena 14: Imagem Distorcida ---
        if (currentScene === 14) {
            this.threeGroup1.visible = false;
            this.threeGroup2.visible = false;
            this.threeGroup3.visible = false;
            this.threeGroup4.visible = true;

            // Verificar se há imagem carregada
            if (!MediaManager.hasImage() || !MediaManager.currentImage) {
                console.log('Cena 14: Nenhuma imagem carregada');
                // Renderizar tela preta
                this.threeRenderer.render(this.threeScene, this.threeObjects.orthoCamera || this.threeCamera);
                return;
            }
            
            console.log('Cena 14: Imagem encontrada, dimensões:', MediaManager.currentImage.width, 'x', MediaManager.currentImage.height);

            const img = MediaManager.currentImage;
            const imageUrl = MediaManager.currentImageUrl;
            const currentImageId = (imageUrl || '') + '_' + img.width + '_' + img.height;
            
            // Carregar ou atualizar textura da imagem
            if (!this.threeObjects.imageTexture || this.threeObjects.lastImageId !== currentImageId) {
                // Limpar textura anterior se existir
                if (this.threeObjects.imageTexture) {
                    this.threeObjects.imageTexture.dispose();
                }
                
                // Método preferencial: usar TextureLoader com a URL/dataURL
                if (imageUrl) {
                    const loader = new THREE.TextureLoader();
                    this.threeObjects.imageTexture = loader.load(
                        imageUrl,
                        (texture) => {
                            console.log('Textura carregada com sucesso via TextureLoader');
                            texture.flipY = false;
                            this.threeObjects.imageMaterial.uniforms.imageTexture.value = texture;
                            this.threeObjects.imageMaterial.needsUpdate = true;
                        },
                        undefined,
                        (error) => {
                            console.error('Erro ao carregar textura:', error);
                        }
                    );
                    this.threeObjects.lastImageId = currentImageId;
                } else {
                    // Fallback: tentar converter p5.Image para canvas
                    console.log('Tentando converter p5.Image para canvas...');
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    
                    let imageDrawn = false;
                    
                    // Tentar diferentes métodos para obter a imagem
                    if (img.elt && (img.elt instanceof HTMLImageElement || img.elt instanceof HTMLCanvasElement)) {
                        try {
                            ctx.drawImage(img.elt, 0, 0);
                            imageDrawn = true;
                        } catch (e) {
                            console.log('Método elt falhou:', e);
                        }
                    }
                    
                    if (!imageDrawn && img.canvas) {
                        try {
                            ctx.drawImage(img.canvas, 0, 0);
                            imageDrawn = true;
                        } catch (e) {
                            console.log('Método canvas falhou:', e);
                        }
                    }
                    
                    if (!imageDrawn) {
                        try {
                            const imgCopy = img.get();
                            if (imgCopy && imgCopy.canvas) {
                                ctx.drawImage(imgCopy.canvas, 0, 0);
                                imageDrawn = true;
                            } else if (imgCopy && imgCopy.elt) {
                                ctx.drawImage(imgCopy.elt, 0, 0);
                                imageDrawn = true;
                            }
                        } catch (e) {
                            console.log('Método get() falhou:', e);
                        }
                    }
                    
                    if (imageDrawn) {
                        this.threeObjects.imageTexture = new THREE.CanvasTexture(canvas);
                        this.threeObjects.imageTexture.flipY = false;
                        this.threeObjects.imageTexture.needsUpdate = true;
                        this.threeObjects.imageMaterial.uniforms.imageTexture.value = this.threeObjects.imageTexture;
                        this.threeObjects.lastImageId = currentImageId;
                        console.log('Textura criada via canvas:', canvas.width, 'x', canvas.height);
                    } else {
                        console.error('Não foi possível converter imagem para textura');
                        return;
                    }
                }
            }

            // Configurar câmera ortográfica para plano 2D que ocupa toda a tela
            // Usar coordenadas em pixels para ocupar toda a tela
            const w = window.innerWidth;
            const h = window.innerHeight;
            
            // Criar ou atualizar câmera ortográfica
            if (!this.threeObjects.orthoCamera) {
                this.threeObjects.orthoCamera = new THREE.OrthographicCamera(
                    -w / 2, w / 2,  // left, right
                    h / 2, -h / 2,  // top, bottom
                    0.1, 1000
                );
                this.threeObjects.orthoCamera.position.z = 1;
                this.threeObjects.orthoCamera.lookAt(0, 0, 0);
            } else {
                // Atualizar dimensões da câmera se a janela foi redimensionada
                this.threeObjects.orthoCamera.left = -w / 2;
                this.threeObjects.orthoCamera.right = w / 2;
                this.threeObjects.orthoCamera.top = h / 2;
                this.threeObjects.orthoCamera.bottom = -h / 2;
                this.threeObjects.orthoCamera.updateProjectionMatrix();
            }
            
            const orthoCamera = this.threeObjects.orthoCamera;

            // Ajustar plano para ocupar toda a tela mantendo proporção da imagem
            // img já foi declarado acima
            const imgAspect = img.width / img.height;
            const screenAspect = w / h;
            
            let planeWidth = w;
            let planeHeight = h;
            
            // Fazer a imagem ocupar toda a tela (cobrir toda a área)
            if (imgAspect > screenAspect) {
                // Imagem mais larga - ajustar altura para cobrir
                planeHeight = w / imgAspect;
            } else {
                // Imagem mais alta - ajustar largura para cobrir
                planeWidth = h * imgAspect;
            }
            
            // Atualizar geometria do plano se necessário
            const currentGeo = this.threeObjects.imagePlane.geometry;
            if (Math.abs(currentGeo.parameters.width - planeWidth) > 1 ||
                Math.abs(currentGeo.parameters.height - planeHeight) > 1) {
                currentGeo.dispose();
                this.threeObjects.imagePlane.geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 100, 100);
            }

            // Verificar se a textura foi carregada e está pronta
            if (!this.threeObjects.imageTexture) {
                console.warn('Textura não carregada ainda');
                // Renderizar tela preta enquanto carrega
                if (this.threeObjects.orthoCamera) {
                    this.threeRenderer.render(this.threeScene, this.threeObjects.orthoCamera);
                }
                return;
            }
            
            // Verificar se a textura tem imagem carregada
            if (!this.threeObjects.imageTexture.image || 
                (this.threeObjects.imageTexture.image && !this.threeObjects.imageTexture.image.complete)) {
                console.log('Aguardando imagem carregar...');
                return;
            }

            // Atualizar uniformes do shader
            let distortion = map(bass, 0, 255, 0, 0.15) * params.sens * 0.4;
            this.threeObjects.imageMaterial.uniforms.distortion.value = distortion;
            this.threeObjects.imageMaterial.uniforms.time.value = time;
            
            // Garantir que a textura está definida
            if (this.threeObjects.imageMaterial.uniforms.imageTexture.value !== this.threeObjects.imageTexture) {
                this.threeObjects.imageMaterial.uniforms.imageTexture.value = this.threeObjects.imageTexture;
            }

            // Renderizar com câmera ortográfica
            this.threeRenderer.render(this.threeScene, orthoCamera);
            return;
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
            
            // Atualizar câmera ortográfica se existir
            if (this.threeObjects.orthoCamera) {
                const w = window.innerWidth;
                const h = window.innerHeight;
                this.threeObjects.orthoCamera.left = -w / 2;
                this.threeObjects.orthoCamera.right = w / 2;
                this.threeObjects.orthoCamera.top = h / 2;
                this.threeObjects.orthoCamera.bottom = -h / 2;
                this.threeObjects.orthoCamera.updateProjectionMatrix();
            }
        }
    }
};
