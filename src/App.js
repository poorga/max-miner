import React, { Component } from 'react';
import { HashRouter as Router, Route, Link } from "react-router-dom";

import './App.css';

import ConfigForm from './components/ConfigForm';
import Assets from './components/Assets';
import Bot from './components/Bot';

class App extends Component {
  render() {
    return (
      <Router>
      <div>
        <ul>
          <li>
            <Link to="/">設定</Link>
          </li>
          <li>
            <Link to="/bot">挖礦</Link>
          </li>
          <li>
            <Link to="/assets">資產</Link>
          </li>
        </ul>
        <Route exact path="/" component={ConfigForm} />
        <Route exact path="/bot" component={Bot} />
        <Route exact path="/assets" component={Assets} />
      </div>
      </Router>
    );
  }
}

export default App;
