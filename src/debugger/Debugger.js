import React from 'react';
import { Component } from 'react';

export default class Debugger extends Component {
  constructor (props) {
    super(props);

    this.state = {};
  }

  render() {
    return <div className="debugger">
      <h1>Debugger</h1>
    </div>;
  }
}
