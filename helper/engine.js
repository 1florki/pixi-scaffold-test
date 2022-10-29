let opts = {
  x: 1200,
  y: 600,

  antialiasing: true,
  transparent: true,

  backgroundColor: 0x0, // only effective if transparent is set to false

  stats: true, // whether to show fps stats

  setup: (game) => {},
  loop: (game, deltaTime, totalTime, controls) => {},

  keyDown: (game, key, keyEvent) => {},
  keyUp: (game, key, keyEvent) => {},

  swipe: (game, event) => {},
  tap: (game, event) => {},
  doubletap: (game, event) => {},
  press: (game, event) => {},

  alwaysShowGameScene: true,

  compareScore: (a, b) => {
    return a > b
  }
}

class Shape extends PIXI.Graphics {
  constructor(opts) {
    super();
    opts = opts || {};

    this.fillColor = opts.color || opts.fill || opts.c || 0;
    this.fillAlpha = opts.alpha != undefined ? opts.alpha : (opts.a != undefined ? opts.a : (opts.color == undefined && opts.c == undefined ? 0 : 1));

    this._strokeColor = opts.strokeColor || opts.stroke || 0;
    this.strokeWeight = opts.strokeWeight || opts.weight || (opts.noStroke == true ? 0 : 1);
    this.strokeAlpha = opts.strokeAlpha || (opts.strokeColor == undefined && opts.stroke == undefined ? 0 : 1);

    this.size = {
      x: opts.width || opts.w || opts.size || opts.s || 10,
      y: opts.height || opts.h || opts.size || opts.s || 10
    }

    this.shape = opts.shape || "rect";
    this._cornerRadius = opts.cornerRadius || 0;

    this.redraw();

    this.setPosition(opts.x || 0, opts.y || 0);

    this.tap = opts.tap;
    this.doubletap = opts.doubletap;
    this.press = opts.press;

    if (opts.text) {
      this._text = new PIXI.Text(opts.text, {
        fontFamily: opts.fontFamily || 'pixeloid_sansregular',
        fontSize: opts.textSize || 24,
        fill: opts.textColor || 0xffffff,
        align: opts.textAlign || 'center'
      });
      this.textAlign = opts.textAlign || "center";
      this.text = opts.text;

      this.addChild(this._text);
    }

    this.setPosition(opts.x || 0, opts.y || 0);

    this.zIndex = opts.zIndex;

    this.name = opts.name;

    if (opts.parent) opts.parent.addChild(this);
  }

  set cornerRadius(cR) {
    this._cornerRadius = cR;
    this.redraw();
  }

  set text(text) {
    this._text.text = text;
    let bounds = this._text.getLocalBounds();
    this._text.position.set(-bounds.width / 2, -bounds.height / 2);
    if (this.textAlign == "right") this._text.position.x = -bounds.width;
    if (this.textAlign == "left") this._text.position.x = 0;

  }
  get text() {
    return this._text.text;
  }

  set color(c) {
    this.fillColor = c;
    this.redraw();
  }

