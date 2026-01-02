// Controles de UI e interação

const Controls = {
    changeScene(n, currentScene) {
        currentScene = n;
        
        // Atualizar UI
        for (let i = 1; i <= 13; i++) {
            let btn = document.getElementById(`btn-scene-${i}`);
            if (btn) {
                let isThree = i > 10;
                let activeClass = isThree ? 'bg-orange-900 border-orange-500' : 'bg-cyan-900 border-cyan-500';
                let hoverClass = isThree ? 'hover:bg-orange-900 hover:border-orange-500' : 'hover:bg-cyan-900 hover:border-cyan-500';
                
                btn.className = `p-2 border rounded transition text-center ${i > 10 ? 'flex justify-between px-4' : ''} ${i === n ? activeClass + ' text-white' : 'bg-gray-800 border-gray-700 text-gray-300 ' + hoverClass}`;
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
        document.getElementById('bar-bass').style.height = map(audioData.bass, 0, 255, 0, 100) + '%';
        document.getElementById('bar-mid').style.height = map(audioData.mid, 0, 255, 0, 100) + '%';
        document.getElementById('bar-treble').style.height = map(audioData.treble, 0, 255, 0, 100) + '%';
    },
    
    toggleControls() {
        let c = document.getElementById('controls');
        if (c.classList.contains('hidden')) {
            c.classList.remove('hidden');
        } else {
            c.classList.add('hidden');
        }
    }
};
