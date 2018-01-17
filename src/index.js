import fetch from "node-fetch";
import crypto from "crypto";
import querystring from "querystring";
import RateLimiter from "./rate-limiter";

const defaultRateLimit = {
  amountOfCalls: 25,
  timePeriod: 10,
};
const lowerRateLimit = {
  amountOfCalls: 10,
  timePeriod: 10,
};


/**
 *
 *
 * @param {object} [options={key,secret,server,timeout,userAgent,disableRateLimiters}]
 * @export
 * @class BTCMarkets
 */
export default class BTCMarkets {
  constructor(options = {}) {
    const { key, secret, server, timeout, userAgent, disableRateLimiters = false } = options;
    this.key = key;
    this.secret = secret;
    this.server = server || "https://api.btcmarkets.net";
    this.timeout = timeout || 20000;
    this.userAgent = userAgent || "BTC Markets Javascript API Client";
    this.disableRateLimiters = disableRateLimiters;
    // https://github.com/BTCMarkets/API/wiki/faq
    this.rateLimiters = {};
  }
  /**
   *
   *
   * @param {string} apiName
   * @param {object} [defaults=defaultRateLimit]
   * @returns {Promise}
   * @memberof BTCMarkets
   */
  callRateLimiter(apiName, defaults = defaultRateLimit) {
    if (!this.disableRateLimiters) {
      if (!this.rateLimiters[apiName]) {
        this.rateLimiters[apiName] = new RateLimiter(defaults);
      }
      return this.rateLimiters[apiName].sleep();
    }
    return undefined;
  }

