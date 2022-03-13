import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, Clipboard, Platform, TextInputComponent } from 'react-native';
// import Button from './components/Button';
import Keyboard, { SpecialKeyboardKeys } from './components/Keyboard';
import TextBlock, { TextBlockState } from './components/TextBlock';
import { MAX_GUESSES, MAX_WORD_LEN } from './constants/gameConstants';
import { getInitialBoard, getRandomWord, getWordleEmoji } from './gameUtils';
import TextNNet from '../../../neuralnet/textnnet';
import fiveLetterWords from './constants/fiveLetterWords.json';
import { Button, FormGroup, Switch, FormControlLabel, Box, Container, TableContainer, Table, TableCell, TableRow, Paper, TableBody, TableHead, Grid, Slider, Typography, TextField, Divider, Card, CardContent, InputLabel, MenuItem, Select, FormControl, Input, styled } from '@mui/material';
import { Chart } from "react-google-charts";
import HistoryChart from './components/HistoryChart';

const BOARD_TEMPLATE = getInitialBoard();
let textnnet: TextNNet;
let wordList = fiveLetterWords;

const GameScreen = () => {
  const [guessList, setGuessList] = useState<string[]>([]);
  const [inputWord, setInputWord] = useState<string>('');
  const [weightSet, setWeightSet] = useState<string>('');
  const [firstGuess, setFirstGuess] = useState<string>('');
  const [nnStatus, setNnStatus] = useState<string>('');
  const [activationFunction, setActivationFunction] = useState<string>('sigmoid');
  const [certainty, setCertainty] = useState<number>(0);
  const [answerCertainty, setAnswerCertainty] = useState<number>(0);
  const [numberOfPossibleAnswers, setNumberOfPossibleAnswers] = useState<number>(Math.floor(fiveLetterWords.length / 2));
  const [randomGuesses, setRandomGuesses] = useState<number>(0);
  const [timesToTrainWithValidWord, setTimesToTrainWithValidWord] = useState<number>(1);
  const [speed, setSpeed] = useState<number>(0);
  const [layers, setLayers] = useState<number>(0);
  const [learningRate, setLearningRate] = useState<string>("0.005");
  const [momentum, setMomentum] = useState<string>("0.001");
  const [nnGuess, setNnGuess] = useState<string>('');
  const [nnBestValidGuess, setNnBestValidGuess] = useState<string>('');
  const [randomGuess, setRandomGuess] = useState<string>('');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [endGameOnGuessWithDisabledLetter, setEndGameOnGuessWithDisabledLetter] = useState<boolean>(false);
  const [hardMode, setHardMode] = useState<boolean>(false);
  const [trainWithValidRandomGuess, setTrainWithValidRandomGuess] = useState<boolean>(false);
  const [running, setRunning] = useState<boolean>(false);
  // const [expectedResult, setExpectedResult] = useState<number[]>([]);
  const [trainingMode, setTrainingMode] = useState<boolean>(true);
  const [gamesPlayed, setGamesPlayed] = useState<number>(0);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [turnsPlayed, setTurnsPlayed] = useState<number>(0);
  const [turnsPlayedByAi, setTurnsPlayedByAi] = useState<number>(0);
  const [nnError, setnnError] = useState<number>(0);
  const [originalWeights, setOriginalWeights] = useState<object>({});
  const [trainingList, setTrainingList] = useState<(number[][] | string[][])[]>([]);
  const [scoreList, setScoreList] = useState<[number, string][]>([]);
  const [scoreHistory, setScoreHistory] = useState<[number, number, number][]>([[0, 0, 0]]);



  const [gamesWon, setGamesWon] = useState<number>(0);
  const [disabledLetters, setDisabledLetters] = useState<string[]>([]);

  const wordToGuess = useRef<string>('xxxxx');
  const wordToGuessIndex = useRef<number>(0);

  useEffect(() => {
    if (gameOver === false) {
      const newWord = getRandomWord(wordList);
      wordToGuess.current = newWord.word;
      wordToGuessIndex.current = newWord.index
      setCurrentWordIndex(newWord.index);
      // setExpectedResult(getExpectedOutput(disabledLetters, wordList, wordList.length, newWord.index));
      setInputWord('');
      setGuessList([]);
      setGamesPlayed(gamesPlayed + 1);
    } else {
      let sh: [number, number, number][];
      sh = [...scoreHistory]
      if (scoreHistory.length > 50) {
        sh.splice(0, 1);
      }
      sh.push([gamesPlayed, certainty, answerCertainty]);
      setScoreHistory(sh);
    }
    if (running) {
      setGameOver(false)
    }
  }, [gameOver]);


  useEffect(() => {
    const guessLen = guessList.length;
    if (guessList[guessLen - 1] === wordToGuess.current) {
      // if (trainingMode) {
      //   // trainingList.forEach((trainingData => {
      //   //   textnnet.train(trainingData[0], trainingData[1], null, expectedResult);
      //   // }));
      //   textnnet.train(null, null, null, getExpectedOutput(disabledLetters, wordList, wordList.length, wordToGuessIndex.current));
      //   setnnError(textnnet.nnet.globalError);

      // }
      setTrainingList([]);
      setGameOver(true);

    } else if (guessLen === MAX_GUESSES || guessList[guessLen - 1] === "") {
      if (trainingMode && textnnet) {
        textnnet.train(null, null, null, getExpectedOutput(disabledLetters, wordList, wordList.length, wordToGuessIndex.current));
        setnnError(textnnet.nnet.globalError);
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
    wordList = fiveLetterWords.slice(0, numberOfPossibleAnswers)
  }, [numberOfPossibleAnswers])

  useEffect(() => {
    // fire the next turn when disabled letters are reset
    setTurnsPlayed(turnsPlayed + 1);
    setTimeout(() => {
      runNNet(wordToGuess.current, guessList, disabledLetters, wordList);
    }, speed)
    // window.postMessage('start nnet');
  }, [disabledLetters])

  // useEffect(() => {
  // }, [turnsPlayed]);

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
    if (!running || !textnnet) {
      return;
    }

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

    let presentLettersInput = new Array<Array<number>[]>();
    let correctLettersInput = new Array<string>();

    // for (let i = 0; i < 26; i++) {
    //   presentLettersInput.push([0]);
    // }
    for (let i = 0; i < 5; i++) {
      correctLettersInput.push("noletter");
      presentLettersInput.push([]);
      for (let j = 0; j < 26; j++) {
        presentLettersInput[i].push([0]);
      }

    }
    let presentLetters: string[][] = [];


    gl.forEach((guess: string, i) => {
      for (let ii = 0; ii < guess.length; ii++) {
        const thisLetterindex = textnnet.letterToIndex(guess[ii]);

        if (correctWord.includes(guess[ii])) {
          // presentLetters.push([guess[ii]]);
          if (guess[ii] === correctWord[ii]) {
            correctLettersInput[ii] = guess[ii];
          } else {
            presentLettersInput[i][thisLetterindex] = [1];
          }
        }
      }
    });

    let gameProgressInput = generateGameProgress(6, guessList.length);

    let input = [[correctLettersInput], [...gameProgressInput, ...disabledLettersInput, ...presentLettersInput[0], ...presentLettersInput[1], ...presentLettersInput[2], ...presentLettersInput[3], ...presentLettersInput[4]]];

    // setTrainingList(prev => [...prev, input]);

    let timesTrained = 0;
    setNnStatus("Playing...");

    setRandomGuess("");
    setNnBestValidGuess("");

    setNnGuess("");

    let rawOutput = textnnet.fire(input[0], input[1]).nonTextOutputs;



    // Best overall guess from NN
    let rawGuess = getHighestNumberIndex(rawOutput);
    setCertainty(rawGuess.certainty);
    setAnswerCertainty(rawOutput[wordToGuessIndex.current]);
    let nnBestGuess: string = flw[rawGuess.index].toUpperCase();
    // let sl = getScoresWithWords(rawOutput, flw);
    // setScoreList(sl);
    let turnPlayedByAi = true;
    let invalid: string = "";

    if (includesDisabledLetter(dl, nnBestGuess) && (endGameOnGuessWithDisabledLetter || trainWithValidRandomGuess)) {
      invalid = "(invalid)";
      // If the very best guess is not valid, do some stuff
      if (endGameOnGuessWithDisabledLetter) {
        // If we are supposed to end the game when a disabled letter is guessed, end it.
        setGuessList(prev => [...prev, ""]);
      } else if (trainWithValidRandomGuess) {

        let trainingCount = 0;
        // let aDifferentResult = getExpectedOutput(wordList.length, bestValidGuessIndex);


        let newResult = "";
        let randomWordLoop = () => {
          let randomWordIndex = randomInteger(0, flw.length - 1);
          let newRandomWord = flw[randomWordIndex].toUpperCase();
          while (includesDisabledLetter(dl, newRandomWord)) {
            randomWordIndex = randomInteger(0, flw.length - 1);
            newRandomWord = flw[randomWordIndex].toUpperCase();
          }

          setRandomGuess(newRandomWord);

          let aDifferentResult = getExpectedOutput(dl, flw, flw.length, -1);
          textnnet.train(null, null, null, aDifferentResult);
          setnnError(textnnet.nnet.globalError);
          let newGuessRawOutput = textnnet.fire(input[0], input[1]).nonTextOutputs;
          let newGuessIndex = getHighestNumberIndex(newGuessRawOutput).index;
          let newGuessWord = flw[newGuessIndex].toUpperCase();

          if (includesDisabledLetter(dl, newGuessWord) && trainingCount < 1) {
            trainingCount++;
            setTimeout(randomWordLoop, speed);
          } else {
            setGuessList(prev => [...prev, newRandomWord]);
          }
        }
        randomWordLoop();
      }

    } else {
      if (nnBestGuess === wordToGuess.current) {
        setGamesWon(gamesWon + 1);
      }

      if (guessList.length > 0) {
        setTurnsPlayedByAi(turnsPlayedByAi + 1);
      }
      setGuessList(prev => [...prev, nnBestGuess]);
    }
    setNnGuess(nnBestGuess + invalid)

  };

  const callback = (event: MessageEvent) => {
    if (event.data == 'start nnet') {
      runNNet(wordToGuess.current, guessList, disabledLetters, wordList);
    }
  };

  window.onmessage = callback;

  const wordleEmoji: string = useMemo(() => {
    if (!gameOver) {
      return '';
    }

    return getWordleEmoji(wordToGuess.current, guessList);
  }, [gameOver, guessList]);
  const scores = scoreList.slice(0, 10);
  const rows = [
    {
      name: "Possible Answers",
      value: numberOfPossibleAnswers
    },
    {
      name: "Best Guess",
      value: nnGuess
    },
    {
      name: "Best Guess Certainty",
      value: certainty.toFixed(5)
    },
    {
      name: "Answer",
      value: wordToGuess.current
    },
    // {
    //   name: "Score of answer",
    //   value: scoreHistory[scoreHistory.length - 1]?
    // },
    {
      name: "Turns Played",
      value: turnsPlayed
    },
    {
      name: "Games Played",
      value: gamesPlayed
    },
    {
      name: "Games Won",
      value: gamesWon
    },
    {
      name: "Win Ratio",
      value: (Math.floor((gamesWon / gamesPlayed) * 100) / 100).toFixed(5)
    },
    {
      name: "Neural Net Error",
      value: nnError.toFixed(5)
    }
  ];

  return (
    <Box>
      <Container maxWidth="lg">
        <Grid container spacing="2">

          <HistoryChart historyData={scoreHistory} />
          <Grid item md={6}>

            {(!running && weightSet !== "exporting") && <>


              <Card sx={{ minWidth: 275 }}>
                <CardContent>

                  <Typography variant="h5">
                    Neural Network Options
                  </Typography>
                  <br></br>
                  <Typography id="non-linear-slider" gutterBottom>
                    (you can't change these later)
                  </Typography>
                  <Divider></Divider>
                  <Typography id="non-linear-slider" gutterBottom>
                    Middle Layers:
                  </Typography>

                  <Slider
                    disabled={textnnet}
                    defaultValue={layers}
                    value={layers}
                    // getAriaValueText={}
                    valueLabelDisplay="auto"
                    onChange={(e, value) => {
                      setLayers(value)
                    }}
                    step={1}
                    marks
                    min={0}
                    max={10}
                  />

                  <Typography id="non-linear-slider" gutterBottom>
                    Number of answers:
                  </Typography>

                  <Slider
                    // disabled={textnnet}
                    // defaultValue={numberOfPossibleAnswers}
                    value={numberOfPossibleAnswers}
                    // getAriaValueText={}
                    valueLabelDisplay="auto"
                    onChange={(e, value) => {
                      setNumberOfPossibleAnswers(value);
                    }}
                    step={1}
                    // marks
                    min={1}
                    max={fiveLetterWords.length}
                  />
                <FormControl sx={{
                   m: 3, minWidth: 200 
                   }}>
                  <InputLabel id="demo-simple-select-label">Activation Function</InputLabel>
                    <Select
                      // labelId="demo-simple-select-label"
                      id="activation-function"
                      value={activationFunction}
                      label="Activation Function"
                      onChange={(e) => {
                        setActivationFunction(e.target.value);
                      }}
                    >
                      <MenuItem value={'sigmoid'}>Sigmoid</MenuItem>
                      <MenuItem value={'relu'}>ReLU</MenuItem>
                    </Select>
                  </FormControl>
                  <br></br>
                  <Button disabled={running} variant="contained" onClick={() => {
                    if (!textnnet) {
                      textnnet = new TextNNet(
                        [[5]],
                        [
                          // game progress
                          [1], [1], [1], [1], [1], [1],
                          // other inputs
                          [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1]],
                        0,
                        true,
                        numberOfPossibleAnswers,
                        layers,
                        parseFloat(learningRate),
                        parseFloat(momentum),
                        activationFunction);
                    }
                    if (!running) {
                      setRunning(true);
                      setGuessList([]);
                    } else {
                      setRunning(false);
                    }

                  }}>{running ? "Start AI" : "Start AI"}</Button>

<label htmlFor="contained-button-file">
                    <Input 
                      sx={{display: "none" }} 
                      accept=".json" 
                      id="contained-button-file" 
                      multiple type="file" 
                      onChange={(e) => {
                        const fileReader = new FileReader();
                        fileReader.readAsText(e.target.files[0], "UTF-8");
                        let receiveResult = (ws: any) => {

                          setLayers(ws.layers);
                          setNumberOfPossibleAnswers(ws.numberOfPossibleAnswers);
                          setLearningRate(ws.learningRate);
                          setMomentum(ws.momentum);
                          setTrainingMode(ws.trainingMode);
                          setTrainWithValidRandomGuess(ws.trainWithValidRandomGuess);
                          setEndGameOnGuessWithDisabledLetter(ws.endGameOnGuessWithDisabledLetter);
                          setActivationFunction(ws.activationFunction);
                          
                          textnnet = new TextNNet(
                            [[5]],
                            [
                              // game progress
                              [1], [1], [1], [1], [1], [1],
                              // other inputs
                              [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1]],
                            0,
                            true,
                            ws.numberOfPossibleAnswers,
                            ws.layers,
                            parseFloat(ws.learningRate),
                            parseFloat(ws.momentum),
                            ws.activationFunction);
                          textnnet.nnet.setWeights(ws.weights);
                          setRunning(true);
                          setGuessList([]);
                        }
                        
                        fileReader.onload = (e: Event) => {
                          if (e && e.target && e.target.result) {
                            console.log("e.target.result", e.target.result);
                            let ws = JSON.parse(e.target.result);
                            receiveResult(ws);
                          }
                        }
                      }}
                      />
                    <Button variant="outlined" component="span" sx={{marginLeft: 1}}>
                      Import Weight Set
                    </Button>
                  </label>
                </CardContent>
              </Card>
            </>
            }
            <br></br>
            <Card sx={{ minWidth: 275 }}>
              <CardContent>
                <Typography variant="h5">
                  Game/Training Options
                </Typography>
                <Divider></Divider>
                <Box
                  component="form"
                  sx={{
                    '& > :not(style)': { m: 1, width: '40%', marginTop: '20px' },
                  }}
                  noValidate
                  autoComplete="off"
                >
                  <TextField
                    id="outlined-basic"
                    margin="normal"
                    label="Learning Rate (between 0 and 1)"
                    variant="outlined"
                    value={learningRate}
                    helperText="Changes can break the game"
                    onChange={(e) => {
                      if (/(?:0)?((?:\.\d+)|(?:\.))$/.test(e.target.value)) {
                        setLearningRate(e.target.value);
                        if (textnnet) {
                          textnnet.nnet.learningRate = parseFloat(e.target.value);
                        }
                      }

                    }} />
                  <TextField
                    id="outlined-basic"
                    margin="normal"
                    label="Momentum (between 0 and 1"
                    helperText="Changes can break the game"
                    variant="outlined"
                    value={momentum}
                    onChange={(e) => {

                      if (/^(0(\.\d+)?|1(\.0+)?)$/.test(e.target.value)) {
                        setMomentum(e.target.value);
                        if (textnnet) {
                          textnnet.nnet.momentum = parseFloat(e.target.value);
                        }
                      }
                    }} />
                </Box>
                <Typography id="non-linear-slider" gutterBottom>
                  Speed:
                </Typography>

                <Slider
                  aria-label="Speed"
                  value={speed}
                  // getAriaValueText={}
                  valueLabelDisplay="auto"
                  onChange={(e, value) => {
                    setSpeed(value)
                  }}
                  step={200}
                  marks
                  min={0}
                  max={3000}
                />
                <FormControlLabel control={
                  <Switch defaultChecked onChange={(e, value) => {
                    setTrainingMode(value);
                  }} />
                } label="Train with correct word after game" />
                <FormControlLabel control={
                  <Switch onChange={(e, value) => {
                    setEndGameOnGuessWithDisabledLetter(value)
                    if (value === false) {
                      setTrainWithValidRandomGuess(false);
                    }
                  }} />
                } label="End game on guesses with disabled letters" />
                {!endGameOnGuessWithDisabledLetter ? (<>
                  <FormControlLabel control={
                    <Switch onChange={(e, value) => {
                      setTrainWithValidRandomGuess(value)
                    }} />
                  } label="Train with random valid guess if AI guesses disabled letter" />
                  {trainWithValidRandomGuess && (<><Typography id="non-linear-slider" gutterBottom>
                    Train {trainWithValidRandomGuess} time(s) after invalid guess:
                  </Typography>

                    <Slider
                      aria-label="Speed"
                      defaultValue={1}
                      // getAriaValueText={}
                      valueLabelDisplay="auto"
                      onChange={(e, value) => {
                        setSpeed(value)
                      }}
                      step={1}
                      marks
                      min={1}
                      max={100}
                    />
                  </>)}
                </>) : (<></>)}
                
                <br></br>
                
                <Button disabled={!running} variant="outlined" onClick={() => {
                  setRunning(false);
                  setWeightSet("exporting");
                  setTimeout(() => {
                    download("weightset.json", JSON.stringify({
                      layers,
                      learningRate,
                      momentum,
                      trainingMode,
                      trainWithValidRandomGuess,
                      endGameOnGuessWithDisabledLetter,
                      numberOfPossibleAnswers,
                      weights: textnnet.nnet.getWeights()
                      
                    }));
                    setTimeout(() => {
                      setRunning(true);
                      setGuessList([]);
                      setWeightSet("");

                    }, speed * 2);
                  }, speed * 2);
                }}>Export Weight Set</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h5">
                  Info
                </Typography>
                <Divider></Divider>
                <Box sx={{ marginTop: "20px" }} >
                  <Button variant="contained" onClick={() => { setTurnsPlayedByAi(0); setTurnsPlayed(0); setGamesPlayed(0); setGamesWon(0);; }}>Reset Statistics</Button>
                </Box>

                <TableContainer component={Paper}>
                  <Table>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow
                          key={row.name}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell component="th" scope="row">
                            {row.name}
                          </TableCell>
                          <TableCell align="right">{row.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item md={6}>


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
              <Keyboard
                disabledKeyList={[
                  ...disabledLetters,
                  inputWord.length !== MAX_WORD_LEN
                    ? SpecialKeyboardKeys.GUESS
                    : '',
                ]}
                onKeyPress={onKeyPress}
              />
            </View>

            {/* <Typography variant="h5">
      Top 10 Guesses
    </Typography>
      <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Dessert (100g serving)</TableCell>
            <TableCell align="right">Calories</TableCell>
            <TableCell align="right">Fat&nbsp;(g)</TableCell>
            <TableCell align="right">Carbs&nbsp;(g)</TableCell>
            <TableCell align="right">Protein&nbsp;(g)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {scores.map((score, i) => (
            <TableRow
              key={i}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {i + 1}
              </TableCell>
              <TableCell align="right">{score[1]}</TableCell>
              <TableCell align="right">{score[0]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer> */}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

const styles = StyleSheet.create({
  // mb12: {
  //   marginBottom: 12,
  // },
  // mh2: {
  //   marginHorizontal: 2,
  // },
  // // button: {
  // //   // maxWidth: '200px',
  // //   width: '100%',
  // // },
  // fg1: {
  //   flexGrow: 1,
  // },
  // textWhite: {
  //   color: '#fff',
  //   fontSize: 22,
  // },
  row: {
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  // buttons: {
  //   maxWidth: 300,
  //   justifyContent: 'center',
  // },
  bottomContainer: {
    flexGrow: 1,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  // score: {
  //   color: '#fff',
  //   fontSize: 14,
  //   marginBottom: 12,
  // },
  // buttonRow: {
  //   flexDirection: 'row',
  // },
  // buttonSpacer: {
  //   width: 12,
  // },
  // gamesplayed: {
  //   textAlign: "left",
  //   color: '#fff',
  //   width: '300px',
  // }
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

function getBestValidGuess(scoresAndIndexes: { score: number, index: number, word: string }[], disabledLetters: string[]) {

  let i = scoresAndIndexes.length;
  let bestValidGuess;
  while (!bestValidGuess && i > -1) {
    i--;
    let thisWord = wordList[scoresAndIndexes[i].index];
    if (!includesDisabledLetter(disabledLetters, thisWord)) {
      bestValidGuess = thisWord;
    }
  }
  return bestValidGuess ? { word: bestValidGuess.toUpperCase(), index: i } : { word: "", index: 0 };
}

function getScoresWithWords(arrayOfNumbers: number[], words: string[]) {
  let scoresAndIndexes: [number, string][] = [];
  arrayOfNumbers.forEach((n, i) => {
    scoresAndIndexes.push([n, words[i].toUpperCase()]);
    // scoresAndIndexes[i].push(n);
    // scoresAndIndexes[i].push()
  })
  scoresAndIndexes.sort((a, b) => {
    return b[0] - a[0];
  });
  return scoresAndIndexes;
}

function getHighestNumberIndex(arrayOfNumbers: number[]) {

  let highestProbability = 0;
  let currentBestGuessOfIndex = 0;
  arrayOfNumbers.forEach((number, i) => {
    if (number > highestProbability) {
      highestProbability = number;
      currentBestGuessOfIndex = i;
    }
  });
  return { index: currentBestGuessOfIndex, certainty: highestProbability };
}
function getExpectedOutput(disabledLetters: string[], wordList: string[], numberOfOptions: number, activeResultIndex: number) {
  let expectedResult: number[] = []
  for (var i = 0; i < numberOfOptions; i++) {
    expectedResult.push(activeResultIndex === i ? 1 : (includesDisabledLetter(disabledLetters, wordList[i].toUpperCase()) ? .01 : .7));
  }
  return expectedResult;
}

function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// function hardModeValidation(correctLetters: string[], presentLetters: guess: string) {

// }

function includesDisabledLetter(disabledLetters: string[], word: string) {
  let stringArray = word.toUpperCase().split("")
  while (stringArray.length > 0) {
    if (disabledLetters.includes(stringArray[0])) {
      return true;
    }
    stringArray.splice(0, 1);
  }
  return false;
}

function generateGameProgress(totalTurns: number, currentTurn: number) {
  let turnsArray = [];
  while (turnsArray.length < totalTurns) {
    turnsArray.push([currentTurn > turnsArray.length ? 0 : 1]);
  }
  return turnsArray;
}

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}