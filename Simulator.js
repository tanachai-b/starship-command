"use strict";

class Simulator {

    constructor(canvas, log) {

        this.version = "V0.0.1 (2021-05-27)";

        this.canvas = canvas;
        this.log = log;

        this.ctx = this.canvas.getContext("2d");

        this.starryBackground;
        this.scanlineOverlay;

        this.isPause = false;
        this.simSpeed = -12;
        this.zoom = 10;
        this.pressedKeys = {};

        this.isEnableBlurEffect = true;
        this.isDrawTrajToPrimary = false;

        this.lastFrameTime;
        this.frameRate;
        this.frameCount = 0;

        this.logMap = {};

        this.camera = new Camera();
        this.camFocus;
        this.camAngle = 0;
        this.isFollowShip = true;

        this.bodies = [];
        this.badPrecBodies = {};

        this.currentShip;
        this.fuelStationsMap = {};

        this.focus;
        // this.origin;
        this.target;

        this.heading = "Manual";
        this.mode = "Pilot";
        this.engine = "Thruster";

        this.progradeV = 0;
        this.radialOutV = 0;
        this.plannedFuel = 0;

        this.maxFuel = 999999;
        this.fuel = 999999;

        // this.maxCargo = 10000;
        // this.cargo = 10000;
        // this.cash = 0;

        this.initiate();
        this.buildMap();
        this.simLoop();
    }

    initiate() {
        document.body.addEventListener("keydown", this.keydown.bind(this), false);
        document.body.addEventListener("keyup", this.keyup.bind(this), false);
    }

    buildMap() {

        let sun = new Body("sun", "#FFF200", 696340, 1.409, null, 0, 0);
        this.bodies.push(sun);

        // ========================

        let mercury = new Body("mercury", "#B0B0B0", 2439.64, 5.43, sun, 57909175, -90);
        this.bodies.push(mercury);

        let venus = new Body("venus", "#FFECA0", 6051.59, 5.24, sun, 108208930, 190);
        this.bodies.push(venus);

        let earth = new Body("earth", "#006AFF", 6378.10, 5.52, sun, 149597890, 10);
        this.bodies.push(earth);

        let mars = new Body("mars", "#C74E33", 3397.00, 3.94, sun, 227936640, 45);
        this.bodies.push(mars);

        let ceres = new Body("ceres", "#B0B0B0", 473, 2.16, sun, 413700000, 80);
        this.bodies.push(ceres);

        let jupiter = new Body("jupiter", "#A6662B", 71492.68, 1.33, sun, 778412010, 70);
        this.bodies.push(jupiter);

        let saturn = new Body("saturn", "#FFE4A6", 60267.14, 0.7, sun, 1426725400, 155);
        this.bodies.push(saturn);

        let uranus = new Body("uranus", "#80FFE8", 25557.25, 1.3, sun, 2870972200, 185);
        this.bodies.push(uranus);

        let neptune = new Body("neptune", "#2B7CFF", 24766.36, 1.76, sun, 4498252900, 30);
        this.bodies.push(neptune);

        let pluto = new Body("pluto", "#B0B0B0", 1187, 1.87, sun, 5906380000, -100);
        this.bodies.push(pluto);

        // ========================

        let moon = new Body("moon", "#B5B0A3", 1737.1, 3.3464, earth, 384399, 5);
        this.bodies.push(moon);

        let phobos = new Body("phobos", "#B5B0A3", 11.1, 1.876, mars, 9377, 45);
        this.bodies.push(phobos);

        let deimos = new Body("deimos", "#B5B0A3", 6.3, 1.471, mars, 23460, -135);
        this.bodies.push(deimos);

        let io = new Body("io", "#B5B0A3", 1815, 3.528, jupiter, 421600, 15);
        this.bodies.push(io);

        let europa = new Body("europa", "#B5B0A3", 1569, 3.01, jupiter, 670900, 105);
        this.bodies.push(europa);

        let ganymede = new Body("ganymede", "#B5B0A3", 2634.1, 1.936, jupiter, 1070400, 80);
        this.bodies.push(ganymede);

        let callisto = new Body("callisto", "#B5B0A3", 2410.3, 1.83, jupiter, 1882700, -160);
        this.bodies.push(callisto);

        let titan = new Body("titan", "#B5B0A3", 2576, 1.88, saturn, 1221870, -80);
        this.bodies.push(titan);

        let triton = new Body("triton", "#B0B0B0", 1353.4, 2.061, neptune, 354759, -170);
        this.bodies.push(triton);

        let charon = new Body("charon", "#B0B0B0", 603.5, 1.65, pluto, 17536, -100);
        this.bodies.push(charon);

        // ========================

        let fuelStation1 = new Body("fuelStation1", "#349FC9", 0.02, 0.5, earth, 10000, -115);
        this.bodies.push(fuelStation1);
        this.fuelStationsMap.fuelStation1 = { body: fuelStation1, fuel: 20000 };

        let fuelStation2 = new Body("fuelStation2", "#349FC9", 0.02, 0.5, earth, 30000, -0);
        this.bodies.push(fuelStation2);
        this.fuelStationsMap.fuelStation2 = { body: fuelStation2, fuel: 20000 };

        let fuelStation3 = new Body("fuelStation3", "#349FC9", 0.02, 0.5, earth, 100000, 110);
        this.bodies.push(fuelStation3);
        this.fuelStationsMap.fuelStation3 = { body: fuelStation3, fuel: 20000 };

        // ========================

        let starship = new Body("starship", "#00FFA3", 0.005, 0.5, earth, 9000, -120);
        this.bodies.push(starship);

        // ========================

        for (let body of this.bodies) {
            if (body.child.length === 0) { continue; }

            body.child.sort(function (a, b) { return a.distance - b.distance; });

            for (let i = 0; i < body.child.length; i++) {
                let child = body.child[i];
                body.childMap[child.name] = i;
            }
        }

        // ========================

        // set initial focus/target
        this.currentShip = starship;

        this.focus = earth;
        this.target = fuelStation1;

        this.currentShip.parent = this.focus;
    }

