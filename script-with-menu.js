// ==UserScript==
// @name         Paper.io Hack - ESP, Visão Ampliada, Speed e Imortalidade
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  ESP para identificar bots vs players, campo de visão ampliada, velocidade aumentada, imortalidade, avatar personalizado e menu UI
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
        speedMultiplier: 1.5,       // Multiplicador de velocidade (1.0 = normal)
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
    let customAvatarUrl = null;     // URL da imagem personalizada
    let customAvatarImage = null;   // Imagem carregada
    let originalUnitSpeed = null;
    let originalMinScale = null;
    let originalMaxScale = null;
    let originalObserverScale = null;
    let originalGetRenderContext = null;
    let originalGetMovement = null;
    let originalKill = null;
    let originalRenderAvatars = null; // Função original de renderização de avatares
    let controlBtn = null;
    let hacksActive = false;        // Estado dos hacks
    let espLoopInterval = null;
    let playerListInterval = null;
    let cameraUpdateInterval = null;
    let immortalityInterval = null;
    let avatarRenderInterval = null;
    let hackMenu = null;            // Menu UI
    let menuOpen = false;           // Estado do menu

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

        // Carrega avatar personalizado se URL existir
        if (customAvatarUrl) {
            loadCustomAvatar(customAvatarUrl);
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

    // Carrega avatar personalizado via URL - CORRIGIDO PARA FUNCIONAR COM QUALQUER URL
    function loadCustomAvatar(url) {
        if (!url || url.trim() === '') {
            console.log('[PAPER.IO HACK] URL vazia, avatar personalizado removido');
            customAvatarUrl = null;
            customAvatarImage = null;
            if (avatarRenderInterval) {
                clearInterval(avatarRenderInterval);
                avatarRenderInterval = null;
            }
            return;
        }

        customAvatarUrl = url.trim();
        const img = new Image();

        // NÃO usa crossOrigin para evitar problemas com CORS
        // img.crossOrigin = "Anonymous";

        img.onload = () => {
            customAvatarImage = img;
            console.log('[PAPER.IO HACK] Avatar personalizado carregado com sucesso!');

            // Inicia a renderização do avatar
            if (!avatarRenderInterval) {
                startAvatarRendering();
            }

            // Mostra notificação
            showNotification('✅ Avatar personalizado aplicado!', '#00ff00');
        };

        img.onerror = (e) => {
            console.error('[PAPER.IO HACK] Erro ao carregar imagem do avatar:', e);
            customAvatarImage = null;
            customAvatarUrl = null;
            showNotification('❌ Erro ao carregar avatar! Tente outra URL.', '#ff0000');
            if (avatarRenderInterval) {
                clearInterval(avatarRenderInterval);
                avatarRenderInterval = null;
            }
        };

        img.src = customAvatarUrl;
    }

    // Inicia a renderização do avatar personalizado
    function startAvatarRendering() {
        if (avatarRenderInterval) {
            clearInterval(avatarRenderInterval);
        }

        avatarRenderInterval = setInterval(() => {
            if (customAvatarImage && gameInstance && gameInstance.player && !gameInstance.player.death && espCtx) {
                const renderCtx = gameInstance.getRenderContext();
                if (renderCtx) {
                    drawCustomAvatar(renderCtx.ctx, gameInstance.player, renderCtx.scale, renderCtx.scaler);
                }
            }
        }, CONFIG.updateInterval);
    }

    // Desenha o avatar personalizado na posição do jogador
    function drawCustomAvatar(ctx, player, scale, scaler) {
        if (!customAvatarImage || !player.position) return;

        const { x, y } = player.position;
        const devicePixelRatio = window.devicePixelRatio || 1;
        const avatarSize = 40 * scale / devicePixelRatio; // Tamanho proporcional

        // Salva estado do contexto
        ctx.save();

        // Posiciona no centro do jogador
        ctx.translate(
            x * scale + espCanvas.width / 2,
            y * scale + espCanvas.height / 2
        );

        // Escala para o tamanho desejado
        ctx.scale(avatarSize / customAvatarImage.width, avatarSize / customAvatarImage.height);

        // Desenha a imagem centralizada
        ctx.drawImage(
            customAvatarImage,
            -customAvatarImage.width / 2,
            -customAvatarImage.height / 2
        );

        // Restaura estado
        ctx.restore();
    }

    // Mostra notificação na tela
    function showNotification(message, color = '#00ffff') {
        // Remove notificações antigas
        document.querySelectorAll('.hack-notification').forEach(el => el.remove());

        const notification = document.createElement('div');
        notification.className = 'hack-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.85);
            color: ${color};
            padding: 12px 24px;
            border-radius: 25px;
            font-family: 'Arial', sans-serif;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            box-shadow: 0 4px 20px ${color}66;
            z-index: 99999;
            animation: slideDown 3s ease-out forwards;
            border: 2px solid ${color};
            pointer-events: none;
        `;

        notification.textContent = message;
        document.body.appendChild(notification);

        // Remove após animação
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);

        // Adiciona animação CSS se não existir
        if (!document.getElementById('hack-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'hack-notification-styles';
            style.textContent = `
                @keyframes slideDown {
                    0% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                    10% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                    90% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                }
            `;
            document.head.appendChild(style);
        }
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

                // Avatar personalizado
                if (customAvatarImage) {
                    espCtx.fillText(`🎨 Avatar Custom`, padding, infoY);
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
            if (originalRenderAvatars) {
                const proto = Object.getPrototypeOf(gameInstance);
                const key = Object.getOwnPropertyNames(proto).find(k => proto[k] === gameInstance.renderAvatars);
                if (key) {
                    proto[key] = originalRenderAvatars;
                }
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
        if (avatarRenderInterval) {
            clearInterval(avatarRenderInterval);
            avatarRenderInterval = null;
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

        // Remove notificações
        document.querySelectorAll('.hack-notification').forEach(el => el.remove());

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

    // Mata todos os jogadores exceto o próprio
    function killAllPlayers() {
        if (!gameInstance || !gameInstance.units) {
            console.log('[PAPER.IO HACK] Kill All: Jogo não carregado');
            return;
        }

        let killedCount = 0;
        let botCount = 0;
        let playerCount = 0;

        // Itera sobre todos os jogadores
        gameInstance.units.forEach(unit => {
            // Pula se for o próprio jogador
            if (unit === gameInstance.player) return;

            // Pula se já estiver morto
            if (unit.death) return;

            // Mata o jogador/bot
            try {
                // Determina se é bot ou player
                const isBot = unit.constructor.name === '_0x29a0a0' || unit.type !== undefined;

                // Chama a função kill original
                if (originalKill) {
                    originalKill.call(gameInstance, unit, gameInstance.player, 'eliminated');
                } else {
                    // Fallback: força a morte
                    unit.death = true;
                    unit.dead = true;
                }

                killedCount++;
                if (isBot) {
                    botCount++;
                } else {
                    playerCount++;
                }

                console.log(`[PAPER.IO HACK] Kill All: ${isBot ? 'Bot' : 'Player'} "${unit.name || 'Anônimo'}" eliminado`);
            } catch (error) {
                console.error('[PAPER.IO HACK] Erro ao matar unidade:', error);
            }
        });

        console.log(`[PAPER.IO HACK] Kill All: ${killedCount} jogadores eliminados (${playerCount} players, ${botCount} bots)`);

        // Mostra notificação visual
        showKillNotification(killedCount, playerCount, botCount);
    }

    // Mostra notificação visual ao matar todos
    function showKillNotification(total, players, bots) {
        // Remove notificações antigas
        document.querySelectorAll('.kill-notification').forEach(el => el.remove());

        // Cria div de notificação
        const notification = document.createElement('div');
        notification.className = 'kill-notification';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
            color: white;
            padding: 20px 40px;
            border-radius: 15px;
            font-family: 'Arial', sans-serif;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            box-shadow: 0 10px 40px rgba(255, 0, 0, 0.6);
            z-index: 99999;
            animation: notificationAnim 3s ease-out forwards;
            border: 3px solid white;
            pointer-events: none;
        `;

        notification.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 10px;">💀</div>
            <div style="font-size: 28px; margin-bottom: 10px;">KILL ALL ATIVADO!</div>
            <div style="font-size: 20px; margin-top: 10px;">
                ${total} inimigos eliminados<br>
                <span style="font-size: 16px; color: #ffcc00;">(${players} players, ${bots} bots)</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Remove após animação
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);

        // Adiciona animação CSS se não existir
        if (!document.getElementById('kill-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'kill-notification-styles';
            style.textContent = `
                @keyframes notificationAnim {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.8);
                    }
                    10% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.1);
                    }
                    90% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(1.2);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Cria o menu UI bonito e customizável
    function createHackMenu() {
        if (hackMenu) return;

        hackMenu = document.createElement('div');
        hackMenu.id = 'hack-menu';
        hackMenu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            width: 600px;
            max-width: 95%;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: #ffffff;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            z-index: 999999;
            padding: 30px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            overflow-y: auto;
            max-height: 90vh;
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            pointer-events: none;
        `;

        hackMenu.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid #667eea;">
                <h1 style="margin: 0; font-size: 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);">
                    🎮 PAPER.IO HACK
                </h1>
                <button id="close-menu-btn" style="background: #ff4444; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 24px; cursor: pointer; box-shadow: 0 4px 15px rgba(255, 68, 68, 0.4); transition: all 0.3s ease;">
                    ×
                </button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 25px;">
                <!-- Botão Toggle Hacks -->
                <div class="menu-card" style="background: linear-gradient(135deg, #2d2d44 0%, #252538 100%); border-radius: 15px; padding: 20px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);">
                    <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #667eea; display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 24px;">⚡</span> Toggle Hacks
                    </h3>
                    <button id="toggle-hacks-btn" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                        🎮 Hacks OFF
                    </button>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #888; text-align: center;">Atalho: F1</p>
                </div>

                <!-- Botão Kill All -->
                <div class="menu-card" style="background: linear-gradient(135deg, #2d2d44 0%, #252538 100%); border-radius: 15px; padding: 20px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);">
                    <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #ff4444; display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 24px;">💀</span> Kill All Players
                    </h3>
                    <button id="kill-all-btn" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%); color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(255, 68, 68, 0.4); transition: all 0.3s ease;">
                        Eliminar Todos
                    </button>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #888; text-align: center;">Atalho: F2</p>
                </div>
            </div>

            <div style="background: rgba(102, 126, 234, 0.1); border-radius: 15px; padding: 25px; margin-bottom: 25px;">
                <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #667eea; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 28px;">🎨</span> Avatar Personalizado
                </h2>
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <input type="text" id="avatar-url-input" placeholder="https://i.imgur.com/YXZiM0t.jpeg" style="flex: 1; padding: 12px 15px; background: rgba(255, 255, 255, 0.1); border: 2px solid #667eea; border-radius: 10px; color: white; font-size: 14px; outline: none; transition: all 0.3s ease;" value="${customAvatarUrl || ''}">
                    <button id="apply-avatar-btn" style="padding: 12px 25px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                        Aplicar
                    </button>
                </div>
                <p style="margin: 0; font-size: 12px; color: #888;">
                    Atalho: F3 | Formatos suportados: PNG, JPG, GIF
                </p>
            </div>

            <div style="background: rgba(255, 255, 255, 0.05); border-radius: 15px; padding: 25px; margin-bottom: 25px;">
                <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #667eea;">
                    ⚙️ Configurações
                </h2>

                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 15px; color: #fff;">Velocidade</span>
                        <span id="speed-value" style="font-size: 15px; color: #667eea; font-weight: bold;">x${CONFIG.speedMultiplier}</span>
                    </div>
                    <input type="range" id="speed-slider" min="1.0" max="5.0" step="0.1" value="${CONFIG.speedMultiplier}" style="width: 100%; height: 8px; background: #333; border-radius: 4px; outline: none; -webkit-appearance: none;">
                    <style>
                        #speed-slider::-webkit-slider-thumb {
                            -webkit-appearance: none;
                            width: 24px;
                            height: 24px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            cursor: pointer;
                            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.6);
                        }
                    </style>
                </div>

                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 15px; color: #fff;">Campo de Visão</span>
                        <span id="vision-value" style="font-size: 15px; color: #667eea; font-weight: bold;">x${CONFIG.visionMultiplier}</span>
                    </div>
                    <input type="range" id="vision-slider" min="1.0" max="8.0" step="0.5" value="${CONFIG.visionMultiplier}" style="width: 100%; height: 8px; background: #333; border-radius: 4px; outline: none; -webkit-appearance: none;">
                    <style>
                        #vision-slider::-webkit-slider-thumb {
                            -webkit-appearance: none;
                            width: 24px;
                            height: 24px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            cursor: pointer;
                            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.6);
                        }
                    </style>
                </div>

                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                    <div>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="esp-toggle" ${CONFIG.espEnabled ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;">
                            <span style="font-size: 14px; color: #fff;">ESP</span>
                        </label>
                    </div>
                    <div>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="immortality-toggle" ${CONFIG.immortality ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;">
                            <span style="font-size: 14px; color: #fff;">Imortalidade</span>
                        </label>
                    </div>
                    <div>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="speed-toggle" ${CONFIG.speedHack ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;">
                            <span style="font-size: 14px; color: #fff;">Speed Hack</span>
                        </label>
                    </div>
                    <div>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="vision-toggle" ${CONFIG.enhancedVision ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;">
                            <span style="font-size: 14px; color: #fff;">Visão Ampliada</span>
                        </label>
                    </div>
                </div>
            </div>

            <div style="text-align: center; padding-top: 20px; border-top: 2px solid rgba(102, 126, 234, 0.3);">
                <button id="save-config-btn" style="padding: 12px 40px; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4); transition: all 0.3s ease;">
                    💾 Salvar Configurações
                </button>
            </div>
        `;

        document.body.appendChild(hackMenu);

        // Adiciona eventos aos botões
        document.getElementById('close-menu-btn').onclick = closeHackMenu;
        document.getElementById('toggle-hacks-btn').onclick = toggleHacksFromMenu;
        document.getElementById('kill-all-btn').onclick = killAllPlayers;
        document.getElementById('apply-avatar-btn').onclick = applyAvatarFromMenu;

        // Eventos dos sliders
        document.getElementById('speed-slider').oninput = updateSpeedValue;
        document.getElementById('vision-slider').oninput = updateVisionValue;

        // Evento de salvar configurações
        document.getElementById('save-config-btn').onclick = saveConfigurations;

        console.log('[PAPER.IO HACK] Menu UI criado');
    }

    // Abre o menu
    function openHackMenu() {
        if (!hackMenu) {
            createHackMenu();
        }

        if (menuOpen) return;

        menuOpen = true;
        hackMenu.style.opacity = '1';
        hackMenu.style.transform = 'translate(-50%, -50%) scale(1)';
        hackMenu.style.pointerEvents = 'all';

        // Adiciona evento de tecla ESC para fechar
        document.addEventListener('keydown', handleMenuKeyPress);

        console.log('[PAPER.IO HACK] Menu aberto');
    }

    // Fecha o menu
    function closeHackMenu() {
        if (!menuOpen) return;

        menuOpen = false;
        hackMenu.style.opacity = '0';
        hackMenu.style.transform = 'translate(-50%, -50%) scale(0.9)';
        hackMenu.style.pointerEvents = 'none';

        // Remove evento de tecla ESC
        document.removeEventListener('keydown', handleMenuKeyPress);

        setTimeout(() => {
            if (hackMenu && hackMenu.parentNode) {
                hackMenu.parentNode.removeChild(hackMenu);
                hackMenu = null;
            }
        }, 300);

        console.log('[PAPER.IO HACK] Menu fechado');
    }

    // Manipula teclas no menu
    function handleMenuKeyPress(e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            closeHackMenu();
        }
    }

    // Toggle hacks do menu
    function toggleHacksFromMenu() {
        toggleHacks();
        const btn = document.getElementById('toggle-hacks-btn');
        if (btn) {
            btn.textContent = hacksActive ? '🎮 Hacks ON' : '🎮 Hacks OFF';
            btn.style.background = hacksActive ?
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
                '#666';
        }
    }

    // Aplica avatar do menu
    function applyAvatarFromMenu() {
        const input = document.getElementById('avatar-url-input');
        if (input && input.value) {
            loadCustomAvatar(input.value);
        } else {
            loadCustomAvatar('');
            showNotification('⚠️ URL vazia!', '#ffcc00');
        }
    }

    // Atualiza valor do speed slider
    function updateSpeedValue() {
        const slider = document.getElementById('speed-slider');
        const value = document.getElementById('speed-value');
        if (slider && value) {
            const speed = parseFloat(slider.value);
            value.textContent = `x${speed}`;
            CONFIG.speedMultiplier = speed;

            // Atualiza speed hack se estiver ativo
            if (hacksActive && CONFIG.speedHack) {
                gameInstance.config.unitSpeed = originalUnitSpeed * speed;
            }
        }
    }

    // Atualiza valor do vision slider
    function updateVisionValue() {
        const slider = document.getElementById('vision-slider');
        const value = document.getElementById('vision-value');
        if (slider && value) {
            const vision = parseFloat(slider.value);
            value.textContent = `x${vision}`;
            CONFIG.visionMultiplier = vision;

            // Atualiza visão se estiver ativa
            if (hacksActive && CONFIG.enhancedVision) {
                const visionFactor = vision;
                gameInstance.config.minScale = Math.min(0.5, originalMinScale / visionFactor);
                gameInstance.config.maxScale = Math.max(16.0, originalMaxScale * visionFactor);
                gameInstance.config.observerScale = gameInstance.config.maxScale;
            }
        }
    }

    // Salva configurações
    function saveConfigurations() {
        const espToggle = document.getElementById('esp-toggle');
        const immortalityToggle = document.getElementById('immortality-toggle');
        const speedToggle = document.getElementById('speed-toggle');
        const visionToggle = document.getElementById('vision-toggle');

        if (espToggle) CONFIG.espEnabled = espToggle.checked;
        if (immortalityToggle) CONFIG.immortality = immortalityToggle.checked;
        if (speedToggle) CONFIG.speedHack = speedToggle.checked;
        if (visionToggle) CONFIG.enhancedVision = visionToggle.checked;

        // Reaplica hacks se estiverem ativos
        if (hacksActive) {
            resetHacks();
            initHacks();
        }

        showNotification('✅ Configurações salvas!', '#00ff00');
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

    // Adiciona atalho de teclado (F2 para matar todos)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F2' || e.keyCode === 113) {
            if (hacksActive && gameInstance) {
                console.log('[PAPER.IO HACK] F2 pressionado - Iniciando Kill All...');
                killAllPlayers();
            } else {
                console.log('[PAPER.IO HACK] F2 pressionado - Hacks não ativados ou jogo não carregado');
            }
            e.preventDefault();
        }
    });

    // Adiciona atalho de teclado (F3 para avatar personalizado)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F3' || e.keyCode === 114) {
            if (hacksActive) {
                const url = prompt('[PAPER.IO HACK] Insira a URL da imagem para o avatar:\n\nFormatos suportados: PNG, JPG, GIF\n\nExemplo: https://i.imgur.com/YXZiM0t.jpeg\n\nDeixe em branco para remover o avatar personalizado');
                if (url !== null) {
                    loadCustomAvatar(url);
                }
            } else {
                console.log('[PAPER.IO HACK] F3 pressionado - Hacks não ativados');
                const url = prompt('[PAPER.IO HACK] URL do avatar (será aplicado ao ativar os hacks):\n\nhttps://i.imgur.com/YXZiM0t.jpeg');
                if (url && url.trim() !== '') {
                    customAvatarUrl = url.trim();
                    showNotification('✅ URL salva! Ative os hacks (F1) para aplicar.', '#00ff00');
                }
            }
            e.preventDefault();
        }
    });

    // Adiciona atalho de teclado (F4 para abrir menu)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F4' || e.keyCode === 115) {
            if (menuOpen) {
                closeHackMenu();
            } else {
                openHackMenu();
            }
            e.preventDefault();
        }
    });

})();
