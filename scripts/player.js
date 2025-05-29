class Player {
  constructor(name, heroType, position) {
    this.name = name;
    this.heroType = heroType;
    this.position = position;
    this.hp = 100;
    this.maxHp = 100;
    this.specialCooldown = 0;
    this.isDefending = false;
    this.minAttackRange = 1;
    this.maxAttackRange = 1;
    this.canAttackDiagonal = false;
    this.canMoveBeforeAttack = false;
    this.moveBeforeAttackRange = 0;
    this.defenseValue = 0;

    // Caractéristiques selon le type de héros
    this.setHeroStats();
  }

  setHeroStats() {
    switch (this.heroType) {
      case "chevalier":
        this.moveRange = 1;
        this.attackRange = 1;
        this.minAttackRange = 1;
        this.maxAttackRange = 1;
        this.attackDamage = 25;
        this.defense = 15;
        this.specialName = "Cri de guerre";
        this.canAttackDiagonal = false;
        this.canMoveBeforeAttack = false;
        break;
      case "ninja":
        this.moveRange = 2;
        this.attackRange = 3;
        this.minAttackRange = 1;
        this.maxAttackRange = 3;
        this.attackDamage = 20;
        this.defense = 5;
        this.specialName = "Double attaque";
        this.canDodge = true;
        this.canAttackDiagonal = false;
        this.canMoveBeforeAttack = true;
        this.moveBeforeAttackRange = 3;
        break;
      case "sorcier":
        this.moveRange = 1;
        this.attackRange = 3;
        this.minAttackRange = 2;
        this.maxAttackRange = 3;
        this.attackDamage = 30;
        this.defense = 3;
        this.specialName = "Tempête magique";
        this.canAttackDiagonal = false;
        break;
    }
  }

  canMove() {
    return true;
  }

  canAttack(targets) {
    return targets && targets.length > 0;
  }

  canUseSpecial() {
    return this.specialCooldown === 0;
  }

  canDefend() {
    return true;
  }

  canDodge() {
    return this.heroType === "ninja";
  }

  takeDamage(damage) {
    let actualDamage = damage;

    if (this.isDefending) {
      actualDamage = Math.max(0, damage - this.defenseValue);
      this.isDefending = false;
      this.defenseValue = 0;
    }

    this.hp = Math.max(0, this.hp - actualDamage);
    return actualDamage;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  defend(defenseValue) {
    this.isDefending = true;
    this.defenseValue = defenseValue;
  }

  useSpecial() {
    if (this.canUseSpecial()) {
      this.specialCooldown = 3;
      return true;
    }
    return false;
  }

  updateCooldown() {
    if (this.specialCooldown > 0) {
      this.specialCooldown--;
    }
  }

  isAlive() {
    return this.hp > 0;
  }

  getImagePath() {
    return `assets/${this.heroType}.png`;
  }

  getStats() {
    return {
      hp: this.hp,
      maxHp: this.maxHp,
      specialCooldown: this.specialCooldown,
      isDefending: this.isDefending,
    };
  }
}

export { Player };
