// simplified particle system

class Particle {
  constructor(opts, i) {
    opts = opts || {};
    this.pos = new Vector(opts.x, opts.y);
    this.vel = new Vector(opts.velX, opts.velY);
    this.acc = new Vector();
    
    this.size = opts.size || 10;
    this.alive = opts.alive != undefined ? opts.alive : false;
    this.lifetime = 0;
    this.maxAge = opts.maxAge || -1;
    
    this.maxSpeed = opts.maxSpeed || -1;
    
    this.color = opts.color != undefined ? opts.color : 0xffffff;
    
    this.drag = opts.drag || .99;
    
    this.vanish = opts.vanish != undefined ? opts.vanish : false;
    
    this.index = i;
    //this.drawVec = new Vector();
  }
  reset(opts) {
    this.pos.x = opts.x || 0;
    this.pos.y = opts.y || 0;
    this.color = opts.color != undefined ? opts.color : 0xffffff;
    this.vel.x = opts.velX || 0;
    this.vel.y = opts.velY || 0;
    this.maxAge = opts.maxAge || -1;
    this.size = opts.size || this.size;
    
    this.drag = opts.drag || this.drag;
    this.vanish = opts.vanish != undefined ? opts.vanish : this.vanish;
    
    this.lifetime = 0;
    this.alive = true;
  }
  applyForce(ax, ay) {
    this.acc.add(ax, ay);
  }
  update(dt) {
    if(!this.alive) return;
    this.lifetime += dt;
    if(this.lifetime > this.maxAge && this.maxAge > 0) {
      this.alive = false;
    }
    this.vel.add(this.acc);
    if(this.maxSpeed && this.maxSpeed > 0) {
      this.vel.limit(this.maxSpeed);
    }
      
    this.pos.add(this.vel);
    if(this.drag) {
      this.vel.mult(this.drag);
    }
      
    this.acc.set(0, 0);
  }
  draw(graphic) {
    if(!this.alive) return;
    let s = this.size * (this.vanish ? 1 - this.lifetime / this.maxAge : 1);
    graphic.beginFill(this.color, 1)
    graphic.drawRect(this.pos.x - s / 2, this.pos.y - s / 2, s, s);
    
/*    graphic.lineStyle(this.size * (this.vanish ? 1 - this.lifetime / this.maxAge : 1), this.color, 1);
    graphic.moveTo(this.pos.x, this.pos.y);
    graphic.lineTo(this.pos.x, this.pos.y + this.size * (this.vanish ? 1 - this.lifetime / this.maxAge : 1));*/
  }
}

class ParticleSystem {
  constructor(opts) {
    opts = opts || {};
    this.graphic = new PIXI.Graphics();
    
    this.maxNum = opts.maxNum || 1000;
    this.particles = [];
    for(let i = 0; i < this.maxNum; i++) {
      this.particles.push(new Particle(opts.particles, i));
    }
    
    this.waitingList = [];
    
    this.forces = opts.forces || [];
    if(opts.parent) opts.parent.addChild(this.graphic);
  }
  add(opts) {
    this.waitingList.unshift(opts);
  }
  addParticle(x, y, color, velX, velY, maxAge, size, vanish) {
    this.add({x: x, y: y, color: color, velX: velX, velY: velY, maxAge: maxAge, size: size, vanish: vanish});
  }
  update(dt) {
    this.graphic.clear();
    for(let i = 0; i < this.particles.length; i++) {
      let particle = this.particles[i];
      if(!particle.alive && this.waitingList.length > 0) {
        particle.reset(this.waitingList.pop());
        console.log("spawn particle")
      } else if(!particle.alive) {
        continue;
      }
      for(let f of this.forces) {
        let force = f.get(particle.pos.x, particle.pos.y, particle);
        particle.applyForce(force.x, force.y);
      }
      particle.update(dt);
      particle.draw(this.graphic);
    }
  }

}