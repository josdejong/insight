'use strict';

import React from 'react';
import { Component } from 'react';

export default class Album extends Component {
  render() {
    return <div className="album">
      <div className="album-image">
        <img src={this.props.image} alt={this.props.title} />
      </div>
      <div className="album-menu">
        <input type="button" value="Add to cart" onClick={this.props.onAdd.bind(this)} />
      </div>
      <div className="album-header">
        <span className="album-title">{this.props.title}</span> &ndash; <span>{this.props.artist}</span>
      </div>
      <div className="album-medium">{this.props.medium}</div>
      <div className="album-amount">&euro; {this.props.amount.toFixed(2)}</div>
      <div style={{clear: 'both'}}></div>
    </div>;
  }

  renderSong (song) {
    return <div className="album-song" key={song.title}>
      <span className="album-song-title">{song.title}</span> &ndash; <span className="album-song-length">{song.length}</span>
    </div>
  }

}
