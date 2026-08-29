# 🛒 AWS Production E-Commerce Platform

> Production-style, highly available e-commerce infrastructure built on AWS using native cloud services, containerization, Auto Scaling, CloudFront, WAF, monitoring, and CI/CD with Jenkins.

---

## 📌 Project Overview

This project is a production-oriented AWS e-commerce platform designed to demonstrate practical Cloud Engineering, DevOps, Networking, Security, High Availability, Monitoring, Containerization, and CI/CD skills.

The infrastructure was initially built manually through the AWS Management Console to understand how the individual AWS services interact.

The next major stage is to reproduce the infrastructure using Terraform, transforming the manually created environment into a fully automated Infrastructure-as-Code architecture.

The project focuses primarily on cloud infrastructure and DevOps architecture rather than application development.

---

# 🏗️ Architecture

```text
                         Internet
                            │
                            ▼
                    ┌────────────────┐
                    │   CloudFront   │
                    │ Global Edge    │
                    │ Distribution   │
                    └───────┬────────┘
                            │
                            ▼
                    ┌────────────────┐
                    │    AWS WAF     │
                    │ Web Protection │
                    └───────┬────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │         ALB         │
                 │ Application LB      │
                 └──────────┬──────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼

        ┌──────────────────┐   ┌──────────────────┐
        │  Public Subnet A │   │  Public Subnet B │
        │   eu-north-1a    │   │   eu-north-1b    │
        │                  │   │                  │
        │   NAT Gateway    │   │                  │
        └────────┬─────────┘   └──────────────────┘
                 │
                 │ Internet
                 │ access for
                 │ private resources
                 ▼
        ┌──────────────────┐   ┌──────────────────┐
        │ Private Subnet A │   │ Private Subnet B │
        │   eu-north-1a    │   │   eu-north-1b    │
        │                  │   │                  │
        │ EC2 / ASG        │   │ EC2 / ASG        │
        │ Backend          │   │ Backend          │
        └────────┬─────────┘   └────────┬─────────┘
                 │                      │
                 └──────────┬───────────┘
                            │
                            ▼
                    ┌────────────────┐
                    │      RDS       │
                    │   PostgreSQL   │
                    │ Private Layer  │
                    └────────────────┘


        AWS Services accessed through VPC Endpoint
                         │
                         ▼
                    ┌──────────┐
                    │   S3     │
                    └──────────┘


                     Monitoring
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
         EC2/ASG       ALB          RDS
            │            │            │
            └────────────┼────────────┘
                         ▼
                   CloudWatch
                         │
                         ▼
                        SNS
                         │
                         ▼
                       Email



🌐 VPC Architecture

Component	Configuration
VPC Name	ecommerce-vpc
VPC ID	vpc-087c93645cdbd0be0
VPC CIDR	10.0.0.0/16
Region	eu-north-1
DNS Resolution	Enabled
DNS Hostnames	Enabled
Default VPC	No

                 ecommerce-vpc
                  10.0.0.0/16
                       │
          ┌────────────┴────────────┐
          │                         │
     eu-north-1a               eu-north-1b
          │                         │
    ┌─────┴─────┐             ┌─────┴─────┐
    │           │             │           │
 Public-A   Private-A       Public-B   Private-B


🌐 Public Layer
Internet
   │
   ▼
Internet Gateway
   │
   ├── Public Subnet A
   │      └── NAT Gateway
   │
   └── Public Subnet B

The public route table provides internet connectivity through the Internet Gateway.

The NAT Gateway is located in the public layer and allows private resources to initiate outbound internet connections without exposing the private EC2 instances directly to the internet.

🔒 Private Layer

The application backend is deployed into private subnets.

Private EC2
     │
     ▼
Private Route Table
     │
     ▼
NAT Gateway
     │
     ▼
Internet Gateway
     │
     ▼
Internet

The backend instances do not require public IP addresses.

🛣️ Route Tables

The VPC uses separate routing for the public and private layers.

ecommerce-public-rt
ecommerce-private-rt
Main route table

The public route table provides internet access through the Internet Gateway.

The private route table routes permitted outbound traffic through the NAT Gateway.

🌐 Internet Gateway

Created:

ecommerce-igw

Purpose:

Internet connectivity for public resources
Public subnet routing
NAT Gateway internet connectivity
🔄 NAT Gateway

Created:

ecommerce-nat-a

The NAT Gateway resides in the public layer.

Its purpose is to allow private EC2 instances to access external services while preventing unsolicited inbound internet traffic directly to the private instances.

🔗 VPC Endpoint

Created:

ecommerce-s3-endpoint

The S3 VPC endpoint provides private connectivity between the VPC and Amazon S3.

This allows supported S3 traffic to avoid unnecessarily traversing the NAT Gateway.

The EC2 → S3 access was also tested successfully.

🖥️ Compute Architecture

The backend compute architecture uses:

Launch Template
       │
       ▼
Auto Scaling Group
       │
       ├── EC2 - AZ A
       │
       └── EC2 - AZ B
🚀 Launch Template

Created:

ecommerce-backend-lt

Configuration:

Amazon Linux 2023
t3.micro
IAM instance profile
Security Group
EBS root volume
CloudWatch detailed monitoring
Application configuration/user data where required

The subnet is intentionally not hardcoded into the Launch Template.

Instead, the Auto Scaling Group selects the subnets:

Launch Template
       │
       ▼
Auto Scaling Group
       │
       ├── Private Subnet A
       └── Private Subnet B

This allows the same Launch Template to be used across multiple Availability Zones.

📈 Auto Scaling Group

Created:

ecommerce-backend-asg

Configuration:

Setting	Value
Desired Capacity	2
Minimum Capacity	2
Maximum Capacity	4
Scaling Policy	Target Tracking
CPU Target	50%
Availability Zones	2
Health Checks	EC2 + ELB
Instance Warmup	300 seconds

Architecture:

                  Auto Scaling Group
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
       Private Subnet A          Private Subnet B
              │                         │
             EC2                       EC2
              │                         │
              └────────────┬────────────┘
                           ▼
                          ALB

The Auto Scaling Group automatically adjusts capacity based on CPU utilization.

⚖️ Application Load Balancer

Created:

ecommerce-alb

Target Group:

ecommerce-backend-tg

Traffic flow:

Client
   │
   ▼
CloudFront
   │
   ▼
WAF
   │
   ▼
ALB
   │
   ▼
Target Group
   │
   ├── EC2
   └── EC2

The ALB distributes application traffic across backend instances and integrates with Auto Scaling health checks.

🐳 Containerization

The backend is containerized using Docker.

Architecture:

Application
     │
     ▼
Docker Image
     │
     ▼
Amazon ECR
     │
     ▼
EC2
     │
     ▼
Docker Container

The EC2 IAM role provides the required permissions for retrieving container images from ECR.

📦 Amazon ECR

Amazon Elastic Container Registry is used as the Docker image registry.

Application delivery flow:

Developer
    │
    ▼
Docker Build
    │
    ▼
Amazon ECR
    │
    ▼
EC2
    │
    ▼
Docker Container
🗄️ Database

The project uses:

Amazon RDS
PostgreSQL

The database belongs to the private infrastructure layer.

Architecture:

Internet
   │
   X
   │
ALB
   │
   ▼
Private EC2
   │
   ▼
Private RDS

The database is not directly exposed to the public internet.

🔐 Secrets Management

Database credentials are managed using:

AWS Secrets Manager

Architecture:

EC2
 │
 ├── IAM Role
 │
 ▼
Secrets Manager
 │
 ▼
Database Credentials
 │
 ▼
RDS PostgreSQL

This avoids hardcoding database credentials into the application.

🪣 Amazon S3

Created bucket:

ecommerce-platform-579302404833-eu-north-1-an

S3 is used as object storage within the project.

S3 is also integrated with the VPC through:

ecommerce-s3-endpoint
🌍 CloudFront

Created CloudFront distribution:

ecommerce-platform-cdn

Distribution:

drl7g80flsjyj.cloudfront.net

Architecture:

User
 │
 ▼
CloudFront
 │
 ▼
WAF
 │
 ▼
ALB

CloudFront provides the global edge layer for the application.

The distribution uses all available CloudFront edge locations for global performance.

🛡️ AWS WAF

AWS WAF is associated with the CloudFront distribution.

Architecture:

Internet
    │
    ▼
CloudFront
    │
    ▼
AWS WAF
    │
    ▼
ALB

The WAF configuration includes protections selected for the e-commerce/API workload, including:

AWS Core Rule Set
Known bad inputs protection
SQL injection protection
IP reputation protection
Anonymous IP protection
Rate limiting
Layer 7 protection
Additional AWS-managed protections selected during configuration

The WAF provides an application-layer security boundary before requests reach the ALB.

📊 CloudWatch Monitoring

Amazon CloudWatch is used for infrastructure monitoring.

EC2 / Auto Scaling

Monitoring includes:

CPU utilization
Instance health
Network activity
Auto Scaling metrics
ALB

Monitoring includes:

Request count
HTTP 4xx
HTTP 5xx
Target response time
Target health
RDS

Monitoring includes:

CPU utilization
Database connections
Free storage
Freeable memory
🚨 CloudWatch Alarms

CloudWatch alarms were configured for the environment.

The Auto Scaling Group also automatically created target-tracking alarms for CPU-based scaling.

Example:

CPU > 50%
    │
    ▼
Auto Scaling Policy
    │
    ▼
Increase Capacity

and:

CPU < Scaling Threshold
    │
    ▼
Auto Scaling Policy
    │
    ▼
Scale In
📧 SNS Notifications

Amazon SNS is used for operational notifications.

Architecture:

CloudWatch
    │
    ▼
Alarm
    │
    ▼
SNS Topic
    │
    ▼
Email

This provides an operational alerting mechanism for infrastructure events.

🛠️ AWS Systems Manager

The EC2 instances are configured for AWS Systems Manager.

The EC2 IAM role includes:

AmazonEC2ManagedInstanceCore

This enables Session Manager access.

Architecture:

AWS Systems Manager
        │
        ▼
Session Manager
        │
        ▼
Private EC2

This allows administration of private EC2 instances without requiring a public SSH endpoint or bastion host.

🔑 IAM

IAM roles are used instead of embedding long-term AWS access keys inside EC2.

The EC2 instance role provides access required for:

Systems Manager
ECR image retrieval
AWS services required by the application

The architecture follows the principle of least privilege as much as practical for the project.

🔄 CI/CD Pipeline

The project uses Jenkins for CI/CD.

The repository webhook automatically triggers Jenkins when changes are pushed.

Architecture:

Developer
    │
    ▼
Git Repository
    │
    │ Webhook
    ▼
Jenkins
    │
    ├── Checkout
    │
    ├── Test
    │
    ├── Docker Build
    │
    ├── Authenticate to ECR
    │
    ├── Push Image
    │
    └── Deploy
            │
            ▼
           EC2
🔁 Jenkins Pipeline

The CI/CD workflow is structured around:

Checkout
   ↓
Test
   ↓
Build Docker Image
   ↓
Authenticate to ECR
   ↓
Push Docker Image
   ↓
Deploy
   ↓
Health Check

The webhook removes the need for manually starting a Jenkins build after every repository change.

🔐 Security Architecture

The project uses a layered security architecture:

                    Internet
                       │
                       ▼
                  CloudFront
                       │
                       ▼
                      WAF
                       │
                       ▼
                      ALB
                       │
                       ▼
                Private EC2
                       │
                       ▼
                Private RDS

Security mechanisms include:

Public/private subnet separation
Private backend instances
Private database
Security Groups
IAM roles
AWS WAF
CloudFront
Secrets Manager
SSM Session Manager
VPC endpoint
No direct public access to backend EC2 instances
🏢 High Availability Design

The backend is distributed across two Availability Zones.

                 Application
                     │
                     ▼
                    ALB
                ┌────┴────┐
                │         │
                ▼         ▼
             AZ-A       AZ-B
                │         │
             EC2/ASG   EC2/ASG
                │         │
                └────┬────┘
                     ▼
                    RDS

Auto Scaling configuration:

Minimum = 2
Desired = 2
Maximum = 4

This provides redundancy and horizontal scaling capability.

📁 Project Structure
aws-ecommerce-platform/
│
├── README.md
│
├── docs/
│   ├── architecture/
│   ├── diagrams/
│   └── screenshots/
│
├── app/
│   ├── frontend/
│   └── backend/
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── jenkins/
│   ├── Jenkinsfile
│   └── README.md
│
├── infrastructure/
│   └── terraform/
│
└── .gitignore
🧠 AWS Services Used
AWS Service	Purpose
Amazon VPC	Network architecture
Subnets	Public/private network isolation
Internet Gateway	Internet connectivity
NAT Gateway	Private outbound connectivity
Route Tables	Network traffic routing
VPC Endpoint	Private AWS service connectivity
Security Groups	Network security
EC2	Application compute
Launch Template	Standardized EC2 configuration
Auto Scaling	High availability and scaling
Application Load Balancer	Application traffic distribution
Target Group	Backend instance registration
RDS PostgreSQL	Relational database
S3	Object storage
ECR	Docker image registry
IAM	Identity and permissions
Secrets Manager	Secret management
CloudFront	Global edge delivery
AWS WAF	Web application security
CloudWatch	Monitoring and alarms
SNS	Operational notifications
Systems Manager	Private EC2 management
💰 Cost Awareness

This project contains AWS services that can generate charges.

Particular attention should be paid to:

NAT Gateway
Application Load Balancer
RDS
CloudFront
AWS WAF
CloudWatch
SNS
S3
ECR

Resources should be stopped or deleted when they are not required for practice.

🎯 Engineering Concepts Demonstrated
Networking
VPC design
CIDR
Public/private subnet architecture
Multi-AZ networking
Route tables
Internet Gateway
NAT Gateway
VPC endpoints
Compute
EC2
Launch Templates
Auto Scaling Groups
Health checks
Target tracking
Multi-AZ deployment
Load Balancing
Application Load Balancer
Target Groups
Health checks
Traffic distribution
Security
Security Groups
IAM
AWS WAF
Secrets Manager
Private subnets
Systems Manager
Least-privilege access
AWS Architecture
CloudFront
S3
RDS
ECR
Multi-AZ architecture
Global edge delivery
Monitoring
CloudWatch
Metrics
Dashboards
Alarms
SNS notifications
DevOps
Git
Docker
ECR
Jenkins
Webhooks
Automated builds
Automated deployment
Infrastructure as Code

The next major stage is converting the manually created AWS infrastructure into Terraform.

🚀 Terraform Phase

After completing and validating the infrastructure through the AWS Console, the next major phase is rebuilding the architecture using Terraform.

Target structure:

terraform/
│
├── providers.tf
├── variables.tf
├── outputs.tf
├── main.tf
│
├── modules/
│   ├── vpc/
│   ├── security/
│   ├── iam/
│   ├── ec2/
│   ├── alb/
│   ├── asg/
│   ├── rds/
│   ├── s3/
│   ├── cloudfront/
│   ├── waf/
│   └── monitoring/
│
└── environments/
    └── production/

Terraform will eventually manage:

VPC
 ├── Public Subnets
 ├── Private Subnets
 ├── Route Tables
 ├── Internet Gateway
 ├── NAT Gateway
 └── VPC Endpoint

Security
 ├── Security Groups
 ├── IAM
 └── WAF

Compute
 ├── EC2
 ├── Launch Template
 └── Auto Scaling

Application
 ├── ALB
 └── Target Group

Database
 └── RDS

Storage
 ├── S3
 └── ECR

Edge
 └── CloudFront

Operations
 ├── CloudWatch
 └── SNS
📌 Project Status
✅ Completed
 Custom VPC
 VPC CIDR 10.0.0.0/16
 2 Public Subnets
 2 Private Subnets
 Multi-AZ architecture
 Internet Gateway
 Public Route Table
 Private Route Table
 NAT Gateway
 S3 VPC Endpoint
 Security Groups
 EC2
 IAM Instance Role
 Launch Template
 Application Load Balancer
 Target Group
 Auto Scaling Group
 Multi-AZ backend
 CPU Target Tracking
 EC2 + ELB health checks
 RDS PostgreSQL
 S3 bucket
 ECR
 Docker backend
 CloudFront
 AWS WAF
 CloudWatch monitoring
 CloudWatch alarms
 SNS notification architecture
 Systems Manager / SSM
 IAM integration
 Secrets Manager integration
 Jenkins CI/CD
 Jenkins Webhook workflow
🔜 Next Major Phase

The main remaining technical phase is:

Terraform Infrastructure as Code

The objective is to recreate the entire AWS architecture using Terraform instead of manually configuring resources through the AWS Console.

The Terraform implementation will include:

VPC
Subnets
Route Tables
Internet Gateway
NAT Gateway
VPC Endpoint
Security Groups
IAM
EC2
Launch Template
ALB
Target Groups
Auto Scaling
RDS
S3
ECR
CloudFront
WAF
CloudWatch
SNS

The Terraform phase will focus on:

Variables
Outputs
Data sources
Locals
Dynamic blocks
Modules
Remote state
State management
Dependency management
Reusable infrastructure
Environment separation

🔥 Architecture Summary
                         USERS
                           │
                           ▼
                    ┌─────────────┐
                    │ CloudFront  │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    AWS WAF  │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │     ALB     │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
                 EC2 AZ-a      EC2 AZ-b
                    │             │
                    └──────┬──────┘
                           │
                           ▼
                    PostgreSQL RDS
                           │
                           ▼
                           S3


              ┌──────────────────────────┐
              │        VPC 10.0.0.0/16  │
              │                          │
              │ Public A    Public B     │
              │    │           │         │
              │    └──── NAT ──┘         │
              │                          │
              │ Private A   Private B    │
              │    │           │         │
              │    └──── EC2 ───┘        │
              │                          │
              │       S3 Endpoint        │
              └──────────────────────────┘


Developer
   │
   ▼
Git
   │
 Webhook
   │
   ▼
Jenkins
   │
   ▼
Docker
   │
   ▼
ECR
   │
   ▼
EC2 / ASG

