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

class Body {

    constructor(name, color = "#888888", radius, density, parent, distance, angle) {

        this.name = name;
        this.color = color;
        this.radius = radius;

        this.density = density;
        this.mass = density * radius ** 3;

        this.parent = parent;
        this.distance = distance;

        this.child = [];
        this.childMap = {};

        this.lastx;
        this.lasty;

        this.x = distance * Math.cos(-angle / 180 * Math.PI);
        this.y = distance * Math.sin(-angle / 180 * Math.PI);
        this.r = 0;

        this.vx = 0;
        this.vy = 0;
        this.vr = 0;

        this.ax = 0;
        this.ay = 0;

        this.trajectory = [];
        this.trajTarget = [];
        this.trajClosest;
        this.trajTargetClosest;
        this.trajApproachV;

        this.trajFrameTarg = [];
        this.trajFrameTargClosest;

        this.plan = [];
        this.planTarget = [];
        this.planClosest;
        this.planTargetClosest;
        this.planApproachV;

        this.planFrameTarg = [];
        this.planFrameTargClosest;

        this.periapsis;
        this.apoapsis;
        this.argOfPeri;

        if (parent !== null) {

            parent.child.push(this);
            parent.childMap[name] = parent.child.length - 1;

            this.x += parent.x;
            this.y += parent.y;

            this.vx = parent.vx;
            this.vy = parent.vy;

            this.setOrbit(parent);
            this.r = Math.atan2(this.vy - parent.vy, this.vx - parent.vx);
        }

        // this.trajColor = "";
        // this.planColor = "";
        // this.targetPlanColor = "";
    }

    setOrbit(primary) {

        let dx = this.x - primary.x;
        let dy = this.y - primary.y;
        let dist = Math.hypot(dx, dy);

        this.vx += (primary.mass / dist) ** 0.5 * dy / dist;
        this.vy += (primary.mass / dist) ** 0.5 * -dx / dist;
    }

    calcGravity(bodies, precision, badPrecBodies, logMap) {

        this.ax = 0;
        this.ay = 0;

        if (this.parent !== null && badPrecBodies[this.parent.name] === 1) {
            badPrecBodies[this.name] = 1;
            return;
        }

        for (let body of bodies) {
            if (this === body) { continue; }

            if (badPrecBodies[body.name] === 1) { continue; }

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

            this.r += this.vr * precision;
            this.r %= 2 * Math.PI;
            this.r += 2 * Math.PI;
            this.r %= 2 * Math.PI;
        }
    }

    calcBodyTraj(logMap) {

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

        for (let time = 0; time < 1000; time++) {

            let dist = Math.hypot(tx, ty);
            let grav = this.parent.mass / dist ** 2;

            tax = grav * -tx / dist;
            tay = grav * -ty / dist;

            let trajPrecision = dist / Math.hypot(tvx, tvy) / 100;

            tvx += tax * trajPrecision;
            tvy += tay * trajPrecision;

            tx += tvx * trajPrecision;
            ty += tvy * trajPrecision;

            this.trajectory.push({ x: tx, y: ty });

            // completed loop, break
            let dt = Math.hypot(tx - tx0, ty - ty0);
            if (dt < dist / 60 && time > 1000 / 2) { break; }
        }
    }

