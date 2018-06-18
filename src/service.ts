import { ServiceContainer } from '.'
import { EventEmitter } from './event-emitter'
import { ConstructorOf } from './util'

/** Base service class */
export class Service {

  public static namespace?: string

  public namespace?: string

  private serviceContainer: ServiceContainer

  public onUpdateState: EventEmitter

  public state: any

  constructor(serviceContainer: ServiceContainer) {
    this.onUpdateState = new EventEmitter()
    this.serviceContainer = serviceContainer
  }

  /* return a service intsnace*/
  getService<ServiceType extends Service>(ServiceClass: ConstructorOf<ServiceType>) {
    return this.serviceContainer.getService<ServiceType>(ServiceClass)
  }

  /* set service state */
  setState(updater: any): Promise<void> {
    return Promise.resolve().then(() => {
      if (typeof updater === 'function') {
        this.state = updater(this.state)
      } else {
        this.state = updater
      }
      this.onUpdateState.notifyListeners(this)
    })
  }

}
