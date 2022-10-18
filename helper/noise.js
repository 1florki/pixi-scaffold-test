/*
## Noise
3D Uber noise (concept stolen from No Man's Sky) class for all your noise field needs.
- Seeded noise
- scaling, pow
- fBM
- Erosion-like fBM
- Domain warping
- Ridges, billows
- Stepped noise
- Combined noise

### Get noise
noise.get(x, y, z, up [optional])
### Seeding
set .seed to a number
### Scaling, pow
set .scale (*) to zoom in or out.
set .power (*) to do n^(power) where n between 0 - 1
### fBM (and erosion-like fBM)
Does fBM by setting .octaves > 0 (*)
Control fBM with .persistence (*) and .lacunarity (*)
Advanced erosion like fBM with .erosion > 0 (*) (currently very slow, needs up vector if not [0, 1, 0])
Change settings of individual noise layers with .layers = [{}, {}] or .all = {}
Set relative amplitude of layers with .amp (*).
### Domain warping (slow-ish)
set .warp != 0 (*) for domain warping.
Uses the same noise per default, can be changed by settings .warpNoise
Second order domain warping available with .warp2 and .warpNoise2
### Ridges, billows
set .sharpness > 0 (*) for billowed noise (1.0 completely billowed).
set .sharpness < 0 (*) for ridged noise (-1.0 completely ridged).
### Stepped noise
set .steps > 0 (*) for stepped noise with .steps as number of steps.
### Combine
set .combine to another noise field
seed: Math.random(),
scale (scl): 1,
power (pow): 1,
amp: 1,
octaves (oct): 0, (0, 1, 2, ....)
persistence (per): 0.5, 
lacunarity (lac): 2,
layers: [{}, {}, {}],
combine: {}, (noise opts)
mod: (val, this, x, y, z, up) => val,
sharpness: 0, (-1 -> 1)
warp: 0,
warp2: 0,
erosion: 0,
steps: undefined (1, 2, 3, 4, ...)
min: -1,
max: 1,
defaultUp: (x, y, z) => new Vector(0, 1, 0),
*/

function lerp (start, end, amt){
  return (1-amt)*start+amt*end
}

const defaultUp = new Vector(0, 1, 0);

class Noise {
  constructor(opts) {
    opts = opts || {};

    this.pos = new Vector(0, 0, 0);

    this.seed = (opts.seed || Math.random());

    this.scale = opts.scale || (opts.scl || 1);
    this.checkValue("scale");

    this.power = opts.power || (opts.pow || 1);
    this.checkValue("power");

    this.shift = opts.shift || new Vector(0, 0, 0);

    // fbm stuff
    // how many layers
    this.octaves = opts.octaves || (opts.oct || 0);
    this.checkValue("octaves");
    // how much to multiply amplitude per layer
    this.gain = opts.gain || (opts.persistence || (opts.per || 0.5));
    this.checkValue("gain");
    // how much to multiply scale per layer
    this.lacunarity = opts.lacunarity || (opts.lac || 2);
    this.checkValue("lacunarity");

    // how much previous layers influence amplitude of later layers
    this.erosion = opts.erosion != undefined ? opts.erosion : 0;
    this.checkValue("erosion");
    // how much to move x, y, z to calculate derivative 
    // (x2 - x1) / delta, (y2 - y1) / delta, (z2 - z1) / delta
    this.delta = opts.delta != undefined ? opts.delta : 0.0001;

    // amp is also only used for fbm
    this.amp = opts.amplitude || opts.amp;
    this.checkValue("amp");

    if (this.octaves > 0 || opts.layers != undefined) {
      this.layers = [];
      for (let i = 0; i <= this.octaves || (opts.layers && i < opts.layers.length); i++) {
        let settings = opts.layers != undefined && opts.layers.length > i ? opts.layers[i] : {};
        if (settings.seed == undefined) settings.seed = this.seed * 3 + i * 5

        let n = settings;
        if (opts.all) {
          for (let k of Object.keys(opts.all)) {
            n[k] = opts.all[k];
          }
        }
        if (n.isNoise != true) {
          n = new Noise(settings);
        }
        this.layers.push(n);
      }
    } else {
      this.simplex = new SimplexNoise(this.seed);
    }
    if (opts.combine != undefined) {
      this.combine = new Noise(opts.combine);
    }

    this.mod = opts.mod;

    this.sharpness = opts.sharpness;
    this.checkValue("sharpness");

    if (opts.warp != undefined) {
      this.warp = opts.warp;
      this.checkValue("warp");
      if (opts.warpNoise) {
        this.warpNoise = opts.warpNoise;
        if (this.warpNoise.isNoise != true) this.warpNoise = new Noise(opts.warpNoise);
      }
    }
    if (opts.warp2 != undefined) {
      this.warp2 = opts.warp2;
      this.checkValue("warp2");

      if (opts.warpNoise2) {
        this.warpNoise2 = opts.warpNoise2;
        if (this.warpNoise2.isNoise != true) this.warpNoise2 = new Noise(opts.warpNoise2);
      }
    }

    this.steps = opts.steps;
    this.checkValue("steps");

    this.min = opts.min != undefined ? opts.min : -1;
    this.checkValue("min");
    this.max = opts.max != undefined ? opts.max : 1;
    this.checkValue("max");

    this.defaultUp = opts.defaultUp;

    if (opts.amps) {
      this.multiplyAmps(opts.amps);
    }

    this.central = opts.central;

    this.isNoise = true;
  }

