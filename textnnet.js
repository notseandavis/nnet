// Work in progress, not usable...
export default class TextNNet {
    constructor(inputs, outputChars) {
        // array of inputs
        this.inputs = inputs;
        this.nnetInputs = []
        for (let i = 0; i < inputs.length; i++) {
            for (let ii = 0; ii < inputs[i]; ii++) {
                this.nnetInputs.push([26]);
            }
        }
    }
}

function blankLetter() { return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; }
function text(length) { 
    let text = [];
    for (let i = 0; i < length; i++) {
        text.push(blankLetter());
    }
    return text;
}