import React, { Component } from 'react';
import * as bot from '../api/bot';
import shortid from 'shortid';

export default class ConfigForm extends Component {
  constructor(props) {
    super(props);
    const config = JSON.parse(localStorage.getItem('config'))|| {
      apiKey: '',
      apiSecret: '',
      market: '',
    };
    this.state = {
      config,
      messages: [],
      run: false,
      sum: 0,
    };
  }
  timer = null;

  handleTestRun = async () => {
    const { config, sum, messages } = this.state;
    if (config.market === '') return;

    const { max, message } = await bot.miningMax({
      market: config.market,
      accessToken: `${config.apiKey}:${config.apiSecret}`,
      customLower: config.customLower,
      customUpper: config.customUpper,
    });
    messages.unshift({ message, uuid: shortid.generate() });
    this.setState({ sum: sum + max, messages });
  }

  loopRun = () => {
    this.setState({ run: true });
    this.handleTestRun();
    this.timer = setTimeout(() => {
      this.loopRun();
    },  10000);
  };

  handleRun = () => {
    this.loopRun();
  };

  handleStop = () => {
    clearTimeout(this.timer);
    this.setState({ run: false });
  };

  render() {
    const { messages, run, config, sum} = this.state;
    if (config.apiKey === '' || config.apiSecret === '' || config.market === '') {
      return (
        <div className="wrapper">
          <h4>Please go to config setup api key and secret and market.</h4>
        </div>
      );
    }
    if (config.customUpper === 0 || config.customLower ===0) {
      return (
        <div className="wrapper">
          <h4>請到 https://coinmarketcap.com/ 查詢當前 {`${config.market}`} 市價</h4>
        </div>
      );
    }
    return (
      <div className="wrapper">
        <h3>Mining on {`${config.market}`}</h3>
        <p>
          建議先按下 Test Run，試挖一次，成功後，再按 Run 自動挖礦。
        </p>
        <hr/>
        <button className="button" onClick={this.handleTestRun}>Test run</button>
        {run? <button className="danger button" onClick={this.handleStop}>Stop</button>: <button className="primary button" onClick={this.handleRun}>Run</button>}
        <div className="hero">
          已經挖出約 {sum} 顆 MAX
        </div>
        <div>
          {messages.map(it => <p key={it.uuid}>{it.message}</p>)}
        </div>
      </div>
    );
  }
}
