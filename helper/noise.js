function lerp (start, end, amt){
  return (1-amt)*start+amt*end
}

class Noise {
  constructor(opts) {
    opts = opts || {};
    
    this.pos = new Vector(0, 0, 0);
    
    this.seed = (opts.seed || Math.random());
    
    this.scale =  opts.scale || (opts.scl || 1);
    this.power =  opts.power || (opts.pow || 1);
    
    this.amp = opts.amp || 1;
    
    this.shift = opts.shift || {x: 0, y: 0, z: 0};
  
    this.octaves = opts.octaves || (opts.oct || 0);
    this.persistence =  opts.persistence || (opts.per || 0.5);
    this.lacunarity = opts.lacunarity || (opts.lac || 2);
    
    this.maxAmp = this.amp;
    
    if(this.octaves > 0) {
      this.layers = [];
      let amp = this.amp * this.persistence;
      let scale = this.scale * this.lacunarity;
      for(let i = 0; i < this.octaves; i++) {
        let n = new Noise({scale: scale, amp: amp, seed: this.seed * 3 + i * 5});
        this.maxAmp += amp;
        scale *= 2;
        amp *= this.persistence;
        this.layers.push(n);
      }
    }
    if(opts.combine != undefined) {
      this.combine = new Noise(opts.combine);
    }
    if(opts.anti != undefined) {
      this.anti = new Noise(opts.anti);
    }
    this.mod = opts.mod;
    
    if(opts.recursive != undefined) {
      this.recursive = new Noise(opts.recursive);
    }
    if(opts.sharpness != undefined) {
      this.sharpness = opts.sharpness;
    }
    if(opts.warp != undefined) {
      this.warp = opts.warp;
      this.warpNoise = new Noise(opts.warpNoise);
    }
    if(opts.warp2 != undefined) {
      this.warp2 = opts.warp2;
      this.warpNoise2 = new Noise(opts.warpNoise2);
    }
    this.steps = opts.steps;
    
    this.min = opts.min != undefined ? opts.min : -1;
    this.max = opts.max != undefined ? opts.max : 1;
  
    this.simplex = new SimplexNoise(this.seed);
  }
  setSeed(seed) {
    seed = seed || (Math.random() * 10000);
    this.simplex = new SimplexNoise(seed);
    if(this.layers) {
      let i = 13
      for(let l of this.layers) {
        l.setSeed(seed * 3 + i++ * 7);
      }
    }
    return seed;
  }
  
  shiftBy(dX, dY, dZ) {
    this.shift.x += dX;
    this.shift.y += dY;
    this.shift.z += dZ;
  }
  
  getFBM(x, y, z) {
    let n = this.simplex.noise3D(x * this.scale, y * this.scale, z * this.scale) * (this.amp) / 2 + (this.amp) / 2;
    // 1. add layers together
    if(this.layers) {
      for(let l of this.layers) {
        n += l.getNoise(x, y, z) * l.amp;
      }
    }
    // norm should be float between 0.0 and 1.0 now
    let norm = n / this.maxAmp;
  }
  
