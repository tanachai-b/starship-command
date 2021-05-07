"use strict";

class Camera {
    constructor(x, y, zoom) {

        this.x = x;
        this.y = y;
        this.r = 0;

        this.zoom = zoom;

        this.vx = 0;
        this.vy = 0;
    }
}

class Game {

    constructor() {

        this.c = document.getElementById("canvas");
        this.ctx = this.c.getContext("2d");

        this.isPause = false;
        this.speed = -12;
        this.zoom = 22;
        this.isFollowSelf = false;
        this.camera = new Camera();

        this.bodies = [];
        this.bodiesMap = {};

        this.camSolSys = [];
        this.camMoons = {};

        this.camSolSysIndex = 3;
        this.camMoonIndex = 0;
        this.camTargetIndex = 2;

        this.focus;
        this.camPosition;
        this.target;

        this.badPrecBodies = {};

        this.pressedKeys = {};
        this.controlShip;
        this.progradeV = 0;
        this.radialInV = 0;
        this.mode = "Pilot";
        this.engine = "Thruster";
        this.maxFuel = 999999;
        this.fuel = 20000;
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

        let starship = new Body("starship", "#00FFA3", 0.005, 0.5, earth, 6378.10 + 1000, 95);
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
            this.drawUI();

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

    toggleEngine() {

        if (this.isPause) { return; }

        if (this.engine === "RCS") {
            this.engine = "Thruster";

        } else if (this.engine === "Thruster") {
            this.engine = "RCS";

            this.progradeV = 0;
            this.radialInV = 0;
            this.mode = "Pilot";
        }
    }

    moveShip() {
        if (this.engine === "RCS") { this.rcs(); }
        if (this.engine === "Thruster") { this.thruster(); }
    }

    rcs() {
        if (this.controlShip === undefined) { return; }
        if (this.fuel === 0) { return; }

        let power = 0.1;

        if (!this.pressedKeys.Shift) {
            if (this.pressedKeys.W) { this.controlShip.vy -= power; this.fuel -= power }
            if (this.pressedKeys.S) { this.controlShip.vy += power; this.fuel -= power }
            if (this.pressedKeys.A) { this.controlShip.vx -= power; this.fuel -= power }
            if (this.pressedKeys.D) { this.controlShip.vx += power; this.fuel -= power }

        } else if (this.pressedKeys.Shift) {
            if (this.pressedKeys.W) { this.controlShip.vy -= power / 10; this.fuel -= power / 10 }
            if (this.pressedKeys.S) { this.controlShip.vy += power / 10; this.fuel -= power / 10 }
            if (this.pressedKeys.A) { this.controlShip.vx -= power / 10; this.fuel -= power / 10 }
            if (this.pressedKeys.D) { this.controlShip.vx += power / 10; this.fuel -= power / 10 }
        }

        this.fuel = Math.max(this.fuel, 0);
    }

    thruster() {
        if (this.controlShip === undefined) { return; }

        let power = 10;

        if (!this.pressedKeys.Shift) {
            if (this.pressedKeys.W) { this.progradeV += power; }
            if (this.pressedKeys.S) { this.progradeV -= power; }
            if (this.pressedKeys.A) { this.radialInV += power; }
            if (this.pressedKeys.D) { this.radialInV -= power; }

        } else if (this.pressedKeys.Shift) {
            if (this.pressedKeys.W) { this.progradeV += power / 10; }
            if (this.pressedKeys.S) { this.progradeV -= power / 10; }
            if (this.pressedKeys.A) { this.radialInV += power / 10; }
            if (this.pressedKeys.D) { this.radialInV -= power / 10; }
        }

        this.plannedFuel = Math.abs(this.progradeV) + Math.abs(this.radialInV);

        if (this.mode === "Pilot") {

            if (this.fuel > this.plannedFuel) {

                this.fuel -= this.plannedFuel
                this.fuel = Math.max(this.fuel, 0);

                let parent = this.controlShip.parent;

                let dvx = this.controlShip.vx - parent.vx;
                let dvy = this.controlShip.vy - parent.vy;

                let dist = Math.hypot(dvx, dvy);

                let direction = { x: dvx / dist, y: dvy / dist };

                this.controlShip.vx += direction.x * this.progradeV;
                this.controlShip.vy += direction.y * this.progradeV;

                this.controlShip.vx += direction.y * this.radialInV;
                this.controlShip.vy += -direction.x * this.radialInV;


            }

            this.progradeV = 0;
            this.radialInV = 0;
        }
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

    toggleMode() {

        if (this.isPause) { return; }

        if (this.mode === "Pilot") {
            this.mode = "Planning";
            this.engine = "Thruster";

        } else if (this.mode === "Planning") {
            this.progradeV = 0;
            this.radialInV = 0;
            this.mode = "Pilot";
        }
    }

    executePlan() {

        if (this.isPause) { return; }

        if (this.progradeV === 0 && this.radialInV === 0) { return; }
        if (this.plannedFuel > this.fuel) { return; }

        this.mode = "Pilot";

    }

    calcPlan() {
        let isPlanning = this.mode === "Planning";
        this.controlShip.calcPlan(isPlanning, this.progradeV, this.radialInV, this.target, this.logMap);
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

        // // set camera rotation
        // let dvx = this.controlShip.vx - this.focus.vx;
        // let dvy = this.controlShip.vy - this.focus.vy;

        // this.camera.r = -Math.atan2(dvy, dvx) - Math.PI / 2;
    }

    drawBodies() {

        let offScreenCanvas = document.createElement("canvas");
        offScreenCanvas.width = this.c.width;
        offScreenCanvas.height = this.c.height;

        let offCtx = offScreenCanvas.getContext("2d");

        for (let i = this.bodies.length - 1; i >= 0; i--) { this.bodies[i].drawTrail(offCtx, this.camera, this.logMap); }
        for (let i = this.bodies.length - 1; i >= 0; i--) { this.bodies[i].drawTrajectory(offCtx, this.camera, this.logMap); }

        for (let i = this.bodies.length - 1; i >= 0; i--) {
            this.bodies[i].drawPlan(offCtx, this.camera, this.logMap);
            this.bodies[i].drawPlanTarget(offCtx, this.camera, this.logMap);
        }

        for (let i = this.bodies.length - 1; i >= 0; i--) {

            let isFocus = this.bodies[i].name === this.focus.name;
            let isPlanning = this.mode === "Planning";
            let isTarget = this.bodies[i].name === this.target.name;
            let isFuelStation = this.fuelStationsMap[this.bodies[i].name] !== undefined;

            this.bodies[i].drawBody(offCtx, this.camera, isFocus, isPlanning, isTarget, isFuelStation, this.logMap);
        }

        for (let i = this.bodies.length - 1; i >= 0; i--) { this.bodies[i].drawName(offCtx, this.camera, this.fuelStationsMap, this.logMap); }

        this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        if (this.enableBlurEffect) {
            this.ctx.filter = 'blur(8px)';
            this.ctx.drawImage(offScreenCanvas, 0, 0);
        }

        this.ctx.filter = "none";
        this.ctx.drawImage(offScreenCanvas, 0, 0);
    }

    drawUI() {

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
        offCtx.moveTo(cx + -16, cy + 0);
        offCtx.lineTo(cx + -12, cy + 0);
        offCtx.moveTo(cx + 12, cy + 0);
        offCtx.lineTo(cx + 16, cy + 0);
        offCtx.moveTo(cx + 0, cy + -16);
        offCtx.lineTo(cx + 0, cy + -12);
        offCtx.moveTo(cx + 0, cy + 12);
        offCtx.lineTo(cx + 0, cy + 16);

        offCtx.strokeStyle = "#00FFA3";
        offCtx.stroke();
    }

    addSideText(offCtx) {

        // fuel usange (planned)
        let plannedFuelText = ""
        if (this.mode === "Planning") {
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
        texts.push("[,], [.] : Slowdown, Speedup Time");
        texts.push("[Space]  : Toggle Pause Time");
        texts.push("");
        texts.push("[I], [K] : Zoom In, Zoom Out");
        texts.push("[J], [L] : Next, Previous Moon/Object");
        texts.push("[H], [;] : Next, Previous Planet");
        texts.push("[N]      : Toggle Focus on Ship");
        texts.push("");
        texts.push("[R]      : Toggle Thruster/RCS");
        texts.push("[W], [S] : Prograde, Retrograde (Thruster)");
        texts.push("[A], [D] : Radial-In, Radial-Out (Thruster)");
        texts.push("[W], [S] : Up, Down (RCS)");
        texts.push("[A], [D] : Left, Right (RCS)");
        texts.push("");
        texts.push("[E]      : Toggle Pilot/Planning Mode");
        texts.push("[U], [O] : Next, Previous Target");
        texts.push("[Q]      : Execute Plan");
        texts.push("");
        texts.push("");
        texts.push("Fuel   : " + Math.round(this.fuel) + plannedFuelText);
        texts.push("Engine : " + this.engine);
        texts.push("");
        texts.push("Mode : " + this.mode);
        texts.push("Trajectory Relative To     : " + this.focus.name.charAt(0).toUpperCase() + this.focus.name.slice(1));
        texts.push("Find Closest Approach To   : " + this.target.name.charAt(0).toUpperCase() + this.target.name.slice(1));
        texts.push("Distance to Target : " + Math.round(targDist) + planDistText);
        texts.push("Relative Velocity : " + Math.round(relativeV));
        texts.push("");
        texts.push("");
        texts.push("Zoom             : " + this.zoom);
        texts.push("Simulation Speed : " + this.speed + (this.isPause ? " [PAUSED]" : ""));
        texts.push("[Backspace] : Toggle Blur Effect");

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
            offCtx.fillText("Planning", this.c.width / 2, 16);

        } else if (this.engine === "RCS") {

            offCtx.strokeStyle = "#4275ff";
            offCtx.lineWidth = 5;
            offCtx.strokeRect(0, 0, this.c.width, this.c.height);

            offCtx.textAlign = "center";
            offCtx.textBaseline = "top";
            offCtx.font = "32px Syne Mono";
            offCtx.fillStyle = "#4275ff";;
            offCtx.fillText("RCS", this.c.width / 2, 16);
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

            case "2_ShiftLeft": event.preventDefault(); this.pressedKeys.Shift = 1; break;

            case "0_KeyE": event.preventDefault(); this.toggleMode(); break;
            case "0_KeyQ": event.preventDefault(); this.executePlan(); break;

            case "0_KeyR": event.preventDefault(); this.toggleEngine(); break;

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
        this.isFollowSelf = false;

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
        this.isFollowSelf = false;
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