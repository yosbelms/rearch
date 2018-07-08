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

    container.onSetState.subscribe((container) => {
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
    })

    DevTool.subscribe((message) => {
      silence = true
      if (message && message.type) switch (message.type) {
        case 'START':
          DevTool.init(container.getState())
          break
        case 'DISPATCH':
          if (message.payload) switch (message.payload.type) {
            case 'JUMP_TO_ACTION':
            case 'JUMP_TO_STATE':
              container.setState(extractState(message) || container.getState())
              break
          }
          break
      }
      silence = false
      //console.log(JSON.parse(message.state))
    })
  }

  return container
}