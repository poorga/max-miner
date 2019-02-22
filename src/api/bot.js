import { BigNumber } from 'bignumber.js';
import { v2Headers, API_URL } from './header';
import { format } from 'date-fns';

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_DOWN });

const MinimumAmount = {
  twd:  10,      // TWD 最小下單金額    10.0TWD
	btc:  0.00005, //BTC 最小下單金額    0.00005BTC
	eth:  0.0005,  //ETH 最小下單金額    0.0005ETH
	usdt: 0.5,     //USDT 最小下單金額    0.5USDT
	max:  1.0,     //MAX 最小下單金額    1.0MAX
};

const difficulty = 0.5;

// calculate trade price based on max and bitfinex bids/asks
async function calculateTradePrice(market, quotePrecision, customUpper, customLower) {
  const { asks, bids } = await fetch(`${API_URL}/depth?market=${market}`).then(res => res.json());
  if (asks.length === 0 || bids === 0) {
    return {
      error: {
        code: 1001,
        message: 'There is no quoation.',
      }
    };
  }

  const marketUpper = parseFloat(asks[asks.length -1][0]);
  const marketLower = parseFloat(bids[0][0]);
  const tradeUpper =  marketUpper > customUpper ? customUpper : marketUpper;
  const tradeLower = marketLower < customLower ? customLower : marketLower;

  const epsilon = Math.pow(10, -quotePrecision);
  const mid = (tradeUpper + tradeLower) / 2;
  const spread = tradeUpper - tradeLower - 2*epsilon;
  if (spread < 1.5*epsilon) {
    return {
      error: {
        code: 1001,
        message: 'Spread is too low',
      }
    };
  }
  const rand = Math.random() - 0.5;
  return rand*spread + mid;
}

const round = (num, precision) => parseFloat(BigNumber(num).toFixed(precision));


export async function miningMax({ market = 'mitheth', accessToken, customUpper, customLower, }) {
  // get market info
  const markets = await fetch(`${API_URL}/markets`).then(res => res.json());
  const [ marketInfo ] = markets.filter(m => m.id === market);
  const { quote_unit: quote, base_unit: base, quote_unit_precision: quotePrecision, base_unit_precision: basePrecision } = marketInfo;
  const pair1 = quote === 'twdt' ? `usdt${quote}` : `${quote}usdt`;
  const pair2 = `${base}usdt`;
  let lastPrice = { usdtusdt: 1 };
  // get last price
  const tradesResponse = await fetch(`${API_URL}/trades?market=maxusdt&limit=1`).then(res => res.json());
  if (!tradesResponse) {
    return {
      max: 0,
      message: `${format(new Date(), 'YYYY-MM-DD HH:mm:ss')} Cannot get last trade from maxusdt markets`,
    };
  }
  lastPrice['maxusdt']= tradesResponse[0].price;

  if (pair1 !== 'maxusdt' && pair1 !== 'usdtusdt') {
    const pair1Response = await fetch(`${API_URL}/trades?market=${pair1}&limit=1`).then(res => res.json());
    if (!pair1Response) {
      return {
        max: 0,
        message: `${format(new Date(), 'YYYY-MM-DD HH:mm:ss')} Cannot get last trade from ${pair1} markets`,
      };
    }
    lastPrice[pair1] = pair1Response[0].price;
  }
  if (pair2 !== 'maxusdt' && pair2 !== 'usdtusdt') {
    const pair2Response = await fetch(`${API_URL}/trades?market=${pair2}&limit=1`).then(res => res.json());
    if (!pair2Response) {
      return {
        max: 0,
        message: `${format(new Date(), 'YYYY-MM-DD HH:mm:ss')} Cannot get last trade from ${pair2} markets`,
      };
    }
    lastPrice[pair2] = pair2Response[0].price;
  }


  // {"id":1691175,"price":"0.348","volume":"1.44","funds":"0.50112","market":"maxusdt","market_name":"MAX/USDT","created_at":1539942569,"side":"ask"}
  // cancel all
  const cancelPayload = { market, nonce: Date.now(), };
  const cancelResponse = await fetch(`${API_URL}/orders/clear`, {
    method: 'POST',
    headers: {
      ...v2Headers(accessToken, cancelPayload),
    },
    body: JSON.stringify(cancelPayload),
  }).then(res => res.json());
  if (cancelResponse.error) {
    return {
      max: 0,
      message: `${format(new Date(), 'YYYY-MM-DD HH:mm:ss')} ${cancelResponse.error.message}`,
    };
  }

  const tradePrice = await calculateTradePrice(market, quotePrecision, customUpper, customLower);
  if (tradePrice.error) {
    return {
      max: 0,
      message: tradePrice.error.message,
    };
  }

  const baseEpsilon = Math.pow(10, -basePrecision);

  const r1 = await fetch(`${API_URL}/members/me`, {
    headers: {
      ...v2Headers(accessToken, { nonce: Date.now(), }),
    },
  }).then(res => res.json());

  if (r1.error) {
    return {
      max: 0,
      message: r1.error.message,
    };
  }

  const [ quoteAccount ]  = r1.accounts.filter(a => a.currency === quote);
  const quoteBalance = quoteAccount && parseFloat(quoteAccount.balance);
  const [ baseAccount ]  = r1.accounts.filter(a => a.currency === base);
  const baseBalance = baseAccount && parseFloat(baseAccount.balance);

  let tradeVolume = quoteBalance / tradePrice;
  if (tradeVolume > baseBalance) {
    tradeVolume = baseBalance;
  }
  tradeVolume -= baseEpsilon;
  if (tradePrice*tradeVolume < MinimumAmount[quote]) {
    return {
      max: 0,
      message: `${format(new Date(), 'YYYY-MM-DD HH:mm:ss')} 低於最小下單金額 ${tradePrice} * ${tradeVolume} = ${tradePrice * tradeVolume} < ${MinimumAmount[quote]} ${quote}`,
    };
  }


  // deal with precision
  const price = round(tradePrice, quotePrecision);
  const volume = round(tradeVolume, basePrecision);
  const multiOrderPayload = {
    nonce: Date.now(),
    market,
    orders: [
    {
      side: 'sell',
      volume,
      price,
      ord_type: 'limit',
    },
    {
      side: 'buy',
      volume,
      price,
      ord_type: 'limit',
    },
  ]};
  const f = await fetch(`${API_URL}/orders/multi`, {
    method: 'POST',
    headers: {
      ...v2Headers(accessToken, multiOrderPayload),
    },
    body: JSON.stringify(multiOrderPayload),
  }).then(res => res.json());
  const funds = round(price*volume, quotePrecision);
  if (f.error) {
    return {
      max: 0,
      message: `${format(new Date(), 'YYYY-MM-DD HH:mm:ss')} Trade ${market} for price: ${price}, volume: ${volume}, total: ${funds}, Error: ${f.error.message}`,
    }
  }

  const message = `${format(new Date(), 'YYYY-MM-DD HH:mm:ss')} Trade ${market} for price: ${price}, volume: ${volume}, total: ${funds}, Success`;
  if (quote === 'max' || base === 'max') {
    return {
      max: round(volume * 0.0015 * difficulty + funds * 0.0005 * difficulty * (1 / lastPrice['maxusdt']), 8),
      message,
    };
  } else {
    return {
      max: round(volume * 0.0015 * difficulty * (lastPrice[pair2] / lastPrice['maxusdt']) + funds * 0.0005 * difficulty * (lastPrice[pair1] / lastPrice['maxusdt']), 8),
      message,
    };
  }
}
