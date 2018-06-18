import * as PropTypes from 'prop-types'
import * as React from 'react'
import { ServiceContainer } from './service-container'

/** Scope */
export class Scope extends React.Component<
  {
    serviceContainer?: ServiceContainer,
    onInit?: (serviceContainer: ServiceContainer) => void,
    onDestroy?: (serviceContainer: ServiceContainer) => void,
    onChange?: (serviceContainer: ServiceContainer) => void,
  }
  > {

  static propTypes = {
    children: PropTypes.any.isRequired,
    serviceContainer: PropTypes.instanceOf(ServiceContainer),
    onInit: PropTypes.func,
    onDestroy: PropTypes.func,
    onChange: PropTypes.func
  }

  static childContextTypes = {
    serviceContainer: PropTypes.instanceOf(ServiceContainer)
  }

  public serviceContainer: ServiceContainer

  private serviceContainerSubscription

  constructor(props, context) {
    super(props, context)
    this.serviceContainer = this.props.serviceContainer || new ServiceContainer()

    const onInit = this.props.onInit
    const onChange = this.props.onChange
    if (typeof onInit === 'function') onInit(this.serviceContainer)
    if (typeof onChange === 'function') {
      this.serviceContainerSubscription = this.serviceContainer.onStateChange.subscribe(onChange)
    }
  }

  getChildContext() {
    return {
      serviceContainer: this.serviceContainer
    }
  }

  componentWillUnmount() {
    const onDestroy = this.props.onDestroy
    if (typeof onDestroy === 'function') onDestroy(this.serviceContainer)
    if (typeof this.serviceContainerSubscription === 'function') this.serviceContainerSubscription()
  }

  render() {
    return this.props.children
  }

}
