let defaultOptions = {
  x: 1200,
  y: 600,

  antialiasing: true,
  transparent: true,

  backgroundColor: 0x0,
  stats: false, // whether to show fps stats

  setup: (game) => {},
  loop: (game, deltaTime, totalTime, controls) => {},

  keyDown: (game, key, keyEvent) => {},
  keyUp: (game, key, keyEvent) => {},

  swipe: (game, event) => {},
  tap: (game, event) => {},
  doubletap: (game, event) => {},
  press: (game, event) => {},

  alwaysShowGameScene: true,
  eventsOnlyDuringGame: true,

  compareScore: (a, b) => {
    return a > b;
  },
  blurGameWhenInactive: true,

  use3D: false,
  fov: 75,
  zNear: 0.1,
  zFar: 1000,
  defaultLights: false,
};

class Scene extends PIXI.Container {
  constructor(opts) {
    opts = opts || {};
    super(opts);
    if (opts.sortableChildren != false) this.sortableChildren = true;
    this.interactiveChildren = false;
  }
  add(child) {
    if (child.isSprite == undefined) {
      child = new Shape(child);
    }
    this.addChild(child);
  }
  addChild(child) {
    if (child.isSprite == undefined) {
      child = new Shape(child);
    }
    super.addChild(child);
  }
}

class AnimatedContainer extends PIXI.Container {
  static addFilesToLoader(opts, loader) {
    opts = opts || {};

    if (opts.preset) {
      opts = Helper.mergeDicts(opts, characterPresets[opts.preset]);
    }

    for (let key of Object.keys(opts.animations)) {
      let animation = opts.animations[key];
      if (animation.folder == undefined) animation.folder = opts.folder;
      animation.name = AnimatedContainer.makeAnimationName(opts.name, key);
      AnimatedSprite.addFilesToLoader(animation, loader);
    }
  }

  static makeAnimationName(name, key) {
    return name + "-" + key;
  }

  constructor(opts, resources) {
    super();

    opts = opts || {};

    this.reversed = false;

    if (opts.preset) {
      opts = Helper.mergeDicts(opts, characterPresets[opts.preset]);
    }

    this._speed = 1;
    this.currentAnimation = opts.start;
    this.animations = {};
    this.availableAnimations = [];

    for (const key of Object.keys(opts.animations)) {
      let data = opts.animations[key];
      data.name = AnimatedContainer.makeAnimationName(opts.name, key);

      if (data.animationSpeed == undefined)
        data.animationSpeed = opts.animationSpeed;
      let sprite = new AnimatedSprite(data, resources);
      sprite.visible = false;
      if (opts.scale) sprite.scale.set(opts.scale);
      this.addChild(sprite);

      this.animations[key] = sprite;
      this.availableAnimations.push(key);
    }
    if (opts.state) this.state = opts.state;
    if (opts.speed) this.speed = opts.speed;

    this.opts = opts;
  }

  reverse() {
    this.reversed = !this.reversed;
    this.scale.x = -this.scale.x;
  }

  get state() {
    return this.currentAnimation;
  }
  set state(s) {
    this.show(s);
  }

  set speed(s) {
    let mult = s / this._speed;
    for (let child of this.children) {
      //console.log(child);
      child.animationSpeed *= mult;
    }
    this._speed = s;
  }

  show(key) {
    if (this.currentAnimation == key) return;
    if (this.animations[key] == undefined) return;

    if (
      this.currentAnimation != undefined &&
      this.animations[this.currentAnimation]
    ) {
      this.animations[this.currentAnimation].visible = false;
    }

    this.currentAnimation = key;
    this.animations[key].visible = true;
    this.animations[key].gotoAndPlay(0);
  }
}

class AnimatedSprite extends PIXI.AnimatedSprite {
  static addFilesToLoader(opts, loader) {
    opts = opts || {};

    if (opts.preset) {
      opts = Helper.mergeDicts(opts, animatedPresets[opts.preset]);
    }

    let name = opts.name;

    // load just one file (spritesheet or tilesheet)
    if (opts.file) {
      loader.add(name, (opts.folder || "") + opts.file);
    } else if (opts.files) {
      // otherwise load multiple files from array
      opts.files.forEach((file, index) => {
        if (opts.countMod) index = opts.countMod(index);
        loader.add(name + index, file);
      });
    } else if (opts.count && opts.folder) {
      // load multiple files from folder
      let fileStart = opts.fileStart || "";
      let fileEnd = opts.fileEnd || "";
      for (let i = 0; i < opts.count; i++) {
        if (opts.countMod) i = opts.countMod(i);
        loader.add(name + i, opts.folder + fileStart + i + fileEnd);
      }
    } else {
      console.warn("cannot load animation with given data:", opts);
    }
  }