  // checks if this[key] is an object or a number and 
  // if it is an object but .isNoise != true 
  // turns that into a new Noise object
  checkValue(key) {
    let v = this[key];
    if (v != undefined && typeof v != "number" && v.isNoise != true) this[key] = new Noise(v);
  }

  setSeed(seed) {
    this.seed = seed || (Math.random() * 10000);
    if(this.simplex) this.simplex = new SimplexNoise(this.seed);
    if (this.layers) {
      let i = 13
      for (let l of this.layers) {
        l.setSeed(this.seed * 3 + i++ * 7);
      }
    }
    
    for(let k of Object.keys(this)) {
      if(this[k] != undefined && this[k].isNoise) {
        this[k].setSeed(this.seed * 17 + 513);
      }
    }
    
    return seed;
  }

  shiftBy(dX, dY, dZ) {
    this.shift.x += dX;
    this.shift.y += dY;
    this.shift.z += dZ;
  }

  multiplyAmps(arr) {
    if (this.layers == undefined) return;

    for (let i = 0; i < this.layers.length && i < arr.length; i++) {
      this.layers[i].amp *= arr[i];
    }
  }

  getFBM(x, y, z, up, noErosion) {
    let scale = this.getValue("scale", x, y, z);

    // if no layers exit early
    if (this.layers == undefined) {
      // if object has simplex noise return result of that
      if (this.simplex != undefined) return this.simplex.noise3D(x * scale, y * scale, z * scale);
      // no data
      return 0;
    }
    // for calculating angle between derivative and tangent
    // when erosion > 0
    up = up || (this.defaultUp != undefined ? this.defaultUp(x, y, z) : defaultUp);
    
    let maxAmp = 1;
    let amp = 1,
      freq = scale;

    let lac = this.getValue("lacunarity", x, y, z);
    let gain = this.getValue("gain", x, y, z);

    // reuse vector
    this.sum = this.sum || new Vector();
    this.sum.set(0, 0, 0);

    let n = 0;
    let erosion = noErosion != true ? this.getValue("erosion", x, y, z) : 0;
    let octaves = this.getValue("octaves", x, y, z);
    for (let i = 0; i <= octaves && i < this.layers.length; i++) {
      let l = this.layers[i];
      let layerAmp = l.getValue("amp", x, y, z) || 1;
      let val = l.get(x * freq, y * freq, z * freq, up) * amp * layerAmp;
      if (erosion > 0) {
        let d = l.getDerivative(x * freq, y * freq, z * freq);
        d.setLength(amp * layerAmp);

        this.sum.add(d);
        // calculate normalized angle between sum of derivatives and tangent, should be between 0 and 1
        let mult = Math.abs(1 - up.angleTo(this.sum) / Math.PI);
        
        n += val * (mult * erosion + 1 - erosion);
      } else {
        n += val;
      }
      amp *= gain;
      freq *= lac;
      maxAmp += amp * layerAmp;
    }
    return n / maxAmp;
  }

