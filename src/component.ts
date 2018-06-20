import * as PropTypes from 'prop-types'
import * as React from 'react'
import { Service, ServiceContainer } from '.'
import { ConstructorOf, shallowEqual, isArray } from './util'

const emptyObj = {}

/** Make a components to reset state if any af the services provided changes its state */
function observeServices(cmp: Component<any, any>, services: Service[]) {
  const reset = resetComponentState(cmp)
  cmp.serviceUnsubscribers = []

  services.forEach((Service: any) => {
    cmp.serviceUnsubscribers.push(cmp.getService(Service).onUpdateState.subscribe(reset))
  })
}

/** Resets component state */
function resetComponentState(cmp: Component<any, any>) {
  return () => cmp.setState((state) => (state || emptyObj))
}

/** Abstract Base Component which only consume services */
export class ServiceConsumerComponent<P = {}, S = {}> extends React.Component<P, S> {

  static contextTypes = {
    serviceContainer: PropTypes.any.isRequired
  }

  public serviceContainer: ServiceContainer

  constructor(props, context) {
    super(props, context)
    this.serviceContainer = context.serviceContainer
  }

  /** @see ServiceContainer.getService */
  getService<ServiceType extends Service>(ServiceClass: ConstructorOf<ServiceType>) {
    return this.serviceContainer.getService<ServiceType>(ServiceClass)
  }

}

/** Base Component */
export class Component<P = {}, S = {}> extends ServiceConsumerComponent<P, S> {

  public serviceUnsubscribers: any[]

  public observedServices: any[]

  private reducedServices: any[]

  componentDidMount() {
    this.reducedServices = this.selectStateToBeCompared()
    if (isArray(this.observedServices)) {
      observeServices(this, this.observedServices)
    }
  }

  componentWillUnmount() {
    if (isArray(this.observedServices)) {
      this.serviceUnsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }

  /** Select the part of data of to be compared before ach update */
  selectStateToBeCompared(): any[] {
    if (isArray(this.observedServices)) {
      return this.observedServices.map(Service => this.getService(Service).state)
    }
  }

  shouldComponentUpdate(_, __) {
    if (!isArray(this.observedServices)) {
      return true
    }

    const reducedServices: any[] = this.selectStateToBeCompared()

    const should = reducedServices.reduce((shd, a, idx) =>
      shd || !shallowEqual(a, this.reducedServices[idx]), false)

    if (should) {
      this.reducedServices = reducedServices
    }

    return should
  }

}