  getNoise(x, y, z) {
    let warp = this.getValue("warp", x, y, z);
    if(warp) {
      let xwarp = this.warpNoise.get(x, y, z) * warp;
      let ywarp = this.warpNoise.get(x * 3 + 11, y * 5 + 5, z * 7 + 7) * warp;
      let zwarp = this.warpNoise.get(x * 11 + 5, y * 7 + 3, z * 3 + 7) * warp;
      x += xwarp;
      y += ywarp;
      z += zwarp;
    }
    
    let warp2 = this.getValue("warp", x, y, z);
    if(warp2) {
      let xwarp = this.warpNoise2.get(x, y, z) * warp2;
      let ywarp = this.warpNoise2.get(x * 3 + 11, y * 5 + 5, z * 7 + 7) * warp2;
      let zwarp = this.warpNoise2.get(x * 11 + 5, y * 7 + 3, z * 3 + 7) * warp2;
      x += xwarp;
      y += ywarp;
      z += zwarp;
    }
    
    // get noise and set to be between -this.amp and this.amp (dont change amp)
    let amp = this.getValue("amp", x, y, z);
    let n = this.simplex.noise3D(x * this.scale, y * this.scale, z * this.scale) * (this.amp);
    // 1. add layers together
    if(this.layers) {
      for(let l of this.layers) {
        n += l.getNoise(x, y, z);
      }
    }
    let norm = n / this.maxAmp;
    // norm should be float between -1.0 and 1.0 now
    // clamp for security
    norm = Math.min(norm, 1);
    norm = Math.max(norm, -1);
    
    
    
    if(this.sharpness) {
      let sharp = this.getValue("sharpness", x, y, z);
      let billow = Math.abs(norm);
      let ridged = (1 - billow);
    
  
      norm = lerp(norm, billow, Math.max(0, sharp));
      norm = lerp(norm, ridged, Math.abs(Math.min(0, sharp)));
    }
    
    // 2. combine with other noise:
    if(this.combine) {
      norm *= this.combine.getNoise(x, y, z);
      if(this.anti) {
        norm += (1 - this.combine.getNoise(x, y, z)) * this.anti.getNoise(x, y, z);
      }
    }
    
    // 3. modify with function
    if(this.mod) {
      norm = this.mod(norm, this, x, y, z);
    }
    
    if(this.recursive) {
      norm = this.recursive.getNoise(norm, 0, 0);
    }
    
    // 4. turn into steps 
    // (e.g. 2 steps => only 0 or 1, 3 steps => 0, 0.5 and 1)
    let steps = Math.round(this.getValue("steps", x, y, z));
    if(steps != undefined && steps > 1) {
      let s = (Math.floor((norm + 1) * steps * 0.5) / (steps - 1) - 0.5) * 2;
      return s;
    }
    
    
    if(this.mix) {
      
    }
  
    return norm * this.amp;
  }
  
  getDerivative(x, y, z, n) {
    // central difference
    // very expensive (six noise calls), should be changed to analytical derivatives
    // see https://iquilezles.org/www/articles/morenoise/morenoise.htm
    
    let mov = 0.001 * this.scale;
    let dx = (this.getNoise(x - mov, y, z) - this.getNoise(x + mov, y, z)) / (mov * 2);
    let dy = (this.getNoise(x, y - mov, z) - this.getNoise(x, y + mov, z)) / (mov * 2);
    let dz = (this.getNoise(x, y, z - mov) - this.getNoise(x, y, z + mov)) / (mov * 2);
    
    let d = new Vector(dx, dy, dz);
    d.normalize();
    return d;
  }
  
  getModifiedFBM(x, y, z) {
    let scl = this.scale;
    let amp = 0.5;
    let oct = this.layers.length;

    let n = 0.5;
    let maxAmp = 0;

    let sumX = 0.0, sumY = 0.0;
    let sum = new Vector(0, 0, 0);
    for(let l of this.layers) {
      let d = l.getDerivative(x * scl, y * scl, z * scl);
      d.normalize(); 
      sum.add(d);
      // delta xyz is now between -1 and 1
      //sumX += d.y;
      //sumY += d.z;
      maxAmp += l.amp;
      n += l.amp * d.x / (1 + (sum.z * sum.z + sum.y * sum.y))//d.x / (1 + (sumX * sumX + sumY * sumY)); // don't know whats going on here ^^
    }
    return n;
  }
  
  // sharpness, -1 ridged -> 0 normal -> 1 billowed
  // perturb 
  
  // amplify -1 -> 1 for -100 % to +100 % feature amplification
  
  getValue(key, x, y, z) {
    let v = this[key];
    if(typeof v == "number") return v;
    if(v != undefined && v.get != undefined) return v.get(x, y, z);
  }
  
  getUberNoise(x, y, z) {
    let uber = {};
    let n = this.getNoise(x, y, z);
    
  }
  
  // returns noise between -1 and 1
  getNormXYZ(x, y, z) {
    x = (x || 0) + this.shift.x;
    y = (y || 0) + this.shift.y;
    z = (z || 0) + this.shift.z;
    let n = this.getNoise(x, y, z);
    let power = this.getValue("power", x, y, z);
    return (Math.pow((n + 1) * 0.5, power) - 0.5) * 2;
  }
  getNorm(vec) {
    return this.getNormXYZ(vec.x, vec.y, vec.z);
  }
  
  // returns noise between min and max
  getXYZ(x, y, z) {
    return (this.getNormXYZ(x, y, z) + 1) * 0.5 * (this.max - this.min) + this.min;
  }
  get(vecOrX, y, z) {
    if(typeof vecOrX == "number") {
      return this.getXYZ(vecOrX, y, z);
    }
    return this.getXYZ(vecOrX.x, vecOrX.y, vecOrX.z);
  }
}