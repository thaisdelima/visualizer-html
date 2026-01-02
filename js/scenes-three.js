// Cenas 3D usando Three.js

const ThreeScenes = {
    threeScene: null,
    threeCamera: null,
    threeRenderer: null,
    threeGroup1: null,
    threeGroup2: null,
    threeGroup3: null,
    threeGroup4: null,
    threeGroup5: null,
    threeObjects: {
        cubes: [],
        tunnelParticles: null,
        sphere: null,
        sphereWire: null,
        fallingBalls: [],
        silhouetteCharacter: null,
        silhouetteJoints: null,
        silhouetteTrails: [],
        silhouetteClock: null
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
        this.threeRenderer.shadowMap.enabled = true;
        this.threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

        // --- Cena 14: Falling Balls (Bolas Caindo) ---
        this.threeGroup4 = new THREE.Group();
        
        // Luzes para as bolas
        let ballLight1 = new THREE.PointLight(0xffffff, 1, 200);
        ballLight1.position.set(0, 50, 0);
        this.threeGroup4.add(ballLight1);
        let ballAmbLight = new THREE.AmbientLight(0x404040);
        this.threeGroup4.add(ballAmbLight);
        
        // Inicializar algumas bolas
        this.threeObjects.fallingBalls = [];
        for (let i = 0; i < 20; i++) {
            this._createFallingBall();
        }
        
        this.threeGroup4.visible = false;
        this.threeScene.add(this.threeGroup4);

        // --- Cena 21: Silhueta Caminhando ---
        this.threeGroup5 = new THREE.Group();
        
        // Cores
        this.threeObjects.silhouetteColors = {
            silhouette: 0x050505, // Quase preto
            bg: 0x202035, // Azul noturno profundo
            fog: 0x202035,
            trail: 0xaa88ff // Rastro violeta etéreo
        };
        
        // Relógio para animação
        this.threeObjects.silhouetteClock = new THREE.Clock();
        this.threeObjects.silhouetteTrails = [];
        
        // Criar múltiplos personagens para loop perfeito
        this.threeObjects.silhouetteCharacters = [];
        this.threeObjects.silhouetteJointsArray = [];
        const numCharacters = 3; // Número de personagens para criar loop
        const spacing = 30; // Espaçamento entre personagens
        
        for (let i = 0; i < numCharacters; i++) {
            const charData = this._createSilhouetteCharacter();
            charData.character.position.z = -spacing + (i * spacing);
            this.threeObjects.silhouetteCharacters.push(charData.character);
            this.threeObjects.silhouetteJointsArray.push(charData.joints);
        }
        
        // Iluminação dramática para silhueta
        const backLight = new THREE.SpotLight(0xffffff, 2);
        backLight.position.set(0, 5, -10);
        backLight.lookAt(0, 0, 0);
        backLight.castShadow = true;
        this.threeGroup5.add(backLight);
        
        const ambiLight = new THREE.AmbientLight(0x222222);
        this.threeGroup5.add(ambiLight);
        
        // Chão infinito
        const planeGeometry = new THREE.PlaneGeometry(500, 500);
        const planeMaterial = new THREE.MeshPhongMaterial({
            color: 0x111115,
            shininess: 10,
            specular: 0x222222
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        this.threeGroup5.add(plane);
        
        this.threeGroup5.visible = false;
        this.threeScene.add(this.threeGroup5);
    },
    
    _createSilhouetteCharacter() {
        const character = new THREE.Group();
        const colors = this.threeObjects.silhouetteColors;
        const silhouetteMat = new THREE.MeshLambertMaterial({ color: colors.silhouette });
        
        // Referências para animação das articulações
        const joints = {
            rightThigh: null,
            rightShin: null,
            leftThigh: null,
            leftShin: null,
            rightArm: null,
            rightForeArm: null,
            leftArm: null,
            leftForeArm: null
        };
        
        // --- Tronco ---
        // Quadril
        const hipsGeo = new THREE.SphereGeometry(0.24, 16, 16);
        hipsGeo.scale(1.2, 0.8, 1);
        const hips = new THREE.Mesh(hipsGeo, silhouetteMat);
        hips.position.y = 1.7;
        hips.castShadow = true;
        character.add(hips);
        
        // Cintura/Estômago
        const waistGeo = new THREE.CylinderGeometry(0.18, 0.23, 0.6, 12);
        const waist = new THREE.Mesh(waistGeo, silhouetteMat);
        waist.position.y = 2.0;
        waist.castShadow = true;
        character.add(waist);
        
        // Tórax/Peito
        const chestGeo = new THREE.CylinderGeometry(0.25, 0.18, 0.6, 12);
        const chest = new THREE.Mesh(chestGeo, silhouetteMat);
        chest.position.y = 2.6;
        chest.castShadow = true;
        character.add(chest);
        
        // Pescoço
        const neckGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.3, 8);
        const neck = new THREE.Mesh(neckGeo, silhouetteMat);
        neck.position.y = 2.95;
        character.add(neck);
        
        // Cabeça
        const headGeo = new THREE.SphereGeometry(0.2, 16, 16);
        headGeo.scale(0.9, 1.1, 1);
        const head = new THREE.Mesh(headGeo, silhouetteMat);
        head.position.y = 3.2;
        head.castShadow = true;
        character.add(head);
        
        // Cabelo
        const hairGeo = new THREE.SphereGeometry(0.22, 16, 16, 0, 6.3, 0, 1.8);
        const hair = new THREE.Mesh(hairGeo, silhouetteMat);
        hair.position.y = 3.2;
        hair.rotation.x = -0.2;
        hair.scale.set(1, 1, 1.1);
        character.add(hair);
        
        // Rabo de cavalo
        const ponytailGeo = new THREE.ConeGeometry(0.08, 0.6, 8);
        const ponytail = new THREE.Mesh(ponytailGeo, silhouetteMat);
        ponytail.position.set(0, 3.0, -0.3);
        ponytail.rotation.x = -0.6;
        character.add(ponytail);
        
        // --- MEMBROS ---
        const legRadius = 0.11;
        const armRadius = 0.07;
        
        function createLimb(isLeg, side) {
            const group = new THREE.Group();
            const upperLen = isLeg ? 0.9 : 0.6;
            const lowerLen = isLeg ? 0.9 : 0.6;
            const radius = isLeg ? legRadius : armRadius;
            
            // Parte Superior
            const upperGeo = new THREE.CylinderGeometry(radius, radius * 0.8, upperLen, 8);
            const upperPart = new THREE.Mesh(upperGeo, silhouetteMat);
            upperPart.position.y = -upperLen / 2;
            upperPart.castShadow = true;
            group.add(upperPart);
            
            // Articulação
            const jointGroup = new THREE.Group();
            jointGroup.position.y = -upperLen;
            group.add(jointGroup);
            
            // Parte Inferior
            const lowerGeo = new THREE.CylinderGeometry(radius * 0.8, radius * 0.6, lowerLen, 8);
            const lowerPart = new THREE.Mesh(lowerGeo, silhouetteMat);
            lowerPart.position.y = -lowerLen / 2;
            lowerPart.castShadow = true;
            jointGroup.add(lowerPart);
            
            // Pés ou Mãos
            const endGeo = isLeg ? new THREE.BoxGeometry(0.15, 0.1, 0.3) : new THREE.SphereGeometry(0.06);
            const endPart = new THREE.Mesh(endGeo, silhouetteMat);
            endPart.position.y = -lowerLen;
            if (isLeg) endPart.position.z = 0.05;
            jointGroup.add(endPart);
            
            return { root: group, joint: jointGroup };
        }
        
        // PERNA DIREITA
        const rLeg = createLimb(true, 1);
        rLeg.root.position.set(0.18, 1.7, 0);
        character.add(rLeg.root);
        joints.rightThigh = rLeg.root;
        joints.rightShin = rLeg.joint;
        
        // PERNA ESQUERDA
        const lLeg = createLimb(true, -1);
        lLeg.root.position.set(-0.18, 1.7, 0);
        character.add(lLeg.root);
        joints.leftThigh = lLeg.root;
        joints.leftShin = lLeg.joint;
        
        // BRAÇO DIREITO
        const rArm = createLimb(false, 1);
        rArm.root.position.set(0.4, 2.75, 0);
        character.add(rArm.root);
        joints.rightArm = rArm.root;
        joints.rightForeArm = rArm.joint;
        
        // BRAÇO ESQUERDO
        const lArm = createLimb(false, -1);
        lArm.root.position.set(-0.4, 2.75, 0);
        character.add(lArm.root);
        joints.leftArm = lArm.root;
        joints.leftForeArm = lArm.joint;
        
        this.threeGroup5.add(character);
        
        // Retornar dados do personagem para uso em loop
        return { character: character, joints: joints };
    },
    
    _createSilhouetteTrail(character) {
        if (Math.random() > 0.4) return;
        
        const colors = this.threeObjects.silhouetteColors;
        const geometry = new THREE.SphereGeometry(0.08, 4, 4);
        const material = new THREE.MeshBasicMaterial({
            color: colors.trail,
            transparent: true,
            opacity: 0.6
        });
        
        const particle = new THREE.Mesh(geometry, material);
        const charPos = character.position.clone();
        
        particle.position.set(
            charPos.x + (Math.random() - 0.5) * 0.6,
            0.1,
            charPos.z + (Math.random() - 0.5) * 0.5 + 0.2
        );
        
        this.threeGroup5.add(particle);
        this.threeObjects.silhouetteTrails.push({
            mesh: particle,
            life: 1.0,
            velocity: new THREE.Vector3(0, 0.01 + Math.random() * 0.02, 0)
        });
    },
    
    _updateSilhouetteTrails() {
        for (let i = this.threeObjects.silhouetteTrails.length - 1; i >= 0; i--) {
            let t = this.threeObjects.silhouetteTrails[i];
            t.life -= 0.015;
            
            t.mesh.position.add(t.velocity);
            t.mesh.rotation.y += 0.05;
            
            t.mesh.material.opacity = t.life * 0.6;
            t.mesh.scale.setScalar(t.life * 2);
            
            if (t.life <= 0) {
                this.threeGroup5.remove(t.mesh);
                t.mesh.geometry.dispose();
                t.mesh.material.dispose();
                this.threeObjects.silhouetteTrails.splice(i, 1);
            }
        }
    },
    
    _createFallingBall() {
        let radius = Math.random() * 1.5 + 0.5;
        let geometry = new THREE.SphereGeometry(radius, 16, 16);
        let material = new THREE.MeshPhongMaterial({ 
            color: 0x00ffff,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        let ball = new THREE.Mesh(geometry, material);
        
        // Posição inicial aleatória no topo
        ball.position.set(
            (Math.random() - 0.5) * 40,
            30 + Math.random() * 20,
            (Math.random() - 0.5) * 40
        );
        
        // Velocidade inicial e física
        ball.userData = {
            velocityY: -(Math.random() * 0.5 + 0.5), // Velocidade vertical (negativa = para baixo)
            velocityX: (Math.random() - 0.5) * 0.3, // Velocidade horizontal X
            velocityZ: (Math.random() - 0.5) * 0.3, // Velocidade horizontal Z
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.02
            },
            radius: radius,
            colorIndex: Math.floor(Math.random() * 4),
            bounceCount: 0, // Contador de quiques
            energy: 1.0 // Energia da bola (diminui a cada quique)
        };
        
        this.threeGroup4.add(ball);
        this.threeObjects.fallingBalls.push(ball);
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
            this.threeGroup4.visible = false;
            this.threeGroup5.visible = false;
            
            this.threeCamera.position.x = Math.sin(time * 0.5) * 40;
            this.threeCamera.position.z = Math.cos(time * 0.5) * 40;
            this.threeCamera.position.y = 20 + map(mid, 0, 255, 0, 10);
            this.threeCamera.lookAt(0, 0, 0);

            let spectrum = audioData.spectrum;
            
            // Atualizar cubos
            this.threeObjects.cubes.forEach((cube, i) => {
                let freqIdx = i % 64;
                let val = spectrum ? spectrum[freqIdx] : 0;
                
                // Usar média das sensibilidades para espectro geral
                let avgSens = (params.sensBass + params.sensMid + params.sensTreble) / 3;
                let scaleY = map(val, 0, 255, 0.1, 10) * avgSens;
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
            this.threeGroup4.visible = false;
            this.threeGroup5.visible = false;
            
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
            this.threeGroup5.visible = false;

            this.threeCamera.position.set(0, 0, 40);
            this.threeCamera.lookAt(0, 0, 0);

            let scale = map(bass, 0, 255, 1, 1.5) * params.sensBass;
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

        // --- Cena 14: Falling Balls (Bolas Caindo) ---
        if (currentScene === 14) {
            this.threeGroup1.visible = false;
            this.threeGroup2.visible = false;
            this.threeGroup3.visible = false;
            this.threeGroup4.visible = true;
            this.threeGroup5.visible = false;

            // Posição da câmera - vista de cima para baixo
            this.threeCamera.position.set(0, 20, 50);
            this.threeCamera.lookAt(0, 0, 0);

            // Gravidade e velocidade baseada no bass
            let gravity = map(bass, 0, 255, 0.2, 0.8) * params.speed;
            let floorLevel = -20; // Nível do chão
            
            // Criar novas bolas quando o bass está alto
            let bassThreshold = 150;
            if (bass > bassThreshold) {
                let spawnChance = map(bass, bassThreshold, 255, 0.1, 0.5);
                if (Math.random() < spawnChance) {
                    this._createFallingBall();
                }
            }

            // Atualizar bolas existentes
            let ballsToRemove = [];
            this.threeObjects.fallingBalls.forEach((ball, index) => {
                // Aplicar gravidade
                ball.userData.velocityY -= gravity;
                
                // Atualizar posição
                ball.position.y += ball.userData.velocityY * params.speed;
                ball.position.x += ball.userData.velocityX * params.speed;
                ball.position.z += ball.userData.velocityZ * params.speed;
                
                // Detectar colisão com o chão
                if (ball.position.y <= floorLevel + ball.userData.radius) {
                    // Quicar!
                    ball.userData.velocityY = Math.abs(ball.userData.velocityY) * 0.7; // Inverter e amortecer
                    ball.position.y = floorLevel + ball.userData.radius; // Corrigir posição
                    ball.userData.bounceCount++;
                    ball.userData.energy *= 0.7; // Perder energia a cada quique
                    
                    // Adicionar um pouco de movimento horizontal aleatório no quique
                    if (ball.userData.bounceCount < 3) {
                        ball.userData.velocityX += (Math.random() - 0.5) * 0.2;
                        ball.userData.velocityZ += (Math.random() - 0.5) * 0.2;
                    }
                }
                
                // Rotação baseada no áudio e velocidade
                let rotationMultiplier = 1 + (bass / 255) * 2 + Math.abs(ball.userData.velocityY) * 0.5;
                ball.rotation.x += ball.userData.rotationSpeed.x * rotationMultiplier * params.speed;
                ball.rotation.y += ball.userData.rotationSpeed.y * rotationMultiplier * params.speed;
                ball.rotation.z += ball.userData.rotationSpeed.z * rotationMultiplier * params.speed;
                
                // Escala baseada no bass (pulsação)
                let scale = 1 + map(bass, 0, 255, 0, 0.3) * params.sensBass;
                ball.scale.setScalar(scale);
                
                // Cor reativa ao áudio
                let ballColor = ColorPalettes.getColor(
                    paletteName, 
                    ball.userData.colorIndex, 
                    params.hue + bass * 0.5, 
                    audioData
                );
                let ballH = (ballColor.h % 360) / 360;
                let ballS = Math.max(0, Math.min(1, ballColor.s / 255));
                let ballL = Math.max(0, Math.min(1, ballColor.b / 255));
                ball.material.color.setHSL(ballH, ballS, ballL);
                
                // Opacidade diminui com a energia (bolas que quicaram muito ficam mais transparentes)
                ball.material.opacity = 0.5 + ball.userData.energy * 0.4;
                
                // Efeito de brilho quando o bass está alto
                if (bass > 200) {
                    ball.material.emissive = ball.material.color.clone();
                    ball.material.emissiveIntensity = 0.5;
                } else {
                    ball.material.emissive = new THREE.Color(0x000000);
                    ball.material.emissiveIntensity = 0;
                }
                
                // Remover bolas que saíram de vista ou perderam muita energia
                let maxDistance = 60;
                let minVelocity = 0.15; // Velocidade mínima para continuar
                if (Math.abs(ball.position.x) > maxDistance || 
                    Math.abs(ball.position.z) > maxDistance || 
                    ball.position.y < -50 ||
                    ball.userData.energy < 0.1 ||
                    (ball.position.y < floorLevel + 10 && Math.abs(ball.userData.velocityY) < minVelocity && ball.userData.bounceCount > 3)) {
                    ballsToRemove.push(index);
                }
            });

            // Remover bolas que saíram da tela
            ballsToRemove.reverse().forEach(index => {
                let ball = this.threeObjects.fallingBalls[index];
                this.threeGroup4.remove(ball);
                ball.geometry.dispose();
                ball.material.dispose();
                this.threeObjects.fallingBalls.splice(index, 1);
            });

            // Limitar número máximo de bolas (performance)
            const maxBalls = 100;
            while (this.threeObjects.fallingBalls.length > maxBalls) {
                let ball = this.threeObjects.fallingBalls.shift();
                this.threeGroup4.remove(ball);
                ball.geometry.dispose();
                ball.material.dispose();
            }
        }

        // --- Cena 21: Silhueta Caminhando ---
        if (currentScene === 21) {
            this.threeGroup1.visible = false;
            this.threeGroup2.visible = false;
            this.threeGroup3.visible = false;
            this.threeGroup4.visible = false;
            this.threeGroup5.visible = true;
            
            // Atualizar cor de fundo e neblina baseada na paleta
            let bgColor = ColorPalettes.getColor(paletteName, 0, params.hue, audioData);
            let bgH = (bgColor.h % 360) / 360;
            let bgS = Math.max(0, Math.min(1, bgColor.s / 255 * 0.3)); // Mais escuro
            let bgL = Math.max(0, Math.min(1, bgColor.b / 255 * 0.15)); // Muito escuro
            let bgThreeColor = new THREE.Color();
            bgThreeColor.setHSL(bgH, bgS, bgL);
            this.threeScene.background = bgThreeColor;
            this.threeScene.fog.color = bgThreeColor;
            
            // Atualizar cor do rastro baseada na paleta
            let trailColor = ColorPalettes.getColor(paletteName, 2, params.hue + bass * 0.5, audioData);
            let trailH = (trailColor.h % 360) / 360;
            let trailS = Math.max(0, Math.min(1, trailColor.s / 255));
            let trailL = Math.max(0, Math.min(1, trailColor.b / 255));
            let trailThreeColor = new THREE.Color();
            trailThreeColor.setHSL(trailH, trailS, trailL);
            this.threeObjects.silhouetteColors.trail = trailThreeColor.getHex();
            
            const characters = this.threeObjects.silhouetteCharacters;
            
            // Configurar câmera inicial se necessário
            if (characters && characters.length > 0) {
                const firstChar = characters[0];
                // Posição inicial da câmera
                if (this.threeCamera.position.z === 50 || Math.abs(this.threeCamera.position.z - firstChar.position.z + 6) > 10) {
                    this.threeCamera.position.set(0, 3, 8);
                }
            }
            const jointsArray = this.threeObjects.silhouetteJointsArray;
            
            if (characters && jointsArray && characters.length > 0) {
                // Velocidade baseada no áudio
                let walkSpeed = map(bass, 0, 255, 0.03, 0.12) * params.speed * params.sensBass;
                const baseTime = Date.now() * 0.004 * (1 + bass / 255 * 0.5) * params.speed;
                
                // Parâmetros para loop perfeito
                const spacing = 30; // Espaçamento entre personagens
                const loopRange = spacing * characters.length; // Alcance total do loop
                const resetThreshold = 25; // Quando reposicionar (deve ser maior que o alcance da câmera)
                
                // Encontrar personagem mais próximo da câmera para seguir
                let closestChar = characters[0];
                let closestDist = Math.abs(characters[0].position.z - (this.threeCamera.position.z + 6));
                
                // Atualizar cada personagem
                characters.forEach((character, index) => {
                    const joints = jointsArray[index];
                    
                    // Movimento para frente
                    character.position.z += walkSpeed;
                    
                    // Loop perfeito: quando um personagem sai da tela, reposiciona atrás do mais distante
                    if (character.position.z > resetThreshold) {
                        // Encontrar o personagem mais atrás (menor Z)
                        let minZ = Infinity;
                        characters.forEach(c => {
                            if (c.position.z < minZ) {
                                minZ = c.position.z;
                            }
                        });
                        // Reposicionar este personagem atrás do mais distante
                        character.position.z = minZ - spacing;
                    }
                    
                    // Calcular offset de tempo baseado na posição relativa no loop
                    // Isso garante que a animação seja contínua quando o personagem reaparece
                    let relativeZ = character.position.z;
                    // Normalizar para o range do loop
                    while (relativeZ < -spacing) relativeZ += loopRange;
                    while (relativeZ > spacing * (characters.length - 1)) relativeZ -= loopRange;
                    
                    // Offset baseado na posição no loop (0 a 2π por ciclo)
                    const timeOffset = ((relativeZ + spacing) / loopRange) * Math.PI * 2;
                    const time = baseTime + timeOffset;
                    
                    // --- Animação de Caminhada ---
                    const stride = 0.6 + map(bass, 0, 255, 0, 0.3) * params.sensBass;
                    joints.rightThigh.rotation.x = Math.sin(time) * stride;
                    joints.leftThigh.rotation.x = Math.sin(time + Math.PI) * stride;
                    
                    const kneeBend = 0.8;
                    joints.rightShin.rotation.x = Math.max(0, Math.sin(time + 0.5)) * kneeBend;
                    joints.leftShin.rotation.x = Math.max(0, Math.sin(time + Math.PI + 0.5)) * kneeBend;
                    
                    const armSwing = 0.4 + map(mid, 0, 255, 0, 0.2) * params.sensMid;
                    joints.rightArm.rotation.x = Math.sin(time + Math.PI) * armSwing;
                    joints.leftArm.rotation.x = Math.sin(time) * armSwing;
                    
                    const elbowBend = 0.5;
                    joints.rightForeArm.rotation.x = -0.2 - Math.max(0, Math.sin(time + Math.PI)) * elbowBend;
                    joints.leftForeArm.rotation.x = -0.2 - Math.max(0, Math.sin(time)) * elbowBend;
                    
                    // Balanço do corpo baseado no áudio
                    let bounceAmount = map(bass, 0, 255, 0.02, 0.1) * params.sensBass;
                    character.position.y = Math.sin(time * 2) * bounceAmount;
                    character.rotation.z = Math.cos(time) * 0.02;
                    
                    // Encontrar personagem mais próximo da câmera
                    let dist = Math.abs(character.position.z - (this.threeCamera.position.z + 6));
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestChar = character;
                    }
                    
                    // Criar rastros apenas para personagens visíveis
                    if (character.position.z > this.threeCamera.position.z - 20 && 
                        character.position.z < this.threeCamera.position.z + 10) {
                        this._createSilhouetteTrail(character);
                    }
                });
                
                // Câmera segue o personagem mais próximo
                let targetZ = closestChar.position.z - 6;
                let targetX = closestChar.position.x + 3;
                this.threeCamera.position.z += (targetZ - this.threeCamera.position.z) * 0.05;
                this.threeCamera.position.x += (targetX - this.threeCamera.position.x) * 0.05;
                this.threeCamera.position.y = 3 + Math.sin(baseTime * 2) * map(bass, 0, 255, 0.02, 0.1) * params.sensBass * 2;
                this.threeCamera.lookAt(closestChar.position.x, 2, closestChar.position.z);
            }
            
            // Atualizar rastros existentes
            this._updateSilhouetteTrails();
            
            // Atualizar cores dos rastros
            this.threeObjects.silhouetteTrails.forEach(trail => {
                trail.mesh.material.color.setHex(this.threeObjects.silhouetteColors.trail);
            });
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
