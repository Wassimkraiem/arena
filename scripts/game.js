import { Arena } from "./arena.js";
import { UI } from "./ui.js";
import { Player } from "./player.js";

class Game {
  constructor() {
    this.arena = new Arena();
    this.ui = new UI();
    this.players = [];
    this.currentPlayerIndex = 0;
    this.gameState = "setup";
    this.selectedAction = null;
    this.playerCount = 0;
    this.gameMode = "individual";
    this.heroAvailability = { chevalier: 2, ninja: 2, sorcier: 2 };
    this.currentSelectingPlayer = 0;
    this.selectedHeroes = [];
    this.diceResults = [];
    this.currentRollingPlayer = 0;
    this.playersWhoPlayed = [];
    this.roundNumber = 1;
    this.tiedPlayersList = [];
    this.turnTransitionDelay = 1500;
    this.actionDelay = 1000;
    this.clockwiseOrder = [];
    this.currentTurnFirstPlayer = 0;

    this.bindEvents();
  }

  bindEvents() {
    document.addEventListener("playerCountSelected", (e) =>
      this.handlePlayerCountSelection(e.detail.count)
    );
    document.addEventListener("gameModeSelected", (e) =>
      this.handleGameModeSelection(e.detail.mode)
    );
    document.addEventListener("heroSelected", (e) =>
      this.handleHeroSelection(e.detail.hero)
    );
    document.addEventListener("diceRolledForOrder", (e) =>
      this.handleDiceRollForOrder(e.detail.result)
    );
    document.addEventListener("gameStarted", () => this.startActualGame());
    document.addEventListener("newRoundStarted", () => this.startNewRound());
    document.addEventListener("actionSelected", (e) =>
      this.handleActionSelection(e.detail.action)
    );
    document.addEventListener("cellClick", (e) =>
      this.handleCellClick(e.detail)
    );
  }

  handlePlayerCountSelection(count) {
    this.playerCount = count;
    console.log(`👥 Nombre de joueurs sélectionné: ${count}`);

    if (count === 4) {
      this.ui.showGameModeSelection();
    } else {
      this.gameMode = "individual";
      this.startHeroSelection();
    }
  }

  handleGameModeSelection(mode) {
    this.gameMode = mode;
    console.log(`🎮 Mode de jeu sélectionné: ${mode}`);

    if (mode === "duo") {
      this.ui.showMessage(
        "Mode non disponible",
        "Le mode Duo sera disponible prochainement. Veuillez choisir le mode Individuel."
      );
      return;
    }

    this.startHeroSelection();
  }

  startHeroSelection() {
    this.gameState = "selecting-heroes";
    this.currentSelectingPlayer = 0;
    this.selectedHeroes = [];
    console.log("🦸 Début de la sélection des héros");

    this.ui.showHeroSelection(1, this.heroAvailability);
  }

  handleHeroSelection(heroType) {
    if (this.heroAvailability[heroType] <= 0) {
      this.ui.showMessage(
        "Héros indisponible",
        "Ce héros a déjà été sélectionné le maximum de fois."
      );
      return;
    }

    this.selectedHeroes.push({
      playerIndex: this.currentSelectingPlayer,
      heroType: heroType,
    });

    this.heroAvailability[heroType]--;
    console.log(`🦸 Joueur ${this.currentSelectingPlayer + 1} a choisi: ${heroType}`);

    this.currentSelectingPlayer++;

    if (this.currentSelectingPlayer < this.playerCount) {
      // Show hero selection for next player
      this.ui.showHeroSelection(this.currentSelectingPlayer + 1, this.heroAvailability);
    } else {
      // All players have selected their heroes
      this.showHeroSelectionSummary();
    }
  }

  showHeroSelectionSummary() {
    let summaryText = "Sélection des héros terminée !\n\n";

    this.selectedHeroes.forEach((selection) => {
      const playerName = `Joueur ${selection.playerIndex + 1}`;
      summaryText += `${playerName}: ${selection.heroType}\n`;
    });

    console.log("📋 Résumé des sélections:", this.selectedHeroes);

    this.ui.showMessage("Héros sélectionnés", summaryText, () => {
      this.createPlayers();
      this.startOrderDetermination();
    });
  }

