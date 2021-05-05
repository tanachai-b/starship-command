"use strict";

class Body {

    constructor(name, color = "#888888", radius, density, parent, distance, angle) {

        this.name = name;
        this.color = color;
        this.radius = radius;

        this.density = density;
        this.mass = density * radius ** 3;

        this.parent = parent;

        this.x = ((parent === null) ? 0 : parent.x) + distance * Math.cos(-angle / 180 * Math.PI);
        this.y = ((parent === null) ? 0 : parent.y) + distance * Math.sin(-angle / 180 * Math.PI);

        this.lastx;
        this.lasty;

        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;

        this.trail = [];
        this.trajectory = [];

        this.thrustvx = 0;
        this.thrustvy = 0;

        if (parent !== null) {
            this.vx = parent.vx;
            this.vy = parent.vy;
            this.setVelCirc(parent);
        }
    }

    setVelCirc(body) {

        let dx = this.x - body.x;
        let dy = this.y - body.y;
        let dist2 = dx ** 2 + dy ** 2;
        let dist = dist2 ** (1 / 2);

        let target_mass = body.mass

        this.vx += (target_mass / dist) ** 0.5 * dy / dist;
        this.vy += (target_mass / dist) ** 0.5 * -dx / dist;
    }

    calcGrav(bodies, precision, badPrecBodies, gravMap, logMap) {

        this.ax = 0;
        this.ay = 0;

        if (this.parent !== null && badPrecBodies[this.parent.name] === 1) {
            badPrecBodies[this.name] = 1;
            return;
        }

        for (let body of bodies) {
            if (this === body) { continue; }

            if (badPrecBodies[body.name] === 1) { continue; }

            let gravName = body.name + "<-" + this.name;
            // if (this.name != "ship" && gravMap[gravName] === null) { continue; }

            let dx = body.x - this.x;
            let dy = body.y - this.y;

            let dist2 = dx ** 2 + dy ** 2;
            let dist = dist2 ** (1 / 2);

            let grav = body.mass / dist2;

            let ax = grav * dx / dist;
            let ay = grav * dy / dist;

            // check precision good / bad
            let goodPrecision = dist / 60 / Math.hypot(this.vx - body.vx, this.vy - body.vy);

            if (precision > goodPrecision * 10 ** (1 / 3) && this.parent !== null && body === this.parent) {

                // logMap[body.name + "<-" + this.name] = goodPrecision;

                this.ax = 0;
                this.ay = 0;

                badPrecBodies[this.name] = 1;
                break;
            }

            this.ax += ax;
            this.ay += ay;
        }
    }

    move(precision, badPrecBodies) {

        if (badPrecBodies[this.name] === 1) {

            this.vx += this.parent.ax * precision;
            this.vy += this.parent.ay * precision;

            this.lastx = this.x;
            this.lasty = this.y;

            this.x += this.parent.x - this.parent.lastx;
            this.y += this.parent.y - this.parent.lasty;

        } else {

            this.vx += this.ax * precision;
            this.vy += this.ay * precision;

            this.lastx = this.x;
            this.lasty = this.y;

            this.x += this.vx * precision;
            this.y += this.vy * precision;
        }
    }

    switchParent(newParent) {

        let x1 = this.parent.x;
        let y1 = this.parent.y;

        let x2 = newParent.x;
        let y2 = newParent.y;

        let dx = x2 - x1;
        let dy = y2 - y1;

        for (let point of this.trail) {
            point.x -= dx;
            point.y -= dy;
        }

        this.parent = newParent;
    }

    addTrail(logMap) {

        if (this.parent === null) { return; }

        this.trail.push({ x: this.x - this.parent.x, y: this.y - this.parent.y });

        if (this.trail.length >= 3) {

            // reduce nodes (if a trail section is shorter than radius/100, remove middle node)
            let p1 = this.trail[this.trail.length - 1];
            let p2 = this.trail[this.trail.length - 3];

            let p1p2 = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
            let p1p0 = p1.x ** 2 + p1.y ** 2;

            if (p1p2 < p1p0 / 60 ** 2) { this.trail.splice(this.trail.length - 2, 1); }

            // cut trail end (if trail end's distance to trail head is less than 1% of diameter, remove trail end nodes)
            let pn = this.trail[this.trail.length - 1];
            let pm = this.trail[Math.round(this.trail.length / 2)];

            for (let i = 0; i < Math.round(this.trail.length / 2); i++) {

                let p0 = this.trail[i];
                let p0pn = (p0.x - pn.x) ** 2 + (p0.y - pn.y) ** 2;
                let pmpn = (pm.x - pn.x) ** 2 + (pm.y - pn.y) ** 2;

                if (p0pn < pmpn * 0.1 ** 2) {
                    this.trail.splice(0, i + 1);
                    i = 0;
                }
            }
        }

        if (this.trail.length > 720) {
            this.trail.splice(0, this.trail.length - 720);
        }
    }

