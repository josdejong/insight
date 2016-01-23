'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './app/App';
import restClient from './app/rest/restClient';
import Debugger from './debugger/Debugger';

let debuggr = ReactDOM.render(<Debugger />, document.getElementById('debugger'));
debuggr.monitorRestClient(restClient);

let app = ReactDOM.render(<App />, document.getElementById('app'));
debuggr.monitorComponent(app);

function trace() {
  return new Error().stack.split('\n')
}

function add() {

}


function test() {
  add();
}
