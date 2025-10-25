#!/bin/bash

# Card Grading App - Assign Company Admin Script
# Assigns a user to a company-specific admin group

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

USER_POOL_ID="us-east-1_zHIFesZkh"
REGION="us-east-1"

echo -e "${GREEN}Card Grading App - Assign Company Admin${NC}"
echo "=========================================="
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check authentication
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with AWS${NC}"
    exit 1
fi

echo -e "${YELLOW}Available Companies:${NC}"
echo "1. PSA (Professional Sports Authenticator)"
echo "2. BGS (Beckett Grading Services)"
echo "3. SGC (Sportscard Guaranty)"
echo "4. CGC (Certified Guaranty Company)"
echo "5. Super Admin (Access to all companies)"
echo ""

read -p "Select company (1-5): " COMPANY_CHOICE

case $COMPANY_CHOICE in
    1)
        GROUP_NAME="PSA-Admins"
        COMPANY_NAME="PSA"
        ;;
    2)
        GROUP_NAME="BGS-Admins"
        COMPANY_NAME="BGS"
        ;;
    3)
        GROUP_NAME="SGC-Admins"
        COMPANY_NAME="SGC"
        ;;
    4)
        GROUP_NAME="CGC-Admins"
        COMPANY_NAME="CGC"
        ;;
    5)
        GROUP_NAME="Super-Admins"
        COMPANY_NAME="All Companies"
        ;;
    *)
        echo -e "${RED}Invalid selection${NC}"
        exit 1
        ;;
esac

echo ""
read -p "Enter user email: " EMAIL

if [[ ! "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    echo -e "${RED}Error: Invalid email address${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "Email: $EMAIL"
echo "Company: $COMPANY_NAME"
echo "Group: $GROUP_NAME"
echo ""
read -p "Proceed? (y/n): " CONFIRM

if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Cancelled"
    exit 0
fi

echo ""
echo -e "${YELLOW}Adding user to group...${NC}"

# Add user to group
aws cognito-idp admin-add-user-to-group \
    --user-pool-id $USER_POOL_ID \
    --username $EMAIL \
    --group-name $GROUP_NAME \
    --region $REGION

echo -e "${GREEN}✓${NC} User added to $GROUP_NAME"
echo ""
echo -e "${GREEN}═══════════════════════════════════${NC}"
echo -e "${GREEN}Admin assignment complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════${NC}"
echo ""
echo "Email: $EMAIL"
echo "Company: $COMPANY_NAME"
echo "Group: $GROUP_NAME"
echo ""
echo -e "${YELLOW}The user can now sign in and access the admin dashboard.${NC}"
echo -e "${YELLOW}They will only see submissions for $COMPANY_NAME.${NC}"
echo ""
