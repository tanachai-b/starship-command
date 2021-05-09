"use strict";

class Camera {
    constructor(x, y, r, zoom) {

        this.x = x;
        this.y = y;
        this.r = r;
        this.zoom = zoom;

        this.vx = 0;
        this.vy = 0;
        this.vr = 0;
    }
}

class Game {

    constructor() {

        this.c = document.getElementById("canvas");
        this.ctx = this.c.getContext("2d");

        this.isPause = false;
        this.speed = -12;

        this.zoom = -49;
        this.isFollowSelf = true;
        this.camera = new Camera();
        this.camPosition;
        this.camAngle = 0;

        this.bodies = [];
        this.bodiesMap = {};

        this.camSolSys = [];
        this.camMoons = {};

        this.camSolSysIndex = 3;
        this.camMoonIndex = 0;
        this.camTargetIndex = 2;

        this.focus;
        this.target;

        this.badPrecBodies = {};

        this.pressedKeys = {};
        this.controlShip;

        this.mode = "Pilot";
        this.engine = "Thruster";
        this.maxFuel = 999999;
        this.fuel = 10000;

        this.heading = "Manual";

        this.progradeV = 0;
        this.radialInV = 0;
        this.plannedFuel = 0;

        this.enableBlurEffect = true;

        this.fuelStations = [];
        this.fuelStationsMap = {};

        this.logMap = {};
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

        // ========================

        let mercury = new Body("mercury", "#B0B0B0", 2439.64, 5.43, sun, 57909175, -90);
        this.bodies.push(mercury); this.bodiesMap.mercury = mercury;

        let venus = new Body("venus", "#FFECA0", 6051.59, 5.24, sun, 108208930, 190);
        this.bodies.push(venus); this.bodiesMap.venus = venus;

        let earth = new Body("earth", "#006AFF", 6378.10, 5.52, sun, 149597890, 10);
        this.bodies.push(earth); this.bodiesMap.earth = earth;

        let mars = new Body("mars", "#C74E33", 3397.00, 3.94, sun, 227936640, 60);
        this.bodies.push(mars); this.bodiesMap.mars = mars;

        let ceres = new Body("ceres", "#B0B0B0", 473, 2.16, sun, 413700000, 170);
        this.bodies.push(ceres); this.bodiesMap.ceres = ceres;

        let jupiter = new Body("jupiter", "#A6662B", 71492.68, 1.33, sun, 778412010, -45);
        this.bodies.push(jupiter); this.bodiesMap.jupiter = jupiter;

        let saturn = new Body("saturn", "#FFE4A6", 60267.14, 0.7, sun, 1426725400, 200);
        this.bodies.push(saturn); this.bodiesMap.saturn = saturn;

        let uranus = new Body("uranus", "#80FFE8", 25557.25, 1.3, sun, 2870972200, 135);
        this.bodies.push(uranus); this.bodiesMap.uranus = uranus;

        let neptune = new Body("neptune", "#2B7CFF", 24766.36, 1.76, sun, 4498252900, 30);
        this.bodies.push(neptune); this.bodiesMap.neptune = neptune;

        let pluto = new Body("pluto", "#B0B0B0", 1187, 1.87, sun, 5906380000, -100);
        this.bodies.push(pluto); this.bodiesMap.pluto = pluto;

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

        let triton = new Body("triton", "#B0B0B0", 1353.4, 2.061, neptune, 354759, -170);
        this.bodies.push(triton); this.bodiesMap.triton = triton;

        let charon = new Body("charon", "#B0B0B0", 603.5, 1.65, pluto, 17536, -100);
        this.bodies.push(charon); this.bodiesMap.charon = charon;

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

        // let starship = new Body("starship", "#00FFA3", 0.005, 0.5, earth, 6378.10 + 1000, 95);
        // this.bodies.push(starship); this.bodiesMap.starship = starship;
        // this.controlShip = starship;
        let starship = new Body("starship", "#00FFA3", 0.005, 0.5, earth, 6378.10 + 10000.03, -30.00015);
        this.bodies.push(starship); this.bodiesMap.starship = starship;
        this.controlShip = starship;

        let fuelStation1 = new Body("fuelStation1", "#349FC9", 0.02, 0.5, earth, 6378.10 + 10000, -30);
        this.bodies.push(fuelStation1); this.bodiesMap.fuelStation1 = fuelStation1;
        this.camMoons.earth.push(fuelStation1);
        this.fuelStations.push(fuelStation1); this.fuelStationsMap.fuelStation1 = { body: fuelStation1, fuel: 10000 };

        let fuelStation2 = new Body("fuelStation2", "#349FC9", 0.02, 0.5, earth, 1737.1 + 100000, 190);
        this.bodies.push(fuelStation2); this.bodiesMap.fuelStation2 = fuelStation2;
        this.camMoons.earth.push(fuelStation2);
        this.fuelStations.push(fuelStation2); this.fuelStationsMap.fuelStation2 = { body: fuelStation2, fuel: 20000 };

        let fuelStation3 = new Body("fuelStation3", "#349FC9", 0.02, 0.5, mars, 40000, 75);
        this.bodies.push(fuelStation3); this.bodiesMap.fuelStation3 = fuelStation3;
        this.camMoons.mars.push(fuelStation3);
        this.fuelStations.push(fuelStation3); this.fuelStationsMap.fuelStation3 = { body: fuelStation3, fuel: 20000 };
    }

