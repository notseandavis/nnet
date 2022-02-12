import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {StyleSheet, Text, View, Clipboard, Platform, TextInputComponent} from 'react-native';
import Button from './components/Button';
import Keyboard, {SpecialKeyboardKeys} from './components/Keyboard';
import TextBlock, {TextBlockState} from './components/TextBlock';
import {MAX_GUESSES, MAX_WORD_LEN} from './constants/gameConstants';
import {getInitialBoard, getRandomWord, getWordleEmoji} from './gameUtils';
import TextNNet from '../../../neuralnet/textnnet';

const BOARD_TEMPLATE = getInitialBoard();
const textnnet = new TextNNet([[5]], [[26], [26]], 5, true);

const GameScreen = () => {
  const [guessList, setGuessList] = useState<string[]>([]);
  const [inputWord, setInputWord] = useState<string>('');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [nNetGuessing, setNNetGuessing] = useState<boolean>(false);
  const [running, setRunning] = useState<boolean>(false);
  const [gamesPlayed, setGamesPlayed] = useState<number>(0);
  const [turnsPlayed, setTurnsPlayed] = useState<number>(0);
  const [gameSpeed, setGameSpeed] = useState<number>(1);
  const [gamesWon, setGamesWon] = useState<number>(0);
  const [disabledLetters, setDisabledLetters] = useState<string[]>([]);
  
  const wordToGuess = useRef<string>('xxxxx');

  useEffect(() => {
    if (gameOver === false) {
      wordToGuess.current = getRandomWord();
      setInputWord('');
      setGuessList([]);
      setTimeout(() => {

        setTurnsPlayed(turnsPlayed + 1);
        // window.postMessage('start nnet');
      },gameSpeed)
    }
    if (running) {
      setGameOver(false)
    }
  }, [gameOver]);

  useEffect(() => {
    if (running === true) {
      setTurnsPlayed(turnsPlayed + 1);
      // window.postMessage('start nnet');
    }
  }, [running]);

  useEffect(() => {
    if (running === true) {
      runNNet()
    }
  }, [turnsPlayed]);

  useEffect(() => {
    const guessLen = guessList.length;
    if (guessList[guessLen - 1] === wordToGuess.current) {
      setTimeout(() => {
        setGameOver(true);
      }, 1000);
      setGamesWon(gamesWon + 1);
    } else if (guessLen === MAX_GUESSES) {
      setGameOver(true);
    } else {
      setTurnsPlayed(turnsPlayed + 1);
      // window.postMessage('start nnet');
    }
  }, [guessList]);

  useEffect(() => {
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
  }, [guessList]);

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

  const runNNet = () => {
    if (!running) {
      return;
    }
    let disabledLettersInput = new Array<number>();
    for (let i = 0; i < 26; i++) {
      disabledLettersInput.push(0);
    }

    for (let i = 0; i < disabledLetters.length; i++) {
      let disabledLetter = disabledLetters[i];
      let disabledLetterIndex = textnnet.letterToIndex(disabledLetter);
      disabledLettersInput[disabledLetterIndex] = 1;
    }

    let presentLettersInput = new Array<number>();
    let correctLettersInput = new Array<string>();

    for (let i = 0; i < 26; i++) {
      presentLettersInput.push(0);
    }
    for (let i = 0; i < 5; i++) {
      correctLettersInput.push("noletter");
    }
    let presentLetters = "";
    guessList.forEach((guess: string) => {
      for (let ii = 0; ii < guess.length; ii++) {
        const thisLetterindex = textnnet.letterToIndex(guess[ii]);

        if (wordToGuess.current.includes(guess[ii])) {
          presentLettersInput[thisLetterindex] = 1;
          presentLetters = presentLetters + guess[ii];
          if (guess[ii] === wordToGuess.current[ii]) {
            correctLettersInput[ii] = guess[ii];
          }
        }
      }
    });

    let guess: string = textnnet.fire([correctLettersInput], [disabledLettersInput, presentLettersInput]);
    let originalGuess = guess;

    console.log("NNet guess: " + guess + "")
    for (let guessedLetter = 0; guessedLetter < 5; guessedLetter++) {

      let letterToCheck =  guess[guessedLetter];
      // let letterToCheck =  ;
      while (disabledLetters.includes(guess[guessedLetter])) {

      console.log("original guess contains disabled letter, modifying for training use...")
        let randomNumber = randomInteger(1, 25);
        let randomLetter = textnnet.indexToLetter(randomNumber);
        while (disabledLetters.includes(randomLetter)) {
          randomNumber = randomInteger(1, 25);
          randomLetter = textnnet.indexToLetter(randomNumber);
        }
        guess = guess.replace(letterToCheck, randomLetter);

        console.log("training guess changed to: " + guess + "")
      }
    }

    if (guess != originalGuess) {
      let newGuess = guess;
      let timesTrained = 1;
      textnnet.train(null, wordToGuess.current);
      guess = textnnet.fire([correctLettersInput], [disabledLettersInput, presentLettersInput]);
      timesTrained++;
      console.log("training " + timesTrained + " time(s)")

      while (disabledLetters.includes(newGuess[0]) || disabledLetters.includes(newGuess[1]) || disabledLetters.includes(newGuess[2]) || disabledLetters.includes(newGuess[3]) || disabledLetters.includes(newGuess[4]) || disabledLetters.includes(newGuess[5])) {
        console.log("training " + timesTrained + " time(s)")
        textnnet.train(null, wordToGuess.current);
        newGuess = textnnet.fire([correctLettersInput], [disabledLettersInput, presentLettersInput]);
        timesTrained++;
      }
      console.log("updated NNet guess: " + newGuess)
      guess = newGuess;
    }

    
    const guessLen = guessList.length;
    setGuessList(prev => [...prev, guess.toUpperCase()]);
    setGamesPlayed(gamesPlayed + 1);
    
    // if (wordToGuess.current === guess) {
    //   console.log("WON");
    //   setGuessList(prev => [...prev, guess.toUpperCase()]);

    // } else {
      
    //   console.log("training with correct word: " + wordToGuess.current);
    //   textnnet.train(null, wordToGuess.current);
    //   if (guessLen + 1 === MAX_GUESSES) {
        
    //     setGamesPlayed(gamesPlayed + 1);
    //     // setGameOver(true);
    //     // setGameOver(false);
    //     // setTimeout(() =>{
    //     //   // window.dispatchEvent(new KeyboardEvent('keyup',{'key':'a'}));
    //     //   // window.postMessage('start nnet');
    //     // }, 10);
    //   } else {
    //     setGuessList(prev => [...prev, guess.toUpperCase()]);
    //   }
    // }
  };


  // useEffect(() => {
  //   // if (Platform.OS === 'web') {
  //     const callback = (event: MessageEvent) => {
  //       if (event.data == 'start nnet') {
  //         runNNet();
  //       }
  //       // const key = event.key;

  //       // if (/^[A-Za-z]$/.test(key)) {
  //       //   onKeyPress(key.toUpperCase());
  //       // } else if (key === 'Enter' && inputWord.length === MAX_WORD_LEN) {
  //       //   onKeyPress(SpecialKeyboardKeys.GUESS);
  //       // } else if (key === 'Backspace') {
  //       //   onKeyPress(SpecialKeyboardKeys.DELETE);
  //       // }
  //     };

  //     // window.onmessage = callback;
  //     // window.addEventListener('keyup', callback);
  //     // return () => window.removeEventListener('keyup', callback);
  //   // }
  // }, [inputWord.length, onKeyPress, runNNet]);
  
  const wordleEmoji: string = useMemo(() => {
    if (!gameOver) {
      return '';
    }

    return getWordleEmoji(wordToGuess.current, guessList);
  }, [gameOver, guessList]);

  return (
    <View style={styles.fg1}>

      <View style={styles.bottomContainer}>
        <Button cta={ !running ? "Start NNet" : "Stop NNet" } onPress={() => { setRunning(!running);} } />
        <Text style={styles.gamesplayed} selectable>
          {"Games Played: " + gamesPlayed}
        </Text>
        <Text style={styles.gamesplayed} selectable>
          {"Games Won: " + gamesWon}
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
    textAlign: "center",
    color: '#fff',
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


function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}