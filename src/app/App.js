'use strict';

import React from 'react';
import { Component } from 'react';
import restClient from './rest/restClient';
import Album from './Album';
import CartOverview from './CartOverview';

export default class App extends Component {
  constructor (props) {
    super(props);

    this.state = {
      searching: false,
      albums: [],
      cart: []
    };
  }

  render() {
    return <div className="app">
      <CartOverview cart={this.state.cart} />
      <h1>The Music Shop</h1>
      <div>
        <input
            ref="searchInput"
            className="searchInput"
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
                key={album.id}
                onAdd={this.handleAdd.bind(this, album)} />
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

  componentWillMount () {
    this.search('');
  }

  componentDidMount () {
    this.refs.searchInput.focus();
  }

  handleSearch() {
    this.search(this.refs.searchInput.value);
  }

  // add an album to the cart
  handleAdd (album) {
    // TODO: use immutable js
    let cart = this.state.cart;
    let entry = cart.find(entry => entry.album.id === album.id);
    if (!entry) {
      entry = {album, num: 1};
      cart.push(entry);
    }
    else {
      entry.num++;
    }
    this.setState({cart})
  }

  search (query) {
    // Note that this search function contains an error:
    // it does not switch to the latest result
    this.setState({searching: true});

    restClient.get('/music?q=' + query)
        .then(albums => this.setState({albums}))
        .catch(err => console.error(err))
        .then(() => this.setState({searching: false}));
  }
}
