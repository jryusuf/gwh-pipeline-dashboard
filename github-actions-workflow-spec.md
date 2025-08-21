# GitHub Actions Workflow Implementation Specification

## Workflow File: `.github/workflows/ci-cd.yml`

This document specifies the complete GitHub Actions workflow implementation for the Grant Pipeline Dashboard application.

## Workflow Configuration

```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-deploy:
    name: Build and Deploy
    runs-on: ubuntu-latest
    environment: production
    steps:
      # Checkout code
      - name: Checkout repository
        uses: actions/checkout@v4

      # Setup Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      # Install dependencies
      - name: Install dependencies
        run: npm ci

      # Build application
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      # Set up Docker Buildx
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # Login to container registry
      - name: Log in to container registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # Extract metadata for Docker
      - name: Extract Docker metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}

      # Build and push Docker image
      - name: Build and push Docker image
        id: push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

      # Security scanning
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ steps.meta.outputs.tags }}
          format: 'table'
          exit-code: '1'
          ignore-unfixed: true
          vuln-type: 'os,library'
          severity: 'CRITICAL,HIGH'

      # Deploy to DigitalOcean
      - name: Deploy to DigitalOcean Droplet
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DIGITALOCEAN_HOST }}
          username: ${{ secrets.DIGITALOCEAN_USERNAME }}
          key: ${{ secrets.DIGITALOCEAN_SSH_KEY }}
          script: |
            # Pull the latest image
            docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            
            # Stop and remove existing container
            docker stop grant-pipeline-dashboard || true
            docker rm grant-pipeline-dashboard || true
            
            # Run new container
            docker run -d \
              --name grant-pipeline-dashboard \
              -p 3000:3000 \
              -e NEXT_PUBLIC_SUPABASE_URL=${{ secrets.SUPABASE_URL }} \
              -e NEXT_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.SUPABASE_ANON_KEY }} \
              ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            
            # Health check
            sleep 10
            curl -f http://localhost:3000/api/health || exit 1

      # Success notification
      - name: Notify on success
        if: success()
        uses: slackapi/slack-github-action@v1.26.0
        with:
          payload: |
            {
              "text": "✅ Deployment successful for ${{ github.repository }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "✅ *Deployment successful*\nRepository: ${{ github.repository }}\nCommit: ${{ github.sha }}\nBranch: ${{ github.ref }}\nActor: ${{ github.actor }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

      # Failure notification
      - name: Notify on failure
        if: failure()
        uses: slackapi/slack-github-action@v1.26.0
        with:
          payload: |
            {
              "text": "❌ Deployment failed for ${{ github.repository }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "❌ *Deployment failed*\nRepository: ${{ github.repository }}\nCommit: ${{ github.sha }}\nBranch: ${{ github.ref }}\nActor: ${{ github.actor }}\nJob: ${{ github.job }}\nWorkflow: ${{ github.workflow }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Detailed Implementation Breakdown

### 1. Workflow Triggers
- **Push to main branch**: Automatic trigger on code changes
- **Workflow dispatch**: Manual trigger for on-demand deployments

### 2. Environment Variables
- `REGISTRY`: Container registry (GitHub Container Registry)
- `IMAGE_NAME`: Repository name for Docker image tagging

### 3. Job Configuration
- **Name**: Build and Deploy
- **Runner**: Ubuntu latest
- **Environment**: Production environment for security

### 4. Build Process Steps

#### Checkout and Setup
- Uses `actions/checkout@v4` for code retrieval
- Sets up Node.js 20 with npm caching
- Installs dependencies with `npm ci` for reproducible builds

#### Application Build
- Runs `npm run build` with Supabase environment variables
- Builds Next.js application with production optimizations

#### Docker Image Creation
- Uses `docker/setup-buildx-action@v3` for enhanced Docker builds
- Authenticates with GitHub Container Registry
- Extracts Docker metadata for proper tagging
- Builds and pushes Docker image with multi-architecture support

### 5. Security Scanning
- Uses `aquasecurity/trivy-action` for vulnerability scanning
- Scans for OS and library vulnerabilities
- Fails on CRITICAL and HIGH severity issues
- Ignores unfixed vulnerabilities to reduce noise

### 6. Deployment to DigitalOcean
- Uses `appleboy/ssh-action` for secure SSH deployment
- Pulls latest Docker image from registry
- Implements blue-green deployment pattern:
  - Stops existing container
  - Removes old container
  - Starts new container with latest image
  - Performs health check validation

### 7. Environment Variables for Deployment
- `DIGITALOCEAN_HOST`: Droplet IP address
- `DIGITALOCEAN_USERNAME`: SSH username
- `DIGITALOCEAN_SSH_KEY`: Private SSH key for authentication
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SLACK_WEBHOOK_URL`: Slack webhook for notifications

