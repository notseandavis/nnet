import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {StyleSheet, Text, View, Clipboard, Platform, TextInputComponent} from 'react-native';
import Button from './components/Button';
import Keyboard, {SpecialKeyboardKeys} from './components/Keyboard';
import TextBlock, {TextBlockState} from './components/TextBlock';
import {MAX_GUESSES, MAX_WORD_LEN} from './constants/gameConstants';
import {getInitialBoard, getRandomWord, getWordleEmoji} from './gameUtils';
import TextNNet from '../../../neuralnet/textnnet';
import fiveLetterWords from './constants/fiveLetterWords.json';

const BOARD_TEMPLATE = getInitialBoard();
const textnnet = new TextNNet(
  [[5]], 
  [[1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1]], 
  0,
  true,
  fiveLetterWords.length);

const GameScreen = () => {
  const [guessList, setGuessList] = useState<string[]>([]);
  const [inputWord, setInputWord] = useState<string>('');
  const [firstGuess, setFirstGuess] = useState<string>('');
  const [nnStatus, setNnStatus] = useState<string>('');
  const [certainty, setCertainty] = useState<number>(0);
  const [randomGuesses, setRandomGuesses] = useState<number>(0);
  const [nnGuess, setNnGuess] = useState<string>('');
  const [randomGuess, setRandomGuess] = useState<string>('');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [nNetGuessing, setNNetGuessing] = useState<boolean>(false);
  const [running, setRunning] = useState<boolean>(false);
  const [expectedResult, setExpectedResult] = useState<number[]>([]);
  const [trainingMode, setTrainingMode] = useState<boolean>(true);
  const [gamesPlayed, setGamesPlayed] = useState<number>(0);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [turnsPlayed, setTurnsPlayed] = useState<number>(0);
  const [turnsPlayedByAi, setTurnsPlayedByAi] = useState<number>(0);
  const [originalWeights, setOriginalWeights] = useState<object>({});
  const [trainingList, setTrainingList] = useState<(number[][] | string[][])[]>([]);

  
  const [gamesWon, setGamesWon] = useState<number>(0);
  const [disabledLetters, setDisabledLetters] = useState<string[]>([]);
  
  const wordToGuess = useRef<string>('xxxxx');

  useEffect(() => {
    if (gameOver === false) {
      const newWord = getRandomWord();
      wordToGuess.current = newWord.word;
      setCurrentWordIndex(newWord.index);
      setExpectedResult(getExpectedOutput(fiveLetterWords.length, newWord.index));
      setInputWord('');
      setGuessList([]);
      setGamesPlayed(gamesPlayed + 1);
    }
    if (running) {
      setGameOver(false)
    }
  }, [gameOver]);


  useEffect(() => {
    const guessLen = guessList.length;
    if (guessList[guessLen - 1] === wordToGuess.current) {
      if (trainingMode) {
        // trainingList.forEach((trainingData => {
        //   textnnet.train(trainingData[0], trainingData[1], null, expectedResult);
        // }))
        textnnet.train(null, null, null, expectedResult);

      }
      if (nnGuess === wordToGuess.current) {
        setGamesWon(gamesWon + 1);
      }

      setTrainingList([]);
      setGameOver(true);
      
    } else if (guessLen === MAX_GUESSES) {
      if (trainingMode) {
        textnnet.train(null, null, null, expectedResult);
      }
      setTrainingList([]);
      setGameOver(true);
    } else {
      const list: string[] = [];
  
      guessList.forEach(word => {
        word.split('').forEach(letter => {
          // console.log({letter});
          if (!wordToGuess.current.includes(letter)) {
            list.push(letter);
          }
        });
      });
  
      setDisabledLetters(list);
    }
    
    const list: string[] = [];

  }, [guessList])


  useEffect(() => {
    // fire the next turn when disabled letters are reset
    setTurnsPlayed(turnsPlayed + 1);
  }, [disabledLetters])

  useEffect(() => {
    window.postMessage('start nnet');
  }, [turnsPlayed]);

  const onKeyPress = useCallback(
    (key: string) => {

      if (key === SpecialKeyboardKeys.DELETE) {
        setInputWord(prev => prev.slice(0, -1));
      } else if (key === SpecialKeyboardKeys.GUESS) {
        setGuessList(prev => [...prev, inputWord.toUpperCase()]);
        setInputWord('');
      } else if (key.length === 1) {
        setInputWord(prev => {
          if (prev.length < MAX_WORD_LEN && !disabledLetters.includes(key)) {
            return prev + key;
          }
          return prev;
        });
      }
    },
    [disabledLetters, inputWord],
  );

  const runNNet = (cw: string, gl: string[], dl: string[], flw: string[]) => {
    if (!running) {
      return;
    }
    // if (!turnDoneUpdating) {
    //   console.log("waiting for update to complete")
    //   setTimeout(runNNet, 10, [cw, gl, dl]);
    // }
    let correctWord = cw.split("");
    console.log("running...")
    let disabledLettersInput = new Array<number[]>();
    for (let i = 0; i < 26; i++) {
      disabledLettersInput.push([0]);
    }

    for (let i = 0; i < dl.length; i++) {
      let disabledLetter = dl[i];
      let disabledLetterIndex = textnnet.letterToIndex(disabledLetter);
      disabledLettersInput[disabledLetterIndex] = [1];
    }

    let presentLettersInput = new Array<number[]>();
    let correctLettersInput = new Array<string>();

    for (let i = 0; i < 26; i++) {
      presentLettersInput.push([0]);
    }
    for (let i = 0; i < 5; i++) {
      correctLettersInput.push("noletter");
    }
    let presentLetters:string[][] = [];
    gl.forEach((guess: string) => {
      for (let ii = 0; ii < guess.length; ii++) {
        const thisLetterindex = textnnet.letterToIndex(guess[ii]);

        if (correctWord.includes(guess[ii])) {
          presentLettersInput[thisLetterindex] = [1];
          presentLetters.push([guess[ii]]);
          if (guess[ii] === correctWord[ii]) {
            correctLettersInput[ii] = guess[ii];
          }
        }
      }
    });
    let input =  [[correctLettersInput], [...disabledLettersInput, ...presentLettersInput]];

    setTrainingList(prev => [...prev, input]);
    
    let timesTrained = 0;
    setNnStatus("Playing...");

    setRandomGuess("");
    let rawOutput = textnnet.fire(input[0], input[1]).nonTextOutputs;
    let rawGuess = getHighestNumberIndex(rawOutput);
    let guess: string[] = [];
    setCertainty(rawGuess.certainty);

    let neuralNetworkBestGuess = flw[rawGuess.index].toUpperCase();
    let turnPlayedByAi = true;

    let uncertain = "";
    if (rawGuess.certainty < 0.1) {
      uncertain = " (Uncertain)";      
      // let randomIndex = randomInteger(0, flw.length - 1);
      // guess = flw[randomIndex].toUpperCase().split("");
      // setRandomGuess(guess.join(""));
      // turnPlayedByAi = false;

      
    } 
    // else {
      guess = neuralNetworkBestGuess.split("");
      setNnGuess(guess.join(""));
      setRandomGuess("")
    // }
    let invalid = "";
    if (
      dl.includes(neuralNetworkBestGuess[0]) || 
      dl.includes(neuralNetworkBestGuess[1]) || 
      dl.includes(neuralNetworkBestGuess[2]) || 
      dl.includes(neuralNetworkBestGuess[3]) || 
      dl.includes(neuralNetworkBestGuess[4])
    ) {
      invalid = " (Invalid)";
      turnPlayedByAi = false;
    }
    if (turnPlayedByAi) {
      setTurnsPlayedByAi(turnsPlayedByAi + 1);
    }
    setNnGuess(neuralNetworkBestGuess + uncertain + invalid) // + (uncertain ==? " (Uncertain) " | "") + (invalid ? " (Invalid)" | ""))
    let trainingLoop = (wordlList: string[]) => {
      if (
        dl.includes(guess[0]) || 
        dl.includes(guess[1]) || 
        dl.includes(guess[2]) || 
        dl.includes(guess[3]) || 
        dl.includes(guess[4])
      ) {
        // If its the first loop we know the NN guessed an invalid option


        setTimeout(() => {
          timesTrained++;
          setRandomGuesses(timesTrained);
          let randomWordIndex = randomInteger(0, wordlList.length - 1);
          guess = wordlList[randomWordIndex].toUpperCase().split("");
          wordlList.splice(randomWordIndex, 1);
          setRandomGuess(guess.join(""));
          trainingLoop(wordlList);
        }, 1, [wordlList]);
      } else {
        setNnStatus("Playing...");
        setGuessList(prev => [...prev, guess.join("")]);
      }
    }
    trainingLoop([...flw]);
  };

  const callback = (event: MessageEvent) => {
    if (event.data == 'start nnet') {
      runNNet(wordToGuess.current, guessList, disabledLetters, fiveLetterWords);
    }
  };

  window.onmessage = callback;
  
  const wordleEmoji: string = useMemo(() => {
    if (!gameOver) {
      return '';
    }

    return getWordleEmoji(wordToGuess.current, guessList);
  }, [gameOver, guessList]);

  return (
    <View style={styles.fg1}>

      <View style={styles.bottomContainer}>
      {!running ? 
        (<Button cta="Start NNet" onPress={() => { 
          setRunning(true); 
          setGameOver(true);
        } } />)
        :
        ( <Button cta="Stop NNet" onPress={() => { setRunning(false); } } />)
      }
      {!trainingMode ? 
        (<Button cta="Start Training" onPress={() => { setTrainingMode(true);} } />)
        :
        ( <Button cta="Stop Training" onPress={() => { setTrainingMode(false); } } />)
      }
      <Text style={styles.gamesplayed} selectable>
        {"Status: " + nnStatus}
      </Text>
      <Text style={styles.gamesplayed} selectable>
        {"AI Guess: " + nnGuess}
      </Text>
      <Text style={styles.gamesplayed} selectable>
        {"AI Best Certainty: " + certainty.toFixed(5)}
      </Text>
      <Text style={styles.gamesplayed} selectable>
        {"Random Guess: " + randomGuess}
      </Text>
      <Text style={styles.gamesplayed} selectable>
        {"Random Guesses (this round): " + randomGuesses}
      </Text>
      <Text style={styles.gamesplayed} selectable>
        {"Answer: " + wordToGuess.current}
      </Text>
      <Text style={styles.gamesplayed} selectable>
        {"Turns Played: " + turnsPlayed}
      </Text>
      <Text style={styles.gamesplayed} selectable>
        {"Valid plays by AI: " + turnsPlayedByAi}
      </Text>
      <Text style={styles.gamesplayed} selectable>
        {"Games Played: " + gamesPlayed}
      </Text>
      <Text style={styles.gamesplayed} selectable>
        {"Games Won: " + gamesWon}
      </Text>
      <Text style={styles.gamesplayed} selectable>
        {"Win Ratio: " + (Math.floor((gamesWon / gamesPlayed )* 100) / 100 ).toFixed(4)}
      </Text>
      </View>
      {BOARD_TEMPLATE.map((row, rowIndex) => {
        return (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((_, colIndex) => {
              const guessLetter = guessList[rowIndex]?.[colIndex];
              let state: TextBlockState = TextBlockState.GUESS;

              if (guessLetter === undefined) {
                state = TextBlockState.GUESS;
              } else if (guessLetter === wordToGuess.current[colIndex]) {
                state = TextBlockState.CORRECT;
              } else if (wordToGuess.current.includes(guessLetter)) {
                state = TextBlockState.POSSIBLE;
              } else {
                state = TextBlockState.INCORRECT;
              }

              const letterToShow =
                rowIndex === guessList.length
                  ? inputWord[colIndex]
                  : guessLetter;

              return (
                <View style={styles.mh2} key={`col-${colIndex}`}>
                  <TextBlock text={letterToShow || ''} state={state} />
                </View>
              );
            })}
          </View>
        );
      })}

      <View style={styles.bottomContainer}>
        {gameOver ? (
          <>
            <Text style={[styles.textWhite, styles.mb12]}>Game Over!</Text>
            <Text style={[styles.textWhite, styles.mb12]}>
              The word was : {wordToGuess.current}
            </Text>

            <Text style={styles.textWhite} selectable>
              {wordleEmoji}
            </Text>

            <View style={styles.buttonRow}>
              <Button
                cta="Copy Score"
                onPress={() => Clipboard.setString(wordleEmoji)}
              />
              <View style={styles.buttonSpacer} />
              <Button cta="Play Again" onPress={() => setGameOver(false)} />
            </View>
          </>
        ) : (
          <Keyboard
            disabledKeyList={[
              ...disabledLetters,
              inputWord.length !== MAX_WORD_LEN
                ? SpecialKeyboardKeys.GUESS
                : '',
            ]}
            onKeyPress={onKeyPress}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mb12: {
    marginBottom: 12,
  },
  mh2: {
    marginHorizontal: 2,
  },
  button: {
    maxWidth: '200px',
  },
  fg1: {
    flexGrow: 1,
  },
  textWhite: {
    color: '#fff',
    fontSize: 22,
  },
  row: {
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  bottomContainer: {
    flexGrow: 1,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  score: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  buttonSpacer: {
    width: 12,
  },
  gamesplayed: {
    textAlign: "left",
    color: '#fff',
    width: '300px',
  }
});

export default GameScreen;

// const letterIndex = new Map<string, number>([
//   ["a", 0],
//   ["b", 1],
//   ["c", 2],
//   ["d", 3],
//   ["e", 4],
//   ["f", 5],
//   ["g", 6],
//   ["h", 7],
//   ["i", 8],
//   ["j", 9],
//   ["k", 10],
//   ["l", 11],
//   ["m", 12],
//   ["n", 13],
//   ["o", 14],
//   ["p", 15],
//   ["q", 16],
//   ["r", 17],
//   ["s", 18],
//   ["t", 19],
//   ["u", 20],
//   ["v", 21],
//   ["w", 22],
//   ["x", 23],
//   ["y", 24],
//   ["z", 25],
// ]);


function getHighestNumberIndex(arrayOfNumbers: number[]) {
  let highestProbability = 0;
  let currentBestGuessOfIndex = -1;
  arrayOfNumbers.forEach((number, i) => {
    if (number > highestProbability) {
      highestProbability = number;
      currentBestGuessOfIndex = i;
    }
  });
  return {index: currentBestGuessOfIndex, certainty: highestProbability };
}
function getExpectedOutput(numberOfOptions: number, activeResultIndex: number) {
  let expectedResult: number[] = []
  for (var i = 0; i < numberOfOptions; i++) {
    expectedResult.push(activeResultIndex === i ? 1 : 0);
  }
  return expectedResult;
}

function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}