    calcShipTraj(target, logMap) {

        this.trajectory = [];
        this.trajTarget = [];
        this.trajClosest = undefined;
        this.trajTargetClosest = undefined;
        this.trajApproachV = undefined;

        this.trajFrameTarg = [];
        this.trajFrameTargClosest = undefined;

        this.periapsis = undefined;
        this.apoapsis = undefined;
        this.argOfPeri = undefined;

        if (this.parent === null || target === undefined) { return; }

        if (target.name === this.parent.name) {
            this.calcShipTrajNoTarget(logMap);
            return;
        }

        // ship compared to parent
        let px = this.x - this.parent.x;
        let py = this.y - this.parent.y;

        this.trajectory = [{ x: px, y: py }];

        let pvx = this.vx - this.parent.vx;
        let pvy = this.vy - this.parent.vy;

        // target compared to parent
        let tx = target.x - this.parent.x;
        let ty = target.y - this.parent.y;

        this.trajTarget = [{ x: tx, y: ty }];

        this.trajFrameTarg = [{ x: px - tx, y: py - ty }];

        let tvx = target.vx - this.parent.vx;
        let tvy = target.vy - this.parent.vy;

        // prep find closest points
        let closestDist;
        let closestTime;

        // prep find periapsis/apoapsis
        let periapsisTime;
        let apoapsisTime;

        let isTrajLoop = false;
        let isTargetLoop = false;
        let isFrameTargLoop = false;

        let time = 0;
        for (time = 0; time < 2000; time++) {

            // parent <- ship
            let dist = Math.hypot(px, py);
            let grav = this.parent.mass / dist ** 2;

            let pax = grav * -px / dist;
            let pay = grav * -py / dist;

            // parent <- target
            let dist2 = Math.hypot(tx, ty);
            let grav2 = this.parent.mass / dist2 ** 2;

            let tax = grav2 * -tx / dist2;
            let tay = grav2 * -ty / dist2;

            // ship -> target
            let dx = tx - px;
            let dy = ty - py;
            let dist3 = Math.hypot(dx, dy);

            let dvx = pvx - tvx;
            let dvy = pvy - tvy;

            let grav3 = target.mass / dist3 ** 2;

            pax += grav3 * dx / dist3;
            pay += grav3 * dy / dist3;

            // ship <- target
            let grav4 = this.mass / dist3 ** 2;

            tax += grav4 * -dx / dist3;
            tay += grav4 * -dy / dist3;

            // find closest approach
            if (closestDist === undefined) {
                closestDist = dist3;

            } else if (dist3 < closestDist) {
                closestDist = dist3;
                closestTime = time;
                this.trajClosest = { x: px, y: py };
                this.trajTargetClosest = { x: tx, y: ty };
                this.trajFrameTargClosest = { x: px - tx, y: py - ty };
                this.trajApproachV = Math.hypot(dvx, dvy);
            }

            // find periapsis
            if (this.periapsis === undefined) {
                this.periapsis = dist;
                this.argOfPeri = Math.atan2(py, px);
                periapsisTime = time;

            } else if (dist < this.periapsis) {
                this.periapsis = dist;
                this.argOfPeri = Math.atan2(py, px);
                periapsisTime = time;
            }

            // find apoapsis
            if (this.apoapsis === undefined) {
                this.apoapsis = dist;
                apoapsisTime = time;

            } else if (dist > this.apoapsis) {
                this.apoapsis = dist;
                apoapsisTime = time;
            }

            // move ship
            let planPrecision = Math.min(
                dist / Math.hypot(pvx, pvy) / 100,
                dist2 / Math.hypot(tvx, tvy) / 100,
                dist3 / Math.hypot(dvx, dvy) / 100
            );

            pvx += pax * planPrecision;
            pvy += pay * planPrecision;

            px += pvx * planPrecision;
            py += pvy * planPrecision;

            // move target
            tvx += tax * planPrecision;
            tvy += tay * planPrecision;

            tx += tvx * planPrecision;
            ty += tvy * planPrecision;

            // completed loop, break
            let dt = Math.hypot(px - this.trajectory[0].x, py - this.trajectory[0].y);
            if (dt < dist / 60 && time > 2000 / 2) { isTrajLoop = true; }
            if (!isTrajLoop) { this.trajectory.push({ x: px, y: py }); }

            let dtt = Math.hypot(tx - this.trajTarget[0].x, ty - this.trajTarget[0].y);
            if (dtt < dist2 / 60 && time > 2000 / 2) { isTargetLoop = true; }
            if (!isTargetLoop) { this.trajTarget.push({ x: tx, y: ty }); }

            let dttt = Math.hypot(px - tx - this.trajFrameTarg[0].x, py - ty - this.trajFrameTarg[0].y);
            if (dttt < dist3 / 60 && time > 2000 / 2) { isFrameTargLoop = true; }
            if (!isFrameTargLoop) { this.trajFrameTarg.push({ x: px - tx, y: py - ty }); }
        }

        if (closestTime === time) {
            this.trajClosest = undefined;
            this.trajTargetClosest = undefined;
        }

        // if (periapsisTime === 0 || periapsisTime === time) { this.periapsis = undefined; }
        // if (apoapsisTime === 0 || apoapsisTime === time) { this.apoapsis = undefined; }
    }

