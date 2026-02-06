// ==UserScript==
// @name         Paper.io Hack - ESP, Visão Ampliada, Speed e Imortalidade
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  ESP para identificar bots vs players, campo de visão ampliada, velocidade aumentada e imortalidade
// @author       You
// @match        https://paper2.io/*
// @match        https://paperio.site/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Configurações
    const CONFIG = {
        espEnabled: true,           // Ativar ESP
        enhancedVision: true,       // Visão ampliada
        speedHack: true,            // Velocidade aumentada
        immortality: true,          // Imortalidade
        speedMultiplier: 2,       // Multiplicador de velocidade (1.0 = normal)
        visionMultiplier: 4.0,      // Multiplicador de visão (maior = mais distante)
        showNames: true,            // Mostrar nomes
        showDistance: true,         // Mostrar distância
        showType: true,             // Mostrar tipo (Bot/Player)
        showHealth: true,           // Mostrar % de território
        boxThickness: 2,            // Espessura da caixa ESP
        updateInterval: 16,         // Intervalo de atualização em ms
        showPlayerList: true        // Mostrar lista de jogadores reais
    };

    let gameInstance = null;
    let espCanvas = null;
    let espCtx = null;
    let playerListDiv = null;
    let originalUnitSpeed = null;
    let originalMinScale = null;
    let originalMaxScale = null;
    let originalObserverScale = null;
    let originalGetRenderContext = null;
    let originalGetMovement = null;
    let originalKill = null;
    let controlBtn = null;
    let hacksActive = false;        // Estado dos hacks
    let espLoopInterval = null;
    let playerListInterval = null;
    let cameraUpdateInterval = null;
    let immortalityInterval = null;

    // Aguarda o jogo carregar
    function waitForGame() {
        const checkInterval = setInterval(() => {
            // Procura pela instância do jogo
            if (window.paperio2api && window.paperio2api.game) {
                gameInstance = window.paperio2api.game;
                clearInterval(checkInterval);
                console.log('[PAPER.IO HACK] Jogo detectado, aguardando ativação...');
            }
        }, 500);
    }

    // Inicializa os hacks
    function initHacks() {
        if (!gameInstance) {
            console.error('[PAPER.IO HACK] Jogo não detectado');
            return;
        }

        console.log('[PAPER.IO HACK] Inicializando hacks...');

        // Salva valores originais
        if (gameInstance.config) {
            originalUnitSpeed = gameInstance.config.unitSpeed;
            originalMinScale = gameInstance.config.minScale;
            originalMaxScale = gameInstance.config.maxScale;
            originalObserverScale = gameInstance.config.observerScale;
        }

        // Aplica visão ampliada
        if (CONFIG.enhancedVision && gameInstance.config) {
            applyEnhancedVision();
            startCameraUpdate();
        }

        // Aplica speed hack
        if (CONFIG.speedHack) {
            applySpeedHack();
        }

        // Aplica imortalidade
        if (CONFIG.immortality) {
            applyImmortality();
        }

        // Cria e inicializa o ESP
        if (CONFIG.espEnabled) {
            createEspOverlay();
            startEspLoop();
        }

        // Cria lista de jogadores
        if (CONFIG.showPlayerList) {
            createPlayerList();
        }

        // Atualiza estado dos hacks
        hacksActive = true;
        updateButtonState();

        console.log('[PAPER.IO HACK] Hacks ativados com sucesso!');
    }

    // Aplica visão ampliada - CORRIGIDO PARA VER MAIS DISTANTE
    function applyEnhancedVision() {
        if (!gameInstance.config) return;

        // AUMENTA SIGNIFICATIVAMENTE O CAMPO DE VISÃO
        const visionFactor = CONFIG.visionMultiplier;

        // Aumenta os limites de escala para permitir zoom out
        gameInstance.config.minScale = Math.min(0.5, originalMinScale / visionFactor);
        gameInstance.config.maxScale = Math.max(16.0, originalMaxScale * visionFactor);
        gameInstance.config.observerScale = gameInstance.config.maxScale;

        // Salva a função original
        originalGetRenderContext = gameInstance.getRenderContext;

        // Modifica o cálculo de escala para manter visão ampliada
        gameInstance.getRenderContext = function() {
            const renderContext = originalGetRenderContext.call(this);

            if (renderContext && this.player) {
                // Força uma escala menor (visão mais distante)
                const targetScale = this.config.maxScale / visionFactor;

                // Ajusta a escala para manter visão ampliada
                this.scale = targetScale;

                // Ajusta o scaler para aumentar o campo de visão
                renderContext.scale = targetScale * renderContext.scaler / window.devicePixelRatio;
            }

            return renderContext;
        };

        console.log('[PAPER.IO HACK] Visão ampliada aplicada (x' + visionFactor + ')');
    }

    // Atualiza a câmera continuamente em runtime
    function startCameraUpdate() {
        cameraUpdateInterval = setInterval(() => {
            if (!gameInstance || !gameInstance.config || !CONFIG.enhancedVision) return;

            const visionFactor = CONFIG.visionMultiplier;
            const targetScale = gameInstance.config.maxScale / visionFactor;

            // Força a escala continuamente
            gameInstance.scale = targetScale;

            // Atualiza os limites se necessário
            if (gameInstance.config.minScale > 0.5) {
                gameInstance.config.minScale = Math.min(0.5, originalMinScale / visionFactor);
            }
            if (gameInstance.config.maxScale < 16.0) {
                gameInstance.config.maxScale = Math.max(16.0, originalMaxScale * visionFactor);
            }
            gameInstance.config.observerScale = gameInstance.config.maxScale;

        }, 50); // Atualiza a cada 50ms
    }

    // Aplica speed hack
    function applySpeedHack() {
        if (!gameInstance.config) return;

        // Aumenta a velocidade base
        gameInstance.config.unitSpeed *= CONFIG.speedMultiplier;

        // Salva a função original
        originalGetMovement = gameInstance.getMovement;

        // Modifica o cálculo de movimento para o jogador
        gameInstance.getMovement = function(delta, unit) {
            // Se for o jogador, aplica speed extra
            if (unit === this.player) {
                delta *= CONFIG.speedMultiplier;
            }
            return originalGetMovement.call(this, delta, unit);
        };

        console.log('[PAPER.IO HACK] Speed hack aplicado (x' + CONFIG.speedMultiplier + ')');
    }

    // Aplica imortalidade
    function applyImmortality() {
        // Salva a função original de kill
        originalKill = gameInstance.kill;

        // Intercepta a função de kill
        gameInstance.kill = function(unit, killer, reason) {
            // Se for o jogador, NÃO deixa morrer
            if (unit === this.player) {
                console.log('[PAPER.IO HACK] Imortalidade ativada! Tentativa de kill bloqueada.');
                return;
            }

            // Para outros jogadores, permite normalmente
            return originalKill.call(this, unit, killer, reason);
        };

        // Também intercepta a verificação de colisão do jogador
        const originalHandleUnitMovements = gameInstance.handleUnitMovements;
        gameInstance.handleUnitMovements = function(delta) {
            const originalPlayerDeath = this.player.death;
            const result = originalHandleUnitMovements.call(this, delta);
            // Restaura o estado de morte do jogador se ele morreu
            if (this.player) {
                this.player.death = originalPlayerDeath;
            }
            return result;
        };

        // Intercepta update do jogador para garantir imortalidade
        immortalityInterval = setInterval(() => {
            if (gameInstance.player) {
                gameInstance.player.death = false;
            }
        }, 100);

        console.log('[PAPER.IO HACK] Imortalidade ativada!');
    }

    // Cria o overlay para ESP
    function createEspOverlay() {
        const gameContainer = document.getElementById('game') || document.body;
        const viewCanvas = document.getElementById('view');

        if (!viewCanvas) {
            console.error('[PAPER.IO HACK] Canvas do jogo não encontrado');
            return;
        }

        // Cria canvas para ESP
        espCanvas = document.createElement('canvas');
        espCanvas.id = 'esp-canvas';
        espCanvas.style.position = 'absolute';
        espCanvas.style.top = '0';
        espCanvas.style.left = '0';
        espCanvas.style.pointerEvents = 'none';
        espCanvas.style.zIndex = '9999';

        // Define tamanho inicial
        espCanvas.width = viewCanvas.width;
        espCanvas.height = viewCanvas.height;

        gameContainer.appendChild(espCanvas);
        espCtx = espCanvas.getContext('2d');

        // Ajusta tamanho quando a janela muda
        window.addEventListener('resize', () => {
            if (viewCanvas) {
                espCanvas.width = viewCanvas.width;
                espCanvas.height = viewCanvas.height;
            }
        });

        console.log('[PAPER.IO HACK] ESP overlay criado');
    }

    // Loop principal do ESP
    function startEspLoop() {
        espLoopInterval = setInterval(() => {
            if (!espCtx || !gameInstance || !gameInstance.units) return;

            // Limpa o canvas
            espCtx.clearRect(0, 0, espCanvas.width, espCanvas.height);

            // Obtém contexto de renderização
            const renderCtx = gameInstance.getRenderContext();
            if (!renderCtx) return;

            const { scale, origin, devicePixelRatio } = renderCtx;

            // Desenha ESP para cada unidade
            gameInstance.units.forEach(unit => {
                if (!unit.position || !unit.base) return;

                // Pula se for o próprio jogador
                if (unit === gameInstance.player) return;

                // Calcula posição na tela
                const screenX = (unit.position.x - origin.x) * scale + espCanvas.width / 2;
                const screenY = (unit.position.y - origin.y) * scale + espCanvas.height / 2;

                // Calcula tamanho baseado na base do jogador
                const baseRadius = Math.sqrt(unit.base.square / Math.PI);
                const screenRadius = (baseRadius * scale) / devicePixelRatio;

                // Determina cor baseado no tipo
                let boxColor, textColor;
                let typeLabel = 'UNKNOWN';

                if (unit.constructor.name === '_0x4c9af3' || (unit.isPlayer && unit.isPlayer())) {
                    // É um jogador real
                    boxColor = '#00ff00'; // Verde
                    textColor = '#00ff00';
                    typeLabel = 'PLAYER';
                } else if (unit.constructor.name === '_0x29a0a0' || unit.type !== undefined) {
                    // É um bot
                    boxColor = '#ff0000'; // Vermelho
                    textColor = '#ff0000';
                    typeLabel = 'BOT';

                    // Cor diferente para cada tipo de bot
                    switch(unit.type) {
                        case 0:
                            boxColor = '#ff4444'; // Bot básico
                            break;
                        case 1:
                            boxColor = '#ff8800'; // Bot agressivo
                            break;
                        case 2:
                            boxColor = '#ffcc00'; // Bot ganancioso
                            break;
                        case 3:
                            boxColor = '#ff00ff'; // Bot especial
                            break;
                    }
                } else {
                    boxColor = '#888888'; // Cinza para desconhecido
                    textColor = '#888888';
                }

                // Desenha caixa ao redor
                espCtx.strokeStyle = boxColor;
                espCtx.lineWidth = CONFIG.boxThickness;
                espCtx.beginPath();
                espCtx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
                espCtx.stroke();

                // Desenha informações
                const fontSize = Math.max(10, 14 / devicePixelRatio);
                espCtx.font = `bold ${fontSize}px Arial`;
                espCtx.fillStyle = textColor;
                espCtx.textAlign = 'center';
                espCtx.textBaseline = 'bottom';

                let yOffset = screenY - screenRadius - 5;

                // Nome
                if (CONFIG.showNames && unit.name) {
                    espCtx.fillText(unit.name, screenX, yOffset);
                    yOffset -= fontSize + 2;
                }

                // Tipo
                if (CONFIG.showType) {
                    espCtx.fillText(typeLabel, screenX, yOffset);
                    yOffset -= fontSize + 2;
                }

                // Porcentagem de território
                if (CONFIG.showHealth && unit.percent !== undefined) {
                    const percentText = (unit.percent * 100).toFixed(1) + '%';
                    espCtx.fillText(percentText, screenX, yOffset);
                    yOffset -= fontSize + 2;
                }

                // Distância do jogador
                if (CONFIG.showDistance && gameInstance.player) {
                    const dist = unit.position.distance(gameInstance.player.position);
                    const distText = Math.round(dist) + 'u';
                    espCtx.fillText(distText, screenX, yOffset);
                }
            });

            // Desenha informações do próprio jogador no canto
            if (gameInstance.player) {
                espCtx.font = 'bold 16px Arial';
                espCtx.fillStyle = '#00ffff';
                espCtx.textAlign = 'left';
                espCtx.textBaseline = 'top';

                let infoY = 10;
                const padding = 5;

                // Velocidade
                if (CONFIG.speedHack) {
                    espCtx.fillText(`⚡ Speed: x${CONFIG.speedMultiplier}`, padding, infoY);
                    infoY += 20;
                }

                // Visão
                if (CONFIG.enhancedVision) {
                    espCtx.fillText(`👁️ Visão: x${CONFIG.visionMultiplier}`, padding, infoY);
                    infoY += 20;
                }

                // Imortalidade
                if (CONFIG.immortality) {
                    espCtx.fillText(`🛡️ Imortal`, padding, infoY);
                    infoY += 20;
                }

                // Território
                espCtx.fillText(`📊 Território: ${(gameInstance.player.percent * 100).toFixed(2)}%`, padding, infoY);
                infoY += 20;

                // Rank
                espCtx.fillText(`🏆 Rank: #${gameInstance.player.top || '?'}`, padding, infoY);
            }

        }, CONFIG.updateInterval);
    }

    // Cria a lista de jogadores reais
    function createPlayerList() {
        playerListDiv = document.createElement('div');
        playerListDiv.id = 'player-list';
        playerListDiv.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 10001;
            background: rgba(0, 0, 0, 0.85);
            color: #00ff00;
            padding: 12px 15px;
            border-radius: 10px;
            font-family: 'Arial', sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3);
            border: 2px solid #00ff00;
            max-height: 80vh;
            overflow-y: auto;
        `;

        // Adiciona ao DOM
        document.body.appendChild(playerListDiv);

        // Atualiza a lista periodicamente
        playerListInterval = setInterval(updatePlayerList, 500);
    }

    // Atualiza a lista de jogadores reais
    function updatePlayerList() {
        if (!playerListDiv || !gameInstance || !gameInstance.units) return;

        // Filtra apenas jogadores reais (não bots)
        const realPlayers = gameInstance.units.filter(unit => {
            if (unit === gameInstance.player) return false; // Pula o próprio jogador
            return unit.constructor.name === '_0x4c9af3' || (unit.isPlayer && unit.isPlayer());
        });

        // Ordena por território (maior primeiro)
        realPlayers.sort((a, b) => (b.percent || 0) - (a.percent || 0));

        // Constrói HTML
        let html = '<div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #00ff00;">';
        html += `<strong style="color: #00ff00; font-size: 16px;">👥 JOGADORES REAIS</strong><br>`;
        html += `<span style="color: #00ff00; font-size: 14px;">Total: ${realPlayers.length}</span>`;
        html += '</div>';

        if (realPlayers.length === 0) {
            html += '<div style="color: #888; padding: 8px 0;">Nenhum jogador real encontrado</div>';
        } else {
            realPlayers.forEach((player, index) => {
                const percent = ((player.percent || 0) * 100).toFixed(1);
                const name = player.name || 'Anônimo';
                const rank = player.top || '?';

                html += `<div style="padding: 6px 0; border-bottom: 1px solid rgba(0, 255, 0, 0.2);">`;
                html += `<span style="color: #00ff00; font-weight: bold;">${index + 1}. ${name}</span><br>`;
                html += `<span style="color: #00cc00; font-size: 12px; margin-left: 20px;">`;
                html += `Território: ${percent}% | Rank: #${rank}`;
                html += `</span>`;
                html += `</div>`;
            });
        }

        playerListDiv.innerHTML = html;
    }

    // Função para resetar os valores originais
    function resetHacks() {
        if (gameInstance && gameInstance.config) {
            // Restaura valores originais
            gameInstance.config.unitSpeed = originalUnitSpeed;
            gameInstance.config.minScale = originalMinScale;
            gameInstance.config.maxScale = originalMaxScale;
            gameInstance.config.observerScale = originalObserverScale;

            // Restaura funções originais
            if (originalGetRenderContext) {
                gameInstance.getRenderContext = originalGetRenderContext;
            }
            if (originalGetMovement) {
                gameInstance.getMovement = originalGetMovement;
            }
            if (originalKill) {
                gameInstance.kill = originalKill;
            }
        }

        // Limpa intervalos
        if (espLoopInterval) {
            clearInterval(espLoopInterval);
            espLoopInterval = null;
        }
        if (playerListInterval) {
            clearInterval(playerListInterval);
            playerListInterval = null;
        }
        if (cameraUpdateInterval) {
            clearInterval(cameraUpdateInterval);
            cameraUpdateInterval = null;
        }
        if (immortalityInterval) {
            clearInterval(immortalityInterval);
            immortalityInterval = null;
        }

        // Remove elementos
        if (espCanvas && espCanvas.parentNode) {
            espCanvas.parentNode.removeChild(espCanvas);
            espCanvas = null;
        }
        if (playerListDiv && playerListDiv.parentNode) {
            playerListDiv.parentNode.removeChild(playerListDiv);
            playerListDiv = null;
        }

        console.log('[PAPER.IO HACK] Hacks removidos');
    }

    // Atualiza o estado visual do botão
    function updateButtonState() {
        if (!controlBtn) return;

        if (hacksActive) {
            controlBtn.textContent = '🎮 Hacks ON';
            controlBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        } else {
            controlBtn.textContent = '🎮 Hacks OFF';
            controlBtn.style.background = '#666';
        }
    }

    // Adiciona botão de controle na UI
    function addControlButton() {
        // Cria botão
        controlBtn = document.createElement('button');
        controlBtn.id = 'hack-control-btn';
        controlBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            padding: 10px 15px;
            background: #666;
            color: white;
            border: none;
            border-radius: 25px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
        `;
        controlBtn.textContent = '🎮 Hacks OFF'; // Inicia como OFF
        controlBtn.onclick = toggleHacks;

        document.body.appendChild(controlBtn);

        console.log('[PAPER.IO HACK] Botão de controle criado');
    }

    // Alterna os hacks
    function toggleHacks() {
        if (hacksActive) {
            // Desativa
            hacksActive = false;
            resetHacks();
        } else {
            // Ativa
            hacksActive = true;
            initHacks();
        }

        updateButtonState();
    }

    // Inicia tudo
    console.log('[PAPER.IO HACK] Script carregado');
    addControlButton();
    waitForGame();

    // Adiciona atalho de teclado (F1 para toggle)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F1' || e.keyCode === 112) {
            toggleHacks();
            e.preventDefault();
        }
    });

})();