  static splitTexture(baseTex, num, vertical) {
    let w = baseTex.width,
      h = baseTex.height;
    let sw = vertical != true ? w / num : w,
      sh = vertical != true ? h : h / num;
    let textures = [];
    for (let i = 0; i < num; i++) {
      let rect =
        vertical != true
          ? new PIXI.Rectangle(sw * i, 0, sw, sh)
          : new PIXI.Rectangle(0, sh * i, sw, sh);
      textures.push(new PIXI.Texture(baseTex, rect));
    }
    return textures;
  }

  constructor(opts, resources) {
    opts = opts || {};
    let name = opts.name;

    if (opts.preset) {
      opts = Helper.mergeDicts(opts, animatedPresets[opts.preset]);
    }

    let textures;
    // animation from just one file (tilesheet or spritesheet)
    if (opts.file) {
      if (opts.split) {
        // TILESHEET
        let baseTexture = resources[name].texture.baseTexture;
        textures = AnimatedSprite.splitTexture(
          baseTexture,
          opts.split,
          opts.vertical
        );
      } else {
        // SPRITESHEET
        if (opts.names) {
        }
      }
    } else {
      // animation from multiple files
      let count = opts.files != undefined ? opts.files.length : opts.count;
      textures = [];
      for (let i = 0; i < count; i++) {
        if (opts.countMod) i = opts.countMod(i);
        textures.push(resources[name + i].texture);
      }
    }
    super(textures);

    this.name = name;
    this.animationSpeed = opts.animationSpeed || 1;
    this.visible = opts.show != undefined ? opts.show : true;
    this.anchor.set(0.5);

    if (opts.loop != undefined) this.loop = opts.loop;
    if (opts.tint) this.tint = opts.tint;
  }
}

class ParallaxBackground {
  static addFilesToLoader(opts, loader) {
    if (opts == undefined || loader == undefined) return;

    let settings;
    if (opts.preset != undefined) {
      let preset = Helper.deepClone(presetBackgrounds[opts.preset]);
      preset.folder = backgroundsPresetFolder + preset.folder;
      let index = opts.index || 0;
      if (index >= preset.count) index = preset.count - 1;

      settings = {
        folder: preset.folder + index + "/",
        num:
          index < preset.layers.length
            ? preset.layers[index]
            : preset.layers[preset.layers.length - 1],
      };
    } else {
      settings = opts;
    }

    for (let i = 1; i <= settings.num; i++) {
      loader.add(
        "bg" + i,
        settings.folder + i + (settings.extension || ".png")
      );
    }
  }

  constructor(resources, opts) {
    opts = opts || {};
    if (opts.preset != undefined) {
      let preset = presetBackgrounds[opts.preset];
      let index = opts.index || 0;
      if (index >= preset.count) index = preset.count - 1;

      opts.num =
        index < preset.layers.length
          ? preset.layers[index]
          : preset.layers[preset.layers.length - 1];
    }

    this.opts = opts;
    this.multiplier = [];
    this.layers = [];
    for (let i = 1; i <= opts.num; i++) {
      let t = resources["bg" + i].texture;
      let bg = new PIXI.TilingSprite(t, t.orig.width, t.orig.height);

      if (opts.tint) {
        bg.tint = opts.tint;
      }

      if (i == 1) {
        this.size = new Vector(t.orig.width, t.orig.height);
      } else {
        this.size.x = Math.min(this.size.x, t.orig.width);
        this.size.y = Math.min(this.size.y, t.orig.height);
      }

      bg.anchor.set(0.5);
      bg.zIndex = i * 100 - opts.num * 100;
      this.layers.push(bg);

      this.multiplier.push(i == 1 ? 0 : Math.pow(opts.pow || 2, i - 1));
    }

    if (this.opts.mult) {
      this.multiplier = this.opts.mult;
    }

    if (opts.size) {
      let ratio = Math.min(
        opts.size.x / this.size.x,
        opts.size.y / this.size.y
      );

      this.mask = new Shape({
        w: this.size.x * ratio,
        h: this.size.y * ratio,
        color: 0xffffff,
      });
      this.mask.zIndex = 0;
      for (let l of this.layers) {
        l.scale.set(ratio);
        l.mask = this.mask;
      }
    }
  }