    calcShipTrajNoTarget(logMap) {

        // ship compared to parent
        let px = this.x - this.parent.x;
        let py = this.y - this.parent.y;

        this.trajectory = [{ x: px, y: py }];

        let pvx = this.vx - this.parent.vx;
        let pvy = this.vy - this.parent.vy;

        // prep find closest points
        let closestDist;
        let closestTime;

        // prep find periapsis/apoapsis
        let periapsisTime;
        let apoapsisTime;

        let time = 0;
        for (let time = 0; time < 1000; time++) {

            // parent <- ship
            let dist = Math.hypot(-px, -py);
            let grav = this.parent.mass / dist ** 2;

            let pax = grav * -px / dist;
            let pay = grav * -py / dist;

            // find closest approach
            if (closestDist === undefined) {
                closestDist = dist;

            } else if (dist < closestDist) {
                closestDist = dist;
                closestTime = time;
                this.trajClosest = { x: px, y: py };
                this.trajFrameTargClosest = { x: px, y: py };
                this.trajApproachV = Math.hypot(pvx, pvy);
            }

            // find periapsis
            if (this.periapsis === undefined) {
                this.periapsis = dist;
                this.argOfPeri = Math.atan2(py, px);
                periapsisTime = time;

            } else if (dist < this.periapsis) {
                this.periapsis = dist;
                this.argOfPeri = Math.atan2(py, px);
                periapsisTime = time;
            }

            // find apoapsis
            if (this.apoapsis === undefined) {
                this.apoapsis = dist;
                apoapsisTime = time;

            } else if (dist > this.apoapsis) {
                this.apoapsis = dist;
                apoapsisTime = time;
            }

            // move ship
            let planPrecision = dist / Math.hypot(pvx, pvy) / 100;

            pvx += pax * planPrecision;
            pvy += pay * planPrecision;

            px += pvx * planPrecision;
            py += pvy * planPrecision;

            this.trajectory.push({ x: px, y: py });
            this.trajFrameTarg.push({ x: px, y: py });

            // completed loop, break
            let dt = Math.hypot(px - this.trajectory[0].x, py - this.trajectory[0].y);
            if (dt < dist / 60 && time > 1000 / 2) { break; }
        }

        if (closestTime === time) {
            this.trajClosest = undefined;
        }

        // if (periapsisTime === 0 || periapsisTime === time) { this.periapsis = undefined; }
        // if (apoapsisTime === 0 || apoapsisTime === time) { this.apoapsis = undefined; }
    }

