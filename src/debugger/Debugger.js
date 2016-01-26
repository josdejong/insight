'use strict';

import React, { Component } from 'react';
import Immutable from 'seamless-immutable';
import { cloneDeep, reduce, isEqual } from 'lodash';
import Timeline from './Timeline';

export default class Debugger extends Component {
  constructor (props) {
    super(props);

    let start = new Date().valueOf();
    this.state = {
      start: start,
      end: start + 10 * 1000,  // 10 sec
      groups: Immutable([]),
      events: Immutable([])
    };

  }

  render() {
    let items = this.state.events.map(event => {
      let text = '?';
      let popover = null;

      if (event.type === 'network') {
        text = event.method.toUpperCase() + ' ' + event.url;
        popover = 'url: ' + event.method.toUpperCase() + ' ' + event.url + ', ' +
            'duration: ' + Math.round(event.duration) + 'ms';
      }
      if (event.type === 'state') {
        text = JSON.stringify(event.after);
        popover = 'before: ' + JSON.stringify(event.before) +
            ', after: ' + JSON.stringify(event.after)
      }
      if (event.type === 'method') {
        text = event.method;
        popover = 'return value: ' + event.result;
      }

      return {
        id: event.id,
        group: event.name,
        start: event.timestamp,
        end: event.duration ? (event.timestamp + event.duration) : undefined,
        text: text,
        popover: popover
        // TODO: workout popover information, show a nice table, or maybe better info in a side panel
      }
    });

    return <div className="debugger">
      <h1>Debugger</h1>
      <div className="debugger-menu">
        <input type="button" value="toggle orientation" onClick={this.toggleOrientation.bind(this)} />
      </div>
      <Timeline
          start={this.state.start}
          end={this.state.end}
          groups={this.state.groups}
          items={items}
          onChange={this.handleTimelineChange.bind(this)} />
    </div>;
  }

  monitorRestClient (restClient) {
    this.setState({
      groups: this.state.groups.concat([{name: 'network'}])
    });

    Object.keys(restClient)
        .forEach(name => {
          let originalMethod = restClient[name];

          if (typeof originalMethod === 'function') {
            restClient[name] = this.createMonitoredRestMethod(name, originalMethod);
          }
        });
  }

  /**
   * Monitor changes in the state of a React Component
   * @param {Component} component
   * @param {Array.<string>} names  The names of the variables in the state to be monitored
   */
  monitorState (component, names) {
    // add new groups to the timeline, one for each monitored state
    let groups = names.map(name => {
      return {name};
    });
    this.setState({
      groups: this.state.groups.concat(groups)
    });

    // listen for changes in the state, and emit debugger events on changes
    let original = (component.componentWillUpdate || function () {}).bind(component);
    component.componentWillUpdate = (nextProps, nextState) => {

      names.forEach(name => {
        let before = component.state[name];
        let after = nextState[name];
        this.compareState(name, before, after);
      });

      original(nextProps, nextState);
    };

    // emit events for the current state
    names.forEach(name => {
      this.compareState(name, undefined, component.state[name]);
    });
  }

  /**
   * Monitor method calls of a React Component
   * @param {Component} component
   * @param {Array.<string>} methods  The names of the methods to be monitored
   */
  monitorMethods (component, methods) {
    // add new groups to the timeline, one for each monitored state
    //let groups = methods.map(method => {
    //  return {method};
    //});
    this.setState({
      groups: this.state.groups.concat([{name: 'method'}])
    });

    // replace the methods with a monitored method
    methods.forEach(name => {
      let originalMethod = component[name].bind(component);
      component[name] = this.createMonitoredMethod(name, originalMethod)
    });
  }

  /**
   * Compare whether a variable in a components state is changed and if so,
   * emit a new debugger event.
   * @param name
   * @param before
   * @param after
   */
  compareState(name, before, after) {
    let changed = !isEqual(before, after);
    if (changed) {
      let event = Immutable({
        id: createId(),
        type: 'state',
        timestamp: Date.now(),
        name: name,
        before: cloneDeep(before),
        after: cloneDeep(after)
      });

      this.setState({events: this.state.events.concat(event)});

      console.log('state event', event);
    }
  }

  createMonitoredRestMethod (name, originalMethod) {
    let debuggr = this;

    return function (url, body) {
      let eventId = createId();
      let start = Date.now();
      let tempEvent = Immutable({
        id: eventId,
        type: 'network',
        timestamp: start,
        name: 'network',
        method: name,
        url: url,
        body: body
      });
      debuggr.setState({events: debuggr.state.events.concat(tempEvent)});

      function finish (response) {
        let end = Date.now();
        let finalEvent = tempEvent.merge({
          duration: end - start,
          response: response
        });

        // replace the temp event with the final event
        debuggr.setState({events: debuggr.state.events.map(event => {
          return event.id === eventId ? finalEvent : event;
        })});

        console.log('network event', finalEvent);
      }

      let result = originalMethod(url, body);

      if (isPromise(result)) {
        // in case of a promise, wait until resolved
        return result
            .then(function (response) {
              finish(response);
              return response;
            })
            .catch(function (err) {
              finish(err);
              throw err;
            })
      }
      else {
        finish();
        return result;
      }
    }
  }

  // TODO: merge and generalize createMonitoredMethod and createMonitoredRestMethod
  createMonitoredMethod (name, originalMethod) {
    let debuggr = this;

    return function () {
      let start = Date.now();

      // invoke the original method
      let result = originalMethod(...arguments);

      let end = Date.now();
      let event = Immutable({
        id: createId(),
        type: 'method',
        timestamp: start,
        //duration: end - start, // TODO: are we interested in duration of a method call here?
        name: 'method',
        method: name,
        // TODO: it's problematic to store events, cannot make them immutable, not stringifiable
        //args: argumentsToArray(arguments),
        result: result
        // TODO: stack
      });

      console.log('method event', event);
      setTimeout(() => {
        debuggr.setState({events: debuggr.state.events.concat(event)});
      }, 0);

      // TODO: if promise, await until it resolves and then finish the event

      return result;
    }
  }

  /**
   * Store changed state of the Timeline in our state
   * @param {{start: number, end: number}} timelineState
   */
  handleTimelineChange (timelineState) {
    this.setState(timelineState);
  }

  // TODO: rework orientation, it changes the orientation of the app itself
  toggleOrientation () {
    if (document.body.className === 'horizontal') {
      document.body.className = 'vertical';
    }
    else {
      document.body.className = 'horizontal';
    }
  }
}

/**
 * Convert an arguments "array" into a real Array
 * @param {Arguments} args
 * @return {Array}
 */
function argumentsToArray (args) {
  return Array.prototype.slice.call(args);
}

function isPromise (obj) {
  return obj &&
      typeof obj['then'] === 'function' &&
      typeof obj['catch'] === 'function';
}


function createId () {
  return ++_counter;
}
let _counter = 0;