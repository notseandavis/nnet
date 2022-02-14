import NNEt from "./nnet";
// FYI, this is a mess, with too much one-off stuff just to make it work
export default class Population {
    constructor(populationSize, evolutionRate = 0.3, inputShape = [[1],[2],[2]], numberOfOutputs = 2) {
        this.genomes = [];
        this.species = [];
        this.size = populationSize;
        this.generation = 0;
        this.evolutionRate = evolutionRate;
        this.inputShape = inputShape;
        this.numberOfOutputs = numberOfOutputs;
        let speciesSize = 5;
        let speciesId = 0;
        let si = 0;
        this.species[speciesId] = new Species(0);
        while (this.genomes.length < populationSize) {
            this.genomes.push(this.createGenome());

            this.species[speciesId].members.push(this.genomes.length - 1);
            this.genomes[this.genomes.length - 1].species = speciesId;

            if (si >= speciesSize) {
                si = 0;
                speciesId++;
                this.species.push(new Species(speciesId));
            } else {
                si++;
            }
        }
        this.champ = this.createGenome();
    }
    createGenome() {
        return new Genome(this.inputShape, this.numberOfOutputs, this.evolutionRate);
    }
    epoch() {
        let bestScore = 0;
        let bestGenome = 0;
        let worstScore = 99999999;
        let worstGenome = 0;
        let worstSpecies = 0;
        let worstSpeciesScore = 99999999;
        for (var s = 0; s < this.species.length; s++) {
            let bestInSpecies = 0;
            let bestGenomeInSpecies;
            let worstScoreInSpecies = 0;
            let worstGenomeInSpecies;
            for (var m = 0; m < this.species[s].members.length; m++) {
                let i = this.species[s].members[m];
                if (this.genomes[i].score > bestInSpecies) {
                    bestInSpecies = this.genomes[i].score;
                    this.species[s].bestFitness = bestInSpecies;
                    bestGenomeInSpecies = i;
                    if (bestInSpecies < worstSpeciesScore) {
                        worstSpecies = s;
                    }
                }
                if (this.genomes[i].score < worstScoreInSpecies) {
                    worstScoreInSpecies = this.genomes[i].score;
                    worstGenomeInSpecies = i;
                }

                if (this.genomes[i].score > bestScore) {
                    bestScore = this.genomes[i].score;
                    bestGenome = i;
                } else if (this.genomes[i].score < worstScore) {
                    worstScore = this.genomes[i].score;
                    worstGenome = i;
                }
            }

            // Set best champ
            this.champ.setWeights(this.genomes[bestGenome].getWeights())
            this.champ.score = bestScore;
            this.champ.sourceGenomeId = bestGenome;

            for (var m = 0; m < this.species[s].members.length; m++) {
                if (this.species[s].members[m] === worstGenomeInSpecies) {

                    if (Math.random() > 0.9) {
                        this.genomes[this.species[s].members[m]] = this.createGenome();
                    } else {
                        // if it is worst in species, replace it with a copy of the best and evolve it
                        if (Math.random() > 0.5) {  
                            this.genomes[worstGenomeInSpecies].setWeights(this.genomes[bestGenomeInSpecies].getWeights());
                        } else {
                            this.genomes[worstGenomeInSpecies].setWeights(this.genomes[bestGenome].getWeights());
                        }
                        // Object.assign(this.genomes[worstGenomeInSpecies], this.genomes[bestGenomeInSpecies])
                        // this.genomes[worstGenomeInSpecies].nnet = Object.assign(Object.create(Object.getPrototypeOf(this.genomes[bestGenomeInSpecies].nnet)), this.genomes[bestGenomeInSpecies].nnet)
                    
                        this.genomes[this.species[s].members[m]].evolve();
                    }
                } else if (this.species[s].members[m] !== bestGenomeInSpecies) {
                    if (Math.random() > 0.4) {
                        this.genomes[this.species[s].members[m]].injectDNA(this.genomes[bestGenomeInSpecies]);
                    }
                    if (Math.random() > 0.4) {
                        this.genomes[this.species[s].members[m]].injectDNA(this.genomes[bestGenome]);
                    }
                    if (Math.random() > 0.2) {
                        let randomPartner = randomInteger(0, this.genomes.length - 1);
                        this.genomes[this.species[s].members[m]].injectDNA(this.genomes[randomPartner]);
                    }

                    this.genomes[this.species[s].members[m]].evolve();
                    let evolutions = randomInteger(1, 3);
                    for (let i = 0; i < evolutions; i++) {
                        this.genomes[this.species[s].members[m]].evolve();
                    }
                }
            }
        }
        // this.genomes[worstGenome].setWeights(this.champ.getWeights())
        // this.genomes[worstGenome].evolve();
        // this.genomes[worstGenome].evolve();

        this.generation++;
    }
}
let Genome = function(inputShape, numberOfOutputs, evolutionRate) {
    this.nnet = new NNEt(inputShape, 3, 1, numberOfOutputs, evolutionRate, true);
    this.car;
    this.species;
    this.inputs = [];

    this.getWeights = function() {
        return this.nnet.getWeights();
    }
    this.setWeights = function(weights) {
        return this.nnet.setWeights(weights);
    }

    this.activate = function(inputs) {
        inputs.push[inputs];
        return this.nnet.fire([[inputs[2]], [inputs[0], inputs[1]], [inputs[3], inputs[4]]])
    }
    this.evolve = function() {

        let evolutions = randomInteger(0, 20);
        for (let i = 0; i < evolutions; i++) {
            let b = Math.random();
            let a = Math.random();
            this.nnet.train(this.inputs[randomInteger(0, this.inputs.length - 1)], [[a],[b]])
        }
        this.inputs = [];
    }

    // this.evolve1 = function() {
    //       let a = randomInteger(0, 3);
    //       let b = randomInteger(0, 3);

    //       a = a === 0 ? .5 : (a === 1 ? 1 : 0);
    //       b = b === 0 ? .5 : (b === 1 ? 1 : 0);

    //       let evolutions = randomInteger(0, 60);
    //       for (let i = 0; i < evolutions; i++) {
    //           this.nnet.train([[Math.random()][Math.random(),Math.random()],[Math.random(),Math.random()]], [[a],[b]])
    //     }
    // }

    this.injectDNA = function(genomeToInject) {
        let thisGenomeWeights = this.getWeights();
        let weightsToAdd = genomeToInject.getWeights()
        let newWeights = thisGenomeWeights.map((layer, i) => {
             return layer.map((node, ii) => {
                let combinedBias = node.bias
                if (randomInteger(0, 3) == 3) {
                    combinedBias = (node.bias + weightsToAdd[i][ii].bias)

                    if (combinedBias !== 0) {
                        combinedBias = combinedBias;
                    }
                }
                return {
                    weights: node.weights.map((weight, iii) => {
                        let combinedWeights = weight;
                        if (randomInteger(0, 3) == 3) {
                            combinedWeights = (weight + weightsToAdd[i][ii].weights[iii]);
                            if (combinedWeights !== 0) {
                                combinedWeights = combinedWeights;
                            }
                        }
                        return combinedWeights
                    }),
                    bias: combinedBias
                };
            });
        });
        this.setWeights(newWeights);
    }
}
let Species = function(id) {
    this.id = id;
    this.color = rbg();
    this.members = [];
    this.bestFitness = 0;

}

function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function r() {
    return Math.random();
}

function rbg() {
    var o = Math.round, r = Math.random, s = 255;

    return [o(r()*s), o(r()*s), o(r()*s)];
    //     r: o(r()*s),
    //     b: o(r()*s),
    //     g: o(r()*s)
    // };
    // return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ',' + r().toFixed(1) + ')';
}
