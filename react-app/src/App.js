import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

function asyncData(data, ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(data)
    }, ms)
  })
}

function fetchComments(ms) {
  return asyncData([
    { id: 1, comment: 'I love Behavioral Programming' },
    { id: 2, comment: 'I think React works well with BP' }
  ], ms)
}

class Delay extends React.Component {
  state = { loading: true }
  componentDidMount() {
    setTimeout(
      () => this.setState({ loading: false })
    , this.props.ms)
  }
  render() {
    return this.state.loading
      ? null
      : this.props.children
  }
}

const BProgram = require('./bp').default
const bp = new BProgram()
let pr = 1

bp.run()

function withBehavior(threads) {
  // ...and returns another component...
  return (WrappedComponent) => class extends WrappedComponent {
    state = {}
    constructor(props) {
      super(props)
      threads.forEach(thread =>
        bp.addBThread(``, pr++, thread.bind(this))
      )
    }
    componentDidMount() {
      console.log('componentDidMount', WrappedComponent.name)

      //var that = this
      // bp.addBThread('Log', pr++, function* () {
      //   while (true) {
      //     yield {
      //       wait: [(event, payload) => {
      //         console.log('event', event, payload)
      //         if (event.startsWith('SET_STATE')) {
      //           console.log('fio', that == WrappedComponent)
      //           that.setState(payload)
      //         }
      //         return true
      //       }]
      //     }
      //   }
      // })
      bp.run() // Initiate super-step
    }

    render() {
      // ... and renders the wrapped component with the fresh data!
      // Notice that we pass through any additional props
      // return <WrappedComponent {...this.state} {...this.props} />;
      return super.render()
    }
  }
}

class Comments extends React.Component {
  render() {
    if (!this.state.comments) {
      return null
    }
    return this.state.comments.map(c =>
      <div key={c.id}>{c.comment}</div>
    )
  }
}

const BehavioralComments = withBehavior([
  function* () {
    const { comments } = yield { wait: ['FETCH_COMMENTS_SUCCESS'] }
    this.setState({ comments })
  },
  function* () {
    yield { request: ['FETCH_COMMENTS']}
    const comments = yield fetchComments(1000)
    yield { request: ['FETCH_COMMENTS_SUCCESS'], payload: { comments }}
    yield { request: ['FETCH_ANOTHER_COMMENTS_SUCCESS'], payload: { comments }}
  },
  // add after Delay was added
  function* () {
    yield { wait: ['FETCH_ANOTHER_COMMENTS_COUNT'], block: ['FETCH_ANOTHER_COMMENTS_SUCCESS']}

  }
])(Comments)

class CommentsCount extends React.Component {
  render() {
    return <div>{this.state.commentsCount}</div>
  }
}
const BehavioralCommentsCount = withBehavior([
  function* () {
    yield { request: ['FETCH_COMMENTS_COUNT']}
    const comments = yield fetchComments(2000)
    yield { request: ['FETCH_COMMENTS_COUNT_SUCCESS']}
    this.setState({ commentsCount: comments.length })
  },
])(CommentsCount)

const BlockCommentsCount = withBehavior([
  //// STUFF AFTER THIS COULD BE ADDED BY OTHERS
  function* () {
    // block FETCH_COMMENTS_COUNT
    yield { block: ['FETCH_COMMENTS_COUNT']}
  },
  function* () {
    yield { request: ['FETCH_ANOTHER_COMMENTS_COUNT']}
    const { comments } = yield { wait: ['FETCH_ANOTHER_COMMENTS_SUCCESS']}
    this.setState({ commentsCount: comments.length })
  }
])(BehavioralCommentsCount)


class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Ciao Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
        <hr />
        <BehavioralComments />
        <Delay ms={4000}>
          <BlockCommentsCount />
        </Delay>
      </div>
    );
  }
}

export default App;
