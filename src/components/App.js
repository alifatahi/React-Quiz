import { useEffect, useReducer } from "react";
import Header from "./Header";
import Main from "./Main";
import Loader from "./Loader";
import Error from "./Error";
import StartScreen from "./StartScreen";
import Question from "./Question";
import NextButton from "./NextButton";
import Progress from "./Progress";
import FinishScreen from "./FinishScreen";
import Footer from "./Footer";
import Timer from "./Timer";

const SEC_PER_QUESTION = 30;

// We have 2 main state
const initialState = {
  questions: [],

  // loading, error, ready, active, finished State for loading instead of isLoading
  status: "loading",

  // Starting point of Number
  index: 0,
  answer: null,
  points: 0,
  highscore: 0,
  secondsRemaining: null,
};

// reducer method to update state based on action
function reducer(state, action) {
  switch (action.type) {
    // Get all question from API and our app is ready
    case "dataReceived":
      return {
        ...state,
        questions: action.payload,
        status: "ready",
      };

    // Failed to get data
    case "dataFailed":
      return {
        ...state,
        status: "error",
      };

    // User press Start button so the game get active
    case "start":
      return {
        ...state,
        status: "active",
        secondsRemaining: state.questions.length * SEC_PER_QUESTION, //Based on all question we set Timer
      };

    // Get Answer
    case "newAnswer":
      // Get question that user answer
      const question = state.questions.at(state.index);

      return {
        ...state,
        answer: action.payload,
        // Check if answer is correct the we add question point to user point
        points:
          action.payload === question.correctOption
            ? state.points + question.points
            : state.points,
      };

    // Get Next Question
    case "nextQuestion":
      // Get current index and when user hit next we update index so next question
      // Also we set answer to null so next question don't have answer until user choose
      return { ...state, index: state.index + 1, answer: null };

    // Finish the Game
    case "finish":
      return {
        ...state,
        status: "finished",
        highscore:
          state.points > state.highscore ? state.points : state.highscore,
      };

    // Restart the Game
    case "restart":
      return {
        //Clean all initial state
        ...initialState,
        // Set Questions
        questions: state.questions,
        // Ready to start the game
        status: "ready",
      };

    //Counter for time match over
    case "tick":
      return {
        ...state,
        secondsRemaining: state.secondsRemaining - 1,
        status: state.secondsRemaining === 0 ? "finished" : state.status,
      };

    // Default
    default:
      throw new Error("Action Unknown");
  }
}

export default function App() {
  // useReducer to move all State updating in reducer function
  // Destructure from initialState, dispatch
  const [
    { questions, status, index, answer, points, highscore, secondsRemaining },
    dispatch,
  ] = useReducer(reducer, initialState);

  const numQuestions = questions.length;
  // Use reduce method to loop through all question and calculate all points to get Max Point
  const maxPossiblePoints = questions.reduce(
    (prev, cur) => prev + cur.points,
    0
  );

  // Fetch Data
  useEffect(function () {
    fetch("http://localhost:8000/questions")
      .then((res) => res.json())
      .then((data) => dispatch({ type: "dataReceived", payload: data }))
      .catch((err) => dispatch({ type: "dataFailed" }));
  }, []);

  return (
    <div className="app">
      <Header />

      <Main>
        {/* Based on status we load different Component */}
        {status === "loading" && <Loader />}
        {status === "error" && <Error />}
        {/* When its ready it means all question is loaded and we pass them to StartScreen Component */}
        {status === "ready" && (
          <StartScreen numQuestions={numQuestions} dispatch={dispatch} />
        )}
        {status === "active" && (
          <>
            <Progress
              index={index}
              numQuestion={numQuestions}
              points={points}
              maxPossiblePoints={maxPossiblePoints}
              answer={answer}
            />
            <Question
              question={questions[index]}
              dispatch={dispatch}
              answer={answer}
            />
            <Footer>
              <Timer dispatch={dispatch} secondsRemaining={secondsRemaining} />
              <NextButton
                dispatch={dispatch}
                answer={answer}
                index={index}
                numQuestions={numQuestions}
              />
            </Footer>
          </>
        )}
        {status === "finished" && (
          <FinishScreen
            points={points}
            maxPossiblePoints={maxPossiblePoints}
            highscore={highscore}
            dispatch={dispatch}
          />
        )}
      </Main>
    </div>
  );
}
