---
layout: default
title: InjectiveQL Documentation
---

# InjectiveQL Documentation

**GraphQL API Gateway for Injective Protocol**

---

## 📚 Documentation Index

### Getting Started

- [Quick Start Guide](QUICK_START.html) - Get up and running in 5 minutes
- [Architecture Overview](ARCHITECTURE.html) - System design and components

### API Documentation

- **Interactive Docs**:
  - [GraphQL Playground](http://localhost:4000/graphql) - Try queries live
  - [Swagger UI](http://localhost:4000/api-docs) - REST API documentation

### Performance & Analysis

- [Performance Benchmarks](../PERFORMANCE_ANALYSIS.html) - Response times and optimization

---

## 🚀 Quick Links

**API Endpoints (Local):**

- GraphQL: `http://localhost:4000/graphql`
- Swagger UI: `http://localhost:4000/api-docs`
- Health Check: `http://localhost:4000/health`

**GitHub:**

- [Repository](https://github.com/Nihal-Pandey-2302/injectiveql)
- [Issues](https://github.com/Nihal-Pandey-2302/injectiveql/issues)

---

## 📖 Key Features

- **15ms average response time** - Blazing fast with multi-tier caching
- **Pre-computed analytics** - Volatility, liquidity, health scores
- **Dual API** - GraphQL + REST with Swagger documentation
- **Whale tracking** - Monitor $100k+ trades automatically
- **N1NJ4 Integration** - NFT-based rate limiting
- **Production-ready** - Docker deployment with resilient architecture

---

## 🎯 Example Queries

### GraphQL - Market Health

```graphql
query MarketHealth {
  markets(limit: 5) {
    ticker
    price
    volume24h
    liquidityScore
    volatility24h
    healthScore
  }
}
```

### REST - N1NJ4 Verification

```bash
curl -X POST http://localhost:4000/api/v1/identity/verify \
  -H "Content-Type: application/json" \
  -d '{"address": "inj1..."}'
```

---

## 🏗️ Architecture

InjectiveQL uses a multi-tier resilience architecture:

```
Client → HTTP REST API (Primary)
       ↓ (fallback)
       → gRPC SDK (Secondary)
       ↓ (fallback)
       → Cached Data (Safety Net)
```

This ensures 100% uptime even during network issues.

---

## 🤝 Contributing

Contributions welcome! Please see our [GitHub repository](https://github.com/Nihal-Pandey-2302/injectiveql) for more details.

---

**Built with ❤️ for the Injective ecosystem**
