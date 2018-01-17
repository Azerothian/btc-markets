import RateLimiter from "../rate-limiter";

test("Test Rate Limiter", async () => {
  const limiter = new RateLimiter({
    amountOfCalls: 25,
    timePeriod: 3, //Jest defaults to 5 second timeouts
  });
  const startTime = new Date().getTime();
  for (var i = 0; i <= 26; i++) {
    await limiter.sleep();
  }
  const endTime = (new Date().getTime() - startTime);
  // console.log("endTime", endTime);
  expect(endTime).toBeGreaterThan(3000);
});
