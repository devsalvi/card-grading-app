#!/bin/bash

# Card Grading App - Create Admin User Script
# This script creates a new admin user in AWS Cognito

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
USER_POOL_ID="us-east-1_zHIFesZkh"
REGION="us-east-1"

echo -e "${GREEN}Card Grading App - Create Admin User${NC}"
echo "========================================"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install it with: brew install awscli"
    exit 1
fi

# Check if user is authenticated
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with AWS${NC}"
    echo "Run: aws configure"
    exit 1
fi

echo -e "${YELLOW}Enter new admin user details:${NC}"
echo ""

# Get email
read -p "Email address: " EMAIL
if [[ ! "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    echo -e "${RED}Error: Invalid email address${NC}"
    exit 1
fi

# Get name
read -p "Full name: " NAME
if [[ -z "$NAME" ]]; then
    echo -e "${RED}Error: Name cannot be empty${NC}"
    exit 1
fi

# Get password
while true; do
    read -s -p "Password (min 8 chars, uppercase, lowercase, number): " PASSWORD
    echo ""
    read -s -p "Confirm password: " PASSWORD_CONFIRM
    echo ""

    if [[ "$PASSWORD" != "$PASSWORD_CONFIRM" ]]; then
        echo -e "${RED}Error: Passwords do not match${NC}"
        continue
    fi

    if [[ ${#PASSWORD} -lt 8 ]]; then
        echo -e "${RED}Error: Password must be at least 8 characters${NC}"
        continue
    fi

    if [[ ! "$PASSWORD" =~ [A-Z] ]] || [[ ! "$PASSWORD" =~ [a-z] ]] || [[ ! "$PASSWORD" =~ [0-9] ]]; then
        echo -e "${RED}Error: Password must contain uppercase, lowercase, and number${NC}"
        continue
    fi

    break
done

echo ""
echo -e "${YELLOW}Creating user...${NC}"

# Create user
aws cognito-idp admin-create-user \
    --user-pool-id "$USER_POOL_ID" \
    --username "$EMAIL" \
    --user-attributes \
        Name=email,Value="$EMAIL" \
        Name=email_verified,Value=true \
        Name=name,Value="$NAME" \
    --message-action SUPPRESS \
    --region "$REGION" > /dev/null

echo -e "${GREEN}✓${NC} User created"

# Set permanent password
aws cognito-idp admin-set-user-password \
    --user-pool-id "$USER_POOL_ID" \
    --username "$EMAIL" \
    --password "$PASSWORD" \
    --permanent \
    --region "$REGION" > /dev/null

echo -e "${GREEN}✓${NC} Password set"

# Add to Admins group
aws cognito-idp admin-add-user-to-group \
    --user-pool-id "$USER_POOL_ID" \
    --username "$EMAIL" \
    --group-name Admins \
    --region "$REGION" > /dev/null

echo -e "${GREEN}✓${NC} Added to Admins group"

echo ""
echo -e "${GREEN}═══════════════════════════════════${NC}"
echo -e "${GREEN}Admin user created successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════${NC}"
echo ""
echo "Email: $EMAIL"
echo "Name: $NAME"
echo "Role: Admin"
echo ""
echo -e "${YELLOW}You can now sign in at:${NC}"
echo "http://localhost:5173/ → Click 'Admin' button"
echo ""
