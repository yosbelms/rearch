import { EventEmitter } from './event-emitter'
import { Service } from './service'
import { ConstructorOf, hasOwn } from './util'

/** Contains and manages service instances */
export class ServiceContainer {

  /** Registry of service instances */
  private readonly services: {
    [namespace: string]: Service
  } = {}

  public readonly onStateChange = new EventEmitter

  /** Returns a service instance */
  private _getService<ServiceType extends Service>(
    ServiceClass: ConstructorOf<ServiceType>
  ): ServiceType {
    return this.services[(ServiceClass as any).namespace] as ServiceType
  }

  /** Register a service */
  addService<ServiceType extends Service>(
    ServiceClass: ConstructorOf<ServiceType>
  ): ServiceType {
    // namespace from static props
    let namespace = (ServiceClass as any).namespace

    if (hasOwn.call(this.services, namespace)) {
      throw new Error(`The service ${namespace} has been already added`)
    }

    const service: ServiceType = new ServiceClass(this)

    // get namespace from instance
    // if (!namespace) {
    //   namespace = (service as any).namespace
    // }

    if (typeof namespace !== 'string') {
      throw new Error('Invalid namespace')
    }

    this.services[namespace] = service

    service.onUpdateState.subscribe(_ => this.onStateChange.notifyListeners(this))

    return service as ServiceType
  }

  /** Return a service instance. Tries to register it if doesn't exists */
  getService<ServiceType extends Service>(
    ServiceClass: ConstructorOf<ServiceType>
  ): ServiceType {
    let service = this._getService<ServiceType>(ServiceClass)
    if (!service) {
      service = this.addService<ServiceType>(ServiceClass)
    }
    return service
  }

  /** Set service container state */
  setState(state: any) {
    return Object.keys(this.services).forEach(namespace => {
      const service = this.services[namespace]
      if (service) {
        service.setState(state[namespace])
      }
    })
  }

  /** Return service container state */
  getState(): {
    [namespace: string]: any
  } {
    return Object.keys(this.services).reduce((acc, namespace) => {
      acc[namespace] = this.services[namespace].state
      return acc
    }, {})
  }
}