    calcShipPlan(progradeV, radialOutV, target, isFollowShip, logMap) {

        this.plan = [];
        this.planTarget = [];
        this.planClosest = undefined;
        this.planTargetClosest = undefined;
        this.planApproachV = undefined;

        this.planFrameTarg = [];
        this.planFrameTargClosest = undefined;

        if (this.parent === null || target === undefined) { return; }

        if (target.name === this.parent.name) {
            this.calcPlanNoTarget(progradeV, radialOutV, logMap);
            return;
        }

        // ship compared to parent
        let px = this.x - this.parent.x;
        let py = this.y - this.parent.y;

        this.plan = [{ x: px, y: py }];

        let pvx0 = this.vx - this.parent.vx;
        let pvy0 = this.vy - this.parent.vy;
        let dist = Math.hypot(pvx0, pvy0);

        // target compared to parent
        let tx = target.x - this.parent.x;
        let ty = target.y - this.parent.y;

        this.planTarget = [{ x: tx, y: ty }];

        this.planFrameTarg = [{ x: px - tx, y: py - ty }];

        let tvx = target.vx - this.parent.vx;
        let tvy = target.vy - this.parent.vy;

        // add planned velocity (progradeV, radialInV)
        let pvx = pvx0;
        let pvy = pvy0;

        let dtvx = this.vx - target.vx;
        let dtvy = this.vy - target.vy;
        let dtdist = Math.hypot(dtvx, dtvy);

        if (isFollowShip) {
            pvx += progradeV * pvx0 / dist - radialOutV * pvy0 / dist;
            pvy += radialOutV * pvx0 / dist + progradeV * pvy0 / dist;
        } else {
            pvx += progradeV * dtvx / dtdist - radialOutV * dtvy / dtdist;
            pvy += radialOutV * dtvx / dtdist + progradeV * dtvy / dtdist;
        }

        // prep find closest points
        let closestDist;
        let closestTime;
        let time = 0;

        let isPlanLoop = false;
        let isTargetLoop = false;
        let isFrameTargLoop = false;

        for (time = 0; time < 2000; time++) {

            // parent <- ship
            let dist = Math.hypot(px, py);
            let grav = this.parent.mass / dist ** 2;

            let pax = grav * -px / dist;
            let pay = grav * -py / dist;

            // parent <- target
            let dist2 = Math.hypot(tx, ty);
            let grav2 = this.parent.mass / dist2 ** 2;

            let tax = grav2 * -tx / dist2;
            let tay = grav2 * -ty / dist2;

            // ship -> target
            let dx = tx - px;
            let dy = ty - py;
            let dist3 = Math.hypot(dx, dy);

            let dvx = pvx - tvx;
            let dvy = pvy - tvy;

            let grav3 = target.mass / dist3 ** 2;

            pax += grav3 * dx / dist3;
            pay += grav3 * dy / dist3;

            // ship <- target
            let grav4 = this.mass / dist3 ** 2;

            tax += grav4 * -dx / dist3;
            tay += grav4 * -dy / dist3;

            // find closest approach
            if (closestDist === undefined) {
                closestDist = dist3;

            } else if (dist3 < closestDist) {
                closestDist = dist3;
                closestTime = time;
                this.planClosest = { x: px, y: py };
                this.planTargetClosest = { x: tx, y: ty };
                this.planFrameTargClosest = { x: px - tx, y: py - ty };
                this.planApproachV = Math.hypot(dvx, dvy);
            }

            // move ship
            let planPrecision = Math.min(
                dist / Math.hypot(pvx, pvy) / 100,
                dist2 / Math.hypot(tvx, tvy) / 100,
                dist3 / Math.hypot(dvx, dvy) / 100
            )

            pvx += pax * planPrecision;
            pvy += pay * planPrecision;

            px += pvx * planPrecision;
            py += pvy * planPrecision;

            // move target
            tvx += tax * planPrecision;
            tvy += tay * planPrecision;

            tx += tvx * planPrecision;
            ty += tvy * planPrecision;

            // completed loop, break
            let dt = Math.hypot(px - this.plan[0].x, py - this.plan[0].y);
            if (dt < dist / 60 && time > 2000 / 2) { isPlanLoop = true; }
            if (!isPlanLoop) { this.plan.push({ x: px, y: py }); }

            let dtt = Math.hypot(tx - this.planTarget[0].x, ty - this.planTarget[0].y);
            if (dtt < dist2 / 60 && time > 2000 / 2) { isTargetLoop = true; }
            if (!isTargetLoop) { this.planTarget.push({ x: tx, y: ty }); }

            let dttt = Math.hypot(px - tx - this.planFrameTarg[0].x, py - ty - this.planFrameTarg[0].y);
            if (dttt < dist3 / 60 && time > 2000 / 2) { isFrameTargLoop = true; }
            if (!isFrameTargLoop) { this.planFrameTarg.push({ x: px - tx, y: py - ty }); }
        }

        if (closestTime === time) {
            this.planClosest = undefined;
            this.planTargetClosest = undefined;
        }
    }

