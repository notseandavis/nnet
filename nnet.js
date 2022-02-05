// FYI, this is a mess, with too much one-off stuff just to make it work
export default class NNEt {
//     numberOfLayers;
//     numberOfNodes;
//     layers;
//     inputs;
//     outputs;
//     lastInputs;
    constructor(inputs, numberOfNodes, numberOfLayers, outputs = 1, learningRate = 0.3, randomInitialWeights = false) {
        // array of inputs
        // TODO: inputs in particular needs to be cleaner
        this.inputs = inputs;

        this.outputs = outputs;
        
        // number of nodes in hidden layers
        this.numberOfNodes = numberOfNodes;

        // number of layers
        this.numberOfLayers = numberOfLayers;

        this.learningRate = learningRate;
        
        this.randomInitialWeights = randomInitialWeights;
        
        // the actual layers
        this.layers = [];

        this.layers.push([]);
        
        let i = 0;

        // input layer
        let inputId = 0;
        while (this.layers[i].length < inputs.length) {
            this.layers[i].push(new Node(inputs[inputId][0]));
            inputId++;
        }
        i++;
        
        // TODO: make layers and nodes recursive, this is flat and ugly
        while (this.layers.length < numberOfLayers) {
            this.layers.push([]);
            if (i === 1) {
                while (this.layers[i].length < this.numberOfNodes) {
                    // layer on top of input layer, gets the number of input
                    this.layers[i].push(new Node(inputs.length, this.randomInitialWeights)); 
                }
            } else {
                // middle layer
                while (this.layers[i].length < this.numberOfNodes) {
                    // layer on top of input layer, gets the number of nodes
                    this.layers[i].push(new Node(this.numberOfNodes, this.randomInitialWeights)); 
                }
            }
            i++;
        }

        // output layer
        this.layers.push([]);
        while (this.layers[i].length < this.outputs) {
            if (this.layers.length > 2) {
                // there is a middle layer
                this.layers[i].push(new Node(this.numberOfNodes, this.randomInitialWeights));
            } else {
                // there is not a middle layer
                this.layers[i].push(new Node(inputs.length, this.randomInitialWeights)); 
            }
        }
        // this.layers[i].push(new Node(this.numberOfLayers == 1 ? this.inputs.length : this.numberOfNodes)); 
    }
    

    getWeights() {
        return this.layers.map(layer => {
            return layer.map(node => {
                return { weights: node.weights, bias: node.bias };
            });
        });
    }

    setWeights(weights) {
        this.layers.forEach((layer, i) => {
            layer.forEach((node, ii) => {
                node.weights = weights[i][ii].weights;
                node.bias = weights[i][ii].bias;
            });
        });
    }
    // todo make this recursive
    train(inputs, expectedOutput) {
        // console.log("training nnet")
        if (!inputs) {
            inputs = this.lastInputs;
        }
        let allOutputs = this.activateAllLayers(inputs);
        // start with the delta of the output node
        let previousLayersDeltas = Array.apply(null, Array(this.layers.length)).map(function () { return []; });
        // get the delta from the bottom layer, 
        // and walk backwards through the layers
        let i = (this.layers.length - 1);
        while( i >= 0) {
            for (let ii = (this.layers[i].length - 1); ii >= 0; ii--) {
                // this layer's input is the previous layer's output, or the original input
                let thisLayersInput = i === 0 ? inputs[ii] : allOutputs[i - 1];
                let thisLayersDelta;
                if (i === this.layers.length - 1) {
                    // this is the output layer
                    let outputDelta = (expectedOutput[ii] - allOutputs[i][[ii]])
                    thisLayersDelta = outputDelta;
                    // console.log("training output layer")
                } else if (i === this.layers.length - 2) {
                    // this is the layer on top of the output layer
                    thisLayersDelta = 0;
                    previousLayersDeltas[i + 1].forEach(delta => { thisLayersDelta += delta; });
                    // console.log("training layer on top of output layer")
                } else {
                    // this is some middle or output layer, add up the previous layers together as they all connect together
                    thisLayersDelta = 0;
                    previousLayersDeltas[i + 1].forEach(delta => { thisLayersDelta += delta; });
                    // console.log("training middle or top layer");
                }
                let nextLayersDelta = this.layers[i][ii].train(thisLayersInput, thisLayersDelta, this.learningRate);
                previousLayersDeltas[i].push(nextLayersDelta)
            }
            i--;
        }
    }

    activateAllLayers(inputs) {
        let layerInputs;
        let layerOutputs = [];
        this.layers.forEach((layer, i) => {
            layerOutputs.push([]);
            layer.forEach((node, ii) => {
                if (i === 0) {
                    // send the set of inputs for the input layer
                    layerOutputs[i].push(node.fire(inputs[ii]));
                } else {
                    layerOutputs[i].push(node.fire(layerInputs));
                }
            });
            // inputs for the next layer are outputs from this layer
            layerInputs = layerOutputs[i];
        });
        // final layer has only one output
        return layerOutputs;
    }
    fire(inputs) {
        this.lastInputs = inputs;
        let allOutputs = this.activateAllLayers(inputs);
        // return the final output layer
        return allOutputs[this.layers.length - 1]
    }
}

class Node {
    constructor(inputs, randomInitialWeights) {
        // number of inputs
        this.inputs = inputs;
        this.weights = Array.apply(null, Array(inputs)).map(function () { return startingWeight(randomInitialWeights); });
        let bias = 0;
        this.weights.forEach(weight => {
            if (weight > 0) {
                bias = bias - weight;
            } else {
                bias = bias + weight;
            }
        });
        this.bias = bias;
    }
    // inputs = [];

    train(inputs, correction, learningRate) {
        let actualOutput = activation(inputs, this.weights, this.bias)

        let delta = (correction * sigmoidDerivative(actualOutput, learningRate));
        
        for (let i = 0; i < inputs.length; i++) {
            this.weights[i] += inputs[i] * delta;
        }
        this.bias += delta;
        // console.log(JSON.stringify(this));
        return delta;
    }
    fire(inputs) {
        if (inputs.length > this.weights.length) {
            throw new Error("too many inputs");
        }
        let sum = activation(inputs, this.weights, this.bias)
        return sigmoid(sum)
    }
}

function startingWeight(random) {
    return random ? Math.random() : 0;
}
function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
} 
function sigmoidDerivative(x, learningRate) {
    const fx = sigmoid(x);
    return fx * (0.5 + learningRate - fx);
}

function activation(inputs, weights, bias) {
    let sum = 0;
    for (let i = 0; i < inputs.length; i++) {
        sum += weights[i] * inputs[i]
    }
    return sum += bias;
}