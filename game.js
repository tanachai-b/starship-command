"use strict";

class Camera {
    constructor(zoom = 1, x = 0, y = 0) {
        this.zoom = zoom;
        this.x = x;
        this.y = y;
    }
}

class Game {

    constructor() {

        this.c = document.getElementById("canvas");
        this.ctx = this.c.getContext("2d");

        this.bodies = [];
        this.bodiesMap = {};

        this.isPause = false;
        this.calcMulti = 1;
        this.precision = 0.01;

        this.camera = new Camera(40);
        this.isFollowShip = false;

        this.camSolSys = [];
        this.camMoons = {};
        this.camShips = [];

        this.focusSolSysIndex = 3;
        this.focusMoonIndex = 0;
        this.focusShipIndex = 0;

        this.focusBody;
        this.focusShip;

        this.focus;

        this.logMap = {};

        this.gravMap = {};
        let gravList = ['sun<-mercury', 'sun<-venus', 'sun<-moon', 'sun<-earth', 'sun<-mars', 'earth<-moon', 'sun<-jupiter', 'sun<-saturn', 'moon<-earth', 'sun<-uranus', 'sun<-neptune'];
        for (let grav of gravList) { this.gravMap[grav] = 1; }

        this.pressedKeys = {};

        this.badPrecBodies = {};
    }

    initiate() {

        this.c.addEventListener("wheel", this.wheel.bind(this), false);
        document.body.addEventListener("keydown", this.keydown.bind(this), false);
        document.body.addEventListener("keyup", this.keyup.bind(this), false);

        this.buildGameMap();
    }

    buildGameMap() {

        let sun = new Body("sun", "#FFF200", 696340, 1.409, null, 0, 0);
        this.bodies.push(sun); this.bodiesMap.sun = sun;

        // // ========================

        let mercury = new Body("mercury", "#B0B0B0", 2439.64, 5.43, sun, 57909175, -90);
        this.bodies.push(mercury); this.bodiesMap.mercury = mercury;

        let venus = new Body("venus", "#FFECA0", 6051.59, 5.24, sun, 108208930, 190);
        this.bodies.push(venus); this.bodiesMap.venus = venus;

        let earth = new Body("earth", "#006AFF", 6378.10, 5.52, sun, 149597890, 10);
        this.bodies.push(earth); this.bodiesMap.earth = earth;

        let mars = new Body("mars", "#C74E33", 3397.00, 3.94, sun, 227936640, 80);
        this.bodies.push(mars); this.bodiesMap.mars = mars;

        let jupiter = new Body("jupiter", "#A6662B", 71492.68, 1.33, sun, 778412010, -45);
        this.bodies.push(jupiter); this.bodiesMap.jupiter = jupiter;

        let saturn = new Body("saturn", "#FFE4A6", 60267.14, 0.7, sun, 1426725400, 200);
        this.bodies.push(saturn); this.bodiesMap.saturn = saturn;

        let uranus = new Body("uranus", "#80FFE8", 25557.25, 1.3, sun, 2870972200, 135);
        this.bodies.push(uranus); this.bodiesMap.uranus = uranus;

        let neptune = new Body("neptune", "#2B7CFF", 24766.36, 1.76, sun, 4498252900, 30);
        this.bodies.push(neptune); this.bodiesMap.neptune = neptune;

        // ========================

        let moon = new Body("moon", "#B5B0A3", 1737.1, 3.3464, earth, 384399, -135);
        this.bodies.push(moon); this.bodiesMap.moon = moon;

        let phobos = new Body("phobos", "#B5B0A3", 11.1, 1.876, mars, 9377, 45);
        this.bodies.push(phobos); this.bodiesMap.phobos = phobos;

        let deimos = new Body("deimos", "#B5B0A3", 6.3, 1.471, mars, 23460, -135);
        this.bodies.push(deimos); this.bodiesMap.deimos = deimos;

        let io = new Body("io", "#B5B0A3", 1815, 3.528, jupiter, 421600, 15);
        this.bodies.push(io); this.bodiesMap.io = io;

        let europa = new Body("europa", "#B5B0A3", 1569, 3.01, jupiter, 670900, 105);
        this.bodies.push(europa); this.bodiesMap.europa = europa;

        let ganymede = new Body("ganymede", "#B5B0A3", 2634.1, 1.936, jupiter, 1070400, 80);
        this.bodies.push(ganymede); this.bodiesMap.ganymede = ganymede;

        let callisto = new Body("callisto", "#B5B0A3", 2410.3, 1.83, jupiter, 1882700, -160);
        this.bodies.push(callisto); this.bodiesMap.callisto = callisto;

        let titan = new Body("titan", "#B5B0A3", 2576, 1.88, saturn, 1221870, -80);
        this.bodies.push(titan); this.bodiesMap.titan = titan;

        // ========================

        for (let body of this.bodies) {

            if (body.name === "sun" || body.parent.name === "sun") {
                this.camSolSys.push(body);

            } else {
                if (this.camMoons[body.parent.name] === undefined) {
                    this.camMoons[body.parent.name] = [body.parent];
                }
                this.camMoons[body.parent.name].push(body);
            }
        }

        // ========================

        // let ship = new Body("ship", "#00FFA3", 0.01, 0.5, earth, 6378.10 + 100000, -30);
        // this.bodies.push(ship); this.bodiesMap.ship = ship;

        // this.camShips.push(ship);
    }

