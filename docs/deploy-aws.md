# Deploying to AWS

What gets created (`infra/aws/terraform`):

| Resource | Purpose |
|---|---|
| VPC (2 AZs, public + private subnets, NAT) | Network isolation; tasks and databases are private |
| Application Load Balancer (+ ACM certificate) | HTTPS, path routing: `/api/*` → api, `/farm-api/*` and `/socket.io/*` → farm-service, everything else → web |
| ECS Fargate cluster, 4 services | api, worker, farm-service, web (auto-scaling on the API; deployment circuit breaker with rollback) |
| ECR repositories | Container images (scan on push, keep last 20) |
| RDS PostgreSQL 17 | Users, predictions, jobs (encrypted, 7-day backups, deletion protection) |
| ElastiCache Redis | Celery broker |
| S3 + CloudFront (OAC) | Field photos: private bucket, presigned uploads, CDN reads |
| Secrets Manager | `JWT_SECRET` (generated), `DATABASE_URL`, `MONGODB_URI`, `ANTHROPIC_API_KEY` |
| CloudWatch Logs + Container Insights | Logs and metrics for every service |
| IAM OIDC role | GitHub Actions deploys without stored AWS keys |

MongoDB runs on **MongoDB Atlas** (choose the same AWS region) and is passed in
as `mongodb_uri`.

> These are paid AWS resources (NAT gateway, RDS, ElastiCache, ALB and Fargate
> run 24/7). Check the AWS Pricing Calculator before applying, and use
> `terraform destroy` to remove everything (disable `deletion_protection` on
> RDS first).

## Steps

1. **Prerequisites**: an AWS account, Terraform ≥ 1.6, AWS CLI logged in
   (`aws configure` or SSO), a MongoDB Atlas cluster, and optionally a domain
   with an ACM certificate in the chosen region.
2. **Configure**
   ```bash
   cd infra/aws/terraform
   cp terraform.tfvars.example terraform.tfvars   # fill in site_url, github_repository, mongodb_uri, ...
   ```
3. **Create the infrastructure**
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```
   Note the outputs: `load_balancer_url`, `github_deploy_role_arn`, `ecr_repositories`.
4. **Point your domain** (CNAME / Route 53 alias) at the load balancer and set
   `site_url` to it (re-run `terraform apply` if it changed).
5. **GitHub repository variables** (Settings → Secrets and variables → Actions → Variables):
   `AWS_DEPLOY_ROLE_ARN` (output above), `AWS_REGION`, `SITE_URL`.
   Create a `production` environment for approval gates if you want them.
6. **Deploy**: push to `main` (or run the *Deploy to AWS* workflow manually). It
   builds the four images, pushes them to ECR and rolls out the ECS services.
   The API applies database migrations on start.
7. **Train the model in AWS**: run the worker image as a one-off ECS task with
   the command `python -m ml.train` (from `/app`), or train locally and bake
   `ml/models/crop_model.joblib` into the API image.

## Alternatives

* **Vercel** for the web app (set the same `NEXT_PUBLIC_*` variables) with the
  APIs on AWS.
* **Render** / a single EC2 VM: `docker compose up -d` plus the HTTPS server block
  in `infra/nginx/nginx.conf` and a Let's Encrypt certificate.
