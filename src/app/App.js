'use strict';

import React, { Component } from 'react';
import restClient from './rest/restClient';
import Album from './Album';
import CartItem from './CartItem';
import Immutable from 'seamless-immutable';

export default class App extends Component {
  constructor (props) {
    super(props);

    this.state = {
      page: 'home',
      query: '',
      searching: false,
      purchasing: false,
      albums: [],
      cart: Immutable([])
    };

    this.pages = {
      home: this.renderHome,
      cart: this.renderCart,
      thanks: this.renderThanks
    };
  }

  render() {
    let renderPage = this.pages[this.state.page] || this.pages['home'];

    return <div className="app">
      <div className="app-centered">
        <h1 className="app-logo">
          <span className='app-logo-colored'>&lt;&lt;</span>
          The Music Shop
          <span className='app-logo-colored'>&gt;&gt;</span></h1>

        <div className="menu">
          <a className="menu-item" href="#" onClick={this.goToPage.bind(this, 'home')}>Home</a>
          <a className="menu-item" href="#" onClick={this.goToPage.bind(this, 'cart')}>
            Cart {this.renderCartStatus()}
          </a>
        </div>

        {
           renderPage.bind(this)()
        }
      </div>
    </div>;
  }

  renderCartStatus () {
    return !this.cartIsEmpty()
        ? <span className="cart-number"> ({this.totalProducts()})</span>
        : null
  }

  renderHome() {
    return <div className="page-home">
        <div>
          <input
              type="text"
              ref="searchInput"
              className="searchInput"
              value={this.state.query}
              placeholder="Enter a title or artist..."
              onInput={this.handleSearch.bind(this)} />
          <input
              type="button"
              className="searchButton"
              value="Search"
              onClick={this.handleSearch.bind(this)} />
          {
            this.state.searching
                ? <span className="searching"> searching...</span>
                : null
          }
        </div>
        <div>
          {
            this.state.albums.map(album => {
              return <Album
                  {...album}
                  key={album.title}
                  onAdd={this.handleAddItem.bind(this, album)} />
            })
          }
          {
            this.state.albums.length === 0
                ? <div className="info">(no results)</div>
                : null
          }
        </div>
      </div>;
  }

  renderCart () {
    return <div className="page-cart">
      {
        this.renderCartContents()
      }
      <div className="cart-footer">
        <div className="cart-amount">
          Total amount: $ {this.totalAmount().toFixed(2)}
        </div>
        <div>
          {
              this.state.purchasing ? <span>working... </span> : null
          }
          <input
              type="button"
              value="Checkout"
              disabled={this.state.purchasing || this.state.cart.length === 0}
              className="cart-checkout"
              onClick={this.purchase.bind(this)} />
        </div>
      </div>
    </div>;
  }

  renderCartContents () {
    if (this.state.cart.length > 0) {
      return this.state.cart.asMutable().map(item =>
          <CartItem
              {...item}
              key={item.album.title}
              freeze={this.state.purchasing}
              onRemove={this.handleRemoveItem.bind(this)}
              onChangeNumber={this.handleChangeNumber.bind(this)} />);
    }
    else {
      return <div className="info">(your cart is empty)</div>;
    }
  }

  renderThanks() {
    return <div className="page-thanks">
        <p>
          Thanks for your purchase!
        </p>
        <p>
          <input type="button" value="Back to home" onClick={this.goToPage.bind(this, 'home')} />
        </p>
      </div>;
  }

  componentDidMount () {
    this.refs.searchInput.focus();
    this.handleSearch();
  }

  handleSearch() {
    let query = this.refs.searchInput.value;
    this.setState({query});
    this.search(query);
  }

  goToPage (page) {
    this.setState({page});
  }

  // add an album to the cart
  handleAddItem (album) {
    let cart = this.state.cart;

    let exists = cart.some(item => item.album.title === album.title);

    if (exists) {
      cart = cart.map(function(item) {
        return (item.album.title === album.title)
            ? item.set('number', item.number + 1)
            : item;
      });
    }
    else {
      let item = Immutable({album, number: 1});
      cart = cart.concat(item);
    }

    this.setState({cart})
  }

  handleRemoveItem (title) {
    this.setState({
      cart: this.state.cart.filter(item => item.album.title !== title)
    });
  }

  handleChangeNumber (title, number) {
    // note that number is now a string
    // we will leave that as is for the sake of simplicity
    this.setState({
      cart: this.state.cart.map(item => {
        return (item.album.title === title)
          ? item.set('number', number)
          : item;
      })
    });
  }
  
  search (query) {
    // Note that this search function contains an error:
    // it does not switch to the latest result
    this.setState({searching: true});

    restClient.get('/music?q=' + query)
        .then(albums => this.setState({ albums }))
        .catch(err => console.error(err))
        .then(() => this.setState({searching: false}));
  }

  purchase () {
    this.setState({purchasing: true});

    restClient.post('/purchase', this.state.cart.slice(0))
        .then(response => {
          this.setState({ page: 'thanks', cart: [] })
        })
        .catch(err => console.error(err))
        .then(() => this.setState({purchasing: false}));
  }

  cartIsEmpty () {
    return this.state.cart.length === 0;
  }

  totalProducts () {
    return this.state.cart
        .map(item => toNumber(item.number))
        .reduce(add);
  }

  totalAmount () {
    return this.state.cart
        .reduce(function (total, item) {
          return total + toNumber(item.number) * item.album.amount;
        }, 0);
  }
}

function add(a, b) {
  return a + b;
}

function toNumber (x) {
  let number = parseFloat(x);
  return isNaN(number) ? 0 : number;
}

window.Immutable = Immutable;