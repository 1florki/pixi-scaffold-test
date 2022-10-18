
    function drawLandscape(opts) {
      
    }

class Landscape {
  constructor(opts) {
    opts = opts || {};

      this.noise = new Noise(opts.noise);

      this.graphic = new PIXI.Graphics();

      this.width = opts.width || 800;
      this.height = opts.height || 350;
    this.draw();
    if(opts.parent) opts.parent.addChild(this.graphic);
  }
  
  draw() {
    this.graphic.clear();
      //this.graphic.lineStyle(1, 0xffffff, 1);
      this.graphic.beginFill(0, 0.5);
      for (let i = 0; i <= this.width; i += 1) {
        let n = this.noise.get(i) * this.height;
        if (i == 0) {
          this.graphic.moveTo(0, 0);
          this.graphic.lineTo(i, -n);
        }
        this.graphic.lineTo(i, -n);
      }
      this.graphic.lineTo(this.width, 0);
      this.graphic.closePath();
  }
}