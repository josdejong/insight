'use strict';

import React, { Component } from 'react';
import Immutable from 'seamless-immutable';
import { clone, cloneDeep, reduce, isEqual } from 'lodash';

export default class Debugger extends Component {
  constructor (props) {
    super(props);

    this.state = {
      events: Immutable([])
    };

    // store the original methods which the debugger will override
    this.restClient = null;
    this.component = null;
    this.original = {
      restClient: {},
      component: {}
    };
  }

  render() {
    return <div className="debugger">
      <h1>Debugger</h1>
      <div>
        {
          this.state.events.asMutable().map(event => {
            var limited = cloneDeep(event);
            limited.stateBefore = undefined;
            limited.stateAfter = undefined;
            limited.body = undefined;
            limited.response = undefined;
            return <pre key={event.id}>{JSON.stringify(limited, null, 2)}</pre>
          })
        }
      </div>
    </div>;
  }

  monitorRestClient (restClient) {
    this.restClient = restClient;
    Object.keys(restClient)
        .forEach(name => {
          var originalMethod = restClient[name];

          if (typeof originalMethod === 'function') {
            this.original.restClient[name] = originalMethod;
            restClient[name] = this.overrideRestMethod(name, originalMethod);
          }
        });
  }

  monitorComponent (component) {
    if (this.component) {
      throw new Error('Sorry, can only monitor one component...');
    }

    this.component = component;
    this.monitorState(component);
  }

  monitorState (component) {
    let original = (component.componentWillUpdate || function () {}).bind(component);
    this.original.component.componentWillUpdate = original;
    component.componentWillUpdate = (nextProps, nextState) => {
      var event = {
        id: createId(),
        timestamp: Date.now(),
        object: 'component',
        method: 'setState',
        stateBefore: cloneDeep(component.state)
      };

      original(nextProps, nextState);

      //setTimeout(() => { // get stateAfter on next tick, else it's not yet updated  TODO: test if that's still true
        event.stateAfter = cloneDeep(nextState);
        event.changes = _.reduce(event.stateAfter, function(result, value, key) {
          return isEqual(value, event.stateBefore[key])
              ? result
              : result.set(key, value);
        }, Immutable({}));

        this.setState({events: this.state.events.concat(event)});
      //}, 0)
    }
  }


  overrideRestMethod (name, originalMethod) {
    let debuggr = this;

    return function (url, body) {
      let start = Date.now();
      let event = Immutable({
        id: createId(),
        timestamp: start,
        object: 'network',
        method: name,
        url: url,
        body: body
      });
      debuggr.setState({events: debuggr.state.events.concat(event)});

      function finish (response) {
        var end = Date.now();
        var finalEvent = event.merge({
          duration: end - start,
          response: response
        });

        // replace the final event
        debuggr.setState({events: debuggr.state.events.map(event => {
          return event.id === finalEvent.id ? finalEvent : event;
        })});
      }

      var res = originalMethod(url, body);

      if (isPromise(res)) {
        // in case of a promise, wait until resolved
        return res
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
        return res;
      }
    }
  }

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