    calcPlanNoTarget(progradeV, radialOutV, logMap) {

        // ship compared to parent
        let px = this.x - this.parent.x;
        let py = this.y - this.parent.y;

        this.plan = [{ x: px, y: py }];

        let pvx0 = this.vx - this.parent.vx;
        let pvy0 = this.vy - this.parent.vy;
        let dist = Math.hypot(pvx0, pvy0);

        // add planned velocity (progradeV, radialInV)
        let pvx = pvx0 + progradeV * pvx0 / dist - radialOutV * pvy0 / dist;
        let pvy = pvy0 + radialOutV * pvx0 / dist + progradeV * pvy0 / dist;

        // prep find closest points
        let closestDist;
        let closestTime;
        let time = 0;

        for (let time = 0; time < 1000; time++) {

            // parent <- ship
            let dist = Math.hypot(-px, -py);
            let grav = this.parent.mass / dist ** 2;

            let pax = grav * -px / dist;
            let pay = grav * -py / dist;

            // find closest approach
            if (closestDist === undefined) {
                closestDist = dist;

            } else if (dist < closestDist) {
                closestDist = dist;
                closestTime = time;
                this.planClosest = { x: px, y: py };
                this.planFrameTargClosest = { x: px, y: py };
                this.planApproachV = Math.hypot(pvx, pvy);
            }

            // move ship
            let planPrecision = dist / Math.hypot(pvx, pvy) / 100;

            pvx += pax * planPrecision;
            pvy += pay * planPrecision;

            px += pvx * planPrecision;
            py += pvy * planPrecision;

            this.plan.push({ x: px, y: py });
            this.planFrameTarg.push({ x: px, y: py });

            // completed loop, break
            let dt = Math.hypot(px - this.plan[0].x, py - this.plan[0].y);
            if (dt < dist / 60 && time > 1000 / 2) { break; }
        }

        if (closestTime === time) {
            this.planClosest = undefined;
        }
    }

    drawTraj(ctx, camera, target, isFollowShip, logMap) {

        if (this.trajectory.length == 0) { return; }

        if (!isFollowShip) {

            ctx.beginPath();
            for (let i = 0; i < this.trajFrameTarg.length; i++) {

                let np = this.calcXY(ctx, camera, this.trajFrameTarg[i].x + target.x, this.trajFrameTarg[i].y + target.y);
                let nx = np.x;
                let ny = np.y;

                if (i === 0) {
                    ctx.moveTo(nx, ny);
                } else {
                    ctx.lineTo(nx, ny);
                }
            }
            ctx.strokeStyle = this.color;
            ctx.stroke();

            if (this.trajFrameTargClosest != undefined) {

                let np = this.calcXY(ctx, camera, this.trajFrameTargClosest.x + target.x, this.trajFrameTargClosest.y + target.y);
                let nx = np.x;
                let ny = np.y;

                ctx.beginPath();
                ctx.arc(nx, ny, 4, 0, 2 * Math.PI);

                ctx.strokeStyle = this.color;
                ctx.stroke();
            }

        } else {

            ctx.beginPath();
            for (let i = 0; i < this.trajectory.length; i++) {

                let np = this.calcXY(ctx, camera, this.trajectory[i].x + this.parent.x, this.trajectory[i].y + this.parent.y);
                let nx = np.x;
                let ny = np.y;

                if (i === 0) {
                    ctx.moveTo(nx, ny);
                } else {
                    ctx.lineTo(nx, ny);
                }
            }
            ctx.strokeStyle = this.color;
            ctx.stroke();

            if (this.trajClosest != undefined) {

                let np = this.calcXY(ctx, camera, this.trajClosest.x + this.parent.x, this.trajClosest.y + this.parent.y);
                let nx = np.x;
                let ny = np.y;

                ctx.beginPath();
                ctx.arc(nx, ny, 4, 0, 2 * Math.PI);

                ctx.strokeStyle = this.color;
                ctx.stroke();
            }
        }
    }

