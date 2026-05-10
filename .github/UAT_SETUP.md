# UAT Deployment Setup

## GitHub Secrets Required

Navigate to **Settings → Secrets and Variables → Actions** in the GitHub repo and add:

### Secrets
| Secret | Description |
|--------|-------------|
| `UAT_SSH_HOST` | IP or hostname of the UAT server |
| `UAT_SSH_USER` | SSH username (e.g. `ubuntu`, `deploy`) |
| `UAT_SSH_KEY` | Private SSH key (generate with `ssh-keygen -t ed25519`) |
| `UAT_SSH_PORT` | SSH port (default: `22`) |
| `UAT_DATABASE_URL` | Full PostgreSQL URL: `postgresql://user:pass@host:5432/formforge` |
| `UAT_JWT_SECRET` | Random string ≥32 chars: `openssl rand -hex 32` |
| `UAT_REDIS_URL` | Redis URL: `redis://localhost:6379` |

### Variables (non-sensitive)
| Variable | Description |
|----------|-------------|
| `UAT_API_URL` | Public URL of the API e.g. `https://api-uat.example.com` |
| `UAT_APP_URL` | Public URL of the builder UI e.g. `https://uat.example.com` |

## UAT Server Prerequisites

```bash
# Install Docker + Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Create deployment directory
sudo mkdir -p /opt/formforge
sudo chown $USER /opt/formforge
```

## Triggering a Deploy

Deploys run automatically on push to `main` or `uat` branches.

Manual trigger:
1. Go to **Actions → UAT Deploy → Run workflow**
2. Optionally specify a custom image tag

## Rollback

```bash
# SSH into the UAT server
ssh user@uat-server
cd /opt/formforge

# Deploy a specific tag
REGISTRY=ghcr.io/owner/repo IMAGE_TAG=main-abc12345 \
  docker compose -f docker-compose.yml -f docker-compose.uat.yml up -d
```
