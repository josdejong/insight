'use strict';

import React from 'react';
import { Component } from 'react';

export default class CartOverview extends Component {
  render() {
    return <div className="cart-overview">
      <div className="cart-overview-header">Shopping cart</div>
      {
          this.props.cart.length > 0
              ? this.renderTotals()
              : <div>(empty)</div>
      }
    </div>;
  }

  renderTotals () {
    let totals = this.calculateTotals();

    return <div>
      <div>
        <span className="cart-num">{totals.num}</span> items
      </div>
      <div>
        <span className="cart-amount">&euro; {totals.amount.toFixed(2)}</span>
      </div>
    </div>;
  }

  calculateTotals () {
    return this.props.cart.reduce(function (totals, entry) {
      totals.num += entry.num;
      totals.amount += entry.num * entry.album.amount;
      return totals;
    }, {num: 0, amount: 0});
  }
}