    async gameLoop() {

        const timer = ms => new Promise(res => setTimeout(res, ms));

        while (true) {

            if (!this.isPause) {
                this.moveBodies();
                this.moveShip();
                this.refuel();
            }

            this.calcTrajectory();
            this.calcPlan();

            this.moveCamera();
            this.drawBodies();
            this.drawHUD();

            if (!this.isPause) { this.log(); }
            await timer(1);
        }
    }

    moveBodies() {

        let precision = 10 ** (this.speed / 3);

        this.badPrecBodies = {};

        for (let body of this.bodies) {
            body.calcGrav(this.bodies, precision, this.badPrecBodies, this.logMap);
        }

        if (Object.keys(this.badPrecBodies).length > 0) {
            for (let body of this.bodies) {
                body.calcGrav(this.bodies, precision, this.badPrecBodies, this.logMap);
            }
        }

        for (let body of this.bodies) {
            body.move(precision, this.badPrecBodies);
            // body.addTrail(this.logMap);
        }
    }

    moveShip() {
        this.rotateShip();
        if (this.engine === "RCS") { this.rcs(); }
        if (this.engine === "Thruster") { this.thruster(); }
    }

    toggleHoldHeading() {

        if (this.heading === "Hold") {
            this.heading = "Manual";
        } else {
            this.heading = "Hold"
        }
    }

    rotateShip() {

        if (this.controlShip === undefined) { return; }
        if (this.fuel === 0) { return; }

        let power = 1;

        if (this.pressedKeys.Q || this.pressedKeys.E) {

            this.heading = "Manual";

            if (this.pressedKeys.Shift) { power /= 10; }

            if (this.pressedKeys.Q) { this.controlShip.vr -= power; this.fuel -= power / 10; }
            if (this.pressedKeys.E) { this.controlShip.vr += power; this.fuel -= power / 10; }

            // this.controlShip.vr = this.controlShip.vr  % (2 * Math.PI);
            this.fuel = Math.max(this.fuel, 0);

        } else if (this.heading === "Hold") {

            if (this.pressedKeys.Shift) { power /= 10; }

            if (this.controlShip.vr < 0) {
                this.controlShip.vr += power;
                this.fuel -= power / 10;
            } else {
                this.controlShip.vr -= power;
                this.fuel -= power / 10;
            }

            // this.controlShip.vr = this.controlShip.vr  % (2 * Math.PI);
            this.fuel = Math.max(this.fuel, 0);

        } else {

            let goal = 0;

            if (this.heading === "prograde") {
                goal = -Math.PI / 2;
            } else if (this.heading === "retrograde") {
                goal = +Math.PI / 2;
            } else if (this.heading === "radial-out") {
                goal = -Math.PI;
            } else if (this.heading === "radial-in") {
                goal = 0;
            } else {
                return;
            }

            let parent = this.controlShip.parent;

            let dvx = this.controlShip.vx - parent.vx;
            let dvy = this.controlShip.vy - parent.vy;
            let prog = Math.atan2(dvy, dvx);

            let dir = this.controlShip.r + goal;

            let dist = (prog - dir + 5 * Math.PI) % (2 * Math.PI) - Math.PI;

            // this.logMap["prog"] = (prog + 5 * Math.PI) % (2 * Math.PI) - Math.PI;
            // this.logMap["dir"] = (dir + 5 * Math.PI) % (2 * Math.PI) - Math.PI;
            // this.logMap["dist"] = dist;

            let precision = 10 ** (this.speed / 3);

            if (dist < 0) {

                if (Math.sign(this.controlShip.vr) * this.controlShip.vr / power * this.controlShip.vr * precision / 2 > dist) {
                    this.controlShip.vr -= power;
                    this.fuel -= power / 10;
                    // this.logMap["move"] = "plus";
                } else {
                    this.controlShip.vr += power;
                    this.fuel -= power / 10;
                    // this.logMap["move"] = "minus";
                }
            } else {
                if (Math.sign(this.controlShip.vr) * this.controlShip.vr / power * this.controlShip.vr * precision / 2 < dist) {
                    this.controlShip.vr += power;
                    this.fuel -= power / 10;
                    // this.logMap["move"] = "plus";
                } else {
                    this.controlShip.vr -= power;
                    this.fuel -= power / 10;
                    // this.logMap["move"] = "minus";
                }
            }

            // this.controlShip.vr = this.controlShip.vr  % (2 * Math.PI);
            this.fuel = Math.max(this.fuel, 0);

            // this.logMap["triangle"] = Math.sign(this.controlShip.vr) * this.controlShip.vr * precision / 0.1 * this.controlShip.vr / 2;
        }
    }

