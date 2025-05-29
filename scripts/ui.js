class UI {
  constructor() {
    this.selectedHero = null;
    this.currentAction = null;
    this.accessibleCells = [];
    this.attackableTargets = [];
    this.selectedPlayerCount = 0;
    this.selectedGameMode = null;
    this.activePlayerHighlight = null;
    this.gameLog = document.getElementById("game-log");
    this.logEntries = document.getElementById("log-entries");

    this.initializeElements();
    this.bindEvents();
    this.setupConsoleOverride();
  }

  setupConsoleOverride() {
    // Override console.log to only display game actions in the game log
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      // Call original console.log
      originalConsoleLog.apply(console, args);
      
      // Only add to game log if it's a movement or attack
      const message = args.join(' ');
      if (message.includes('🚶') || message.includes('⚔️') || message.includes('💀')) {
        this.addLogEntry(message);
      }
    };
  }

  isGameAction(message) {
    // Define action-related emojis and keywords
    const actionIndicators = [
      '⚔️', // Attack
      '🚶', // Move
      '✨', // Special
      '🛡️', // Defend
      '💨', // Dodge
      '🎲', // Dice roll
      '💀', // Death
      '🏆', // Victory
      '🔄', // Turn change
      '🎯', // Target
      '⚡', // Special attack
      '🌪️', // Area effect
      'attaque',
      'déplacement',
      'pouvoir',
      'défense',
      'esquive',
      'dé',
      'tour',
      'cible',
      'victoire',
      'défaite'
    ];

    return actionIndicators.some(indicator => 
      message.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  addLogEntry(message) {
    if (!this.logEntries) return;

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    
    // Add timestamp
    const now = new Date();
    const time = now.toLocaleTimeString();
    
    // Format the message with emojis and styling
    const formattedMessage = this.formatLogMessage(message);
    
    entry.innerHTML = `<span class="log-time">[${time}]</span> ${formattedMessage}`;
    
    // Add to the top of the log
    this.logEntries.insertBefore(entry, this.logEntries.firstChild);
    
    // Keep only the last 50 entries
    while (this.logEntries.children.length > 50) {
      this.logEntries.removeChild(this.logEntries.lastChild);
    }
  }

  formatLogMessage(message) {
    // Replace emoji codes with actual emojis
    const emojiMap = {
      '👥': '👥',
      '🎮': '🎮',
      '🦸': '🦸',
      '🎲': '🎲',
      '⚔️': '⚔️',
      '🚶': '🚶',
      '🎯': '🎯',
      '✨': '✨',
      '🛡️': '🛡️',
      '💨': '💨',
      '🖱️': '🖱️',
      '⚡': '⚡',
      '🌪️': '🌪️',
      '💀': '💀',
      '🏆': '🏆',
      '🔄': '🔄',
      '❌': '❌',
      '✅': '✅',
      'ℹ️': 'ℹ️',
      '🚫': '🚫'
    };

    let formattedMessage = message;
    Object.entries(emojiMap).forEach(([code, emoji]) => {
      formattedMessage = formattedMessage.replace(code, emoji);
    });

    return formattedMessage;
  }

  initializeElements() {
    // Sections principales
    this.playerCountSection = document.getElementById("player-count-popup");
    this.gameModeSection = document.getElementById("game-mode-popup");
    this.heroSelectionSection = document.getElementById("hero-selection-popup");
    this.diceOrderSection = document.getElementById("dice-order-popup");
    this.newRoundSection = document.getElementById("new-round-popup");
    this.messageArea = document.getElementById("message-popup");

    // Éléments de jeu
    this.arenaGrid = document.getElementById("arena-grid");
    this.gameBoard = document.getElementById("game-board");
    this.gameInfo = document.getElementById("game-info");
    this.currentPlayerSpan = document.getElementById("player-name");
    this.diceElement = document.getElementById("dice");
    this.diceResult = document.getElementById("dice-result");
    this.currentHpSpan = document.getElementById("current-hp");
    this.cooldownTimer = document.getElementById("cooldown-timer");

    // Boutons d'action
    this.actionButtons = {
      move: document.getElementById("move-btn"),
      attack: document.getElementById("attack-btn"),
      special: document.getElementById("special-btn"),
      defend: document.getElementById("defend-btn"),
      dodge: document.getElementById("dodge-btn"),
    };

    // Vérification que tous les éléments existent
    this.verifyElements();

    // Ajout du style pour le joueur actif
    this.addActivePlayerStyle();
  }

  addActivePlayerStyle() {
    // Add the style CSS for the active player if it doesn't exist already
    if (!document.getElementById("active-player-style")) {
      const style = document.createElement("style");
      style.id = "active-player-style";
      style.textContent = `
        .cell.active-player {
          animation: pulse-border 1.5s infinite;
          box-shadow: 0 0 0 2px #ffcc00, 0 0 10px 5px rgba(255, 204, 0, 0.5);
          z-index: 10;
          position: relative;
        }
        
        @keyframes pulse-border {
          0% { box-shadow: 0 0 0 2px #ffcc00, 0 0 10px 5px rgba(255, 204, 0, 0.5); }
          50% { box-shadow: 0 0 0 4px #ffcc00, 0 0 15px 7px rgba(255, 204, 0, 0.7); }
          100% { box-shadow: 0 0 0 2px #ffcc00, 0 0 10px 5px rgba(255, 204, 0, 0.5); }
        }
        
        .player-turn-indicator {
          position: fixed;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          z-index: 1000;
          transition: opacity 0.5s;
        }
        
        .player-turn-indicator.fade-out {
          opacity: 0;
        }

        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          10% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          90% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  verifyElements() {
    const requiredElements = [
      "playerCountSection",
      "gameModeSection",
      "heroSelectionSection",
      "diceOrderSection",
      "newRoundSection",
      "messageArea",
      "arenaGrid",
      "gameBoard",
      "gameInfo",
      "currentPlayerSpan",
      "diceElement",
      "diceResult",
      "currentHpSpan",
      "cooldownTimer",
    ];

    requiredElements.forEach((elementName) => {
      if (!this[elementName]) {
        console.warn(`⚠️ Élément UI manquant: ${elementName}`);
      }
    });

    Object.entries(this.actionButtons).forEach(([name, button]) => {
      if (!button) {
        console.warn(`⚠️ Bouton d'action manquant: ${name}`);
      }
    });
  }

  bindEvents() {
    // Sélection du nombre de joueurs
    document.querySelectorAll(".player-count-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.selectPlayerCount(btn));
    });

    // Sélection du mode de jeu
    document.querySelectorAll(".mode-card").forEach((card) => {
      card.addEventListener("click", () => this.selectGameMode(card));
    });

    // Confirmation du mode de jeu
    const confirmModeBtn = document.getElementById("confirm-mode");
    if (confirmModeBtn) {
      confirmModeBtn.addEventListener("click", () => this.confirmGameMode());
    }

    // Sélection des héros
    document.querySelectorAll(".hero-card").forEach((card) => {
      card.addEventListener("click", () => this.selectHero(card));
    });

    // Confirmation du héros
    const confirmHeroBtn = document.getElementById("confirm-hero");
    if (confirmHeroBtn) {
      confirmHeroBtn.addEventListener("click", () => this.confirmHero());
    }

    // Lancer de dés pour l'ordre
    const rollOrderBtn = document.getElementById("roll-for-order");
    if (rollOrderBtn) {
      rollOrderBtn.addEventListener("click", () => this.rollDiceForOrder());
    }

    // Démarrage de la partie
    const startGameBtn = document.getElementById("start-game-btn");
    if (startGameBtn) {
      startGameBtn.addEventListener("click", () => this.triggerGameStart());
    }

    // Nouveau tour
    const startNewRoundBtn = document.getElementById("start-new-round");
    if (startNewRoundBtn) {
      startNewRoundBtn.addEventListener("click", () => this.triggerNewRound());
    }

    // Messages
    const messageOkBtn = document.getElementById("message-ok");
    if (messageOkBtn) {
      messageOkBtn.addEventListener("click", () => this.hideMessage());
    }

    // Boutons d'action
    Object.entries(this.actionButtons).forEach(([action, button]) => {
      if (button) {
        button.addEventListener("click", () => this.selectAction(action));
      }
    });
  }

  selectPlayerCount(btn) {
    document
      .querySelectorAll(".player-count-btn")
      .forEach((b) => b.classList.remove("selected"));

    btn.classList.add("selected");
    this.selectedPlayerCount = Number.parseInt(btn.dataset.count);

    console.log(
      `👥 Nombre de joueurs sélectionné: ${this.selectedPlayerCount}`
    );

    setTimeout(() => {
      const event = new CustomEvent("playerCountSelected", {
        detail: { count: this.selectedPlayerCount },
      });
      document.dispatchEvent(event);
    }, 500);
  }

  showGameModeSelection() {
    this.hideSection(this.playerCountSection);
    this.showSection(this.gameModeSection);
  }

  selectGameMode(card) {
    if (card.classList.contains("disabled")) return;

    document
      .querySelectorAll(".mode-card")
      .forEach((c) => c.classList.remove("selected"));

    card.classList.add("selected");
    this.selectedGameMode = card.dataset.mode;

    const confirmBtn = document.getElementById("confirm-mode");
    if (confirmBtn) {
      confirmBtn.disabled = false;
    }

    console.log(`🎮 Mode de jeu sélectionné: ${this.selectedGameMode}`);
  }

  confirmGameMode() {
    if (!this.selectedGameMode) return;

    const event = new CustomEvent("gameModeSelected", {
      detail: { mode: this.selectedGameMode },
    });
    document.dispatchEvent(event);

    this.hideSection(this.gameModeSection);
  }

  showHeroSelection(playerNumber, heroAvailability) {
    this.hideSection(this.playerCountSection);
    this.hideSection(this.gameModeSection);
    this.hideSection(this.arenaSection);
    this.hideSection(this.heroSelectionSummarySection);

    this.heroSelectionSection.style.display = "flex";
    
    // Update the selecting player text
    const selectingPlayerSpan = document.getElementById("selecting-player");
    if (selectingPlayerSpan) {
      selectingPlayerSpan.textContent = `Joueur ${playerNumber}`;
    }

    // Update hero availability display
    Object.entries(heroAvailability).forEach(([hero, count]) => {
      const heroCard = this.heroSelectionSection.querySelector(
        `.hero-card[data-hero="${hero}"]`
      );
      if (heroCard) {
        const availabilityDiv = heroCard.querySelector(".hero-availability");
        if (availabilityDiv) {
          const countSpan = availabilityDiv.querySelector(".available-count");
          if (countSpan) {
            countSpan.textContent = count;
          }
          if (count <= 0) {
            heroCard.classList.add("unavailable");
          } else {
            heroCard.classList.remove("unavailable");
          }
        }
      }
    });

    this.showSection(this.heroSelectionSection);
  }

  selectHero(card) {
    if (card.classList.contains("unavailable")) return;

    document
      .querySelectorAll(".hero-card")
      .forEach((c) => c.classList.remove("selected"));

    card.classList.add("selected");
    this.selectedHero = card.dataset.hero;

    const confirmBtn = document.getElementById("confirm-hero");
    if (confirmBtn) {
      confirmBtn.disabled = false;
    }

    console.log(`🦸 Héros sélectionné: ${this.selectedHero}`);
  }

  confirmHero() {
    if (!this.selectedHero) return;

    const event = new CustomEvent("heroSelected", {
      detail: { hero: this.selectedHero },
    });
    document.dispatchEvent(event);

    // Deselect the hero after confirmation
    document.querySelectorAll(".hero-card").forEach((c) => c.classList.remove("selected"));
    this.selectedHero = null;

    // Disable the confirm button
    const confirmBtn = document.getElementById("confirm-hero");
    if (confirmBtn) {
      confirmBtn.disabled = true;
    }
  }

  showDiceOrderSection(playerName, isTieBreaker = false) {
    this.hideSection(this.heroSelectionSection);

    const rollingPlayerSpan = document.getElementById("rolling-player");
    if (rollingPlayerSpan) {
      rollingPlayerSpan.textContent = playerName;
    }

    const titleElement = this.diceOrderSection?.querySelector("h2");
    const descElement = this.diceOrderSection?.querySelector("p");

    if (isTieBreaker) {
      if (titleElement)
        titleElement.textContent = "Départage - Relance des dés";
      if (descElement)
        descElement.textContent = "Les joueurs ex-aequo relancent le dé !";
    } else {
      if (titleElement)
        titleElement.textContent = "Détermination de l'ordre de jeu";
      if (descElement)
        descElement.textContent =
          "Chaque joueur lance le dé. Le plus haut score commence !";

      // 🧹 VIDER LES RÉSULTATS PRÉCÉDENTS
      console.log("🧹 Effacement des résultats précédents");
      const resultsList = document.getElementById("results-list");
      if (resultsList) {
        resultsList.innerHTML = "";
      }
    }

    // Réinitialiser l'affichage du résultat sous le bouton
    const rollResult = document.getElementById("roll-result");
    if (rollResult) {
      rollResult.textContent = "";
    }

    const rollBtn = document.getElementById("roll-for-order");
    if (rollBtn) {
      rollBtn.disabled = false;
    }

    const startGameBtn = document.getElementById("start-game-btn");
    if (startGameBtn) {
      startGameBtn.classList.add("hidden");
    }

    console.log(`🎲 Affichage section dés pour: ${playerName}`);
    this.showSection(this.diceOrderSection);
  }

  showNextPlayerRoll(playerName) {
    const rollingPlayerSpan = document.getElementById("rolling-player");
    if (rollingPlayerSpan) {
      rollingPlayerSpan.textContent = playerName;
    }

    const rollResult = document.getElementById("roll-result");
    if (rollResult) {
      rollResult.textContent = "";
    }

    const rollBtn = document.getElementById("roll-for-order");
    if (rollBtn) {
      // Désactiver le bouton si c'est un joueur PC
      if (playerName.includes("PC")) {
        rollBtn.disabled = true;
        rollBtn.textContent = "L'IA lance le dé...";
        console.log(`🤖 Bouton de dé désactivé pour ${playerName}`);
      } else {
        rollBtn.disabled = false;
        rollBtn.textContent = "Lancer le dé";
        console.log(`👤 Bouton de dé activé pour ${playerName}`);
      }
    }

    console.log(`➡️ Passage au joueur suivant: ${playerName}`);

    // 🤖 LANCEMENT AUTOMATIQUE POUR LES JOUEURS PC
    if (playerName.includes("PC")) {
      console.log(`🤖 ${playerName} va lancer automatiquement...`);
      setTimeout(() => {
        this.rollDiceForOrder();
      }, 1500);
    }
  }

  rollDiceForOrder() {
    const diceImg = document.getElementById("order-dice");
    const rollBtn = document.getElementById("roll-for-order");
    const resultDiv = document.getElementById("roll-result");

    if (!diceImg || !rollBtn || !resultDiv) {
      console.error("❌ Éléments de dés manquants");
      return;
    }

    rollBtn.disabled = true;
    diceImg.classList.add("rolling");

    setTimeout(() => {
      const result = Math.floor(Math.random() * 6) + 1;

      // ✅ AFFICHER LE RÉSULTAT SOUS LE BOUTON POUR TOUS LES JOUEURS
      resultDiv.textContent = `Résultat: ${result}`;
      resultDiv.style.fontSize = "1.5em";
      resultDiv.style.fontWeight = "bold";
      resultDiv.style.color = "#2196F3";

      diceImg.classList.remove("rolling");

      const currentPlayer =
        document.getElementById("rolling-player")?.textContent || "Joueur";
      console.log(`🎲 ${currentPlayer} a obtenu: ${result}`);

      const event = new CustomEvent("diceRolledForOrder", {
        detail: { result },
      });
      document.dispatchEvent(event);
    }, 1000);
  }

  updateDiceResults(results) {
    const resultsList = document.getElementById("results-list");
    if (!resultsList) return;

    resultsList.innerHTML = "";

    results.forEach((result) => {
      const div = document.createElement("div");
      div.className = "result-item";
      div.textContent = `${result.playerName}: ${result.result}`;
      resultsList.appendChild(div);
    });

    console.log(`📊 Résultats mis à jour: ${results.length} joueurs`);
  }

  showFinalOrder(results, callback) {
    const resultsList = document.getElementById("results-list");
    if (!resultsList) return;

    resultsList.innerHTML = "";

    results.forEach((result, index) => {
      const div = document.createElement("div");
      div.className = "result-item";
      if (index === 0) {
        div.classList.add("winner");
        div.textContent = `🏆 ${result.playerName}: ${result.result} (commence !)`;
      } else {
        div.textContent = `${index + 1}. ${result.playerName}: ${
          result.result
        }`;
      }
      resultsList.appendChild(div);
    });

    const startGameBtn = document.getElementById("start-game-btn");
    if (startGameBtn) {
      startGameBtn.classList.remove("hidden");
      startGameBtn.onclick = callback;
    }

    console.log("🏆 Ordre final affiché");
  }

  triggerGameStart() {
    const event = new CustomEvent("gameStarted");
    document.dispatchEvent(event);
    this.hideSection(this.diceOrderSection);
    console.log("🚀 Démarrage de la partie déclenché");
  }

  showGameBoard() {
    if (this.gameBoard) this.gameBoard.classList.remove("hidden");
    if (this.gameInfo) this.gameInfo.classList.remove("hidden");
    if (this.gameLog) this.gameLog.classList.remove("hidden");
    console.log("🎮 Plateau de jeu affiché");
  }

  showNewRoundSection() {
    this.hideSection(this.gameBoard);
    this.showSection(this.newRoundSection);
    console.log("🔄 Section nouveau tour affichée");
  }

  triggerNewRound() {
    const event = new CustomEvent("newRoundStarted");
    document.dispatchEvent(event);
    this.hideSection(this.newRoundSection);
    console.log("🔄 Nouveau tour déclenché");
  }

  startPlayerTurn(player) {
    if (!player) {
      console.error("❌ Aucun joueur fourni pour startPlayerTurn");
      return;
    }

    this.hideSection(this.newRoundSection);
    this.hideSection(this.diceOrderSection);
    this.hideMessage();
    this.showGameBoard();

    this.updatePlayerInfo(player);

    // Désactiver les actions si c'est un joueur PC
    if (player.name.includes("PC")) {
      this.disableAllActions();
      console.log(`🤖 Boutons d'action désactivés pour ${player.name}`);
    } else {
      this.enableAllActions();
      console.log(`👤 Boutons d'action activés pour ${player.name}`);
    }

    this.clearHighlights();
    this.currentAction = null;

    // Mettre en évidence le joueur actif
    this.highlightActivePlayer(player);

    // Afficher l'indicateur de tour
    this.showTurnIndicator(player);

    console.log(
      `🎯 Tour de ${player.name} - Actions ${
        player.name.includes("PC") ? "désactivées" : "disponibles"
      }`
    );
  }

  showTurnIndicator(player) {
    // Supprimer l'ancien indicateur s'il existe
    const oldIndicator = document.querySelector(".player-turn-indicator");
    if (oldIndicator) {
      oldIndicator.remove();
    }

    // Créer un nouvel indicateur
    const indicator = document.createElement("div");
    indicator.className = "player-turn-indicator";

    // Définir la couleur en fonction du type de joueur
    const color = player.name.includes("PC") ? "#ff6b6b" : "#4dabf7";

    indicator.innerHTML = `
      <span style="color: ${color}">⏳ Tour de ${player.name} (${player.heroType})</span>
    `;

    document.body.appendChild(indicator);

    // Faire disparaître l'indicateur après 3 secondes
    setTimeout(() => {
      indicator.classList.add("fade-out");
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 500);
    }, 3000);
  }

  highlightActivePlayer(player) {
    // Supprimer l'ancien highlight
    this.clearActivePlayerHighlight();

    if (!player || !player.position) return;

    // Trouver la cellule du joueur actif
    const cell = this.getCellElement(player.position.row, player.position.col);
    if (cell) {
      cell.classList.add("active-player");
      this.activePlayerHighlight = cell;
      console.log(
        `🔆 Mise en évidence du joueur actif: ${player.name} à la position (${player.position.row}, ${player.position.col})`
      );
    }
  }

  clearActivePlayerHighlight() {
    if (this.activePlayerHighlight) {
      this.activePlayerHighlight.classList.remove("active-player");
      this.activePlayerHighlight = null;
    }

    // Vérification supplémentaire pour s'assurer qu'aucune cellule n'a la classe
    const activeCells = document.querySelectorAll(".cell.active-player");
    activeCells.forEach((cell) => cell.classList.remove("active-player"));
  }

  createArenaGrid() {
    if (!this.arenaGrid) {
      console.error("❌ Élément arena-grid non trouvé");
      return;
    }

    this.arenaGrid.innerHTML = "";

    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = row;
        cell.dataset.col = col;

        cell.addEventListener("click", () => this.handleCellClick(row, col));

        this.arenaGrid.appendChild(cell);
      }
    }

    console.log("🏗️ Grille d'arène créée (7x7)");
  }

  updateArenaDisplay(arena) {
    if (!this.arenaGrid || !arena) {
      console.error("❌ Impossible de mettre à jour l'affichage de l'arène");
      return;
    }

    const cells = this.arenaGrid.querySelectorAll(".cell");

    cells.forEach((cell) => {
      const row = Number.parseInt(cell.dataset.row);
      const col = Number.parseInt(cell.dataset.col);
      const gridCell = arena.getCellAt(row, col);

      cell.innerHTML = "";
      cell.className = "cell";

      if (gridCell && gridCell.player) {
        cell.classList.add("occupied");
        const heroImg = document.createElement("img");
        heroImg.src = gridCell.player.getImagePath();
        heroImg.className = "hero-sprite";
        heroImg.alt = gridCell.player.heroType;
        heroImg.title = `${gridCell.player.name} (${gridCell.player.hp} PV)`;
        cell.appendChild(heroImg);

        // Restaurer la mise en évidence du joueur actif si nécessaire
        if (window.game && window.game.getCurrentPlayer() === gridCell.player) {
          cell.classList.add("active-player");
          this.activePlayerHighlight = cell;
        }
      }
    });
  }

  highlightAccessibleCells(cells) {
    this.clearHighlights();
    this.accessibleCells = cells || [];

    this.accessibleCells.forEach((pos) => {
      const cell = this.getCellElement(pos.row, pos.col);
      if (cell) {
        cell.classList.add("accessible");
      }
    });

    console.log(
      `🟢 ${this.accessibleCells.length} cases accessibles surlignées`
    );
  }

  highlightAttackableTargets(targets) {
    this.clearHighlights();
    this.attackableTargets = targets || [];

    this.attackableTargets.forEach((target) => {
      if (target && target.position) {
        const pos = target.position;
        const cell = this.getCellElement(pos.row, pos.col);
        if (cell) {
          cell.classList.add("attackable");
        }
      }
    });

    console.log(
      `🔴 ${this.attackableTargets.length} cibles attaquables surlignées`
    );
  }

  clearHighlights() {
    if (!this.arenaGrid) return;

    const cells = this.arenaGrid.querySelectorAll(".cell");
    cells.forEach((cell) => {
      cell.classList.remove("accessible", "attackable");
    });
    this.accessibleCells = [];
    this.attackableTargets = [];
  }

  getCellElement(row, col) {
    if (!this.arenaGrid) return null;
    return this.arenaGrid.querySelector(
      `[data-row="${row}"][data-col="${col}"]`
    );
  }

  handleCellClick(row, col) {
    // Ignorer les clics si c'est le tour de l'IA
    if (this.arenaGrid && this.arenaGrid.classList.contains("ai-turn")) {
      console.log("🚫 Clic ignoré - Tour de l'IA en cours");
      return;
    }

    const event = new CustomEvent("cellClick", {
      detail: { row, col, action: this.currentAction },
    });
    document.dispatchEvent(event);
    console.log(
      `🖱️ Clic sur cellule (${row}, ${col}) - Action: ${this.currentAction}`
    );
  }

  selectAction(action) {
    Object.values(this.actionButtons).forEach((btn) => {
      if (btn) btn.classList.remove("selected");
    });

    if (this.actionButtons[action]) {
      this.actionButtons[action].classList.add("selected");
    }

    this.currentAction = action;

    const event = new CustomEvent("actionSelected", {
      detail: { action },
    });
    document.dispatchEvent(event);

    console.log(`🎯 Action sélectionnée: ${action}`);
  }

  updatePlayerInfo(player) {
    if (!player) {
      console.error("❌ Aucun joueur fourni pour updatePlayerInfo");
      return;
    }

    if (this.currentPlayerSpan) {
      this.currentPlayerSpan.textContent = `${player.name} (${player.heroType})`;
    }

    if (this.currentHpSpan) {
      this.currentHpSpan.textContent = player.hp;
    }

    const cooldownText =
      player.specialCooldown > 0 ? `${player.specialCooldown} tours` : "Prêt";
    if (this.cooldownTimer) {
      this.cooldownTimer.textContent = cooldownText;
    }

    this.updateActionButtons(player);
    console.log(`ℹ️ Infos joueur mises à jour: ${player.name}`);
  }

  updateActionButtons(player) {
    if (!player) return;

    // Affichage du bouton esquiver pour le ninja uniquement
    if (this.actionButtons.dodge) {
      this.actionButtons.dodge.style.display =
        player.heroType === "ninja" ? "block" : "none";
    }

    // État du pouvoir spécial
    if (this.actionButtons.special) {
      this.actionButtons.special.disabled = !player.canUseSpecial();
      this.actionButtons.special.textContent = `${player.specialName} ${
        player.canUseSpecial() ? "" : "(Cooldown)"
      }`;
    }
  }

  showMessage(title, text, callback = null) {
    // Check if it's an attack or special power message
    if (title.toLowerCase().includes('pouvoir spécial') || 
        title.toLowerCase().includes('special power') ||
        text.toLowerCase().includes('pouvoir spécial') ||
        text.toLowerCase().includes('special power') ||
        title.toLowerCase().includes('attaque') ||
        title.toLowerCase().includes('attack') ||
        text.toLowerCase().includes('attaque') ||
        text.toLowerCase().includes('attack')) {
      // Create a temporary alert element
      const alertDiv = document.createElement('div');
      alertDiv.style.position = 'fixed';
      alertDiv.style.top = '50%';
      alertDiv.style.left = '50%';
      alertDiv.style.transform = 'translate(-50%, -50%)';
      alertDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      alertDiv.style.color = '#fff';
      alertDiv.style.padding = '20px';
      alertDiv.style.borderRadius = '10px';
      alertDiv.style.zIndex = '1000';
      alertDiv.style.textAlign = 'center';
      alertDiv.style.minWidth = '300px';
      alertDiv.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
      alertDiv.style.animation = 'fadeInOut 3s ease-in-out';
      
      // Add the message content
      alertDiv.innerHTML = `
        <h3 style="color: #4a90e2; margin-bottom: 10px;">${title}</h3>
        <p>${text}</p>
      `;
      
      // Add the element to the document
      document.body.appendChild(alertDiv);
      
      // Remove the element after 3 seconds
      setTimeout(() => {
        alertDiv.remove();
        if (callback) callback();
      }, 3000);
      
      return;
    }

    // For all other messages, just log them and execute callback if exists
    console.log(`${title}: ${text}`);
    if (callback) callback();
  }

  hideMessage() {
    this.hideSection(this.messageArea);
  }

  showSection(section) {
    if (section) {
      section.classList.remove("hidden");
    }
  }

  hideSection(section) {
    if (section) {
      section.classList.add("hidden");
    }
  }

  resetActionButtons() {
    Object.values(this.actionButtons).forEach((btn) => {
      if (btn) btn.classList.remove("selected");
    });
    this.currentAction = null;
  }

  disableAllActions() {
    Object.values(this.actionButtons).forEach((btn) => {
      if (btn) btn.disabled = true;
    });
  }

  enableAllActions() {
    Object.values(this.actionButtons).forEach((btn) => {
      if (btn) btn.disabled = false;
    });

    // Mise à jour spécifique selon le joueur actuel
    const currentPlayer = window.game ? window.game.getCurrentPlayer() : null;
    if (currentPlayer) {
      this.updateActionButtons(currentPlayer);
    }
  }

  disablePlayerInteractions() {
    // Désactiver tous les boutons d'action
    this.disableAllActions();

    // Désactiver les clics sur les cellules en ajoutant une classe CSS
    if (this.arenaGrid) {
      this.arenaGrid.classList.add("ai-turn");
    }

    console.log("🚫 Interactions joueur désactivées (tour IA)");
  }

  enablePlayerInteractions() {
    // Réactiver les boutons d'action
    this.enableAllActions();

    // Réactiver les clics sur les cellules
    if (this.arenaGrid) {
      this.arenaGrid.classList.remove("ai-turn");
    }

    console.log("✅ Interactions joueur réactivées");
  }

  showDiceRollAnimation(callback) {
    // Show the dice in the game info section
    if (this.diceElement) {
      this.diceElement.classList.remove("hidden");
      this.diceElement.classList.add("rolling");
    }

    // Show the dice result element
    if (this.diceResult) {
      this.diceResult.textContent = "";
      this.diceResult.classList.remove("hidden");
    }

    // After animation, show result and execute callback
    setTimeout(() => {
      if (this.diceElement) {
        this.diceElement.classList.remove("rolling");
      }
      if (callback) {
        callback();
      }
    }, 1000);
  }

  highlightPlusZone(zone) {
    this.clearHighlights();
    zone.forEach(cell => {
      const cellElement = this.getCellElement(cell.row, cell.col);
      if (cellElement) {
        cellElement.classList.add('plus-zone');
      }
    });
  }
}

export { UI };
