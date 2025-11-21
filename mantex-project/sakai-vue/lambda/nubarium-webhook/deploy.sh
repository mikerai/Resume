#!/bin/bash
# 🚀 Deploy Nubarium Webhook to AWS Lambda
# Execute: chmod +x deploy.sh && ./deploy.sh

set -e

echo "🚀 Deploying Nubarium Webhook to AWS Lambda..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    echo "export SUPABASE_URL=\"https://your-project.supabase.co\""
    echo "export SUPABASE_SERVICE_KEY=\"your_service_role_key\""
    echo ""
    echo -e "${YELLOW}💡 You can also create a .env file with these variables${NC}"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not configured. Run:${NC}"
    echo "aws configure"
    exit 1
fi

# Configuration
FUNCTION_NAME="nubarium-webhook"
REGION="us-east-1"
ROLE_NAME="mantex-lambda-execution-role"

echo -e "${GREEN}✅ Environment variables configured${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install --production

# Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
zip -r webhook-deployment.zip . -x "*.zip" "deploy.sh" "test.js" ".git/*" "node_modules/.cache/*"

# Get account ID and role ARN
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"

echo -e "${YELLOW}🚀 Deploying function: $FUNCTION_NAME${NC}"

# Try to create or update function
if aws lambda get-function --function-name $FUNCTION_NAME &> /dev/null; then
    echo -e "${YELLOW}⚠️ Function exists, updating code...${NC}"

    # Update function code
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://webhook-deployment.zip

    # Update environment variables
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --environment Variables="{SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY}"

    echo -e "${GREEN}✅ Function updated successfully!${NC}"
else
    echo -e "${YELLOW}🆕 Creating new function...${NC}"

    # Create function
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime nodejs18.x \
        --role $ROLE_ARN \
        --handler index.handler \
        --zip-file fileb://webhook-deployment.zip \
        --timeout 30 \
        --memory-size 128 \
        --environment Variables="{SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY}" \
        --region $REGION

    echo -e "${GREEN}✅ Function created successfully!${NC}"
fi

# Get function details
FUNCTION_ARN=$(aws lambda get-function --function-name $FUNCTION_NAME --query Configuration.FunctionArn --output text)

echo -e "${GREEN}🎉 Lambda deployed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Function Details:${NC}"
echo "Function Name: $FUNCTION_NAME"
echo "Function ARN: $FUNCTION_ARN"
echo "Region: $REGION"
echo ""
echo -e "${YELLOW}🌐 Next Steps:${NC}"
echo "1. Run the main aws-setup.sh script to create API Gateway"
echo "2. Or manually create an API Gateway endpoint"
echo "3. Point it to this Lambda function"
echo ""
echo -e "${GREEN}✅ Ready to receive webhooks!${NC}"

# Cleanup
rm webhook-deployment.zip

echo "Done!"