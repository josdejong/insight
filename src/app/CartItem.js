'use strict';

import React from 'react';
import { Component } from 'react';

export default class CartItem extends Component {

  render() {
    return <div className="cart-item">
      <div className="album-image">
        <img src={this.props.album.image} alt={this.props.album.title} />
      </div>
      <div className="album-menu">
        <div>
          <input
              type="button"
              value="Remove from cart"
              disabled={this.props.freeze}
              onClick={this.props.onRemove.bind(this, this.props.album.title)} />
        </div>
        <div>
          Number: <input
            type="text"
            value={this.props.number}
            className="cart-item-number"
            disabled={this.props.freeze}
            onChange={function () { /* keep React warnings quiet... */ } }
            onInput={this.handleChangeNum.bind(this)} />
        </div>
        <div className="album-amount">
          Amount: $ {this.totalAmount().toFixed(2)}
        </div>
      </div>
      <div className="album-header">
        <span className="album-title">{this.props.album.title}</span> &ndash; <span>{this.props.album.artist}</span>
      </div>
      <div className="album-medium">{this.props.album.medium}</div>
      <div className="album-amount">&euro; {this.props.album.amount.toFixed(2)}</div>
      <div style={{clear: 'both'}}></div>
    </div>;
  }

  handleChangeNum (event) {
    this.props.onChangeNumber(this.props.album.title, event.target.value.trim());
  }

  totalAmount () {
    let amount = this.props.number * this.props.album.amount;
    return isNaN(amount) ? 0 : amount;
  }

}
