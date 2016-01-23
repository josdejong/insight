'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './app/App';
import Debugger from './debugger/Debugger';

let app = <App />;
let debug = <Debugger component={app} />;

ReactDOM.render(app, document.getElementById('app'));
ReactDOM.render(debug, document.getElementById('debugger'));
