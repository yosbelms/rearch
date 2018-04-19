import * as PropTypes from 'prop-types';
import * as React from 'react';
import { Service } from './service';
import { shallowEqual } from './util';
import { ServiceAware } from './service-aware';

export function Module<
  ServiceType extends Service,
  PropsType = {},
  StateType = {}
  >(ServiceClass: new () => ServiceType) {

  // return new module
  return class Module extends ServiceAware<
    ServiceType,
    PropsType,
    StateType
  >(ServiceClass, React.Component) {

    static contextTypes = {
      serviceContainer: PropTypes.any.isRequired
    }

    public unsubscribeFromService: Function

    constructor(props, context) {
      super(props, context)
      this.state = this.mapState()
      this.unsubscribeFromService = this.service.onUpdateState.subscribe(
        this.resetComponentState.bind(this))
    }

    mapState(): any {
      return this.service.state
    }

    resetComponentState() {
      this.setState(() => this.mapState())
    }

    componentWillUnmount() {
      this.unsubscribeFromService()
    }

    shouldComponentUpdate(_, nextState) {
      return !shallowEqual(this.state, nextState)
    }
  }
}