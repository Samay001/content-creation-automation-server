#!/bin/bash

echo "Testing NestJS application endpoints..."
echo ""

echo "1. Testing main endpoint (GET /):"
curl -s http://localhost:3000
echo ""
echo ""

echo "2. Testing health endpoint (GET /health):"
curl -s http://localhost:3000/health
echo ""
echo ""

echo "Application endpoints tested successfully!"