
import React, { Component } from 'react';
import moment from 'moment';
import Hammer from 'react-hammerjs';
import { union } from 'lodash';
import TimelineItem from './TimelineItem';
import TimeStep from './TimeStep';

const COLORS = [
  '#3366CC', '#DC3912', '#FF9900', '#109618',
  '#990099', '#0099C6', '#DD4477', '#66AA00',
  '#B82E2E', '#316395', '#994499', '#22AA99',
  '#AAAA11', '#6633CC', '#E67300', '#8B0707'
];

/**
 * Usage:
 *
 * <Timeline
 *      start={number | Date}
 *      end={number | Date}
 *      groups={Array.<{name: string}>}
 *      items={Array.<{id: string, start: number | Date, end: number | Date | undefined, group: string, text: string | Component, popover: string | Component>}
 *      onChange={function(start, end) } />
 */
export default class Timeline extends Component {
  render() {
    let groups = this.getGroupProperties();
    let timelineHeight = 40 * (groups.length + 2);

    return <Hammer
        onPanStart={this.handlePanStart.bind(this)}
        onPan={this.handlePan.bind(this)}
        onPinch={this.handlePinch.bind(this)} >
    <div className="timeline" style={{height: timelineHeight}} >
        <div className="timeline-contents" ref="contents" >
          { this.renderAxis() }
          { groups.map(this.renderGroup.bind(this)) }
        </div>
        <div className="timeline-groups">
          { groups.map(this.renderGroupLabel.bind(this)) }
        </div>
        <div className="timeline-right-side"></div>
        <div className="timeline-menu">
          <input type="button" value="Now" onClick={this.goToNow.bind(this)} title="Go to the current time"/>
          <input type="button" value="Fit" onClick={this.fit.bind(this)} title="Fit all items in the viewport"/>
        </div>
      </div>
    </Hammer>;

    // TODO: render a red vertical line at the current time
  }

  renderAxis () {
    let labelTimes = [];

    let start = this.props.start.valueOf();
    let end = this.props.end.valueOf();
    let step = (end - start) / 20;
    let total = 0;
    let MAX = 100;
    let timeStep = new TimeStep(start, end, step);

    timeStep.start();
    while (timeStep.hasNext() && total < MAX) {
      let time = timeStep.getCurrent().valueOf();
      labelTimes.push({
        time,
        x: this.timeToScreen(time),
        label: timeStep.getLabel(time)
      });
      timeStep.next();
      total++;
    }


    return <div className="timeline-axis">
      <div className="timeline-axis-grids">
        {
          labelTimes.map((entry, index) => {
            return <div
                key={index}
                className="timeline-axis-grid"
                style={{left: entry.x}}></div>
          })
        }
      </div>
      <div className="timeline-axis-labels">
        {
          labelTimes.map((entry, index) => {
            return <div
                key={index}
                className="timeline-axis-label"
                title={new Date(entry.time).toString()}
                style={{left: entry.x}}>
                  {entry.label}
            </div>
          })
        }
      </div>

    </div>
  }

  renderGroupLabel (group, index) {
    let className = 'timeline-group timeline-group-label';
    if (index === 0) {
      className += ' timeline-group-first'
    }
    let groupStyle = {
      height: group.height,
      color: group.color
    };

    // TODO: make height variable
    return <div key={group.name} className={className} style={groupStyle}>
      {group.name}
    </div>;
  }

  renderGroup (group, index) {
    let className = 'timeline-group timeline-group-contents';
    if (index === 0) {
      className += ' timeline-group-first'
    }

    let data = this.props.items.filter(item => item.group === group.name);

    // TODO: make height variable
    return <div key={group.name} className={className} style={{height: group.height}}>
      {
          data.asMutable().map(item => {
            return <TimelineItem
                color={group.color}
                {...item}
                key={item.id}
                timeToScreen={this.timeToScreen.bind(this)} />
          })
      }
    </div>;
  }

  componentDidMount () {
    this.refs.contents.addEventListener('mousewheel', this.handleWheel.bind(this));
    this.refs.contents.addEventListener('DOMMouseScroll', this.handleWheel.bind(this)); // Firefox
  }

  getGroupProperties () {
    return this.props.groups.asMutable().map((group, index) => {
      return {
        name: group.name,
        color: COLORS[index % COLORS.length],
        height: 24 // TODO: when stacking is implemented, calculate the real height
      }
    });
  }

  handlePanStart () {
    panStartState = {
      start: this.props.start,
      end: this.props.end
    };
  }

