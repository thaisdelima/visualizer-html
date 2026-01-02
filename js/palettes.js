// Sistema de Paletas de Cores

const ColorPalettes = {
    // Paletas pré-definidas
    palettes: {
        neon: {
            name: 'Neon',
            colors: [
                { h: 180, s: 255, b: 255 }, // Ciano
                { h: 300, s: 255, b: 255 }, // Magenta
                { h: 240, s: 255, b: 255 }, // Azul
                { h: 330, s: 255, b: 255 }  // Rosa
            ]
        },
        fire: {
            name: 'Fogo',
            colors: [
                { h: 0, s: 255, b: 255 },   // Vermelho
                { h: 15, s: 255, b: 255 },  // Laranja
                { h: 30, s: 255, b: 255 },  // Amarelo
                { h: 45, s: 200, b: 255 }   // Amarelo claro
            ]
        },
        ocean: {
            name: 'Oceano',
            colors: [
                { h: 200, s: 255, b: 255 }, // Azul oceano
                { h: 180, s: 255, b: 200 }, // Ciano
                { h: 150, s: 200, b: 255 }, // Verde água
                { h: 220, s: 255, b: 200 }  // Azul claro
            ]
        },
        forest: {
            name: 'Floresta',
            colors: [
                { h: 120, s: 255, b: 200 }, // Verde
                { h: 90, s: 200, b: 180 },  // Verde claro
                { h: 60, s: 150, b: 150 },  // Verde amarelado
                { h: 30, s: 200, b: 180 }   // Marrom esverdeado
            ]
        },
        sunset: {
            name: 'Pôr do Sol',
            colors: [
                { h: 0, s: 255, b: 255 },   // Vermelho
                { h: 15, s: 255, b: 255 },  // Laranja
                { h: 330, s: 255, b: 255 }, // Rosa
                { h: 300, s: 200, b: 255 }   // Magenta
            ]
        },
        rainbow: {
            name: 'Arco-íris',
            colors: [
                { h: 0, s: 255, b: 255 },   // Vermelho
                { h: 60, s: 255, b: 255 },  // Amarelo
                { h: 120, s: 255, b: 255 }, // Verde
                { h: 180, s: 255, b: 255 }, // Ciano
                { h: 240, s: 255, b: 255 }, // Azul
                { h: 300, s: 255, b: 255 }  // Magenta
            ]
        },
        monochrome: {
            name: 'Monocromático',
            colors: [
                { h: 0, s: 0, b: 255 },     // Branco
                { h: 0, s: 0, b: 200 },     // Cinza claro
                { h: 0, s: 0, b: 100 },     // Cinza escuro
                { h: 0, s: 0, b: 50 }       // Preto
            ]
        },
        custom: {
            name: 'Personalizado',
            colors: null // Usa o hue slider
        }
    },
    
    // Obter cor da paleta atual baseada no índice e offset
    getColor(paletteName, index = 0, offset = 0, audioData = null) {
        let palette = this.palettes[paletteName] || this.palettes.neon;
        
        // Se for custom, usa o hue do params
        if (paletteName === 'custom') {
            let baseHue = offset % 360;
            let saturation = audioData ? map(audioData.mid, 0, 255, 150, 255) : 200;
            let brightness = audioData ? map(audioData.treble, 0, 255, 200, 255) : 255;
            return { h: baseHue, s: saturation, b: brightness };
        }
        
        // Seleciona cor da paleta baseada no índice
        if (!palette.colors || palette.colors.length === 0) {
            return { h: 0, s: 200, b: 255 };
        }
        
        let colorIndex = index % palette.colors.length;
        let color = palette.colors[colorIndex];
        
        // Verificar se a cor existe e tem propriedades válidas
        if (!color || typeof color.h === 'undefined') {
            return { h: 0, s: 200, b: 255 };
        }
        
        // Aplica offset de hue se necessário
        if (offset !== 0) {
            color = { ...color, h: (color.h + offset) % 360 };
        }
        
        // Modifica baseado no áudio se fornecido
        if (audioData) {
            let saturation = map(audioData.mid, 0, 255, color.s * 0.6, color.s);
            let brightness = map(audioData.treble, 0, 255, color.b * 0.7, color.b);
            return { h: color.h, s: saturation, b: brightness };
        }
        
        return color;
    },
    
    // Obter múltiplas cores da paleta
    getColors(paletteName, count, offset = 0, audioData = null) {
        let colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(this.getColor(paletteName, i, offset, audioData));
        }
        return colors;
    },
    
    // Obter lista de nomes de paletas
    getPaletteNames() {
        return Object.keys(this.palettes);
    },
    
    // Obter nome legível da paleta
    getPaletteDisplayName(paletteName) {
        return this.palettes[paletteName]?.name || paletteName;
    }
};