    drawPlan(ctx, camera, isHavePlan, target, isFollowShip, isPlanning, logMap) {

        if (this.plan.length === 0) { return; }
        if (!isHavePlan) { return; }

        if (!isFollowShip) {

            ctx.beginPath();
            for (let i = 0; i < this.planFrameTarg.length; i++) {

                let np = this.calcXY(ctx, camera, this.planFrameTarg[i].x + target.x, this.planFrameTarg[i].y + target.y);
                let nx = np.x;
                let ny = np.y;

                if (i === 0) {
                    ctx.moveTo(nx, ny);
                } else {
                    ctx.lineTo(nx, ny);
                }
            }
            // ctx.strokeStyle = this.color;
            // if (isPlanning) { ctx.strokeStyle = "#FF307C"; }
            ctx.strokeStyle = "#FF307C";
            if (isPlanning) { ctx.lineWidth = 2; }
            ctx.stroke();
            ctx.lineWidth = 1;

            if (this.planFrameTargClosest !== undefined) {

                let np = this.calcXY(ctx, camera, this.planFrameTargClosest.x + target.x, this.planFrameTargClosest.y + target.y);
                let nx = np.x;
                let ny = np.y;

                ctx.beginPath();
                ctx.arc(nx, ny, 4, 0, 2 * Math.PI);

                // ctx.strokeStyle = this.color;
                // if (isPlanning) { ctx.strokeStyle = "#FF307C"; }
                ctx.strokeStyle = "#FF307C";
                if (isPlanning) { ctx.lineWidth = 2; }
                ctx.stroke();
                ctx.lineWidth = 1;
            }

        } else {

            ctx.beginPath();
            for (let i = 0; i < this.plan.length; i++) {

                let np = this.calcXY(ctx, camera, this.plan[i].x + this.parent.x, this.plan[i].y + this.parent.y);
                let nx = np.x;
                let ny = np.y;

                if (i === 0) {
                    ctx.moveTo(nx, ny);
                } else {
                    ctx.lineTo(nx, ny);
                }
            }
            // ctx.strokeStyle = this.color;
            // if (isPlanning) { ctx.strokeStyle = "#FF307C"; }
            ctx.strokeStyle = "#FF307C";
            if (isPlanning) { ctx.lineWidth = 2; }
            ctx.stroke();
            ctx.lineWidth = 1;

            if (this.planClosest !== undefined) {

                let np = this.calcXY(ctx, camera, this.planClosest.x + this.parent.x, this.planClosest.y + this.parent.y);
                let nx = np.x;
                let ny = np.y;

                ctx.beginPath();
                ctx.arc(nx, ny, 4, 0, 2 * Math.PI);

                // ctx.strokeStyle = this.color;
                // if (isPlanning) { ctx.strokeStyle = "#FF307C"; }
                ctx.strokeStyle = "#FF307C";
                if (isPlanning) { ctx.lineWidth = 2; }
                ctx.stroke();
                ctx.lineWidth = 1;
            }
        }
    }

    drawPlanTarget(ctx, camera, isPlanning, logMap) {

        if (this.planTarget.length == 0) { return; }

        ctx.beginPath();
        for (let i = 0; i < this.planTarget.length; i++) {

            let np = this.calcXY(ctx, camera, this.planTarget[i].x + this.parent.x, this.planTarget[i].y + this.parent.y);
            let nx = np.x;
            let ny = np.y;

            if (i === 0) {
                ctx.moveTo(nx, ny);
            } else {
                ctx.lineTo(nx, ny);
            }
        }

        ctx.strokeStyle = "#FFEE00";
        // if (isPlanning) { ctx.strokeStyle = "#FFEE00"; }
        if (isPlanning) { ctx.lineWidth = 2; }
        ctx.stroke();
        ctx.lineWidth = 1;

        if (this.planTargetClosest !== undefined) {

            let np = this.calcXY(ctx, camera, this.planTargetClosest.x + this.parent.x, this.planTargetClosest.y + this.parent.y);
            let nx = np.x;
            let ny = np.y;

            ctx.beginPath();
            ctx.arc(nx, ny, 4, 0, 2 * Math.PI);

            ctx.strokeStyle = "#FFEE00";
            // if (isPlanning) { ctx.strokeStyle = "#FFEE00"; }
            if (isPlanning) { ctx.lineWidth = 2; }
            ctx.stroke();
            ctx.lineWidth = 1;
        }
    }