    toggleEngine() {

        if (this.isPause) { return; }

        if (this.engine === "RCS") {
            this.engine = "Thruster";

        } else if (this.engine === "Thruster") {
            this.engine = "RCS";

            // this.progradeV = 0;
            // this.radialInV = 0;
            // this.plannedFuel = 0;

            this.mode = "Pilot";

            if (this.heading !== "Manual") {
                this.heading = "Hold";
            } else {
                this.heading = "Manual";
            }
        }
    }

    rcs() {
        if (this.controlShip === undefined) { return; }
        if (this.fuel === 0) { return; }

        let power = 0.1;
        if (this.pressedKeys.Shift) { power /= 10; }

        if (this.pressedKeys.W) { this.eachRcs(Math.atan2(-1, 0), power); this.fuel -= power; }
        if (this.pressedKeys.S) { this.eachRcs(Math.atan2(1, 0), power); this.fuel -= power; }
        if (this.pressedKeys.A) { this.eachRcs(Math.atan2(0, -1), power); this.fuel -= power; }
        if (this.pressedKeys.D) { this.eachRcs(Math.atan2(0, 1), power); this.fuel -= power; }

        this.fuel = Math.max(this.fuel, 0);
    }

    eachRcs(direction, power) {
        this.controlShip.vx += power * Math.cos(this.controlShip.r + direction);
        this.controlShip.vy += power * Math.sin(this.controlShip.r + direction);
    }

    thruster() {
        let power = 10;
        if (this.pressedKeys.Shift) { power /= 10; }

        if (this.mode === "Planning") {
            if (this.pressedKeys.W) { this.progradeV += power; }
            if (this.pressedKeys.S) { this.progradeV -= power; }
            if (this.pressedKeys.A) { this.radialInV += power; }
            if (this.pressedKeys.D) { this.radialInV -= power; }

            this.plannedFuel = Math.hypot(this.progradeV, this.radialInV);

        } else {
            if (this.pressedKeys.W) { this.heading = "prograde"; }
            if (this.pressedKeys.S) { this.heading = "retrograde"; }
            if (this.pressedKeys.A) { this.heading = "radial-in"; }
            if (this.pressedKeys.D) { this.heading = "radial-out"; }

            if (this.pressedKeys.Z || this.pressedKeys.X) {

                if (this.controlShip === undefined) { return; }
                if (this.fuel === 0) { return; }

                let vx1 = 0;
                let vy1 = 0;

                if (this.pressedKeys.Z) {
                    vx1 = power * Math.sin(this.controlShip.r);
                    vy1 = power * Math.cos(this.controlShip.r);
                }
                if (this.pressedKeys.X) {
                    vx1 = -power / 10 * Math.sin(this.controlShip.r);
                    vy1 = -power / 10 * Math.cos(this.controlShip.r);
                }

                if (this.progradeV !== 0 || this.radialInV !== 0) {
                    // minus current thrust from planned route / planned fuel
                    let dx = this.controlShip.vx - this.controlShip.parent.vx;
                    let dy = this.controlShip.vy - this.controlShip.parent.vy;
                    let dist = Math.hypot(dx, dy);
                    let prograde = { cos: dx / dist, sin: dy / dist };

                    let nvx = vx1 * prograde.cos - vy1 * prograde.sin;
                    let nvy = vy1 * prograde.cos + vx1 * prograde.sin;

                    this.progradeV -= nvx;
                    this.radialInV -= nvy;

                    this.plannedFuel = Math.hypot(this.progradeV, this.radialInV);
                }

                if (this.pressedKeys.Z) {
                    this.controlShip.vx += vx1;
                    this.controlShip.vy += -vy1;
                    this.fuel -= power;
                }
                if (this.pressedKeys.X) {
                    this.controlShip.vx += vx1;
                    this.controlShip.vy += -vy1;
                    this.fuel -= power / 10;
                }
            }

            this.fuel = Math.max(this.fuel, 0);
        }



        // if (this.mode === "Pilot") {

        //     if (this.fuel > this.plannedFuel) {

        //         this.fuel -= this.plannedFuel
        //         this.fuel = Math.max(this.fuel, 0);

        //         this.plannedFuel = 0;

        //         let parent = this.controlShip.parent;

        //         let dvx = this.controlShip.vx - parent.vx;
        //         let dvy = this.controlShip.vy - parent.vy;

        //         let dist = Math.hypot(dvx, dvy);

        //         let direction = { x: dvx / dist, y: dvy / dist };

        //         this.controlShip.vx += direction.x * this.progradeV;
        //         this.controlShip.vy += direction.y * this.progradeV;

        //         this.controlShip.vx += direction.y * this.radialInV;
        //         this.controlShip.vy += -direction.x * this.radialInV;
        //     }

        //     this.progradeV = 0;
        //     this.radialInV = 0;
        // }
    }

