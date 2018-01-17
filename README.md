BTC Markets Javascript API Client
===============

This is a node.js wrapper for the private and public methods exposed by the [BTC Markets API](https://github.com/BTCMarkets/API).
You will need have a registered account with [BTC Markets](https://btcmarkets.net) and generated API keys to access the private methods.

Please contact support@btcmarkets.net if you are having trouble opening and account or generating an API key. 

### Requirements

- Nodejs >= 8.9.4 - (we use babel-preset-env, so if you want to use an older version you can always clone and adjust the babel-preset-env options in the gulp file)

### Install

`npm install btc-markets`

### Design Principles
- **thin** the client is just a simple wrapper to the BTC Markets API. There is no parameter validation as this is delegated to the BTC Market API server. Similarly, there is no data transformation.
- **errors** all errors are returned as Error objects which can be used programmatically or for debugging
- **no retries** it's up to the calling program to handle retries as it'll vary between programs. For example, error handling timeouts on mutable API calls like addTrade and cancelOrder is not as simple as retying the API call as the operation my have been successful on the exchange but the response back was not.
- **minimal dependencies** minimal runtime dependencies (node-fetch) for security conscious people as npm can be an attack vector
- **testing** 

### Features
- Promises - all functions return promises and can be used with all its glory.
- Basic Rate limiting within the context of the Client per api. It is not a fool proof method, but it should work as long as you treat your client as a singleton. it can be disabled by providing {disableRateLimiters: true} as in option in the constructor. (it will only delay the execution of the command, till the queue has waited long enough)

### Examples

```js
import BTCMarkets from "btc-markets";
(async() => {
    try {
        const client = new BTCMarkets({key: "", secret: ""});

        const numberConverter = 100000000;    // one hundred million

        // get latest prices
        const tickData = await client.getTick("BTC", "AUD");
        console.log(`bid ${tickData.bestBid} ask ${tickData.bestAsk} last price ${tickData.lastPrice}`);

        // get order book
        const orderBook = await client.getOrderBook("BTC", "AUD");
        console.log(`${orderBook.asks.length} asks with best ask having price ${orderBook.asks[0][0]} and amount ${orderBook.asks[0][1]}`);

        // limit buy order for of 0.01 BTC at 230 AUD
        const createLimitedBuyOrder = await client.createOrder("BTC", "AUD", 230 * numberConverter, 0.01 * numberConverter, 'Bid', 'Limit', "10001");
        console.log(createLimitedBuyOrder);

        // market sell for 0.0001 BTC
        const sellOrder = await client.createOrder("BTC", "AUD", null, 0.0001 * numberConverter, 'Ask', 'Market', null);
        console.log(sellOrder);

        // cancel two limit orders with id's 123456 and 987654
        const cancelOrders = await client.cancelOrder([123456,987654]);
        console.log(`first order was cancelled ${cancelOrders.responses[0].success}`);

        const accountBalances = await client.getAccountBalances();
        accountBalances.forEach((account) => {
            console.log(`${account.currency} balance ${account.balance / numberConverter} pending ${account.pendingFunds / numberConverter}`);
        });

        const tradingFee = client.getTradingFee("BTC", "AUD");
        console.log(tradingFee);
    } catch (err) {
        console.log(err);
    }

})();

```

### Development

- We use gulp with babel for source transpiling.
- `npm run test` or `jest` to run test the test cases
- To run the private test cases you need to set the following keys in your environment variables or create a `.env` file with the following filled in
```
BTCMKT_KEY=""
BTCMKT_SECRET=""
```