  createPlayers() {
    this.players = [];

    for (let i = 0; i < this.playerCount; i++) {
      const heroChoice = this.selectedHeroes.find(
        (choice) => choice.playerIndex === i
      );
      const playerName = `Joueur ${i + 1}`;
      const player = new Player(playerName, heroChoice.heroType, null);
      this.players.push(player);
      console.log(`👤 Créé: ${player.name} (${player.heroType})`);
    }

    this.placePlayersOnArena();
    this.ui.createArenaGrid();
    this.ui.updateArenaDisplay(this.arena);

    this.establishClockwiseOrder();
  }

  placePlayersOnArena() {
    if (this.playerCount === 4) {
      const cornerPositions = [
        { row: 0, col: 0 },
        { row: 0, col: 6 },
        { row: 6, col: 6 },
        { row: 6, col: 0 },
      ];

      for (let i = 0; i < this.players.length; i++) {
        const pos = cornerPositions[i];
        this.arena.addPlayer(this.players[i], pos.row, pos.col);
      }

      console.log("📍 Placement des 4 joueurs dans les coins de l'arène");
    } else {
      const availablePositions = this.generateRandomPositions();

      for (let i = 0; i < this.players.length; i++) {
        const randomIndex = Math.floor(
          Math.random() * availablePositions.length
        );
        const pos = availablePositions[randomIndex];

        availablePositions.splice(randomIndex, 1);

        this.arena.addPlayer(this.players[i], pos.row, pos.col);
        console.log(
          `📍 ${this.players[i].name} placé en position (${pos.row}, ${pos.col})`
        );
      }

      console.log(
        `📍 Placement aléatoire de ${this.playerCount} joueurs dans l'arène`
      );
    }
  }

  generateRandomPositions() {
    const positions = [];
    const arenaSize = 7;

    for (let row = 0; row < arenaSize; row++) {
      for (let col = 0; col < arenaSize; col++) {
        positions.push({ row, col });
      }
    }

    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    return positions;
  }

  establishClockwiseOrder() {
    this.clockwiseOrder = [];

    if (this.playerCount === 4 && this.arePlayersInCorners()) {
      const cornerOrder = [
        { row: 0, col: 0 },
        { row: 0, col: 6 },
        { row: 6, col: 6 },
        { row: 6, col: 0 },
      ];

      cornerOrder.forEach((corner) => {
        const playerIndex = this.players.findIndex(
          (player) =>
            player.position.row === corner.row &&
            player.position.col === corner.col
        );
        if (playerIndex !== -1) {
          this.clockwiseOrder.push(playerIndex);
        }
      });
    } else {
      this.calculateAngleBasedOrder();
    }

    const orderNames = this.clockwiseOrder
      .map((idx) => this.players[idx].name)
      .join(" → ");
    console.log(`🔄 Ordre horaire établi: ${orderNames}`);
  }

  arePlayersInCorners() {
    const corners = [
      { row: 0, col: 0 },
      { row: 0, col: 6 },
      { row: 6, col: 6 },
      { row: 6, col: 0 },
    ];

    if (this.playerCount !== 4) return false;

    return this.players.every((player) => {
      return corners.some(
        (corner) =>
          player.position.row === corner.row &&
          player.position.col === corner.col
      );
    });
  }

  calculateAngleBasedOrder() {
    const centerRow = 3;
    const centerCol = 3;

    const playerAngles = this.players.map((player, index) => {
      if (!player.position) return { index, angle: 0 };

      const dx = player.position.col - centerCol;
      const dy = player.position.row - centerRow;

      let angle = Math.atan2(dy, dx);

      angle = (90 - angle * (180 / Math.PI)) % 360;
      if (angle < 0) angle += 360;

      return { index, angle };
    });

    playerAngles.sort((a, b) => a.angle - b.angle);

    this.clockwiseOrder = playerAngles.map((p) => p.index);
  }

  startOrderDetermination() {
    this.gameState = "determining-order";
    this.diceResults = [];
    this.currentRollingPlayer = 0;
    this.tiedPlayersList = [];

    console.log(
      `🎲 Début de la détermination de l'ordre - Tour ${this.roundNumber}`
    );
    this.ui.showDiceOrderSection(this.players[0].name);
  }

