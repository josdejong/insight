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
    let items = this.state.events.map(event => ({
      id: event.id,
      group: event.name,
      start: event.timestamp,
      end: event.duration ? (event.timestamp + event.duration) : undefined,
      text: event.name == 'network'
          ? event.method.toUpperCase() + ' ' + event.url
          : JSON.stringify(event.after)
    }));

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
            restClient[name] = this.overrideRestMethod(name, originalMethod);
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
        timestamp: Date.now(),
        name: name,
        before: cloneDeep(before),
        after: cloneDeep(after)
      });

      this.setState({events: this.state.events.concat(event)});

      console.log('event', event);
    }
  }

  overrideRestMethod (name, originalMethod) {
    let debuggr = this;

    return function (url, body) {
      let start = Date.now();
      let tempEvent = Immutable({
        id: createId(),
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

        // replace the final event
        debuggr.setState({events: debuggr.state.events.map(event => {
          return event.id === finalEvent.id ? finalEvent : event;
        })});

        console.log('event', finalEvent);
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

// TODO: cleanup, redundant
function getChanges(oldState, newState) {
  return reduce(newState, function(result, value, key) {
    return isEqual(value, oldState[key])
        ? result
        : result.set(key, value);
  }, Immutable({}));
}


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