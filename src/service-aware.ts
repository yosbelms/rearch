import * as PropTypes from 'prop-types';
import * as React from 'react';
import { Service } from './service';
import { ServiceContainer } from './service-container';

export function ServiceAware<
  ServiceType extends Service,
  PropsType = {},
  StateType = {}
  >(
    ServiceClass: new () => ServiceType,
    ComponentClass: (
      new (props: any, context: any) => React.Component<PropsType, StateType>
    )
  ) {

  // return new module
  return class ServiceAware extends ComponentClass {

    public readonly ServiceClass = ServiceClass

    static contextTypes = {
      serviceContainer: PropTypes.any.isRequired
    }

    public service: ServiceType

    constructor(
      props,
      context: { serviceContainer: ServiceContainer }
    ) {
      super(props, context)
      this.service = context.serviceContainer.getService(this.ServiceClass)
      if (!this.service) {
        this.service = context.serviceContainer.addService(this.ServiceClass)
      }
    }
  }
}