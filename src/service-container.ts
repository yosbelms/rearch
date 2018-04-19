import { Service } from './service'
import { EventEmitter } from './event-emitter';

export class ServiceContainer {

  private readonly services: {
    [namespace: string]: Service
  } = {}

  public readonly onStateChange = new EventEmitter

  getService<ServiceType extends Service>(ServiceClass: any): ServiceType {
    return this.services[ServiceClass.namespace] as ServiceType
  }

  addService<ServiceType extends Service>(ServiceClass: any): ServiceType {
    const service: ServiceType = new ServiceClass()
    
    const namespace = ServiceClass.namespace

    if (typeof namespace !== 'string') {
      throw new Error('Invalid namespace')
    }

    this.services[namespace] = service

    service.onUpdateState.subscribe(_ => this.onStateChange.notifyListeners(this))

    return service as ServiceType
  }

  setState(state: any) {
    return Object.keys(this.services).forEach(namespace => {
      const service = this.services[namespace]
      if (service) {
        service.setState(state[namespace])
      }
    })
  }

  getState(): {
    [namespace: string]: any
  } {
    return Object.keys(this.services).reduce((acc, namespace) => {
      acc[namespace] = this.services[namespace].state
      return acc
    }, {})
  }

}
