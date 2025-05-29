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
    if (count === 4) {
      this.ui.showGameModeSelection();
    } else {
      this.gameMode = "individual";
      this.startHeroSelection();
    }
  }

  handleGameModeSelection(mode) {
    this.gameMode = mode;
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
    this.currentSelectingPlayer++;

    if (this.currentSelectingPlayer < this.playerCount) {
      this.ui.showHeroSelection(this.currentSelectingPlayer + 1, this.heroAvailability);
    } else {
      this.showHeroSelectionSummary();
    }
  }

  showHeroSelectionSummary() {
    let summaryText = "Sélection des héros terminée !\n\n";

    this.selectedHeroes.forEach((selection) => {
      const playerName = `Joueur ${selection.playerIndex + 1}`;
      summaryText += `${playerName}: ${selection.heroType}\n`;
    });

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
    } else {
      const availablePositions = this.generateRandomPositions();

      for (let i = 0; i < this.players.length; i++) {
        const randomIndex = Math.floor(
          Math.random() * availablePositions.length
        );
        const pos = availablePositions[randomIndex];
        availablePositions.splice(randomIndex, 1);
        this.arena.addPlayer(this.players[i], pos.row, pos.col);
      }
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
    this.ui.showDiceOrderSection(this.players[0].name);
  }

  handleDiceRollForOrder(result) {
    if (this.currentRollingPlayer >= this.players.length) return;

    const currentPlayer = this.players[this.currentRollingPlayer];
    if (!currentPlayer) return;

    this.diceResults.push({
      playerIndex: this.currentRollingPlayer,
      playerName: currentPlayer.name,
      result: result,
    });

    this.ui.updateDiceResults(this.diceResults);
    this.currentRollingPlayer++;

    if (this.currentRollingPlayer < this.players.length) {
      const nextPlayer = this.players[this.currentRollingPlayer];
      if (nextPlayer) {
        setTimeout(() => {
          this.ui.showNextPlayerRoll(nextPlayer.name);
        }, 1000);
      } else {
        this.determinePlayOrder();
      }
    } else {
      setTimeout(() => {
        this.determinePlayOrder();
      }, 1000);
    }
  }

  determinePlayOrder() {
    this.diceResults.sort((a, b) => {
      if (b.result !== a.result) {
        return b.result - a.result;
      }
      return a.playerIndex - b.playerIndex;
    });

    this.currentTurnFirstPlayer = this.diceResults[0].playerIndex;
    this.currentPlayerIndex = this.currentTurnFirstPlayer;

    this.ui.showFinalOrder(this.diceResults, () =>
      this.ui.triggerGameStart()
    );
  }

  startActualGame() {
    this.gameState = "playing";
    this.playersWhoPlayed = [];
    this.startTurn();
  }

  startNewRound() {
    this.roundNumber++;
    this.playersWhoPlayed = [];
    this.startOrderDetermination();
  }

  startTurn() {
    const currentPlayer = this.getCurrentPlayer();

    if (!currentPlayer) return;

    if (!currentPlayer.isAlive()) {
      this.nextPlayer();
      return;
    }

    currentPlayer.updateCooldown();

    setTimeout(() => {
      if (currentPlayer.name.includes("PC")) {
        this.ui.startPlayerTurn(currentPlayer);
        this.ui.disablePlayerInteractions();

        setTimeout(() => {
          this.playAITurn();
        }, this.actionDelay);
      } else {
        this.ui.startPlayerTurn(currentPlayer);
        this.ui.enablePlayerInteractions();
      }
    }, 500);
  }

  handleActionSelection(action) {
    this.selectedAction = action;
    const currentPlayer = this.getCurrentPlayer();

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
      this.ui.showMessage(
        "Déplacement impossible",
        "Aucune case accessible pour le déplacement."
      );
      return;
    }

    this.ui.highlightAccessibleCells(accessibleCells);
  }

  handleAttackAction(player) {
    const targets = this.arena.getAttackableTargets(player);

    if (targets.length === 0) {
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

    this.ui.highlightAttackableTargets(targets);
  }

  handleSpecialAction(player) {
    if (!player.canUseSpecial()) {
      this.ui.showMessage(
        "Pouvoir indisponible",
        `Le pouvoir spécial sera disponible dans ${player.specialCooldown} tour(s).`
      );
      return;
    }

    if (player.heroType === "chevalier") {
      const targets = this.arena.getAttackableTargets(player);
      if (targets.length === 0) {
        this.ui.showMessage(
          "Pouvoir impossible",
          "Le Chevalier doit être adjacent à une cible pour utiliser son Cri de Guerre."
        );
        return;
      }
    }

    if (player.heroType === "sorcier") {
      const plusZone = this.arena.getPlusShapedZone(player.position.row, player.position.col, 3);
      this.ui.highlightPlusZone(plusZone);
      this.executeSpecialPower(player);
      return;
    }

    this.executeSpecialPower(player);
  }

  handleDefendAction(player) {
    const defenseValue = player.heroType === "chevalier" ? 10 : 5;
    player.defend(defenseValue);
    this.ui.showMessage(
      "Défense activée",
      `${player.name} se met en position défensive.\nLes dégâts du prochain tour seront réduits de ${defenseValue} points.`,
      () => this.endTurn()
    );
  }

  handleDodgeAction(player) {
    if (!player.canDodge()) {
      this.ui.showMessage(
        "Action impossible",
        "Seul le ninja peut utiliser l'esquive."
      );
      return;
    }

    const diceRoll = Math.floor(Math.random() * 6) + 1;
    const success = diceRoll >= 4;

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

    if (action === "move") {
      this.executeMove(currentPlayer, row, col);
    } else if (action === "attack") {
      const targetCell = this.arena.getCellAt(row, col);
      const target = targetCell ? targetCell.player : null;

      if (!target) {
        this.ui.showMessage(
          "Attaque impossible",
          "Aucune cible à cette position."
        );
        return;
      }

      const isAttackable = this.ui.attackableTargets.includes(target);

      if (!isAttackable) {
        let message = "Cette cible n'est pas à portée d'attaque.";
        
        if (currentPlayer.heroType === "ninja") {
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

      if (currentPlayer.heroType === "ninja") {
        const deltaRow = row - currentPlayer.position.row;
        const deltaCol = col - currentPlayer.position.col;
        const distance = Math.abs(deltaRow) + Math.abs(deltaCol);

        if (distance > 1) {
          const attackPosition = this.arena.getNinjaAttackPosition(
            currentPlayer.position.row,
            currentPlayer.position.col,
            row,
            col
          );

          if (!attackPosition) {
            this.ui.showMessage(
              "Attaque impossible",
              "Le chemin vers la cible est bloqué. Le Ninja a besoin d'un chemin libre pour se déplacer et attaquer."
            );
            return;
          }

          const moveSuccess = this.arena.movePlayer(
            currentPlayer,
            attackPosition.row,
            attackPosition.col
          );

          if (!moveSuccess) {
            this.ui.showMessage(
              "Attaque impossible",
              "Le Ninja ne peut pas atteindre une position d'attaque valide. Vérifiez que le chemin est libre."
            );
            return;
          }

          this.ui.updateArenaDisplay(this.arena);
        }
      }

      this.executeAttack(currentPlayer, target);
      
      this.ui.clearHighlights();
      this.ui.updateArenaDisplay(this.arena);
      
      if (this.checkGameEnd()) {
        this.endGame();
      } else {
        this.endTurn();
      }
    }
  }

  executeMove(player, row, col) {
    const isAccessible = this.ui.accessibleCells.some(
      (cell) => cell.row === row && cell.col === col
    );

    if (!isAccessible) {
      this.ui.showMessage(
        "Case non accessible",
        "Cette case n'est pas accessible selon les règles de déplacement de votre héros."
      );
      return;
    }

    const moveSuccess = this.arena.movePlayer(player, row, col);

    if (moveSuccess) {
      this.ui.updateArenaDisplay(this.arena);
      this.ui.clearHighlights();

      const logMessage = `🚶 ${player.name} se déplace vers (${row + 1}, ${col + 1})`;
      console.log(logMessage);
      this.ui.addLogEntry(logMessage);
      
      this.ui.showMessage(
        "Déplacement réussi",
        `${player.name} s'est déplacé vers la position (${row + 1}, ${col + 1}).`,
        () => this.endTurn()
      );
    } else {
      this.ui.showMessage(
        "Déplacement échoué",
        "Le déplacement n'a pas pu être effectué. Veuillez réessayer."
      );
    }
  }

  executeAttack(attacker, target) {
    if (!attacker || !target) return false;

    this.ui.showDiceRollAnimation(() => {
      const diceRoll = Math.floor(Math.random() * 6) + 1;
      let damage = 0;

      switch (diceRoll) {
        case 1:
        case 2:
          damage = 0;
          break;
        case 3:
        case 4:
        case 5:
          damage = 15;
          break;
        case 6:
          damage = 30;
          break;
      }

      target.takeDamage(damage);
      const logMessage = `⚔️ ${attacker.name} inflige ${damage} dégâts à ${target.name} (Dé: ${diceRoll})`;
      console.log(logMessage);
      this.ui.addLogEntry(logMessage);
      
      let message = `🎲 Dé: ${diceRoll}\n\n`;
      if (damage > 0) {
        message += `${attacker.name} inflige ${damage} dégâts à ${target.name}`;
      } else {
        message += `${attacker.name} rate son attaque !`;
      }

      this.ui.showMessage("Résultat de l'attaque", message);

      if (!target.isAlive()) {
        const eliminationMessage = `💀 ${target.name} a été éliminé !`;
        console.log(eliminationMessage);
        this.ui.addLogEntry(eliminationMessage);
        this.ui.showMessage("Élimination", eliminationMessage);
      }

      this.ui.updateArenaDisplay(this.arena);
    });

    return true;
  }

  executeSpecialPower(player) {
    if (!player.useSpecial()) return;

    this.ui.showDiceRollAnimation(() => {
      const diceRoll = Math.floor(Math.random() * 6) + 1;
      let message = `✨ ${player.name} utilise son pouvoir spécial !\n\n`;
      let success = false;

      switch (player.heroType) {
        case "chevalier":
          success = diceRoll >= 3;
          message += `🎲 Dé: ${diceRoll}\n\n`;
          if (success) {
            const targets = this.arena.getAttackableTargets(player);
            if (targets.length > 0) {
              const target = targets[0];
              const damage = 45;
              target.takeDamage(damage);
              const logMessage = `⚔️ ${player.name} inflige ${damage} dégâts à ${target.name} (Cri de Guerre)`;
              console.log(logMessage);
              this.ui.addLogEntry(logMessage);
              this.ui.updateArenaDisplay(this.arena);
              
              if (!target.isAlive()) {
                const eliminationMessage = `💀 ${target.name} a été éliminé !`;
                console.log(eliminationMessage);
                this.ui.addLogEntry(eliminationMessage);
                message += `\n${eliminationMessage}`;
              }
            }
          } else {
            message += "❌ Le Cri de Guerre échoue !";
          }
          break;

        case "ninja":
          success = diceRoll >= 4;
          message += `🎲 Dé: ${diceRoll}\n\n`;
          if (success) {
            const targets = this.arena.getAttackableTargets(player);
            if (targets.length > 0) {
              const target = targets[0];
              let damage = 0;

              switch (diceRoll) {
                case 1:
                case 2:
                  damage = 0;
                  break;
                case 3:
                case 4:
                case 5:
                  damage = 15;
                  break;
                case 6:
                  damage = 30;
                  break;
              }

              target.takeDamage(damage);
              target.takeDamage(damage);
              
              const logMessage = `⚔️ ${player.name} inflige ${damage * 2} dégâts à ${target.name} (Double attaque - Dé: ${diceRoll})`;
              console.log(logMessage);
              this.ui.addLogEntry(logMessage);
              
              if (!target.isAlive()) {
                const eliminationMessage = `💀 ${target.name} a été éliminé !`;
                console.log(eliminationMessage);
                this.ui.addLogEntry(eliminationMessage);
                message += `\n${eliminationMessage}`;
              }
              
              this.ui.updateArenaDisplay(this.arena);
            }
          } else {
            message += "❌ La Double attaque échoue !";
          }
          break;

        case "sorcier":
          const plusZone = this.arena.getPlusShapedZone(player.position.row, player.position.col, 3);
          const affectedTargets = this.arena.getPlayersInZone(plusZone);
          
          if (affectedTargets.length > 0) {
            affectedTargets.forEach((affectedTarget) => {
              if (affectedTarget !== player) {
                const damage = 30;
                affectedTarget.takeDamage(damage);
                const logMessage = `⚔️ ${player.name} inflige ${damage} dégâts à ${affectedTarget.name} (Tempête magique)`;
                console.log(logMessage);
                this.ui.addLogEntry(logMessage);
                
                if (!affectedTarget.isAlive()) {
                  const eliminationMessage = `💀 ${affectedTarget.name} a été éliminé !`;
                  console.log(eliminationMessage);
                  this.ui.addLogEntry(eliminationMessage);
                  message += `\n${eliminationMessage}`;
                }
              }
            });
          } else {
            message += "❌ Aucune cible dans la zone d'effet !";
          }
          
          this.ui.updateArenaDisplay(this.arena);
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

    setTimeout(() => {
      const targets = this.arena.getAttackableTargets(aiPlayer);

      if (targets.length > 0) {
        const weakestTarget = targets.reduce((weakest, current) => {
          return current.hp < weakest.hp ? current : weakest;
        }, targets[0]);

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
            }
          }
        }

        this.executeAttack(aiPlayer, weakestTarget);
      } else {
        const accessibleCells = this.arena.getAccessibleCells(aiPlayer);
        
        if (accessibleCells.length > 0) {
          const bestMove = this.findBestMove(aiPlayer, accessibleCells);
          
          if (bestMove) {
            const moveSuccess = this.arena.movePlayer(
              aiPlayer,
              bestMove.row,
              bestMove.col
            );

            if (moveSuccess) {
              this.ui.updateArenaDisplay(this.arena);
              this.ui.showMessage(
                "Déplacement",
                `${aiPlayer.name} se déplace vers la position (${
                  bestMove.row + 1
                }, ${bestMove.col + 1}).`,
                () => this.endTurn()
              );
            } else {
              this.endTurn();
            }
          } else {
            this.endTurn();
          }
        } else {
          this.endTurn();
        }
      }
    }, this.actionDelay);
  }

  findBestMove(player, accessibleCells) {
    const targets = this.players.filter(p => p !== player && p.isAlive());
    if (targets.length === 0) return accessibleCells[0];

    let bestMove = null;
    let shortestDistance = Infinity;

    const validMoves = accessibleCells.filter(cell => {
      const deltaRow = Math.abs(cell.row - player.position.row);
      const deltaCol = Math.abs(cell.col - player.position.col);
      
      if (deltaRow > 0 && deltaCol > 0) return false;
      
      switch (player.heroType) {
        case "chevalier":
          return (deltaRow === 1 && deltaCol === 0) || (deltaRow === 0 && deltaCol === 1);
        case "ninja":
          return (deltaRow === 2 && deltaCol === 0) || (deltaRow === 0 && deltaCol === 2);
        case "sorcier":
          return (deltaRow === 1 && deltaCol === 0) || (deltaRow === 0 && deltaCol === 1);
        default:
          return false;
      }
    });

    if (validMoves.length === 0) return null;

    for (const cell of validMoves) {
      const minDistance = Math.min(
        ...targets.map(target => 
          Math.abs(cell.row - target.position.row) + 
          Math.abs(cell.col - target.position.col)
        )
      );

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
    }

    const alivePlayers = this.arena.getAlivePlayers();
    const alivePlayersWhoPlayed = this.playersWhoPlayed.filter((p) =>
      p.isAlive()
    );

    if (alivePlayersWhoPlayed.length >= alivePlayers.length) {
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

    if (currentOrderIndex === -1) return;

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
        this.startTurn();
        break;
      }

      searchIndex = (searchIndex + 1) % this.clockwiseOrder.length;
      loopCount++;

      if (searchIndex === firstPlayerOrderIndex) {
        break;
      }
    }
  }

  getCurrentPlayer() {
    if (
      this.currentPlayerIndex >= 0 &&
      this.currentPlayerIndex < this.players.length
    ) {
      return this.players[this.currentPlayerIndex];
    }
    return null;
  }

  checkGameEnd() {
    const alivePlayers = this.arena.getAlivePlayers();
    return alivePlayers.length <= 1;
  }

  endGame() {
    this.gameState = "ended";
    const winner = this.arena.getAlivePlayers()[0];

    if (winner) {
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