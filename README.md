# Hello :)

## Contracts

We developed various contracts:

- AAFactory - asset account factory,
- Event - based on ERC721A, event smart contract. Each event is deployed on-chain,
- ProxyEvent - proxy contract "mother" for all events, so any event emitted in Event contract, going through this proxy smart contract. That allows us to integrate the graph ecosystem, and notify events organizers about tickets buying, supply reaching out 10%/20%/50%/100% etc
- Market - marketplace for event tickets, allows us to list, buy, and sell tokens, keeping the maximum price
- NewPaymaster - Paymaster implementation, based on api3. We've implemented two ways of gasless transactions - paying in any erc20 token, or paymaster paying with native eth token. So either wallet pays in erc20, or paymaster with native token
- USDCMOCK - erc20 implementation for mock usdc,
- XAAcount - abstraction account implementation

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