    refuel() {

        let refuelDistance = 0.04;
        let exchangeRate = 10000;
        let precision = 10 ** (this.speed / 3);

        for (let fuelStation in this.fuelStationsMap) {

            let station = this.fuelStationsMap[fuelStation]
            let stationBody = station.body;

            let ship = this.controlShip;

            let dx = stationBody.x - ship.x;
            let dy = stationBody.y - ship.y;

            if (Math.abs(dx) > refuelDistance) { continue; }
            if (Math.abs(dy) > refuelDistance) { continue; }

            let dist = Math.hypot(dx, dy);

            if (dist > refuelDistance) { continue; }

            if (station.fuel > 0) {

                this.fuel += exchangeRate * precision;
                station.fuel -= exchangeRate * precision;

                this.fuel = Math.min(this.fuel, this.maxFuel);
                station.fuel = Math.max(station.fuel, 0);

                break;
            }
        }
    }

    calcTrajectory() {
        for (let body of this.bodies) { body.calcTrajectory(this.logMap); }
    }

    calcPlan() {
        let isPlanning = this.mode === "Planning";
        this.controlShip.calcPlan(isPlanning, this.progradeV, this.radialInV, this.target, this.logMap);
    }

    toggleMode() {

        if (this.isPause) { return; }

        if (this.mode === "Pilot") {
            this.mode = "Planning";
            this.engine = "Thruster";

        } else if (this.mode === "Planning") {
            // this.progradeV = 0;
            // this.radialInV = 0;
            // this.plannedFuel = 0;
            this.mode = "Pilot";
        }
    }

    // executePlan() {

    //     if (this.isPause) { return; }

    //     if (this.progradeV === 0 && this.radialInV === 0) { return; }
    //     if (this.plannedFuel > this.fuel) { return; }

    //     this.mode = "Pilot";
    // }

    clearPlan() {

        if (this.isPause) { return; }

        this.progradeV = 0;
        this.radialInV = 0;
        this.plannedFuel = 0;

        this.mode = "Pilot";
    }

    moveCamera() {

        let precision = 10 ** (this.speed / 3);

        // initalize focus and target
        if (this.focus === undefined) {
            if (this.camMoonIndex != 0) {
                this.focus = this.camMoons[this.camSolSys[this.camSolSysIndex].name][this.camMoonIndex];
            } else {
                this.focus = this.camSolSys[this.camSolSysIndex];
            }
        }

        if (this.target === undefined) {
            this.target = this.camMoons[this.camSolSys[this.camSolSysIndex].name][this.camTargetIndex];
        }

        this.controlShip.switchParent(this.focus);

        if (this.isFollowSelf) {
            this.camPosition = this.controlShip;
        } else {
            this.camPosition = this.focus;
        }

        // initialize camera position
        if (this.camera.x === undefined && this.camera.y === undefined) {
            this.camera.x = this.camPosition.x;
            this.camera.y = this.camPosition.y;

        } else {
            if (!this.isPause) {
                this.camera.x += this.camPosition.vx * precision;
                this.camera.y += this.camPosition.vy * precision;
            }
            this.camera.x += (this.camPosition.x - this.camera.x) / 8;
            this.camera.y += (this.camPosition.y - this.camera.y) / 8;
        }

        // initialize camera zoom level
        if (this.camera.zoom === undefined) { this.camera.zoom = this.zoom; }

        // handle camera zoom
        if (this.pressedKeys.I) { this.zoom -= 1 / 4; }
        if (this.pressedKeys.K) { this.zoom += 1 / 4; }

        this.zoom = Math.max(this.zoom, -64);
        this.zoom = Math.min(this.zoom, 96);

        this.camera.zoom += (this.zoom - this.camera.zoom) / 8;

        // set camera rotation
        if (this.camera.r === undefined) { this.camera.r = 0; }

        if (this.engine === "RCS") {
            this.camAngle = -this.controlShip.r
        } else {
            this.camAngle = 0;
        }

        this.camera.r += ((this.camAngle - this.camera.r + 5 * Math.PI) % (2 * Math.PI) - Math.PI) / 8;
    }

