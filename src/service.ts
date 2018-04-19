import { EventEmitter } from './event-emitter';

export class Service {

  public static namespace?: string

  public onUpdateState: EventEmitter

  public state: any

  constructor() {
    this.onUpdateState = new EventEmitter()
  }

  setState(newState: any) {
    this.state = newState
    this.onUpdateState.notifyListeners(this)
  }
}
