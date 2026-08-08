import { useEffect, useReducer, useState } from 'react'
import EntryForm from './components/EntryForm.jsx'
import StepView from './components/StepView.jsx'
import RejectSheet from './components/RejectSheet.jsx'
import BreakScreen from './components/BreakScreen.jsx'
import Settings from './components/Settings.jsx'
import SharingPanel from './components/SharingPanel.jsx'
import { getNextStep } from './lib/stepEngine.js'
import { getSettings, setSettings, getSharing, setSharing } from './lib/storage.js'
import { getInitialTheme, applyTheme } from './lib/theme.js'

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.5v2.5M12 19v2.5M21.5 12H19M5 12H2.5M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3 5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const initialState = {
  view: 'entry',
  assignmentInput: '',
  history: [],
  currentStep: null,
  showRejectSheet: false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SUBMIT_ASSIGNMENT':
      return {
        ...state,
        assignmentInput: action.assignmentInput,
        history: [],
        currentStep: null,
        showRejectSheet: false,
      }
    case 'RECEIVE_STEP':
      return { ...state, currentStep: action.step, view: 'step', showRejectSheet: false }
    case 'MARK_DONE':
      return {
        ...state,
        history: [...state.history, { ...state.currentStep, status: 'done' }],
      }
    case 'MARK_REJECTED':
      return {
        ...state,
        history: [
          ...state.history,
          { ...state.currentStep, status: 'rejected', rejectReason: action.rejectReason },
        ],
        showRejectSheet: false,
      }
    case 'OPEN_REJECT_SHEET':
      return { ...state, showRejectSheet: true }
    case 'CLOSE_REJECT_SHEET':
      return { ...state, showRejectSheet: false }
    case 'SET_VIEW':
      return { ...state, view: action.view }
    default:
      return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [settings, setSettingsState] = useState(getSettings)
  const [sharing, setSharingState] = useState(getSharing)
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    setSettings(settings)
  }, [settings])

  useEffect(() => {
    setSharing(sharing)
  }, [sharing])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  async function handleSubmitAssignment(text) {
    dispatch({ type: 'SUBMIT_ASSIGNMENT', assignmentInput: text })
    const step = await getNextStep({ assignmentInput: text, history: [], rejectReason: undefined })
    dispatch({ type: 'RECEIVE_STEP', step })
  }

  async function handleDone() {
    const newHistory = [...state.history, { ...state.currentStep, status: 'done' }]
    dispatch({ type: 'MARK_DONE' })
    const step = await getNextStep({
      assignmentInput: state.assignmentInput,
      history: newHistory,
      rejectReason: undefined,
    })
    dispatch({ type: 'RECEIVE_STEP', step })
  }

  async function handleReject(reason) {
    const newHistory = [
      ...state.history,
      { ...state.currentStep, status: 'rejected', rejectReason: reason },
    ]
    dispatch({ type: 'MARK_REJECTED', rejectReason: reason })
    const step = await getNextStep({
      assignmentInput: state.assignmentInput,
      history: newHistory,
      rejectReason: reason,
    })
    dispatch({ type: 'RECEIVE_STEP', step })
  }

  const pastCount = state.history.filter((entry) => entry.status === 'done').length
  const showCorner = state.view === 'entry' || state.view === 'step'

  return (
    <div className="font-chrome">
      {showCorner && (
        <div className="fixed top-4 right-4 flex items-center gap-3 z-20">
          <button
            type="button"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="text-quiet focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_VIEW', view: 'sharing' })}
            className="text-quiet text-xs underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            sharing
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_VIEW', view: 'settings' })}
            className="text-quiet text-xs underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            settings
          </button>
        </div>
      )}

      {state.view === 'entry' && <EntryForm onSubmit={handleSubmitAssignment} />}

      {state.view === 'step' && state.currentStep && (
        <>
          <StepView
            stepId={state.currentStep.stepId}
            stepText={state.currentStep.stepText}
            pastCount={pastCount}
            suggestBreak={state.currentStep.suggestBreak}
            textSize={settings.textSize}
            readAloud={settings.aiRules.readAloud}
            onDone={handleDone}
            onRejectOpen={() => dispatch({ type: 'OPEN_REJECT_SHEET' })}
            onBreakOpen={() => dispatch({ type: 'SET_VIEW', view: 'break' })}
          />
          {state.showRejectSheet && (
            <RejectSheet
              onChoose={handleReject}
              onClose={() => dispatch({ type: 'CLOSE_REJECT_SHEET' })}
            />
          )}
        </>
      )}

      {state.view === 'break' && (
        <BreakScreen onReturn={() => dispatch({ type: 'SET_VIEW', view: 'step' })} />
      )}

      {state.view === 'settings' && (
        <Settings
          settings={settings}
          onChange={setSettingsState}
          onClose={() => dispatch({ type: 'SET_VIEW', view: state.currentStep ? 'step' : 'entry' })}
        />
      )}

      {state.view === 'sharing' && (
        <SharingPanel
          sharing={sharing}
          onChange={setSharingState}
          onClose={() => dispatch({ type: 'SET_VIEW', view: state.currentStep ? 'step' : 'entry' })}
        />
      )}
    </div>
  )
}