    drawBodies() {

        let offScreenCanvas = document.createElement("canvas");
        offScreenCanvas.width = this.c.width;
        offScreenCanvas.height = this.c.height;

        let offCtx = offScreenCanvas.getContext("2d");

        for (let i = this.bodies.length - 1; i >= 0; i--) { this.bodies[i].drawTrail(offCtx, this.camera, this.logMap); }
        for (let i = this.bodies.length - 1; i >= 0; i--) { this.bodies[i].drawTrajectory(offCtx, this.camera, this.logMap); }

        for (let i = this.bodies.length - 1; i >= 0; i--) {
            let isHavePlan = this.progradeV !== 0 || this.radialInV !== 0;
            this.bodies[i].drawPlan(offCtx, this.camera, isHavePlan, this.logMap);
            this.bodies[i].drawPlanTarget(offCtx, this.camera, isHavePlan, this.logMap);
        }

        for (let i = this.bodies.length - 1; i >= 0; i--) {

            let isShip = this.bodies[i].name === this.controlShip.name;
            let isFuelStation = this.fuelStationsMap[this.bodies[i].name] !== undefined;

            this.bodies[i].drawBody(offCtx, this.camera, isShip, isFuelStation, this.logMap);
        }

        for (let i = this.bodies.length - 1; i >= 0; i--) {

            let isShip = this.bodies[i].name === this.controlShip.name;
            let isFocus = this.bodies[i].name === this.focus.name;
            let isPlanning = this.mode === "Planning";
            let isTarget = this.bodies[i].name === this.target.name;
            let isHavePlan = this.progradeV !== 0 || this.radialInV !== 0;

            this.bodies[i].drawMarker(offCtx, this.camera, isShip, isFocus, isPlanning, isTarget, isHavePlan, this.logMap);
        }

        for (let i = this.bodies.length - 1; i >= 0; i--) {
            let isShip = this.bodies[i].name === this.controlShip.name;
            this.bodies[i].drawName(offCtx, this.camera, isShip, this.isFollowSelf, this.fuelStationsMap, this.logMap);
        }

        this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        if (this.enableBlurEffect) {
            this.ctx.filter = 'blur(8px)';
            this.ctx.drawImage(offScreenCanvas, 0, 0);
        }

        this.ctx.filter = "none";
        this.ctx.drawImage(offScreenCanvas, 0, 0);
    }

    drawHUD() {

        let offScreenCanvas = document.createElement("canvas");
        offScreenCanvas.width = this.c.width;
        offScreenCanvas.height = this.c.height;

        let offCtx = offScreenCanvas.getContext("2d");

        this.addCrossHair(offCtx);
        this.addSideText(offCtx);
        this.addModeBorder(offCtx);

        if (this.enableBlurEffect) {
            this.ctx.filter = 'blur(8px)';
            this.ctx.drawImage(offScreenCanvas, 0, 0);
        }

        this.ctx.filter = "none";
        this.ctx.drawImage(offScreenCanvas, 0, 0);
    }

    addCrossHair(offCtx) {

        let cx = this.c.width / 2;
        let cy = this.c.height / 2

        offCtx.beginPath();
        offCtx.moveTo(cx + -64, cy + 0);
        offCtx.lineTo(cx + -32, cy + 0);
        offCtx.moveTo(cx + 32, cy + 0);
        offCtx.lineTo(cx + 64, cy + 0);
        offCtx.moveTo(cx + 0, cy + -64);
        offCtx.lineTo(cx + 0, cy + -32);
        offCtx.moveTo(cx + 0, cy + 32);
        offCtx.lineTo(cx + 0, cy + 64);

        offCtx.lineWidth = 2;
        offCtx.strokeStyle = "#00FFA3";
        if (this.mode === "Planning") { offCtx.strokeStyle = "#FF307C"; }
        if (this.engine === "RCS") { offCtx.strokeStyle = "#006EFF"; }
        offCtx.stroke();

        if (this.heading !== "Manual") {
            offCtx.beginPath();
            offCtx.moveTo(cx + 24, cy + 48);
            offCtx.lineTo(cx + 48, cy + 48);
            offCtx.lineTo(cx + 48, cy + 24);
            offCtx.moveTo(cx - 24, cy + 48);
            offCtx.lineTo(cx - 48, cy + 48);
            offCtx.lineTo(cx - 48, cy + 24);
            offCtx.moveTo(cx - 24, cy - 48);
            offCtx.lineTo(cx - 48, cy - 48);
            offCtx.lineTo(cx - 48, cy - 24);
            offCtx.moveTo(cx + 24, cy - 48);
            offCtx.lineTo(cx + 48, cy - 48);
            offCtx.lineTo(cx + 48, cy - 24);
        }

        offCtx.lineWidth = 1;
        offCtx.strokeStyle = "#00FFA3";
        if (this.mode === "Planning") { offCtx.strokeStyle = "#FF307C"; }
        if (this.engine === "RCS") { offCtx.strokeStyle = "#006EFF"; }
        offCtx.stroke();
    }

