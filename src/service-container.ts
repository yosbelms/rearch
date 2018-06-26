import { EventEmitter } from './event-emitter'
import { Service } from './service'
import { ConstructorOf, hasOwn, MapOf } from './util'

export interface StateStransfer {
  '@@services': MapOf<any>
  '@@children': MapOf<any>
}

const SERVICES_KEY = '@@services'
const CHILDREN_KEY = '@@children'

/** Contains and manages service instances */
export class ServiceContainer {

  /** Registry of service instances */
  private readonly services: MapOf<Service> = {}

  public readonly onStateChange = new EventEmitter

  public readonly onChildrenStateChange = new EventEmitter

  private readonly children: MapOf<ServiceContainer> = {}

  private readonly unsubscribers: any[] = []

  private parent: ServiceContainer

  appendChild(child: ServiceContainer, namespace: string) {
    if (this.children[namespace] !== void 0) {
      throw `The namespace '${namespace}' is already being used by another service container`
    }
    this.children[namespace] = child
  }

  appendTo(parent: ServiceContainer, namespace: string) {
    parent.appendChild(this, namespace)
    this.parent = parent
    const notifyParent = () => {
      this.parent.onChildrenStateChange.notifyListeners(this.parent)
    }
    this.unsubscribers.push(this.onStateChange.subscribe(notifyParent))
    this.unsubscribers.push(this.onChildrenStateChange.subscribe(notifyParent))
  }

  isChild(): boolean {
    return !!this.parent
  }

  destroy() {
    // unsubscribe
    this.unsubscribers.forEach(unsub => unsub())
    // destroy children
    Object.keys(this.children).forEach(ns => this.children[ns].destroy())
  }

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
      //throw new Error(`The service ${namespace} has been already added`)
    }

    const service: ServiceType = new ServiceClass(this)

    if (typeof namespace !== 'string') {
      throw new Error('Invalid key')
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
  setState(stateTransfer: StateStransfer): Promise<any> {
    // debugger
    // setup services
    const promises = []

    Object.keys(this.services).forEach(namespace => {
      const service = this.services[namespace]
      if (service) {
        promises.push(service.setState(stateTransfer[SERVICES_KEY][namespace]))
      }
    })

    // setup children
    Object.keys(this.children).forEach(namespace => {
      const child = this.children[namespace]
      if (child) {
        promises.push(child.setState(stateTransfer[CHILDREN_KEY][namespace]))
      }
    })

    return Promise.all(promises)
  }

  /** Return service container state */
  getState(): StateStransfer {
    const services = Object.keys(this.services).reduce((acc, namespace) => {
      acc[namespace] = this.services[namespace].state
      return acc
    }, {})

    const children = Object.keys(this.children).reduce((acc, namespace) => {
      acc[namespace] = this.children[namespace].getState()
      return acc
    }, {})

    return {
      [SERVICES_KEY]: services,
      [CHILDREN_KEY]: children
    }
  }
}