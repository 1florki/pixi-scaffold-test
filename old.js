
    let moving;

    let backShapes = [];

    let ps, l;

    let parent, child, line;

    let setup = (game) => {
      /*let colors = [0, 0x111111, 0x222222, 0x333333, 0x444444, 0x555555, 0x666666, 0x777777, 0x888888, 0x999999, 0xaaaaaa, 0xbbbbbb, 0xcccccc, 0xdddddd, 0xeeeeee, 0xffffff];
      
      let g = new PIXI.Graphics();
      
      g.tapg = () => {
        game.noiseSetting = {scale: 0.001, oct: 3};
        //g.clear();
        for(let x = -game.width / 2; x < game.width / 2; x += 4) {
          for(let y = -game.height / 2; y < game.height / 2; y += 4) {
            let s = game.createShape({
            color: game.noise(x, y, 0, colors), //game.random([0x111111, 0x333333, 0x555555, 0x777777, 0x999999, 0xbbbbbb, 0xdddddd]),
            w: 4,
            h: 4,
            alpha: 1,
          })
            s.setPosition(x, y);
            g.beginFill(game.noise(x, y, 0, colors), 1);
            g.drawRect(x, y, 4, 4);
          }
        }
      }
      g.tapg();
      game.addShape(g, "game");
      
      for (let i = 0; i < 10000; i++) {
        let x = game.random(-game.width / 2, game.width / 2),
            y = game.random(-game.height / 2, game.height / 2);
        let s = game.createShape({
          color: game.noise(x, y, 0, colors), //game.random([0x111111, 0x333333, 0x555555, 0x777777, 0x999999, 0xbbbbbb, 0xdddddd]),
          w: 20,//game.noise(x, y) * 100,
          h: 10,
          alpha: 1,
        })
        s.setPosition(x, y);//(rnd.random() - 0.5) * game.size.x * 0.9, (rnd.random() - 0.5) * game.size.y * 0.9);
        //backShapes.push(s);
      }*/
      
      
/*
      let background = new Shape({
        w: game.size.x,
        h: game.size.y,
        parent: game.canvas,
        color: 0x00aa99,
        alpha: 0.5
      });

      ps = new ParticleSystem({
        parent: game.canvas
      });

      moving = new Shape({
        s: 100,
        parent: game.canvas,
        color: 0xaa9900,
        alpha: 1.0,
        stroke: 0xff0000,
        weight: 10
      });

      shape = new Shape({
        s: 20,
        parent: game.canvas,
        color: 0xffffff,
        noStroke: true
      });

      l = new Landscape({
        parent: game.canvas,
        noise: {
          min: 0,
          scl: 0.005,
          oct: 2,
          per: 0.5,
          sharpness: -0.5
        }
      });
      l.graphic.position.set(-400, 200);
*/
      /*
      let button = new Shape({
        h: 30, w: 100, parent: game.canvas, stroke: 0xffffff, alpha: 0.5
      })
      let text = new PIXI.Text('Start', {fontFamily : 'Arial', fontSize: 24, fill : 0xffffff, align : 'center'});
      let bounds = text.getLocalBounds();
      text.position.set(-bounds.width / 2, -bounds.height / 2)*/
      
      /*
      game.menuScene.createShape({w: game.size.x, h: game.size.y, color: 0, alpha: 0.5});
      let button = {
        text: "start",
        h: 30,
        w: 100,
        stroke: 0xffffff,
        fontFill: 0xffffff,
        tap: (game, evt) => {
          game.switchToScene(0);
        }
      };
      game.menuScene.createShape(button);
      game.menuScene.createShape({text: "game title", y: -100, fontSize: 50, fontFill: 0xffffff,});
      game.menuScene.createShape({text: "controls: w, a, s, d", y: 100, fontSize: 20, fontFill: 0xffffff,});
      */
      /*
      game.gameScene.createShape({w: 200, h: 100, stroke: 0x00ff00, tap: (game, evt) => {
        console.log(game.totalTime)
      }})
      
      game.gameScene.createShape({w: 100, h: 30, x: -350, y: 180, text: "pause", stroke: 0xffffff, fontFill:0xffffff, tap: (game, evt) => {
        game.switchToScene(1);
      }})
      */
      
      
      game.createShape({w: 800, h: 800, color: 0, alpha: 0.5});
      
      parent = game.menuScene.createShape({stroke: 0xffffff, w: 100, h: 30, x: 100, strokeWeight: 2, text: "hello", textColor: 0xff0000});
      
      child = new Shape({stroke: 0xffffff, parent: parent, x: 100, y: 0, h: 5, strokeWeight: 2})
      //let child2 = new Shape({stroke: 0xff0000, parent: child.graphic, x: 50})
      //game.canvas.addChild(text);
      
      
      let s = game.menuScene.createShape({stroke: 0xffffff, w: 100, h: 30, strokeWeight: 2, text: "hello", textColor: 0xff0000, tap: () => {
        s.text = s.text == "hello" ? "world" : "hello"
      }});
      
      line = game.addShape(new PIXI.Graphics());
      line.redraw = (x, y, x2, y2) => {
        line.clear();
        line.lineStyle(3, 0, 1);
        line.moveTo(x, y);
        line.lineTo(x2, y2);
      }
      
    }

    let loop = (game, dt, total, controls) => {
      
      //parent.graphic.angle += dt * 0.01;
      //parent.graphic.position.x += dt * 0.1;
      //child.graphic.angle += dt * 0.01;
      child.x = Math.sin(total * 0.001) * 100 + 100
      /*moving.setPosition(0, Math.sin(total * 0.001) * 100)

      if (controls.keys["w"]) {
        for (let s of backShapes) {
          s.move(0, -dt * 0.1);
        }
      }
      if (controls.keys["s"]) {
        for (let s of backShapes) {
          s.move(0, dt * 0.1);
        }
      }

      ps.add({
        x: (Math.random() - 0.5) * game.size.x,
        y: -game.size.y / 2,
        velY: dt * (Math.random() + 0.5),
        maxAge: 1000,
        size: 3
      })
      ps.update(dt);

      l.noise.shiftBy(1, 0, 0.1);
      l.draw();*/
    }
    let wrapper = new PixiEngine({
      alwaysShowGameScene: true,
      setup: setup,
      loop: loop,
      seed: 1,
      noise: {scale: 0.003, min: 0, max: 1, oct: 3, per: 0.6, warp: 0},
      x: 800,
      y: 800,
      /*
      swipe: (game, evt) => {
        shape.setPosition(evt.pos.x, evt.pos.y);
        shape.setColor(0xff0000)
      },
      pan: (game, evt) => {
        shape.setPosition(evt.pos.x, evt.pos.y);
        shape.setColor(0x0000ff)
        ps.add({
          x: evt.pos.x,
          y: evt.pos.y,
          velY: (Math.random() - 0.5) * 10,
          velX: (Math.random() - 0.5) * 10,
          maxAge: 1000,
          drag: 0.98,
          size: 3,
          vanish: true
        })
      },
      doubletap: (game, evt) => {
        shape.setPosition(evt.pos.x, evt.pos.y);
        shape.setColor(0x00ff00)
      },
      press: (game, evt) => {
        shape.setPosition(evt.pos.x, evt.pos.y);
        shape.setColor(0xff00ff)
      },
      tap: (game, evt) => {
        shape.setPosition(evt.pos.x, evt.pos.y);
        shape.setColor(0xffff00)
      },*/
      swipe: (game, evt) => {
        
      },
      pan: (game, evt) => {
        //parent.angle += evt.deltaX * game.scl * 0.1;
        console.log(evt);
        
        line.redraw(game.panStart.x, game.panStart.y, evt.x, evt.y);
        //if(!evt.isFinal) parent.position.set(game.panStart.x, game.panStart.y);
        if(evt.isFinal && game.panStart) {
          console.log("move")
          parent.x += evt.x - game.panStart.x
          parent.y += evt.y - game.panStart.y;
          game.panStart = undefined
        }
      },
      tap: (game, evt) => {
        //parent.position.set(evt.x, evt.y);
      },
      doubletap: (px) => {
        px.scene = px.scene == "game" ? "menu" : "game"
      },
      keyDown: (game, key) => {
        if (key == "f") {
          game.toggleFullscreen();
        }
      }
    });
    