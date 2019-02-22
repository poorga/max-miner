import React, { Component } from 'react';

const initialState = {
  apiKey: '',
  apiSecret: '',
  market: '',
  customLower: 0,
  customUpper: 0,
};

const marketOptions = ['btcusdt', 'ethbtc', 'ethusdt'];
export default class ConfigForm extends Component {
  constructor(props) {
    super(props);
    this.state = initialState;
  }
  componentDidMount() {
    const config = JSON.parse(localStorage.getItem('config')) || initialState;
    this.setState(config);
  }
  handleKeyChange = event => {
    this.setState({ apiKey: event.target.value });
  };

  handleSecretChange = event => {
    this.setState({ apiSecret: event.target.value });
  };

  handleMarketChange = event => {
    this.setState({ market: event.target.value });
  };

  handleUpperChange = event => {
    this.setState({ customUpper: parseFloat(event.target.value) });
  };

  handleLowerChange = event => {
    this.setState({ customLower: parseFloat(event.target.value) });
  };

  handleSaveConfig = () => {
    const config = this.state;
    localStorage.setItem('config', JSON.stringify(config));
  };

  handleReset = () => {
    this.setState(initialState, () => {
      localStorage.setItem('config', JSON.stringify(initialState));
    });
  }

  render() {
    const { apiKey, apiSecret, market, customLower, customUpper } = this.state;

    return (
      <div className="wrapper">
        <p>
          將你的 API key 跟 secret 貼到下面。
          填上你想挖的交易對，記得事先準備好該交易對的錢。
          例如想挖 btcusdt，請準備好 0.5 btc 跟 200 usdt，填入 btcusdt。
        </p>
        <div>
          API Key
        </div>
        <div>
          <input className="input" value={apiKey} onChange={this.handleKeyChange} />
        </div>
        <div>
          API Secret
        </div>
        <div>
          <input className="input" value={apiSecret}  onChange={this.handleSecretChange} />
        </div>
        <div>
          Trading Market ex: btcusdt
        </div>
        <div className="styled-select slate">
          <select value={market} onChange={this.handleMarketChange}>
            {marketOptions.map(it => <option key={it} value={it}>{it}</option>)}
          </select>
          {/* <input className="input" value={market}  onChange={this.handleMarketChange} /> */}
        </div>
        <div>
          自訂賣一價
        </div>
        <div>
          <input type="number" className="input" value={customUpper}  onChange={this.handleUpperChange} />
        </div>
        <div>
          自訂買一價
        </div>
        <div>
          <input type="number" className="input" value={customLower}  onChange={this.handleLowerChange} />
        </div>
        <div>
          <button className="danger button" onClick={this.handleReset} >Reset</button>
          <button className="primary button" onClick={this.handleSaveConfig} >Save</button>
        </div>
      </div>
    );
  }
}
