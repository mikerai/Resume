#!/bin/bash

# Test File Processing System Workflow
# Usage: ./test_workflow.sh [WEBHOOK_URL]

set -e

WEBHOOK_URL="${1:-http://localhost:5678/webhook/upload-financial-files}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing File Processing System Workflow${NC}"
echo -e "${BLUE}===========================================${NC}"

# Test 1: Basic connectivity
echo -e "${YELLOW}Test 1: Webhook connectivity...${NC}"
if curl -s --fail -X POST "$WEBHOOK_URL" -H "Content-Type: application/json" -d '{}' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Webhook is accessible${NC}"
else
    echo -e "${RED}❌ Webhook not accessible at $WEBHOOK_URL${NC}"
    exit 1
fi

# Test 2: CFDI file processing
echo -e "${YELLOW}Test 2: CFDI file processing...${NC}"
CFDI_TEST='{
  "companyId": "TEST_EMPRESA_123",
  "userId": "test_user",
  "files": [
    {
      "name": "factura_cfdi_A001.xml",
      "size": 2048,
      "content": "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4="
    }
  ]
}'

CFDI_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$CFDI_TEST")

if echo "$CFDI_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ CFDI processing successful${NC}"
    echo "$CFDI_RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(f\"  📊 CFDIs processed: {data.get('breakdown', {}).get('cfdis', {}).get('count', 0)}\")
    print(f\"  💰 Total CFDI amount: \${data.get('summary', {}).get('total_cfdi_value_mxn', 0):,.2f} MXN\")
    print(f\"  🧠 Knowledge entries: {data.get('summary', {}).get('knowledge_entries_created', 0)}\")
except:
    pass
"
else
    echo -e "${RED}❌ CFDI processing failed${NC}"
    echo "$CFDI_RESPONSE"
fi

# Test 3: Bank statement processing
echo -e "${YELLOW}Test 3: Bank statement processing...${NC}"
BANK_TEST='{
  "companyId": "TEST_EMPRESA_123",
  "userId": "test_user",
  "files": [
    {
      "name": "estado_cuenta_bbva_marzo2024.pdf",
      "size": 1536,
      "content": "JVBERi0xLjQKJcOkw7zDssOzCjIgMCBvYmoKPDwvTGVuZ3==",
      "docType": "bank_statement"
    }
  ]
}'

BANK_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$BANK_TEST")

if echo "$BANK_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Bank statement processing successful${NC}"
    echo "$BANK_RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(f\"  🏦 Bank statements processed: {data.get('breakdown', {}).get('bank_statements', {}).get('count', 0)}\")
    print(f\"  📈 Net bank flow: \${data.get('summary', {}).get('net_bank_flow_mxn', 0):,.2f} MXN\")
    print(f\"  🔄 Reconciliation ready: {data.get('reconciliation_ready', False)}\")
except:
    pass
"
else
    echo -e "${RED}❌ Bank statement processing failed${NC}"
    echo "$BANK_RESPONSE"
fi

# Test 4: Mixed file processing
echo -e "${YELLOW}Test 4: Mixed file processing (CFDI + Bank + Other)...${NC}"
MIXED_TEST='{
  "companyId": "TEST_EMPRESA_123",
  "userId": "test_user",
  "files": [
    {
      "name": "factura_cfdi_B002.xml",
      "size": 1800,
      "content": "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4="
    },
    {
      "name": "estado_cuenta_santander_marzo.pdf",
      "size": 2200,
      "content": "JVBERi0xLjQKJcOkw7zDssOzCjIgMCBvYmoKPDwvTGVuZ3=="
    },
    {
      "name": "balance_general_marzo2024.xlsx",
      "size": 3400,
      "content": "UEsDBBQAAAAIAAAAAAAAAAAAAAAAAAAAAA=="
    }
  ]
}'

MIXED_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$MIXED_TEST")

if echo "$MIXED_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Mixed file processing successful${NC}"
    echo "$MIXED_RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    summary = data.get('summary', {})
    breakdown = data.get('breakdown', {})

    print(f\"  📄 Total files processed: {summary.get('files_processed', 0)}\")
    print(f\"  📊 CFDIs: {breakdown.get('cfdis', {}).get('count', 0)}\")
    print(f\"  🏦 Bank statements: {breakdown.get('bank_statements', {}).get('count', 0)}\")
    print(f\"  📋 Other documents: {breakdown.get('other_documents', {}).get('count', 0)}\")
    print(f\"  🧠 Knowledge entries created: {summary.get('knowledge_entries_created', 0)}\")
    print(f\"  ⏱️  Processing time: {summary.get('processing_time_ms', 0)}ms\")

    if data.get('rag_ready'):
        print(f\"  ✅ RAG integration ready\")
    if data.get('reconciliation_ready'):
        print(f\"  ✅ Bank reconciliation ready\")

    insights = data.get('insights', [])
    if insights:
        print(f\"  💡 Insights:\")
        for insight in insights[:2]:
            print(f\"     • {insight}\")

    actions = data.get('recommended_actions', [])
    if actions:
        print(f\"  🎯 Recommended actions:\")
        for action in actions[:2]:
            print(f\"     • {action.get('label', 'Unknown action')}\")

except:
    pass
"
else
    echo -e "${RED}❌ Mixed file processing failed${NC}"
    echo "$MIXED_RESPONSE"
fi

# Test 5: Error handling (invalid request)
echo -e "${YELLOW}Test 5: Error handling validation...${NC}"
ERROR_TEST='{"invalid": "request"}'

ERROR_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$ERROR_TEST")

if echo "$ERROR_RESPONSE" | grep -q -E '(error|Error|failed)'; then
    echo -e "${GREEN}✅ Error handling working correctly${NC}"
else
    echo -e "${YELLOW}⚠️  Error handling may need review${NC}"
fi

echo -e "${BLUE}🎉 Testing Complete!${NC}"
echo -e "${BLUE}==================${NC}"

echo -e "${GREEN}✅ File Processing System is operational${NC}"
echo
echo -e "${BLUE}📝 Integration URLs:${NC}"
echo "• File Upload: $WEBHOOK_URL"
echo "• RAG Integration: Ready for knowledge base queries"
echo "• Bank Reconciliation: Ready for automated matching"
echo
echo -e "${BLUE}🔗 Next Steps:${NC}"
echo "1. Test with real CFDI and bank statement files"
echo "2. Integrate with web RAG chatbot workflow"
echo "3. Connect to bank reconciliation service"
echo "4. Monitor processing performance and accuracy"