    async gameLoop() {

        const timer = ms => new Promise(res => setTimeout(res, ms));

        while (true) {

            if (!this.isPause) {
                for (let i = 0; i < this.calcMulti; i++) { this.moveBodies(); }
                this.moveShip();
            }
            this.calcTrajectory();

            this.moveCamera();
            this.drawBodies();
            this.drawUI();

            if (!this.isPause) {
                this.log();
            }

            await timer(1);
        }
    }

    moveBodies() {

        this.badPrecBodies = {};

        for (let body of this.bodies) {
            body.calcGrav(this.bodies, this.precision, this.badPrecBodies, this.gravMap, this.logMap);
        }

        if (Object.keys(this.badPrecBodies).length > 0) {
            for (let body of this.bodies) {
                body.calcGrav(this.bodies, this.precision, this.badPrecBodies, this.gravMap, this.logMap);
            }
        }

        for (let body of this.bodies) {
            body.move(this.precision, this.badPrecBodies);
            // body.addTrail(this.logMap);
        }
    }

    calcTrajectory() {
        for (let body of this.bodies) { body.calcTrajectory(this.logMap); }
    }

    moveShip() {

        let thrust = 10;

        let ship = this.bodiesMap.ship;
        if (ship === undefined) { return; }

        let parentDirection = this.calcShipDirection(ship);

        if (this.pressedKeys.W) { this.accelerate(ship, parentDirection, thrust); }
        if (this.pressedKeys.S) { this.decelerate(ship, parentDirection, thrust); }
        if (this.pressedKeys.A) { this.moveLeft(ship, parentDirection, thrust); }
        if (this.pressedKeys.D) { this.moveRight(ship, parentDirection, thrust); }
    }

    calcShipDirection(ship) {

        let parent = ship.parent;

        let dvx = ship.vx - parent.vx;
        let dvy = ship.vy - parent.vy;

        let dist = Math.hypot(dvx, dvy);

        return { x: dvx / dist, y: dvy / dist }
    }

    accelerate(ship, parentDirection, thrust) {
        ship.vx += parentDirection.x * thrust;
        ship.vy += parentDirection.y * thrust;
    }

    decelerate(ship, parentDirection, thrust) {
        ship.vx += parentDirection.x * -thrust;
        ship.vy += parentDirection.y * -thrust;
    }

    moveLeft(ship, parentDirection, thrust) {
        ship.vx += parentDirection.y * thrust;
        ship.vy += -parentDirection.x * thrust;
    }

    moveRight(ship, parentDirection, thrust) {
        ship.vx += -parentDirection.y * thrust;
        ship.vy += parentDirection.x * thrust;
    }

