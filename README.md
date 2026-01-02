# Neon VJ Studio

Sistema híbrido de visualização de áudio usando p5.js e Three.js. Este projeto oferece 13 cenas diferentes (10 em 2D e 3 em 3D) que reagem ao áudio do microfone em tempo real.

## 🎨 Características

- **10 Cenas 2D (p5.js)**: Espectro, Partículas, Túnel, Glitch, Onda, Mandala, Matrix, Pixels, Estrelas, Flow
- **3 Cenas 3D (Three.js)**: City, Vortex, Planet
- **Análise de áudio em tempo real** usando FFT
- **Controles interativos** para ajustar sensibilidade, velocidade, cor e rastro
- **Visualizador de níveis** de áudio (bass, mid, treble)
- **Efeito strobe/flash** ativável

## 📁 Estrutura do Projeto

```
visualizer/
├── index.html          # Arquivo HTML principal
├── css/
│   └── style.css      # Estilos CSS
├── js/
│   ├── main.js        # Arquivo principal - inicialização e loop
│   ├── audio.js       # Gerenciamento de áudio e análise FFT
│   ├── classes.js     # Classes auxiliares (Particle, Star, MatrixDrop)
│   ├── scenes-p5.js    # Cenas 2D usando p5.js
│   ├── scenes-three.js # Cenas 3D usando Three.js
│   └── controls.js    # Controles de UI e interação
└── README.md          # Este arquivo
```

## 🚀 Como Usar

1. Abra o arquivo `index.html` em um navegador moderno
2. Clique em "INICIAR SISTEMA"
3. Permita o acesso ao microfone quando solicitado
4. Use os controles no painel lateral para:
   - Trocar entre cenas (botões ou teclas 0-9, Q, W, E)
   - Ajustar sensibilidade do áudio
   - Modificar velocidade, cor e rastro
   - Ativar efeito strobe (barra de espaço)

## ⌨️ Atalhos de Teclado

- **0-9**: Trocar para cenas 2D (1-10)
- **Q**: Cena 3D - City
- **W**: Cena 3D - Vortex
- **E**: Cena 3D - Planet
- **Espaço**: Ativar/desativar strobe
- **H**: Mostrar/ocultar painel de controles

## 🛠️ Tecnologias Utilizadas

- **p5.js**: Biblioteca para criação gráfica e interativa
- **p5.sound**: Extensão do p5.js para análise de áudio
- **Three.js**: Biblioteca para renderização 3D
- **Tailwind CSS**: Framework CSS utilitário

## 📝 Descrição dos Módulos

### `main.js`
Arquivo principal que inicializa o p5.js, gerencia o loop de renderização e coordena todas as outras partes do sistema.

### `audio.js`
Gerencia a captura de áudio do microfone, análise FFT e processamento dos dados de frequência (bass, mid, treble).

### `classes.js`
Define as classes auxiliares:
- `Particle`: Partículas para efeitos visuais
- `Star`: Estrelas para efeito starfield
- `MatrixDrop`: Gotas de caracteres para efeito Matrix

### `scenes-p5.js`
Contém todas as funções de renderização das 10 cenas 2D usando p5.js.

### `scenes-three.js`
Gerencia a inicialização e renderização das 3 cenas 3D usando Three.js.

### `controls.js`
Gerencia a interface do usuário, mudança de cenas e atualização dos controles.

## 🎯 Melhorias Futuras

- Adicionar mais cenas
- Suporte para arquivos de áudio
- Exportação de vídeo
- Mais opções de personalização
- Modo fullscreen

## 📄 Licença

Este projeto é de código aberto e está disponível para uso livre.

## 👤 Autor
Thaís de Lima e LLMs por aí...
Projeto desenvolvido para visualização de áudio em tempo real.