  addLayers(parent) {
    for (let l of this.layers) {
      parent.addChild(l);
    }
    if (this.mask) parent.addChild(this.mask);
  }

  move(x, y) {
    for (let i = 0; i < this.layers.length; i++) {
      let bg = this.layers[i];
      let mult = this.multiplier[i];
      bg.tilePosition.x += x * mult;
      if (y != undefined) bg.tilePosition.y += y * mult;
    }
  }
}

class Shape extends PIXI.Graphics {
  constructor(opts) {
    super();
    opts = opts || {};

    this.fillColor = opts.color || opts.fill || opts.c || 0;
    this.fillAlpha =
      opts.alpha != undefined
        ? opts.alpha
        : opts.a != undefined
        ? opts.a
        : opts.color == undefined && opts.c == undefined
        ? 0
        : 1;

    this._strokeColor = opts.strokeColor || opts.stroke || 0;
    this.strokeWeight =
      opts.strokeWeight || opts.weight || (opts.noStroke == true ? 0 : 1);
    this.strokeAlpha =
      opts.strokeAlpha ||
      (opts.strokeColor == undefined && opts.stroke == undefined ? 0 : 1);

    this.size = {
      x: opts.width || opts.w || opts.size || opts.s || 10,
      y: opts.height || opts.h || opts.size || opts.s || 10,
    };

    this.shape = opts.shape || "rect";
    this._cornerRadius = opts.cornerRadius || opts.corner || 0;

    this.a = opts.a;
    this.b = opts.b;

    this.redraw();

    this.setPosition(opts.x || 0, opts.y || 0);

    if (opts.text) {
      this._text = new PIXI.Text(opts.text, {
        fontFamily: opts.fontFamily || "pixeloid_sansregular",
        fontSize: opts.textSize || 24,
        fill: opts.textColor != undefined ? opts.textColor : 0xffffff,
        align: opts.textAlign || "center",
      });
      this.textAlign = opts.textAlign || "center";
      this.text = opts.text;

      this.addChild(this._text);
    }

    this.setPosition(opts.x || 0, opts.y || 0);

    this.zIndex = opts.zIndex;

    this.name = opts.name;

    if (opts.parent) opts.parent.addChild(this);

    this.interactive = opts.interactive || false;

    if (opts.tap) this.on("pointertap", (evt) => opts.tap(this, evt));

    if (opts.down) this.on("pointerdown", (evt) => opts.down(this, evt));
    if (opts.up) this.on("pointerup", (evt) => opts.up(this, evt));

    if (opts.over) this.on("pointerover", (evt) => opts.over(this, evt));
    if (opts.out) this.on("pointerout", (evt) => opts.out(this, evt));

    if (this.fillColor == 0) {
      if (this.shape == "rect") {
        this.hitArea = new PIXI.RoundedRectangle(
          -this.size.x / 2,
          -this.size.y / 2,
          this.size.x,
          this.size.y,
          this._cornerRadius
        );
      } else if (this.shape == "circle" || this.shape == "ellipse") {
        this.hitArea = new PIXI.Circle(0, 0, this.size.x / 2, this.size.y / 2);
      }
    }
  }

  set textSize(t) {
    this._text.style.fontSize = t;
    this.updateText();
  }
  get textSize() {
    return this._text.style.fontSize;
  }
  set textColor(c) {
    this._text.style.fill = c;
    this.updateText();
  }
  get textColor() {
    return this._text.style.fill;
  }

  set text(text) {
    this._text.text = text;
    this.updateText();
  }
  get text() {
    return this._text.text;
  }

  updateText() {
    let bounds = this._text.getLocalBounds();
    this._text.position.set(-bounds.width / 2, -bounds.height / 2);
    if (this.textAlign == "right") this._text.position.x = -bounds.width;
    if (this.textAlign == "left") this._text.position.x = 0;
  }

  get cornerRadius() {
    return this._cornerRadius;
  }
  set cornerRadius(cR) {
    this._cornerRadius = cR;
    this.redraw();
  }

  set color(c) {
    this.fillColor = c;
    this.redraw();
  }
  get color() {
    return this.fillColor;
  }
  set fill(c) {
    this.fillColor = c;
    this.redraw();
  }
  get fill() {
    return this.fillColor;
  }

  set stroke(c) {
    this.strokeColor = c;
  }
  get stroke() {
    return this._strokeColor;
  }
  set strokeColor(c) {
    this._strokeColor = c;
    this.redraw();
  }
  get strokeColor() {
    return this._strokeColor;
  }
  set weight(w) {
    this.strokeWeight = w;
    this.redraw();
  }
  get weight() {
    return this.strokeWeight;
    this.redraw();
  }

