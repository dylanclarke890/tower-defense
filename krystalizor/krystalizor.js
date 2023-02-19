import { GameLoop } from "../canvas-game-engine/modules/core/loop.js";
import { Canvas } from "./canvas.js";
import { config } from "./config.js";
import { KrystalizorHttpClient } from "./http-client.js";
import { System } from "./system.js";
import { ConfirmModal, Modal } from "./ui.js";

export class Krystalizor {
  constructor() {
    this.system = new System();
    this.canvas = new Canvas(this.system);
    this.game = this.canvas; // for game loop
    this.loop = new GameLoop({ runner: this });
    this.loop.start();
    this.initModals();
    new KrystalizorHttpClient().api
      .browse(config.levels.directory, "scripts")
      .then((res) => console.log(res));
  }

  initModals() {
    const saveBody = "<p>Save Content?</p>";
    const loadBody = "Load Level?";
    new Modal({
      id: "modal-save-as",
      title: "Save As",
      body: saveBody,
      buttonIds: ["level-save-as"],
    });
    new ConfirmModal({
      id: "modal-load-level",
      title: "Load Level",
      body: loadBody,
      buttonIds: ["level-load"],
      onCancel: () => console.log("Test cancel"),
    });
  }
}