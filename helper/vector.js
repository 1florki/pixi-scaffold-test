class MathUtils {
  // returns true if two lines intersect otherwise false
  // will set given result vector to point of intersection if provided
  static intersectLineLine(lineA1, lineA2, lineB1, lineB2, result) {
    let x1 = lineA1.x,
      y1 = lineA1.y,
      x2 = lineA2.x,
      y2 = lineA2.y,
      x3 = lineB1.x,
      y3 = lineB1.y,
      x4 = lineB2.x,
      y4 = lineB2.y;
    var a_dx = x2 - x1;
    var a_dy = y2 - y1;
    var b_dx = x4 - x3;
    var b_dy = y4 - y3;
    var s = (-a_dy * (x1 - x3) + a_dx * (y1 - y3)) / (-b_dx * a_dy + a_dx * b_dy);
    var t = (+b_dx * (y1 - y3) - b_dy * (x1 - x3)) / (-b_dx * a_dy + a_dx * b_dy);
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
      if(result != undefined && result.isVector) {
        result.set(x1 + t * (x2 - x1), y1 + t * (y2 - y1)) 
      } //new Vector(x1 + t * (x2 - x1), y1 + t * (y2 - y1));
      return true;
    }
    return false;
  }
  
  // returns true if boxes intersect otherwise false
  static intersectBoxBox(a, aSize, b, bSize) {
    return (Math.abs(a.x - b.x) * 2 < (aSize.x + bSize.x)) &&
      (Math.abs(a.y - b.y) * 2 < (aSize.y + bSize.y));
  }
  
  // returns true if line and box intersect otherwise false [SLOW, RESSOURCE INTENSIVE]
  static intersectLineBox(boxCenter, boxSize, lineA, lineB) {
    // if start or end point is in box return true
    if(MathUtils.containsPointBox(boxA, boxSize, lineA) || MathUtils.containsPointBox(boxA, boxSize, lineA)) return true
    
    let a = new Vector(boxCenter.x - boxSize.x / 2, boxCenter.y - boxSize.y / 2);
    let b = new Vector(boxCenter.x + boxSize.x / 2, boxCenter.y - boxSize.y / 2);
    let c = new Vector(boxCenter.x + boxSize.x / 2, boxCenter.y + boxSize.y / 2);
    let d = new Vector(boxCenter.x - boxSize.x / 2, boxCenter.y + boxSize.y / 2);
    
    // check outline intersection
    return (MathUtils.intersectLineLine(a, b, lineA, lineB) || 
            MathUtils.intersectLineLine(b, c, lineA, lineB) ||
            MathUtils.intersectLineLine(c, d, lineA, lineB) ||
            MathUtils.intersectLineLine(d, a, lineA, lineB))
  }
  
  // returns true if circles intersect otherwise false
  static intersectCircleCircle(a, aSize, b, bSize) {
    return a.dist(b) < aSize + bSize;
  }
  
  // returns true if point is in box otherwise false
  static containsPointBox(center, size, ax, ay) {
    let x = center.x,
      y = center.y,
      w = size.x / 2,
      h = size.y / 2;
    return (ax > x - w && ax < x + w && ay > y - h && ay < y + h);
  }

  // returns true if boxB is completely inside boxA otherwise false
  static containsBoxBox(a, aSize, b, bSize) {
    let x = b.x,
      y = b.y,
      w = bSize.x / 2,
      h = bSize.y / 2;
    return (pointInBox(a, aSize, x - w, y - w) + pointInBox(a, aSize, x - w, y + w) + pointInBox(a, aSize, x + w, y + w) + pointInBox(a, aSize, x + w, y - w)) == 4;
  }
  
  // return true if circleB is completely inside circle A otherwise false
  static containsCircleCircle(a, aSize, b, bSize) {
    return (a.dist(b) + bSize < aSize);
  }
}


