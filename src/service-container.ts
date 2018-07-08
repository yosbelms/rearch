import { EventEmitter } from './event-emitter'
import { Service } from './service'
import { ConstructorOf, hasOwn } from './util'

export interface ServiceGetter {
  <ServiceType extends Service>(ServiceClass: ConstructorOf<ServiceType>): ServiceType
}

/** Contains and manages service instances */
export class ServiceContainer {

  /** Registry of service instances */
  private readonly services: {
    [key: string]: Service
  } = {}

  public readonly onSetState = new EventEmitter

  /** Returns a service instance */
  private _getService<ServiceType extends Service>(
    ServiceClass: ConstructorOf<ServiceType>
  ): ServiceType {
    return this.services[(ServiceClass as any).key] as ServiceType
  }

  /** Register a service */
  addService<ServiceType extends Service>(
    ServiceClass: ConstructorOf<ServiceType>
  ): ServiceType {
    // key from static props
    let key = (ServiceClass as any).key

    if (hasOwn.call(this.services, key)) {
      throw new Error(`The service ${key} has been already added`)
    }

    const service: ServiceType = new ServiceClass(this)

    // get key from instance
    // if (!key) {
    //   key = (service as any).key
    // }

    if (typeof key !== 'string') {
      throw new Error('Invalid key')
    }

    this.services[key] = service

    service.onSetState.subscribe(_ => this.onSetState.notifyListeners(this))

    return service as ServiceType
  }

  /** Return a service instance. Tries to register it if doesn't exists */
  getService: ServiceGetter = <ServiceType extends Service>(
    ServiceClass: ConstructorOf<ServiceType>
  ): ServiceType => {
    let service = this._getService<ServiceType>(ServiceClass)
    if (!service) {
      service = this.addService<ServiceType>(ServiceClass)
    }
    return service
  }

  /** Set service container state */
  setState(state: any) {
    return Object.keys(this.services).forEach(key => {
      const service = this.services[key]
      if (service) {
        service.setState(state[key])
      }
    })
  }

  /** Return service container state */
  getState(): {
    [key: string]: any
  } {
    return Object.keys(this.services).reduce((acc, key) => {
      acc[key] = this.services[key].state
      return acc
    }, {})
  }
}