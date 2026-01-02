// Controles de UI e interação

const Controls = {
    changeScene(n, currentScene) {
        currentScene = n;
        
        // Atualizar UI na janela popup se estiver aberta
        if (this.controlsWindow && !this.controlsWindow.closed) {
            try {
                // Cenas 2D (1-10)
                for (let i = 1; i <= 10; i++) {
                    let btn = this.controlsWindow.document.getElementById(`btn-scene-${i}`);
                    if (btn) {
                        let activeClass = 'bg-cyan-900 border-cyan-500';
                        let hoverClass = 'hover:bg-cyan-900 hover:border-cyan-500';
                        btn.className = `p-2 border rounded transition text-center ${i === n ? activeClass + ' text-white' : 'bg-gray-800 border-gray-700 text-gray-300 ' + hoverClass}`;
                    }
                }
                // Cenas 3D (11-13)
                for (let i = 11; i <= 13; i++) {
                    let btn = this.controlsWindow.document.getElementById(`btn-scene-${i}`);
                    if (btn) {
                        let activeClass = 'bg-orange-900 border-orange-500';
                        let hoverClass = 'hover:bg-orange-900 hover:border-orange-500';
                        btn.className = `p-2 border rounded transition text-center flex justify-between px-4 ${i === n ? activeClass + ' text-white' : 'bg-gray-800 border-gray-700 text-gray-300 ' + hoverClass}`;
                    }
                }
                // Cenas com Mídia (14-20)
                for (let i = 14; i <= 20; i++) {
                    let btn = this.controlsWindow.document.getElementById(`btn-scene-${i}`);
                    if (btn) {
                        let activeClass = 'bg-pink-900 border-pink-500';
                        let hoverClass = 'hover:bg-pink-900 hover:border-pink-500';
                        btn.className = `p-2 border rounded transition text-center ${i === n ? activeClass + ' text-white' : 'bg-gray-800 border-gray-700 text-gray-300 ' + hoverClass}`;
                    }
                }
            } catch (e) {
                // Ignorar erros de cross-origin se houver
            }
        }
        
        return currentScene;
    },
    
    updateParam(params, k, v) {
        params[k] = parseFloat(v);
        document.getElementById(`val-${k}`).innerText = v;
    },
    
    triggerStrobe(params, v) {
        params.strobe = v;
    },
    
    updateAudioUI(audioData) {
        // Atualizar na janela principal
        let barBass = document.getElementById('bar-bass');
        let barMid = document.getElementById('bar-mid');
        let barTreble = document.getElementById('bar-treble');
        
        if (barBass) barBass.style.height = map(audioData.bass, 0, 255, 0, 100) + '%';
        if (barMid) barMid.style.height = map(audioData.mid, 0, 255, 0, 100) + '%';
        if (barTreble) barTreble.style.height = map(audioData.treble, 0, 255, 0, 100) + '%';
        
        // Atualizar na janela popup se estiver aberta
        if (this.controlsWindow && !this.controlsWindow.closed) {
            try {
                let popupBarBass = this.controlsWindow.document.getElementById('bar-bass');
                let popupBarMid = this.controlsWindow.document.getElementById('bar-mid');
                let popupBarTreble = this.controlsWindow.document.getElementById('bar-treble');
                
                if (popupBarBass) popupBarBass.style.height = map(audioData.bass, 0, 255, 0, 100) + '%';
                if (popupBarMid) popupBarMid.style.height = map(audioData.mid, 0, 255, 0, 100) + '%';
                if (popupBarTreble) popupBarTreble.style.height = map(audioData.treble, 0, 255, 0, 100) + '%';
            } catch (e) {
                // Ignorar erros de cross-origin se houver
            }
        }
    },
    
    controlsWindow: null,
    
    toggleControls() {
        // Se a janela já existe e está aberta, fechar
        if (this.controlsWindow && !this.controlsWindow.closed) {
            this.controlsWindow.close();
            this.controlsWindow = null;
            return;
        }
        
        // Abrir nova janela de controles
        let width = 600;
        let height = 800;
        let left = (screen.width / 2) - (width / 2);
        let top = (screen.height / 2) - (height / 2);
        
        this.controlsWindow = window.open(
            'controls.html',
            'Controles',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no`
        );
        
        // Focar na nova janela
        if (this.controlsWindow) {
            this.controlsWindow.focus();
        }
    },
    
    changePalette(paletteName) {
        if (typeof params !== 'undefined') {
            params.palette = paletteName;
            // Atualizar seletor no HTML
            let select = document.getElementById('palette-select');
            if (select) {
                select.value = paletteName;
            }
        }
    }
};