  set x(x) {
    this.position.x = x;
  }
  get x() {
    return this.position.x;
  }
  set y(y) {
    this.position.y = y;
  }
  get y() {
    return this.position.y;
  }

  set width(w) {
    this.size.x = w;
    this.redraw();
  }
  get width() {
    return this.size.x;
  }
  set height(h) {
    this.size.y = h;
    this.redraw();
  }
  get height() {
    return this.size.y;
  }

  setPosition(x, y) {
    this.position.set(x, y);
  }

  move(x, y) {
    if (x) this.position.x += x;
    if (y) this.position.y += y;
  }

  setStroke(color, weight, alpha) {
    this.strokeColor = color;
    this.strokeWeight = weight;
    this.strokeAlpha = alpha;

    this.redraw();
  }

  redraw() {
    this.clear();

    this.beginFill(this.fillColor, this.fillAlpha);
    this.lineStyle(this.strokeWeight, this._strokeColor, this.strokeAlpha);

    if (this.shape == "rect") {
      if (this._cornerRadius <= 0) {
        this.drawRect(
          -this.size.x / 2,
          -this.size.y / 2,
          this.size.x,
          this.size.y
        );
      } else {
        this.drawRoundedRect(
          -this.size.x / 2,
          -this.size.y / 2,
          this.size.x,
          this.size.y,
          this._cornerRadius
        );
      }
    } else if (this.shape == "circle" || this.shape == "ellipse") {
      this.drawEllipse(0, 0, this.size.x / 2, this.size.y / 2);
    } else if (
      this.shape == "line" &&
      this.a != undefined &&
      this.b != undefined
    ) {
      this.moveTo(this.a.x, this.a.y);
      this.lineTo(this.b.x, this.b.y);
    }
  }
}

class PixiEngine {
  constructor(opts) {
    opts = opts || {};
    this.opts = opts;

    this.size = {
      x: opts.width || opts.w || opts.size || 800,
      y: opts.height || opts.h || opts.size || 400,
    };
    opts.px = this;

    this.loadFonts();
    if (opts.fps) this.fps = opts.fps;
  }

  loadFonts() {
    var observers = [];

    this.fonts = {
      pixeloid_sansregular:
        "url(https://1florki.github.io/pixi-scaffold-test/resources/fonts/pixeloidsans.woff)",
    };

    this.fonts = Helper.mergeDicts(this.fonts, this.opts.fonts);

    for (let k of Object.keys(this.fonts)) {
      var fontface = new FontFace(k, this.fonts[k]);
      document.fonts.add(fontface);
      observers.push(new FontFaceObserver(k).load());
    }

    Promise.all(observers)
      .then(() => {
        this.load();
      })
      .catch((err) => {
        console.warn("Some critical font are not available:", err);
      });
  }

  load() {
    let loader = PIXI.Loader.shared;

    if (this.opts.background != undefined) {
      ParallaxBackground.addFilesToLoader(this.opts.background, loader);
    }

    if (this.opts.characters != undefined) {
      this.characters = [];
      for (const char of this.opts.characters) {
        AnimatedContainer.addFilesToLoader(char, loader);
        this.characters.push(char);
      }
    }
    if (this.opts.images != undefined) {
      for (const key of Object.keys(this.opts.images)) {
        loader.add(key, this.opts.images[key]);
      }
    }

    loader.load((loader, resources) => {
      this.resources = resources;
      this.setup();
    });
  }

