import { setTimeout } from "timers";


// function sleep(timeout = 1) {
//   return new Promise((resolve, reject) => {
//     return setTimeout(resolve, timeout);
//   });
// }
function getTimestamp() {
  return new Date().getTime();
}

export default class RateLimit {
  constructor({amountOfCalls, timePeriod}) {
    this.queue = [];
    this.callPeriod = ((timePeriod * 1000) / amountOfCalls); // 400ms
    this.lastCalled = getTimestamp();
    this.time = 0; //(timePeriod * 1000); //TODO: need to fix the initial batch
  }
  sleep() {
    var promise = new Promise((resolve, reject) => {
      return this.queue.push(resolve);
    });
    if (!this.dispatcherRunning) {
      this.dispatcherRunning = true;
      setTimeout(() => this.dispatcher(), 10);
    }
    return promise;
  }
  dispatcher() {
    this.dispatcherRunning = true;
    if (this.queue.length > 0) {
      this.time += (getTimestamp() - this.lastCalled);
      this.lastCalled = getTimestamp();
      if (this.time > this.callPeriod) {
        this.time -= this.callPeriod;
        this.queue.pop()(); // execute awaiting promise;
      }
      if (this.queue.length > 0) {
        return setTimeout(() => this.dispatcher(), 10);
      }
    }
    this.dispatcherRunning = false;
    return undefined;
  }
}