  set strokeColor(c) {
    this._strokeColor = c;
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

    if (this.shape == "rect" && this._cornerRadius <= 0) {
      this.drawRect(-this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
    } else if (this.shape == "circle" || this.shape == "ellipse") {
      this.drawEllipse(-this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
    } else if ((this.shape == "rect" && this._cornerRadius > 0) || this.shape == "roundedrect") {
      this.drawRoundedRect(-this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y, this._cornerRadius);
    }
  }

  checkContainsPoint(x, y) {
    return MathUtils.containsPointBox(this.position, this.size, x, y);
  }
}

class PixiScene extends PIXI.Container {
  constructor(opts) {
    super();
    opts = opts || {};
    this.sortableChildren = true
  }

  createShape(opts) {
    return this.addShape(new Shape(opts));
  }

  addShape(s) {
    return this.addChild(s);
  }

  passEvent(evt, evtName, game) {
    let passed = false;

    for (let c of this.children) {
      if (c[evtName] && (c.checkContainsPoint == undefined || c.checkContainsPoint(evt.pos.x, evt.pos.y))) { //b.containsPoint(evt.pos.x, evt.pos.y)) {
        c[evtName](game, evt);
        passed = true;
      }
    }

    return passed;
  }

  getShape(name) {
    for (let c of this.children) {
      if (c.name == name) return c;
    }
  }
}

class PixiEngine {
  constructor(opts) {
    opts = opts || {};
    this.opts = opts;

    this.size = {
      x: opts.width || opts.w || opts.size || 800,
      y: opts.height || opts.h || opts.size || 400
    }


    var face = new FontFace('pixeloid_sansregular', 'url(./pixeloidsans.woff)');
    var font = new FontFaceObserver('pixeloid_sansregular');

    font.load().then(() => {
      this.setup();
    });
  }

  setup() {
    // setup app and root container
    let appOpts = {
      antialiasing: opts.antialiasing != undefined ? opts.antialiasing : true,
      transparent: opts.transparent != undefined ? opts.transparent : true,
      resolution: window.devicePixelRatio || 1,
    }
    if (this.opts.backgroundColor) appOpts.backgroundColor = this.opts.backgroundColor;

    this.app = new PIXI.Application(appOpts);
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    this.app.view.style.left = "0px";
    this.app.view.style.top = "0px";
    document.body.appendChild(this.app.view);

    this.root = new PIXI.Container();
    this.app.stage.addChild(this.root);

    this.centerZero = this.opts.centerZero;

    this.resize();

    // setup RNG and noise
    this._seed = this.opts.seed || Math.floor(Math.random() * 10000000)
    this.RNG = new Srand(this._seed);

    this._noiseSettings = this.opts.noise || {};
    if (this._noiseSettings.seed == undefined) this._noiseSettings.seed = this.random(0, 1000000);

    this._noise = new Noise(this._noiseSettings)

    // setup menu scene and game scene
    this.alwaysShowGameScene = this.opts.alwaysShowGameScene != false
    this.scenes = {};

    this.title = this.opts.title || "Game"

    this.activeSceneName = "menu"

    this.gameScene = new PixiScene();
    this.gameScene.visible = this.alwaysShowGameScene
    this.addScene("game", this.gameScene)

    this.menuScene = new PixiScene();
    this.addScene("menu", this.menuScene);
    if (this.opts.customMenu) {
      this.opts.customMenu(this);
    } else {
      this.createShape({
        w: this.w,
        h: this.h,
        color: 0,
        alpha: 0.5
      })
      this.createShape({
        text: this.title,
        y: -80,
        textColor: 0xffffff,
        textSize: 40
      });
      this.createShape({
        text: "start",
        textColor: 0xffffff,
        stroke: 0xffffff,
        w: 110,
        h: 45,
        textSize: 20,
        tap: (px) => {
          px.game();
        }
      });

      if (this.opts.help) this.createShape({
        text: this.opts.help,
        y: 100,
        textSize: 14
      })
    }

    this.gameOverScene = new PixiScene();
    this.addScene("gameover", this.gameOverScene);
    if (this.opts.customGameOver) {
      this.scene = "gameover"
      this.opts.customGameOver(this);
      this.scene = "menu"
    } 
    else {
      this.scene = "gameover"

      this.createShape({
        w: this.w,
        h: this.h,
        color: 0,
        alpha: 0.5
      })
      this.createShape({
        text: "Game Over! :(",
        y: -80,
        textColor: 0xffffff,
        textSize: 35
      });

      this.createShape({
        text: "play again",
        textColor: 0xffffff,
        stroke: 0xffffff,
        w: 150,
        h: 45,
        textSize: 20,
        tap: (px) => {
          if (px.opts.restart) px.opts.restart(this);
          px.game();
        }
      });

      this.createShape({
        text: "highscore: 0",
        textColor: 0xffffff,
        y: 50,
        textSize: 16,
        name: "highscore"
      });
      this.createShape({
        text: "score: 0",
        textColor: 0xffffff,
        y: 80,
        textSize: 16,
        name: "score"
      });
      this.createShape({
        text: "new highscore!",
        textColor: 0xff0000,
        y: 120,
        textSize: 25,
        name: "newhighscore"
      });

      this.menu();
    }

    // setup stats
    if (this.opts.stats != false) {
      this.stats = new Stats();
      document.body.appendChild(this.stats.dom);
    }

    this.totalTime = 0;

    this.setupEvents();

    let ticker = PIXI.Ticker.shared;
    ticker.add(this.loop.bind(this));

    this.highScore = localStorage.getItem('highScore') || 0;
    this.compareScore = this.opts.compareScore || ((a, b) => {
      return a > b
    });

    // custom setup stuff
    if (this.opts.setup) {
      this.opts.setup(this);
    }
  }

  addScene(name, scene) {
    this.scenes[name] = scene;
    this.root.addChild(scene);
  }

  switchToScene(name) {
    this.activeScene.visible = false;

    if (this.scene == "game") this.activeScene.visible = this.alwaysShowGameScene;

    this.activeSceneName = name;

    this.activeScene.visible = true;

    return this.activeScene;
  }

  menu() {
    this.scene = "menu"
  }

  game() {
    this.scene = "game"
  }

  gameover() {
    this.scene = "gameover"

    if (this.highScore != undefined && this.score != undefined) {
      if (this.compareScore(this.score, this.highScore)) {
        this.highScore = this.score;
        localStorage.setItem("highScore", this.highScore);
        console.log("set high score");
        this.getShape("newhighscore").visible = true
      } else {

        this.getShape("newhighscore").visible = false
      }
      this.getShape("highscore").text = "highscore: " + this.highScore;
      this.getShape("score").text = "score: " + this.score;
    }
  }

  getShape(name) {
    return this.activeScene.getShape(name);
  }

  loop() {
    this.controls.gamepads = navigator.getGamepads();
    let dt = PIXI.Ticker.shared.elapsedMS;
    this.totalTime += dt;

    if (this.opts.loop) {
      this.opts.loop(this, dt, this.totalTime, this.controls);
    }

    if (this.stats) this.stats.update();
  }

  setupEvents() {
    window.addEventListener("resize", () => {
      this.resize();
    }, true);

    window.onorientationchange = () => {
      this.resize();
    }

    this.controls = {};
    this.controls.keys = {};

    document.addEventListener("keydown", (event) => {
      this.controls.keys[event.key] = true;

      if (this.opts.keyDown) {
        this.opts.keyDown(this, event.key.toLowerCase(), event);
      }
    }, false);


    document.addEventListener("keyup", (event) => {
      this.controls.keys[event.key] = false;

      if (this.opts.keyUp) {
        this.opts.keyUp(this, event.key, event);
      }
    }, false);

    // document.body registers gestures anywhere on the page
    var hammer = new Hammer(document.body, {
      preventDefault: true
    });
    hammer.get('swipe').set({
      direction: Hammer.DIRECTION_ALL
    });
    hammer.get('pan').set({
      direction: Hammer.DIRECTION_ALL
    });

    hammer.on("swipe", (evt) => {
      this.processEvent(evt);

      if (this.opts.swipe) this.opts.swipe(this, evt);
    });
    hammer.on("tap", (evt) => {
      this.processEvent(evt);

      let passed = this.passEvent(evt, "tap");
      if (this.opts.tap) this.opts.tap(this, evt, passed);
    });

    hammer.on("doubletap", (evt) => {
      this.processEvent(evt);

      let passed = this.passEvent(evt, "doubletap");
      if (this.opts.doubletap) this.opts.doubletap(this, evt, passed);
    });
    hammer.on("press", (evt) => {
      this.processEvent(evt);

      let passed = this.passEvent(evt, "press");
      if (this.opts.press) this.opts.press(this, evt, passed);
    });
    hammer.on("pan", (evt) => {
      this.processEvent(evt);

      if (this.opts.pan) this.opts.pan(this, evt);
    });

    hammer.on("panstart", (evt) => {
      this.processEvent(evt);
      this.panStart = evt.pos;
      evt.isFirst = true

      if (this.opts.startPan) {
        this.opts.startPan(this, evt);
      }

      if (this.opts.pan) this.opts.pan(this, evt);
    })

    hammer.on("panend", (evt) => {
      this.processEvent(evt);

      if (this.opts.endPan) {
        this.opts.endPan(this, evt);
      }

      this.panStart = undefined;
    })



    hammer.get('pinch').set({
      enable: (this.opts.pinch != undefined)
    });
    hammer.get('rotate').set({
      enable: (this.opts.rotate != undefined)
    });

    hammer.on("pinch", (evt) => {
      this.processEvent(evt);

      if (this.opts.pinch) this.opts.pinch(this, evt);
    });
    hammer.on("rotate", (evt) => {
      this.processEvent(evt);

      if (this.opts.rotate) this.opts.rotate(this, evt);
    });
  }


  processEvent(evt) {
    evt.pos = this.convertPositionToCanvas(evt.center);
    evt.x = evt.pos.x;
    evt.y = evt.pos.y;
  }

  passEvent(evt, evtName) {
    return this.activeScene.passEvent(evt, evtName, this);
  }

  get activeScene() {
    return this.scenes[this.activeSceneName];
  }
  addToScene(name, child) {
    this.scenes.addChild(child);
  }

  createShape(opts, sceneName) {
    let scene = sceneName != undefined ? this.scenes[sceneName] : this.activeScene;
    return scene.createShape(opts);
  }
  addShape(s, sceneName) {
    let scene = sceneName != undefined ? this.scenes[sceneName] : this.activeScene;
    return scene.addShape(s);
  }

  removeAll(sceneName) {
    let scene = sceneName != undefined ? this.scenes[sceneName] : this.activeScene;
    return scene.removeChildren();
  }


  get scene() {
    return this.activeSceneName;
  }
  set scene(name) {
    this.switchToScene(name);
  }

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

  // set noise options
  set noiseSetting(opts) {
    this._noiseSettings = opts || {};
    if (this._noiseSettings.seed == undefined) this._noiseSettings.seed = this.random(0, 1000000);

    this._noise = new Noise(this._noiseSettings);
  }

  set seed(seed) {
    this.RNG.seed(seed);
    this.noiseSettings = this._noiseSettings;
  }
  get seed() {
    return this._seed;
  }

  // returns noise value at (x, y, z) or element of array if given
  noise(x, y, z, arr) {
    if (arr != undefined && arr.length != undefined) {
      let n = Math.floor((this._noise.getNorm(x, y, z) / 2 + 0.5) * arr.length);
      return arr[n];
    }
    return this._noise.get(x, y, z);
  }

  // returns random number between 0 and 1 if no arguments given
  // returns random number between 0 and a if only one number given
  // returns random number between a and b if two numbers given
  // returns random element of array if a is an array
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

  isFullscreen() {
    return (document.fullscreenElement);
  }
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  convertPositionToCanvas(posOrX, y) {
    if (typeof posOrX == "number") {
      return this.root.toLocal({
        x: posOrX / window.devicePixelRatio,
        y: y / window.devicePixelRatio
      })
    }
    return this.root.toLocal({
      x: posOrX.x / window.devicePixelRatio,
      y: posOrX.y / window.devicePixelRatio
    })
  }
  resize() {
    let w = (window.innerWidth) / window.devicePixelRatio;
    let h = (window.innerHeight) / window.devicePixelRatio;
    this.scl = Math.min(w / this.size.x, h / this.size.y);
    this.scale = this.scl;

    //this part resizes the canvas but keeps ratio the same
    this.app.renderer.resize(w, h);

    if (this.centerZero) this.root.transform.position.set(w * 0.5, h * 0.5);
    else this.root.transform.position.set(w * 0.5 - this.w * this.scl / 2, h * 0.5 - this.h * this.scl / 2);
    this.root.transform.scale.set(this.scl, this.scl);
  }
}