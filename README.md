# Hello :)

## Scripts

```
deploy/use-market.ts
```

Steps:

-

```
deploy/use-paymaster.ts
```

Script which allows us test complete flow of Paymaster contract. We developed the complex script to make it easy for us to test, and build our backend API.

Steps:

- Deploy empty,
- Deploy event,
- Deploy asset account factory,
- Deploy account abstraction,
- Deploy mockUSDC token,
- Deploy Paymasters,
- Send ETH to Paymasters,
- Set API3 proxy to calculate gas in any ERC20 token,
- Buy one ticket from event contract, pay gas using Paymasters paying in ERC20 token,

```
deploy/use-paymaster-general.ts
```

We decided to support general flow, and make user transaction gasless. So the user do not need any tokens on his wallet to perform transaction.

Steps:

- Deploy empty,
- Deploy event,
- Deploy asset account factory,
- Deploy account abstraction,
- Deploy mockUSDC token,
- Deploy Paymasters,
- Send ETH to Paymasters,
- Buy one ticket from event contract, pay gas using Paymasters paying in native token,