  handleDiceRollForOrder(result) {
    console.log(
      `🎲 Gestion du lancer de dé - Joueur ${this.currentRollingPlayer}, Résultat: ${result}`
    );

    if (this.currentRollingPlayer >= this.players.length) {
      console.error(
        `❌ Index invalide: ${this.currentRollingPlayer} >= ${this.players.length}`
      );
      return;
    }

    const currentPlayer = this.players[this.currentRollingPlayer];
    if (!currentPlayer) {
      console.error(
        `❌ Joueur non trouvé à l'index: ${this.currentRollingPlayer}`
      );
      return;
    }

    this.diceResults.push({
      playerIndex: this.currentRollingPlayer,
      playerName: currentPlayer.name,
      result: result,
    });

    console.log(`📊 Résultat ajouté: ${currentPlayer.name} = ${result}`);
    this.ui.updateDiceResults(this.diceResults);

    this.currentRollingPlayer++;

    if (this.currentRollingPlayer < this.players.length) {
      const nextPlayer = this.players[this.currentRollingPlayer];
      if (nextPlayer) {
        console.log(`➡️ Passage au joueur suivant: ${nextPlayer.name}`);

        setTimeout(() => {
          this.ui.showNextPlayerRoll(nextPlayer.name);
        }, 1000);
      } else {
        console.error(
          `❌ Joueur suivant non trouvé à l'index: ${this.currentRollingPlayer}`
        );
        this.determinePlayOrder();
      }
    } else {
      console.log("🏁 Tous les joueurs ont lancé les dés");

      setTimeout(() => {
        this.determinePlayOrder();
      }, 1000);
    }
  }

  determinePlayOrder() {
    console.log("🏆 Détermination de l'ordre de jeu...");
    
    // Trier d'abord par résultat du dé (décroissant)
    // En cas d'égalité, trier par ordre de lancement (croissant)
    this.diceResults.sort((a, b) => {
      if (b.result !== a.result) {
        return b.result - a.result;
      }
      // En cas d'égalité, le joueur qui a lancé en premier (index plus petit) gagne
      return a.playerIndex - b.playerIndex;
    });

    // Plus besoin de gérer les égalités car l'ordre est maintenant déterminé
    this.currentTurnFirstPlayer = this.diceResults[0].playerIndex;
    this.currentPlayerIndex = this.currentTurnFirstPlayer;

    console.log(
      `🥇 Premier joueur du tour ${this.roundNumber}: ${this.diceResults[0].playerName} (index: ${this.currentTurnFirstPlayer})`
    );

    this.ui.showFinalOrder(this.diceResults, () =>
      this.ui.triggerGameStart()
    );
  }

  startActualGame() {
    this.gameState = "playing";
    this.playersWhoPlayed = [];
    console.log(`🚀 Début du tour ${this.roundNumber}!`);
    this.startTurn();
  }

  startNewRound() {
    this.roundNumber++;
    this.playersWhoPlayed = [];
    console.log(
      `🔄 Nouveau tour ${this.roundNumber} - Lancement des dés pour déterminer l'ordre`
    );

    this.startOrderDetermination();
  }

  startTurn() {
    const currentPlayer = this.getCurrentPlayer();

    if (!currentPlayer) {
      console.error("❌ Aucun joueur actuel trouvé");
      return;
    }

    if (!currentPlayer.isAlive()) {
      console.log(`💀 ${currentPlayer.name} est mort, passage au suivant`);
      this.nextPlayer();
      return;
    }

    currentPlayer.updateCooldown();

    setTimeout(() => {
      if (currentPlayer.name.includes("PC")) {
        console.log(`🤖 Tour de l'IA: ${currentPlayer.name}`);
        this.ui.startPlayerTurn(currentPlayer);
        this.ui.disablePlayerInteractions();

        setTimeout(() => {
          this.playAITurn();
        }, this.actionDelay);
      } else {
        console.log(`👤 Tour du joueur humain: ${currentPlayer.name}`);
        this.ui.startPlayerTurn(currentPlayer);
        this.ui.enablePlayerInteractions();
      }
    }, 500);
  }

  handleActionSelection(action) {
    this.selectedAction = action;
    const currentPlayer = this.getCurrentPlayer();

    console.log(`🎯 Action sélectionnée: ${action} par ${currentPlayer.name}`);

    switch (action) {
      case "move":
        this.handleMoveAction(currentPlayer);
        break;
      case "attack":
        this.handleAttackAction(currentPlayer);
        break;
      case "special":
        this.handleSpecialAction(currentPlayer);
        break;
      case "defend":
        this.handleDefendAction(currentPlayer);
        break;
      case "dodge":
        this.handleDodgeAction(currentPlayer);
        break;
    }
  }