    drawBody(ctx, camera, isShip, isfuelStations, logMap) {

        let zoom = 2 ** (camera.zoom / 4);

        let nr = Math.max(this.radius / zoom, 2);

        let np = this.calcXY(ctx, camera, this.x, this.y);
        let nx = np.x;
        let ny = np.y;

        ctx.beginPath();
        ctx.arc(nx, ny, nr, 0, 2 * Math.PI);

        if (!isShip) {
            // ctx.strokeStyle = this.color;
            // ctx.stroke();

            ctx.fillStyle = this.color;
            ctx.fill();
        }

        if (isfuelStations) {

            let refuelRadius = Math.max(0.04 / zoom, 4);

            ctx.beginPath();
            ctx.arc(nx, ny, refuelRadius, 0, 2 * Math.PI);

            ctx.strokeStyle = this.color;
            ctx.stroke();
        }

        if (isShip) {

            let triangle = [];
            triangle.push({ x: 11, y: 0 });
            triangle.push({ x: 9, y: 2 });
            triangle.push({ x: 3, y: 3 });
            triangle.push({ x: -2, y: 8 });
            triangle.push({ x: -5, y: 7 });
            triangle.push({ x: -6, y: 3 });
            triangle.push({ x: -7, y: 2.5 });

            triangle.push({ x: -7, y: 0 });

            triangle.push({ x: -7, y: -2.5 });
            triangle.push({ x: -6, y: -3 });
            triangle.push({ x: -5, y: -7 });
            triangle.push({ x: -2, y: -8 });
            triangle.push({ x: 3, y: -3 });
            triangle.push({ x: 9, y: -2 });
            triangle.push({ x: 11, y: 0 });

            ctx.beginPath();
            for (let i = 0; i < triangle.length; i++) {

                let point = triangle[i];
                let np1 = this.calcXY(ctx, new Camera(0, 0, this.r, 42), point.x, point.y);
                let np = this.calcXY(ctx, camera, np1.x + this.x - ctx.canvas.width / 2, np1.y + this.y - ctx.canvas.height / 2);

                if (i === 0) {
                    ctx.moveTo(np.x, np.y);
                } else {
                    ctx.lineTo(np.x, np.y);
                }
            }

            ctx.fillStyle = "#dedede";
            ctx.fill();
        }
    }

