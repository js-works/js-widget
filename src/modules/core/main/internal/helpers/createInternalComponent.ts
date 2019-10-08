import StatelessComponentConfig from '../types/StatelessComponentConfig'
import StatefulComponentConfig from '../types/StatefulComponentConfig'
import memo from '../../internal/adapt/memo'
import useContext from '../../internal/adapt/useContext'
import useEffect from '../../internal/adapt/useEffect'
import useRef from '../../internal/adapt/useRef'
import useState from '../../internal/adapt/useState'

function createInternalComponent(
  componentConfig: StatelessComponentConfig<any>
): any

function createInternalComponent(
  componentConfig: StatelessComponentConfig<any>
): any

function createInternalComponent(
  componentConfig: any 
) {
  return (componentConfig as any).render
    ? createStatelessInternalComponent(componentConfig)
    : createStatefulInternalComponent(componentConfig)
}

export default createInternalComponent

// ------------------------------------------------------------------

function createStatelessInternalComponent(
  config: StatelessComponentConfig<any>
): Function {
  let ret: any = config.render.bind(null)

  ret.displayName = config.displayName

  if (config.memoize) {
    ret = memo(ret)
  }

  return ret
}

function createStatefulInternalComponent(
  config: StatefulComponentConfig<any>
): Function {
  let ret = function StatefulComponent(props: any) {

    const
      currPropsRef = useRef(props),
      isMountedRef =  useRef(false),
      states: any[] = useRef([]).current,
      contexts: any[] = useRef([]).current,
      [didUpdateNotifier] = useState(createNotifier),
      [willUnmountNotifier] = useState(createNotifier),

      [ctrl] = useState(() => {
        const
          getProps = () => currPropsRef.current

        return {
          consumeProps() {
            return getProps
          },

          handleState(initialState: any) {
            const idx = states.length

            states[idx] = [initialState, null]

            return [() => states[idx][0], (updater: any) => {
              states[idx][0] =
                typeof updater === 'function'
                  ? updater(states[idx][0])
                  : updater
              
              if (isMountedRef.current) {
                states[idx][1](updater)
              }
            }]
          },

          consumeContext(context: any) {
            const idx = contexts.length

            contexts[idx] = [context.Provider.__internal_defaultValue, context.Provider.__internal_context]

            return () => {
              return contexts[idx][0]
            }
          },

          onUpdate(subscriber: () => void): () => void {
            return didUpdateNotifier.subscribe(subscriber)
          },

          onUnmount(subscriber: () => void): () => void {
            return willUnmountNotifier.subscribe(subscriber)
          }
        }
      }),

    renderRef = useRef(null)
    currPropsRef.current = props

    useEffect(() => {
      isMountedRef.current = true
      didUpdateNotifier.notify()
    })

    useEffect(() => {
      return () => {
        didUpdateNotifier.clear()
        willUnmountNotifier.notify()
        willUnmountNotifier.clear()
      }
    }, [])

    if (!renderRef.current) {
      renderRef.current = config.init(ctrl as any) as any // TODO!!!
    }

    states.forEach(item => {
      const [value, setValue] = useState(item[0])

      item[0] = value
      item[1] = setValue
    })

    contexts.forEach(item => {
      try {
        item[0] = useContext(item[1])
      } catch {
        // TODO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      }
    })

    return (renderRef as any).current(props) // TODO
  }
  
  ;(ret as any).displayName = config.displayName

  if (config.memoize) {
    ret = memo(ret)
  }

  return ret
}

type Notifier = {
  notify(): void,
  subscribe(subscriber: () => void): () => void,
  clear(): void
}

type Subscriber = (() => void) | (() => Unsubscribe)
type Unsubscribe = () => void

function createNotifier(): Notifier {
  let
    subscriptions: ([Subscriber, Unsubscribe] | null)[] = [],
    isNotifying = false,
    changedWhileNotifying = false
    
  return {
    notify: () => {
      isNotifying = true

      try {
        subscriptions.forEach(([listener]) => listener && listener())
      } finally {
        isNotifying = false

        if (changedWhileNotifying) {
          changedWhileNotifying = false
          subscriptions = subscriptions.filter(it => it !== null)
        }
      }
    },

    subscribe(subscriber: Subscriber) {
      let listener: (Subscriber | null) = subscriber.bind(null)


      const unsubscribe = () => {
        if (listener !== null) {
          const index = subscriptions.findIndex(it => it && it[0] === listener)
          
          listener = null

          if (isNotifying) {
            subscriptions[index] = null
            changedWhileNotifying = true
          } else {
            subscriptions.splice(index, 1)
          }
        }
      }

      subscriptions.push([listener, unsubscribe])
      return unsubscribe
    },

    clear() {
      try {
        subscriptions.forEach(it => it && it[1]())
      } finally {
        subscriptions = []
      }
    }
  }
}