  handleMoveAction(player) {
    const accessibleCells = this.arena.getAccessibleCells(player);

    if (accessibleCells.length === 0) {
      console.log("❌ Aucune case accessible pour le déplacement");
      this.ui.showMessage(
        "Déplacement impossible",
        "Aucune case accessible pour le déplacement."
      );
      return;
    }

    console.log(
      `🚶 ${accessibleCells.length} cases accessibles pour ${player.name}`
    );
    this.ui.highlightAccessibleCells(accessibleCells);
  }

  handleAttackAction(player) {
    const targets = this.arena.getAttackableTargets(player);

    if (targets.length === 0) {
      console.log("❌ Aucune cible à portée pour l'attaque");
      let message = "Aucune cible à portée.";
      
      switch (player.heroType) {
        case "chevalier":
          message = "Aucun héros adjacent. Le Chevalier ne peut attaquer qu'à une case de distance.";
          break;
        case "ninja":
          message = "Aucune cible à portée. Le Ninja peut :\n" +
                   "- Attaquer une cible adjacente (1 case)\n" +
                   "- Attaquer une cible à exactement 3 cases de distance :\n" +
                   "  • En ligne droite (3 cases dans une direction)\n" +
                   "  • En L (2 cases puis 1 case)\n" +
                   "Le chemin doit être libre d'obstacles.";
          break;
        case "sorcier":
          message = "Aucune cible à portée. Le Sorcier ne peut attaquer qu'à 2 ou 3 cases de distance en ligne droite.";
          break;
      }
      
      this.ui.showMessage("Attaque impossible", message);
      return;
    }

    console.log(`⚔️ ${targets.length} cibles à portée pour ${player.name}`);
    this.ui.highlightAttackableTargets(targets);
  }

  handleSpecialAction(player) {
    if (!player.canUseSpecial()) {
      console.log("❌ Pouvoir spécial en cooldown");
      this.ui.showMessage(
        "Pouvoir indisponible",
        `Le pouvoir spécial sera disponible dans ${player.specialCooldown} tour(s).`
      );
      return;
    }

    console.log(`✨ ${player.name} utilise son pouvoir spécial`);
    this.executeSpecialPower(player);
  }

  handleDefendAction(player) {
    player.defend();
    console.log(`🛡️ ${player.name} se défend`);
    this.ui.showMessage(
      "Défense activée",
      `${player.name} se met en position défensive. Les dégâts du prochain tour seront réduits.`,
      () => this.endTurn()
    );
  }

  handleDodgeAction(player) {
    if (!player.canDodge()) {
      console.log("❌ Seul le ninja peut esquiver");
      this.ui.showMessage(
        "Action impossible",
        "Seul le ninja peut utiliser l'esquive."
      );
      return;
    }

    const diceRoll = Math.floor(Math.random() * 6) + 1;
    const success = diceRoll >= 4;

    console.log(
      `💨 ${player.name} tente d'esquiver: ${diceRoll} - ${
        success ? "Réussi" : "Échoué"
      }`
    );

    this.ui.showMessage(
      "Tentative d'esquive",
      `${player.name} tente d'esquiver !\n\n🎲 Dé: ${diceRoll}\n\n${
        success
          ? "✅ Esquive réussie ! Les prochaines attaques seront évitées."
          : "❌ Esquive échouée."
      }`,
      () => this.endTurn()
    );
  }

  handleCellClick(detail) {
    const { row, col, action } = detail;

    if (!action) return;

    const currentPlayer = this.getCurrentPlayer();
    console.log(`🖱️ Clic sur cellule (${row}, ${col}) - Action: ${action}`);

    if (action === "move") {
      this.executeMove(currentPlayer, row, col);
    } else if (action === "attack") {
      this.executeAttack(currentPlayer, row, col);
    }
  }

