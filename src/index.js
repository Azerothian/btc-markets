// @flow

import fetch from "node-fetch";
import crypto from "crypto";
import querystring from "querystring";


export type BMAOptions = void | {
  key: string,
  secret: string,
  server: string,
  timeout: number,
  userAgent: string,
};

export type currencies = "AUD" | "BTC" //| "USD"
export type instruments = "BTC" | "BCH" | "ETH" | "ETC" | "LTC" | "XRP" //| "MAID" | "FCT" | "DAO"
export type allCurrencies = currencies | instruments

export type OrderSide = "Bid" | "Ask"
export type OrderType = "Limit" | "Market"
export type OrderStatus = "New" | "Placed" | "Filled" | "Error" | "Cancelled" | "Partially Cancelled" | "Fully Matched" | "Partially Matched"
export type WithdrawalStatus = string

export type Tick = {
  bestBid: number,
  bestAsk: number,
  lastPrice: number,
  currency: currencies,
  instrument: instruments,
  timestamp: number,
  volume24h: number
}

export type OrderBook = {
  currency: currencies,
  instrument: instruments,
  timestamp: number,
  asks: number[][],
  bids: number[][]
}

export type Trade = {
  tid: number,
  amount: number,
  price: number,
  date: number
}

export type Balance = {
  balance: number,
  pendingFunds: number,
  currency: allCurrencies
}

export type BaseResponse = {
    success: boolean,
    errorCode: number | null,
    errorMessage: string | null
}

export interface NewOrder extends BaseResponse
{
    id: number,
    clientRequestId?: string
}

export interface CancelledOrder extends BaseResponse
{
    id: number
}

export interface CancelledOrders extends BaseResponse
{
    responses: CancelledOrder[]
}

export interface Trade
{
    id: number,
    creationTime: number,
    description: string | null,
    price: number,
    volume: number,
    side: "Ask" | "Bid",
    fee: number,
    orderId: number
}

export interface Order
{
    id: number,
    currency: currencies,
    instruments: instruments,
    orderSide: OrderSide,
    ordertype: OrderType,
    creationTime: number,
    status: OrderStatus,
    errorMessage: string | null,
    price: number,
    volume: number,
    openVolume: number,
    clientRequestId?: string,
    trades: Trade[]
}

export interface Orders extends BaseResponse
{
    orders: Order[]
}

export interface Trades extends BaseResponse
{
    trades: Trade[]
}

export interface TradingFee extends BaseResponse
{
    tradingFeeRate: number,
    volume30Day: number
}

export interface Withdrawal extends BaseResponse
{
    status: WithdrawalStatus
}

export interface CryptoWithdrawal extends Withdrawal
{
    fundTransferId: number
    description: string
    creationTime: number
    currency: string
    amount: number,
    fee: number
}

export interface BankWithdrawal extends Withdrawal
{
    // TODO find out what's returned from this call
}

export interface cryptoPaymentDetail
{
    address: string,
    txId: string
}

export interface FundTransfers
{
    status: string,
    fundTransferId: number,
    description: string,
    creationTime: number,
    currency: allCurrencies,
    amount: number,
    fee: number,
    transferType: string,
    errorMessage: string | null
    lastUpdate: number,
    cryptoPaymentDetail: cryptoPaymentDetail | null
}

export interface FundWithdrawals extends BaseResponse
{
    fundTransfers: FundTransfers[]
}


/**
 * BTC Markets API Client
 *
 * @class BTCMarketsAPI
 */
class BTCMarketsAPI {
  key = "";
  secret = "";
  server = "";
  timeout = 20000;
  userAgent = "BTC Markets API Client"

  /**
   * Creates an instance of BTCMarketsAPI.
   * @param {BMAOptions} options
   * @memberof BTCMarketsAPI
   */
  constructor(options: BMAOptions) {
    if (options) {
      const {key, secret, server, timeout, userAgent} = options;
      this.key = key;
      this.secret = secret;
      this.server = server || "https://api.btcmarkets.net";
      this.timeout = timeout || 20000;
      this.userAgent = userAgent || "BTC Markets API Client";
    }
  }

  /**
   *
   *
   * @param {string} path
   * @param {number} timestamp
   * @param {string} [body=""]
   * @returns {string}
   * @memberof BTCMarketsAPI
   */
  signData(path: string, timestamp: number, body: string = ""): string {
    const data = `${path}\n${timestamp}\n${body}`;
    const signer = crypto.createHmac("sha512", new Buffer(this.secret, "base64"));
    return signer.update(data).digest("base64");
  }
  /**
   *
   *
   * @param {string} path
   * @param {*} params
   * @returns {Promise<any>}
   * @memberof BTCMarketsAPI
   */
  async signedRequest(path: string, params: any) : Promise<any> {
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
  }
  /**
   *
   *
   * @param {string} instrument
   * @param {string} currency
   * @param {string} action
   * @param {*} params
   * @returns {Promise<any>}
   * @memberof BTCMarketsAPI
   */
  async publicRequest(instrument: string, currency: string, action: string, params: any) : Promise<any> {
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

  async getTick(instrument: instruments, currency: currencies): Promise<Tick> {
    return this.publicRequest(instrument, currency, "tick");
  }
  /**
   * 
   * 
   * @param {instruments} instrument
   * @param {currencies} currency
   * @returns {Promise<OrderBook>}
   * @memberof BTCMarketsAPI
   */
  async getOrderBook(instrument: instruments, currency: currencies) : Promise<OrderBook> {
    return this.publicRequest(instrument, currency, "orderbook");
  }

  /**
   *
   *
   * @param {instruments} instrument
   * @param {currencies} currency
   * @param {any} since
   * @returns {Promise<Trade[]>}
   * @memberof BTCMarketsAPI
   */
  async getTrades(instrument: instruments, currency: currencies, since: void | number) : Promise<Trade[]> {
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
   * @memberof BTCMarketsAPI
   */
  async createOrder(
    instrument: instruments,
    currency: currencies,
    price: void | number,
    volume: number,
    orderSide: OrderSide,
    ordertype: OrderType,
    clientRequestId?: void | string): Promise<NewOrder> {
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
   * @param {any} instrument
   * @param {any} currency
   * @param {any} limit
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
   * @param {any} instrument
   * @param {any} currency
   * @param {any} limit
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
   * @param {any} instrument
   * @param {any} currency
   * @param {any} limit
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
   * @param {any} instrument
   * @param {any} currency
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
   * @param {any} currency
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
   * @returns {Promise<BTCMarketsAPI.FundWithdrawals>}
   * @memberof BTCMarketsAPI
   */
  withdrawHistory(limit: number | void,
    since: number | void,
    indexForward: boolean | void): Promise<BTCMarkets.FundWithdrawals>
  {
    return this.signedRequest("/fundtransfer/history", {
      limit,
      since,
      indexForward,
    });
  };

}
export default BTCMarketsAPI;
