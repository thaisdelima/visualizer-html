// Gerenciamento de áudio e análise FFT

const AudioManager = {
    mic: null,
    fft: null,
    isAudioStarted: false,
    
    audioData: {
        bass: 0,
        mid: 0,
        treble: 0,
        level: 0,
        waveform: [],
        spectrum: []
    },
    
    startAudio() {
        // Verificar se p5.js está carregado
        if (typeof p5 === 'undefined') {
            alert('p5.js não está carregado. Verifique se os scripts foram carregados corretamente.');
            return;
        }
        
        // Verificar se p5.sound está carregado
        if (typeof p5.AudioIn === 'undefined') {
            alert('p5.sound não está carregado. Verifique se o script p5.sound.min.js foi carregado.');
            return;
        }
        
        // Mostrar mensagem de carregamento
        const button = document.querySelector('#start-overlay button');
        let originalText = '';
        
        if (button) {
            originalText = button.textContent;
            button.textContent = 'Solicitando acesso ao microfone...';
            button.disabled = true;
        }
        
        // userStartAudio() precisa ser chamado diretamente na interação do usuário
        // Isso inicializa o contexto de áudio do p5.js
        userStartAudio();
        
        // Aguardar um pouco e então inicializar o microfone
        // O p5.js vai solicitar permissão automaticamente quando chamarmos mic.start()
        setTimeout(() => {
            this._initializeAudio(button, originalText);
        }, 100);
    },
    
    _initializeAudio(button, originalText) {
        try {
            if (button) {
                button.textContent = 'Iniciando sistema...';
            }
            
            console.log('Criando AudioIn...');
            // Criar o microfone - o p5.js vai solicitar permissão automaticamente quando chamarmos start()
            this.mic = new p5.AudioIn();
            
            console.log('Iniciando microfone (solicitando permissão)...');
            // O start() vai solicitar permissão automaticamente
            this.mic.start();
            
            // Aguardar um pouco para o microfone estar pronto e então criar o FFT
            setTimeout(() => {
                try {
                    console.log('Criando FFT...');
                    if (typeof p5.FFT === 'undefined') {
                        throw new Error('p5.FFT não está disponível. Verifique se p5.sound está carregado.');
                    }
                    this.fft = new p5.FFT(0.8, 1024);
                    this.fft.setInput(this.mic);
                    
                    console.log('Áudio inicializado com sucesso!');
                    this.isAudioStarted = true;
                    
                    // Esconder overlay de início se existir
                    let startOverlay = document.getElementById('start-overlay');
                    if (startOverlay) {
                        startOverlay.classList.add('opacity-0', 'pointer-events-none');
                    }
                    
                    // Mostrar botão de controles se existir (não é mais necessário, mas mantido para compatibilidade)
                    let controlsBtn = document.getElementById('open-controls-btn');
                    if (controlsBtn) {
                        controlsBtn.style.display = 'block';
                    }
                } catch (error) {
                    console.error('Erro ao criar FFT:', error);
                    this._handleError(error, button, originalText);
                }
            }, 500);
            
        } catch (error) {
            console.error('Erro ao inicializar áudio:', error);
            this._handleError(error, button, originalText);
        }
    },
    
    _handleError(error, button, originalText) {
        console.error('Erro detalhado:', error);
        console.error('Tipo do erro:', error.name);
        console.error('Mensagem do erro:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
        
        // Restaurar botão se existir
        if (button) {
            button.textContent = originalText;
            button.disabled = false;
        }
        
        let errorMsg = 'Erro ao iniciar o sistema de áudio.';
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMsg = 'Acesso ao microfone negado. Por favor, permita o acesso nas configurações do navegador e tente novamente.';
        } else if (error.name === 'NotFoundError') {
            errorMsg = 'Nenhum microfone encontrado. Verifique se há um microfone conectado.';
        } else if (error.name === 'NotReadableError') {
            errorMsg = 'O microfone está sendo usado por outro aplicativo. Feche outros aplicativos e tente novamente.';
        } else if (error.name === 'InvalidStateError') {
            errorMsg = 'Erro no contexto de áudio. Tente recarregar a página. Se o problema persistir, use um navegador mais recente.';
        } else if (error.message) {
            errorMsg = 'Erro: ' + error.message;
        }
        
        alert(errorMsg + '\n\nDetalhes no console (F12)');
    },
    
    analyzeAudio(params) {
        if (!this.isAudioStarted) return;
        
        this.fft.smooth(parseFloat(params.smooth));
        this.audioData.spectrum = this.fft.analyze();
        this.audioData.waveform = this.fft.waveform();
        
        let rawBass = this.fft.getEnergy("bass");
        let rawMid = this.fft.getEnergy("mid");
        let rawTreble = this.fft.getEnergy("treble");
        
        this.audioData.bass = min(255, rawBass * params.sens);
        this.audioData.mid = min(255, rawMid * params.sens);
        this.audioData.treble = min(255, rawTreble * params.sens);
        this.audioData.level = this.mic.getLevel() * params.sens * 2;
    },
    
    getAudioStarted() {
        return this.isAudioStarted;
    }
};