  executeMove(player, row, col) {
    console.log(
      `🎯 Tentative d'exécution du mouvement: ${player.name} vers (${row}, ${col})`
    );

    // Vérifier que la cellule est dans les cases accessibles calculées
    const isAccessible = this.ui.accessibleCells.some(
      (cell) => cell.row === row && cell.col === col
    );

    if (!isAccessible) {
      console.log("❌ Mouvement invalide - case non accessible selon l'UI");
      this.ui.showMessage(
        "Case non accessible",
        "Cette case n'est pas accessible selon les règles de déplacement de votre héros."
      );
      return;
    }

    // Tentative de déplacement
    const moveSuccess = this.arena.movePlayer(player, row, col);

    if (moveSuccess) {
      this.ui.updateArenaDisplay(this.arena);
      this.ui.clearHighlights();

      console.log(`✅ ${player.name} se déplace vers (${row}, ${col})`);
      this.ui.showMessage(
        "Déplacement réussi",
        `${player.name} s'est déplacé vers la position (${row + 1}, ${
          col + 1
        }).`,
        () => this.endTurn()
      );
    } else {
      console.log("❌ Échec du déplacement");
      this.ui.showMessage(
        "Déplacement échoué",
        "Le déplacement n'a pas pu être effectué. Veuillez réessayer."
      );
    }
  }

  executeAttack(player, row, col) {
    const targetCell = this.arena.getCellAt(row, col);
    const target = targetCell ? targetCell.player : null;

    if (!target) {
      console.log("❌ Aucune cible à cette position");
      this.ui.showMessage(
        "Attaque impossible",
        "Aucune cible à cette position."
      );
      return;
    }

    const isAttackable = this.ui.attackableTargets.includes(target);

    if (!isAttackable) {
      console.log("❌ Cible hors de portée");
      let message = "Cette cible n'est pas à portée d'attaque.";
      
      if (player.heroType === "ninja") {
        message = "Cette cible n'est pas à portée du Ninja.\n\n" +
                 "Options d'attaque du Ninja :\n" +
                 "- Attaque de base : cible adjacente (1 case)\n" +
                 "- Attaque spéciale : cible à 3 cases de distance\n" +
                 "  • En ligne droite (3 cases)\n" +
                 "  • En L (2 cases + 1 case)\n" +
                 "Le chemin doit être libre d'obstacles.";
      }
      
      this.ui.showMessage("Cible hors de portée", message);
      return;
    }

    // Gestion du déplacement automatique du Ninja avant l'attaque
    if (player.heroType === "ninja") {
      const deltaRow = row - player.position.row;
      const deltaCol = col - player.position.col;
      const distance = Math.abs(deltaRow) + Math.abs(deltaCol);

      if (distance > 1) {
        console.log(`🥷 Tentative d'attaque spéciale du Ninja à distance ${distance}`);

        // Calculer la position d'attaque pour le Ninja
        const attackPosition = this.arena.getNinjaAttackPosition(
          player.position.row,
          player.position.col,
          row,
          col
        );

        if (!attackPosition) {
          console.log("❌ Position d'attaque invalide pour le Ninja");
          this.ui.showMessage(
            "Attaque impossible",
            "Le chemin vers la cible est bloqué. Le Ninja a besoin d'un chemin libre pour se déplacer et attaquer."
          );
          return;
        }

        // Déplacer le Ninja à la position d'attaque
        const moveSuccess = this.arena.movePlayer(
          player,
          attackPosition.row,
          attackPosition.col
        );

        if (!moveSuccess) {
          console.log("❌ Déplacement du Ninja impossible");
          this.ui.showMessage(
            "Attaque impossible",
            "Le Ninja ne peut pas atteindre une position d'attaque valide. Vérifiez que le chemin est libre."
          );
          return;
        }

        this.ui.updateArenaDisplay(this.arena);
        console.log(`🥷 ${player.name} s'est déplacé en (${attackPosition.row}, ${attackPosition.col}) avant d'attaquer`);
      }
    }

    console.log(`⚔️ ${player.name} attaque ${target.name}`);
    this.performAttack(player, target);
  }