    async simLoop() {

        const timer = ms => new Promise(res => setTimeout(res, ms));

        while (true) {

            if (!this.isPause) {
                this.moveBodies();
                this.controlShip();
                this.refuel();
            }

            this.calcTrajectory();
            this.calcShipPlan();

            this.moveCamera();

            this.drawBackground();
            this.drawBodies();
            this.drawHUD();
            this.drawScanlines();

            this.calcFrameCountFrameRate();
            if (!this.isPause) { this.logOutput(); }

            await timer(1);
        }
    }

    moveBodies() {

        let precision = 10 ** (this.simSpeed / 3);

        this.badPrecBodies = {};

        for (let body of this.bodies) {
            body.calcGravity(this.bodies, precision, this.badPrecBodies, this.logMap);
        }

        if (Object.keys(this.badPrecBodies).length > 0) {
            for (let body of this.bodies) {
                body.calcGravity(this.bodies, precision, this.badPrecBodies, this.logMap);
            }
        }

        for (let body of this.bodies) {
            body.move(precision, this.badPrecBodies);
        }
    }

    controlShip() {
        this.rotateShip();
        if (this.engine === "RCS") { this.controlRcs(); }
        if (this.engine === "Thruster") { this.controlThruster(); }
    }

    rotateShip() {

        if (this.currentShip === undefined) { return; }
        if (this.fuel === 0) { return; }

        let power = 1;
        if (this.pressedKeys.Shift) { power /= 10; }

        if (this.pressedKeys.Q || this.pressedKeys.E) {

            this.heading = "Manual";

            if (this.pressedKeys.Q) { this.currentShip.vr -= power; this.fuel -= power / 100; }
            if (this.pressedKeys.E) { this.currentShip.vr += power; this.fuel -= power / 100; }

            this.fuel = Math.max(this.fuel, 0);

        } else if (this.heading === "Hold") {

            if (this.currentShip.vr < 0) {
                this.currentShip.vr += power;
                this.fuel -= power / 100;

            } else if (this.currentShip.vr > 0) {
                this.currentShip.vr -= power;
                this.fuel -= power / 100;
            }

            this.fuel = Math.max(this.fuel, 0);

        } else {

            let heading = 0;

            if (this.heading === "Prograde") { heading = 0; }
            else if (this.heading === "Retrograde") { heading = Math.PI; }
            else if (this.heading === "Radial-out") { heading = Math.PI / 2; }
            else if (this.heading === "Radial-in") { heading = -Math.PI / 2; }
            else if (this.heading === "Planned") { heading = Math.atan2(this.radialOutV, this.progradeV); }
            else { return; }

            let refFrame = this.camFocus;
            if (refFrame.name === this.currentShip.name) { refFrame = this.focus; }

            let ship = this.currentShip;

            let dvx = ship.vx - refFrame.vx;
            let dvy = ship.vy - refFrame.vy;
            let prograde = Math.atan2(dvy, dvx);

            let curDir = ship.r;

            let dist = ((((prograde + heading - curDir + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;

            let precision = 10 ** (this.simSpeed / 3);

            if (dist < 0) {

                if (Math.sign(ship.vr) * ship.vr / power * ship.vr * precision / 2 > dist) {
                    ship.vr -= power;
                    this.fuel -= power / 100;
                } else {
                    ship.vr += power;
                    this.fuel -= power / 100;
                }
            } else {
                if (Math.sign(ship.vr) * ship.vr / power * ship.vr * precision / 2 < dist) {
                    ship.vr += power;
                    this.fuel -= power / 100;
                } else {
                    ship.vr -= power;
                    this.fuel -= power / 100;
                }
            }

            this.fuel = Math.max(this.fuel, 0);
        }
    }

    controlRcs() {
        if (this.currentShip === undefined) { return; }
        if (this.fuel === 0) { return; }

        let power = 0.1;
        if (this.pressedKeys.Shift) { power /= 10; }

        if (this.pressedKeys.W) { this.controlEachRcs(Math.atan2(0, 1), power); this.fuel -= power; }
        if (this.pressedKeys.S) { this.controlEachRcs(Math.atan2(0, -1), power); this.fuel -= power; }
        if (this.pressedKeys.A) { this.controlEachRcs(Math.atan2(-1, 0), power); this.fuel -= power; }
        if (this.pressedKeys.D) { this.controlEachRcs(Math.atan2(1, 0), power); this.fuel -= power; }

        this.fuel = Math.max(this.fuel, 0);
    }

    controlEachRcs(direction, power) {
        this.currentShip.vx += power * Math.cos(this.currentShip.r + direction);
        this.currentShip.vy += power * Math.sin(this.currentShip.r + direction);
    }

    controlThruster() {

        let power = 10;
        if (this.pressedKeys.Shift) { power /= 10; }

        if (this.mode === "Planning") {
            if (this.pressedKeys.W) { this.progradeV += power; }
            if (this.pressedKeys.S) { this.progradeV -= power; }
            if (this.pressedKeys.A) { this.radialOutV -= power; }
            if (this.pressedKeys.D) { this.radialOutV += power; }

            this.plannedFuel = Math.hypot(this.progradeV, this.radialOutV);

        } else {

            if (this.pressedKeys.Z || this.pressedKeys.X) {

                if (this.currentShip === undefined) { return; }
                if (this.fuel === 0) { return; }

                let vx1 = 0;
                let vy1 = 0;

                if (this.pressedKeys.Z) {
                    vx1 = power * Math.cos(this.currentShip.r);
                    vy1 = power * Math.sin(this.currentShip.r);
                    this.fuel -= power;
                }
                if (this.pressedKeys.X) {
                    vx1 = -power / 10 * Math.cos(this.currentShip.r);
                    vy1 = -power / 10 * Math.sin(this.currentShip.r);
                    this.fuel -= power / 10;
                }

                this.fuel = Math.max(this.fuel, 0);

                // minus current thrust from planned route / planned fuel
                if (this.progradeV !== 0 || this.radialOutV !== 0) {

                    let ship = this.currentShip;

                    let refFrame = this.camFocus;
                    if (refFrame.name === this.currentShip.name) { refFrame = this.focus; }

                    let dvx = ship.vx - refFrame.vx;
                    let dvy = ship.vy - refFrame.vy;
                    let dist = Math.hypot(dvx, dvy);

                    let pvx = dvx + this.progradeV * dvx / dist - this.radialOutV * dvy / dist;
                    let pvy = dvy + this.radialOutV * dvx / dist + this.progradeV * dvy / dist;

                    let nvx = dvx + vx1;
                    let nvy = dvy + vy1;
                    let ndist = Math.hypot(nvx, nvy);

                    let dpvx = pvx - nvx;
                    let dpvy = pvy - nvy;

                    this.progradeV = dpvx * nvx / ndist - dpvy * -nvy / ndist;
                    this.radialOutV = dpvy * nvx / ndist + dpvx * -nvy / ndist;

                    this.plannedFuel = Math.hypot(this.progradeV, this.radialOutV);
                }

                this.currentShip.vx += vx1;
                this.currentShip.vy += vy1;
            }
        }
    }

    refuel() {

        if (this.currentShip === undefined) { return; }

        let precision = 10 ** (this.simSpeed / 3);

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

            let ship = this.currentShip;

            let dx = stationBody.x - ship.x;
            if (Math.abs(dx) > refuelDistance) { continue; }

            let dy = stationBody.y - ship.y;
            if (Math.abs(dy) > refuelDistance) { continue; }

            let dist = Math.hypot(dx, dy);
            if (dist > refuelDistance) { continue; }

            if (station.fuel > 0 && this.fuel < this.maxFuel) {

                this.fuel += exchangeRate * precision;
                station.fuel -= exchangeRate * precision;

                this.fuel = Math.min(this.fuel, this.maxFuel);
                station.fuel = Math.max(station.fuel, 0);
            }
        }
    }

    calcTrajectory() {

        for (let body of this.bodies) {

            if (this.currentShip !== undefined && body.name === this.currentShip.name) {
                body.calcShipTraj(this.target, this.logMap);

            } else if (this.isDrawTrajToPrimary) {
                body.calcBodyTraj(this.logMap);
            }
        }
    }

    calcShipPlan() {
        if (this.currentShip === undefined) { return; }
        this.currentShip.calcShipPlan(this.progradeV, this.radialOutV, this.target, this.isFollowShip, this.logMap);
    }

    moveCamera() {

        let precision = 10 ** (this.simSpeed / 3);

        // initalize camera focus;
        if (this.currentShip !== undefined && this.isFollowShip) {
            this.camFocus = this.currentShip;
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
            this.camAngle = -this.currentShip.r - Math.PI / 2;
        } else {
            this.camAngle = 0;
        }

        let dr = (((this.camAngle - this.camera.r + Math.PI) % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI) - Math.PI;
        this.camera.r += dr / 8;
    }

    drawBackground() {

        let cw = this.canvas.width;
        let ch = this.canvas.height;

        let zoom = 1.01 ** (this.camera.zoom / 4) / 1;

        if (this.starryBackground === undefined) {

            this.starryBackground = document.createElement("canvas");
            this.starryBackground.width = this.canvas.width * 3;
            this.starryBackground.height = this.canvas.height * 3;

            let offCtx = this.starryBackground.getContext("2d");

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

        if (this.isEnableBlurEffect) {
            this.ctx.filter = "blur(16px)";
            this.ctx.drawImage(this.starryBackground, 0, 0);
        }

        this.ctx.filter = "none";
        this.ctx.drawImage(this.starryBackground, 0, 0);

        this.ctx.translate(cw, ch);
        this.ctx.translate(this.camera.x / 10000000, this.camera.y / 10000000);

        this.ctx.translate(cw / 2, ch / 2);
        this.ctx.scale(zoom, zoom)
        this.ctx.rotate(-this.camera.r);
        this.ctx.translate(-cw / 2, -ch / 2);
    }

    drawBodies() {

        let offScreenCanvas = document.createElement("canvas");
        offScreenCanvas.width = this.canvas.width;
        offScreenCanvas.height = this.canvas.height;
        let offCtx = offScreenCanvas.getContext("2d");

        let isHavePlan = this.progradeV !== 0 || this.radialOutV !== 0;
        let isPlanning = this.mode === "Planning";

        if (this.isDrawTrajToPrimary) {
            for (let i = this.bodies.length - 1; i >= 0; i--) {
                if (this.currentShip !== undefined && this.bodies[i].name === this.currentShip.name) { continue; }
                this.bodies[i].drawTraj(offCtx, this.camera, this.target, true, this.logMap);
            }
        }

        if (this.currentShip !== undefined) {
            this.currentShip.drawTraj(offCtx, this.camera, this.target, this.isFollowShip, this.logMap);
            this.currentShip.drawPlan(offCtx, this.camera, isHavePlan, this.target, this.isFollowShip, isPlanning, this.logMap);
            this.currentShip.drawPlanTarget(offCtx, this.camera, isPlanning, this.logMap);
        }

        for (let i = this.bodies.length - 1; i >= 0; i--) {
            let isShip = this.currentShip !== undefined && this.bodies[i].name === this.currentShip.name;
            let isFuelStation = this.fuelStationsMap[this.bodies[i].name] !== undefined;
            this.bodies[i].drawBody(offCtx, this.camera, isShip, isFuelStation, this.logMap);
        }

        for (let i = this.bodies.length - 1; i >= 0; i--) {
            let isShip = this.currentShip !== undefined && this.bodies[i].name === this.currentShip.name;
            let isFocus = this.bodies[i].name === this.focus.name;
            let isTarget = this.bodies[i].name === this.target.name;
            this.bodies[i].drawMarker(offCtx, this.camera, isShip, isFocus, isPlanning, isTarget, isHavePlan, this.logMap);
            this.bodies[i].drawName(offCtx, this.camera, isShip, this.isFollowShip, this.fuelStationsMap, this.logMap);
        }

        if (this.isEnableBlurEffect) {
            this.ctx.filter = "blur(16px)";
            this.ctx.drawImage(offScreenCanvas, 0, 0);
        }

        this.ctx.filter = "none";
        this.ctx.drawImage(offScreenCanvas, 0, 0);
    }

    drawHUD() {

        let offScreenCanvas = document.createElement("canvas");
        offScreenCanvas.width = this.canvas.width;
        offScreenCanvas.height = this.canvas.height;
        let offCtx = offScreenCanvas.getContext("2d");

        this.addHeadingIndic(offCtx);
        this.addCrossHair(offCtx);
        this.addSideTextLeft(offCtx);
        this.addSideTextRight(offCtx);
        this.addModeBorder(offCtx);

        if (this.isEnableBlurEffect) {
            this.ctx.filter = "blur(16px)";
            this.ctx.drawImage(offScreenCanvas, 0, 0);
        }

        this.ctx.filter = "none";
        this.ctx.drawImage(offScreenCanvas, 0, 0);
    }

    addHeadingIndic(offCtx) {

        if (this.heading === "Manual") { return; }

        // calc angle
        let ship = this.currentShip;

        let refFrame = this.camFocus;
        if (refFrame.name === ship.name) { refFrame = this.focus; }

        let dvx = ship.vx - refFrame.vx;
        let dvy = ship.vy - refFrame.vy;

        let zoom = 2 ** (this.camera.zoom / 4);

        // prep draw
        let color = "#00FFA3";
        if (this.mode === "Planning") { color = "#FF307C"; }
        if (this.engine === "RCS") { color = "#001EFF"; }

        let p0 = new Point(24, 48);
        let p1 = new Point(48, 48);
        let p2 = new Point(48, 24);
        let p3 = new Point(-24, 48);
        let p4 = new Point(-48, 48);
        let p5 = new Point(-48, 24);
        let p6 = new Point(-24, -48);
        let p7 = new Point(-48, -48);
        let p8 = new Point(-48, -24);
        let p9 = new Point(24, -48);
        let p10 = new Point(48, -48);
        let p11 = new Point(48, -24);

        let l0 = new Line([p0, p1, p2]);
        let l1 = new Line([p3, p4, p5]);
        let l2 = new Line([p6, p7, p8]);
        let l3 = new Line([p9, p10, p11]);

        let crossHair = new Shape([l0, l1, l2, l3]);

        let crossHair1 = crossHair.project(new Camera(0, 0, Math.atan2(dvy, dvx), 0), this.logMap);
        let cam1 = new Camera((-ship.x + this.camera.x) / zoom, (-ship.y + this.camera.y) / zoom, this.camera.r, 0);

        crossHair1.draw(cam1, offCtx, 1, color, this.logMap);
    }

    addCrossHair(offCtx) {

        // calc angle
        let ship = this.currentShip;

        let refFrame = this.camFocus;
        if (refFrame.name === ship.name) { refFrame = this.focus; }

        let dvx = ship.vx - refFrame.vx;
        let dvy = ship.vy - refFrame.vy;

        let zoom = 2 ** (this.camera.zoom / 4);

        // prep draw
        let color = "#00FFA3";
        if (this.mode === "Planning") { color = "#FF307C"; }
        if (this.engine === "RCS") { color = "#001EFF"; }

        let p0 = new Point(-64, 0);
        let p1 = new Point(-32, 0);
        let p2 = new Point(32, 0);
        let p3 = new Point(96, 0);
        let p4 = new Point(0, -64);
        let p5 = new Point(0, -32);
        let p6 = new Point(0, 32);
        let p7 = new Point(0, 64);

        let l0 = new Line([p0, p1]);
        let l1 = new Line([p2, p3]);
        let l2 = new Line([p4, p5]);
        let l3 = new Line([p6, p7]);

        let crossHair = new Shape([l0, l1, l2, l3]);

        let crossHair1 = crossHair.project(new Camera(0, 0, Math.atan2(dvy, dvx), 0), this.logMap);
        let cam1 = new Camera((-ship.x + this.camera.x) / zoom, (-ship.y + this.camera.y) / zoom, this.camera.r, 0);

        if (this.frameCount % 100 < 80) {
            if (this.heading === "Retrograde") { crossHair1.lineList[0].draw(cam1, offCtx, 2, color, this.logMap); }
            if (this.heading === "Prograde") { crossHair1.lineList[1].draw(cam1, offCtx, 2, color, this.logMap); }
            if (this.heading === "Radial-in") { crossHair1.lineList[2].draw(cam1, offCtx, 2, color, this.logMap); }
            if (this.heading === "Radial-out") { crossHair1.lineList[3].draw(cam1, offCtx, 2, color, this.logMap); }
            if (this.heading === "Hold") { crossHair1.draw(cam1, offCtx, 2, color, this.logMap); }
            if (this.heading === "Planned") { crossHair1.draw(cam1, offCtx, 2, color, this.logMap); }
        }

        if (this.heading !== "Hold" && this.heading !== "Planned" || this.heading === "Manual") {
            if (this.heading !== "Retrograde") { crossHair1.lineList[0].draw(cam1, offCtx, 2, color, this.logMap); }
            if (this.heading !== "Prograde") { crossHair1.lineList[1].draw(cam1, offCtx, 2, color, this.logMap); }
            if (this.heading !== "Radial-in") { crossHair1.lineList[2].draw(cam1, offCtx, 2, color, this.logMap); }
            if (this.heading !== "Radial-out") { crossHair1.lineList[3].draw(cam1, offCtx, 2, color, this.logMap); }
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
        bottomText.push("Zoom             : " + this.zoom);
        bottomText.push("Simulation Speed : " + this.simSpeed);
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

        y = this.canvas.height;
        for (let text of bottomText) {

            offCtx.textBaseline = "bottom";
            offCtx.fillText(text, 8, y - 8);
            y -= 16;
        }

        offCtx.textAlign = "center";
        offCtx.textBaseline = "bottom";
        offCtx.font = "13px Syne Mono";
        offCtx.fillText("© 2021 Tanachai Bunlutangtum, All Rights Reserved", this.canvas.width / 2, this.canvas.height - 4);
    }

    addSideTextRight(offCtx) {

        let ship = this.currentShip;
        let isHavePlan = this.progradeV !== 0 || this.radialOutV !== 0;

        let primary = "N/A";
        if (this.focus.parent !== null) { primary = this.focus.parent.name; }

        let periapsis = "N/A";
        let apoapsis = "N/A";
        let semimajor = "N/A";
        let argOfPeri = "N/A";
        let period = "N/A";

        if (ship !== undefined) {
            periapsis = ship.periapsis;
            apoapsis = ship.apoapsis;
            semimajor = (periapsis + apoapsis) / 2;
            argOfPeri = ship.argOfPeri;
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
        topText.push("     Orbital Elements : " + this.capitalizeFirstChar("", 29));
        topText.push("---------------------   -----------------------------");
        topText.push("              Primary : " + this.capitalizeFirstChar(this.focus.name, 29));
        topText.push("");
        topText.push("            Periapsis : " + this.formatNumber(periapsis, 29));
        topText.push("             Apoapsis : " + this.formatNumber(apoapsis, 29));
        topText.push("       Semimajor Axis : " + this.formatNumber(semimajor, 29));
        topText.push("Argument of Periapsis : " + this.formatAngle(argOfPeri, 29));
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
        topText.push("                Radius : " + this.formatNumber(this.target.radius, 29));
        topText.push("               Density : " + this.formatDecimal(this.target.density, 29));
        topText.push("                  Mass : " + this.formatNumber(this.target.mass, 29));
        topText.push("   Distance To Primary : " + this.formatNumber("N/A", 29));
        topText.push("");
        topText.push("              Distance : " + this.formatNumber(targDist, 29));
        topText.push("     Relative Velocity : " + this.formatNumber(relativeV, 29));
        topText.push("");
        topText.push("");
        topText.push("      Closest Approach          Actual            Plan");
        topText.push("---------------------   -----------------------------");
        topText.push("              Distance : " + this.formatNumber(closestDist, 13) + this.formatNumber(planDistText, 16));
        topText.push("     Relative Velocity : " + this.formatNumber(approachV, 13) + this.formatNumber(planApproachV, 16));
        topText.push("  Circularize Velocity : " + this.capitalizeFirstChar("", 29));
        topText.push("");
        topText.push("");
        topText.push("               Plan dV : " + this.formatNumber(this.plannedFuel, 29));
        topText.push("---------------------   -----------------------------");
        topText.push("           Prograde dV : " + this.formatNumber(this.progradeV, 29));
        topText.push("          Radial-Out dV : " + this.formatNumber(this.radialOutV, 29));
        topText.push("");
        topText.push("          Available dV : " + this.formatNumber(this.fuel, 29));
        topText.push("                  Fuel : " + this.formatNumber(this.fuel, 29));

        offCtx.textAlign = "right";
        offCtx.fillStyle = "#888888";
        offCtx.font = "13px Syne Mono";
        offCtx.textBaseline = "top";

        let y = 0;
        for (let text of topText) {
            offCtx.fillText(text, this.canvas.width - 8, 8 + y);
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
        if (this.isFollowShip) {
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
                offCtx.fillText("OUT OF FUEL!", this.canvas.width / 2, this.canvas.height / 2);

            } else if (this.fuel < 1000) {
                offCtx.textAlign = "center";
                offCtx.textBaseline = "bottom";
                offCtx.font = "48px Syne Mono";
                offCtx.fillStyle = "#FF3300";;
                offCtx.fillText("LOW FUEL!", this.canvas.width / 2, this.canvas.height - 96);
            }
        }

        // orbit / target / heading info
        offCtx.textAlign = "center";
        offCtx.textBaseline = "top";
        offCtx.font = "32px Syne Mono";
        offCtx.fillStyle = "#00FFA3";
        offCtx.fillText("Reference Frame: " + refFrame, this.canvas.width / 2, 16);

        offCtx.font = "24px Syne Mono";
        offCtx.textBaseline = "bottom";
        offCtx.fillText("Heading: " + this.capitalizeFirstChar(this.heading), this.canvas.width / 2, this.canvas.height - 32);

        offCtx.textBaseline = "top";;
        offCtx.fillStyle = "#FFE100";;
        offCtx.fillText("Target: " + this.capitalizeFirstChar(this.target.name), this.canvas.width / 2, 64);

        // flashing mode text
        if (this.isPause) {

            offCtx.strokeStyle = "#FFE100";
            offCtx.lineWidth = 5;
            offCtx.strokeRect(0, 0, this.canvas.width, this.canvas.height);

            if (this.frameCount % 100 < 80) {
                offCtx.textAlign = "center";
                offCtx.textBaseline = "bottom";
                offCtx.font = "48px Syne Mono";
                offCtx.fillStyle = "#FFE100";;
                offCtx.fillText("Paused", this.canvas.width / 2, this.canvas.height - 96);
            }

        } else if (this.mode === "Planning") {

            offCtx.strokeStyle = "#FF307C";
            offCtx.lineWidth = 5;
            offCtx.strokeRect(0, 0, this.canvas.width, this.canvas.height);

            if (this.frameCount % 100 < 80) {
                offCtx.textAlign = "center";
                offCtx.textBaseline = "bottom";
                offCtx.font = "48px Syne Mono";
                offCtx.fillStyle = "#FF307C";;
                offCtx.fillText("Plan", this.canvas.width / 2, this.canvas.height - 96);
            }

        } else if (this.engine === "RCS") {

            offCtx.strokeStyle = "#001EFF";
            offCtx.lineWidth = 5;
            offCtx.strokeRect(0, 0, this.canvas.width, this.canvas.height);

            if (this.frameCount % 100 < 80) {
                offCtx.textAlign = "center";
                offCtx.textBaseline = "bottom";
                offCtx.font = "48px Syne Mono";
                offCtx.fillStyle = "#001EFF";;
                offCtx.fillText("RCS", this.canvas.width / 2, this.canvas.height - 96);
            }
        }
    }

    drawScanlines() {

        if (this.scanlineOverlay === undefined) {

            this.scanlineOverlay = document.createElement("canvas");
            this.scanlineOverlay.width = this.canvas.width;
            this.scanlineOverlay.height = this.canvas.height;

            let overlayCtx = this.scanlineOverlay.getContext("2d");

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
        }

        if (this.isEnableBlurEffect) {
            this.ctx.filter = "opacity(2%) blur(2px)";
            this.ctx.drawImage(this.scanlineOverlay, 0, (this.frameCount % 64) / 4);
        }
    }

    calcFrameCountFrameRate() {
        if (this.lastFrameTime !== undefined) {
            this.frameRate = (1000 / (Date.now() - this.lastFrameTime)).toFixed(2);
        }
        this.lastFrameTime = Date.now();

        this.frameCount++;
        if (this.frameCount >= 1000) { this.frameCount = 0; }
    }

    logOutput() {

        let logStr = "log items: " + Object.keys(this.logMap).length + "<br>";

        for (let key in this.logMap) {
            logStr += key + ": " + this.logMap[key] + "<br>";
        }

        this.log.innerHTML = logStr;
    }

    keydown(event) {
        // console.log(event)
        let mod = event.ctrlKey * 4 + event.shiftKey * 2 + event.altKey * 1;
        switch (mod + "_" + event.code) {

            case "0_Space": event.preventDefault(); this.togglePause(); break;

            case "0_Comma": event.preventDefault(); this.cycleSimSpeed(-1); break;
            case "0_Period": event.preventDefault(); this.cycleSimSpeed(1); break;

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

            case "0_KeyW": event.preventDefault(); this.setHeading("W"); this.pressedKeys.W = 1; break;
            case "0_KeyS": event.preventDefault(); this.setHeading("S"); this.pressedKeys.S = 1; break;
            case "0_KeyA": event.preventDefault(); this.setHeading("A"); this.pressedKeys.A = 1; break;
            case "0_KeyD": event.preventDefault(); this.setHeading("D"); this.pressedKeys.D = 1; break;

            case "2_KeyW": event.preventDefault(); this.setHeading("W"); this.pressedKeys.W = 1; break;
            case "2_KeyS": event.preventDefault(); this.setHeading("S"); this.pressedKeys.S = 1; break;
            case "2_KeyA": event.preventDefault(); this.setHeading("A"); this.pressedKeys.A = 1; break;
            case "2_KeyD": event.preventDefault(); this.setHeading("D"); this.pressedKeys.D = 1; break;

            case "0_KeyF": event.preventDefault(); this.setHeading("F"); break;
            case "0_KeyG": event.preventDefault(); this.setHeading("G"); break;

            case "0_Backslash": event.preventDefault(); this.isDrawTrajToPrimary = !this.isDrawTrajToPrimary; break;
            case "0_Backspace": event.preventDefault(); this.isEnableBlurEffect = !this.isEnableBlurEffect; break;
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

    cycleSimSpeed(direction) {
        this.simSpeed += direction;
        this.simSpeed = Math.min(this.simSpeed, 12);
        this.simSpeed = Math.max(this.simSpeed, -12);
    }

    setHeading(key) {

        if (this.isPause) { return; }

        let headingGoal = "Manual";
        switch (key) {
            case "W": headingGoal = "Prograde"; break;
            case "S": headingGoal = "Retrograde"; break;
            case "A": headingGoal = "Radial-in"; break;
            case "D": headingGoal = "Radial-out"; break;
            case "F": headingGoal = "Planned"; break;
            case "G": headingGoal = "Hold"; break;
        }

        if (this.engine === "RCS" && headingGoal !== "Hold") { return; }
        if (this.mode === "Planning" && headingGoal !== "Hold") { return; }

        if (this.heading !== headingGoal) {
            this.heading = headingGoal;
        } else {
            this.heading = "Manual";
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
        this.radialOutV = 0;
        this.plannedFuel = 0;

        this.mode = "Pilot";
    }

    refFrameUp() {

        if (this.focus.parent === null) { return; }

        let newfocus = this.focus.parent;
        let newtarget = this.focus;

        if (this.isFollowShip) {
            this.recalcPlan(newfocus);
        } else {
            this.recalcPlan(newtarget);
        }

        this.focus = newfocus;
        this.target = newtarget;

        this.currentShip.parent = this.focus;
        this.heading = "Manual";
    }

    refFrameDown() {

        let newfocus = this.target;

        if (this.isFollowShip) {
            this.recalcPlan(newfocus);
        }

        this.focus = newfocus;

        this.currentShip.parent = this.focus;
        this.heading = "Manual";
    }

    cycleTarget(direction) {

        let newtarget = this.target;

        while (true) {
            let childLength = this.focus.child.length;
            let childIndex = this.focus.childMap[newtarget.name];

            if (childLength === 0) { return; }

            if (childIndex === undefined) {

                if (direction > 0) {
                    newtarget = this.focus.child[0];
                } else {
                    newtarget = this.focus.child[this.focus.child.length - 1];
                }

            } else {
                childIndex += direction

                if (childIndex < 0 || childIndex >= childLength) {
                    newtarget = this.focus;
                } else {
                    newtarget = this.focus.child[childIndex];
                }
            }

            if (newtarget.name !== this.currentShip.name) { break; }
        }

        if (!this.isFollowShip) {
            this.recalcPlan(newtarget);
        }

        this.target = newtarget;
        this.heading = "Manual";
    }

    toggleFollowSelf() {

        this.isFollowShip = !this.isFollowShip;

        if (this.isFollowShip) {
            this.recalcPlan(this.focus);
        } else {
            this.recalcPlan(this.target);
        }
    }

    recalcPlan(newFocus) {

        if (this.currentShip === undefined) { return; }
        if (this.progradeV === 0 && this.radialOutV === 0) { return; }

        let ship = this.currentShip;

        let refFrame = this.camFocus;
        if (refFrame.name === this.currentShip.name) { refFrame = this.focus; }

        let dvx = ship.vx - refFrame.vx;
        let dvy = ship.vy - refFrame.vy;
        let dist = Math.hypot(dvx, dvy);

        // update plan Vs
        let nvx = ship.vx + this.progradeV * dvx / dist - this.radialOutV * dvy / dist;
        let nvy = ship.vy + this.progradeV * dvy / dist + this.radialOutV * dvx / dist;

        let fvx = ship.vx - newFocus.vx;
        let fvy = ship.vy - newFocus.vy;
        let fdist = Math.hypot(fvx, fvy);

        let dvx2 = nvx - newFocus.vx - fvx;
        let dvy2 = nvy - newFocus.vy - fvy;

        let npv = dvx2 * fvx / fdist - dvy2 * -fvy / fdist;
        let nrv = dvy2 * fvx / fdist + dvx2 * -fvy / fdist;

        this.progradeV = npv;
        this.radialOutV = nrv;
        this.plannedFuel = Math.hypot(this.progradeV, this.radialOutV);
    }
}