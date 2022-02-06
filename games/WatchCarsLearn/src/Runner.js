import Car from "./Car";
import Config from "./Config";
import User from "./User";

export default class Runner {
    constructor(population, start, onGenEnd) {
        this.population = population;
        this.cars = [];
        this.finished = [];
        this.champ = new Car(start);

        User.car = new Car(start);

        for (let i = 0; i < this.population.size; i++) {
            const car = new Car(start);
            this.finished.push(car);
        }
        this.onGenEnd = onGenEnd;
        this.startGeneration();
        
    }

    reset() {
        this.finished.forEach(car => car.reset());
        this.cars.forEach(car => car.reset());
    }

    getFps() {
        return User.isPlaying ? 60 : Math.max(30, Config.step - this.cars.length * 2);
    }

    getStep() {
        return 1 / this.getFps();
    }

    carFinished(i) {
        const [car] = this.cars.splice(i, 1);
        this.finished.push(car);
    }

    checkEnd() {
        if (this.finished.length === this.population.size) {
            this.endGeneration();
        }
    }

    startGeneration() {
        this.cars = this.finished;
        this.finished = [];
        for (let i = 0; i < this.cars.length; i++) {
            const car = this.cars[i];
            const genome = this.population.genomes[i];
            car.brain = genome;
            car.brain.score = 0;

            car.reset();
        }
        this.champ.brain = this.population.champ;
        console.log("high score: "+  this.champ.brain.score);
        this.population.champ.car = this.champ;
        this.champ.brain.score = 0;
        this.champ.reset();
    }

    endGeneration() {
        console.log("ending generation")
        this.population.epoch();
        this.onGenEnd(this.population);
        this.startGeneration();
    }
}