  performAttack(attacker, target) {
    const diceRoll = Math.floor(Math.random() * 6) + 1;
    let damage = 0;
    let message = `⚔️ ${attacker.name} attaque ${target.name} !\n\n🎲 Dé: ${diceRoll} - `;

    // Règles spécifiques pour le Sorcier
    if (attacker.heroType === "sorcier") {
      if (diceRoll <= 2) {
        message += "❌ Échec !";
      } else if (diceRoll <= 5) {
        damage = attacker.attackDamage;
        message += `✅ Touché ! ${damage} dégâts.`;
      } else {
        damage = attacker.attackDamage * 2;
        message += `💥 Coup critique ! ${damage} dégâts.`;
      }
    } else {
      // Règles pour le Chevalier et le Ninja
      if (diceRoll <= 2) {
        message += "❌ Échec !";
      } else if (diceRoll <= 5) {
        damage = attacker.attackDamage;
        message += `✅ Touché ! ${damage} dégâts.`;
      } else {
        damage = attacker.attackDamage * 1.5;
        message += `💥 Coup critique ! ${damage} dégâts.`;
      }
    }

    if (damage > 0) {
      const actualDamage = target.takeDamage(damage);
      message += `\n\n${target.name} perd ${actualDamage} PV.`;

      if (!target.isAlive()) {
        message += `\n💀 ${target.name} est éliminé !`;
        this.arena.removePlayer(target);
        console.log(`💀 ${target.name} a été éliminé`);
      }
    }

    this.ui.clearHighlights();
    this.ui.updateArenaDisplay(this.arena);

    this.ui.showMessage("Résultat de l'attaque", message, () => {
      if (this.checkGameEnd()) {
        this.endGame();
      } else {
        this.endTurn();
      }
    });
  }

  executeSpecialPower(player) {
    if (!player.useSpecial()) return;

    // Show dice roll animation in the UI
    this.ui.showDiceRollAnimation(() => {
      const diceRoll = Math.floor(Math.random() * 6) + 1;
      let message = `✨ ${player.name} utilise son pouvoir spécial !\n\n🎲 Dé: ${diceRoll} - `;
      let success = false;

      // Check if the special attack succeeds based on dice roll
      switch (player.heroType) {
        case "chevalier":
          success = diceRoll >= 3;
          if (success) {
            player.attackDamage += 15;
            message += "✅ Réussi ! Dégâts augmentés pour le prochain tour !";
            console.log(`⚔️ ${player.name} augmente ses dégâts`);
          } else {
            message += "❌ Échoué ! Le pouvoir spécial n'a pas d'effet.";
          }
          break;

        case "ninja":
          success = diceRoll >= 4;
          if (success) {
            const targets = this.arena.getAttackableTargets(player);
            if (targets.length > 0) {
              const target = targets[0];
              message += "✅ Réussi ! Double attaque !";
              console.log(`⚡ ${player.name} effectue une double attaque`);
              this.performAttack(player, target);
              if (target.isAlive()) {
                this.performAttack(player, target);
              }
              return;
            } else {
              message += "❌ Aucune cible à portée !";
            }
          } else {
            message += "❌ Échoué ! Le pouvoir spécial n'a pas d'effet.";
          }
          break;

        case "sorcier":
          success = diceRoll >= 3;
          if (success) {
            const allTargets = this.arena
              .getAlivePlayers()
              .filter((p) => p !== player);
            message += "✅ Réussi ! Tempête magique !";
            console.log(`🌪️ ${player.name} lance une tempête magique`);
            allTargets.forEach((target) => {
              const damage = 20;
              target.takeDamage(damage);
              message += `\n⚡ ${target.name} subit ${damage} dégâts !`;
            });
            this.ui.updateArenaDisplay(this.arena);
          } else {
            message += "❌ Échoué ! Le pouvoir spécial n'a pas d'effet.";
          }
          break;
      }

      this.ui.showMessage("Pouvoir spécial", message, () => {
        if (this.checkGameEnd()) {
          this.endGame();
        } else {
          this.endTurn();
        }
      });
    });
  }

