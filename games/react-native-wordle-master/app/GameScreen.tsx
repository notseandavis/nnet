import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {StyleSheet, Text, View, Clipboard, Platform, TextInputComponent} from 'react-native';
import Button from './components/Button';
import Keyboard, {SpecialKeyboardKeys} from './components/Keyboard';
import TextBlock, {TextBlockState} from './components/TextBlock';
import {MAX_GUESSES, MAX_WORD_LEN} from './constants/gameConstants';
import {getInitialBoard, getRandomWord, getWordleEmoji} from './gameUtils';
import TextNNet from '../../../neuralnet/textnnet';

const BOARD_TEMPLATE = getInitialBoard();
const textnnet = new TextNNet([[5]], [[26], [26]], 5)

const GameScreen = () => {
  const [guessList, setGuessList] = useState<string[]>([]);
  const [inputWord, setInputWord] = useState<string>('');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [disabledLetters, setDisabledLetters] = useState<string[]>([]);
  
  const wordToGuess = useRef<string>('xxxxx');

  useEffect(() => {
    if (gameOver === false) {
      wordToGuess.current = getRandomWord();
      setInputWord('');
      setGuessList([]);
    }
  }, [gameOver]);

  useEffect(() => {
    const guessLen = guessList.length;
    if (guessList[guessLen - 1] === wordToGuess.current) {
      setGameOver(true);
    } else if (guessLen === MAX_GUESSES) {
      setGameOver(true);
    }
  }, [guessList]);

  useEffect(() => {
    const list: string[] = [];

    guessList.forEach(word => {
      word.split('').forEach(letter => {
        console.log({letter});
        if (!wordToGuess.current.includes(letter)) {
          list.push(letter);
        }
      });
    });

    setDisabledLetters(list);
  }, [guessList]);

  const onKeyPress2 = useCallback(
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

  const onKeyPress = useCallback(
    (key: string) => {

      
      let disabledLettersInput = new Array<number>();
      for (let i = 0; i < 26; i++) {
        disabledLettersInput.push(0);
      }

      for (let i = 0; i < disabledLetters.length; i++) {
        let disabledLetter = disabledLetters[i];
        let disabledLetterIndex = textnnet.letterToIndex[disabledLetter.toLowerCase()];
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
          const thisLetterindex = textnnet.letterToIndex[guess[ii].toLowerCase()];

          if (wordToGuess.current.includes(guess[ii])) {
            presentLettersInput[thisLetterindex] = 1;
            presentLetters = presentLetters + guess[ii];
            if (guess[ii] === wordToGuess.current[ii]) {
              correctLettersInput[ii] = guess[ii];
            }
          }
        }
      });



      // for (let i = 0; i < 5; i++) {

      // }
      // correctLetters = correctLetters.map((letter, i) => {
      //   guessList.forEach((guess) => {
      //     if (guess === wordToGuess.current[i]) {
      //       letter = guess.toLowerCase()
      //     }
      //   });
      //   if (!letter) {
      //     letter = " ";
      //   }
      //   return letter;
      // });

      let guess = textnnet.fire([correctLettersInput], [disabledLettersInput, presentLettersInput]);
      guess = guess.toUpperCase();
      let correctedGuess: string = guess;
      correctedGuess = correctedGuess.toUpperCase();
      for (let guessedLetter = 0; guessedLetter < 5; guessedLetter++) {
        let letterToCheck =  correctedGuess[guessedLetter];
        while (disabledLetters.includes(letterToCheck)) {
          let randomLetter = Math.floor(Math.random() * (25 - 0 + 1)) + 0;
          while (disabledLetters.includes(textnnet.indexToLetter[randomLetter].toUpperCase())) {
            randomLetter = Math.floor(Math.random() * (25 - 0 + 1)) + 0;
          }
          let replacementLetter = textnnet.indexToLetter[randomLetter].toUpperCase();
          correctedGuess = correctedGuess.replace(letterToCheck, replacementLetter);
          textnnet.train(null, correctedGuess);
          correctedGuess = textnnet.fire([correctLettersInput], [disabledLettersInput, presentLettersInput]);
          correctedGuess = correctedGuess.toUpperCase();
        }
      }

      setGuessList(prev => [...prev, guess.toUpperCase()]);

      

      // if (key === SpecialKeyboardKeys.DELETE) {
      //   setInputWord(prev => prev.slice(0, -1));
      // } else if (key === SpecialKeyboardKeys.GUESS) {
      //   setGuessList(prev => [...prev, inputWord.toUpperCase()]);
      //   setInputWord('');
      // } else if (key.length === 1) {
      //   setInputWord(prev => {
      //     if (prev.length < MAX_WORD_LEN && !disabledLetters.includes(key)) {
      //       return prev + key;
      //     }

      //     return prev;
      //   });
      // }
    },
    [wordToGuess, guessList, disabledLetters, inputWord],
  );


  useEffect(() => {
    if (Platform.OS === 'web') {
      const callback = (event: KeyboardEvent) => {
        const key = event.key;

        if (/^[A-Za-z]$/.test(key)) {
          onKeyPress(key.toUpperCase());
        } else if (key === 'Enter' && inputWord.length === MAX_WORD_LEN) {
          onKeyPress(SpecialKeyboardKeys.GUESS);
        } else if (key === 'Backspace') {
          onKeyPress(SpecialKeyboardKeys.DELETE);
        }
      };

      window.addEventListener('keyup', callback);
      return () => window.removeEventListener('keyup', callback);
    }
  }, [inputWord.length, onKeyPress]);

  const wordleEmoji: string = useMemo(() => {
    if (!gameOver) {
      return '';
    }

    return getWordleEmoji(wordToGuess.current, guessList);
  }, [gameOver, guessList]);

  return (
    <View style={styles.fg1}>
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