    addSideText(offCtx) {

        // fuel usange (planned)
        let plannedFuelText = ""
        if (this.plannedFuel > 0) {
            plannedFuelText = " (-" + Math.round(this.plannedFuel) + ")";
        }

        // distance to target
        let tdx = this.target.x - this.controlShip.x;
        let tdy = this.target.y - this.controlShip.y;
        let targDist = Math.hypot(tdx, tdy);

        // distance to target (planned)
        let planDistText = ""
        if (this.controlShip.targetClosest !== undefined && this.controlShip.planClosest !== undefined) {
            let pdx = this.controlShip.targetClosest.x - this.controlShip.planClosest.x;
            let pdy = this.controlShip.targetClosest.y - this.controlShip.planClosest.y;
            planDistText = " (" + Math.round(Math.hypot(pdx, pdy)) + ")";
        }

        // relative velocy
        let dvx = this.target.vx - this.controlShip.vx;
        let dvy = this.target.vy - this.controlShip.vy;
        let relativeV = Math.hypot(dvx, dvy);

        let texts = [];
        texts.push("V0.1");
        texts.push("");
        texts.push("[Backspace]  : Toggle Blur Effect");
        texts.push("[Space]      : Pause Simulator");
        texts.push("[,][.]       : Slowdown, Speedup Time");
        texts.push("");
        texts.push("[I][K]       : Zoom In, Zoom Out");
        texts.push("[J][L]       : Cycle Moons/Objects");
        texts.push("[H][;]       : Cycle Planets");
        texts.push("[U][O]       : Cycle Targets");
        texts.push("[N]          : Toggle Focus on Ship");
        texts.push("");
        texts.push("[E][Q]       : Manual Heading Controls");
        texts.push("[W][S][A][D] : Auto Heading Controls (Main)");
        texts.push("[C]          : Toggle Hold/Manual Heading");
        texts.push("[Z][X]       : Main Thruster Controls (Main)");
        texts.push("");
        texts.push("[R]          : Toggle RCS Thruster Mode");
        texts.push("[W][S][A][D] : Direction Controls (RCS)");
        texts.push("");
        texts.push("[F]          : Toggle Trajectory Planning");
        texts.push("[W][S][A][D] : Plan Direction Controls (Plan Mode)");
        texts.push("[V]          : Discard Plan");
        texts.push("");
        // texts.push("Trajectory Relative To     : " + this.focus.name.charAt(0).toUpperCase() + this.focus.name.slice(1));
        // texts.push("Find Closest Approach To   : " + this.target.name.charAt(0).toUpperCase() + this.target.name.slice(1));
        texts.push("Distance to Target : " + Math.round(targDist) + planDistText);
        texts.push("Relative Velocity  : " + Math.round(relativeV));
        texts.push("");
        texts.push("Fuel   : " + Math.round(this.fuel) + plannedFuelText);
        texts.push("");
        // texts.push("Heading : " + this.heading.charAt(0).toUpperCase() + this.heading.slice(1));
        // texts.push("Engine : " + this.engine);
        // texts.push("Mode : " + this.mode);
        texts.push("");
        texts.push("");
        texts.push("");
        texts.push("Zoom             : " + this.zoom);
        texts.push("Simulation Speed : " + this.speed + (this.isPause ? " [PAUSED]" : ""));


        offCtx.textBaseline = "top";
        offCtx.fillStyle = "#00FFA3";
        offCtx.font = "19px Syne Mono";

        offCtx.fillText("Starship Command", 8, 8);

        offCtx.textBaseline = "top";
        offCtx.fillStyle = "#888888";
        offCtx.font = "13px Syne Mono";

        let y = 24;
        for (let text of texts) {
            offCtx.fillText(text, 8, 8 + y);
            y += 24;
        }

        offCtx.textAlign = "center";
        offCtx.textBaseline = "bottom";
        offCtx.font = "13px Syne Mono";
        offCtx.fillText("© 2021 Tanachai Bunlutangtum, All Rights Reserved", this.c.width / 2, this.c.height - 4);
    }

