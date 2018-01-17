import BTCMarket from "../index";

const client = new BTCMarket();

// { bestBid: 14790,
//   bestAsk: 14920.87,
//   lastPrice: 14914.23,
//   currency: 'AUD',
//   instrument: 'BTC',
//   timestamp: 1516155536,
//   volume24h: 2314.2655 }


test("getTick", async () => {
  const tick = await client.getTick("BTC", "AUD");
  expect(tick.bestBid).toBeDefined();
  expect(tick.bestAsk).toBeDefined();
  expect(tick.lastPrice).toBeDefined();
  expect(tick.timestamp).toBeDefined();
  expect(tick.volume24h).toBeDefined();
  expect(tick.currency).toBe("AUD");
  expect(tick.instrument).toBe("BTC");
});

// { currency: 'AUD',
//   instrument: 'BTC',
//   timestamp: 1516155985,
//   asks:
//     [ [ 14797.79, 0.93 ],],
//   bids:
//     [ [ 14720, 0.956 ],] }

test("getOrderBook", async () => {
  const orderBook = await client.getOrderBook("BTC", "AUD");
  expect(orderBook).toBeDefined();
  expect(orderBook.currency).toBe("AUD");
  expect(orderBook.instrument).toBe("BTC");
  expect(orderBook.timestamp).toBeDefined();
  expect(orderBook.asks).toBeDefined();
  expect(Array.isArray(orderBook.asks)).toBe(true);
  expect(orderBook.bids).toBeDefined();
  expect(Array.isArray(orderBook.bids)).toBe(true);
});
// [ { tid: 1132585626,
//   amount: 0.00625039,
//   price: 14720,
//   date: 1516156278 },
// ]

test("getTrades", async() => {
  const trades = await client.getTrades("BTC", "AUD");
  expect(trades).toBeDefined();
  expect(Array.isArray(trades)).toBe(true);
  const trade = trades[0];
  expect(trade.tid).toBeDefined();
  expect(trade.amount).toBeDefined();
  expect(trade.price).toBeDefined();
  expect(trade.date).toBeDefined();
});
