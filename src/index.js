import fetch from "node-fetch";
import crypto from "crypto";
import querystring from "querystring";

/**
 * @typedef Options
 * @type {Object}
 * @property {string | void} key Your private API key, this is only required if you call any account api's
 * @property {string | void} secret Your private API secret, this is only required if you call any account api's
 * @property {string | void} server Target api uri, defaults to "https://api.btcmarkets.net"
 * @property {number | void} timeout Fetch timeout, defaults to 20000ms
 * @property {string | void} userAgent HTTP UserAgent, defaults to "BTC Markets API Client"
 */
/**
 * BTC Markets API Client
 *
 * @class BTCMarketsAPI
 */
class BTCMarketsAPI {
  /**
   * Creates an instance of BTCMarketsAPI.
   * @param {Options | void} options Options object for communicating with btcmarkets
   * @constructor
   * @memberof BTCMarketsAPI
   */
  constructor(options = {}) {
    const {key, secret, server, timeout, userAgent} = options;
    this.key = key;
    this.secret = secret;
    this.server = server || "https://api.btcmarkets.net";
    this.timeout = timeout || 20000;
    this.userAgent = userAgent || "BTC Markets API Client";
  }

  /**
   *
   *
   * @param {any} path
   * @param {any} timestamp
   * @param {string} [body=""]
   * @returns {Promise}
   * @memberof BTCMarketsAPI
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
   * @memberof BTCMarketsAPI
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
        throw new Error({code: json.errorCode, message: json.errorMessage});
      }
      return json;
    } catch (err) {
      throw new Error({message: text});
    }
  }
  /**
   *
   *
   * @param {string} instrument
   * @param {string} currency
   * @param {any} action
   * @param {any} params
   * @returns {Promise<object>}
   * @memberof BTCMarketsAPI
   */
  async publicRequest(instrument, currency, action, params) {
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
  /**
   *
   *
   * @param {String} instrument
   * @param {String} currency
   * @returns {Promise}
   * @memberof BTCMarketsAPI
   */
  async getTick(instrument, currency) {
    return this.publicRequest(instrument, currency, "tick");
  }
  /**
   *
   *
   * @param {String} instrument
   * @param {String} currency
   * @returns {Promise}
   * @memberof BTCMarketsAPI
   */
  async getOrderBook(instrument, currency) {
    return this.publicRequest(instrument, currency, "orderbook");
  }
  /**
   *
   *
   * @param {string} instrument
   * @param {string} currency
   * @param {any} since
   * @returns {Promise}
   * @memberof BTCMarketsAPI
   */
  async getTrades(instrument, currency, since) {
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
   * @param {string} instrument
   * @param {string} currency
   * @param {any} price
   * @param {any} volume
   * @param {any} orderSide
   * @param {any} ordertype
   * @param {any} clientRequestId
   * @returns {Promise}
   * @memberof BTCMarketsAPI
   */
  async createOrder(instrument, currency, price, volume, orderSide, ordertype, clientRequestId) {
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
   * @memberof BTCMarketsAPI
   */
  async cancelOrders(orderIds) {
    return this.signedRequest("/order/cancel", {
      orderIds,
    });
  }

  /**
   *
   *
   * @param {any} orderIds
   * @returns {Promise}
   * @memberof BTCMarketsAPI
   */
  async getOrderDetail(orderIds) {
    return this.signedRequest("/order/detail", {
      orderIds,
    });
  }

  /**
   *
   *
   * @param {string} instrument
   * @param {string} currency
   * @param {number} limit
   * @param {any} since
   * @returns {Promise}
   * @memberof BTCMarketsAPI
   */
  async getOpenOrders(instrument, currency, limit, since) {
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
   * @param {string} instrument
   * @param {string} currency
   * @param {number} limit
   * @param {any} since
   * @returns {Promise}
   * @memberof BTCMarketsAPI
   */
  async getOrderHistory(instrument, currency, limit, since) {
    return this.signedRequest("/order/history", {
      currency,
      instrument,
      limit,
      since,
    });
  }
  /**
   *
   *
   * @param {string} instrument
   * @param {string} currency
   * @param {number} limit
   * @param {any} since
   * @returns {Promise}
   * @memberof BTCMarketsAPI
   */
  async getTradeHistory(instrument, currency, limit, since) {
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
   * @memberof BTCMarketsAPI
   */
  async getAccountBalances() {
    return this.signedRequest("/account/balance");
  }
  /**
   *
   *
   * @param {string} instrument
   * @param {string} currency
   * @returns {Promise}
   * @memberof BTCMarketsAPI
   */
  async getTradingFee(instrument, currency) {
    return this.signedRequest(`/account/${instrument}/${currency}/tradingfee`);
  }
  /**
   *
   *
   * @param {any} amount
   * @param {any} address
   * @param {string} currency
   * @returns {Promise}
   * @memberof BTCMarketsAPI
   */
  async withdrawCrypto(amount, address, currency) {
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
   * @memberof BTCMarketsAPI
   */
  async withdrawEFT(accountName, accountNumber, bankName, bsbNumber, amount, currency = "AUD") {
    return this.signedRequest("/fundtransfer/withdrawEFT", {
      accountName,
      accountNumber,
      bankName,
      bsbNumber,
      amount,
      currency,
    });
  }
  /**
   *
   *
   * @param {(number | void)} limit
   * @param {(number | void)} since
   * @param {(boolean | void)} indexForward
   * @returns {Promise<FundWithdrawals>}
   * @memberof BTCMarketsAPI
   */
  async withdrawHistory(limit, since, indexForward) {
    return this.signedRequest("/fundtransfer/history", {
      limit,
      since,
      indexForward,
    });
  }
}
export default BTCMarketsAPI;
