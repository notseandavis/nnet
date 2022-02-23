
import NNEt from "./nnet";

// Work in progress, not usable...
export default class TextNNet {
    constructor(textInputs, nonTextInputs, outputChars = 0, outputUpperCase, nonTextOutputs) {
        // array of inputs
        this.nonTextInputs = nonTextInputs;
        this.textInputs = textInputs;
        this.nnetInputs = [];
        this.outputChars = outputChars;
        this.outputUpperCase = outputUpperCase;
        this.letterToNnInput = function(letter) {
            return this.letterMap[letter.toLowerCase()];
        };
        this.getWeights = function() {
            return this.nnet.getWeights();
        };
        this.setWeights = function(weights) {
            this.nnet.setWeights(weights);
        }
        this.letterMap = {
            noletter: [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0]],
            a: [[1], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0]],
            b: [[0], [1], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0]],
            c: [[0], [0], [1], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0]],
            d: [[0], [0], [0], [1], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0]],
            e: [[0], [0], [0], [0], [1], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0]],
            f: [[0], [0], [0], [0], [0], [1], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0]],
            g: [[0], [0], [0], [0], [0], [0], [1], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0]],
            h: [[0], [0], [0], [0], [0], [0], [0], [1], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0]],
            i: [[0], [0], [0], [0], [0], [0], [0], [0], [1], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0]],
            j: [[0], [0], [0], [0], [0], [0], [0], [0], [0], [1], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0]],
            k: [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [1], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0]],
            l: [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [1], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0]],
            m: [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [1], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0]],
            n: [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [1], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0]],
            o: [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [1], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0]],
            p: [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [1], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0]],
            q: [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [1], [0], [0], [0], [0], [0], [0], [0], [0], [0]],
            r: [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [1], [0], [0], [0], [0], [0], [0], [0], [0]],
            s: [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [1], [0], [0], [0], [0], [0], [0], [0]],
            t: [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [1], [0], [0], [0], [0], [0], [0]],
            u: [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [1], [0], [0], [0], [0], [0]],
            v: [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [1], [0], [0], [0], [0]],
            w: [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [1], [0], [0], [0]],
            x: [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [1], [0], [0]],
            y: [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [1], [0]],
            z: [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [1]]
        }
        this.indexToLetter = function(index) {
            let map = { 
                0: "a",
                1: "b",
                2: "c",
                3: "d",
                4: "e",
                5: "f",
                6: "g",
                7: "h",
                8: "i",
                9: "j",
                10: "k",
                11: "l",
                12: "m",
                13: "n",
                14: "o",
                15: "p",
                16: "q",
                17: "r",
                18: "s",
                19: "t",
                20: "u",
                21: "v",
                22: "w",
                23: "x",
                24: "y",
                25: "z"
            };
            return this.outputUpperCase ? map[index].toUpperCase() : map[index]; 
        }
        this.letterToIndex = function(letter) {
            letter = letter.toLowerCase();
            return this.letterToIndexMap[letter];
        }
        this.letterToIndexMap = {
            a: 0,
            b: 1,
            c: 2,
            d: 3,
            e: 4,
            f: 5,
            g: 6,
            h: 7,
            i: 8,
            j: 9,
            k: 10,
            l: 11,
            m: 12,
            n: 13,
            o: 14,
            p: 15,
            q: 16,
            r: 17,
            s: 18,
            t: 19,
            u: 20,
            v: 21,
            w: 22,
            x: 23,
            y: 24,
            z: 25
        }
        for (let i = 0; i < textInputs.length; i++) {
            for (let ii = 0; ii < textInputs[i]; ii++) {

                for (let iii = 0; iii < 26; iii++) {
                    this.nnetInputs.push([1]);
                }
                // this.nnetInputs.push([26]);
            }
        }
        for (let i = 0; i < nonTextInputs.length; i++) {
            this.nnetInputs.push(nonTextInputs[i]);
        }
        let totalOutputs = 0;
        if (outputChars && outputChars > 0) {
            totalOutputs = totalOutputs + outputChars * 26;
        }
        if (nonTextOutputs && nonTextOutputs > 0) {
            totalOutputs = totalOutputs + nonTextOutputs;
        }
        this.nnet = new NNEt(this.nnetInputs, this.nnetInputs.length, 1, totalOutputs, 0.51, false);
        
        // nti = non text inputs
        this.fire = function(ti, nti) {
            let input = [];
            for (let i = 0; i < ti.length; i++) {
                for (let ii = 0; ii < ti[i].length; ii++) 
                {
                    input.push(...this.letterToNnInput(ti[i][ii]));
                }
            }
            input = input.concat(nti);
            let rawResult = this.nnet.fire(input);
            let textResult = "";
            let currentOutputChar = 0;
            let i = 0;
            let highestProbability = 0;
            let currentBestGuessOfLetter = null;
            let nonTextOutput = [];
            rawResult.forEach(result => {
                if (currentOutputChar < this.outputChars) {
                    if (result > highestProbability) {
                        highestProbability = result;
                        currentBestGuessOfLetter = this.indexToLetter(i);
                    }
                    if (i == 25) {
                        i = 0;
                        textResult = textResult + currentBestGuessOfLetter;
                        highestProbability = 0;
                        currentOutputChar++;
                    } else {
                        i++;
                    }
                } else {
                    nonTextOutput.push(result);
                }
            });
            return {
                text: this.outputUpperCase ? textResult.toUpperCase() : textResult,
                nonTextOutputs: nonTextOutput
            };
        }

        this.train = function(ti = null, nti = null, expectedTextOutput = "", expectedNonTextOutput = []) {
            let input = null;
            if (ti != null && nti != null) {
                input = [];
                for (let i = 0; i < ti.length; i++) {
                    for (let ii = 0; ii < ti[i].length; ii++) 
                    {
                        input.push(...this.letterToNnInput(ti[i][ii]));
                    }
                }
                input = input.concat(nti);
            }

            expectedTextOutput = expectedTextOutput ? expectedTextOutput.toLowerCase() : "";
            let parsedExpectedTextOutput = [];
            for (let i = 0; i < expectedTextOutput.length; i++) {
                parsedExpectedTextOutput.push(...this.letterMap[expectedTextOutput[i]]);
            }
            let expectedOutput = [...parsedExpectedTextOutput, ...expectedNonTextOutput]
            this.nnet.train(input, expectedOutput);
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