    addModeBorder(offCtx) {

        if (this.isPause) {

            offCtx.strokeStyle = "#FFE100";
            offCtx.lineWidth = 5;
            offCtx.strokeRect(0, 0, this.c.width, this.c.height);

            offCtx.textAlign = "center";
            offCtx.textBaseline = "top";
            offCtx.font = "32px Syne Mono";
            offCtx.fillStyle = "#FFE100";;
            offCtx.fillText("Paused", this.c.width / 2, 16);

        } else if (this.mode === "Planning") {

            offCtx.strokeStyle = "#FF307C";
            offCtx.lineWidth = 5;
            offCtx.strokeRect(0, 0, this.c.width, this.c.height);

            offCtx.textAlign = "center";
            offCtx.textBaseline = "top";
            offCtx.font = "32px Syne Mono";
            offCtx.fillStyle = "#FF307C";;
            offCtx.fillText("Trajectory Planning", this.c.width / 2, 16);

            offCtx.font = "24px Syne Mono";
            offCtx.fillText("Relative to: " + this.focus.name.charAt(0).toUpperCase() + this.focus.name.slice(1), this.c.width / 2, 64);

            offCtx.textAlign = "center";
            offCtx.textBaseline = "bottom";
            offCtx.font = "24px Syne Mono";
            offCtx.fillStyle = "#FFE100";;
            offCtx.fillText("Target: " + this.target.name.charAt(0).toUpperCase() + this.target.name.slice(1), this.c.width / 2, this.c.height - 32);

        } else if (this.engine === "RCS") {

            offCtx.strokeStyle = "#006EFF";
            offCtx.lineWidth = 5;
            offCtx.strokeRect(0, 0, this.c.width, this.c.height);

            offCtx.textAlign = "center";
            offCtx.textBaseline = "top";
            offCtx.font = "32px Syne Mono";
            offCtx.fillStyle = "#006EFF";;
            offCtx.fillText("RCS Mode", this.c.width / 2, 16);

            offCtx.font = "24px Syne Mono";
            offCtx.fillText("Orbiting: " + this.focus.name.charAt(0).toUpperCase() + this.focus.name.slice(1), this.c.width / 2, 64);

            offCtx.textAlign = "center";
            offCtx.textBaseline = "bottom";
            offCtx.font = "24px Syne Mono";
            offCtx.fillStyle = "#FFE100";;
            offCtx.fillText("Target: " + this.target.name.charAt(0).toUpperCase() + this.target.name.slice(1), this.c.width / 2, this.c.height - 32);

        } else {
            offCtx.textAlign = "center";
            offCtx.textBaseline = "top";
            offCtx.font = "32px Syne Mono";
            offCtx.fillStyle = "#00FFA3";
            offCtx.fillText("Orbiting " + this.focus.name.charAt(0).toUpperCase() + this.focus.name.slice(1), this.c.width / 2, 16);

            offCtx.font = "24px Syne Mono";
            offCtx.fillText("Heading: " + this.heading.charAt(0).toUpperCase() + this.heading.slice(1), this.c.width / 2, 64);

            offCtx.textAlign = "center";
            offCtx.textBaseline = "bottom";
            offCtx.font = "24px Syne Mono";
            offCtx.fillStyle = "#FFE100";;
            offCtx.fillText("Target: " + this.target.name.charAt(0).toUpperCase() + this.target.name.slice(1), this.c.width / 2, this.c.height - 32);
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
        // event.preventDefault();
        // this.zoom += Math.sign(event.deltaY);
        // this.camera.r -= Math.sign(event.deltaY) / 180 * Math.PI;
    }

    keydown(event) {
        // console.log(event)
        let mod = event.ctrlKey * 4 + event.shiftKey * 2 + event.altKey * 1;
        switch (mod + "_" + event.code) {

            case "0_Space": event.preventDefault(); this.togglePause(); break;

            case "0_Comma": event.preventDefault(); this.cyclePrecision(-1); break;
            case "0_Period": event.preventDefault(); this.cyclePrecision(1); break;

            case "0_KeyI": event.preventDefault(); this.pressedKeys.I = 1; break;
            case "0_KeyK": event.preventDefault(); this.pressedKeys.K = 1; break;

            case "0_KeyH": event.preventDefault(); this.cycleSolSys(-1); break;
            case "0_Semicolon": event.preventDefault(); this.cycleSolSys(1); break;

            case "0_KeyJ": event.preventDefault(); this.cycleMoon(-1); break;
            case "0_KeyL": event.preventDefault(); this.cycleMoon(1); break;

            case "0_KeyU": event.preventDefault(); this.cycleTarget(-1); break;
            case "0_KeyO": event.preventDefault(); this.cycleTarget(1); break;

            case "0_KeyN": event.preventDefault(); this.toggleFollowSelf(); break;

            case "0_Backslash": event.preventDefault(); this.takeControl(); break;

            case "0_KeyW": event.preventDefault(); this.pressedKeys.W = 1; break;
            case "0_KeyS": event.preventDefault(); this.pressedKeys.S = 1; break;
            case "0_KeyA": event.preventDefault(); this.pressedKeys.A = 1; break;
            case "0_KeyD": event.preventDefault(); this.pressedKeys.D = 1; break;

            case "2_KeyW": event.preventDefault(); this.pressedKeys.W = 1; break;
            case "2_KeyS": event.preventDefault(); this.pressedKeys.S = 1; break;
            case "2_KeyA": event.preventDefault(); this.pressedKeys.A = 1; break;
            case "2_KeyD": event.preventDefault(); this.pressedKeys.D = 1; break;

            case "0_KeyQ": event.preventDefault(); this.pressedKeys.Q = 1; break;
            case "0_KeyE": event.preventDefault(); this.pressedKeys.E = 1; break;

            case "2_KeyQ": event.preventDefault(); this.pressedKeys.Q = 1; break;
            case "2_KeyE": event.preventDefault(); this.pressedKeys.E = 1; break;

            case "0_KeyZ": event.preventDefault(); this.pressedKeys.Z = 1; break;
            case "0_KeyX": event.preventDefault(); this.pressedKeys.X = 1; break;

            case "2_KeyZ": event.preventDefault(); this.pressedKeys.Z = 1; break;
            case "2_KeyX": event.preventDefault(); this.pressedKeys.X = 1; break;

            case "2_ShiftLeft": event.preventDefault(); this.pressedKeys.Shift = 1; break;

            case "0_KeyF": event.preventDefault(); this.toggleMode(); break;
            // case "0_KeyG": event.preventDefault(); this.executePlan(); break;
            case "0_KeyV": event.preventDefault(); this.clearPlan(); break;

            case "0_KeyR": event.preventDefault(); this.toggleEngine(); break;

            case "0_KeyC": event.preventDefault(); this.toggleHoldHeading(); break;

            case "0_Backspace": event.preventDefault(); this.enableBlurEffect = !this.enableBlurEffect; break;
        }
        // console.log(this.pressedKeys)
    }

    keyup(event) {
        let mod = event.ctrlKey * 4 + event.shiftKey * 2 + event.altKey * 1;
        // console.log(mod + "_" + event.code)
        switch (mod + "_" + event.code) {

            case "0_KeyI": event.preventDefault(); this.pressedKeys.I = 0; break;
            case "0_KeyK": event.preventDefault(); this.pressedKeys.K = 0; break;

            case "0_KeyW": event.preventDefault(); this.pressedKeys.W = 0; break;
            case "0_KeyS": event.preventDefault(); this.pressedKeys.S = 0; break;
            case "0_KeyA": event.preventDefault(); this.pressedKeys.A = 0; break;
            case "0_KeyD": event.preventDefault(); this.pressedKeys.D = 0; break;

            case "2_KeyW": event.preventDefault(); this.pressedKeys.W = 0; break;
            case "2_KeyS": event.preventDefault(); this.pressedKeys.S = 0; break;
            case "2_KeyA": event.preventDefault(); this.pressedKeys.A = 0; break;
            case "2_KeyD": event.preventDefault(); this.pressedKeys.D = 0; break;

            case "0_KeyQ": event.preventDefault(); this.pressedKeys.Q = 0; break;
            case "0_KeyE": event.preventDefault(); this.pressedKeys.E = 0; break;

            case "2_KeyQ": event.preventDefault(); this.pressedKeys.Q = 0; break;
            case "2_KeyE": event.preventDefault(); this.pressedKeys.E = 0; break;

            case "0_KeyZ": event.preventDefault(); this.pressedKeys.Z = 0; break;
            case "0_KeyX": event.preventDefault(); this.pressedKeys.X = 0; break;

            case "2_KeyZ": event.preventDefault(); this.pressedKeys.Z = 0; break;
            case "2_KeyX": event.preventDefault(); this.pressedKeys.X = 0; break;

            case "0_ShiftLeft": event.preventDefault(); this.pressedKeys.Shift = 0; break;
        }
        // console.log(this.pressedKeys)
    }

    togglePause() {
        this.isPause = !this.isPause;
    }

    cyclePrecision(direction) {

        this.speed += direction;

        this.speed = Math.min(this.speed, 12);
        this.speed = Math.max(this.speed, -12);
    }

    cycleSolSys(direction) {

        this.camSolSysIndex += direction;
        this.camSolSysIndex = (this.camSolSysIndex + this.camSolSys.length) % this.camSolSys.length;
        this.focus = this.camSolSys[this.camSolSysIndex];
        this.target = this.camSolSys[this.camSolSysIndex];

        this.controlShip.switchParent(this.focus);
        // this.isFollowSelf = false;

        this.camMoonIndex = 0;
        this.camTargetIndex = 0;
    }

    cycleMoon(direction) {

        let moons = this.camMoons[this.camSolSys[this.camSolSysIndex].name];
        if (moons === null) { return; }

        this.camMoonIndex += direction;
        this.camMoonIndex = (this.camMoonIndex + moons.length) % moons.length;
        this.focus = moons[this.camMoonIndex];

        this.controlShip.switchParent(this.focus);
        // this.isFollowSelf = false;
    }

    cycleTarget(direction) {

        if (this.camSolSysIndex === 0) {

            this.camTargetIndex += direction;
            this.camTargetIndex = (this.camTargetIndex + this.camSolSys.length) % this.camSolSys.length;
            this.target = this.camSolSys[this.camTargetIndex];

        } else {
            let moons = this.camMoons[this.camSolSys[this.camSolSysIndex].name];
            if (moons === null) { return; }

            this.camTargetIndex += direction;
            this.camTargetIndex = (this.camTargetIndex + moons.length) % moons.length;
            this.target = moons[this.camTargetIndex];
        }
    }

    toggleFollowSelf() {

        this.isFollowSelf = !this.isFollowSelf;

        if (this.isFollowSelf) {
            this.camPosition = this.controlShip;
        } else {
            this.camPosition = this.focus;
        }
    }

    takeControl() {

    }
}