class Vector {
  constructor(x, y, z) {
    this.x = x == undefined ? 0 : x;
    this.y = y == undefined ? 0 : y;
    this.z = z == undefined ? 0 : z;
    
    this.isVector = true;
    this.is2D = (z == undefined);
  }
  copy(vec) {
    this.x = vec.x;
    this.y = vec.y;
    this.z = vec.z;
    return this;
  }
  clone() {
    return new Vector(this.x, this.y, this.z);
  }
  set(x, y, z) {
    if(typeof x != "number" && x.x != undefined) {
      return this.set(x.x, x.y, x.z);
    }
    this.x = x == undefined ? 0 : x;
    this.y = y == undefined ? 0 : y;
    this.z = z == undefined ? 0 : z;
    return this;
  }
  add(x, y, z) {
    if(typeof x != "number" && x.x != undefined) {
      return this.add(x.x, x.y, x.z);
    }
    this.x += x == undefined ? 0 : x;
    this.y += y == undefined ? 0 : y;
    this.z += z == undefined ? 0 : z;
    return this;
  }
  sub(x, y, z) {
    if(typeof x != "number" && x.x != undefined) {
      return this.sub(x.x, x.y, x.z);
    }
    this.x -= x == undefined ? 0 : x;
    this.y -= y == undefined ? 0 : y;
    this.z -= z == undefined ? 0 : z;
    return this;
  }
  mult(x, y, z) {
    if(typeof x != "number" && x.x != undefined) {
      return this.mult(x.x, x.y, x.z);
    }
    this.x *= x == undefined ? 0 : x;
    this.y *= y == undefined ? (x == undefined ? 0 : x) : y;
    this.z *= z == undefined ? (x == undefined ? 0 : x) : z;
    return this;
  }
  div(x, y, z) {
    if(typeof x != "number" && x.x != undefined) {
      return this.div(m.x, x.y, x.z);
    }
    this.x /= x == undefined ? 0 : x;
    this.y /= y == undefined ? (x == undefined ? 0 : x) : y;
    this.z /= z == undefined ? (x == undefined ? 0 : x) : z;
    return this;
  }
  dot(vec) {
    return this.x * vec.x + this.y * vec.y + this.z * vec.z;
  }
  cross(vec) {
    return new Vector(this.y * vec.z - this.z * vec.y, this.z * vec.x - this.x * vec.z, this.x * vec.y - this.y * vec.x);
  }

  distXYZ(bx, by, bz) {
    let dx = this.x - bx;
    let dy = (this.y || 0) - (by || 0);
    let dz = (this.z || 0) - (bz || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  dist(vec) {
    return this.distXYZ(vec.x, vec.y, vec.z);
  }
  distance(vec) {
    return this.dist(vec);
  }
  distanceTo(vec) {
    return this.dist(vec);
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  setLength(l) {
    this.mult(l / this.length());
    return this;
  }
  limit(l) {
    if (this.length() > l) this.setLength(l);
    return this;
  }

  // 2d only
  heading() {
    return Math.atan2(this.x, this.y);
  }
  // 2d only
  rotate(a) {
    let ca = Math.cos(a);
    let sa = Math.sin(a);
    this.set(ca * this.x - sa * this.y, sa * this.x + ca * this.y);
    return this;
  }
  
  
  angleBetween(vec) {
    let d = this.dot(vec);
    let l = this.length() * vec.length();
    return Math.acos(d / l);
  }
  equals(vec) {
    return (this.x == vec.x && this.y == vec.y && this.z == vec.z)
  }

  normalize() {
    this.setLength(1);
    return this;
  }
  mag() {
    return this.length();
  }
  setMag(m) {
    this.setLength(m);
    return this;
  }
  manhattanLength() {
    return this.x + this.y + this.z;
  }
  lerp(vec, a) {
    let dx = vec.x - this.x;
    let dy = vec.y - this.y;
    let dz = vec.z - this.z;
    this.add(dx * a, dy * a, dz * a);
    return this;
  }

  // 2d vector from angle and optional length (default length 1)
  static fromAngle2D(a, l) {
    let v = new Vector(Math.cos(a), Math.sin(a));
    if (l) v.setLength(l);
    return v;
  }
  
  // random 2d vector with length between 0 and 1
  // or set length
  static random2D(l) {
    let v = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
    while (v.length() > 1) {
      v.set(Math.random() * 2 - 1, Math.random() * 2 - 1);
    }
    if (l) v.setLength(l);
    return v;
  }
  
  // random 3d vector with length between 0 and 1
  // or set length
  static random3D(l) {
    let v = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
    while (v.length() > 1) {
      v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
    }
    if (l) v.setLength(l);
    return v;
  }
  
  static breakIntoParts(a, b, parts) {
    if(a == undefined || b == undefined || !a.isVector || !b.isVector) return;
    
    parts = Math.floor(parts || 2);
    let arr = [a.clone()];
    for(let i = 1; i < parts; i++) {
      arr.push(a.clone().lerp(b, i / parts));
    }
    arr.push(b.clone());
    return arr;
  }
}
