
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

    return <div className="timeline-item timeline-item-point timeline-popover-anchor" style={style}>
      <div className="timeline-item-point-contents">{this.props.text}</div>
      {
        this.props.popover
            ? <div className="timeline-popover timeline-below">
                {this.props.popover}
              </div>
            : null
      }
    </div>
  }

  renderRange () {
    let style = {
      left: this.props.timeToScreen(this.props.start),
      right: this.props.timeToScreen(this.props.end, 'right'),
      color: 'white',
      backgroundColor: this.props.color
    };

    return <div className="timeline-item timeline-item-range timeline-popover-anchor" style={style}>
      <div className="timeline-item-range-contents">{this.props.text}</div>
      {
        this.props.popover
            ? <div className="timeline-popover timeline-below">
                {this.props.popover}
              </div>
            : null
      }
    </div>
  }
}