    moveCamera() {

        if (this.focusShip === undefined) { this.focusShip = this.camShips[this.focusShipIndex]; }
        if (this.focusBody === undefined) { this.focusBody = this.camSolSys[this.focusSolSysIndex]; }
        if (this.focus === undefined) { this.focus = this.focusBody; }

        this.camera.x = this.focus.x;
        this.camera.y = this.focus.y;

        // let earth = this.bodiesMap.earth;
        // let moon = this.bodiesMap.moon;
        // let a1 = earth.radius ** 3 / (earth.radius ** 3 + moon.radius ** 3);
        // let a2 = moon.radius ** 3 / (earth.radius ** 3 + moon.radius ** 3);
        // this.camera.x = earth.x * a1 + moon.x * a2;
        // this.camera.y = earth.y * a1 + moon.y * a2;
    }

    drawBodies() {

        let offScreenCanvas = document.createElement("canvas");
        offScreenCanvas.width = this.c.width;
        offScreenCanvas.height = this.c.height;

        let offCtx = offScreenCanvas.getContext("2d");

        for (let i = this.bodies.length - 1; i >= 0; i--) {
            this.bodies[i].drawTrail(offCtx, this.camera, this.logMap);
        }
        for (let i = this.bodies.length - 1; i >= 0; i--) {
            this.bodies[i].drawTrajectory(offCtx, this.camera, this.logMap);
        }
        for (let i = this.bodies.length - 1; i >= 0; i--) {
            this.bodies[i].drawBody(offCtx, this.camera, this.logMap);
        }
        for (let i = this.bodies.length - 1; i >= 0; i--) {
            this.bodies[i].drawName(offCtx, this.camera, this.logMap);
        }

        this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        this.ctx.filter = 'blur(4px)';
        this.ctx.drawImage(offScreenCanvas, 0, 0);

        this.ctx.filter = "none";
        this.ctx.drawImage(offScreenCanvas, 0, 0);
    }

    drawUI() {

        let texts = [];
        texts.push("[F1] - [F4] : Simulation Precision");
        texts.push("[1] - [4] : Time Warp");
        texts.push("[Z], [Shift] + [Z] : Next, Previous Planet");
        texts.push("[X], [Shift] + [X] : Next, Previous Moon");
        texts.push("[C], [Shift] + [C] : Next, Previous Ship");
        texts.push("[F] : Toggle Focus on Ship");
        texts.push("");
        texts.push("Calculation Multiplier: " + this.calcMulti);
        texts.push("Simulation Precision: " + this.precision);
        texts.push("Zoom: " + this.camera.zoom);
        texts.push("");
        texts.push("Trajectory: " + this.focusBody.name.charAt(0).toUpperCase() + this.focusBody.name.slice(1));
        texts.push("");
        texts.push(this.isPause ? "PAUSE" : "");

        this.ctx.fillStyle = "rgba(0,0,0,0.5)";
        this.ctx.fillRect(0, 0, 200, texts.length * 16 + 12);

        this.ctx.fillStyle = "#888888";
        this.ctx.font = "10px sans-serif";
        this.ctx.textBaseline = "top";

        let y = 0;
        for (let text of texts) {
            this.ctx.fillText(text, 8, 8 + y);
            y += 16;
        }
    }

    log() {

        let logStr = "log items: " + Object.keys(this.logMap).length + "<br>";

        for (let key in this.logMap) {
            logStr += key + ": " + this.logMap[key] + "<br>";
        }

        let log = document.getElementById("log");
        log.innerHTML = logStr;
    }

    wheel(event) {
        event.preventDefault();
        this.camera.zoom += Math.sign(event.deltaY);
    }