    drawMarker(ctx, camera, isShip, isFocus, isPlanning, isTarget, isHavePlan, logMap) {

        if (!isShip && !isFocus && !isTarget) { return; }

        let np = this.calcXY(ctx, camera, this.x, this.y);
        let nx = np.x;
        let ny = np.y;

        if (isFocus) {
            ctx.strokeStyle = "#00FFA3";
            ctx.lineWidth = 1;
            if (isPlanning) { ctx.strokeStyle = "#FF307C"; ctx.lineWidth = 2; }

            let size = 16;

            ctx.strokeRect(nx - size / 2, ny - size / 2, size, size);
            ctx.lineWidth = 1;
        }

        if (isTarget) {
            ctx.strokeStyle = "#FFEE00";
            let size = 12;

            if (isPlanning) { ctx.lineWidth = 2; }
            ctx.strokeRect(nx - size / 2, ny - size / 2, size, size);
            ctx.lineWidth = 1;
        }

        if (isShip) {

            let triangle = [];
            triangle.push({ x: 12, y: 0 });
            triangle.push({ x: -8, y: 6 });
            triangle.push({ x: -8, y: -6 });
            triangle.push({ x: 12, y: 0 });

            let np = this.calcXY(ctx, camera, this.x, this.y);

            ctx.beginPath();
            for (let i = 0; i < triangle.length; i++) {

                let point = triangle[i];

                let np1 = this.calcXY(ctx, new Camera(0, 0, this.r + camera.r, 0), point.x, point.y);

                let x = np.x + np1.x - ctx.canvas.width / 2;
                let y = np.y + np1.y - ctx.canvas.height / 2;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                // ctx.strokeStyle = this.color;
                // ctx.stroke();
                ctx.fillStyle = this.color;
                ctx.fill();
            }
        }

        // triangle for out-of-screen markers
        if (nx < 0
            || nx > ctx.canvas.width
            || ny < 0
            || ny > ctx.canvas.height
        ) {
            let dx = nx - (ctx.canvas.width / 2);
            let dy = ny - (ctx.canvas.height / 2);

            let nnx = dx;
            let nny = dy;

            if (Math.abs(dy / dx) < ctx.canvas.height / ctx.canvas.width) {
                nnx = Math.max(-ctx.canvas.width / 2 + 20, Math.min(ctx.canvas.width / 2 - 20, dx));
                nny = dy / dx * nnx;
            }

            if (Math.abs(dy / dx) > ctx.canvas.height / ctx.canvas.width) {
                nny = Math.max(-ctx.canvas.height / 2 + 20, Math.min(ctx.canvas.height / 2 - 20, dy));
                nnx = dx / dy * nny;
            }

            let triangle = [];
            triangle.push({ x: 15, y: 0 });
            triangle.push({ x: -8, y: 6 });
            triangle.push({ x: -8, y: -6 });
            triangle.push({ x: 15, y: 0 });

            ctx.beginPath();
            for (let i = 0; i < triangle.length; i++) {

                let point = triangle[i];

                let x = point.x;
                let y = point.y;

                let dist = Math.hypot(nnx, nny);

                let nx = x * (nnx / dist) - y * (nny / dist) + nnx + ctx.canvas.width / 2;
                let ny = y * (nnx / dist) + x * (nny / dist) + nny + ctx.canvas.height / 2;

                if (i === 0) {
                    ctx.moveTo(nx, ny);
                } else {
                    ctx.lineTo(nx, ny);
                }
            }

            if (isFocus) {
                ctx.fillStyle = "#00FFA3";
                if (isPlanning) { ctx.fillStyle = "#FF307C"; }
                ctx.fill();
            }

            if (isTarget) {
                ctx.fillStyle = "#FFEE00";
                ctx.fill();
            }

            if (isShip) {
                ctx.fillStyle = "#00FFA3";
                ctx.fill();
            }
        }
    }

    drawName(ctx, camera, isShip, isFollowShip, stationsMap, logMap) {

        if (isShip && isFollowShip) { return; }

        let zoom = 2 ** (camera.zoom / 4);

        let nr = Math.max(this.radius / zoom, 2);

        let np = this.calcXY(ctx, camera, this.x, this.y);
        let nx = np.x;
        let ny = np.y;

        if (this.parent !== null) {
            let dx = this.x - this.parent.x;
            let dy = this.y - this.parent.y;

            let dist = Math.hypot(dx, dy) / zoom;

            if (dist < 20) { return; }
        }

        let bodyName = this.name.charAt(0).toUpperCase() + this.name.slice(1);

        if (stationsMap[this.name] !== undefined) {
            bodyName += " : " + Math.round(stationsMap[this.name].fuel);
        }

        ctx.fillStyle = this.color;
        ctx.font = "13px Syne Mono";
        ctx.textBaseline = "middle";
        ctx.fillText(bodyName, nx + nr + 8, ny);
    }

    calcXY(ctx, camera, x, y) {

        let zoom = 2 ** (camera.zoom / 4);

        let nx = (x - camera.x) / zoom;
        let ny = (y - camera.y) / zoom;

        let nnx = nx * Math.cos(camera.r) - ny * Math.sin(camera.r) + ctx.canvas.width / 2;
        let nny = ny * Math.cos(camera.r) + nx * Math.sin(camera.r) + ctx.canvas.height / 2;

        return { x: nnx, y: nny };
    }
}