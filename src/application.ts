import * as PropTypes from 'prop-types';
import * as React from 'react';
import { ServiceContainer } from './service-container';

export function Application(
  serviceContainer: ServiceContainer = new ServiceContainer()
) {
  return class Application extends React.Component {

    static propTypes = {
      children: PropTypes.any.isRequired
    }

    static childContextTypes = {
      serviceContainer: PropTypes.any.isRequired
    }

    public serviceContainer: ServiceContainer = serviceContainer

    getChildContext() {
      return {
        serviceContainer: this.serviceContainer
      }
    }

    render(): any {
      return this.props.children
    }

  }
}