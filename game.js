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
        this.calcMulti = 100;
        this.precision = 1;

        this.camera = new Camera(17);
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
    }

    initiate() {

        this.c.addEventListener("wheel", this.wheel.bind(this), false);
        document.body.addEventListener("keydown", this.keydown.bind(this), false);

        // ========================

        let sun = new Body("sun", "#FFF200", 696340, null, 0, 0);
        this.bodies.push(sun); this.bodiesMap.sun = sun;

        // ========================

        let mercury = new Body("mercury", "#B0B0B0", 2439.64, sun, 57909175, -90);
        this.bodies.push(mercury); this.bodiesMap.mercury = mercury;
        mercury.setVelCirc(sun);

        let venus = new Body("venus", "#FFECA0", 6051.59, sun, 108208930, 190);
        this.bodies.push(venus); this.bodiesMap.venus = venus;
        venus.setVelCirc(sun);

        let earth = new Body("earth", "#006AFF", 6378.10, sun, 149597890, 10);
        this.bodies.push(earth); this.bodiesMap.earth = earth;
        earth.setVelCirc(sun);

        let mars = new Body("mars", "#C74E33", 3397.00, sun, 227936640, 80);
        this.bodies.push(mars); this.bodiesMap.mars = mars;
        mars.setVelCirc(sun);

        let jupiter = new Body("jupiter", "#A6662B", 71492.68, sun, 778412010, -45);
        this.bodies.push(jupiter); this.bodiesMap.jupiter = jupiter;
        jupiter.setVelCirc(sun);

        let saturn = new Body("saturn", "#FFE4A6", 60267.14, sun, 1426725400, 200);
        this.bodies.push(saturn); this.bodiesMap.saturn = saturn;
        saturn.setVelCirc(sun);

        let uranus = new Body("uranus", "#80FFE8", 25557.25, sun, 2870972200, 135);
        this.bodies.push(uranus); this.bodiesMap.uranus = uranus;
        uranus.setVelCirc(sun);

        let neptune = new Body("neptune", "#2B7CFF", 24766.36, sun, 4498252900, 30);
        this.bodies.push(neptune); this.bodiesMap.neptune = neptune;
        neptune.setVelCirc(sun);

        // ========================

        let moon = new Body("moon", "#B5B0A3", 1737.1, earth, 384399, -135);
        this.bodies.push(moon); this.bodiesMap.moon = moon;
        moon.setVelCirc(sun);
        moon.setVelCirc(earth);

        let phobos = new Body("phobos", "#B5B0A3", 11.1, mars, 9377, 45);
        this.bodies.push(phobos); this.bodiesMap.phobos = phobos;
        phobos.setVelCirc(sun);
        phobos.setVelCirc(mars);

        let deimos = new Body("deimos", "#B5B0A3", 6.3, mars, 23460, -135);
        this.bodies.push(deimos); this.bodiesMap.deimos = deimos;
        deimos.setVelCirc(sun);
        deimos.setVelCirc(mars);

        let io = new Body("io", "#B5B0A3", 1815, jupiter, 421600, 15);
        this.bodies.push(io); this.bodiesMap.io = io;
        io.setVelCirc(sun);
        io.setVelCirc(jupiter);

        let europa = new Body("europa", "#B5B0A3", 1569, jupiter, 670900, 105);
        this.bodies.push(europa); this.bodiesMap.europa = europa;
        europa.setVelCirc(sun);
        europa.setVelCirc(jupiter);

        let ganymede = new Body("ganymede", "#B5B0A3", 2634.1, jupiter, 1070400, 80);
        this.bodies.push(ganymede); this.bodiesMap.ganymede = ganymede;
        ganymede.setVelCirc(sun);
        ganymede.setVelCirc(jupiter);

        let callisto = new Body("callisto", "#B5B0A3", 2410.3, jupiter, 1882700, -160);
        this.bodies.push(callisto); this.bodiesMap.callisto = callisto;
        callisto.setVelCirc(sun);
        callisto.setVelCirc(jupiter);

        let titan = new Body("titan", "#B5B0A3", 2576, saturn, 1221870, -80);
        this.bodies.push(titan); this.bodiesMap.titan = titan;
        titan.setVelCirc(sun);
        titan.setVelCirc(saturn);

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

        // let ship = new Body("ship", "#00FFA3", 0.01, earth, 6371 + 100 + 384400 / 2, 0);
        // this.bodies.push(ship); this.bodiesMap.ship = ship;
        // ship.setVelCirc(sun);
        // ship.setVelCirc(earth);

        // this.camShips.push(ship);
    }

    async gameLoop() {

        const timer = ms => new Promise(res => setTimeout(res, ms));

        while (true) {

            // if (!this.isPause) {
            for (let i = 0; i < this.calcMulti; i++) { this.moveBodies(); }
            this.calcTraj();
            // }

            this.moveCamera();
            this.draw();
            this.log();

            if (this.isPause) { return; }

            await timer(1);
        }
    }

    moveBodies() {

        let badPrecision = { badPrecision: false };
        let badPrecBodies = {};

        while (true) {
            for (let body of this.bodies) {
                body.calcGrav(this.bodies, this.precision, badPrecision, this.gravMap, this.logMap);
                if (badPrecision.badPrecision) { break; }
                // if (badPrecision.badPrecision) {
                //     badPrecision.badPrecision = false;
                //     badPrecBodies[body.name] = 1;
                //     continue;
                // }
            }

            if (badPrecision.badPrecision) {
                badPrecision.badPrecision = false;
                this.precision *= 100;
            } else { break; }
        }

        // // this.logMap=[];
        // for (let key in badPrecBodies) {
        //     this.logMap["badprec:" + key] = badPrecBodies[key];
        // }

        for (let body of this.bodies) {
            body.move(this.precision, badPrecBodies[body.name] !== undefined);
            body.addTrail(this.logMap);
        }
    }

    calcTraj() {
        // this.bodiesMap.ship.calcTraj(this.bodies, this.precision, this.gravMap, this.logMap);
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

    draw() {
        let offScreenCanvas = document.createElement("canvas");
        offScreenCanvas.width = this.c.width;
        offScreenCanvas.height = this.c.height;

        let offCtx = offScreenCanvas.getContext("2d");

        for (let i = this.bodies.length - 1; i >= 0; i--) {
            let body = this.bodies[i];
            body.drawTrail(offCtx, this.camera, this.logMap);
            body.drawBody(offCtx, this.camera, this.logMap);
            body.drawName(offCtx, this.camera, this.logMap);
        }

        this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
        this.ctx.fillRect(0, 0, offCtx.canvas.width, offCtx.canvas.height);

        this.ctx.filter = 'blur(4px)';
        this.ctx.drawImage(offScreenCanvas, 0, 0);

        this.ctx.filter = "none";
        this.ctx.drawImage(offScreenCanvas, 0, 0);
    }

    log() {
        let logStr = "";
        logStr += "focusBody: " + this.focusBody.name + "<br>";
        logStr += "calcMulti: " + this.calcMulti + "<br>";
        logStr += "precision: " + this.precision + "<br>";
        logStr += "zoom: " + this.camera.zoom + "<br>";

        logStr += "<br>";

        logStr += "log items: " + Object.keys(this.logMap).length + "<br>";

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

            case "0_Digit1": event.preventDefault(); this.calcMulti = 10 ** 0; break;
            case "0_Digit2": event.preventDefault(); this.calcMulti = 10 ** 1; break;
            case "0_Digit3": event.preventDefault(); this.calcMulti = 10 ** 2; break;
            case "0_Digit4": event.preventDefault(); this.calcMulti = 10 ** 3; break;

            case "0_F1": event.preventDefault(); this.precision = 10000; break; // surface
            case "0_F2": event.preventDefault(); this.precision = 100; break; // moons
            case "0_F3": event.preventDefault(); this.precision = 1; break; // inner planets
            case "0_F4": event.preventDefault(); this.precision = 0.01; break; // outer planets

            case "0_KeyF": event.preventDefault(); this.toggleFollowShip(); break;

            case "0_KeyZ": event.preventDefault(); this.cycleSolSys(); break;
            case "2_KeyZ": event.preventDefault(); this.cycleSolSysReverse(); break;

            case "0_KeyX": event.preventDefault(); this.cycleMoon(); break;
            case "2_KeyX": event.preventDefault(); this.cycleMoonReverse(); break;

            case "0_KeyW": event.preventDefault(); this.accelerate(); break;
            case "0_KeyS": event.preventDefault(); this.decelerate(); break;
            case "0_KeyA": event.preventDefault(); this.moveLeft(); break;
            case "0_KeyD": event.preventDefault(); this.moveRight(); break;
        }
    }

    togglePause() {
        this.isPause = !this.isPause;
        this.gameLoop();
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
    }

    cycleSolSysReverse() {

        this.focusSolSysIndex = (--this.focusSolSysIndex + this.camSolSys.length) % this.camSolSys.length;
        this.focusBody = this.camSolSys[this.focusSolSysIndex];
        this.focus = this.focusBody;

        this.focusMoonIndex = 0;
        this.bodiesMap.ship.switchParent(this.focusBody);
    }

    cycleMoon() {

        let moons = this.camMoons[this.camSolSys[this.focusSolSysIndex].name];
        if (moons === null) { return; }

        this.focusMoonIndex = ++this.focusMoonIndex % moons.length;
        this.focusBody = moons[this.focusMoonIndex];
        this.focus = this.focusBody;

        this.bodiesMap.ship.switchParent(this.focusBody);
    }

    cycleMoonReverse() {

        let moons = this.camMoons[this.camSolSys[this.focusSolSysIndex].name];
        if (moons === null) { return; }

        this.focusMoonIndex = (--this.focusMoonIndex + moons.length) % moons.length;
        this.focusBody = moons[this.focusMoonIndex];
        this.focus = this.focusBody;

        this.bodiesMap.ship.switchParent(this.focusBody);
    }

    calcShipDir() {
        let ship = this.bodiesMap.ship;
        let focus = this.focusBody;

        let dvx = ship.vx - focus.vx;
        let dvy = ship.vy - focus.vy;

        let a = Math.hypot(dvx, dvy);

        return [dvx / a, dvy / a];
    }

    accelerate() {
        let direction = this.calcShipDir();

        let ship = this.bodiesMap.ship;
        ship.vx += direction[0] * 100;
        ship.vy += direction[1] * 100;
    }

    decelerate() {
        let direction = this.calcShipDir();

        let ship = this.bodiesMap.ship;
        ship.vx += direction[0] * -100;
        ship.vy += direction[1] * -100;
    }

    moveRight() {
        let direction = this.calcShipDir();

        let ship = this.bodiesMap.ship;
        ship.vx += -direction[1] * 100;
        ship.vy += direction[0] * 100;
    }

    moveLeft() {
        let direction = this.calcShipDir();

        let ship = this.bodiesMap.ship;
        ship.vx += direction[1] * 100;
        ship.vy += -direction[0] * 100;
    }
}