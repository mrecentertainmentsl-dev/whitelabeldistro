# Production Deployment Guide

## Prerequisites

- VPS / Cloud server (Ubuntu 22.04 LTS recommended, min 4GB RAM)
- Domain name with DNS access
- AWS account with S3 and SES configured
- Docker + Docker Compose installed

---

## 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Install Nginx (for SSL termination)
sudo apt install nginx certbot python3-certbot-nginx -y
```

---

## 2. Clone and Configure

```bash
git clone <your-repo-url> /opt/mrec-platform
cd /opt/mrec-platform

# Backend config
cp apps/backend/.env.example apps/backend/.env
nano apps/backend/.env
# Fill in:
#   JWT_SECRET (use: openssl rand -hex 32)
#   JWT_REFRESH_SECRET (use: openssl rand -hex 32)
#   ENCRYPTION_KEY (use: openssl rand -hex 16)
#   DATABASE_PASSWORD (strong random password)
#   REDIS_PASSWORD (strong random password)
#   AWS_ACCESS_KEY_ID
#   AWS_SECRET_ACCESS_KEY
#   AWS_S3_BUCKET
#   AWS_SES_FROM_EMAIL

# Frontend config
cp apps/frontend/.env.local.example apps/frontend/.env.local
nano apps/frontend/.env.local
# Fill in:
#   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 3. SSL Certificates

```bash
# Issue SSL cert for your domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# For white-label subdomains, use wildcard cert
sudo certbot certonly --manual --preferred-challenges dns \
  -d "*.yourdomain.com" -d "yourdomain.com"
```

---

## 4. Nginx Production Config

```nginx
# /etc/nginx/sites-available/mrec
server {
    listen 80;
    server_name yourdomain.com *.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com *.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    client_max_body_size 600M;

    # Pass domain for white-label resolution
    proxy_set_header X-Domain $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_read_timeout 300s;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/mrec /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. Build and Deploy

```bash
cd /opt/mrec-platform

# Production build
NODE_ENV=production docker-compose -f docker-compose.yml up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 6. AWS S3 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/artwork/*"
    }
  ]
}
```

**S3 CORS Configuration:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://yourdomain.com", "https://*.yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

---

## 7. AWS SES Setup

1. Verify your sender domain in SES console
2. Add DNS records (DKIM, SPF, DMARC)
3. Request production access (move out of sandbox)
4. Set FROM email in `.env`: `AWS_SES_FROM_EMAIL=noreply@yourdomain.com`

---

## 8. White-Label Domain Setup

For each client wanting their own domain:

1. **Client adds CNAME:**
   ```
   music.clientdomain.com  CNAME  yourdomain.com
   ```

2. **Issue SSL for client domain** (using Let's Encrypt):
   ```bash
   sudo certbot --nginx -d music.clientdomain.com
   ```

3. **Add domain in Admin Panel:**
   - Go to Admin → Settings → Domains
   - Add `music.clientdomain.com`
   - Configure custom branding for that domain

4. **System auto-resolves:** Nginx passes `X-Domain` header → TenantMiddleware
   looks up branding → BrandingProvider applies CSS variables

---

## 9. Monitoring

```bash
# Health check endpoint
curl https://yourdomain.com/api/v1/auth/me

# Container status
docker-compose ps

# Resource usage
docker stats

# Database backup
docker-compose exec postgres pg_dump -U mrec mrec_db > backup_$(date +%Y%m%d).sql
```

---

## 10. Scaling Considerations

| Component | Scaling Strategy |
|-----------|-----------------|
| Frontend | Vercel / CDN edge deployment |
| Backend | Horizontal scaling behind load balancer |
| Database | Read replicas, connection pooling (PgBouncer) |
| Redis | Redis Cluster or ElastiCache |
| Storage | S3 already infinitely scalable |
| Queue | BullMQ with multiple workers |

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Generate new JWT secrets
- [ ] Set ENCRYPTION_KEY to random 32-char string
- [ ] Restrict AWS IAM permissions (least privilege)
- [ ] Enable AWS CloudTrail
- [ ] Set up database automated backups
- [ ] Configure fail2ban for SSH
- [ ] Enable UFW firewall (only ports 22, 80, 443)
- [ ] Set up monitoring alerts (uptime, disk, memory)
- [ ] Review CORS origins in `apps/backend/src/main.ts`
