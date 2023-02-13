import { Entity } from "../canvas-game-engine/modules/core/entity.js";
import { Register } from "../canvas-game-engine/modules/core/register.js";

class Enemy extends Entity {
  static get_sequence(start) {
    start ??= 0;
    return Array.from({ length: 20 }, (_v, i) => i + start);
  }
  static framesToSecs = (frames) => (1 / 60) * frames;

  speed = 90;
  vel = { x: 0, y: 0 };

  currentWaypoint = 0;

  constructor({ spritesheetName, ...opts }) {
    super(opts);
    this.size = { x: 16, y: 16 };
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

  update() {
    if (!this.path) {
      super.update();
      return;
    }
    const [x, y] = this.path[this.currentWaypoint];
    const xDistance = x - this.pos.x;
    const yDistance = y - this.pos.y;
    const angle = Math.atan2(yDistance, xDistance);
    this.vel.x = Math.cos(angle) * this.speed;
    this.vel.y = Math.sin(angle) * this.speed;
    super.update();

    if (Math.round(this.pos.x) === Math.round(x) && Math.round(this.pos.y) === Math.round(y))
      this.currentWaypoint++;
  }
}

export class Enemy_Pitchfork extends Enemy {
  constructor(opts) {
    super({ spritesheetName: "pitchfork_guy", ...opts });
  }
}

Register.entityTypes(Enemy_Pitchfork);
Register.preloadImages("assets/spritesheets/pitchfork_guy.png");
