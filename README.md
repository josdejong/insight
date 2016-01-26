insight
=====================

A debug tooling experiment. This demo is inspired by the talk
[Inventing on principle](https://www.youtube.com/watch?v=PUv66718DII) by Bret Victor.
It aims to:

- Show a view with the changes in your application over time on a timeline.
- Show the relations between all changes, where do they come from?
- Allowing to to time travel through your application: go back and forth


## Known issues

- There is a large delay (~20ms) between events which should occur almost simultaneously.
  Probably the Debugger hooks into the React cycles in a bad way.
- There is not yet ful support for touch devices.
- The Timeline does not yet stack overlapping events.


## Current state

- [x] Create a simple demo application, a basic web shop.
- [x] Create a debugger showing a Timeline.
- [x] Let the debugger monitor network, state changes, and method invocations.
- [ ] Show the relation between events, like a network event caused by some button click.
- [ ] Implement time travel.
- [ ] Select the methods and states you're interested in in the Debugger UI.


## Use

To use the latest bundled demo application, open the file index.html in your browser.


## Develop

To develop the application, install dependencies and start a hot-reload server:

```
npm install
npm start
```

Open [http://localhost:3000/develop.html](http://localhost:3000/develop.html) in your browser


## Build

To generate a bundled file which can be run as a static web page, run:

```
npm run bundle
```

The static website can be opened by opening the file index.html in your browser.


## Linting

This boilerplate project includes React-friendly ESLint configuration.

```
npm run lint
```

## Misc

This project was started with ease thanks to [react-hot-boilerplate](https://github.com/gaearon/react-hot-boilerplate).
