import * as PropTypes from 'prop-types'
import * as React from 'react'
import { ServiceContainer } from './service-container'

/** Scope */
export class Scope extends React.Component<
  {
    namespace?: string,
    serviceContainer?: ServiceContainer,
    onInit?: (serviceContainer: ServiceContainer) => void,
    onDestroy?: (serviceContainer: ServiceContainer) => void,
    onChange?: (serviceContainer: ServiceContainer) => void,
  }
  > {

  static propTypes = {
    namespace: PropTypes.string,
    children: PropTypes.any.isRequired,
    serviceContainer: PropTypes.instanceOf(ServiceContainer),
    onInit: PropTypes.func,
    onDestroy: PropTypes.func,
    onChange: PropTypes.func
  }

  static childContextTypes = {
    serviceContainer: PropTypes.instanceOf(ServiceContainer)
  }

  static contextTypes = {
    serviceContainer: PropTypes.any
  }

  public serviceContainer: ServiceContainer

  private serviceContainerUnsubscriber

  constructor(props, context) {
    super(props, context)

    // if a service container comes in the context
    // is because it is a child so it must have `namespace`
    this.serviceContainer = this.props.serviceContainer || new ServiceContainer()
    const parentServiceContainer: ServiceContainer = context.serviceContainer
    const namespace: string = props.namespace
    if (parentServiceContainer) {
      if (typeof namespace !== 'string' || namespace === '') {
        throw 'the "namespace" property of a children scope must be a non empty string'
      }
      //parentServiceContainer.appendChild(this.serviceContainer, props.namespace)
      this.serviceContainer.appendTo(parentServiceContainer, props.namespace)
    }

    const onInit = this.props.onInit
    const onChange = this.props.onChange
    if (typeof onInit === 'function') onInit(this.serviceContainer)
    if (typeof onChange === 'function') {
      this.serviceContainerUnsubscriber = this.serviceContainer.onStateChange.subscribe(onChange)
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
    if (typeof this.serviceContainerUnsubscriber === 'function') this.serviceContainerUnsubscriber()
    this.serviceContainer.destroy()
  }

  render() {
    return this.props.children
  }

}
