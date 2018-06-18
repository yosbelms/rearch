import { append, remove } from './util'

export class EventEmitter {

  private currentListeners: Function[] = []

  private nextListeners: Function[] = []

  /** Adds a listener, returns a function that unsubscribes the recently subscribed listener if executed */
  subscribe(listener: Function) {
    this.nextListeners = append(this.nextListeners, listener)
    return () => this.unsubscribe(listener)
  }

  /** Removes a listener */
  unsubscribe(listener: Function) {
    this.nextListeners = remove(this.currentListeners, listener)
  }

  /** Executes all subscribed currentListeners passing the provided arguments */
  notifyListeners(...args: any[]) {
    this.currentListeners = this.nextListeners
    this.currentListeners.forEach(listener => {
      listener(...args)
    })
  }
}