  playAITurn() {
    const aiPlayer = this.getCurrentPlayer();

    console.log(`🤖 ${aiPlayer.name} (PC) réfléchit...`);

    setTimeout(() => {
      // D'abord essayer d'attaquer si possible
      const targets = this.arena.getAttackableTargets(aiPlayer);

      if (targets.length > 0) {
        // Choisir la cible la plus faible
        const weakestTarget = targets.reduce((weakest, current) => {
          return current.hp < weakest.hp ? current : weakest;
        }, targets[0]);

        // Pour le Ninja, déplacer vers la cible avant d'attaquer
        if (aiPlayer.heroType === "ninja") {
          const targetPos = weakestTarget.position;
          const attackPosition = this.arena.getNinjaAttackPosition(
            aiPlayer.position.row,
            aiPlayer.position.col,
            targetPos.row,
            targetPos.col
          );

          if (attackPosition) {
            const moveSuccess = this.arena.movePlayer(
              aiPlayer,
              attackPosition.row,
              attackPosition.col
            );

            if (moveSuccess) {
              this.ui.updateArenaDisplay(this.arena);
              console.log(`🥷 ${aiPlayer.name} se déplace vers la cible avant d'attaquer`);
            }
          }
        }

        console.log(`🎯 ${aiPlayer.name} attaque ${weakestTarget.name}`);
        this.performAttack(aiPlayer, weakestTarget);
      } else {
        // Sinon, essayer de se déplacer stratégiquement
        const accessibleCells = this.arena.getAccessibleCells(aiPlayer);
        
        if (accessibleCells.length > 0) {
          // Trouver la meilleure position pour se rapprocher d'une cible
          const bestMove = this.findBestMove(aiPlayer, accessibleCells);
          
          if (bestMove) {
            console.log(
              `🚶 ${aiPlayer.name} tente de se déplacer vers (${bestMove.row}, ${bestMove.col})`
            );

            const moveSuccess = this.arena.movePlayer(
              aiPlayer,
              bestMove.row,
              bestMove.col
            );

            if (moveSuccess) {
              this.ui.updateArenaDisplay(this.arena);
              console.log(
                `✅ ${aiPlayer.name} s'est déplacé vers (${bestMove.row}, ${bestMove.col})`
              );

              this.ui.showMessage(
                "Déplacement",
                `${aiPlayer.name} se déplace vers la position (${
                  bestMove.row + 1
                }, ${bestMove.col + 1}).`,
                () => this.endTurn()
              );
            } else {
              console.log("❌ Échec du déplacement de l'IA");
              this.endTurn();
            }
          } else {
            console.log("❌ Aucun mouvement stratégique trouvé");
            this.endTurn();
          }
        } else {
          console.log("❌ Aucune case accessible pour l'IA");
          this.endTurn();
        }
      }
    }, this.actionDelay);
  }

  findBestMove(player, accessibleCells) {
    // Trouver la cible la plus proche
    const targets = this.players.filter(p => p !== player && p.isAlive());
    if (targets.length === 0) return accessibleCells[0];

    let bestMove = null;
    let shortestDistance = Infinity;

    // Filtrer les mouvements valides selon le type de héros
    const validMoves = accessibleCells.filter(cell => {
      const deltaRow = Math.abs(cell.row - player.position.row);
      const deltaCol = Math.abs(cell.col - player.position.col);
      
      // Vérifier que le mouvement est dans une seule direction (pas en diagonale)
      if (deltaRow > 0 && deltaCol > 0) return false;
      
      // Vérifier la distance maximale selon le type de héros
      switch (player.heroType) {
        case "chevalier":
          // Le chevalier ne peut se déplacer que d'une case dans une direction cardinale
          return (deltaRow === 1 && deltaCol === 0) || (deltaRow === 0 && deltaCol === 1);
        case "ninja":
          // Le ninja peut se déplacer de 2 cases dans une direction cardinale
          return (deltaRow === 2 && deltaCol === 0) || (deltaRow === 0 && deltaCol === 2);
        case "sorcier":
          // Le sorcier ne peut se déplacer que d'une case dans une direction cardinale
          return (deltaRow === 1 && deltaCol === 0) || (deltaRow === 0 && deltaCol === 1);
        default:
          return false;
      }
    });

    if (validMoves.length === 0) {
      console.log("❌ Aucun mouvement valide trouvé pour l'IA");
      return null;
    }

    for (const cell of validMoves) {
      // Calculer la distance minimale vers toutes les cibles
      const minDistance = Math.min(
        ...targets.map(target => 
          Math.abs(cell.row - target.position.row) + 
          Math.abs(cell.col - target.position.col)
        )
      );

      // Si cette position nous rapproche d'une cible
      if (minDistance < shortestDistance) {
        shortestDistance = minDistance;
        bestMove = cell;
      }
    }

    return bestMove;
  }

