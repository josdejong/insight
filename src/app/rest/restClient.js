// fake server, running in the client, faking requests with random delays

import music from './data';

export default {
  // usage: get('/music?q=adele')
  get: function (url) {
    if (contains(url, '/music')) {
      var query = url.split('=').pop(); // yeah, this is just a mock...
      return findMusic(query)
          .then(fakeNetworkDelay);
    }
    else {
      return Promise.resolve('404 Not found')
          .then(fakeNetworkDelay);
    }
  }
};

function findMusic (query) {
  var results = music.filter(album => {
    return contains(album.artist, query) || contains(album.title, query);
  });

  return Promise.resolve(results);
}

// case insensitive search
function contains (text, search) {
  return text.toLowerCase().indexOf(search.trim().toLowerCase()) !== -1;
}

// delay resolving a Promise
function fakeNetworkDelay () {
  let args = arguments;
  let delay = 200 + Math.random() * 400;

  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve.apply(resolve, args);
    }, delay);
  });
}