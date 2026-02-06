#!/bin/bash

# InjectiveQL API Testing Script
# Tests all endpoints and collects performance metrics

set -e

API_URL="http://localhost:4000"
BOLD="\033[1m"
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
NC="\033[0m" # No Color

echo -e "${BOLD}🚀 InjectiveQL API Test Suite${NC}\n"

# Function to test endpoint and measure response time
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    
    echo -e "${YELLOW}Testing:${NC} $name"
    
    START=$(date +%s%N)
    if [ "$method" = "POST" ]; then
        RESPONSE=$(curl -s -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\n%{http_code}\n%{time_total}")
    else
        RESPONSE=$(curl -s -X GET "$url" \
            -w "\n%{http_code}\n%{time_total}")
    fi
    END=$(date +%s%N)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 2 | head -n 1)
    TIME=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -2)
    
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
        echo -e "${GREEN}✓${NC} Status: $HTTP_CODE | Response Time: ${TIME}s"
        echo "   Preview: $(echo $BODY | head -c 100)..."
    else
        echo -e "${RED}✗${NC} Status: $HTTP_CODE | Error: $BODY"
    fi
    echo ""
}

# Test 1: Health Check
echo -e "${BOLD}=== Basic Health Check ===${NC}"
test_endpoint "Health Check" "GET" "$API_URL/health"

# Test 2: GraphQL Endpoint
echo -e "${BOLD}=== GraphQL Tests ===${NC}"
test_endpoint "GraphQL Markets Query" "POST" "$API_URL/graphql" \
    '{"query":"{ markets(limit: 5) { ticker marketId marketType } }"}'

test_endpoint "GraphQL Market with Metrics" "POST" "$API_URL/graphql" \
    '{"query":"{ markets(limit: 2) { ticker liquidityScore volatility24h healthScore } }"}'

test_endpoint "GraphQL Arbitrage" "POST" "$API_URL/graphql" \
    '{"query":"{ arbitrageOpportunities(minSpread: 0.3, limit: 3) { marketPair spread potentialProfit } }"}'

test_endpoint "GraphQL Whale Activity" "POST" "$API_URL/graphql" \
    '{"query":"{ whaleActivity(limit: 5) { activityType usdValue detectedAt } }"}'

# Test 3: REST API Endpoints
echo -e "${BOLD}=== REST API Tests ===${NC}"
test_endpoint "Cached Markets List" "GET" "$API_URL/api/v1/cache/markets"

test_endpoint "N1NJ4 Verification" "POST" "$API_URL/api/v1/identity/verify" \
    '{"address":"inj1test123"}'

# Test 4: Rate Limiting
echo -e "${BOLD}=== Rate Limiting Test ===${NC}"
echo "Sending 5 rapid requests to check rate limiting..."
for i in {1..5}; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
    echo "  Request $i: HTTP $RESPONSE"
    sleep 0.1
done

echo ""
echo -e "${BOLD}=== Performance Summary ===${NC}"
echo "Run 'docker compose logs api' to see detailed server logs"
echo "GraphQL Playground: http://localhost:4000/graphql"
echo ""
echo -e "${GREEN}✓ Testing complete!${NC}"
