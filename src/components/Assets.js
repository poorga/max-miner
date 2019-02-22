import React, { Component } from 'react';
import { v2Headers, API_URL } from '../api/header';

export default class ConfigForm extends Component {
  constructor(props) {
    super(props);
    const config = JSON.parse(localStorage.getItem('config'))|| {
      apiKey: '',
      apiSecret: '',
    };
    this.state = {
      config,
      profile: {
        email: '',
        name: '',
        accounts: [],
      },
      error: null,
    };
  }

  componentDidMount() {
    const { config: {apiKey, apiSecret } } = this.state;
    console.log(apiKey, apiSecret)
    const payload = {
      nonce: Date.now(),
    };
    if (apiKey !== '' && apiSecret !== '') {
      fetch(`${API_URL}/members/me`, {
        method: 'GET',
        headers: {
          ...v2Headers(`${apiKey}:${apiSecret}`, payload),
        },
        // body: JSON.stringify(payload),
      }).then(res => res.json())
      .then(profile => {
        if (profile.error) {
          this.setState({ error: profile.error });
        } else {
          this.setState({ profile });
        }
      });
    }

  }

  render() {
    const { profile: { email, name, accounts }, error } = this.state;
    if (error) {
      return (
        <div className="wrapper">
          <h4>{error.message}</h4>
        </div>
      );
    }
    if (email === '') {
      return (
        <div className="wrapper">
          <h4>Please go to config setup api key and secret.</h4>
        </div>
      );
    }

    return (
      <div className="wrapper">
        <h3>{name}</h3>
        <h5>{email}</h5>
        <table>
          <tr><th>currency</th><th>available</th><th>locked</th></tr>
          {
            accounts.map(account => {
              return (
                <tr key={account.currency}>
                  <td>{account.currency.toUpperCase()}</td><td>{account.balance}</td><td>{account.locked}</td>
                </tr>
              );
            })
          }
        </table>

      </div>
    );
  }
}