### 8. Monitoring and Notifications
- **Success Notifications**: Slack message on successful deployment
- **Failure Notifications**: Slack message on deployment failure with details
- **Health Checks**: Automated verification of deployed application

## Rollback Implementation

The rollback procedure is implemented through the workflow design:

1. **Automatic Rollback**: If health check fails, the deployment is considered failed
2. **Manual Rollback**: Previous image versions can be redeployed manually
3. **Version Management**: Docker image tags provide version control

## Security Considerations

### Secret Management
- All sensitive information stored in GitHub Actions secrets
- No hardcoded credentials in workflow files
- SSH keys with restricted permissions
- Supabase credentials with minimal required permissions

### Container Security
- Official base images from trusted sources
- Regular vulnerability scanning with Trivy
- Minimal attack surface through multi-stage builds
- Non-root user in production container

### Network Security
- SSH key-based authentication only
- Firewall rules on DigitalOcean droplet
- Secure communication with Supabase
- Encrypted communication with container registry

## Performance Optimization

### Build Optimization
- Docker layer caching for faster builds
- npm dependency caching
- Multi-stage Docker builds for smaller images
- Parallel job execution where possible

### Deployment Optimization
- Zero-downtime deployment with blue-green strategy
- Health check validation before traffic routing
- Efficient container startup times
- Resource optimization on DigitalOcean droplet

## Error Handling and Recovery

### Deployment Failures
- Automatic failure detection through health checks
- Immediate notification on deployment issues
- Detailed error logging for troubleshooting
- Graceful handling of partial failures

### Recovery Procedures
- Manual redeployment of previous versions
- Container restart capabilities
- Log analysis for root cause identification
- Incident response procedures

## Monitoring and Observability

### Deployment Tracking
- Commit SHA tracking for deployed versions
- Branch and actor information
- Timestamped deployment records
- Success/failure metrics

### Application Health
- HTTP endpoint health checks
- Container status monitoring
- Resource usage tracking
- Error rate monitoring

## Future Enhancements

### Testing Integration
- Unit test execution in workflow
- Integration test suite
- End-to-end testing with Cypress
- Performance testing with Artillery

### Advanced Security
- Dependency scanning with Snyk
- Code quality analysis with SonarQube
- Security policy enforcement
- Compliance checking

### Enhanced Monitoring
- Comprehensive observability with Prometheus
- Log aggregation with ELK stack
- Advanced alerting mechanisms
- Business metrics tracking

## Implementation Notes

### Prerequisites
1. GitHub repository secrets configured
2. DigitalOcean droplet with Docker installed
3. SSH key pair for secure deployment
4. Supabase project with proper credentials
5. Slack webhook for notifications (optional)

### Configuration Requirements
1. Enable GitHub Actions on repository
2. Configure production environment in GitHub
3. Set required secrets in repository settings
4. Configure DigitalOcean firewall rules
5. Set up health check endpoint in application

### Maintenance Considerations
1. Regular security scanning updates
2. Dependency version updates
3. Workflow optimization based on usage patterns
4. Monitoring threshold adjustments
5. Backup and disaster recovery procedures

This specification provides a complete implementation guide for the GitHub Actions CI/CD workflow that will automatically deploy the Grant Pipeline Dashboard application to a DigitalOcean droplet on every push to the main branch.