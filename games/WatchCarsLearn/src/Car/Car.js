import Ray from "./Ray.js";
import { create, select, Vector, dist } from "../utils.js";
import Config from "../Config.js";

export default class Car {
    static getCar() {
        return this.cars++;
    }

    constructor(start) {
        this.p = new Vector(start.x, start.y, start.angle);
        this.id = Car.getCar();
        this.el = create("div");
        this.el.classList.add("car");
        this.start = start;

        select("#simulation").appendChild(this.el);

        this.velocity = 0;
        this.acceleration = 0;

        this.steer = 0;
        this.steerAngle = 0;

        this.angularVelocity = 0;
        this.isThrottling = false;
        this.isReversing = false;
        this.isBraking = false;
        this.isTurningLeft = false;
        this.isTurningRight = false;

        this.rays = this.createRays();

        this.alive = true;
        this.staleness = 0;
        this.checkpoints = new Set();
        this.scores = [];
    }

    reset() {
        this.p.update(this.start);

        this.velocity = 0;
        this.acceleration = 0;
        this.steer = 0;
        this.steerAngle = 0;
        this.staleness = 0;
        this.checkpoints.clear();

        this.angularVelocity = 0;
        this.isThrottling = false;
        this.isReversing = false;
        this.isBraking = false;
        this.isTurningLeft = false;
        this.isTurningRight = false;
        this.alive = true;
    }

    getScore() {
        return this.checkpoints.size;
    }

    createRays() {
        const offsets = [-Math.PI / 3, -Math.PI / 6, 0, Math.PI / 6, Math.PI / 3];
        return offsets.map(o => new Ray(this.p, o, Config.maxRayLength));
    }

    json() {
        return {
            id: this.id,
            velocity: 0,
            acceleration: 0,

            steer: 0,
            steerAngle: 0,
            score: this.checkpoints.size,
            angularVelocity: 0,
            isThrottling: false,
            isReversing: false,
            isBraking: false,
            isTurningLeft: false,
            isTurningRight: false,
            ray1: this.rays[0].length,
            ray2: this.rays[1].length,
            ray3: this.rays[2].length,
            alive: this.alive,
        };
    }

    display(color) {
        // const [r, g, b] = color ? color : this.brain ? this.brain.species.color : Config.randomColor;
        const [r, g, b] = color ? color : Config.randomColor;
        const translate = `translate(${this.p.x}px, ${this.p.y}px)`;
        const rotate = `rotate(${this.p.angle}rad)`;
        this.el.style.transform = translate + " " + rotate;
        this.el.style.background = `rgba(${r}, ${g}, ${b}, 1)`;
        this.el.style.border = `1px solid rgb(${r * 0.5}, ${g * 0.5}, ${b * 0.5})`;
        this.el.style.opacity = this.alive ? 1 : 0.4;
    }

    update(dt = 0.01) {
        const throttle = this.isThrottling * Config.engineForce;
        const reverse = this.isReversing * Config.reverseForce;
        const braking =
            (Math.abs(this.velocity) < 0.5 ? 0 : this.velocity > 0 ? 1 : -1) *
            this.isBraking *
            Config.brakingForce;

        const steerInput = 1 * this.isTurningRight - 1 * this.isTurningLeft;

        if (Math.abs(steerInput) > 0.001) {
            //  Move toward steering input
            this.steer = Math.min(Math.max(this.steer + steerInput * dt * 1.0, -1.0), 1.0); // -inp.right, inp.left);
        } else {
            //  No steer input - move toward centre (0)
            if (this.steer > 0) {
                this.steer = Math.max(this.steer - dt * 0.1, 0);
            } else if (this.steer < 0) {
                this.steer = Math.min(this.steer + dt * 0.1, 0);
            }
        }

        const avel = Math.min(Math.abs(this.velocity) / Config.scale, 240.0); // m/s
        this.steer = this.steer * (1.0 - avel / 280.0);

        this.steerAngle = this.steer * Config.maxSteer * Config.scale;

        const Ftraction = throttle - reverse - braking;

        const Fdrag = -Config.Cdrag * Math.abs(this.velocity) * this.velocity;

        const Flong = (Ftraction + Fdrag) * Config.scale;

        this.acceleration = Flong / Config.mass;
        this.velocity += this.acceleration * dt;
        if (Math.abs(this.velocity) < 0.5 && !this.isThrottling && !this.isReversing) {
            this.velocity = 0;
        }
        const dist = this.velocity * dt;
        this.p.update(this.p.unit().mult(dist).add(this.p));

        const R = Config.L / Math.sin(this.steerAngle);
        this.angularVelocity = this.velocity / R;
        this.p.angle += this.angularVelocity * dt;
        this.p.angle = this.p.angle % (Math.PI * 2);

        this.p.x +=
            Config.canvasWidth * (this.p.x < 0) -
            Config.canvasWidth * (this.p.x > Config.canvasWidth);

        this.p.y +=
            Config.canvasHeight * (this.p.y < 0) -
            Config.canvasHeight * (this.p.y > Config.canvasHeight);
    }

    updateRays(curves) {
        this.rays.forEach(ray => {
            ray.reset();
            for (const curve of curves) {
                const [t] = curve.intersects(ray.getLine());
                if (t) {
                    ray.updateLength(curve.get(t));
                    break;
                }
            }
        });
        if (this.brain) {
            const inputs = this.rays.map(r => 1 - r.length / r.maxlength);
            const [throttle, turn] = this.brain.activate(inputs);
            
            // const [throttle, turn] = this.nnet.fire([[inputs[0], [inputs[1], inputs[2]], [inputs[3], inputs[4]]]]);            

            this.isThrottling = throttle > 0.5;
            this.isBraking = throttle < 0.4;
            this.isTurningRight = turn > 0.66;
            this.isTurningLeft = turn < 0.33;

        }
    }

    isOnTrack(paths, curves) {
        const trackWidth = Config.trackWidth / 2 - Config.carLength / 3;
        const a = this.p.angle;
        const line = {
            p1: {
                x: this.p.x - Math.cos(a + Math.PI / 2) * trackWidth,
                y: this.p.y - Math.sin(a + Math.PI / 2) * trackWidth,
            },
            p2: {
                x: this.p.x + Math.cos(a + Math.PI / 2) * trackWidth,
                y: this.p.y + Math.sin(a + Math.PI / 2) * trackWidth,
            },
        };

        this.alive = false;
        let length = 50;
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            const [t] = path.intersects(line);
            if (t) {
                this.alive = true;
                length = Math.max(length, path.length() / 100);
                if (curves) {
                    this.updateRays(curves[i].concat(curves[(i + 1) % paths.length]));
                }

                const checkpoint = Math.floor((i + t) * 100);
                const max = Math.max(...this.checkpoints, 50);
                for (i = max + 1; i < checkpoint; i++) {
                    this.checkpoints.add(i);
                }
                this.checkpoints.add(checkpoint);
                if (this.checkpoints.size === paths.length * 100) {
                    this.alive = false;
                }
                // if (this.velocity === 0) {
                //     this.alive = false;
                // }
                break;
            }
        }

        if (this.brain) {
            const previousScore = this.brain.score;
            this.brain.score = this.checkpoints.size;

            if (this.brain.score > previousScore) {
                this.staleness = 1;
            } else {
                this.staleness++;
            }
        }

        if (this.staleness > length) {
            this.alive = false;
        }

        if (!this.alive) {
            this.display();
        }
    }
}

Car.cars = 0;
