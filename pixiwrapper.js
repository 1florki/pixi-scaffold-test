class PixiWrapper {

  setup(x, y) {
    this.size = {
      x: x || 800,
      y: y || 400
    }

    this.app = new PIXI.Application({
      antialiasing: true,
      transparent: true,
      //backgroundColor: 0x550000,
      resolution: window.devicePixelRatio || 1
    });


    this.app.view.style.left = "0px";
    this.app.view.style.top = "0px";
    this.app.view.style.position = "absolute";
    document.body.appendChild(this.app.view);


    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);

    this.canvas = new PIXI.Container();
    this.app.stage.addChild(this.canvas);

    this.resizeCanvas();

    this.controlsKeyboard = {};
    document.addEventListener("keydown", (event) => {
      if (event.key == "f") {
        this.toggleFullScreen();
      }
      this.controlsKeyboard[event.key] = true
    }, false);
    document.addEventListener("keyup", (event) => {
      this.controlsKeyboard[event.key] = false
    }, false);

    window.addEventListener("resize", (event) => {
      this.resizeCanvas();
      return event;
    }, true);

    let ticker = PIXI.Ticker.shared;
    ticker.add(this.gameloop.bind(this));

    let graph = new PIXI.Graphics();
    graph.beginFill(0xff0000, 0.5)
    graph.drawRect(-this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
    this.canvas.addChild(graph)
    
    let graph2 = new PIXI.Graphics();
    graph2.beginFill(0xff00ff, 0.5)
    graph2.drawRect(-50, -50, 100, 100);

    this.canvas.addChild(graph2)
    
    
    let graph3 = new PIXI.Graphics();
    graph3.beginFill(0x00ffff, 0.5)
    graph3.drawRect(-20, -20, 40, 40);

    this.canvas.addChild(graph3)
    
    this.info = graph3;
    
    this.graph = graph2;

    this.totalTime = 0;

    this.installGestures();
  }

  installGestures() {
    var options = {
      preventDefault: true
    };

    // document.body registers gestures anywhere on the page
    var hammer = new Hammer(document.body, options);
    hammer.get('swipe').set({
      direction: Hammer.DIRECTION_ALL
    });

    hammer.on("swipe", this.swiped.bind(this));
    hammer.on("tap", this.tap.bind(this));
  }
  swiped(evt) {
    console.log("SWIPE")
    console.log(evt);
    
    let p = this.convertPositionToCanvas(evt.center);
    this.info.position.set(p.x, p.y);
  }
  tap(evt) {
    console.log("TAP")
    console.log(evt);
    let p = this.convertPositionToCanvas(evt.center);
    this.info.position.set(p.x, p.y);
  }
  convertPositionToCanvas(pos) {
    return this.canvas.toLocal({
      x: pos.x / window.devicePixelRatio,
      y: pos.y / window.devicePixelRatio
    })
  }

  gameloop(time) {
    var gamepads = navigator.getGamepads();
    let dt = PIXI.Ticker.shared.elapsedMS;
    this.totalTime += dt;

    //currentGame.update(dt, keyboard, gamepads, phoneGamepads);

    this.graph.position.set(0, Math.sin(this.totalTime * 0.001) * 100)

    this.stats.update();


  }

  isFullscreen() {
    return (document.fullscreenElement);
  }

  toggleFullScreen() {
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