import { append, remove } from './util';

export class EventEmitter {

  private currentListeners: Function[] = []

  private nextListeners: Function[] = []

  /** Adds a listener to the state manager that will execute after each state update,
  returns a function that unsubscribes the recently subscribed listener if executed */
  subscribe(listener: Function) {
    this.nextListeners = append(this.nextListeners, listener)
    return () => this.unsubscribe(listener)
  }

  /** Removes a listener from the state manager */
  unsubscribe(listener: Function) {
    this.nextListeners = remove(this.currentListeners, listener)
  }

  /** Executes all subscribed currentListeners passing the provided state as argument */
  notifyListeners(...args: any[]) {
    this.currentListeners = this.nextListeners
    this.currentListeners.forEach(listener => {
      listener(...args)
    })
  }
}