  handlePan (event) {
    let contents = this.refs.contents;
    let width = contents.getBoundingClientRect().width;
    let timeDiff = (panStartState.start - panStartState.end) / width * event.deltaX;

    this.props.onChange({
      start: panStartState.start.valueOf() + timeDiff,
      end: panStartState.end.valueOf() + timeDiff
    });
  }

  handlePinch (event) {
    // TODO: implement support for pinch. Has to activate pinch in the Hammer config first
  }

  handleWheel (event) {
    // TODO: figure out how to use the onWheel event of React. Anyway, this works too the old fashioned way

    // retrieve delta
    let delta = 0;
    if (event.wheelDelta) { /* IE/Opera. */
      delta = event.wheelDelta / 120;
    } else if (event.detail) { /* Mozilla case. */
      // In Mozilla, sign of delta is different than in IE.
      // Also, delta is multiple of 3.
      delta = -event.detail / 3;
    }

    // If delta is nonzero, handle it.
    // Basically, delta is now positive if wheel was scrolled up,
    // and negative, if wheel was scrolled down.
    if (delta) {
      // perform the zoom action. Delta is normally 1 or -1

      // adjust a negative delta such that zooming in with delta 0.1
      // equals zooming out with a delta -0.1
      let scale;
      if (delta < 0) {
        scale = 1 - (delta / 5);
      }
      else {
        scale = 1 / (1 + (delta / 5)) ;
      }

      // calculate center, the date to zoom around
      let rect = this.refs.contents.getBoundingClientRect();
      let x = event.pageX - rect.left;

      this.zoom(scale, this.screenToTime(x));
    }
  }

  /**
   * Convert time to a horizontal position in pixels on the screen
   * @param {number} time
   * @param {'left' | 'right'} [side='left']
   * @return {string}  A percentage, like '75%'
   */
  timeToScreen(time, side) {
    let start = this.props.start.valueOf();
    let end = this.props.end.valueOf();
    if (side === 'right') {
      return 100 * ((end - time) / (end - start)) + '%'
    }
    else {
      return 100 * ((time - start) / (end - start)) + '%'
    }
  }

  /**
   * Convert a position in pixels on the screen to a time
   * @param {number} x
   * @return {number}
   */
  screenToTime(x) {
    let start = this.props.start.valueOf();
    let end = this.props.end.valueOf();
    let contents = this.refs.contents;
    let rect = contents.getBoundingClientRect();
    return start + x / rect.width * (end - start);
  }

  /**
   * Zoom in or out
   * @param {number} scale               For example 0.9 or 1.1
   * @param {number} [center=undefined]  An optional timestamp where to zoom around,
   *                                     typically the position of the mouse cursor
   */
  zoom (scale, center) {
    let start = this.props.start.valueOf();
    let end = this.props.end.valueOf();

    // if centerDate is not provided, take it half between start Date and end Date
    if (center == null) {
      center = (start + end) / 2;
    }

    // calculate new start and end
    this.props.onChange({
      start: center + (start - center) * scale,
      end: center + (end - center) * scale
    });
  };

  /**
   * Center the window such that given timestamp is at the center of the window
   * @param {number} time   A timestamp
   */
  moveTo (time) {
    // TODO: implement animation towards the new time
    let start = this.props.start.valueOf();
    let end = this.props.end.valueOf();

    let center = (start + end) / 2;
    let diff = time - center;

    this.props.onChange({
      start: start + diff,
      end: end + diff
    });
  }

  /**
   * Zoom the timeline such that all items fit
   */
  fit () {
    let range = this.getItemRange();
    if (range.start != null && range.end != null) {
      // add a bit of margin to the range
      let interval = range.end - range.start;

      this.props.onChange({
        start: Math.round(range.start - interval / 5),
        end:   Math.round(range.end + interval / 10)
      });
    }
  }

  // move to now
  goToNow () {
    this.moveTo(Date.now());
  }

  /**
   * Get the range of items in the timeline
   * @return {{start: null | number, end: null| number}}
   */
  getItemRange () {
    return this.props.items.reduce((range, item) => {
      let start = range.start;
      let end = range.end;

      if (range.start == null || item.start.valueOf() < start) {
        start = item.start.valueOf();
      }
      if (item.end !== undefined) {
        if (range.end == null || item.end.valueOf() > end) {
          end = item.end.valueOf();
        }
      }
      else {
        if (range.end == null || item.start.valueOf() > end) {
          end = item.start.valueOf();
        }
      }

      return { start, end };
    }, {start: null, end: null});
  }
}

let panStartState = null;