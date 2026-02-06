# 🎮 Paper.io Hack - Tampermonkey Script

[![Version](https://img.shields.io/badge/version-3.0-blue.svg)](https://github.com)
[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-Supported-green.svg)](https://www.tampermonkey.net/)
[![License](https://img.shields.io/badge/license-MIT-red.svg)](LICENSE)

Um script Tampermonkey poderoso e completo para Paper.io com ESP, visão ampliada, velocidade aumentada, imortalidade, avatar personalizado e interface UI moderna.

## 🌟 Funcionalidades

### 🔍 ESP (Extra Sensory Perception)
- Identifica automaticamente **Bots** (vermelho/laranja) vs **Players** (verde)
- Mostra nome, porcentagem de território e distância de cada jogador
- Diferencia tipos de bots por cores diferentes
- Caixa ao redor de cada jogador com informações em tempo real

### 👁️ Campo de Visão Ampliado
- Veja **4x mais área** do mapa (configurável até 8x)
- Zoom out automático para visão estratégica
- Atualização contínua em runtime

### ⚡ Velocidade Aumentada
- Aumente sua velocidade em **1.5x** (configurável até 5x)
- Apenas seu jogador é afetado
- Movimento suave e responsivo

### 🛡️ Imortalidade
- **Invencível** contra todos os jogadores e bots
- Bloqueia todas as tentativas de kill
- Proteção contínua durante toda a partida

### 🎨 Avatar Personalizado
- Substitua seu avatar por **qualquer imagem da internet**
- Suporte a PNG, JPG e GIF
- Renderização em tempo real
- Fácil aplicação via URL

### 💀 Kill All
- Elimine **todos os jogadores e bots** instantaneamente
- Pressione F2 para ativar
- Notificação visual épica

### 🎨 Menu UI Moderno (F4)
- Interface gráfica bonita e intuitiva
- Sliders para ajustar velocidade e visão
- Checkboxes para ativar/desativar funcionalidades
- Campo para URL do avatar personalizado
- Botão de salvar configurações

## 📋 Requisitos

- **Navegador**: Chrome, Firefox, Edge ou Safari
- **Extensão**: Tampermonkey (ou Violentmonkey/Greasemonkey)
- **Jogo**: Paper2.io (https://paper2.io)

## 🚀 Instalação Passo a Passo

### Passo 1: Instalar Tampermonkey

**Chrome/Edge:**
1. Acesse a Chrome Web Store: https://chrome.google.com/webstore/detail/tampermonkey/
2. Clique em "Adicionar à extensão"
3. Confirme a instalação

**Firefox:**
1. Acesse o Firefox Add-ons: https://addons.mozilla.org/firefox/addon/tampermonkey/
2. Clique em "Adicionar ao Firefox"
3. Confirme a instalação

**Safari:**
1. Abra Safari → Preferências → Extensões
2. Instale o Tampermonkey da App Store
3. Ative a extensão

### Passo 2: Instalar o Script

1. **Copie o script completo** do arquivo `paperio-hack.user.js`
2. **Abra o Tampermonkey** (ícone na barra de extensões)
3. Clique em **"Criar um novo script"** (ícone +)
4. **Apague todo o conteúdo** do editor
5. **Cole o script** completo
6. Clique em **Ctrl+S** (ou Cmd+S no Mac) para salvar
7. Feche o editor

### Passo 3: Verificar Instalação

1. Acesse https://paper2.io
2. Você deve ver um **botão roxo "🎮 Hacks OFF"** no canto superior direito
3. Se o botão aparecer, a instalação foi bem-sucedida! ✅

## 🎮 Como Usar

### Atalhos de Teclado

| Tecla | Função | Descrição |
|-------|--------|-----------|
| **F1** | Toggle Hacks | Liga/Desliga todos os hacks |
| **F2** | Kill All | Elimina todos os jogadores e bots |
| **F3** | Avatar Custom | Abre prompt para URL do avatar |
| **F4** | Menu UI | Abre menu de configurações |
| **ESC** | Fechar Menu | Fecha o menu UI |

### Botão de Controle

- **🎮 Hacks OFF** (cinza): Hacks desativados
- **🎮 Hacks ON** (roxo): Hacks ativados

Clique no botão para alternar entre os estados.

## 🎨 Menu UI (Pressione F4)

### Abertura do Menu

Pressione **F4** durante o jogo para abrir o menu. O menu possui:

### 1. Controles Principais

#### 🎮 Toggle Hacks
- **Botão**: Liga/Desliga todos os hacks
- **Atalho**: F1
- **Status**: Mostra se os hacks estão ON ou OFF

#### 💀 Kill All Players
- **Botão**: Elimina todos os inimigos instantaneamente
- **Atalho**: F2
- **Efeito**: Todos os jogadores e bots morrem, exceto você

### 2. Avatar Personalizado

#### Campo de URL

- **Input**: Cole a URL da sua imagem
- **Botão Aplicar**: Carrega e aplica o avatar
- **Formatos**: PNG, JPG, GIF
- **Atalho**: F3










### 3. Configurações Ajustáveis

#### ⚡ Velocidade
- **Slider**: 1.0x a 5.0x
- **Padrão**: 1.5x
- **Efeito**: Aumenta sua velocidade de movimento

#### 👁️ Campo de Visão
- **Slider**: 1.0x a 8.0x
- **Padrão**: 4.0x
- **Efeito**: Amplia a área visível do mapa

#### Checkboxes
- ✅ **ESP**: Mostra informações dos jogadores
- ✅ **Imortalidade**: Torna você invencível
- ✅ **Speed Hack**: Aumenta sua velocidade
- ✅ **Visão Ampliada**: Expande o campo de visão

### 4. Salvar Configurações

- **Botão 💾 Salvar Configurações**: Aplica todas as mudanças
- **Efeito**: Reaplica os hacks com as novas configurações

## ⚙️ Configurações Avançadas

### Editar Valores Padrão

Abra o script no Tampermonkey e localize a seção `CONFIG`:

```javascript
const CONFIG = {
    espEnabled: true,           // Ativar ESP
    enhancedVision: true,       // Visão ampliada
    speedHack: true,            // Velocidade aumentada
    immortality: true,          // Imortalidade
    speedMultiplier: 1.5,       // Multiplicador de velocidade
    visionMultiplier: 4.0,      // Multiplicador de visão
    showNames: true,            // Mostrar nomes
    showDistance: true,         // Mostrar distância
    showType: true,             // Mostrar tipo (Bot/Player)
    showHealth: true,           // Mostrar % de território
    boxThickness: 2,            // Espessura da caixa ESP
    updateInterval: 16,         // Intervalo de atualização em ms
    showPlayerList: true        // Mostrar lista de jogadores reais
};


Valores Recomendados:

    speedMultiplier: 1.5 - 3.0 (acima de 3.0 pode ser muito rápido)
    visionMultiplier: 3.0 - 6.0 (acima de 6.0 pode causar lag)

📸 Visualização
ESP em Ação
┌─────────────────────────────────────┐
│  [JOGADOR] 🟢 Nome: Player1         │
│  Território: 15.5% | Dist: 120u      │
│                                     │
│  [BOT] 🔴 Nome: Bot_Agressor        │
│  Território: 8.2% | Dist: 85u       │
│                                     │
│  [BOT] 🟠 Nome: Bot_Ganancioso      │
│  Território: 12.1% | Dist: 200u     │
└─────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  🎮 PAPER.IO HACK                    [×]    │
├─────────────────────────────────────────────┤
│                                             │
│  ⚡ Toggle Hacks    💀 Kill All Players     │
│  [🎮 Hacks OFF]     [Eliminar Todos]        │
│                                             │
│  🎨 Avatar Personalizado                    │
│  [URL________________] [Aplicar]            │
│                                             │
│  ⚙️ Configurações                           │
│  Velocidade: [━━━━━━━━━━] x1.5             │
│  Visão:      [━━━━━━━━━━] x4.0             │
│  ☑ ESP  ☑ Imortalidade                      │
│  ☑ Speed ☑ Visão                            │
│                                             │
│            [💾 Salvar Configurações]        │
└─────────────────────────────────────────────┘

⚠️ Avisos e Responsabilidade
⚠️ IMPORTANTE
Este script é para fins educacionais e de teste apenas. O uso em servidores oficiais pode:

    ✗ Violar os Termos de Serviço do Paper.io
    ✗ Resultar em banimento da sua conta
    ✗ Ser considerado cheating/trapaça

Recomendações
✅ Use apenas em:

    Servidores privados
    Partidas offline
    Testes locais
    Ambientes controlados

❌ Não use em:

    Servidores oficiais públicos
    Partidas competitivas
    Quando outros jogadores estão presentes (sem consentimento)

Responsabilidade
O autor não se responsabiliza por:

    Banimentos de conta
    Consequências legais
    Danos ao jogo ou sistema
    Uso indevido do script

🐛 Troubleshooting
Problema: Botão não aparece
Solução:

    Verifique se o Tampermonkey está ativado
    Recarregue a página (Ctrl+R)
    Verifique se o script está habilitado no Tampermonkey
    Confirme que está em https://paper2.io

Problema: Avatar não carrega
Solução:

    Verifique se a URL está correta
    Use URLs de sites com permissão CORS (Imgur, Discord CDN)
    Tente outra imagem
    Verifique se o hack está ativado (F1)

Problema: Visão não amplia
Solução:

    Pressione F1 para ativar os hacks
    Verifique se "Visão Ampliada" está marcado no menu (F4)
    Ajuste o slider de visão no menu
    Recarregue a página e reative os hacks

Problema: Imortalidade não funciona
Solução:

    Verifique se "Imortalidade" está ativado nas configurações
    Pressione F1 para garantir que os hacks estão ativos
    Tente morrer de propósito para testar (deve ser bloqueado)
    Reinicie o script (desative e ative novamente com F1)

Problema: Menu não abre
Solução:

    Pressione F4 (não confunda com Fn+F4 em alguns teclados)
    Verifique se não há outros scripts conflitando
    Recarregue a página
    Reinstale o script

📝 Changelog
Versão 3.0 (Atual)

    ✨ Menu UI moderno e customizável (F4)
    🎨 Design responsivo com gradientes
    ⚙️ Sliders para velocidade e visão
    💾 Botão de salvar configurações
    🔄 Atualização automática de valores

Versão 2.4

    🖼️ Avatar personalizado funcional
    🔓 Remoção de restrições CORS
    📏 Tamanho ajustado do avatar
    ✅ Melhor tratamento de erros

Versão 2.3

    🎨 Renderização correta do avatar
    🔍 Múltiplos métodos de interceptação
    📊 Informações do jogador no ESP

Versão 2.0

    📷 Câmera em runtime
    🛡️ Imortalidade completa
    💀 Kill All com F2

Versão 1.7

    👁️ Visão ampliada corrigida
    🔄 Atualização contínua da câmera
    ✅ Estado do botão fixado

🤝 Contribuição
Contribuições são bem-vindas! Sinta-se à vontade para:

    🐛 Reportar bugs
    💡 Sugerir novas funcionalidades
    🔧 Enviar pull requests
    📖 Melhorar a documentação

📄 Licença
Este projeto é licenciado sob a MIT License - veja o arquivo LICENSE
 para detalhes.
🙏 Agradecimentos

    Tampermonkey team pelo ótimo trabalho
    Comunidade de desenvolvedores de game hacks
    Todos os testers e contribuidores

Divirta-se com responsabilidade! 🎮✨
Made with ❤️ for the Paper.io community


