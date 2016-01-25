
import React, { Component } from 'react';

export default class TimelineItem extends Component {
  render () {
    if (this.props.end !== undefined) {
      return this.renderRange();
    }
    else {
      return this.renderPoint();
    }
  }

  renderPoint () {
    let style = {
      left: this.props.timeToScreen(this.props.start),
      width: 2,
      overflow: 'visible',
      backgroundColor: this.props.color
    };

    return <div className="timeline-item timeline-item-point" style={style}>
      <span className="timeline-item-inner">{this.props.text}</span>
    </div>
  }

  renderRange () {
    let style = {
      left: this.props.timeToScreen(this.props.start),
      right: this.props.timeToScreen(this.props.end, 'right'),
      color: 'white',
      backgroundColor: this.props.color
    };

    return <div className="timeline-item timeline-item-range" style={style}>
      {this.props.text}
    </div>
  }
}