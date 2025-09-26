#!/bin/bash

# Deploy File Processing System Workflow to n8n Instance
# Usage: ./deploy_file_processing_system.sh [N8N_API_URL] [API_KEY]

set -e

# Configuration
N8N_API_URL="${1:-http://localhost:5678/api/v1}"
API_KEY="${2:-your-api-key-here}"
WORKFLOW_FILE="file_processing_system_mexico.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying File Processing System for Mexico${NC}"
echo -e "${BLUE}================================================${NC}"

# Check if workflow file exists
if [ ! -f "$WORKFLOW_FILE" ]; then
    echo -e "${RED}❌ Workflow file not found: $WORKFLOW_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}📄 Validating workflow JSON...${NC}"

# Validate JSON
if ! python3 -c "import json; json.load(open('$WORKFLOW_FILE'))"; then
    echo -e "${RED}❌ Invalid JSON in workflow file${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Workflow JSON is valid${NC}"

# Check n8n instance connectivity
echo -e "${YELLOW}🔍 Checking n8n instance connectivity...${NC}"

if ! curl -s --fail "$N8N_API_URL/workflows" -H "X-N8N-API-KEY: $API_KEY" > /dev/null; then
    echo -e "${RED}❌ Cannot connect to n8n instance at $N8N_API_URL${NC}"
    echo -e "${YELLOW}Please check:${NC}"
    echo "  1. n8n instance is running"
    echo "  2. API URL is correct"
    echo "  3. API key is valid"
    echo "  4. n8n API is enabled (N8N_API_AUTH_ENABLED=true)"
    exit 1
fi

echo -e "${GREEN}✅ n8n instance is accessible${NC}"

# Check if workflow already exists
WORKFLOW_NAME="Sistema Procesamiento Archivos México"
echo -e "${YELLOW}🔍 Checking if workflow already exists...${NC}"

EXISTING_WORKFLOW=$(curl -s "$N8N_API_URL/workflows" -H "X-N8N-API-KEY: $API_KEY" | \
    python3 -c "
import json, sys
data = json.load(sys.stdin)
for wf in data.get('data', []):
    if wf.get('name') == '$WORKFLOW_NAME':
        print(wf.get('id', ''))
        break
" 2>/dev/null || echo "")

if [ -n "$EXISTING_WORKFLOW" ]; then
    echo -e "${YELLOW}⚠️  Workflow already exists with ID: $EXISTING_WORKFLOW${NC}"
    read -p "Do you want to update it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Update existing workflow
        echo -e "${YELLOW}🔄 Updating existing workflow...${NC}"
        RESPONSE=$(curl -s -X PUT "$N8N_API_URL/workflows/$EXISTING_WORKFLOW" \
            -H "Content-Type: application/json" \
            -H "X-N8N-API-KEY: $API_KEY" \
            -d @"$WORKFLOW_FILE")

        if echo "$RESPONSE" | grep -q '"id"'; then
            echo -e "${GREEN}✅ Workflow updated successfully!${NC}"
            WORKFLOW_ID="$EXISTING_WORKFLOW"
        else
            echo -e "${RED}❌ Failed to update workflow${NC}"
            echo "$RESPONSE"
            exit 1
        fi
    else
        echo -e "${YELLOW}⏭️  Skipping deployment${NC}"
        exit 0
    fi
else
    # Create new workflow
    echo -e "${YELLOW}📤 Deploying new workflow...${NC}"
    RESPONSE=$(curl -s -X POST "$N8N_API_URL/workflows" \
        -H "Content-Type: application/json" \
        -H "X-N8N-API-KEY: $API_KEY" \
        -d @"$WORKFLOW_FILE")

    WORKFLOW_ID=$(echo "$RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('id', ''))
except:
    pass
" 2>/dev/null || echo "")

    if [ -n "$WORKFLOW_ID" ]; then
        echo -e "${GREEN}✅ Workflow deployed successfully!${NC}"
    else
        echo -e "${RED}❌ Failed to deploy workflow${NC}"
        echo "$RESPONSE"
        exit 1
    fi
fi

# Get workflow details
echo -e "${YELLOW}📋 Getting workflow details...${NC}"
WORKFLOW_DETAILS=$(curl -s "$N8N_API_URL/workflows/$WORKFLOW_ID" -H "X-N8N-API-KEY: $API_KEY")

# Extract webhook URL
WEBHOOK_PATH=$(echo "$WORKFLOW_DETAILS" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    for node in data.get('nodes', []):
        if node.get('type') == 'n8n-nodes-base.webhook':
            print(node.get('parameters', {}).get('path', 'upload-financial-files'))
            break
except:
    print('upload-financial-files')
" 2>/dev/null || echo "upload-financial-files")

# Construct webhook URL
N8N_BASE_URL=$(echo "$N8N_API_URL" | sed 's|/api/v1||')
WEBHOOK_URL="${N8N_BASE_URL}/webhook/${WEBHOOK_PATH}"

echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}Workflow ID:${NC} $WORKFLOW_ID"
echo -e "${GREEN}Workflow Name:${NC} $WORKFLOW_NAME"
echo -e "${GREEN}Webhook URL:${NC} $WEBHOOK_URL"
echo
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Test the webhook endpoint:"
echo "   curl -X POST \"$WEBHOOK_URL\" \\"
echo "        -H \"Content-Type: application/json\" \\"
echo "        -d '{\"companyId\":\"TEST_COMPANY\",\"userId\":\"test_user\",\"files\":[{\"name\":\"test.xml\",\"size\":1024}]}'"
echo
echo "2. Activate the workflow in n8n UI if needed"
echo "3. Configure any required credentials"
echo "4. Test with real CFDI and bank statement files"
echo
echo -e "${GREEN}✅ File Processing System is ready for Mexican businesses!${NC}"