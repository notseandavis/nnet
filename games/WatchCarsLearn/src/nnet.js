// FYI, this is a mess, with too much one-off stuff just to make it work
export default class NNEt {
    constructor(inputs, numberOfNodes, numberOfLayers, outputs = 1, learningRate = 0.3, randomInitialWeights = false) {
        // array of inputs
        this.inputs = inputs;
        // e.x. [[1], [2], [1]]
        // the number inside the innner arrays represents the number of inputs for each input node

        // Number of outputs, each output has only one output value (which will always be a number between 0.0 and 1.0)
        this.outputs = outputs;
        
        // number of nodes in hidden layer(s)
        this.numberOfNodes = numberOfNodes;

        // number of hidden layers
        this.numberOfLayers = numberOfLayers;

        // Learning rate
        this.learningRate = learningRate;
        
        // Randomize initial weights
        this.randomInitialWeights = randomInitialWeights;
        
        // Here is our array of layers
        this.layers = [];

        // Layer Index
        let i = 0;
        
        // Input layer
        this.layers.push([]);
        let inputId = 0;
        while (this.layers[i].length < inputs.length) {
            this.layers[i].push(new Node(inputs[inputId][0]));
            inputId++;
        }
        i++;
        
        // Middle layer(s)
        while (this.layers.length < numberOfLayers) {
            this.layers.push([]);
            if (i === 1) {
                // Layer below the input layer, gets the number of input
                while (this.layers[i].length < this.numberOfNodes) {
                    this.layers[i].push(new Node(inputs.length, this.randomInitialWeights)); 
                }
            } else {
                // Any middle layer
                while (this.layers[i].length < this.numberOfNodes) {
                    this.layers[i].push(new Node(this.numberOfNodes, this.randomInitialWeights)); 
                }
            }
            i++;
        }

        // Output layer
        this.layers.push([]);
        while (this.layers[i].length < this.outputs) {
            if (this.layers.length > 2) {
                // There are middle layers, take the number of nodes as the number of inputs
                this.layers[i].push(new Node(this.numberOfNodes, this.randomInitialWeights));
            } else {
                // No middle layers, take the input nodes directly
                this.layers[i].push(new Node(inputs.length, this.randomInitialWeights)); 
            }
        }
    }
    
    // Get all the weights of the network
    getWeights() {
        return this.layers.map(layer => {
            return layer.map(node => {
                return { weights: node.weights, bias: node.bias };
            });
        });
    }

    // Set all the weights in the network
    setWeights(weights) {
        this.layers.forEach((layer, i) => {
            layer.forEach((node, ii) => {
                node.weights = weights[i][ii].weights;
                node.bias = weights[i][ii].bias;
            });
        });
    }

    // TODO: Clean this up
    // Train the network using inputs (or last inputs if not previously provided) and expected outputs
    train(inputs, expectedOutputs) {
        // console.log("training nnet")
        if (!inputs) {
            inputs = this.lastInputs;
        }
        let allOutputs = this.activateAllLayers(inputs);

        // Creating an array in the shape of our network so we can store the deltas
        let previousLayersDeltas = Array.apply(null, Array(this.layers.length)).map(function () { return []; });
        
        // get the delta from the bottom layer, 
        // and walk backwards through the layers
        for (let i = this.layers.length - 1; i >= 0; i--) {
            for (let ii = (this.layers[i].length - 1); ii >= 0; ii--) {
                // this layer's input is either the previous layer's output, or the original input
                let thisLayersInput = i === 0 ? inputs[ii] : allOutputs[i - 1];
                
                // Delta for this node
                let nodeDelta;
                if (i === this.layers.length - 1) {
                    // this is the output layer, so we use the expected output for this node
                    let outputDelta = (expectedOutputs[ii] - allOutputs[i][[ii]])
                    nodeDelta = outputDelta;
                } else {
                    // this is some middle or output layer, add up the previous layers together as they all connect together
                    nodeDelta = 0;
                    previousLayersDeltas[i + 1].forEach(delta => { nodeDelta += delta; });
                }
                let nextLayersDelta = this.layers[i][ii].train(thisLayersInput, nodeDelta, this.learningRate);
                previousLayersDeltas[i].push(nextLayersDelta)
            }
        }
    }

    activateAllLayers(inputs) {
        let layerInputs;
        let layerOutputs = [];
        this.layers.forEach((layer, i) => {
            layerOutputs.push([]);
            layer.forEach((node, ii) => {
                if (i === 0) {
                    // Send the set of inputs for the input layer
                    layerOutputs[i].push(node.fire(inputs[ii]));
                } else {
                    // Otherwise, send the output from the previous layer
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
        
        // Try to initialize a neutral bias
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