  // main method, returns value between -1 and +1
  getNoise(x, y, z, up) {
    x = x || 0;
    y = y || 0;
    z = z || 0;

    x += this.shift.x;
    y += this.shift.y;
    z += this.shift.z;

    let warp = this.getValue("warp", x, y, z);
    if (warp) {
      if (this.warpNoise) {
        x += this.warpNoise.get(x - 7.98, y + 4.33, z + 1.1) * warp;
        y += this.warpNoise.get(x + 1.23, y + 5.79, z + 9.31) * warp;
        z += this.warpNoise.get(x + 11.47, y + 17.98, z + 23.56) * warp;
      } else {
        x += this.getFBM(x - 7.98, y + 4.33, z + 1.1, up, true) * warp;
        y += this.getFBM(x + 1.23, y + 5.79, z + 9.31, up, true) * warp;
        z += this.getFBM(x + 11.47, y + 17.98, z + 23.56, up, true) * warp;
      }
    }

    let warp2 = this.getValue("warp2", x, y, z);
    if (warp2) {
      if (this.warpNoise2) {
        x += this.warpNoise2.get(x + 1.23, y + 5.79, z + 9.31) * warp2;
        y += this.warpNoise2.get(x + 11.47, y + 17.98, z + 23.56) * warp2;
        z += this.warpNoise2.get(x - 7.98, y + 4.33, z + 1.1) * warp2;
      } else {
        x += this.getFBM(x + 11.47, y + 17.98, z + 23.56) * warp2;
        y += this.getFBM(x - 7.98, y + 4.33, z + 1.1) * warp2;
        z += this.getFBM(x + 1.23, y + 5.79, z + 9.31) * warp2;
      }
    }

    let norm = this.getFBM(x, y, z, up);

    if (this.clamp) {
      norm = Math.min(norm, 1);
      norm = Math.max(norm, -1);
    }

    if (this.sharpness) {
      let sharp = this.getValue("sharpness", x, y, z);
      let billow = (Math.abs(norm) - 0.5) * 2;
      let ridged = (0.5 - Math.abs(norm)) * 2;


      norm = lerp(norm, billow, Math.max(0, sharp));
      norm = lerp(norm, ridged, Math.abs(Math.min(0, sharp)));
    }


    // modify with function
    if (this.mod) {
      norm = this.mod(norm, this, x, y, z, up);
    }

    let power = this.getValue("power", x, y, z);
    if (power && power != 1) {
      // convert to [0 - 1], apply power and back to [-1, 1]
      norm = (Math.pow((norm + 1) * 0.5, power) - 0.5) * 2
    }

    //combine with other noise:
    if (this.combine) {
      norm *= this.combine.get(x, y, z);
    }

    // turn into steps 
    // (e.g. 2 steps => only 0 or 1, 3 steps => 0, 0.5 and 1)
    let steps = Math.round(this.getValue("steps", x, y, z));
    if (steps != undefined && steps > 1) {
      let s = (Math.floor((norm + 1) * steps * 0.5) / (steps - 1) - 0.5) * 2;
      return s;
    }


    return norm;
  }

  getDerivative(x, y, z, n) {
    // left side or central difference
    // very expensive (four/six noise calls), should be changed to analytical derivatives
    // see https://iquilezles.org/www/articles/morenoise/morenoise.htm

    n = n || this.get(x, y, z);
    let mov = this.delta;

    let dx = (this.central ? this.get(x - mov, y, z) : n) - this.get(x + mov, y, z);
    let dy = (this.central ? this.get(x, y - mov, z) : n) - this.get(x, y + mov, z);
    let dz = (this.central ? this.get(x, y, z - mov) : n) - this.get(x, y, z + mov);

    let d = new Vector(dx, dy, dz);
    d.normalize();
    return d;
  }

  // returns value of property at x, y, z
  getValue(key, x, y, z) {
    x = x || 0;
    y = y || 0;
    z = z || 0;
    let v = this[key];
    if (typeof v == "number") return v;
    if (v != undefined && v.isNoise) return v.get(x, y, z);
  }

  // returns noise between -1 and 1
  getNormXYZ(x, y, z, up) {
    return this.getNoise(x, y, z, up);
  }
  getNorm(vecOrX, y, z, up) {
    if (typeof vecOrX == "number") {
      return this.getNormXYZ(vecOrX, y, z, up);
    }
    return this.getNormXYZ(vecOrX.x, vecOrX.y, vecOrX.z, up);
  }

  // converts from -1, 1 to min, max
  normToMinMax(norm, x, y, z) {
    let min = this.getValue("min", x, y, z);
    let max = this.getValue("max", x, y, z);
    return (norm + 1) * 0.5 * (max - min) + min;
  }
  // converts from min, max to -1, 1
  minMaxToNorm(minMax, x, y, z) {
    let min = this.getValue("min", x, y, z);
    let max = this.getValue("max", x, y, z);
    return ((minMax - min) / (max - min) - 0.5) * 2
  }

  // returns noise between min and max
  getXYZ(x, y, z, up) {
    return this.normToMinMax(this.getNormXYZ(x, y, z, up), x, y, z);
  }
  get(vecOrX, y, z, up) {
    if (typeof vecOrX == "number") {
      return this.getXYZ(vecOrX, y, z, up);
    }
    return this.getXYZ(vecOrX.x, vecOrX.y, vecOrX.z, up);
  }
}