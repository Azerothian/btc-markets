import "dotenv/config";
import BTCMarket from "../index";

if(process.env.BTCMKT_KEY && process.env.BTCMKT_SECRET) {
  let client = new BTCMarket({
    key: process.env.BTCMKT_KEY,
    secret: process.env.BTCMKT_SECRET,
  });
  //{ success: true, errorCode: null, errorMessage: null, orders: [] }
  test("getOpenOrders", async () => {
    const openOrders = await client.getOpenOrders("BTC", "AUD", 10, null);
    expect(openOrders).toBeDefined();
  });
  // [ { balance: 0, pendingFunds: 0, currency: 'AUD' },
  //       { balance: 0, pendingFunds: 0, currency: 'BTC' },
  //       { balance: 0, pendingFunds: 0, currency: 'LTC' },
  //       { balance: 0, pendingFunds: 0, currency: 'ETH' },
  //       { balance: 0, pendingFunds: 0, currency: 'XRP' },
  //       { balance: 0, pendingFunds: 0, currency: 'ETC' },
  //       { balance: 0, pendingFunds: 0, currency: 'BCH' } ]
  test("getAccountBalances", async () => {
    const balance = await client.getAccountBalances();
    expect(balance).toBeDefined();
  });
  test("getTradingFee", async () => {
    const tradingFee = await client.getTradingFee("BTC", "AUD");
    expect(tradingFee).toBeDefined();
  });
  test("getTradeHistory", async () => {
    const tradingHistory = await client.getTradeHistory("BTC", "AUD", 10, 1);
    expect(tradingHistory).toBeDefined();
  });
  test("getOrderHistory", async () => {
    const orderHistory = await client.getOrderHistory("BTC", "AUD", 10, 1);
    expect(orderHistory).toBeDefined();
  });

} else {
  console.log("Will not run private tests as key and secret is missing from process.env");
  test("Will not run private tests as key and secret is missing from process.env", () => {
    expect(true).toBe(true);
  });
}
