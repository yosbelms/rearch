import { ServiceContainer } from './service-container'

declare namespace window {
  const __REDUX_DEVTOOLS_EXTENSION__: {
    connect: (config?: object) => any
  }
}

function extractState(message) {
  if (!message || !message.state) {
    return void 0
  }
  if (typeof message.state === 'string') {
    return JSON.parse(message.state)
  }
  return message.state
}

const maxAge = 50

export function devtool(container: ServiceContainer): ServiceContainer {
  // do nothing for child
  if (container.isChild()) {
    return container
  }

  const DevTool = (
    typeof window !== 'undefined' && typeof window.__REDUX_DEVTOOLS_EXTENSION__ !== 'undefined'
      ? window.__REDUX_DEVTOOLS_EXTENSION__.connect({
        maxAge,
        shouldHotReload: false,
        features: {
          pause: true,
          lock: true,
          persist: false,
          export: true,
          import: 'custom',
          jump: true,
          skip: false,
          reorder: true,
          update: false,
          test: true
        }
      })
      : null
  )

  if (DevTool !== null) {
    let silence = false


    const listener = (container) => {
      const state = container.getState()
      if (!silence) {
        //args = args.slice()
        //const func = args[0]
        const hash = Math.random().toString(36).substring(7).split('').join('.')
        //const type = func.name || func.displayName || hash
        //args[0] = state
        DevTool.send({
          type: hash,
          args: [state]
        }, state)
      }
    }

    container.onSetState.subscribe(listener)
    container.onChildrenSetState.subscribe(listener)

    DevTool.subscribe((message) => {
      if (container.isChild()) {
        return
      }
      silence = true
      let promise: Promise<any>

      if (message && message.type) switch (message.type) {
        case 'START':
          const currentState = container.getState()
          DevTool.init(currentState)
          break
        case 'DISPATCH':
          if (message.payload) switch (message.payload.type) {
            case 'JUMP_TO_ACTION':
            case 'JUMP_TO_STATE':
              promise = container.setState(extractState(message) || container.getState())
              break
          }
          break
      }

      if (promise) {
        promise.then(() => (silence = false))
      } else {
        silence = false
      }

      //console.log(JSON.parse(message.state))
    })
  }

  return container
}