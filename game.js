class Camera {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Game {

    constructor() {

        this.c = document.getElementById("canvas");
        this.ctx = this.c.getContext("2d");

        this.isPause = false;
        this.simSpeed = 1;
        this.precision = 10000;

        this.camera = new Camera(0, 0, -10);
        this.baseable = [];
        this.base = 3;
        this.isFollowShip = true;

        this.bodies = [];
        this.bodiesMap = {};

        this.logMap = {};

        this.gravMap = {};
        let gravList = ['sun<-mercury', 'sun<-venus', 'sun<-moon', 'sun<-earth', 'sun<-mars', 'earth<-moon', 'sun<-jupiter', 'sun<-saturn', 'moon<-earth', 'sun<-uranus', 'sun<-neptune'];
        for (const grav of gravList) { this.gravMap[grav] = 1; }

    }

    wheel(event) {
        event.preventDefault();
        this.camera.z += Math.sign(event.deltaY);
    }

    keydown(event) {

        let mod = event.ctrlKey * 4 + event.shiftKey * 2 + event.altKey * 1;
        switch (mod + "_" + event.code) {

            case "0_Space": event.preventDefault(); this.togglePause(); break;
            case "0_Digit1": event.preventDefault(); this.simSpeed = 10 ** 0; break;
            case "0_Digit2": event.preventDefault(); this.simSpeed = 10 ** 1; break;
            case "0_Digit3": event.preventDefault(); this.simSpeed = 10 ** 2; break;
            case "0_Digit4": event.preventDefault(); this.simSpeed = 10 ** 3; break;
            case "0_Digit5": event.preventDefault(); this.simSpeed = 10 ** 4; break;

            case "0_F1": event.preventDefault(); this.precision = 10000; break;
            case "0_F2": event.preventDefault(); this.precision = 100; break;
            case "0_F3": event.preventDefault(); this.precision = 1; break;
            case "0_F4": event.preventDefault(); this.precision = 0.01; break;

            case "0_KeyG": event.preventDefault(); this.cycleBase(); break;
            case "2_KeyG": event.preventDefault(); this.cycleBaseBack(); break;
            case "0_KeyF": event.preventDefault(); this.toggleFollowShip(); break;

            case "0_KeyW": event.preventDefault(); this.accelerate(); break;
            case "0_KeyS": event.preventDefault(); this.decelerate(); break;
            case "0_KeyA": event.preventDefault(); this.moveLeft(); break;
            case "0_KeyD": event.preventDefault(); this.moveRight(); break;
        }
    }

    togglePause() {
        this.isPause = !this.isPause
        this.gameLoop();
    }

    toggleFollowShip() {
        this.isFollowShip = !this.isFollowShip;
    }

    cycleBase() {

        this.base++;
        if (this.base === this.baseable.length) { this.base = 0; }

        this.isFollowShip = false;
        this.moveCamera();

        // this.bodiesMap.ship.parent = this.baseable[this.base];
    }

    cycleBaseBack() {

        this.base--;
        if (this.base < 0) { this.base = this.baseable.length - 1; }

        this.isFollowShip = false;
        this.moveCamera();

        // this.bodiesMap.ship.parent = this.baseable[this.base];
    }

    moveCamera() {

        let focus;

        if (this.isFollowShip) {
            focus = this.bodiesMap.ship;
        } else {
            focus = this.baseable[this.base];
        }

        this.camera.x = focus.x;
        this.camera.y = focus.y;

        // let earth = this.bodiesMap.earth;
        // let moon = this.bodiesMap.moon;
        // let a1 = earth.r ** 3 / (earth.r ** 3 + moon.r ** 3);
        // let a2 = moon.r ** 3 / (earth.r ** 3 + moon.r ** 3);
        // this.camera.x = earth.x * a1 + moon.x * a2;
        // this.camera.y = earth.y * a1 + moon.y * a2;
    }

    calShipDir() {
        let ship = this.bodiesMap.ship;
        let base = this.bodies[this.base];

        let dvx = ship.vx - base.vx;
        let dvy = ship.vy - base.vy;

        let a = Math.hypot(dvx, dvy);

        return [dvx / a, dvy / a];
    }

    accelerate() {
        let direction = this.calShipDir();

        let ship = this.bodiesMap.ship;
        ship.vx += direction[0] * 100;
        ship.vy += direction[1] * 100;
    }

    decelerate() {
        let direction = this.calShipDir();

        let ship = this.bodiesMap.ship;
        ship.vx += direction[0] * -100;
        ship.vy += direction[1] * -100;
    }

    moveRight() {
        let direction = this.calShipDir();

        let ship = this.bodiesMap.ship;
        ship.vx += -direction[1] * 100;
        ship.vy += direction[0] * 100;
    }

    moveLeft() {
        let direction = this.calShipDir();

        let ship = this.bodiesMap.ship;
        ship.vx += direction[1] * 100;
        ship.vy += -direction[0] * 100;
    }

    initiate() {

        this.c.addEventListener("wheel", this.wheel.bind(this), false);
        document.body.addEventListener("keydown", this.keydown.bind(this), false);

        // ========================

        let sun = new Body(0, 0, 696340, "sun", "#FFF200");
        this.bodies.push(sun); this.bodiesMap.sun = sun;

        // ========================

        let mercury = new Body(47065000, 0, 2439.7, "mercury", "#B0B0B0");
        this.bodies.push(mercury); this.bodiesMap.mercury = mercury;
        mercury.setVelCirc(sun);

        let venus = new Body(107930000, 0, 6051.8, "venus", "#FFECA0");
        this.bodies.push(venus); this.bodiesMap.venus = venus;
        venus.setVelCirc(sun);

        let earth = new Body(150750000, 0, 6371, "earth", "#006AFF");
        this.bodies.push(earth); this.bodiesMap.earth = earth;
        earth.setVelCirc(sun);

        // ========================

        let moon = new Body(150750000 + 6371 + 384400, 0, 1737.1, "moon", "#B5B0A3");
        this.bodies.push(moon); this.bodiesMap.moon = moon;
        moon.setVelCirc(sun);
        moon.setVelCirc(earth);

        // ========================

        let mars = new Body(246890000, 0, 3389.5, "mars", "#C74E33");
        this.bodies.push(mars); this.bodiesMap.mars = mars;
        mars.setVelCirc(sun);

        let jupiter = new Body(756910000, 0, 69911, "jupiter", "#A6662B");
        this.bodies.push(jupiter); this.bodiesMap.jupiter = jupiter;
        jupiter.setVelCirc(sun);

        let saturn = new Body(1488400000, 0, 58232, "saturn", "#FFE4A6");
        this.bodies.push(saturn); this.bodiesMap.saturn = saturn;
        saturn.setVelCirc(sun);

        let uranus = new Body(2955100000, 0, 25362, "uranus", "#80FFE8");
        this.bodies.push(uranus); this.bodiesMap.uranus = uranus;
        uranus.setVelCirc(sun);

        let neptune = new Body(4475600000, 0, 24622, "neptune", "#2B7CFF");
        this.bodies.push(neptune); this.bodiesMap.neptune = neptune;
        neptune.setVelCirc(sun);

        // ========================

        for (let body of this.bodies) {
            this.baseable.push(body);
        }

        let ship = new Body(150750000 + 6371 + 100, 0, 0.01, "ship", "#00FFA3");
        this.bodies.push(ship); this.bodiesMap.ship = ship;
        ship.setVelCirc(sun);
        ship.setVelCirc(earth);
    }

    async gameLoop() {

        const timer = ms => new Promise(res => setTimeout(res, ms));

        while (true) {

            // if (!this.isPause) {
            for (let i = 0; i < this.simSpeed; i++) { this.moveBodies(); }
            this.calcTrail();
            this.calTraj();
            // }

            this.draw();
            this.log();

            if (this.isPause) { return; }

            await timer(1);
        }
    }

    moveBodies() {

        let badPrecision = { badPrecision: false };

        while (true) {
            for (const body of this.bodies) {
                body.calcGrav(this.bodies, this.precision, this.gravMap, badPrecision, this.logMap);
                if (badPrecision.badPrecision) { break; }
            }

            if (badPrecision.badPrecision) {
                badPrecision.badPrecision = false;
                this.precision *= 100;
            } else { break; }
        }

        for (const body of this.bodies) {
            body.move(this.precision);
        }
    }

    calcTrail() {

        let planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

        for (const planet of planets) {
            this.bodiesMap[planet].calcTrail(this.bodiesMap.sun);
        }
        this.bodiesMap.moon.calcTrail(this.bodiesMap.earth);

        this.bodiesMap.ship.calcTrail(this.bodies[this.base]);
    }

    calTraj() {
        this.bodiesMap.ship.calcTraj(this.bodies, this.precision, this.gravMap, this.bodies[this.base], this.logMap);
    }

    draw() {
        let offScreenCanvas = document.createElement("canvas");
        offScreenCanvas.width = this.c.width;
        offScreenCanvas.height = this.c.height;

        let offCtx = offScreenCanvas.getContext("2d");

        this.moveCamera();

        for (let i = this.bodies.length - 1; i >= 0; i--) {
            let body = this.bodies[i];
            body.drawBody(offCtx, this.camera);
            body.drawTrail(offCtx, this.camera);
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
        logStr += "base: " + this.bodies[this.base].name + "<br>";
        logStr += "simSpeed: " + this.simSpeed + "<br>";
        logStr += "precision: " + this.precision + "<br>";
        logStr += "zoom: " + this.camera.z + "<br>";

        logStr += Object.keys(this.logMap).length + "<br>";

        for (let key in this.logMap) {
            logStr += key + ": " + this.logMap[key] + "<br>";
        }

        let log = document.getElementById("log");
        log.innerHTML = logStr;
    }
}