  /**
   *
   *
   * @param {any} path
   * @param {any} timestamp
   * @param {string} [body=""]
   * @returns {Promise}
   * @memberof BTCMarkets
   */
  signData(path, timestamp, body = "") {
    const data = `${path}\n${timestamp}\n${body}`;
    const signer = crypto.createHmac("sha512", new Buffer(this.secret, "base64"));
    return signer.update(data).digest("base64");
  }
  /**
   *
   *
   * @param {any} path
   * @param {any} params
   * @returns {Promise}
   * @memberof BTCMarkets
   */
  async signedRequest(path, params) {
    if (!this.key || !this.secret) {
      throw new Error("You must provide key and secret to use this library - please refer to btcmarkets for your details");
    }

    const timestamp = new Date().getTime();
    let method = "POST"; // most API"s use HTTP POST so setting as default

    // The exception is endpoints under /account/ which do a HTTP GET. eg /account/balance or /account/{instrument}/{currency}/tradingfee
    if (path.split("/")[1] === "account") {
      method = "GET";
      params = undefined;
    }
    let body;
    if (params) {
      body = JSON.stringify(params);
    }
    const signature = this.signData(path, timestamp, body);
    const response = await fetch(`${this.server}${path}`, {
      method,
      body,
      headers: {
        "Accept": "application/json",
        "Accept-Charset": "UTF-8",
        "Content-Type": "application/json",
        "User-Agent": this.userAgent,
        "apikey": this.key,
        "timestamp": timestamp,
        "signature": signature,
      },
      timeout: this.timeout,
    });
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      if (json.errorCode) {
        throw new Error({ code: json.errorCode, message: json.errorMessage });
      }
      return json;
    } catch (err) {
      throw new Error({ message: text });
    }
    // return undefined;

  }
  /**
   *
   *
   * @param {any} instrument
   * @param {any} currency
   * @param {any} action
   * @param {any} params
   * @returns {Promise}
   * @memberof BTCMarkets
   */
  publicRequest(instrument, currency, action, params) {
    let qs = "";
    if (params) {
      qs = `?${querystring.stringify(params)}`;
    }
    return fetch(`${this.server}/market/${instrument}/${currency}/${action}${qs}`, {
      method: "GET",
      headers: {
        "User-Agent": this.userAgent,
        "Accept": "application/json",
        "Accept-Charset": "UTF-8",
        "Content-Type": "application/json",
      },
      timeout: this.timeout,
    }).then((r) => r.json());
  }
  //
  // Public Functions
  //
  /**
   *
   *
   * @param {String} instrument
   * @param {String} currency
   * @returns {Promise}
   * @memberof BTCMarkets
   */
  async getTick(instrument, currency) {
    await this.callRateLimiter("tick");
    return this.publicRequest(instrument, currency, "tick");
  }
  /**
   *
   *
   * @param {String} instrument
   * @param {String} currency
   * @returns {Promise}
   * @memberof BTCMarkets
   */
  async getOrderBook(instrument, currency) {
    await this.callRateLimiter("orderbook");
    return this.publicRequest(instrument, currency, "orderbook");
  }
  /**
   *
   *
   * @param {any} instrument
   * @param {any} currency
   * @param {any} since
   * @returns {Promise}
   * @memberof BTCMarkets
   */
  async getTrades(instrument, currency, since) {
    await this.callRateLimiter("trades");
    return this.publicRequest(instrument, currency, "trades", {
      since,
    });
  }

  //
  // Signed Functions
  //
  /**
   *
   *
   * @param {any} instrument
   * @param {any} currency
   * @param {any} price
   * @param {any} volume
   * @param {any} orderSide
   * @param {any} ordertype
   * @param {any} clientRequestId
   * @returns {Promise}
   * @memberof BTCMarkets
   */
  async createOrder(instrument, currency, price, volume, orderSide, ordertype, clientRequestId) {
    await this.callRateLimiter("ordercreate", lowerRateLimit);
    return this.signedRequest("/order/create", {
      currency,
      instrument,
      price,
      volume,
      orderSide,
      ordertype,
      clientRequestId,
    });
  }
  /**
   *
   *
   * @param {any} orderIds
   * @returns {Promise}
   * @memberof BTCMarkets
   */
  async cancelOrders(orderIds) {
    await this.callRateLimiter("ordercancel");
    return this.signedRequest("/order/cancel", {
      orderIds,
    });
  }

  /**
   *
   *
   * @param {any} orderIds
   * @returns {Promise}
   * @memberof BTCMarkets
   */
  async getOrderDetail(orderIds) {
    await this.callRateLimiter("ordercancel");
    return this.signedRequest("/order/detail", {
      orderIds,
    });
  }

  /**
   *
   *
   * @param {any} instrument
   * @param {any} currency
   * @param {any} limit
   * @param {any} since
   * @returns {Promise}
   * @memberof BTCMarkets
   */
  async getOpenOrders(instrument, currency, limit, since) {
    await this.callRateLimiter("orderopen");
    return this.signedRequest("/order/open", {
      currency,
      instrument,
      limit,
      since,
    });
  }
  /**
   *
   *
   * @param {any} instrument
   * @param {any} currency
   * @param {any} limit
   * @param {any} since
   * @returns {Promise}
   * @memberof BTCMarkets
   */
  async getOrderHistory(instrument, currency, limit, since) {
    await this.callRateLimiter("orderhistory", lowerRateLimit);
    return this.signedRequest("/order/history", {
      currency: currency,
      instrument: instrument,
      limit: limit,
      since: since,
    });
  }
  /**
   *
   *
   * @param {any} instrument
   * @param {any} currency
   * @param {any} limit
   * @param {any} since
   * @returns {Promise}
   * @memberof BTCMarkets
   */
  async getTradeHistory(instrument, currency, limit, since) {
    await this.callRateLimiter("ordertradehistory", lowerRateLimit);
    return this.signedRequest("/order/trade/history", {
      currency,
      instrument,
      limit,
      since,
    });
  }
  /**
   *
   *
   * @returns {Promise}
   * @memberof BTCMarkets
   */
  async getAccountBalances() {
    await this.callRateLimiter("accountbalance");
    return this.signedRequest("/account/balance");
  }
  /**
   *
   *
   * @param {any} instrument
   * @param {any} currency
   * @returns {Promise}
   * @memberof BTCMarkets
   */
  async getTradingFee(instrument, currency) {
    await this.callRateLimiter("tradingfee", lowerRateLimit);
    return this.signedRequest(`/account/${instrument}/${currency}/tradingfee`);
  }
  /**
   *
   *
   * @param {any} amount
   * @param {any} address
   * @param {any} currency
   * @returns {Promise}
   * @memberof BTCMarkets
   */
  async withdrawCrypto(amount, address, currency) {
    await this.callRateLimiter("withdrawcrypto", lowerRateLimit);
    return this.signedRequest("/fundtransfer/withdrawCrypto", {
      amount,
      address,
      currency,
    });
  }
  /**
   *
   *
   * @param {any} accountName
   * @param {any} accountNumber
   * @param {any} bankName
   * @param {any} bsbNumber
   * @param {any} amount
   * @param {string} [currency="AUD"]
   * @returns {Promise}
   * @memberof BTCMarkets
   */
  async withdrawEFT(accountName, accountNumber, bankName, bsbNumber, amount, currency = "AUD") {
    await this.callRateLimiter("withdrawEFT", lowerRateLimit);
    return this.privateRequest("/fundtransfer/withdrawEFT", {
      accountName,
      accountNumber,
      bankName,
      bsbNumber,
      amount,
      currency,
    });
  }
}
