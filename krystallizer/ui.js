import { BackgroundMap } from "../krystal-games-engine/modules/core/map.js";
import { uniqueId } from "../krystal-games-engine/modules/lib/utils/string.js";
import { config } from "./config.js";

export class Modal {
  /**
   * @param {Object} settings
   * @param {string} settings.id
   * @param {["sm"|"md"|"lg"|"fullscreen"]} settings.size
   * @param {[string]} settings.title
   * @param {[string]} settings.body
   * @param {[string]} settings.footer
   * @param {[string[]]} settings.triggeredBy
   */
  constructor(settings = {}) {
    this.construct(settings);
    this.bindEvents(settings);
  }

  construct({ id, title, body, footer, size }) {
    title = title
      ? `
      <div class="modal-header">
        <span class="modal-close">&times;</span>
        <h2>${title}</h2>
      </div>`
      : "";
    body = body
      ? `
      <div class="modal-body">
        ${body}
      </div>`
      : "";
    footer = footer
      ? `
      <div class="modal-footer">
        ${footer}
      </div>`
      : "";

    const modal = document.createElement("div");
    modal.id = id;
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-content ${size ?? "md"}">
        ${title}
        ${body}
        ${footer}
      </div>`;
    document.body.querySelector("script").before(modal);
    this.modal = modal;
  }

  bindEvents({ triggeredBy }) {
    for (let i = 0; i < triggeredBy.length; i++) {
      const triggers = document.querySelectorAll(triggeredBy[i]);
      if (!triggers || !triggers.length) continue;
      triggers.forEach((trigger) => trigger.addEventListener("click", () => this.open()));
    }

    const closeBtns = this.modal.querySelectorAll(".modal-close");
    for (let i = 0; i < closeBtns.length; i++) {
      const btn = closeBtns[i];
      btn.addEventListener("click", () => this.close());
    }
  }

  open() {
    this.modal.style.display = "block";
    this.outsideClickEvent = (e) => e.target === this.modal && this.close();
    this.keyupEvent = (e) => e.key === "Escape" && this.close();
    window.addEventListener("click", this.outsideClickEvent);
    document.addEventListener("keyup", this.keyupEvent);
  }

  close() {
    this.modal.style.display = "none";
    window.removeEventListener("click", this.outsideClickEvent);
    window.removeEventListener("click", this.keyupEvent);
  }

  destroy() {
    document.body.removeChild(this.modal);
  }
}

export class ConfirmModal extends Modal {
  /**
   * @param {Object} settings
   * @param {string} settings.id
   * @param {[string]} settings.title
   * @param {[string]} settings.body
   * @param {[string[]]} settings.triggeredBy
   * @param {[() => void]} settings.okText
   * @param {[string]} settings.onOk
   * @param {[() => void]} settings.onCancel
   * @param {[string]} settings.cancelText
   */
  constructor(settings = {}) {
    super(settings);
  }

  construct({ id, title, body, okText = "Confirm", cancelText = "Cancel" }) {
    const footer = `
      <div class="panel__actions">
        <button class="btn btn-sm modal-confirm">${okText}</button>
        <button class="btn btn-sm modal-cancel">${cancelText}</button>
      </div>
    `;
    super.construct({ id, title, body, footer });
  }

  bindEvents({ triggeredBy, onOk, onCancel }) {
    super.bindEvents({ triggeredBy });

    const noop = () => null;
    onOk ??= noop;
    onCancel ??= noop;

    const closeBtns = this.modal.querySelectorAll(".modal-close");
    for (let i = 0; i < closeBtns.length; i++) {
      const btn = closeBtns[i];
      btn.addEventListener("click", (e) => onCancel(e));
    }

    const cancelBtn = this.modal.querySelector(".modal-cancel");
    const confirmBtn = this.modal.querySelector(".modal-confirm");

    cancelBtn.addEventListener("click", (e) => {
      onCancel(e);
      this.close();
    });
    confirmBtn.addEventListener("click", (e) => {
      onOk(e);
      this.close();
    });
  }
}

export class SelectLevelModal extends Modal {
  /**
   * @param {Object} settings
   * @param {string} settings.id
   * @param {[string[]]} settings.triggeredBy
   * @param {[string]} settings.onSelect
   */
  constructor(settings = {}, httpClient) {
    super(settings);
    this.httpClient = httpClient;
    this.httpClient.api
      .browse(config.directories.levels, "scripts")
      .then((paths) => this.loadLevels(paths));
    this.selected = null;
  }

  construct({ id }) {
    const body = "Loading...";
    const footer = `
      <div class="panel__actions">
        <button class="btn btn-sm modal-confirm">Select</button>
        <button class="btn btn-sm modal-cancel">Cancel</button>
      </div>
    `;
    super.construct({ id, title: "Load Level", body, footer, size: "lg" });
  }

  /**
   * @param {string[]} paths
   */
  loadLevels(paths) {
    const totalToLoad = paths.length;
    let loaded = 0;
    const levels = [];
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      this.httpClient.api.file(path, { parseResponse: false }).then((data) => {
        levels.push({ path, data: this.parseData(data) });
        if (++loaded === totalToLoad) this.updateLevels(levels);
      });
    }
  }

  parseData(data) {
    if (!data) {
      console.debug("LevelEditor: parseData - no data provided.");
      return;
    }

    // extract JS object from level data.
    const jsonMatch = data.match(/\/\*JSON-BEGIN\*\/\s?([\s\S]*?);?\s?\/\*JSON-END\*/);
    if (jsonMatch) {
      let json = jsonMatch[1];
      // Some keys may be stored in modern JS format i.e without quotes. Find and replace them.
      const matches = json.match(/(\w+):/g);
      if (matches) {
        matches.forEach((v) => {
          // v = match + : - we want it to be "match":
          const match = v.substring(0, v.length - 1);
          json = json.replace(v, `"${match}":`);
        });
      }

      // Remove all trailing commas on arrays and objects.
      json = json.replace(/,(?=\s*[}|\]])/gm, "");

      // Finally, we can parse it:
      data = JSON.parse(json);
    }

    return data;
  }

  updateLevels(levels) {
    this.levels = levels;
    const options = [];
    for (let i = 0; i < levels.length; i++) {
      const { path, data } = levels[i];
      const levelName = path.substring(path.lastIndexOf("/") + 1);
      const levelOption = document.createElement("div");
      levelOption.className = "level-option";
      levelOption.dataset.path = path;
      levelOption.innerHTML = `
        <img class="level-option__preview loading" src="../krystallizer/assets/loading.svg" >
        <span class="level-option__name">${levelName}</span>`;
      options.push(levelOption);
      this.getLevelPreviewImage(levelOption, data);
    }
    const body = this.modal.querySelector(".modal-body");
    body.innerHTML = "";
    body.append(...options);
    this.bindLevelOptionEvents(options);
  }

  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {*} data
   * @returns
   */
  getLevelPreviewImage(levelOption, data) {
    const { x, y, ts } = data.layer.reduce(
      (prev, curr) => ({
        x: Math.max(prev.x, curr.width),
        y: Math.max(prev.y, curr.height),
        ts: Math.max(prev.ts, curr.tilesize),
      }),
      { x: 0, y: 0, ts: 0 }
    );
    const w = x * ts;
    const h = y * ts;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = w;
    canvas.height = h;
    canvas.id = uniqueId("test-");

    let currentLayer = 0;
    const bgLayers = data.layer.filter((l) => l.visible && !l.repeat && l.name !== "collision");
    for (let i = 0; i < bgLayers.length; i++) {
      const layer = bgLayers[i];
      const bgMap = new BackgroundMap({
        ...layer,
        system: {
          width: w,
          height: h,
          ctx,
          ready: true,
          scale: 1,
          getImagePixels(image, x, y, width, height) {
            const canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0, width, height);
            return ctx.getImageData(x, y, width, height);
          },
          drawPosition(x) {
            return x;
          },
        },
        autoset: true,
      });
      bgMap.tiles.load(() => {
        bgMap.draw();
        if (++currentLayer >= bgLayers.length) {
          const img = levelOption.querySelector("img");
          img.src = canvas.toDataURL();
          img.classList.remove("loading");
        }
      });
    }
  }

  bindLevelOptionEvents(options) {
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      opt.addEventListener("click", (e) => {
        this.selected = this.levels.find((l) => l.path === opt.dataset.path);
        for (let j = 0; j < options.length; j++)
          options[j].classList.toggle("selected", options[j] === opt);
        if (e.detail === 2) this.close(); //double click
      });
    }
  }

  bindEvents({ triggeredBy, onSelect }) {
    super.bindEvents({ triggeredBy });
    const noop = () => null;
    this.onSelected = onSelect ?? noop;

    const closeBtns = this.modal.querySelectorAll(".modal-close");
    for (let i = 0; i < closeBtns.length; i++) {
      const btn = closeBtns[i];
      btn.addEventListener("click", () => {
        this.selected = null;
        this.close();
      });
    }

    const cancelBtn = this.modal.querySelector(".modal-cancel");
    const confirmBtn = this.modal.querySelector(".modal-confirm");
    cancelBtn.addEventListener("click", () => {
      this.selected = null;
      this.close();
    });
    confirmBtn.addEventListener("click", () => this.close());
  }

  close() {
    this.onSelected(this.selected);
    this.selected = null;
    const options = this.modal.querySelectorAll(".level-option");
    for (let i = 0; i < options.length; i++) options[i].classList.remove("selected");
    super.close();
  }
}
