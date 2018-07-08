import * as PropTypes from 'prop-types'
import * as React from 'react'
import { Service, ServiceContainer } from '.'
import { ConstructorOf, shallowEqual, isArray } from './util'
import { ServiceGetter } from './service-container';

export interface ComponentSpec {
  observedServices?: ConstructorOf<Service>[]
  selectStateToCompare?: (getService: ServiceGetter) => any[]
}

const emptyObj = {}

/** Request a component to render by setting the state
   #React.Component -> () -> void */
function requestComponentRender(component: React.Component) {
  return () => component.setState((state) => (state || emptyObj))
}

/** Takes a list of service classes ang a service getter function and returns a list of its states
    #ConstructorOf<Service>[] -> ServiceGetter -> any[] */
function createSelectStateToCompare(services: ConstructorOf<Service>[]) {
  return (getService: ServiceGetter) => services.map(Service => getService(Service).state)
}

export function component<P>(
  spec: ComponentSpec,
  WrappedComponent: React.ComponentType<P>
): React.ComponentType<Partial<P>> {

  const wrappedComponentName = WrappedComponent.displayName
    || WrappedComponent.name
    || 'Component'

  // Higher order component
  // minimal HOC which only consumes data from services
  class HOC extends React.Component<P> {

    static contextTypes = {
      serviceContainer: PropTypes.any.isRequired
    }

    public serviceContainer: ServiceContainer

    public unsubscribers?: any[]

    public observedServices?: any[]

    public selectedStateToCompare?: any[]

    constructor(props, context) {
      super(props, context)
      this.serviceContainer = context.serviceContainer
    }

    render() {
      return React.createElement(WrappedComponent, {
        ...this.props as any,
        getService: this.serviceContainer.getService
      })
    }

  }

  spec = spec || {}

  // augment the HOC only if there is observed services
  if (spec && isArray(spec.observedServices) && spec.observedServices.length > 0) {
    Object.assign(HOC.prototype, {
      ...HOC.prototype,

      selectedStateToCompare: new Array(),

      observeServices: spec.observedServices,

      /** Select the part of data to be compared to decide when to re-render a component */
      selectStateToCompare: (
        typeof spec.selectStateToCompare === 'function'
          ? spec.selectStateToCompare
          : createSelectStateToCompare(spec.observedServices)
      ),

      componentDidMount() {
        if (!isArray(this.observedServices)) {
          return
        }

        // initialize `selectedStateToCompare`
        this.selectedStateToCompare = this.selectStateToCompare(this.serviceContainer.getService)

        // Make a components to reset state if any af the services provided changes its state
        const rcr = requestComponentRender(this as any)
        const unsubscribers: any[] = []

        this.observedServices.forEach((Service: any) => {
          unsubscribers.push(
            // subscribe to the `onSetState` event on each services
            this.serviceContainer.getService(Service).onSetState.subscribe(rcr))
        })

        this.unsubscribers = unsubscribers
      },

      componentWillUnmount() {
        // destroy everything to prevent memory leaks
        if (isArray(this.unsubscribers)) {
          this.unsubscribers.forEach(unsubscribe => unsubscribe())
        }
        delete this.serviceContainer
        delete this.unsubscribers
        delete this.selectedStateToCompare
        delete this.observeServices
      },

      shouldComponentUpdate(_, __) {
        if (!isArray(this.observedServices)) {
          return true
        }

        let should = false
        const nextSelectedState = this.selectStateToCompare(this.serviceContainer.getService)

        if (isArray(nextSelectedState)) {
          // check current values in the list are shallow-equal to the next values
          should = nextSelectedState.reduce((shd, a, idx) =>
            shd || !shallowEqual(a, this.selectedStateToCompare[idx] as any[]), false)
        }

        if (should) {
          // set selected state
          this.selectedStateToCompare = nextSelectedState
        }

        return should
      }
    })
  }

  (HOC as any).displayName = `HOC(${wrappedComponentName})`

  return HOC
}