  setup() {
    // setup app and root container
    //PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR;
    //PIXI.settings.ROUND_PIXELS = false
    let appOpts = {
      antialiasing:
        this.opts.antialiasing != undefined
          ? this.opts.antialiasing
          : defaultOptions.antialiasing,
      transparent:
        this.opts.transparent != undefined
          ? this.opts.transparent
          : defaultOptions.transparent,
      resolution: window.devicePixelRatio || 1,
    };

    this.app = new PIXI.Application(appOpts);

    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    this.app.view.style.left = "0px";
    this.app.view.style.top = "0px";
    document.body.appendChild(this.app.view);

    this.root = new PIXI.Container();
    this.app.stage.addChild(this.root);

    this.resize();

    // setup RNG and noise
    this._seed = this.opts.seed || Math.floor(Math.random() * 10000000);
    this.RNG = new Srand(this._seed);

    this._noiseSettings = this.opts.noise || {};
    if (this._noiseSettings.seed == undefined)
      this._noiseSettings.seed = this.random(0, 1000000);

    this._noise = new Noise(this._noiseSettings);

    // setup mask
    let s = new Shape({ w: this.size.x, h: this.size.y, color: 0xffffff });
    this.root.addChild(s);
    this.root.mask = s;

    // setup menu scene, game and game over scene
    this.alwaysShowGameScene = this.opts.alwaysShowGameScene != false;
    this.blurGameWhenInactive = this.opts.blurGameWhenInactive != false;

    this.scenes = {};

    this.title = this.opts.title || "Game";

    this.eventsOnlyDuringGame = this.opts.eventsOnlyDuringGame;
    this.activeSceneName = "menu";

    this.gameScene = new Scene();
    this.addScene("game", this.gameScene);
    this.gameScene.visible = this.alwaysShowGameScene;

    this.menuScene = new Scene();
    this.addScene("menu", this.menuScene);
    if (this.opts.setupMenu) {
      this.scene = "menu";
      this.opts.setupMenu(this);
    } else {
      this.createDefaultMenuScene();
    }

    this.gameOverScene = new Scene();
    this.addScene("gameover", this.gameOverScene);
    if (this.opts.setupGameOver) {
      this.scene = "gameover";
      this.opts.setupGameOver(this);
    } else {
      this.createDefaultGameOverScene();
    }

    if (this.opts.use3D) {
      this.setup3D();
    }

    this.scene = "game";

    // setup background
    this.backgroundColor = this.opts.backgroundColor || 0;
    if (this.opts.background != undefined) {
      if (this.opts.background.size == undefined) {
        this.opts.background.size = this.size;
      }
      if (this.opts.backgroundTint != undefined) {
        this.opts.background.tint = this.opts.backgroundTint;
      }
      this.background = new ParallaxBackground(
        this.resources,
        this.opts.background
      );
      this.background.addLayers(this.game);
    }

    // setup stats
    if (this.opts.stats) {
      this.stats = new Stats();
      document.body.appendChild(this.stats.dom);
    }

    this.totalTime = 0;
    this.frameTime = 0;

    this.setupEvents();

    let ticker = PIXI.Ticker.shared;
    ticker.add(this.loop.bind(this));

    this.highScore = localStorage.getItem("highScore") || 0;
    this.compareScore =
      this.opts.compareScore ||
      ((a, b) => {
        return a > b;
      });

    // setup particle system
    if (this.opts.particles != undefined) {
      this.particleSystem = new ParticleSystem(
        this.opts.particleSettings != undefined
          ? this.opts.particleSettings
          : { maxNum: this.opts.particles }
      );
      this.root.addChild(this.particleSystem.graphic);
    }

    // custom setup stuff
    if (this.opts.setup) {
      this.opts.setup(this);
    }

    this.scene = this.opts.startScene || "menu";
  }

  // GAME LOOP
  loop() {
    if (this.stats) this.stats.update();

    this.controls.gamepads = navigator.getGamepads();

    let dt = PIXI.Ticker.shared.elapsedMS;

    if (this.particleSystem) {
      this.particleSystem.update(dt / 1000.0);
    }

    if (this.opts.loop && this.scene == "game") {
      this.totalTime += dt;

      if (this.fps) {
        this.frameTime += dt;
        if (this.frameTime < 1000 / this.fps) return;
        this.frameTime = 0;
      }
      this.opts.loop(dt, this.totalTime, this.controls, this);

      if (this.three) {
        this.three.renderer.render(this.three.scene, this.three.camera);
        this.three.texture.update();
      }
    }
  }
  set backgroundColor(c) {
    document.body.style.backgroundColor = MathUtils.numberToHexColor(c);
  }

