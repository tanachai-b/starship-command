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

        this.plan = [];
        this.planTarget = [];
        this.planClosest;
        this.targetClosest;

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
            goodPrecision = Math.max(goodPrecision, 10 ** (-12 / 3));

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

        let tvx = this.vx - this.parent.vx;
        let tvy = this.vy - this.parent.vy;

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

            let trajPrecision = dist / 60 / Math.hypot(tvx, tvy);

            tvx += tax * trajPrecision;
            tvy += tay * trajPrecision;

            tx += tvx * trajPrecision;
            ty += tvy * trajPrecision;

            this.trajectory.push({ x: tx, y: ty });

            // completed loop, break
            let dt = Math.hypot(tx - tx0, ty - ty0);
            if (dt < dist / 60 * 5 && time > 180) { break; }
        }
    }

    calcPlan(prograde, radialIn, target, logMap) {

        if (this.parent === null
            || target === undefined
            || (prograde === 0 && radialIn === 0)
        ) {
            this.plan = [];
            this.planTarget = [];
            this.planClosest = undefined;
            this.targetClosest = undefined;
            return;
        }

        if (target.name === this.parent.name) {
            this.plan = [];
            this.planTarget = [];
            this.planClosest = undefined;
            this.targetClosest = undefined;
            this.calcPlanAlone(prograde, radialIn, logMap);
            return;
        }

        // ship compared to parent
        let px = this.x - this.parent.x;
        let py = this.y - this.parent.y;

        this.plan = [{ x: px, y: py }];

        let pvx = this.vx - this.parent.vx;
        let pvy = this.vy - this.parent.vy;

        // add planned velocity (prograde, radialIn)
        let dist = Math.hypot(pvx, pvy);
        let direction = { x: pvx / dist, y: pvy / dist };

        pvx += direction.x * prograde;
        pvy += direction.y * prograde;

        pvx += direction.y * radialIn;
        pvy += -direction.x * radialIn;

        // target compared to parent
        let tx = target.x - this.parent.x;
        let ty = target.y - this.parent.y;

        this.planTarget = [{ x: tx, y: ty }];

        let tvx = target.vx - this.parent.vx;
        let tvy = target.vy - this.parent.vy;

        // prep find closest points
        let closestDist;

        for (let time = 0; time < 360 + 180; time++) {

            // parent <- ship
            let dist = Math.hypot(-px, -py);
            let grav = this.parent.mass / dist ** 2;

            let pax = grav * -px / dist;
            let pay = grav * -py / dist;

            // parent <- target
            let dist2 = Math.hypot(-tx, -ty);
            let grav2 = this.parent.mass / dist2 ** 2;

            let tax = grav2 * -tx / dist2;
            let tay = grav2 * -ty / dist2;

            // ship -> target
            let dx = tx - px;
            let dy = ty - py;
            let dist3 = Math.hypot(tx - px, ty - py);

            let grav3 = target.mass / dist3 ** 2;

            pax += grav3 * dx / dist3;
            pax += grav3 * dy / dist3;

            // ship <- target
            let grav4 = this.mass / dist3 ** 2;

            pax -= grav4 * dx / dist3;
            pax -= grav4 * dy / dist3;

            // find closest approach
            if (closestDist === undefined) {
                closestDist = dist3;
            } else if (dist3 < closestDist) {
                closestDist = dist3;
                this.planClosest = { x: px, y: py };
                this.targetClosest = { x: tx, y: ty };
            }

            // move ship
            let planPrecision = dist / 60 / Math.hypot(pvx, pvy);

            pvx += pax * planPrecision;
            pvy += pay * planPrecision;

            px += pvx * planPrecision;
            py += pvy * planPrecision;

            this.plan.push({ x: px, y: py });

            // move target
            tvx += tax * planPrecision;
            tvy += tay * planPrecision;

            tx += tvx * planPrecision;
            ty += tvy * planPrecision;

            this.planTarget.push({ x: tx, y: ty });

            // completed loop, break
            let dt = Math.hypot(px - this.plan[0].x, py - this.plan[0].y);
            if (dt < dist / 60 * 5 && time > 180) { break; }
        }
    }


    calcPlanAlone(prograde, radialIn, target, logMap) {

        // ship compared to parent
        let px = this.x - this.parent.x;
        let py = this.y - this.parent.y;

        this.plan = [{ x: px, y: py }];

        let pvx = this.vx - this.parent.vx;
        let pvy = this.vy - this.parent.vy;

        // add planned velocity (prograde, radialIn)
        let dist = Math.hypot(pvx, pvy);
        let direction = { x: pvx / dist, y: pvy / dist };

        pvx += direction.x * prograde;
        pvy += direction.y * prograde;

        pvx += direction.y * radialIn;
        pvy += -direction.x * radialIn;

        for (let time = 0; time < 360 + 180; time++) {

            // parent <- ship
            let dist = Math.hypot(-px, -py);
            let grav = this.parent.mass / dist ** 2;

            let pax = grav * -px / dist;
            let pay = grav * -py / dist;

            // move ship
            let planPrecision = dist / 60 / Math.hypot(pvx, pvy);

            pvx += pax * planPrecision;
            pvy += pay * planPrecision;

            px += pvx * planPrecision;
            py += pvy * planPrecision;

            this.plan.push({ x: px, y: py });

            // completed loop, break
            let dt = Math.hypot(px - this.plan[0].x, py - this.plan[0].y);
            if (dt < dist / 60 * 5 && time > 180) { break; }
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

        if (this.trajectory.length == 0) { return; }

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

    drawPlan(ctx, camera, logMap) {

        if (this.plan.length == 0) { return; }

        let zoom = 2 ** (camera.zoom / 4);

        ctx.beginPath();
        for (let i = 0; i < this.plan.length; i++) {

            let nx = (this.plan[i].x + this.parent.x - camera.x) / zoom + ctx.canvas.width / 2;
            let ny = (this.plan[i].y + this.parent.y - camera.y) / zoom + ctx.canvas.height / 2;

            if (i === 0) {
                ctx.moveTo(nx, ny);
            } else {
                ctx.lineTo(nx, ny);
            }
        }
        ctx.strokeStyle = "#FF307C";
        ctx.stroke();


        if (this.planClosest != undefined) {

            let nx = (this.planClosest.x + this.parent.x - camera.x) / zoom + ctx.canvas.width / 2;
            let ny = (this.planClosest.y + this.parent.y - camera.y) / zoom + ctx.canvas.height / 2;

            ctx.beginPath();
            ctx.arc(nx, ny, 4, 0, 2 * Math.PI);

            ctx.strokeStyle = "#FF307C";
            ctx.stroke();
        }
    }

    drawPlanTarget(ctx, camera, logMap) {

        if (this.planTarget.length == 0) { return; }

        let zoom = 2 ** (camera.zoom / 4);

        ctx.beginPath();
        for (let i = 0; i < this.planTarget.length; i++) {

            let nx = (this.planTarget[i].x + this.parent.x - camera.x) / zoom + ctx.canvas.width / 2;
            let ny = (this.planTarget[i].y + this.parent.y - camera.y) / zoom + ctx.canvas.height / 2;

            if (i === 0) {
                ctx.moveTo(nx, ny);
            } else {
                ctx.lineTo(nx, ny);
            }
        }
        ctx.strokeStyle = "#FFEE00";
        ctx.stroke();

        if (this.targetClosest != undefined) {

            let nx = (this.targetClosest.x + this.parent.x - camera.x) / zoom + ctx.canvas.width / 2;
            let ny = (this.targetClosest.y + this.parent.y - camera.y) / zoom + ctx.canvas.height / 2;

            ctx.beginPath();
            ctx.arc(nx, ny, 4, 0, 2 * Math.PI);

            ctx.strokeStyle = "#FFEE00";
            ctx.stroke();
        }
    }

    drawBody(ctx, camera, focus, target, logMap) {

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

        if (focus) {
            ctx.strokeStyle = "#FF307C";
            let size = 16;
            ctx.strokeRect(nx - size / 2, ny - size / 2, size, size);
        }

        if (target) {

            // let size = 10;

            // ctx.beginPath();
            // ctx.moveTo(nx, -size + ny);
            // ctx.lineTo(size + nx, ny);
            // ctx.lineTo(nx, size + ny);
            // ctx.lineTo(-size + nx, ny);
            // ctx.lineTo(nx, -size + ny);

            // ctx.stroke();

            ctx.strokeStyle = "#FFEE00";
            let size = 12;
            ctx.strokeRect(nx - size / 2, ny - size / 2, size, size);
        }
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
        ctx.font = "13px Syne Mono";
        ctx.textBaseline = "middle";
        ctx.fillText(bodyName, nx + nr + 8, ny);
    }
}