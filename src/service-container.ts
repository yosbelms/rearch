import { EventEmitter } from './event-emitter';
import { Service } from './service';
import { ConstructorOfService, hasOwn } from './util';

export class ServiceContainer {

  private readonly services: {
    [namespace: string]: Service
  } = {}

  public readonly onStateChange = new EventEmitter

  private _getService<ServiceType extends Service>(
    ServiceClass: ConstructorOfService<ServiceType>
  ): ServiceType {
    return this.services[(ServiceClass as any).namespace] as ServiceType
  }

  addService<ServiceType extends Service>(
    ServiceClass: ConstructorOfService<ServiceType>
  ): ServiceType {
    const namespace = (ServiceClass as any).namespace

    if (hasOwn.call(this.services, namespace)) {
      throw new Error(`The service ${namespace} has been already added`)
    }

    const service: ServiceType = new ServiceClass(this)

    if (typeof namespace !== 'string') {
      throw new Error('Invalid namespace')
    }

    this.services[namespace] = service

    service.onUpdateState.subscribe(_ => this.onStateChange.notifyListeners(this))

    return service as ServiceType
  }

  getService<ServiceType extends Service>(
    ServiceClass: ConstructorOfService<ServiceType>
  ): ServiceType {
    let service = this._getService<ServiceType>(ServiceClass)
    if (!service) {
      service = this.addService<ServiceType>(ServiceClass)
    }
    return service
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