  // EVENTS
  setupEvents() {
    window.addEventListener(
      "resize",
      () => {
        this.resize();
      },
      true
    );

    window.onorientationchange = () => {
      this.resize();
    };

    this.controls = {};
    this.controls.keys = {};

    document.addEventListener(
      "keydown",
      (event) => {
        let k = event.key.toLowerCase();
        this.controls.keys[k] = true;

        if (
          this.opts.keyDown &&
          (this.eventsOnlyDuringGame == false || this.scene == "game")
        ) {
          this.opts.keyDown(k, this, event);
        }
      },
      false
    );

    document.addEventListener(
      "keyup",
      (event) => {
        let k = event.key.toLowerCase();
        this.controls.keys[k] = false;

        if (
          this.opts.keyUp &&
          (this.eventsOnlyDuringGame == false || this.scene == "game")
        ) {
          this.opts.keyUp(k, this, event);
        }
      },
      false
    );

    // document.body registers gestures anywhere on the page
    var hammer = new Hammer(document.body, {
      preventDefault: true,
    });

    if (this.opts.tap) {
      hammer.on("tap", (evt) => {
        this.processEvent(evt);

        if (this.eventsOnlyDuringGame == false || this.scene == "game")
          this.opts.tap(evt, this);
      });
    }
    if (this.opts.doubletap) {
      hammer.on("doubletap", (evt) => {
        this.processEvent(evt);

        if (this.eventsOnlyDuringGame == false || this.scene == "game")
          this.opts.doubletap(evt, this);
      });
    }
    if (this.opts.swipe) {
      hammer.get("swipe").set({
        direction: Hammer.DIRECTION_ALL,
      });
      hammer.on("swipe", (evt) => {
        this.processEvent(evt);

        if (this.eventsOnlyDuringGame == false || this.scene == "game")
          this.opts.swipe(evt, this);
      });
    }
    if (this.opts.pan) {
      hammer.get("pan").set({
        direction: Hammer.DIRECTION_ALL,
      });
      hammer.on("panstart", (evt) => {
        this.processEvent(evt);
        this.panStart = evt.pos;
        evt.isFirst = true;

        if (this.opts.startPan) {
          this.opts.startPan(evt, this);
        }

        this.lastPan = evt;
        if (
          this.opts.pan &&
          (this.eventsOnlyDuringGame == false || this.scene == "game")
        )
          this.opts.pan(evt, this);
      });

      hammer.on("pan", (evt) => {
        this.processEvent(evt);

        if (this.lastPan) {
          evt.lastX = this.lastPan.x;
          evt.lastY = this.lastPan.y;

          evt.moveX = evt.x - evt.lastX;
          evt.moveY = evt.y - evt.lastY;
        }
        if (
          this.opts.pan &&
          (this.eventsOnlyDuringGame == false || this.scene == "game")
        )
          this.opts.pan(evt, this);
        this.lastPan = evt;
      });

      hammer.on("panend", (evt) => {
        this.processEvent(evt);

        if (this.lastPan) {
          evt.lastX = this.lastPan.x;
          evt.lastY = this.lastPan.y;

          evt.moveX = evt.x - evt.lastX;
          evt.moveY = evt.y - evt.lastY;
        }
        if (
          this.opts.endPan &&
          (this.eventsOnlyDuringGame == false || this.scene == "game")
        ) {
          this.opts.endPan(evt, this);
        }

        this.panStart = undefined;
        this.lastPan = undefined;
      });
    }
    if (this.opts.pinch) {
      hammer.get("pinch").set({
        enable: this.opts.pinch != undefined,
      });

      hammer.on("pinch", (evt) => {
        this.processEvent(evt);

        if (this.eventsOnlyDuringGame == false || this.scene == "game")
          this.opts.pinch(evt, this);
      });
    }
    if (this.opts.rotate) {
      hammer.get("rotate").set({
        enable: this.opts.rotate != undefined,
      });

      hammer.on("rotate", (evt) => {
        this.processEvent(evt);

        if (this.eventsOnlyDuringGame == false || this.scene == "game")
          this.opts.rotate(evt, this);
      });
    }
  }
  processEvent(evt) {
    evt.pos = this.convertPositionToCanvas(evt.center);
    evt.x = evt.pos.x;
    evt.y = evt.pos.y;
  }

  // SCALING
  convertPositionToCanvas(posOrX, y) {
    if (typeof posOrX == "number") {
      return this.root.toLocal({
        x: posOrX / window.devicePixelRatio,
        y: y / window.devicePixelRatio,
      });
    }
    return this.root.toLocal({
      x: posOrX.x / window.devicePixelRatio,
      y: posOrX.y / window.devicePixelRatio,
    });
  }
  resize() {
    let w = window.innerWidth / window.devicePixelRatio;
    let h = window.innerHeight / window.devicePixelRatio;
    this.scl = Math.min(w / this.size.x, h / this.size.y);
    this.scale = this.scl;

    //this part resizes the canvas but keeps ratio the same
    this.app.renderer.resize(w, h);

    this.root.transform.position.set(w * 0.5, h * 0.5);
    this.root.transform.scale.set(this.scl, this.scl);
  }

