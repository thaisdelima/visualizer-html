// Gerenciamento de mídia (imagens e vídeos)

const MediaManager = {
    currentImage: null,
    currentImageUrl: null, // URL/dataURL da imagem para Three.js
    currentVideo: null,
    imagePixels: null,
    videoPixels: null,
    imageColors: [],
    processedImage: null, // Imagem processada sem fundo
    imageContours: [], // Contornos detectados da imagem
    imageMask: null, // Máscara do assunto principal
    subjectBounds: null, // Limites do assunto principal
    bodyPixModel: null, // Modelo TensorFlow BodyPix
    modelLoading: false, // Flag para indicar se o modelo está carregando
    modelLoaded: false, // Flag para indicar se o modelo foi carregado
    
    // Carregar imagem
    loadImage(file) {
        if (!file || !file.type.startsWith('image/')) {
            console.warn('Arquivo não é uma imagem válida');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            // Armazenar a URL para uso no Three.js
            this.currentImageUrl = e.target.result;
            
            // Usar loadImage do p5.js - ele carrega assincronamente
            // O callback recebe a imagem carregada como parâmetro
            loadImage(e.target.result, (loadedImg) => {
                this.currentImage = loadedImg;
                // Aguardar um frame para garantir que a imagem está totalmente carregada
                setTimeout(() => {
                    this.processImage();
                }, 100);
                console.log('Imagem carregada:', loadedImg.width, 'x', loadedImg.height);
            }, () => {
                console.error('Erro ao carregar imagem');
            });
        };
        reader.readAsDataURL(file);
    },
    
    // Carregar vídeo
    loadVideo(file) {
        if (!file || !file.type.startsWith('video/')) {
            console.warn('Arquivo não é um vídeo válido');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            // createVideo retorna um elemento HTML5 video, que é o que precisamos
            const vid = createVideo(e.target.result, () => {
                vid.hide();
                vid.loop();
                vid.volume(0);
                this.currentVideo = vid;
                console.log('Vídeo carregado');
            });
        };
        reader.readAsDataURL(file);
    },
    
    // Processar imagem para extrair cores e pixels
    processImage() {
        if (!this.currentImage) return;
        
        // currentImage já é um p5.Image quando carregado com loadImage()
        // Podemos usar get() para fazer uma cópia para processar pixels
        try {
            // Fazer uma cópia da imagem para processar
            this.imagePixels = this.currentImage.get();
            if (this.imagePixels && this.imagePixels.loadPixels) {
                this.imagePixels.loadPixels();
            } else {
                console.warn('Imagem não tem método loadPixels, usando diretamente');
                this.imagePixels = this.currentImage;
                if (this.imagePixels.loadPixels) {
                    this.imagePixels.loadPixels();
                }
            }
        } catch (e) {
            console.error('Erro ao processar imagem:', e);
            // Se get() não funcionar, usar a imagem diretamente
            this.imagePixels = this.currentImage;
            if (this.imagePixels && this.imagePixels.loadPixels) {
                this.imagePixels.loadPixels();
            }
        }
        
        // Extrair cores principais
        this.imageColors = [];
        if (this.imagePixels && this.imagePixels.pixels && this.imagePixels.width && this.imagePixels.height) {
            let sampleSize = 20;
            for (let y = 0; y < this.imagePixels.height; y += sampleSize) {
                for (let x = 0; x < this.imagePixels.width; x += sampleSize) {
                    let index = (y * this.imagePixels.width + x) * 4;
                    if (index < this.imagePixels.pixels.length - 2) {
                        let r = this.imagePixels.pixels[index];
                        let g = this.imagePixels.pixels[index + 1];
                        let b = this.imagePixels.pixels[index + 2];
                        
                        // Converter RGB para HSB
                        let hsb = this.rgbToHsb(r, g, b);
                        this.imageColors.push({
                            r, g, b,
                            h: hsb.h,
                            s: hsb.s,
                            b: hsb.b,
                            x: x,
                            y: y
                        });
                    }
                }
            }
        }
        
        // Processar imagem para remover fundo e detectar assunto principal (assíncrono)
        setTimeout(() => {
            this.processImageBackgroundRemoval();
        }, 100);
    },
    
    // Inicializar modelo TensorFlow BodyPix
    async initTensorFlowModel() {
        if (this.modelLoaded || this.modelLoading) return;
        
        // Verificar se TensorFlow.js e BodyPix estão disponíveis
        if (typeof bodyPix === 'undefined' || typeof tf === 'undefined') {
            console.warn('TensorFlow.js ou BodyPix não estão disponíveis. Usando método tradicional.');
            return false;
        }
        
        this.modelLoading = true;
        console.log('Carregando modelo BodyPix...');
        
        try {
            // Carregar modelo BodyPix (versão leve para melhor performance)
            this.bodyPixModel = await bodyPix.load({
                architecture: 'MobileNetV1',
                outputStride: 16,
                multiplier: 0.75,
                quantBytes: 2
            });
            
            this.modelLoaded = true;
            this.modelLoading = false;
            console.log('Modelo BodyPix carregado com sucesso!');
            return true;
        } catch (error) {
            console.error('Erro ao carregar modelo BodyPix:', error);
            this.modelLoading = false;
            return false;
        }
    },
    
    // Processar imagem para remover fundo usando TensorFlow.js
    async processImageBackgroundRemoval() {
        if (!this.imagePixels || !this.imagePixels.pixels) return;
        
        console.log('Processando imagem para remover fundo...');
        
        // Tentar usar TensorFlow.js se disponível
        if (typeof bodyPix !== 'undefined' && typeof tf !== 'undefined') {
            // Inicializar modelo se ainda não foi carregado
            if (!this.modelLoaded && !this.modelLoading) {
                await this.initTensorFlowModel();
            }
            
            // Se o modelo foi carregado, usar TensorFlow
            if (this.modelLoaded && this.bodyPixModel) {
                try {
                    await this.processImageWithTensorFlow();
                    return;
                } catch (error) {
                    console.error('Erro ao processar com TensorFlow, usando método tradicional:', error);
                    // Continuar com método tradicional em caso de erro
                }
            }
        }
        
        // Fallback para método tradicional
        this.processImageBackgroundRemovalTraditional();
    },
    
    // Processar imagem usando TensorFlow.js BodyPix
    async processImageWithTensorFlow() {
        if (!this.bodyPixModel || !this.currentImage) return;
        
        console.log('Processando com TensorFlow.js BodyPix...');
        
        try {
            // Converter p5.Image para elemento HTML Image ou canvas
            let imageElement;
            
            // Tentar obter o elemento HTML da imagem p5.js
            if (this.currentImage.elt) {
                imageElement = this.currentImage.elt;
            } else if (this.currentImage.canvas) {
                // Se tiver canvas, usar diretamente
                imageElement = this.currentImage.canvas;
            } else if (this.currentImageUrl) {
                // Criar elemento img a partir da URL
                imageElement = new Image();
                imageElement.crossOrigin = 'anonymous';
                imageElement.src = this.currentImageUrl;
                await new Promise((resolve, reject) => {
                    imageElement.onload = resolve;
                    imageElement.onerror = reject;
                    // Timeout de segurança
                    setTimeout(() => reject(new Error('Timeout ao carregar imagem')), 10000);
                });
            } else {
                // Criar canvas a partir dos pixels
                const canvas = document.createElement('canvas');
                canvas.width = this.currentImage.width;
                canvas.height = this.currentImage.height;
                const ctx = canvas.getContext('2d');
                const imageData = ctx.createImageData(canvas.width, canvas.height);
                
                if (this.imagePixels && this.imagePixels.pixels) {
                    imageData.data.set(this.imagePixels.pixels);
                    ctx.putImageData(imageData, 0, 0);
                    imageElement = canvas;
                } else {
                    throw new Error('Não foi possível converter a imagem para o formato necessário');
                }
            }
            
            // Executar segmentação
            const segmentation = await this.bodyPixModel.segmentPerson(imageElement, {
                flipHorizontal: false,
                internalResolution: 'medium', // 'low', 'medium', 'high', 'full'
                segmentationThreshold: 0.7
            });
            
            // Converter máscara de segmentação para formato usado pelo código
            const width = segmentation.width;
            const height = segmentation.height;
            const mask = new Uint8Array(width * height);
            
            // Converter dados de segmentação (boolean array) para máscara
            for (let i = 0; i < segmentation.data.length; i++) {
                mask[i] = segmentation.data[i] ? 255 : 0;
            }
            
            // Redimensionar máscara se necessário (se a imagem foi redimensionada)
            let finalMask = mask;
            let finalWidth = width;
            let finalHeight = height;
            
            if (width !== this.imagePixels.width || height !== this.imagePixels.height) {
                // Redimensionar máscara para corresponder à resolução original
                finalWidth = this.imagePixels.width;
                finalHeight = this.imagePixels.height;
                finalMask = this.resizeMask(mask, width, height, finalWidth, finalHeight);
            }
            
            // Encontrar limites do assunto
            this.findSubjectBounds(finalMask, finalWidth, finalHeight);
            
            // Encontrar contornos
            this.imageContours = this.findContours(finalMask, finalWidth, finalHeight);
            
            // Armazenar máscara
            this.imageMask = finalMask;
            
            // Criar imagem processada
            this.createProcessedImage(finalMask, finalWidth, finalHeight);
            
            console.log('Processamento com TensorFlow concluído. Assunto detectado:', this.subjectBounds);
            
        } catch (error) {
            console.error('Erro ao processar imagem com TensorFlow:', error);
            throw error;
        }
    },
    
    // Redimensionar máscara
    resizeMask(sourceMask, sourceWidth, sourceHeight, targetWidth, targetHeight) {
        const targetMask = new Uint8Array(targetWidth * targetHeight);
        const scaleX = sourceWidth / targetWidth;
        const scaleY = sourceHeight / targetHeight;
        
        for (let y = 0; y < targetHeight; y++) {
            for (let x = 0; x < targetWidth; x++) {
                const sourceX = Math.floor(x * scaleX);
                const sourceY = Math.floor(y * scaleY);
                const sourceIdx = sourceY * sourceWidth + sourceX;
                const targetIdx = y * targetWidth + x;
                
                if (sourceIdx < sourceMask.length) {
                    targetMask[targetIdx] = sourceMask[sourceIdx];
                }
            }
        }
        
        return targetMask;
    },
    
    // Encontrar limites do assunto na máscara
    findSubjectBounds(mask, width, height) {
        let minX = width, maxX = 0, minY = height, maxY = 0;
        let subjectPixels = 0;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (mask[idx] > 128) {
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                    subjectPixels++;
                }
            }
        }
        
        if (subjectPixels > 0) {
            this.subjectBounds = {
                minX: minX,
                maxX: maxX,
                minY: minY,
                maxY: maxY,
                centerX: (minX + maxX) / 2,
                centerY: (minY + maxY) / 2,
                width: maxX - minX,
                height: maxY - minY
            };
        } else {
            this.subjectBounds = null;
        }
    },
    
    // Processar imagem para remover fundo (método tradicional - fallback)
    processImageBackgroundRemovalTraditional() {
        if (!this.imagePixels || !this.imagePixels.pixels) return;
        
        console.log('Processando imagem para remover fundo (método tradicional)...');
        
        let width = this.imagePixels.width;
        let height = this.imagePixels.height;
        let pixels = this.imagePixels.pixels;
        
        // Reduzir resolução para processamento mais rápido (máximo 800px na maior dimensão)
        let maxDimension = 800;
        let scale = 1;
        if (width > maxDimension || height > maxDimension) {
            scale = maxDimension / Math.max(width, height);
            let newWidth = Math.floor(width * scale);
            let newHeight = Math.floor(height * scale);
            
            // Criar canvas para redimensionar
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = newWidth;
            tempCanvas.height = newHeight;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Desenhar imagem redimensionada
            const sourceCanvas = document.createElement('canvas');
            sourceCanvas.width = width;
            sourceCanvas.height = height;
            const sourceCtx = sourceCanvas.getContext('2d');
            const sourceImageData = sourceCtx.createImageData(width, height);
            sourceImageData.data.set(pixels);
            sourceCtx.putImageData(sourceImageData, 0, 0);
            
            tempCtx.drawImage(sourceCanvas, 0, 0, newWidth, newHeight);
            const resizedImageData = tempCtx.getImageData(0, 0, newWidth, newHeight);
            
            width = newWidth;
            height = newHeight;
            pixels = resizedImageData.data;
            
            console.log(`Imagem redimensionada para processamento: ${width}x${height}`);
        }
        
        // Criar máscara para detectar o assunto principal
        // Usar técnica de segmentação baseada em diferença de cor e bordas
        const mask = new Uint8Array(width * height);
        const edgeMap = new Uint8Array(width * height);
        
        // Passo 1: Detectar bordas usando Sobel
        this.detectEdges(width, height, pixels, edgeMap);
        
        // Passo 2: Calcular cor média das bordas (assumindo que o fundo está nas bordas)
        const borderColors = this.getBorderColors(width, height, pixels);
        const bgColor = this.calculateAverageColor(borderColors);
        
        // Passo 3: Criar máscara baseada em similaridade com cor de fundo e bordas
        let minX = width, maxX = 0, minY = height, maxY = 0;
        let subjectPixels = 0;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                const pixelIdx = idx * 4;
                
                const r = pixels[pixelIdx];
                const g = pixels[pixelIdx + 1];
                const b = pixels[pixelIdx + 2];
                const a = pixels[pixelIdx + 3];
                
                // Verificar se é fundo baseado em:
                // 1. Similaridade com cor de fundo
                // 2. Presença de bordas (assunto geralmente tem bordas)
                // 3. Transparência
                const colorDist = this.colorDistance(r, g, b, bgColor.r, bgColor.g, bgColor.b);
                const isEdge = edgeMap[idx] > 50;
                const isTransparent = a < 128;
                
                // Pixel é parte do assunto se:
                // - Está perto de uma borda E tem cor diferente do fundo
                // - OU tem transparência baixa E cor diferente do fundo
                const isSubject = (isEdge && colorDist > 30) || 
                                 (!isTransparent && colorDist > 40 && !this.isBorderPixel(x, y, width, height));
                
                if (isSubject) {
                    mask[idx] = 255;
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                    subjectPixels++;
                } else {
                    mask[idx] = 0;
                }
            }
        }
        
        // Aplicar morfologia para limpar a máscara
        this.morphologyClose(mask, width, height);
        
        // Encontrar contornos na máscara
        this.imageContours = this.findContours(mask, width, height);
        
        // Criar imagem processada sem fundo
        this.createProcessedImage(mask, width, height);
        
        // Armazenar limites do assunto (escalar de volta se necessário)
        if (subjectPixels > 0) {
            let originalWidth = this.imagePixels.width;
            let originalHeight = this.imagePixels.height;
            let scaleBack = originalWidth / width;
            
            this.subjectBounds = {
                minX: minX * scaleBack,
                maxX: maxX * scaleBack,
                minY: minY * scaleBack,
                maxY: maxY * scaleBack,
                centerX: (minX + maxX) / 2 * scaleBack,
                centerY: (minY + maxY) / 2 * scaleBack,
                width: (maxX - minX) * scaleBack,
                height: (maxY - minY) * scaleBack
            };
        } else {
            this.subjectBounds = null;
        }
        
        // Escalar contornos de volta para resolução original
        if (this.imageContours.length > 0) {
            let originalWidth = this.imagePixels.width;
            let scaleBack = originalWidth / width;
            for (let contour of this.imageContours) {
                for (let point of contour) {
                    point.x *= scaleBack;
                    point.y *= scaleBack;
                }
            }
        }
        
        this.imageMask = mask;
        console.log('Processamento concluído. Assunto detectado:', this.subjectBounds);
        
        // Criar imagem processada de forma assíncrona
        setTimeout(() => {
            this.createProcessedImage(mask, width, height);
        }, 50);
    },
    
    // Detectar bordas usando operador Sobel
    detectEdges(width, height, pixels, edgeMap) {
        const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
        const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0, gy = 0;
                
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 4;
                        const gray = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
                        
                        gx += gray * sobelX[ky + 1][kx + 1];
                        gy += gray * sobelY[ky + 1][kx + 1];
                    }
                }
                
                const magnitude = Math.sqrt(gx * gx + gy * gy);
                edgeMap[y * width + x] = Math.min(255, magnitude);
            }
        }
    },
    
    // Obter cores das bordas da imagem (assumindo que o fundo está nas bordas)
    getBorderColors(width, height, pixels) {
        const borderColors = [];
        const borderWidth = Math.min(10, Math.floor(width * 0.05));
        const borderHeight = Math.min(10, Math.floor(height * 0.05));
        
        // Amostrar bordas superior, inferior, esquerda e direita
        for (let y = 0; y < borderHeight; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                borderColors.push({
                    r: pixels[idx],
                    g: pixels[idx + 1],
                    b: pixels[idx + 2]
                });
            }
        }
        
        for (let y = height - borderHeight; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                borderColors.push({
                    r: pixels[idx],
                    g: pixels[idx + 1],
                    b: pixels[idx + 2]
                });
            }
        }
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < borderWidth; x++) {
                const idx = (y * width + x) * 4;
                borderColors.push({
                    r: pixels[idx],
                    g: pixels[idx + 1],
                    b: pixels[idx + 2]
                });
            }
        }
        
        for (let y = 0; y < height; y++) {
            for (let x = width - borderWidth; x < width; x++) {
                const idx = (y * width + x) * 4;
                borderColors.push({
                    r: pixels[idx],
                    g: pixels[idx + 1],
                    b: pixels[idx + 2]
                });
            }
        }
        
        return borderColors;
    },
    
    // Calcular cor média
    calculateAverageColor(colors) {
        let r = 0, g = 0, b = 0;
        for (let color of colors) {
            r += color.r;
            g += color.g;
            b += color.b;
        }
        return {
            r: Math.floor(r / colors.length),
            g: Math.floor(g / colors.length),
            b: Math.floor(b / colors.length)
        };
    },
    
    // Calcular distância entre duas cores
    colorDistance(r1, g1, b1, r2, g2, b2) {
        return Math.sqrt(
            Math.pow(r1 - r2, 2) +
            Math.pow(g1 - g2, 2) +
            Math.pow(b1 - b2, 2)
        );
    },
    
    // Verificar se pixel está na borda da imagem
    isBorderPixel(x, y, width, height) {
        const margin = Math.min(20, Math.floor(width * 0.05));
        return x < margin || x >= width - margin || 
               y < margin || y >= height - margin;
    },
    
    // Aplicar fechamento morfológico para limpar a máscara
    morphologyClose(mask, width, height) {
        const kernelSize = 3;
        const temp = new Uint8Array(mask.length);
        
        // Dilatação
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                let maxVal = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const nIdx = (y + ky) * width + (x + kx);
                        maxVal = Math.max(maxVal, mask[nIdx]);
                    }
                }
                temp[idx] = maxVal;
            }
        }
        
        // Erosão
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                let minVal = 255;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const nIdx = (y + ky) * width + (x + kx);
                        minVal = Math.min(minVal, temp[nIdx]);
                    }
                }
                mask[idx] = minVal;
            }
        }
    },
    
    // Encontrar contornos na máscara
    findContours(mask, width, height) {
        const contours = [];
        const visited = new Uint8Array(width * height);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                if (mask[idx] > 128 && visited[idx] === 0) {
                    // Encontrar contorno usando rastreamento de borda
                    const contour = this.traceContour(x, y, mask, visited, width, height);
                    if (contour.length > 10) { // Filtrar contornos muito pequenos
                        contours.push(contour);
                    }
                }
            }
        }
        
        return contours;
    },
    
    // Rastrear contorno
    traceContour(startX, startY, mask, visited, width, height) {
        const contour = [];
        const stack = [{x: startX, y: startY}];
        
        while (stack.length > 0) {
            const {x, y} = stack.pop();
            const idx = y * width + x;
            
            if (x < 0 || x >= width || y < 0 || y >= height || 
                visited[idx] === 1 || mask[idx] < 128) {
                continue;
            }
            
            visited[idx] = 1;
            contour.push({x, y});
            
            // Adicionar vizinhos
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = x + dx;
                    const ny = y + dy;
                    const nIdx = ny * width + nx;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
                        visited[nIdx] === 0 && mask[nIdx] > 128) {
                        stack.push({x: nx, y: ny});
                    }
                }
            }
        }
        
        return contour;
    },
    
    // Criar imagem processada sem fundo
    createProcessedImage(mask, width, height) {
        if (!this.imagePixels) return;
        
        try {
            // Criar canvas temporário para processar
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            const imageData = ctx.createImageData(width, height);
            
            const pixels = this.imagePixels.pixels;
            
            for (let i = 0; i < mask.length; i++) {
                const pixelIdx = i * 4;
                const alpha = mask[i];
                
                if (alpha > 0 && pixelIdx + 3 < pixels.length) {
                    imageData.data[pixelIdx] = pixels[pixelIdx];
                    imageData.data[pixelIdx + 1] = pixels[pixelIdx + 1];
                    imageData.data[pixelIdx + 2] = pixels[pixelIdx + 2];
                    imageData.data[pixelIdx + 3] = alpha;
                } else {
                    imageData.data[pixelIdx] = 0;
                    imageData.data[pixelIdx + 1] = 0;
                    imageData.data[pixelIdx + 2] = 0;
                    imageData.data[pixelIdx + 3] = 0;
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
            
            // Converter canvas para p5.Image de forma assíncrona
            if (typeof loadImage === 'function') {
                loadImage(canvas.toDataURL(), (img) => {
                    this.processedImage = img;
                    console.log('Imagem processada criada:', img.width, 'x', img.height);
                }, () => {
                    console.error('Erro ao carregar imagem processada');
                });
            } else {
                // Fallback: criar imagem HTML diretamente
                const img = new Image();
                img.onload = () => {
                    // Converter para p5.Image se possível
                    if (typeof createImage === 'function') {
                        this.processedImage = createImage(img.width, img.height);
                        this.processedImage.drawingContext.drawImage(img, 0, 0);
                    }
                };
                img.src = canvas.toDataURL();
            }
        } catch (e) {
            console.error('Erro ao criar imagem processada:', e);
        }
    },
    
    // Converter RGB para HSB
    rgbToHsb(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        let max = Math.max(r, g, b);
        let min = Math.min(r, g, b);
        let delta = max - min;
        
        let h = 0;
        if (delta !== 0) {
            if (max === r) {
                h = ((g - b) / delta) % 6;
            } else if (max === g) {
                h = (b - r) / delta + 2;
            } else {
                h = (r - g) / delta + 4;
            }
        }
        h = Math.round(h * 60);
        if (h < 0) h += 360;
        
        let s = max === 0 ? 0 : delta / max;
        let brightness = max;
        
        return {
            h: h,
            s: Math.round(s * 255),
            b: Math.round(brightness * 255)
        };
    },
    
    // Helper para map (caso não esteja disponível)
    _map(value, start1, stop1, start2, stop2) {
        if (typeof map === 'function') {
            return map(value, start1, stop1, start2, stop2);
        }
        return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
    },
    
    // Obter cor da imagem em uma posição
    getImageColor(x, y) {
        if (!this.imagePixels || !this.imagePixels.pixels) {
            return { r: 255, g: 255, b: 255, h: 0, s: 0, b: 255 };
        }
        
        let imgX = Math.floor(this._map(x, 0, width, 0, this.imagePixels.width));
        let imgY = Math.floor(this._map(y, 0, height, 0, this.imagePixels.height));
        
        imgX = Math.max(0, Math.min(this.imagePixels.width - 1, imgX));
        imgY = Math.max(0, Math.min(this.imagePixels.height - 1, imgY));
        
        let index = (imgY * this.imagePixels.width + imgX) * 4;
        let r = this.imagePixels.pixels[index];
        let g = this.imagePixels.pixels[index + 1];
        let b = this.imagePixels.pixels[index + 2];
        
        let hsb = this.rgbToHsb(r, g, b);
        return { r, g, b, h: hsb.h, s: hsb.s, b: hsb.b };
    },
    
    // Obter cores principais da imagem
    getMainColors(count = 5) {
        if (this.imageColors.length === 0) return [];
        
        // Retornar cores distribuídas uniformemente
        let step = Math.floor(this.imageColors.length / count);
        let colors = [];
        for (let i = 0; i < count; i++) {
            let idx = i * step;
            if (idx < this.imageColors.length) {
                colors.push(this.imageColors[idx]);
            }
        }
        return colors;
    },
    
    // Obter contornos da imagem processada
    getContours() {
        return this.imageContours || [];
    },
    
    // Obter limites do assunto principal
    getSubjectBounds() {
        return this.subjectBounds;
    },
    
    // Obter imagem processada (sem fundo)
    getProcessedImage() {
        return this.processedImage || this.currentImage;
    },
    
    // Obter máscara da imagem
    getImageMask() {
        return this.imageMask;
    },
    
    // Limpar mídia atual
    clear() {
        if (this.currentImage) {
            this.currentImage.remove();
            this.currentImage = null;
        }
        this.currentImageUrl = null;
        if (this.currentVideo) {
            this.currentVideo.remove();
            this.currentVideo = null;
        }
        if (this.processedImage) {
            this.processedImage.remove();
            this.processedImage = null;
        }
        this.imagePixels = null;
        this.imageColors = [];
        this.imageContours = [];
        this.imageMask = null;
        this.subjectBounds = null;
    },
    
    // Verificar se há imagem carregada
    hasImage() {
        return this.currentImage !== null;
    },
    
    // Verificar se há vídeo carregado
    hasVideo() {
        return this.currentVideo !== null;
    }
};

