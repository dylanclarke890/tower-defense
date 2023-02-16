import { Register } from "../canvas-game-engine/modules/core/register.js";
import { EntityMover } from "../canvas-game-engine/modules/lib/entities/mover.js";

export class Enemy extends EntityMover {
  static get_sequence(start) {
    start ??= 0;
    return Array.from({ length: 20 }, (_v, i) => i + start);
  }
  static framesToSecs = (frames) => (1 / 60) * frames;

  maxHealth = 20;
  health = this.maxHealth;
  offset = { x: 32, y: 32 };

  constructor({ spritesheetName, ...opts }) {
    super(opts);
    this.size = { x: 16, y: 16 };
    this.speed = 100;
    this.createAnimationSheet(`assets/spritesheets/${spritesheetName}.png`, { x: 66, y: 58 });

    const defaultDuration = Enemy.framesToSecs(3);
    this.addAnim("attack", defaultDuration, Enemy.get_sequence(0), false);
    this.addAnim("die", defaultDuration, Enemy.get_sequence(20), false);
    this.addAnim("hurt", defaultDuration, Enemy.get_sequence(40), false);
    this.addAnim("idle", defaultDuration, Enemy.get_sequence(60), false);
    this.addAnim("jump", defaultDuration, Enemy.get_sequence(80), false);
    this.addAnim("run", defaultDuration, Enemy.get_sequence(100), false);
    this.addAnim("walk", defaultDuration, Enemy.get_sequence(120), false);
    this.currentAnim = this.anims.walk;
  }

  draw() {
    if (this.vel.x > 0) this.currentAnim.flip.x = false;
    else if (this.vel.x < 0) this.currentAnim.flip.x = true;
    super.draw();
    this.drawHealthBar();
  }

  drawHealthBar() {
    const { ctx } = this.game.system;
    const w = 32,
      h = 5,
      xOffset = -25,
      yOffset = -20;
    ctx.fillStyle = "red";
    ctx.fillRect(this.pos.x + xOffset, this.pos.y + yOffset, w, h);
    ctx.fillStyle = "green";
    ctx.fillRect(this.pos.x + xOffset, this.pos.y + yOffset, w * (this.health / this.maxHealth), h);
  }
}

export class Enemy_Pitchfork extends Enemy {
  constructor(opts) {
    super({ spritesheetName: "pitchfork_guy", ...opts });
  }
}

Register.entityTypes(Enemy_Pitchfork);
Register.preloadImages("assets/spritesheets/pitchfork_guy.png");