    calcTrajectory(logMap) {

        if (this.parent === null) { return; }

        let tax = 0;
        let tay = 0;

        let tvx = this.vx - this.parent.vx + this.thrustvx;
        let tvy = this.vy - this.parent.vy + this.thrustvy;

        let tx = this.x - this.parent.x;
        let ty = this.y - this.parent.y;

        let tx0 = tx;
        let ty0 = ty;

        this.trajectory = [{ x: tx, y: ty }];

        for (let time = 0; time < 360 + 180; time++) {

            let dx = 0 - tx;
            let dy = 0 - ty;

            let dist = Math.hypot(dx, dy);
            let grav = this.parent.mass / dist ** 2;

            tax = grav * dx / dist;
            tay = grav * dy / dist;

            let trajPrecision = dist / 60 / Math.hypot(tvx, tvy)

            tvx += tax * trajPrecision;
            tvy += tay * trajPrecision;

            tx += tvx * trajPrecision;
            ty += tvy * trajPrecision;

            this.trajectory.push({ x: tx, y: ty });

            // // check trajectory precision, too much, too less
            // let tv = Math.hypot(tvx, tvy) * this.trajPrecision;
            // // if (tv > dist) { this.trajectory.pop(); }

            // if (tv / dist < (1 / 60)) {
            //     this.trajPrecision *= 10 ** (1 / 3);

            // } else if (tv / dist > (2 / 60)) {
            //     this.trajPrecision /= 10 ** (1 / 3);
            // }

            // this.trajPrecision = Math.max(this.trajPrecision, 0.01);
            // this.trajPrecision = Math.min(this.trajPrecision, 10000);

            // this.trajPrecision *= 8 ** (1 / 360)

            // completed loop, break
            let dt = Math.hypot(tx - tx0, ty - ty0);
            if (dt < dist / 60 * 5 && time > 180) { break; }

            // if (time >= 3) {
            //     let x1 = this.trajectory[0].x;
            //     let y1 = this.trajectory[0].y;
            //     let x2 = this.trajectory[Math.round(this.trajectory.length / 2)].x - x1;
            //     let y2 = this.trajectory[Math.round(this.trajectory.length / 2)].y - y1;
            //     let x3 = tx - x1;
            //     let y3 = ty - y1;
            //     let sign1 = Math.sign(x1 * y2 - x2 * y1);
            //     let sign2 = Math.sign(x1 * y3 - x3 * y1);

            //     if (sign1 === sign2) {
            //         logMap[this.name + " " + time] = Math.round((x1 * y2 - x2 * y1) / 1000000) + " " + Math.round((x1 * y3 - x3 * y1) / 1000000);
            //         break;
            //     }
            // }
        }
    }

    drawTrail(ctx, camera, logMap) {

        if (this.trail.length == 0) { return; }

        let zoom = 2 ** (camera.zoom / 4);

        ctx.beginPath();
        for (let i = 0; i < this.trail.length; i++) {

            let nx = (this.trail[i].x + this.parent.x - camera.x) / zoom + ctx.canvas.width / 2;
            let ny = (this.trail[i].y + this.parent.y - camera.y) / zoom + ctx.canvas.height / 2;

            if (i === 0) {
                ctx.moveTo(nx, ny);
            } else {
                ctx.lineTo(nx, ny);
            }
        }
        // ctx.strokeStyle = this.color;
        ctx.strokeStyle = "red";
        ctx.stroke();
    }

    drawTrajectory(ctx, camera, logMap) {

        if (this.trajectory.lenght == 0) { return; }

        let zoom = 2 ** (camera.zoom / 4);

        ctx.beginPath();
        for (let i = 0; i < this.trajectory.length; i++) {

            let nx = (this.trajectory[i].x + this.parent.x - camera.x) / zoom + ctx.canvas.width / 2;
            let ny = (this.trajectory[i].y + this.parent.y - camera.y) / zoom + ctx.canvas.height / 2;

            if (i === 0) {
                ctx.moveTo(nx, ny);
            } else {
                ctx.lineTo(nx, ny);
            }
        }
        ctx.strokeStyle = this.color;
        ctx.stroke();
    }

    drawBody(ctx, camera, logMap) {

        let zoom = 2 ** (camera.zoom / 4);

        let nx = (this.x - camera.x) / zoom + ctx.canvas.width / 2;
        let ny = (this.y - camera.y) / zoom + ctx.canvas.height / 2;
        let nr = Math.max(this.radius / zoom, 2);

        ctx.beginPath();
        ctx.arc(nx, ny, nr, 0, 2 * Math.PI);

        // ctx.strokeStyle = this.color;
        // ctx.stroke();

        ctx.fillStyle = this.color;
        ctx.fill();
    }

    drawName(ctx, camera, logMap) {

        let zoom = 2 ** (camera.zoom / 4);

        let nx = (this.x - camera.x) / zoom + ctx.canvas.width / 2;
        let ny = (this.y - camera.y) / zoom + ctx.canvas.height / 2;
        let nr = Math.max(this.radius / zoom, 2);

        if (this.parent !== null) {
            let dx = this.x - this.parent.x;
            let dy = this.y - this.parent.y;

            let dist = Math.hypot(dx, dy) / zoom;

            if (dist < 20) { return; }
        }

        let bodyName = this.name.charAt(0).toUpperCase() + this.name.slice(1);

        // ctx.fillStyle = "#000000";
        // ctx.fillRect(nx + nr + 4, ny, ctx.measureText(bodyName).width, 10);

        ctx.fillStyle = this.color;
        ctx.font = "10px sans-serif";
        ctx.textBaseline = "middle";
        ctx.fillText(bodyName, nx + nr + 4, ny);
    }
}