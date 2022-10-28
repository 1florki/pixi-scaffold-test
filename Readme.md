## Pixi scaffold

#### features:

- [x] automatically scales your canvas
- [x] toggle fullscreen
- [x] gesture recognition: tap, doubletap, swipe, press, pan, rotate, pinch
- [x] keydown and up event
- [x] show/hide stats
- [x] random seeded number generator
- [x] easier way to draw/update shapes
- [x] vector class
- [x] include noise
- [x] tap/press/double tap ON object (rect only)
- [x] start + end pan event
- [x] more gestures (pinch, rotate)


#### future features:

- convert hsl to rgb
- shape: mouseover, pointer-down
- default menu (play, pause)
- check for aabb box intersection
- check intersection between two lines
- simple particle system
- game over screen (score, highscore, play again)
- save high score
- preload fonts
- preload images
- game over screen (+ restart game)

#### maybe features:

- loading screen?
- support for phone controls? (via qr code)
- motion controls (gyro)
- mouse position?
- animated object class? (multiple animations, select animation to play)
- add strings for swipe and pan direction? (+ set accepted swipe/pan directions)
- onscreen controls (joystick, button)
- easy way to play sounds (background music + effects)
- easy to import and use characters / etc
- procedural 2d backgrounds?
- easily save highscore etc
- easy font access (pixelated?)
- collision detection?
- touch/mouse down?
- peer2peer support?
- three.js version?

#### todo
- [ ] add menu
- [ ] incorporate particle system into wrapper?
- [ ] add features to particle system
- [ ] load images/gifs
- [ ] get most up to date noise
- [ ] documentation

#### particle system features
- [ ] spawn area (will spawn particles without given position somewhere in that area) (rect/circle/line)
- [ ] spawn a bunch of particles with random direction on point
- [ ] set a force (multiple forces?) that applies to all particles
- [ ] forces that only affect particles in area (circle or rectangle)