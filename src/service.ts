import { ServiceContainer } from '.';
import { EventEmitter } from './event-emitter';
import { ConstructorOfService } from './util';

export class Service {

  public static namespace?: string

  private serviceContainer: ServiceContainer

  public onUpdateState: EventEmitter

  public state: any

  constructor(serviceContainer: ServiceContainer) {
    this.onUpdateState = new EventEmitter()
    this.serviceContainer = serviceContainer
  }

  getService<ServiceType extends Service>(ServiceClass: ConstructorOfService<ServiceType>) {
    return this.serviceContainer.getService<ServiceType>(ServiceClass)
  }

  setState(newState: any) {
    this.state = newState
    this.onUpdateState.notifyListeners(this)
  }
}
