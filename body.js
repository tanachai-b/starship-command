class Body {

    constructor(x, y, r, name, color = "#888888", vx = 0, vy = 0) {
        this.x = x;
        this.y = y;
        this.r = r;

        this.name = name;
        this.color = color;

        this.vx = vx;
        this.vy = vy;
        this.ax = 0;
        this.ay = 0;

        this.trailLine = [];
        this.parent;
    }

    setVelCirc(body) {

        let dx = this.x - body.x;
        let dy = this.y - body.y;
        let dist2 = dx ** 2 + dy ** 2;
        let dist = dist2 ** (1 / 2);

        let target_mass = body.r ** 3;

        this.vx += (target_mass / dist) ** 0.5 * dy / dist;
        this.vy += (target_mass / dist) ** 0.5 * -dx / dist;
    }

    calcGrav(bodies, precision, gravMap, badPrecision, logMap) {

        this.ax = 0;
        this.ay = 0;

        for (const body of bodies) {

            if (this === body) { continue; }

            let gravName = body.name + "<-" + this.name;
            // if (this.name != "ship" && gravMap[gravName] == null) { continue; }

            let dx = body.x - this.x;
            let dy = body.y - this.y;

            let dist2 = dx ** 2 + dy ** 2;
            let dist = dist2 ** (1 / 2);

            let target_mass = body.r ** 3;
            let this_mass = this.r ** 3;

            let grav = target_mass * this_mass / dist2;

            let ax = grav / this_mass * dx / dist / precision;
            let ay = grav / this_mass * dy / dist / precision;

            if (Math.hypot(ax, ay) / dist >= 0.1 && precision < 10000) {
                badPrecision.badPrecision = true;
                return;
            }

            this.ax += ax;
            this.ay += ay;

            logMap[gravName] = Math.hypot(ax * precision, ay * precision);
        }
    }

    move(precision) {

        this.vx += this.ax;
        this.vy += this.ay;

        this.x += this.vx / precision;
        this.y += this.vy / precision;
    }

    calcTrail(parent) {

        if (this.parent == null) {
            this.parent = parent;

        } else if (this.parent != parent) {
            this.parent = parent;
            this.trailLine = [];
        }

        if (parent == null) { return; }

        this.trailLine.push({ x: this.x - parent.x, y: this.y - parent.y });

        if (this.trailLine.length >= 3) {

            // reduce nodes (if a trail section is shorter than radius/100, remove middle node)
            let p1 = this.trailLine[this.trailLine.length - 1];
            let p2 = this.trailLine[this.trailLine.length - 3];

            let p1p2 = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
            let p1p0 = p1.x ** 2 + p1.y ** 2;

            if (p1p2 < p1p0 / 100 ** 2) { this.trailLine.splice(this.trailLine.length - 2, 1); }

            // cut trail end (if trail end's distance to trail head is less than 1% of diameter, remove trail end nodes)
            let pn = this.trailLine[this.trailLine.length - 1];
            let pm = this.trailLine[Math.trunc(this.trailLine.length / 2)];

            for (let i = 0; i < Math.trunc(this.trailLine.length / 2); i++) {

                let p0 = this.trailLine[i];
                let p0pn = (p0.x - pn.x) ** 2 + (p0.y - pn.y) ** 2;
                let pmpn = (pm.x - pn.x) ** 2 + (pm.y - pn.y) ** 2;

                if (p0pn < pmpn * 0.01) {
                    this.trailLine.splice(0, i + 1);
                    i = 0;
                }
            }
        }

    }

    calcTraj(bodies, precision, gravMap, parent, logMap) {

    }

    drawBody(ctx, camera) {

        let zoom = 2 ** (camera.z / 4);

        let nx = (this.x - camera.x) / zoom + ctx.canvas.width / 2;
        let ny = (this.y - camera.y) / zoom + ctx.canvas.height / 2;
        let nr = Math.max(this.r / zoom, 2);

        ctx.beginPath();
        ctx.arc(nx, ny, nr, 0, 2 * Math.PI);

        // ctx.strokeStyle = this.color;
        // ctx.stroke();

        ctx.fillStyle = this.color;
        ctx.fill();
    }

    drawTrail(ctx, camera) {

        let zoom = 2 ** (camera.z / 4);

        if (this.trailLine[0] != null) {
            ctx.beginPath();
            for (let i = 0; i < this.trailLine.length; i++) {

                let nx = (this.trailLine[i].x + this.parent.x - camera.x) / zoom + ctx.canvas.width / 2;
                let ny = (this.trailLine[i].y + this.parent.y - camera.y) / zoom + ctx.canvas.height / 2;

                if (i === 0) {
                    ctx.moveTo(nx, ny);
                } else {
                    ctx.lineTo(nx, ny);
                }
            }
            ctx.strokeStyle = this.color;
            ctx.stroke();
        }
    }
}