    keydown(event) {

        let mod = event.ctrlKey * 4 + event.shiftKey * 2 + event.altKey * 1;
        switch (mod + "_" + event.code) {

            case "0_Space": event.preventDefault(); this.togglePause(); break;

            case "0_F1": event.preventDefault(); this.calcMulti = 10 ** 0; break;
            case "0_F2": event.preventDefault(); this.calcMulti = 10 ** 1; break;
            case "0_F3": event.preventDefault(); this.calcMulti = 10 ** 2; break;
            case "0_F4": event.preventDefault(); this.calcMulti = 10 ** 3; break;

            case "0_Digit1": event.preventDefault(); this.precision = 0.0001; break; // surface
            case "0_Digit2": event.preventDefault(); this.precision = 0.001; break;
            case "0_Digit3": event.preventDefault(); this.precision = 0.01; break; // moons
            case "0_Digit4": event.preventDefault(); this.precision = 0.1; break;
            case "0_Digit5": event.preventDefault(); this.precision = 1; break; // inner planets
            case "0_Digit6": event.preventDefault(); this.precision = 10; break;
            case "0_Digit7": event.preventDefault(); this.precision = 100; break; // outer planets
            case "0_Digit8": event.preventDefault(); this.precision = 1000; break;
            case "0_Digit9": event.preventDefault(); this.precision = 10000; break;

            case "0_BracketLeft": event.preventDefault(); this.decreasePrecision(); break;
            case "0_BracketRight": event.preventDefault(); this.increasePrecision(); break;

            case "0_KeyF": event.preventDefault(); this.toggleFollowShip(); break;

            case "0_KeyZ": event.preventDefault(); this.cycleSolSys(); break;
            case "2_KeyZ": event.preventDefault(); this.cycleSolSysReverse(); break;

            case "0_KeyX": event.preventDefault(); this.cycleMoon(); break;
            case "2_KeyX": event.preventDefault(); this.cycleMoonReverse(); break;

            case "0_KeyW": event.preventDefault(); this.pressedKeys.W = 1; break;
            case "0_KeyS": event.preventDefault(); this.pressedKeys.S = 1; break;
            case "0_KeyA": event.preventDefault(); this.pressedKeys.A = 1; break;
            case "0_KeyD": event.preventDefault(); this.pressedKeys.D = 1; break;
        }
    }

    keyup(event) {

        let mod = event.ctrlKey * 4 + event.shiftKey * 2 + event.altKey * 1;
        switch (mod + "_" + event.code) {

            case "0_KeyW": event.preventDefault(); this.pressedKeys.W = 0; break;
            case "0_KeyS": event.preventDefault(); this.pressedKeys.S = 0; break;
            case "0_KeyA": event.preventDefault(); this.pressedKeys.A = 0; break;
            case "0_KeyD": event.preventDefault(); this.pressedKeys.D = 0; break;
        }
    }

    togglePause() {
        this.isPause = !this.isPause;
    }

    decreasePrecision() {
        this.precision /= 10 ** (1 / 3);
        this.precision = Math.max(this.precision, 0.0001);
    }

    increasePrecision() {
        this.precision *= 10 ** (1 / 3);
        this.precision = Math.min(this.precision, 10000);
    }

    toggleFollowShip() {

        this.isFollowShip = !this.isFollowShip;

        if (this.isFollowShip) {
            this.focus = this.focusShip;
        } else {
            this.focus = this.focusBody;
        }
    }

    cycleSolSys() {

        this.focusSolSysIndex = ++this.focusSolSysIndex % this.camSolSys.length;
        this.focusBody = this.camSolSys[this.focusSolSysIndex];
        this.focus = this.focusBody;

        this.focusMoonIndex = 0;
        this.bodiesMap.ship.switchParent(this.focusBody);
        this.isFollowShip = false;
    }

    cycleSolSysReverse() {

        this.focusSolSysIndex = (--this.focusSolSysIndex + this.camSolSys.length) % this.camSolSys.length;
        this.focusBody = this.camSolSys[this.focusSolSysIndex];
        this.focus = this.focusBody;

        this.focusMoonIndex = 0;
        this.bodiesMap.ship.switchParent(this.focusBody);
        this.isFollowShip = false;
    }

    cycleMoon() {

        let moons = this.camMoons[this.camSolSys[this.focusSolSysIndex].name];
        if (moons === null) { return; }

        this.focusMoonIndex = ++this.focusMoonIndex % moons.length;
        this.focusBody = moons[this.focusMoonIndex];
        this.focus = this.focusBody;

        this.bodiesMap.ship.switchParent(this.focusBody);
        this.isFollowShip = false;
    }

    cycleMoonReverse() {

        let moons = this.camMoons[this.camSolSys[this.focusSolSysIndex].name];
        if (moons === null) { return; }

        this.focusMoonIndex = (--this.focusMoonIndex + moons.length) % moons.length;
        this.focusBody = moons[this.focusMoonIndex];
        this.focus = this.focusBody;

        this.bodiesMap.ship.switchParent(this.focusBody);
        this.isFollowShip = false;
    }
}