  // PARTICLES
  spawnParticles(opts) {
    if (opts.count != undefined && opts.count > 1) {
      for (let i = 0; i < opts.count; i++) {
        let optsCopy = {};
        for (let k of Object.keys(opts)) {
          if (typeof opts[k] === "function") {
            optsCopy[k] = opts[k](this);
          } else {
            optsCopy[k] = opts[k];
          }
        }
        this.spawnParticle(optsCopy);
      }
    } else {
      this.spawnParticle(opts);
    }
  }
  spawnParticle(opts) {
    if (this.particleSystem == undefined) return;

    this.particleSystem.add(opts);
  }
  spawn(opts) {
    this.spawnParticles(opts);
  }

  // SCENES
  createDefaultMenuScene() {
    this.scene = "menu";

    this.add({
      w: this.w,
      h: this.h,
      color: 0,
      alpha: 0.4,
    });
    this.add({
      text: this.title,
      y: -this.size.y * 0.2,
      textColor: 0xffffff,
      textSize: 75,
    });
    this.add({
      text: "start",
      textColor: 0xffffff,
      stroke: 0xffffff,
      w: 180,
      h: 65,
      y: 100,
      textSize: 30,
      strokeWeight: 2,
      alpha: 0.6,
      interactive: true,
      tap: () => {
        this.scene = "game";
      },
      down: (s) => {
        s.fill = 0xffffff;
        s.textColor = 0;
      },
      over: (s) => {
        s.fill = 0x333333;
        s.textColor = 0xcccccc;
      },
      out: (s) => {
        s.fill = 0;
        s.textColor = 0xffffff;
      },
    });

    this.add({
      text: "fullscreen",
      textColor: 0xffffff,
      stroke: 0xffffff,
      w: 220,
      h: 65,
      y: 200,
      textSize: 30,
      strokeWeight: 2,
      alpha: 0.6,
      interactive: true,
      tap: () => {
        this.toggleFullscreen();
      },
      down: (s) => {
        s.fill = 0xffffff;
        s.textColor = 0;
      },
      over: (s) => {
        s.fill = 0x333333;
        s.textColor = 0xcccccc;
      },
      out: (s) => {
        s.fill = 0;
        s.textColor = 0xffffff;
      },
    });

    if (this.opts.help) {
      this.add({
        text: this.opts.help,
        y: this.size.y * 0.25,
        textSize: 12,
      });
    }
  }
  createDefaultGameOverScene() {
    this.scene = "gameover";

    this.add({
      w: this.w,
      h: this.h,
      color: 0,
      alpha: 0.5,
    });
    this.add({
      text: "Game Over! :(",
      y: -140,
      textColor: 0xffffff,
      textSize: 45,
    });

    this.add({
      text: "play again",
      textColor: 0xffffff,
      stroke: 0xffffff,
      w: 220,
      h: 65,
      y: 0,
      textSize: 30,
      strokeWeight: 2,
      alpha: 0.6,
      interactive: true,
      tap: () => {
        this.scene = "game";
      },
      down: (s) => {
        s.fill = 0xffffff;
        s.textColor = 0;
      },
      over: (s) => {
        s.fill = 0x333333;
        s.textColor = 0xcccccc;
      },
      out: (s) => {
        s.fill = 0;
        s.textColor = 0xffffff;
      },
    });

    this.add({
      text: "highscore: 0",
      textColor: 0xffffff,
      y: 80,
      textSize: 16,
      name: "highscore",
    });
    this.add({
      text: "score: 0",
      textColor: 0xffffff,
      y: 110,
      textSize: 16,
      name: "score",
    });
    this.add({
      text: "new highscore!",
      textColor: 0xff0000,
      y: 150,
      textSize: 25,
      name: "newhighscore",
    });
  }
  addScene(name, scene) {
    this.scenes[name] = scene;
    this.root.addChild(scene);
  }
  switch(scene) {
    this.switchToScene(scene);
  }
  switchToScene(scene) {
    this.activeScene.visible = false;
    this.activeScene.interactiveChildren = false;

    if (this.scene == "game") {
      this.activeScene.visible = this.alwaysShowGameScene;
      if (this.blurGameWhenInactive) {
        if (this.filters) this.filters.push(new blur({ blur: 1 }));
        else this.filters = [new blur({ blur: 1 })];
      }
    }

    this.activeSceneName = scene;
    this.activeScene.visible = true;
    this.activeScene.interactiveChildren = true;

    if (this.scene == "game" && this.blurGameWhenInactive) {
      if (this.filters && this.filters.length > 1) this.filters.pop();
      else this.filters = null;
    }
    return this.activeScene;
  }
  get activeScene() {
    return this.scenes[this.activeSceneName];
  }
  get menu() {
    return this.scenes["menu"];
  }
  get game() {
    return this.scenes["game"];
  }
  get gameOver() {
    return this.scenes["gameOver"];
  }
  get scene() {
    return this.activeSceneName;
  }
  set scene(name) {
    this.switchToScene(name);
  }

