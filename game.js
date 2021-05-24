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

        this.version = "V0.0.1 (2021-05-23)";
        this.c = document.getElementById("canvas");
        this.ctx = this.c.getContext("2d");

        this.background;
        this.overlay;

        this.isPause = false;
        this.speed = -12;

        this.zoom = 25;
        this.isFollowSelf = true;
        this.camera = new Camera();
        this.camFocus;
        this.camAngle = 0;

        this.bodies = [];
        this.bodiesMap = {};

        this.fuelStations = [];
        this.fuelStationsMap = {};

        this.badPrecBodies = {};

        // this.camSolSys = [];
        // this.camMoons = {};

        // this.camSolSysIndex = 3;
        // this.camMoonIndex = 0;
        // this.camTargetIndex = 0;

        this.controlShip;
        this.focus;
        this.target;

        this.pressedKeys = {};

        this.heading = "Manual";
        this.mode = "Pilot";
        this.engine = "Thruster";

        this.maxFuel = 999999;
        this.fuel = 999999;

        this.progradeV = 0;
        this.radialInV = 0;
        this.plannedFuel = 0;

        this.enableBlurEffect = true;
        this.drawTrajectories = false;

        this.maxCargo = 10000;
        this.cargo = 10000;

        this.cash = 0;

        this.lastFrameTime;
        this.frameRate;
        this.frameCount = 0;

        this.logMap = {};
    }

    initiate() {

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

        let mars = new Body("mars", "#C74E33", 3397.00, 3.94, sun, 227936640, 45);
        this.bodies.push(mars); this.bodiesMap.mars = mars;

        let ceres = new Body("ceres", "#B0B0B0", 473, 2.16, sun, 413700000, 80);
        this.bodies.push(ceres); this.bodiesMap.ceres = ceres;

        let jupiter = new Body("jupiter", "#A6662B", 71492.68, 1.33, sun, 778412010, 70);
        this.bodies.push(jupiter); this.bodiesMap.jupiter = jupiter;

        let saturn = new Body("saturn", "#FFE4A6", 60267.14, 0.7, sun, 1426725400, 155);
        this.bodies.push(saturn); this.bodiesMap.saturn = saturn;

        let uranus = new Body("uranus", "#80FFE8", 25557.25, 1.3, sun, 2870972200, 185);
        this.bodies.push(uranus); this.bodiesMap.uranus = uranus;

        let neptune = new Body("neptune", "#2B7CFF", 24766.36, 1.76, sun, 4498252900, 30);
        this.bodies.push(neptune); this.bodiesMap.neptune = neptune;

        let pluto = new Body("pluto", "#B0B0B0", 1187, 1.87, sun, 5906380000, -100);
        this.bodies.push(pluto); this.bodiesMap.pluto = pluto;

        // ========================

        let moon = new Body("moon", "#B5B0A3", 1737.1, 3.3464, earth, 384399, 5);
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

        let fuelStation1 = new Body("fuelStation1", "#349FC9", 0.02, 0.5, earth, 10000, -120);
        this.bodies.push(fuelStation1); this.bodiesMap.fuelStation1 = fuelStation1;
        this.fuelStations.push(fuelStation1); this.fuelStationsMap.fuelStation1 = { body: fuelStation1, fuel: 0 };

        let fuelStation2 = new Body("fuelStation2", "#349FC9", 0.02, 0.5, earth, 30000, -0);
        this.bodies.push(fuelStation2); this.bodiesMap.fuelStation2 = fuelStation2;
        this.fuelStations.push(fuelStation2); this.fuelStationsMap.fuelStation2 = { body: fuelStation2, fuel: 20000 };

        let fuelStation3 = new Body("fuelStation3", "#349FC9", 0.02, 0.5, earth, 100000, 110);
        this.bodies.push(fuelStation3); this.bodiesMap.fuelStation3 = fuelStation3;
        this.fuelStations.push(fuelStation3); this.fuelStationsMap.fuelStation3 = { body: fuelStation3, fuel: 20000 };

        // ========================

        let starship = new Body("starship", "#00FFA3", 0.005, 0.5, earth, 10000.05, -120.00005);
        this.bodies.push(starship); this.bodiesMap.starship = starship;

        for (let body of this.bodies) {
            if (body.child.length === 0) { continue; }

            body.child.sort(function (a, b) { return a.distance - b.distance; });

            for (let i = 0; i < body.child.length; i++) {
                let child = body.child[i];
                body.childMap[child.name] = i;
            }
        }

        // ========================

        this.controlShip = starship;
        this.focus = earth;
        this.target = earth;

        // for (let body of this.bodies) {

        //     if (body.name === "starship") {
        //         continue;

        //     } else if (body.name === "sun") {
        //         this.camSolSys.push(body);

        //     } else if (body.parent.name === "sun") {
        //         this.camSolSys.push(body);
        //         this.camMoons[body.name] = [body];

        //     } else {
        //         this.camMoons[body.parent.name].push(body);
        //     }
        // }

        // for (let planet in this.camMoons) {
        //     this.camMoons[planet][0].distance = 0;
        //     this.camMoons[planet].sort(function (a, b) { return a.distance - b.distance; });
        // }
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

            this.drawBackground();
            this.drawBodies();
            this.drawHUD();

            if (!this.isPause) { this.log(); }

            if (this.lastFrameTime !== undefined) {
                this.frameRate = (1000 / (Date.now() - this.lastFrameTime)).toFixed(2);
            }
            this.lastFrameTime = Date.now();

            this.frameCount++;
            if (this.frameCount >= 1000) { this.frameCount = 0; }

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

    autoHeading(key) {

        if (this.isPause) { return; }

        if (this.mode === "Planning") { return; }
        if (this.engine === "RCS") { return; }

        let keyHeading = "Manual";
        switch (key) {
            case "W": keyHeading = "Prograde"; break;
            case "S": keyHeading = "Retrograde"; break;
            case "A": keyHeading = "Radial-in"; break;
            case "D": keyHeading = "Radial-out"; break;
            case "F": keyHeading = "Planned"; break;
        }

        if (this.heading !== keyHeading) {
            this.heading = keyHeading;
        } else {
            this.heading = "Manual";
        }
    }

    holdHeading() {
        if (this.heading !== "Hold") {
            this.heading = "Hold";
        } else {
            this.heading = "Manual";
        }
    }

    rotateShip() {

        if (this.controlShip === undefined) { return; }
        if (this.fuel === 0) { return; }

        let power = 1;
        if (this.pressedKeys.Shift) { power /= 10; }

        if (this.pressedKeys.Q || this.pressedKeys.E) {

            this.heading = "Manual";

            if (this.pressedKeys.Q) { this.controlShip.vr -= power; this.fuel -= power / 100; }
            if (this.pressedKeys.E) { this.controlShip.vr += power; this.fuel -= power / 100; }

            this.fuel = Math.max(this.fuel, 0);

        } else if (this.heading === "Hold") {

            if (this.controlShip.vr < 0) {
                this.controlShip.vr += power;
                this.fuel -= power / 100;
            } else if (this.controlShip.vr > 0) {
                this.controlShip.vr -= power;
                this.fuel -= power / 100;
            }

            this.fuel = Math.max(this.fuel, 0);

        } else {

            let heading = 0;

            if (this.heading === "Prograde") { heading = 0; }
            else if (this.heading === "Retrograde") { heading = Math.PI; }
            else if (this.heading === "Radial-out") { heading = Math.PI / 2; }
            else if (this.heading === "Radial-in") { heading = -Math.PI / 2; }
            else if (this.heading === "Planned") { heading = Math.atan2(this.radialInV, this.progradeV); }
            else { return; }

            let dvx = this.controlShip.vx - this.focus.vx;
            let dvy = this.controlShip.vy - this.focus.vy;
            let prograde = Math.atan2(dvy, dvx);

            let curDir = this.controlShip.r;

            let dist = ((((prograde + heading - curDir + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;


            let precision = 10 ** (this.speed / 3);

            if (dist < 0) {

                if (Math.sign(this.controlShip.vr) * this.controlShip.vr / power * this.controlShip.vr * precision / 2 > dist) {
                    this.controlShip.vr -= power;
                    this.fuel -= power / 100;
                } else {
                    this.controlShip.vr += power;
                    this.fuel -= power / 100;
                }
            } else {
                if (Math.sign(this.controlShip.vr) * this.controlShip.vr / power * this.controlShip.vr * precision / 2 < dist) {
                    this.controlShip.vr += power;
                    this.fuel -= power / 100;
                } else {
                    this.controlShip.vr -= power;
                    this.fuel -= power / 100;
                }
            }

            this.fuel = Math.max(this.fuel, 0);
        }
    }

    toggleEngine() {

        if (this.isPause) { return; }

        if (this.engine === "RCS") {
            this.engine = "Thruster";

        } else if (this.engine === "Thruster") {
            this.engine = "RCS";
            this.mode = "Pilot";
            this.heading = "Manual";
        }
    }

    rcs() {
        if (this.controlShip === undefined) { return; }
        if (this.fuel === 0) { return; }

        let power = 0.1;
        if (this.pressedKeys.Shift) { power /= 10; }

        if (this.pressedKeys.W) { this.eachRcs(Math.atan2(0, 1), power); this.fuel -= power; }
        if (this.pressedKeys.S) { this.eachRcs(Math.atan2(0, -1), power); this.fuel -= power; }
        if (this.pressedKeys.A) { this.eachRcs(Math.atan2(-1, 0), power); this.fuel -= power; }
        if (this.pressedKeys.D) { this.eachRcs(Math.atan2(1, 0), power); this.fuel -= power; }

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
            if (this.pressedKeys.A) { this.radialInV -= power; }
            if (this.pressedKeys.D) { this.radialInV += power; }

            this.plannedFuel = Math.hypot(this.progradeV, this.radialInV);

        } else {

            if (this.pressedKeys.Z || this.pressedKeys.X) {

                if (this.controlShip === undefined) { return; }
                if (this.fuel === 0) { return; }

                let vx1 = 0;
                let vy1 = 0;

                if (this.pressedKeys.Z) {
                    vx1 = power * Math.cos(this.controlShip.r);
                    vy1 = power * Math.sin(this.controlShip.r);
                    this.fuel -= power;
                }
                if (this.pressedKeys.X) {
                    vx1 = -power / 10 * Math.cos(this.controlShip.r);
                    vy1 = -power / 10 * Math.sin(this.controlShip.r);
                    this.fuel -= power / 10;
                }

                this.fuel = Math.max(this.fuel, 0);

                // minus current thrust from planned route / planned fuel
                if (this.progradeV !== 0 || this.radialInV !== 0) {

                    let ship = this.controlShip;

                    let dvx = ship.vx - this.focus.vx;
                    let dvy = ship.vy - this.focus.vy;
                    let dist = Math.hypot(dvx, dvy);

                    let pvx = dvx + this.progradeV * dvx / dist - this.radialInV * dvy / dist;
                    let pvy = dvy + this.radialInV * dvx / dist + this.progradeV * dvy / dist;

                    let nvx = dvx + vx1;
                    let nvy = dvy + vy1;
                    let ndist = Math.hypot(nvx, nvy);

                    let dpvx = pvx - nvx;
                    let dpvy = pvy - nvy;

                    this.progradeV = dpvx * nvx / ndist - dpvy * -nvy / ndist;
                    this.radialInV = dpvy * nvx / ndist + dpvx * -nvy / ndist;

                    this.plannedFuel = Math.hypot(this.progradeV, this.radialInV);
                }

                this.controlShip.vx += vx1;
                this.controlShip.vy += vy1;
            }
        }
    }

    refuel() {

        if (this.controlShip === undefined) { return; }

        let precision = 10 ** (this.speed / 3);

        let stationRefuelRate = 100;
        let stationMaxFuel = 20000;

        let refuelDistance = 0.04;
        let exchangeRate = 100000;

        for (let fuelStation in this.fuelStationsMap) {

            let station = this.fuelStationsMap[fuelStation];

            // refuel station
            station.fuel += stationRefuelRate * precision;
            station.fuel = Math.min(station.fuel, stationMaxFuel);

            // refuel ship (if near)
            let stationBody = station.body;

            let ship = this.controlShip;

            let dx = stationBody.x - ship.x;
            if (Math.abs(dx) > refuelDistance) { continue; }

            let dy = stationBody.y - ship.y;
            if (Math.abs(dy) > refuelDistance) { continue; }

            let dist = Math.hypot(dx, dy);
            if (dist > refuelDistance) { continue; }

            if (station.fuel > 0) {

                this.fuel += exchangeRate * precision;
                station.fuel -= exchangeRate * precision;

                this.fuel = Math.min(this.fuel, this.maxFuel);
                station.fuel = Math.max(station.fuel, 0);
            }
        }
    }

    calcTrajectory() {

        for (let body of this.bodies) {

            if (this.controlShip !== undefined && body.name === this.controlShip.name) {
                body.calcTrajAdv(this.target, this.logMap);

            } else if (this.drawTrajectories) {
                body.calcTrajectory(this.logMap);
            }
        }
    }

    calcPlan() {
        if (this.controlShip === undefined) { return; }
        this.controlShip.calcPlan(this.progradeV, this.radialInV, this.target, this.logMap);
    }

    toggleMode() {

        if (this.isPause) { return; }

        if (this.mode === "Pilot") {
            this.mode = "Planning";
            this.engine = "Thruster";
            this.heading = "Manual";

        } else if (this.mode === "Planning") {
            this.mode = "Pilot";
        }
    }

    clearPlan() {

        if (this.isPause) { return; }

        this.progradeV = 0;
        this.radialInV = 0;
        this.plannedFuel = 0;

        this.mode = "Pilot";
    }

    moveCamera() {

        let precision = 10 ** (this.speed / 3);

        // // initalize focus and target
        // if (this.focus === undefined) {
        //     if (this.camMoonIndex != 0) {
        //         this.focus = this.camMoons[this.camSolSys[this.camSolSysIndex].name][this.camMoonIndex];
        //     } else {
        //         this.focus = this.camSolSys[this.camSolSysIndex];
        //     }
        // }

        // if (this.target === undefined) {
        //     this.target = this.camMoons[this.camSolSys[this.camSolSysIndex].name][this.camTargetIndex];
        // }

        // this.controlShip.switchParent(this.focus);
        // this.changeFocus(this.focus);

        if (this.controlShip !== undefined && this.isFollowSelf) {
            this.camFocus = this.controlShip;
        } else {
            this.camFocus = this.target;
        }

        // initialize camera position
        if (this.camera.x === undefined && this.camera.y === undefined) {
            this.camera.x = this.camFocus.x;
            this.camera.y = this.camFocus.y;

        } else {
            if (!this.isPause) {
                this.camera.x += this.camFocus.vx * precision;
                this.camera.y += this.camFocus.vy * precision;
            }
            this.camera.x += (this.camFocus.x - this.camera.x) / 8;
            this.camera.y += (this.camFocus.y - this.camera.y) / 8;
        }

        // initialize camera zoom level
        if (this.camera.zoom === undefined) { this.camera.zoom = this.zoom; }

        // handle camera zoom
        if (this.pressedKeys.I) { this.zoom -= 1 / 4; }
        if (this.pressedKeys.K) { this.zoom += 1 / 4; }

        this.zoom = Math.max(this.zoom, -60);
        this.zoom = Math.min(this.zoom, 100);

        this.camera.zoom += (this.zoom - this.camera.zoom) / 8;

        // set camera rotation
        if (this.camera.r === undefined) { this.camera.r = 0; }

        if (this.engine === "RCS") {
            this.camAngle = -this.controlShip.r - Math.PI / 2;
        } else {
            this.camAngle = 0;
        }

        let dr = (((this.camAngle - this.camera.r + Math.PI) % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI) - Math.PI;
        this.camera.r += dr / 8;
    }

    drawBackground() {

        let cw = this.c.width;
        let ch = this.c.height;

        let zoom = 1.01 ** (this.camera.zoom / 4) / 1;

        if (this.background === undefined) {

            this.background = document.createElement("canvas");
            this.background.width = this.c.width * 3;
            this.background.height = this.c.height * 3;

            let offCtx = this.background.getContext("2d");

            for (let i = 0; i < 1000; i++) {

                let randVal = Math.trunc((Math.random() * 256)).toString(16).padStart(2, 0);
                let randCol = "#" + randVal + randVal + randVal;

                offCtx.fillStyle = randCol;
                offCtx.fillRect(Math.random() * cw * 3, Math.random() * ch * 3, 1.5, 1.5);
            }
        }

        this.ctx.clearRect(0, 0, cw, ch);

        this.ctx.translate(cw / 2, ch / 2);
        this.ctx.rotate(this.camera.r);
        this.ctx.scale(1 / zoom, 1 / zoom);
        this.ctx.translate(-cw / 2, -ch / 2);

        this.ctx.translate(-this.camera.x / 10000000, -this.camera.y / 10000000);
        this.ctx.translate(-cw, -ch);

        if (this.enableBlurEffect) {
            this.ctx.filter = "blur(16px)";
            this.ctx.drawImage(this.background, 0, 0);
        }

        this.ctx.filter = "none";
        this.ctx.drawImage(this.background, 0, 0);

        this.ctx.translate(cw, ch);
        this.ctx.translate(this.camera.x / 10000000, this.camera.y / 10000000);

        this.ctx.translate(cw / 2, ch / 2);
        this.ctx.scale(zoom, zoom)
        this.ctx.rotate(-this.camera.r);
        this.ctx.translate(-cw / 2, -ch / 2);
    }

    drawBodies() {

        let offScreenCanvas = document.createElement("canvas");
        offScreenCanvas.width = this.c.width;
        offScreenCanvas.height = this.c.height;

        let offCtx = offScreenCanvas.getContext("2d");

        // for (let i = this.bodies.length - 1; i >= 0; i--) { this.bodies[i].drawTrail(offCtx, this.camera, this.logMap); }

        for (let i = this.bodies.length - 1; i >= 0; i--) {

            let isHavePlan = this.progradeV !== 0 || this.radialInV !== 0;
            let isPlanning = this.mode === "Planning";

            this.bodies[i].drawPlanTarget(offCtx, this.camera, isHavePlan, isPlanning, this.logMap);

            if (this.controlShip !== undefined && this.bodies[i].name === this.controlShip.name) {
                this.bodies[i].drawPlan(offCtx, this.camera, isHavePlan, this.target, this.isFollowSelf, isPlanning, this.logMap);

            } else if (this.drawTrajectories) {
                this.bodies[i].drawPlan(offCtx, this.camera, isHavePlan, undefined, false, false, this.logMap);
            }
        }

        for (let i = this.bodies.length - 1; i >= 0; i--) {

            let isHavePlan = this.progradeV !== 0 || this.radialInV !== 0;

            if (this.controlShip !== undefined && this.bodies[i].name === this.controlShip.name) {
                this.bodies[i].drawTrajectory(offCtx, this.camera, this.target, this.isFollowSelf, isHavePlan, this.logMap);

            } else if (this.drawTrajectories) {
                this.bodies[i].drawTrajectory(offCtx, this.camera, undefined, false, isHavePlan, this.logMap);
            }
        }

        for (let i = this.bodies.length - 1; i >= 0; i--) {

            let isShip = this.controlShip !== undefined && this.bodies[i].name === this.controlShip.name;
            let isFuelStation = this.fuelStationsMap[this.bodies[i].name] !== undefined;

            this.bodies[i].drawBody(offCtx, this.camera, isShip, isFuelStation, this.logMap);
        }

        for (let i = this.bodies.length - 1; i >= 0; i--) {

            let isShip = this.controlShip !== undefined && this.bodies[i].name === this.controlShip.name;
            let isFocus = this.bodies[i].name === this.focus.name;
            let isPlanning = this.mode === "Planning";
            let isTarget = this.bodies[i].name === this.target.name;
            let isHavePlan = this.progradeV !== 0 || this.radialInV !== 0;

            this.bodies[i].drawMarker(offCtx, this.camera, isShip, isFocus, isPlanning, isTarget, isHavePlan, this.logMap);
        }

        for (let i = this.bodies.length - 1; i >= 0; i--) {
            let isShip = this.controlShip !== undefined && this.bodies[i].name === this.controlShip.name;
            this.bodies[i].drawName(offCtx, this.camera, isShip, this.isFollowSelf, this.fuelStationsMap, this.logMap);
        }

        if (this.enableBlurEffect) {
            this.ctx.filter = "blur(16px)";
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
        this.addSideTextLeft(offCtx);
        this.addSideTextRight(offCtx);
        this.addModeBorder(offCtx);

        if (this.enableBlurEffect) {
            this.ctx.filter = "blur(16px)";
            this.ctx.drawImage(offScreenCanvas, 0, 0);
        }

        this.ctx.filter = "none";
        this.ctx.drawImage(offScreenCanvas, 0, 0);

        this.addScanLines(this.ctx);
    }

    addScanLines(ctx) {

        if (this.overlay === undefined) {

            this.overlay = document.createElement("canvas");
            this.overlay.width = this.c.width;
            this.overlay.height = this.c.height;

            let overlayCtx = this.overlay.getContext("2d");

            let cw = overlayCtx.canvas.width;
            let ch = overlayCtx.canvas.height;

            let lineWidth = 8;

            let y = 0;
            while (y < ch) {

                overlayCtx.beginPath();
                overlayCtx.moveTo(0, y + 0);
                overlayCtx.lineTo(cw, y + 0);

                overlayCtx.lineWidth = lineWidth;
                overlayCtx.strokeStyle = "#808080";
                overlayCtx.stroke();

                y += lineWidth * 2;
            }

        } else if (this.enableBlurEffect) {
            this.ctx.filter = "opacity(2%) blur(2px)";
            this.ctx.drawImage(this.overlay, 0, (this.frameCount % 64) / 4);
        }
    }

    addCrossHair(offCtx) {

        let cx = this.c.width / 2;
        let cy = this.c.height / 2;

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
        if (this.engine === "RCS") { offCtx.strokeStyle = "#001EFF"; }
        offCtx.stroke();

        if (this.frameCount % 100 < 80) {

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
    }

    addSideTextLeft(offCtx) {

        offCtx.textAlign = "left";
        offCtx.textBaseline = "top";
        offCtx.fillStyle = "#00FFA3";
        offCtx.font = "19px Syne Mono";

        offCtx.fillText("Starship Command", 8, 8);

        let topText = [];
        topText.push(this.version);
        topText.push("");
        topText.push("");
        topText.push("Simulator Controls");
        topText.push("---------------------------------------");
        topText.push("     [Space] : Pause Simulator");
        topText.push("      [,][.] : Simulation Speed");
        topText.push("");
        topText.push("View Controls");
        topText.push("---------------------------------------");
        topText.push("      [I][K] : Zoom");
        topText.push("      [J][L] : Select Target");
        topText.push("         [N] : Toggle Focus on Target");
        topText.push("      [Y][H] : Set Reference Frame");
        // topText.push("         [Y] : Set Primary As Ref. Frame");
        // topText.push("         [H] : Set Target As Ref. Frame");
        topText.push("");
        topText.push("Main Thruster Mode");
        topText.push("---------------------------------------");
        topText.push("      [E][Q] : Manual Directions");
        topText.push("[W][S][A][D] : Set Directions");
        topText.push("         [G] : Hold Direction");
        topText.push("         [F] : Planned Thrust Direction");
        topText.push("      [Z][X] : Main & Reverse Thruster");
        topText.push("     [Shift] : Hold For Finer Thrust");
        topText.push("");
        topText.push("Plan Mode");
        topText.push("---------------------------------------");
        topText.push("         [C] : Toggle Plan Mode");
        topText.push("         [V] : Discard Plan");
        topText.push("[W][S][A][D] : Plan Directions");
        topText.push("     [Shift] : Hold For Finer Plan");
        topText.push("");
        topText.push("RCS Mode");
        topText.push("---------------------------------------");
        topText.push("         [R] : Toggle RCS Mode");
        topText.push("[W][S][A][D] : RCS Directions");
        topText.push("     [Shift] : Hold For Finer RCS");

        let bottomText = [];
        // bottomText.push("FPS              : " + this.frameRate);
        // bottomText.push("");
        // bottomText.push("Zoom             : " + this.zoom);
        bottomText.push("Simulation Speed : " + this.speed);
        bottomText.push("");
        bottomText.push("[Backspace]      : Toggle Screen Effect");
        bottomText.push("[\\]              : Toggle Display All Trajectories");

        offCtx.fillStyle = "#888888";
        offCtx.font = "13px Syne Mono";

        let y = 24;
        for (let text of topText) {

            offCtx.textBaseline = "top";
            offCtx.fillText(text, 8, 8 + y);
            y += 16;
        }

        y = this.c.height;
        for (let text of bottomText) {

            offCtx.textBaseline = "bottom";
            offCtx.fillText(text, 8, y - 8);
            y -= 16;
        }

        offCtx.textAlign = "center";
        offCtx.textBaseline = "bottom";
        offCtx.font = "13px Syne Mono";
        offCtx.fillText("© 2021 Tanachai Bunlutangtum, All Rights Reserved", this.c.width / 2, this.c.height - 4);
    }

    addSideTextRight(offCtx) {

        let ship = this.controlShip;
        let isHavePlan = this.progradeV !== 0 || this.radialInV !== 0;

        let primary = "N/A";
        if (this.focus.parent !== null) { primary = this.focus.parent.name; }

        let periapsis = "N/A";
        let apoapsis = "N/A";
        let semimajor = "N/A";
        let argPeri = "N/A";
        let period = "N/A";

        if (ship !== undefined) {
            periapsis = ship.periapsis;
            apoapsis = ship.apoapsis;
            semimajor = (periapsis + apoapsis) / 2;
            argPeri = ship.argPeri;
            period = 2 * Math.PI * (semimajor ** 3 / this.focus.mass) ** (1 / 2);
        }

        let trueAnom = "N/A";

        if (ship !== undefined) {
            let dx = ship.x - this.focus.x;
            let dy = ship.y - this.focus.y;
            trueAnom = Math.atan2(dy, dx);
        }

        let circularOrbitV = "N/A";
        let escapeV = "N/A";

        if (ship !== undefined) {
            let dx = ship.x - this.focus.x;
            let dy = ship.y - this.focus.y;
            let dist = Math.hypot(dx, dy);

            circularOrbitV = (this.focus.mass / dist) ** 0.5
            escapeV = circularOrbitV * 2 ** 0.5;
        }

        // distance to ref frame
        let frameDist = 0;
        if (ship !== undefined) {
            let dx = ship.x - this.focus.x;
            let dy = ship.y - this.focus.y;
            frameDist = Math.hypot(dx, dy);
        }

        // relative velocity
        let frameDeltaV = 0;
        if (ship !== undefined) {
            let dvx = ship.vx - this.focus.vx;
            let dvy = ship.vy - this.focus.vy;
            frameDeltaV = Math.hypot(dvx, dvy);
        }

        // distance to target
        let targDist = 0;
        if (ship !== undefined) {
            let tdx = this.target.x - ship.x;
            let tdy = this.target.y - ship.y;
            targDist = Math.hypot(tdx, tdy);
        }

        // relative velocity
        let relativeV = 0;
        if (ship !== undefined) {
            let dvx = ship.vx - this.target.vx;
            let dvy = ship.vy - this.target.vy;
            relativeV = Math.hypot(dvx, dvy);
        }

        // closest approach
        let closestDist = "N/A";
        let approachV = "N/A";

        if (ship !== undefined && ship.trajClosest !== undefined) {

            if (ship.trajTargetClosest !== undefined) {
                let cdx = ship.trajTargetClosest.x - ship.trajClosest.x;
                let cdy = ship.trajTargetClosest.y - ship.trajClosest.y;
                closestDist = Math.round(Math.hypot(cdx, cdy));
            } else {
                closestDist = Math.round(Math.hypot(ship.trajClosest.x, ship.trajClosest.y));
            }
            approachV = ship.trajApproachV;
        }

        // fuel usage (planned)
        let plannedDeltaV = "N/A";
        if (this.plannedFuel > 0) {
            plannedDeltaV = this.plannedFuel;
        }

        // closest approach (planned)
        let planDistText = "N/A";
        let planApproachV = "N/A";

        if (ship !== undefined && ship.planClosest !== undefined && isHavePlan) {

            if (ship.planTargetClosest !== undefined) {
                let pdx = ship.planTargetClosest.x - ship.planClosest.x;
                let pdy = ship.planTargetClosest.y - ship.planClosest.y;
                planDistText = Math.hypot(pdx, pdy);
            } else {
                planDistText = Math.hypot(ship.planClosest.x, ship.planClosest.y);
            }
            planApproachV = ship.planApproachV;
        }

        let topText = [];
        // texts.push("Missions");
        // texts.push("Rendezvous with FuelStation2 using 200 fuel max");
        // texts.push("Refuel at FuelStation2 and go to the moon");
        // texts.push("Orbit the Moon and come back to FuelStation1");

        topText.push("");
        topText.push("       Reference Frame : " + this.capitalizeFirstChar(this.focus.name, 29));
        topText.push("---------------------   -----------------------------");
        topText.push("              Primary : " + this.capitalizeFirstChar(primary, 29));
        topText.push("");
        topText.push("            Periapsis : " + this.formatNumber(periapsis, 29));
        topText.push("             Apoapsis : " + this.formatNumber(apoapsis, 29));
        topText.push("       Semimajor Axis : " + this.formatNumber(semimajor, 29));
        topText.push("Argument of Periapsis : " + this.formatAngle(argPeri, 29));
        topText.push("         True Anomaly : " + this.formatAngle(trueAnom, 29));
        topText.push("               Period : " + this.formatNumber(period * 1000, 29));
        topText.push("");
        topText.push("              Distance : " + this.formatNumber(frameDist, 29));
        topText.push("     Relative Velocity : " + this.formatNumber(frameDeltaV, 29));
        topText.push("  Circularize Velocity : " + this.formatNumber(circularOrbitV, 29));
        topText.push("       Escape Velocity : " + this.formatNumber(escapeV, 29));
        topText.push("");
        topText.push("");
        topText.push("                Target : " + this.capitalizeFirstChar(this.target.name, 29));
        topText.push("---------------------   -----------------------------");
        // topText.push("                Radius : " + this.formatNumber(this.target.radius, 29));
        // topText.push("               Density : " + this.formatDecimal(this.target.density, 29));
        // topText.push("                  Mass : " + this.formatNumber(this.target.mass, 29));
        // topText.push("");
        topText.push("              Distance : " + this.formatNumber(targDist, 29));
        topText.push("     Relative Velocity : " + this.formatNumber(relativeV, 29));
        topText.push("");
        topText.push("");
        topText.push("      Closest Approach          Actual            Plan");
        topText.push("---------------------   -----------------------------");
        topText.push("              Distance : " + this.formatNumber(closestDist, 13) + this.formatNumber(planDistText, 16, true));
        topText.push("     Relative Velocity : " + this.formatNumber(approachV, 13) + this.formatNumber(planApproachV, 16, true));
        topText.push("  Circularize Velocity : " + this.capitalizeFirstChar("", 29));
        topText.push("");
        topText.push("");
        topText.push("                Plan : " + this.capitalizeFirstChar("", 29));
        topText.push("---------------------   -----------------------------");
        topText.push("           Prograde dV : " + this.formatNumber(this.progradeV, 29));
        topText.push("          Radial-In dV : " + this.formatNumber(-this.radialInV, 29));
        topText.push("              Total dV : " + this.formatNumber(-this.plannedFuel, 29));
        topText.push("");
        topText.push("          Available dV : " + this.formatNumber(this.fuel, 29));
        topText.push("                  Fuel : " + this.formatNumber(this.fuel, 29));

        offCtx.textAlign = "right";
        offCtx.fillStyle = "#888888";
        offCtx.font = "13px Syne Mono";
        offCtx.textBaseline = "top";

        let y = 0;
        for (let text of topText) {
            offCtx.fillText(text, this.c.width - 8, 8 + y);
            y += 16;
        }
    }

    formatNumber(number, padding, isAddBracket) {

        if (isNaN(number)) { return "N/A".padStart(padding); }

        let input = "" + Math.round(number);
        let output = "";

        while (input.length > 0) {
            let section = input.slice(Math.max(input.length - 3, 0), input.length);
            input = input.slice(0, Math.max(input.length - 3, 0));
            output = section + " " + output;
        }

        output = output.trim();
        if (isAddBracket) { output = "(" + output + ")"; }

        return output.padStart(padding);
    }

    formatDecimal(decimal, padding) {

        if (isNaN(decimal)) { return "N/A".padStart(padding); }

        let text = decimal.toFixed(3) + "";
        let texts = text.split(".");
        if (texts[1] === undefined) { texts[1] = ""; }

        return (texts[0] + "." + texts[1].padEnd(3, "0")).padStart(padding);
    }

    formatAngle(angle, padding) {

        if (isNaN(angle)) { return "N/A".padStart(padding); }

        let text = (-angle / Math.PI).toFixed(3) + "";
        let texts = text.split(".");
        if (texts[1] === undefined) { texts[1] = ""; }

        return (texts[0] + "." + texts[1].padEnd(3, "0") + " pi").padStart(padding);
    }

    capitalizeFirstChar(input, padding) {
        return (input.charAt(0).toUpperCase() + input.slice(1)).padStart(padding);
    }

    addModeBorder(offCtx) {

        // reference frame text
        let refFrame = "";
        if (this.isFollowSelf) {
            refFrame = this.capitalizeFirstChar(this.focus.name);
        } else {
            refFrame = this.capitalizeFirstChar(this.focus.name) + " + Target";
        }

        // flashing out of fuel / low fuel warning text
        if (this.frameCount % 100 < 80) {
            if (this.fuel === 0) {
                offCtx.textAlign = "center";
                offCtx.textBaseline = "middle";
                offCtx.font = "64px Syne Mono";
                offCtx.fillStyle = "#FF3300";;
                offCtx.fillText("OUT OF FUEL!", this.c.width / 2, this.c.height / 2);

            } else if (this.fuel < 1000) {
                offCtx.textAlign = "center";
                offCtx.textBaseline = "bottom";
                offCtx.font = "48px Syne Mono";
                offCtx.fillStyle = "#FF3300";;
                offCtx.fillText("LOW FUEL!", this.c.width / 2, this.c.height - 96);
            }
        }

        // orbit / target / heading info
        offCtx.textAlign = "center";
        offCtx.textBaseline = "top";
        offCtx.font = "32px Syne Mono";
        offCtx.fillStyle = "#00FFA3";
        offCtx.fillText("Reference Frame: " + refFrame, this.c.width / 2, 16);

        offCtx.font = "24px Syne Mono";
        offCtx.textBaseline = "bottom";
        offCtx.fillText("Heading: " + this.capitalizeFirstChar(this.heading), this.c.width / 2, this.c.height - 32);

        offCtx.textBaseline = "top";;
        offCtx.fillStyle = "#FFE100";;
        offCtx.fillText("Target: " + this.capitalizeFirstChar(this.target.name), this.c.width / 2, 64);

        // flashing mode text
        if (this.isPause) {

            offCtx.strokeStyle = "#FFE100";
            offCtx.lineWidth = 5;
            offCtx.strokeRect(0, 0, this.c.width, this.c.height);

            if (this.frameCount % 100 < 80) {
                offCtx.textAlign = "center";
                offCtx.textBaseline = "bottom";
                offCtx.font = "48px Syne Mono";
                offCtx.fillStyle = "#FFE100";;
                offCtx.fillText("Paused", this.c.width / 2, this.c.height - 96);
            }

        } else if (this.mode === "Planning") {

            offCtx.strokeStyle = "#FF307C";
            offCtx.lineWidth = 5;
            offCtx.strokeRect(0, 0, this.c.width, this.c.height);

            if (this.frameCount % 100 < 80) {
                offCtx.textAlign = "center";
                offCtx.textBaseline = "bottom";
                offCtx.font = "48px Syne Mono";
                offCtx.fillStyle = "#FF307C";;
                offCtx.fillText("Plan", this.c.width / 2, this.c.height - 96);
            }

        } else if (this.engine === "RCS") {

            offCtx.strokeStyle = "#001EFF";
            offCtx.lineWidth = 5;
            offCtx.strokeRect(0, 0, this.c.width, this.c.height);

            if (this.frameCount % 100 < 80) {
                offCtx.textAlign = "center";
                offCtx.textBaseline = "bottom";
                offCtx.font = "48px Syne Mono";
                offCtx.fillStyle = "#001EFF";;
                offCtx.fillText("RCS", this.c.width / 2, this.c.height - 96);
            }
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

    keydown(event) {
        // console.log(event)
        let mod = event.ctrlKey * 4 + event.shiftKey * 2 + event.altKey * 1;
        switch (mod + "_" + event.code) {

            case "0_Space": event.preventDefault(); this.togglePause(); break;

            case "0_Comma": event.preventDefault(); this.cyclePrecision(-1); break;
            case "0_Period": event.preventDefault(); this.cyclePrecision(1); break;

            // case "0_KeyU": event.preventDefault(); this.cycleSolSys(-1); break;
            // case "0_KeyO": event.preventDefault(); this.cycleSolSys(1); break;

            case "0_KeyJ": event.preventDefault(); this.cycleTarget(-1); break;
            case "0_KeyL": event.preventDefault(); this.cycleTarget(1); break;

            case "0_KeyY": event.preventDefault(); this.refFrameUp(); break;
            case "0_KeyH": event.preventDefault(); this.refFrameDown(); break;

            case "0_KeyN": event.preventDefault(); this.toggleFollowSelf(); break;

            case "0_KeyI": event.preventDefault(); this.pressedKeys.I = 1; break;
            case "0_KeyK": event.preventDefault(); this.pressedKeys.K = 1; break;

            case "2_KeyI": event.preventDefault(); this.pressedKeys.I = 1; break;
            case "2_KeyK": event.preventDefault(); this.pressedKeys.K = 1; break;

            case "0_KeyQ": event.preventDefault(); this.pressedKeys.Q = 1; break;
            case "0_KeyE": event.preventDefault(); this.pressedKeys.E = 1; break;

            case "2_KeyQ": event.preventDefault(); this.pressedKeys.Q = 1; break;
            case "2_KeyE": event.preventDefault(); this.pressedKeys.E = 1; break;

            case "0_KeyZ": event.preventDefault(); this.pressedKeys.Z = 1; break;
            case "0_KeyX": event.preventDefault(); this.pressedKeys.X = 1; break;

            case "2_KeyZ": event.preventDefault(); this.pressedKeys.Z = 1; break;
            case "2_KeyX": event.preventDefault(); this.pressedKeys.X = 1; break;

            case "2_ShiftLeft": event.preventDefault(); this.pressedKeys.Shift = 1; break;

            case "0_KeyR": event.preventDefault(); this.toggleEngine(); break;
            case "0_KeyC": event.preventDefault(); this.toggleMode(); break;
            case "0_KeyV": event.preventDefault(); this.clearPlan(); break;

            case "0_KeyW": event.preventDefault(); this.autoHeading("W"); this.pressedKeys.W = 1; break;
            case "0_KeyS": event.preventDefault(); this.autoHeading("S"); this.pressedKeys.S = 1; break;
            case "0_KeyA": event.preventDefault(); this.autoHeading("A"); this.pressedKeys.A = 1; break;
            case "0_KeyD": event.preventDefault(); this.autoHeading("D"); this.pressedKeys.D = 1; break;

            case "2_KeyW": event.preventDefault(); this.autoHeading("W"); this.pressedKeys.W = 1; break;
            case "2_KeyS": event.preventDefault(); this.autoHeading("S"); this.pressedKeys.S = 1; break;
            case "2_KeyA": event.preventDefault(); this.autoHeading("A"); this.pressedKeys.A = 1; break;
            case "2_KeyD": event.preventDefault(); this.autoHeading("D"); this.pressedKeys.D = 1; break;

            case "0_KeyF": event.preventDefault(); this.autoHeading("F"); break;
            case "0_KeyG": event.preventDefault(); this.holdHeading(); break;

            case "0_Backslash": event.preventDefault(); this.drawTrajectories = !this.drawTrajectories; break;
            case "0_Backspace": event.preventDefault(); this.enableBlurEffect = !this.enableBlurEffect; break;
        }

        // for (let key in this.pressedKeys) { this.logMap[key] = this.pressedKeys[key]; }
    }

    keyup(event) {

        let mod = event.ctrlKey * 4 + event.shiftKey * 2 + event.altKey * 1;
        switch (mod + "_" + event.code) {

            case "0_KeyI": event.preventDefault(); this.pressedKeys.I = 0; break;
            case "0_KeyK": event.preventDefault(); this.pressedKeys.K = 0; break;

            case "2_KeyI": event.preventDefault(); this.pressedKeys.I = 0; break;
            case "2_KeyK": event.preventDefault(); this.pressedKeys.K = 0; break;

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

        // for (let key in this.pressedKeys) { this.logMap[key] = this.pressedKeys[key]; }
    }

    togglePause() {
        this.isPause = !this.isPause;
    }

    cyclePrecision(direction) {

        this.speed += direction;

        this.speed = Math.min(this.speed, 12);
        this.speed = Math.max(this.speed, -12);
    }

    // cycleSolSys(direction) {

    //     this.camSolSysIndex += direction;
    //     this.camSolSysIndex = (this.camSolSysIndex + this.camSolSys.length) % this.camSolSys.length;
    //     this.focus = this.camSolSys[this.camSolSysIndex];
    //     this.target = this.camSolSys[this.camSolSysIndex];

    //     // this.controlShip.switchParent(this.focus);
    //     this.heading = "Manual";
    //     // this.isFollowSelf = false;
    //     this.changeFocus(this.focus);

    //     this.camMoonIndex = 0;
    //     this.camTargetIndex = 0;
    // }

    refFrameUp() {
        if (this.focus.parent === null) { return; }

        this.target = this.focus;
        this.focus = this.focus.parent;
        this.changeFocus(this.focus);

        this.heading = "Manual";
    }

    refFrameDown() {
        this.focus = this.target;
        this.changeFocus(this.focus);

        this.heading = "Manual";
    }

    changeFocus(newFocus) {

        if (this.controlShip === undefined) { return; }

        let ship = this.controlShip;
        let vx = ship.vx - ship.parent.vx;
        let vy = ship.vy - ship.parent.vy;
        let dist = Math.hypot(vx, vy);

        // update plan Vs
        let nvx = ship.vx + this.progradeV * vx / dist - this.radialInV * vy / dist;
        let nvy = ship.vy + this.progradeV * vy / dist + this.radialInV * vx / dist;

        let fvx = ship.vx - newFocus.vx;
        let fvy = ship.vy - newFocus.vy;
        let fdist = Math.hypot(fvx, fvy);

        let dvx = nvx - newFocus.vx - fvx;
        let dvy = nvy - newFocus.vy - fvy;

        let npv = dvx * fvx / fdist - dvy * -fvy / fdist;
        let nrv = dvy * fvx / fdist + dvx * -fvy / fdist;

        this.progradeV = npv;
        this.radialInV = nrv;

        ship.parent = newFocus;
    }

    cycleTarget(direction) {

        // if (this.camSolSysIndex === 0) {

        //     this.camTargetIndex += direction;
        //     this.camTargetIndex = (this.camTargetIndex + this.camSolSys.length) % this.camSolSys.length;
        //     this.target = this.camSolSys[this.camTargetIndex];

        // } else {
        //     let moons = this.camMoons[this.camSolSys[this.camSolSysIndex].name];
        //     if (moons === null) { return; }

        //     this.camTargetIndex += direction;
        //     this.camTargetIndex = (this.camTargetIndex + moons.length) % moons.length;
        //     this.target = moons[this.camTargetIndex];
        // }

        while (true) {
            let childLength = this.focus.child.length;
            let childIndex = this.focus.childMap[this.target.name];

            if (childLength === 0) { return; }

            if (childIndex === undefined) {

                if (direction > 0) {
                    this.target = this.focus.child[0];

                } else {
                    this.target = this.focus.child[this.focus.child.length - 1];
                }

            } else {
                childIndex += direction

                if (childIndex < 0 || childIndex >= childLength) {
                    this.target = this.focus;

                } else {
                    this.target = this.focus.child[childIndex];
                }
            }

            this.heading = "Manual";
            if (this.target.name !== this.controlShip.name) { break; }
        }
    }

    toggleFollowSelf() {

        this.isFollowSelf = !this.isFollowSelf;

        // if (this.isFollowSelf) {
        //     this.camPosition = this.controlShip;
        // } else {
        //     this.camPosition = this.target;
        // }
    }
}