  endTurn() {
    this.ui.resetActionButtons();
    this.ui.disableAllActions();
    this.ui.clearHighlights();

    // Réactiver les interactions au cas où elles seraient désactivées
    this.ui.enablePlayerInteractions();

    const currentPlayer = this.getCurrentPlayer();
    if (!this.playersWhoPlayed.includes(currentPlayer)) {
      this.playersWhoPlayed.push(currentPlayer);
    }

    if (
      currentPlayer.heroType === "chevalier" &&
      currentPlayer.attackDamage > 25
    ) {
      currentPlayer.attackDamage = 25;
      console.log(`🗡️ Bonus de dégâts du chevalier expiré`);
    }

    const alivePlayers = this.arena.getAlivePlayers();
    const alivePlayersWhoPlayed = this.playersWhoPlayed.filter((p) =>
      p.isAlive()
    );

    console.log(
      `📊 Joueurs vivants: ${alivePlayers.length}, Joueurs ayant joué: ${alivePlayersWhoPlayed.length}`
    );

    if (alivePlayersWhoPlayed.length >= alivePlayers.length) {
      console.log(
        "🔄 Tous les joueurs ont joué, nouveau tour avec lancement de dés"
      );

      setTimeout(() => {
        this.ui.showNewRoundSection();
      }, this.turnTransitionDelay);
    } else {
      setTimeout(() => {
        this.nextPlayer();
      }, this.turnTransitionDelay);
    }
  }

  nextPlayer() {
    const currentOrderIndex = this.clockwiseOrder.indexOf(
      this.currentPlayerIndex
    );

    if (currentOrderIndex === -1) {
      console.error("❌ Joueur actuel non trouvé dans l'ordre horaire");
      return;
    }

    const firstPlayerOrderIndex = this.clockwiseOrder.indexOf(
      this.currentTurnFirstPlayer
    );
    let nextPlayerFound = false;
    let searchIndex = (currentOrderIndex + 1) % this.clockwiseOrder.length;
    let loopCount = 0;

    while (!nextPlayerFound && loopCount < this.clockwiseOrder.length) {
      const nextPlayerIndex = this.clockwiseOrder[searchIndex];
      const nextPlayer = this.players[nextPlayerIndex];

      if (
        nextPlayer &&
        nextPlayer.isAlive() &&
        !this.playersWhoPlayed.includes(nextPlayer)
      ) {
        this.currentPlayerIndex = nextPlayerIndex;
        nextPlayerFound = true;
        console.log(
          `➡️ Passage au joueur suivant (sens horaire): ${nextPlayer.name}`
        );
        this.startTurn();
        break;
      }

      searchIndex = (searchIndex + 1) % this.clockwiseOrder.length;
      loopCount++;

      if (searchIndex === firstPlayerOrderIndex) {
        break;
      }
    }

    if (!nextPlayerFound) {
      console.log("⚠️ Aucun joueur suivant trouvé dans l'ordre horaire");
    }
  }

  getCurrentPlayer() {
    if (
      this.currentPlayerIndex >= 0 &&
      this.currentPlayerIndex < this.players.length
    ) {
      return this.players[this.currentPlayerIndex];
    }
    console.error(`❌ Index de joueur invalide: ${this.currentPlayerIndex}`);
    return null;
  }

  checkGameEnd() {
    const alivePlayers = this.arena.getAlivePlayers();
    const gameEnded = alivePlayers.length <= 1;

    if (gameEnded) {
      console.log("🏁 Fin de partie détectée");
    }

    return gameEnded;
  }

  endGame() {
    this.gameState = "ended";
    const winner = this.arena.getAlivePlayers()[0];

    if (winner) {
      console.log(`🏆 Victoire de ${winner.name}`);
      this.ui.showMessage(
        "🏆 Victoire !",
        `${winner.name} (${winner.heroType}) remporte la partie !\n\nFélicitations !`,
        () => {
          if (confirm("Voulez-vous rejouer ?")) {
            location.reload();
          }
        }
      );
    } else {
      console.log("⚔️ Match nul");
      this.ui.showMessage(
        "⚔️ Match nul",
        "Tous les héros sont tombés au combat !",
        () => {
          if (confirm("Voulez-vous rejouer ?")) {
            location.reload();
          }
        }
      );
    }
  }
}

export { Game };