  // SCORE
  saveScore() {
    if (this.highScore != undefined && this.score != undefined) {
      if (this.compareScore(this.score, this.highScore)) {
        this.highScore = this.score;
        localStorage.setItem("highScore", this.highScore);
        this.getShape("newhighscore").visible = true;
      } else {
        this.getShape("newhighscore").visible = false;
      }
      this.getShape("highscore").text = "highscore: " + this.highScore;
      this.getShape("score").text = "score: " + this.score;
    }
  }

  // SHAPES
  addToScene(name, child) {
    if (child.isSprite == undefined) {
      child = new Shape(child);
    }
    this.scenes[name].addChild(child);
    return child;
  }
  add(child, scene) {
    return this.addToScene(scene || this.scene, child);
  }
  addChild(child, scene) {
    return this.add(child, scene);
  }
  clear(sceneName) {
    let scene =
      sceneName != undefined ? this.scenes[sceneName] : this.activeScene;
    return scene.removeChildren();
  }

  // FILTERS
  get filters() {
    return this.scenes[this.activeSceneName].filters;
  }
  set filters(f) {
    this.scenes[this.activeSceneName].filters = f;
  }

  // SIZE
  get width() {
    return this.size.x;
  }
  get height() {
    return this.size.y;
  }
  get w() {
    return this.size.x;
  }
  get h() {
    return this.size.y;
  }

  // RANDOM
  set noiseSetting(opts) {
    this._noiseSettings = opts || {};
    if (this._noiseSettings.seed == undefined)
      this._noiseSettings.seed = this.random(0, 1000000);

    this._noise = new Noise(this._noiseSettings);
  }
  set seed(seed) {
    this._seed = seed;
    this.RNG.seed(seed);
  }
  get seed() {
    return this._seed;
  }
  noise(x, y, z, arr) {
    if (arr != undefined && arr.length != undefined) {
      let n = Math.floor((this._noise.getNorm(x, y, z) / 2 + 0.5) * arr.length);
      return arr[n];
    }
    return this._noise.get(x, y, z);
  }
  random(a, b) {
    if (a == undefined && b == undefined) {
      return this.RNG.random();
    }
    if (typeof a != "number") {
      return this.RNG.choice(a);
    }

    if (b == undefined) {
      b = a;
      a = 0;
    }
    return this.RNG.inRange(a, b);
  }
  randomInt(a, b) {
    if (b == undefined) {
      b = a;
      a = 0;
    }
    return Math.floor(this.RNG.inRange(a, b));
  }

  // FULLSCREEN
  isFullscreen() {
    return screenfull.isEnabled;
  }
  toggleFullscreen() {
    screenfull.toggle();
  }

  // 3D
  setup3D() {
    var renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    renderer.setClearColor(0x0, 0.0);
    renderer.setSize(this.width, this.height);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(
      this.opts.fov || 75,
      this.width / this.height,
      this.opts.zNear || 0.1,
      this.opts.zFar || 1000
    );

    //    camera.position.z = -70;
    //    camera.lookAt(scene.position);

    // Mesh
    /*
    const geometry = new THREE.IcosahedronGeometry(15, 1);
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
*/
    // Lights
    if (this.opts.defaultLights) {
      var light = new THREE.AmbientLight(0x404040); // Soft white light
      scene.add(light);

      var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(0.9, 0.8, -0.7);
      scene.add(directionalLight);
    }

    var texture = PIXI.BaseTexture.from(renderer.domElement, {
      scaleMode: PIXI.SCALE_MODES.LINEAR,
    });
    var sprite = new PIXI.Sprite.from(new PIXI.Texture(texture));
    sprite.position.set(-this.width / 2, -this.height / 2);
    sprite.zIndex = 0;

    this.scene = "game";
    this.add(sprite);

    this.three = {};
    //this.three.mesh = sphere;
    this.three.renderer = renderer;
    this.three.scene = scene;
    this.three.camera = camera;
    this.three.texture = texture;

    this.three.renderer.render(scene, camera);
  }
}

let RunGame = (opts) => new PixiEngine(opts);
