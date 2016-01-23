// fake server, running in the client, faking requests with random delays

import music from './data';

export default {
  // usage: get('/music?q=adele')
  get: function (url) {
    if (contains(url, '/music')) {
      let query = url.split('=').pop(); // yeah, this is just a mock...
      return fakeNetworkDelay(200, 600)
          .then(() => findMusic(query));
    }
    else {
      return fakeNetworkDelay(200, 600)
          .reject('404 Not found');
    }
  },

  // usage: put('/pay', [...])  where the body contains the cart items
  put: function (url, body) {
    return fakeNetworkDelay(600, 1200)
        .then(() => Promise.resolve('Thanks for your purchase!'));
  }
};

function findMusic (query) {
  let results = music.filter(album => {
    return contains(album.artist, query) || contains(album.title, query);
  });

  return Promise.resolve(results);
}

// case insensitive search
function contains (text, search) {
  return text.toLowerCase().indexOf(search.trim().toLowerCase()) !== -1;
}

// delay resolving a Promise
function fakeNetworkDelay (min, max) {
  let delay = random(min, max);
  return new Promise(function (resolve, reject) {
    setTimeout(resolve, delay);
  });
}

function random (min, max) {
  return min + Math.random() * (max - min);
}
