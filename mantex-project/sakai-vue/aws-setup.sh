#!/bin/bash
# 🚀 Setup completo de AWS para Mantex
# Execute: chmod +x aws-setup.sh && ./aws-setup.sh

set -e  # Exit on any error

echo "🚀 Setting up AWS infrastructure for Mantex..."

# Variables
BUCKET_NAME="mantex-documents-$(date +%s)"  # Unique bucket name
REGION="us-east-1"
LAMBDA_FUNCTION_NAME="nubarium-webhook"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Install it first:${NC}"
    echo "brew install awscli  # macOS"
    echo "curl 'https://awscli.amazonaws.com/AWSCLIV2.pkg' -o 'AWSCLIV2.pkg' && sudo installer -pkg AWSCLIV2.pkg -target /"
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not configured. Run:${NC}"
    echo "aws configure"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# 1. Create S3 Bucket
echo -e "${YELLOW}📦 Creating S3 bucket: $BUCKET_NAME${NC}"

if aws s3 mb s3://$BUCKET_NAME --region $REGION; then
    echo -e "${GREEN}✅ S3 bucket created: $BUCKET_NAME${NC}"
else
    echo -e "${RED}❌ Failed to create S3 bucket${NC}"
    exit 1
fi

# Configure bucket policy for private access
echo -e "${YELLOW}🔒 Configuring bucket permissions...${NC}"
aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo -e "${GREEN}✅ S3 bucket secured${NC}"

# 2. Create IAM Role for Lambda
echo -e "${YELLOW}👤 Creating IAM role for Lambda...${NC}"

TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'

LAMBDA_ROLE_NAME="mantex-lambda-execution-role"

# Create role
if aws iam create-role \
    --role-name $LAMBDA_ROLE_NAME \
    --assume-role-policy-document "$TRUST_POLICY" &> /dev/null; then
    echo -e "${GREEN}✅ IAM role created: $LAMBDA_ROLE_NAME${NC}"
else
    echo -e "${YELLOW}⚠️ IAM role might already exist${NC}"
fi

# Attach policies
aws iam attach-role-policy \
    --role-name $LAMBDA_ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

echo -e "${GREEN}✅ IAM role configured${NC}"

# 3. Deploy Lambda Function
echo -e "${YELLOW}🚀 Deploying Lambda function...${NC}"

cd lambda/nubarium-webhook

# Install dependencies
echo -e "${YELLOW}📦 Installing Lambda dependencies...${NC}"
npm install --production

# Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
zip -r webhook-deployment.zip . -x "*.zip" "deploy.sh" "test.js" ".git/*" "node_modules/.cache/*"

# Get account ID for ARN
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$LAMBDA_ROLE_NAME"

# Wait a bit for role to propagate
echo -e "${YELLOW}⏳ Waiting for IAM role to propagate...${NC}"
sleep 10

# Deploy Lambda
if aws lambda create-function \
    --function-name $LAMBDA_FUNCTION_NAME \
    --runtime nodejs18.x \
    --role $ROLE_ARN \
    --handler index.handler \
    --zip-file fileb://webhook-deployment.zip \
    --timeout 30 \
    --memory-size 128 \
    --environment Variables="{SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY}" \
    --region $REGION; then
    echo -e "${GREEN}✅ Lambda function deployed${NC}"
else
    echo -e "${YELLOW}⚠️ Lambda might exist, updating code...${NC}"
    aws lambda update-function-code \
        --function-name $LAMBDA_FUNCTION_NAME \
        --zip-file fileb://webhook-deployment.zip

    aws lambda update-function-configuration \
        --function-name $LAMBDA_FUNCTION_NAME \
        --environment Variables="{SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY}"
fi

# 4. Create API Gateway
echo -e "${YELLOW}🌐 Creating API Gateway...${NC}"

# Create REST API
API_ID=$(aws apigateway create-rest-api \
    --name "nubarium-webhook-api" \
    --description "API for Nubarium webhook" \
    --query 'id' \
    --output text)

echo -e "${GREEN}✅ API Gateway created: $API_ID${NC}"

# Get root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[0].id' \
    --output text)

# Create webhook resource
WEBHOOK_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_RESOURCE_ID \
    --path-part webhook \
    --query 'id' \
    --output text)

# Create sat resource
SAT_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $WEBHOOK_RESOURCE_ID \
    --path-part sat \
    --query 'id' \
    --output text)

# Create POST method
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $SAT_RESOURCE_ID \
    --http-method POST \
    --authorization-type NONE

# Configure integration
LAMBDA_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$LAMBDA_FUNCTION_NAME"

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $SAT_RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations"

# Add Lambda permission for API Gateway
aws lambda add-permission \
    --function-name $LAMBDA_FUNCTION_NAME \
    --statement-id "api-gateway-invoke-permission" \
    --action "lambda:InvokeFunction" \
    --principal "apigateway.amazonaws.com" \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*"

# Deploy API
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name dev

# Get API endpoint
API_ENDPOINT="https://$API_ID.execute-api.$REGION.amazonaws.com/dev/webhook/sat"

echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo ""
echo -e "${YELLOW}📋 Configuration Summary:${NC}"
echo "S3 Bucket: $BUCKET_NAME"
echo "Lambda Function: $LAMBDA_FUNCTION_NAME"
echo "API Gateway: $API_ID"
echo "Webhook URL: $API_ENDPOINT"
echo ""
echo -e "${YELLOW}📝 Add these to your .env files:${NC}"
echo "VITE_AWS_S3_BUCKET=$BUCKET_NAME"
echo "VITE_LAMBDA_WEBHOOK_URL=$API_ENDPOINT"
echo ""
echo -e "${GREEN}✅ Ready to rock! 🤘${NC}"

cd ../..
echo "Done!"