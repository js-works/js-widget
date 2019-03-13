import { createElement, defineComponent } from '../../modules/core/main/index'
import { useCallback, useEffect, useState } from '../../modules/hooks/main/index'
import { div } from '../../modules/html/main/index'
import React from 'react'

const
  c = createElement,
  h = React.createElement

function runTests() {
  const
    iterationCount = 300000,
    tests = []

  let result = ''

  tests.push({
    name: 'Using createElement from React',

    run() {
      for (let i = 0; i < iterationCount; ++i) {
        h('div',
          { className: 'my-class', id: 'my-id', key: 1 },
          h('div',
            { className: 'my-class2', id: 'my-id2', key: 2},
            h('div', null, h('div', null, h('div', null, h('div')))),
            'some text', [1, 2, 3, 4, 5]))  
      }
    }
  }),
  
  tests.push({
    name: 'Using createElement from js-widgets',

    run() {
      for (let i = 0; i < iterationCount; ++i) {
        c('div',
          { className: 'my-class', id: 'my-id', key: 1 },
          c('div',
            { className: 'my-class2', id: 'my-id2', key: 2 },
            c('div', null, c('div', null, c('div', null, c('div')))),
            'some text', [1, 2, 3, 4, 5]))  
      }
    }
  }),

  tests.push({
    name: 'Using HTML factories',

    run() {
      for (let i = 0; i < iterationCount; ++i) {
        div(
          { className: 'my-class', id: 'my-id', key: 1 },
          div({ className: 'my-class2', id: 'my-id2', key: 2},
            div(div(div(div()))),
            'some text', [1, 2, 3, 4, 5]))  
      }
    }
  })

  for (let i = 0; i < tests.length; ++i) {
    const
      test = tests[i],
      startTime = Date.now()
    
    test.run()

    const
      stopTime = Date.now(),
      duration = (stopTime - startTime) + ' ms'

    const message = `Run time for test '${test.name}': ${duration}`

    if (i == 0) {
      result = message
    } else {
      result += '\n' + message
    }
  }

  result += '\nAll tests finished.'

  return result
}

const PerformanceTest = defineComponent({
  displayName: 'PerformanceTest',

  render() {
    const
      [result, setResult] = useState(() => null as string),
      [isRunning, setRunning] = useState(() => false),
      onStart = useCallback(() => startTest())

    function startTest() {
      setRunning(true)
    }

    useEffect(() => {
      if (isRunning) {
        const result = runTests()
        
        setRunning(false)
        setResult(result)
      }
    })

    return (
      <div> 
        <h4>Measuring time to build virtual dom trees</h4>
        { 
          !isRunning
            ? <div>
                <Report result={result}/> 
                <button onClick={onStart}>
                  { result === null ? 'Start tests' : 'Restart tests' }
                </button>
              </div>
            : <div>Running performance test - please wait...</div>
        }
      </div>
    )
  }
})

type ReportProps = {
  result: string
}

function X() { return <div>xxx</div> }

const Report = defineComponent<ReportProps>({
  displayName: 'Report',

  render({ result }) {
    let ret = null
    
    if (result && result.trim().length > 0) {
      ret = <pre>{result}</pre>
    }

    return ret
  }
})

export default <PerformanceTest/>
