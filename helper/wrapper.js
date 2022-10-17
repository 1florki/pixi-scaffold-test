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
  
  swipe: (game, event) => {},
  tap: (game, event) => {},
  doubletap: (game, event) => {},
  press: (game, event) => {},
}

class Shape {
  constructor(opts) {
    opts = opts || {};
    
    this.color = opts.color || opts.c || 0;
    this.alpha = opts.alpha != undefined ? opts.alpha : (opts.a != undefined ? opts.a : 1);
    
    this.strokeColor = opts.strokeColor || opts.stroke || 0;
    this.strokeWeight = opts.strokeWeight || opts.weight || 1;
    this.strokeAlpha = opts.strokeAlpha || (opts.noStroke == true ? 0 : 1);
    
    this.size = {x:  opts.width || opts.w || opts.size || opts.s || 10, y: opts.height || opts.h || opts.size || opts.s || 10}
    
    this.shape = opts.shape || "rect";
    this.radius = opts.radius || 0;
    
    
    this.graphic = new PIXI.Graphics();
    this.redraw();
    
    if(opts.parent) opts.parent.addChild(this.graphic);
  }

  setPosition(x, y) {
    this.graphic.position.set(x, y);
  }
  
  move(x, y) {
    if(x) this.graphic.position.x += x;
    if(y) this.graphic.position.y += y;
  }
  
  setColor(c) {
    this.color = c;
    this.redraw();
  }
  setStroke(color, weight, alpha) {
    this.strokeColor = color;
    this.strokeWeight = weight;
    this.strokeAlpha = alpha;
  }
  
  redraw() {
    this.graphic.clear();
    
    this.graphic.beginFill(this.color, this.alpha);
    this.graphic.lineStyle(this.strokeWeight, this.strokeColor, this.strokeAlpha);
    
    if(this.shape == "rect") {
      this.graphic.drawRect(-this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
    }
    else if(this.shape == "circle" || this.shape == "ellipse") {
      this.graphic.drawEllipse(-this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
    }
    else if(this.shape == "roundedrect") {
      this.graphic.drawRoundedRect(-this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y, this.radius);
    }
  }
}

class PixiWrapper {
  constructor(opts) {
    opts = opts || {};
    this.opts = opts;
    
    this.size = {
      x: opts.x || 800,
      y: opts.y || 400
    }
    
    this.setup();
  }
  
  setup() {
    let appOpts = {
      antialiasing: opts.antialiasing != undefined ? opts.antialiasing : true,
      transparent: opts.transparent != undefined ? opts.transparent : true,
      resolution: window.devicePixelRatio || 1
    }
    if(this.opts.backgroundColor) appOpts.backgroundColor = this.opts.backgroundColor;

    this.app = new PIXI.Application(appOpts);

    this.app.view.style.left = "0px";
    this.app.view.style.top = "0px";
    this.app.view.style.position = "absolute";
    document.body.appendChild(this.app.view);
    
    // setup canvas
    this.canvas = new PIXI.Container();
    this.app.stage.addChild(this.canvas);

    this.resizeCanvas();
    
    // setup stats
    if(this.opts.stats != false) {
      this.stats = new Stats();
      document.body.appendChild(this.stats.dom);
    }
    
    this.totalTime = 0;

    this.setupEvents();
    
    let ticker = PIXI.Ticker.shared;
    ticker.add(this.loop.bind(this));
    
    if(this.opts.setup) {
      this.opts.setup(this);
    }
  }
  
  loop() {
    this.controls.gamepads = navigator.getGamepads();
    let dt = PIXI.Ticker.shared.elapsedMS;
    this.totalTime += dt;

    if(this.opts.loop) {
      this.opts.loop(this, dt, this.totalTime, this.controls);
    }
    
    if(this.stats) this.stats.update();
  }
  
  setupEvents() {
    window.addEventListener("resize", (event) => {
      this.resizeCanvas();
      return event;
    }, true);
    
    this.controls = {};
    this.controls.keys = {};
    document.addEventListener("keydown", (event) => {
      this.controls.keys[event.key] = true;
      
      if(this.opts.keyDown) {
        this.opts.keyDown(this, event.key, event);
      }
    }, false);
    
    document.addEventListener("keyup", (event) => {
      this.controls.keys[event.key] = false;
      
      if(this.opts.keyUp) {
        this.opts.keyUp(this, event.key, event);
      }
    }, false);

    // document.body registers gestures anywhere on the page
    var hammer = new Hammer(document.body, { preventDefault: true });
    hammer.get('swipe').set({
      direction: Hammer.DIRECTION_ALL
    }); 
    hammer.get('pan').set({
      direction: Hammer.DIRECTION_ALL
    });

    hammer.on("swipe", (evt) => {
      evt.pos = this.convertPositionToCanvas(evt.center);
      if(this.opts.swipe) this.opts.swipe(this, evt);
    });
    hammer.on("tap", (evt) => {
      evt.pos = this.convertPositionToCanvas(evt.center);
      if(this.opts.tap) this.opts.tap(this, evt);
    });
    
    hammer.on("doubletap", (evt) => {
      evt.pos = this.convertPositionToCanvas(evt.center);
      if(this.opts.doubletap) this.opts.doubletap(this, evt);
    });
    hammer.on("press", (evt) => {
      evt.pos = this.convertPositionToCanvas(evt.center);
      if(this.opts.press) this.opts.press(this, evt);
    });
    hammer.on("pan", (evt) => {
      evt.pos = this.convertPositionToCanvas(evt.center);
      if(this.opts.pan) this.opts.pan(this, evt);
    });
    
    hammer.get('pinch').set({ enable: (this.opts.pinch != undefined) });
    hammer.get('rotate').set({ enable: (this.opts.rotate != undefined) });
    
    hammer.on("pinch", (evt) => {
      evt.pos = this.convertPositionToCanvas(evt.center);
      if(this.opts.pinch) this.opts.pinch(this, evt);
    });
    hammer.on("rotate", (evt) => {
      evt.pos = this.convertPositionToCanvas(evt.center);
      if(this.opts.rotate) this.opts.rotate(this, evt);
    });
  }
  
  convertPositionToCanvas(pos) {
    return this.canvas.toLocal({
      x: pos.x / window.devicePixelRatio,
      y: pos.y / window.devicePixelRatio
    })
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

  resizeCanvas() {
    let w = (window.innerWidth) / window.devicePixelRatio;
    let h = (window.innerHeight) / window.devicePixelRatio;
    this.scl = Math.min(w / this.size.x, h / this.size.y);

    //this part resizes the canvas but keeps ratio the same
    this.app.renderer.resize(w, h);
    this.canvas.transform.position.set(w * 0.5, h * 0.5);
    this.canvas.transform.scale.set(this.scl, this.scl);
  }
}