# Deploying Let

One Linux machine (EC2 or Lightsail) runs three containers with Docker Compose: `web`, `realtime`
and `caddy` (HTTPS). The SQLite file lives in the `app-data` volume.

```
push to main → ci.yml (lint, typecheck, format, test, build)
             → build image, push to ghcr.io
             → ssh to the server: docker compose pull && up -d
             → curl /api/health
```

## One-time server setup

1. Launch an Ubuntu EC2 instance. The security group opens ports 22, 80 and 443 only.
2. Attach an Elastic IP and point your domain's `A` record at it.
3. Install Docker: `curl -fsSL https://get.docker.com | sh`, then `sudo usermod -aG docker $USER`.
4. Create an SSH key pair for deploys and add the public key to `~/.ssh/authorized_keys`.

## One-time GitHub setup

Settings → Environments → New environment `production` (add yourself as a required reviewer).

| Where                | Name         | Value                                    |
| -------------------- | ------------ | ---------------------------------------- |
| Environment variable | `DOMAIN`     | `let.example.com`                        |
| Environment variable | `SENTRY_DSN` | The DSN of the Sentry project (optional) |
| Environment secret   | `SSH_HOST`   | The server's public IP or hostname       |
| Environment secret   | `SSH_USER`   | `ubuntu`                                 |
| Environment secret   | `SSH_KEY`    | The private deploy key, whole file       |

Settings → Branches → protect `main` and require the `checks` status check.

The image is private by default on ghcr.io. The deploy job logs in with the workflow token, so no
extra setup is needed.

## First deploy

Merge to `main`, approve the `production` deployment, and watch the Actions tab.
Load cities and courts once on the server:

```bash
cd ~/let
docker compose exec web npm run import:cities
docker compose exec web npm run import:courts
```

## Useful commands on the server

```bash
docker compose ps
docker compose logs -f web
docker compose logs -f realtime
```

## Not done yet

Backups of the SQLite volume (Litestream to S3), a registry other than ghcr.io, and OIDC for AWS.
