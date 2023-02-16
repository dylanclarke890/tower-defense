import { Game } from "./canvas-game-engine/modules/core/game.js";
import { Input } from "./canvas-game-engine/modules/core/input.js";
import { EventChain } from "./canvas-game-engine/modules/lib/event-chain.js";
import {
  Algorithm,
  HeuristicType,
} from "./canvas-game-engine/modules/lib/pathfinding/constants.js";
import { Grid } from "./canvas-game-engine/modules/lib/pathfinding/data-structures.js";
import { PathFinder } from "./canvas-game-engine/modules/lib/pathfinding/pathfinder.js";
import {
  Cannon,
  Enemy_Pitchfork,
  MachineGun,
  RPG,
  TurretSelector,
  Waypoint,
} from "./entities/index.js";
import { baseLevel } from "./levels/baseLevel.js";

export class TowerDefenseGame extends Game {
  static MAP_TILE_SIZE = 32;
  /** @type {TurretSelector}  */
  turretSelector;
  /** @type {PathFinder}  */
  pathfinder;
  /** @type {Waypoint[]}  */
  path;
  selected;

  MODE = {
    selectTurret: 0,
    placeTurret: 1,
  };
  mode = this.MODE.selectTurret;

  constructor(opts) {
    super(opts);

    this.loadLevel(baseLevel);
    this.input.bind(Input.KEY.MOUSE1, "action");
    this.input.bind(Input.KEY.Q, "modePlaceTurret");
    this.input.bind(Input.KEY.ESC, "modeSelectTurret");
    this.input.bind(Input.KEY._1, "hotkeyOne");
    this.input.bind(Input.KEY._2, "hotkeyTwo");
    this.input.bind(Input.KEY._3, "hotkeyThree");

    this.pathfinder = new PathFinder({
      algorithm: Algorithm.AStar,
      heuristic: HeuristicType.Octile,
      allowDiagonal: true,
    });

    const grid = new Grid({ matrix: this.collisionMap.data });
    const pathMatrix = this.pathfinder.findPath(0, 3, 0, 16, grid, true);
    this.path = pathMatrix.map(([x, y]) =>
      this.spawnEntity(
        Waypoint,
        x * TowerDefenseGame.MAP_TILE_SIZE,
        y * TowerDefenseGame.MAP_TILE_SIZE
      )
    );

    this.turretSelector = this.spawnEntity(TurretSelector, this.input.mouse.x, this.input.mouse.x);
    this.turretSelector.setSelected(MachineGun, false);

    this.chain = new EventChain()
      .wait(3)
      .then(() => this.spawnEntity(Enemy_Pitchfork, -50, 96, { targets: this.path }))
      .repeat();
  }

  action() {
    switch (this.mode) {
      case this.MODE.placeTurret: {
        if (!this.turretSelector.isValidPosition) return;
        const { x, y } = this.turretSelector.selected.pos;
        this.spawnEntity(this.turretSelector.turretType, x, y);
        return;
      }
      case this.MODE.selectTurret: {
        if (this.selected == null) return;
        if (!this.selected.anyClickablesInFocus()) {
          this.selected.range.show = false;
          this.selected = null;
        }
        return;
      }
      default:
        return;
    }
  }

  draw() {
    super.draw();
    this.drawPath();
  }

  drawPath() {
    const { ctx } = this.system;
    const start = this.path[0];
    ctx.lineWidth = 2;
    ctx.strokeStyle = "orange";
    ctx.beginPath();
    ctx.moveTo(start.pos.x, start.pos.y);
    for (let i = 1; i < this.path.length; i++) {
      const { x, y } = this.path[i].pos;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  update() {
    this.handleInput();
    this.chain.update();
    super.update();
  }

  enterMode(mode) {
    switch (mode) {
      case this.MODE.selectTurret:
        this.mode = this.MODE.selectTurret;
        this.turretSelector.selected._clickableIgnore = true;
        break;
      case this.MODE.placeTurret:
        this.mode = this.MODE.placeTurret;
        this.turretSelector.selected._clickableIgnore = false;
        break;
      default:
        break;
    }
  }

  handleInput() {
    this.turretSelector.setPosition(this.input.mouse);

    // Mode change hotkeys
    if (this.input.pressed("modeSelectTurret")) {
      this.enterMode(this.MODE.selectTurret);
      console.log("selected");
    } else if (this.input.pressed("modePlaceTurret")) this.enterMode(this.MODE.placeTurret);

    if (this.input.pressed("action")) this.action();

    // Turret select hotkeys
    if (this.input.pressed("hotkeyOne")) this.turretSelector.setSelected(MachineGun);
    else if (this.input.pressed("hotkeyTwo")) this.turretSelector.setSelected(Cannon);
    else if (this.input.pressed("hotkeyThree")) this.turretSelector.setSelected(RPG);
  }
}
