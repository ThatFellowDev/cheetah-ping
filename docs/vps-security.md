# VPS Security Setup

How we lock down our Hetzner VPS so it's invisible to the public internet.

## The Philosophy

Credit to **[@levelsio](https://twitter.com/levelsio)** for this pattern:

> When I set up a new Hetzner VPS, first thing I do is install Tailscale. Once I'm in via Tailscale, I lock down the firewall to only accept web traffic on HTTPS 443 for Cloudflare IPs and SSH 22 for Tailscale IPs. That way nobody can get in.
>
> A VPS is just like your laptop or desktop computer, but now imagine if it's connected to the entire internet with 8 billion people that can access it and try to hack it. You only want it to be accessible to you. And if you want to host a website on your VPS, you should only let Cloudflare access your VPS, so it can stand in front and block any hack attempts. Never expose VPS to the world wide web — which realistically is the world wild web.

## The Pattern

```
Public Internet ─X─ VPS (no exposed ports)
                          │
                  ┌───────┴───────┐
                  │               │
            Tailscale         Cloudflare Tunnel
            (you SSH in)      (Workers reach apps)
```

Three layers:
1. **Tailscale** — private mesh network for admin access (SSH, debugging)
2. **Cloudflare Tunnel** — outbound-only connection from VPS to Cloudflare for serving traffic
3. **UFW firewall** — default-deny everything, allow only Tailscale interface

Result: nothing on the VPS is reachable directly from the public internet. Even if someone discovers your IP, every port is closed to them.

## Setup Sequence (do in this order)

### 1. Provision the VPS
- Hetzner CX23 in Helsinki, Ubuntu 24.04
- Add SSH key during creation
- SSH in once via public IP: `ssh root@<ip>`

### 2. Install Tailscale FIRST (before exposing anything)
```bash
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up
```
Click the auth URL, sign in. Note the Tailscale IP: `tailscale ip -4`

### 3. Install Tailscale on your laptop
[tailscale.com/download](https://tailscale.com/download) — sign in with the same account.

Now you can SSH the VPS via its Tailscale IP (the `100.x.x.x` one).

### 4. Lock down UFW
```bash
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow in on tailscale0 to any port 22
ufw --force enable
```

**Critical:** Only allow port 22 on the `tailscale0` interface — not on `eth0`. Public SSH is now blocked.

### 5. Verify lockdown works
- From a different network (or with Tailscale disconnected), try `ssh root@<public-ip>` → should TIMEOUT
- With Tailscale connected, try `ssh root@<tailscale-ip>` → should connect

### 6. Bind services to localhost only
When running Docker containers, always use `127.0.0.1:PORT:PORT`:
```bash
docker run -p 127.0.0.1:3000:3000 ...   # GOOD — loopback only
docker run -p 3000:3000 ...              # BAD — exposes to all interfaces
```

Even if UFW rules are wrong, the bind prevents public exposure.

### 7. Use Cloudflare Tunnel for public-facing services
Don't expose ports. Use Cloudflare Tunnel to create an outbound connection:
```bash
cloudflared tunnel create <name>
cloudflared tunnel route dns <name> <subdomain>.cheetahping.com
cloudflared service install
```

Workers and Vercel reach `<subdomain>.cheetahping.com`, which routes through Cloudflare → tunnel → localhost on the VPS. No inbound port needed.

## Running Multiple Services

This same VPS can host other side projects. Each goes in its own Docker container, bound to localhost, reached via its own Cloudflare Tunnel hostname:

```bash
# Browserless (this project)
docker run -p 127.0.0.1:3000:3000 --name browserless ghcr.io/browserless/chrome

# A side project API
docker run -p 127.0.0.1:8080:8080 --name my-api my-api:latest

# A Discord bot — no port needed at all
docker run --name my-bot my-bot:latest
```

Add ingress rules to `/etc/cloudflared/config.yml`:
```yaml
ingress:
  - hostname: browser.cheetahping.com
    service: http://localhost:3000
  - hostname: api.myproject.com
    service: http://localhost:8080
  - service: http_status:404
```

## What NOT to do

- ❌ **Never** open SSH (port 22) to the public internet — even with key auth, you'll get bombarded with brute-force attempts and noise in your logs
- ❌ **Never** open application ports (3000, 8080) to the public internet — use Cloudflare Tunnel
- ❌ **Never** disable UFW after setup — keep it on permanently
- ❌ **Never** add the public IP to a DNS A record — use orange-cloud Cloudflare proxying or tunnels only
- ❌ **Never** trust Docker's default port binding (`-p 3000:3000`) — always specify `127.0.0.1` explicitly
- ❌ **Never** install Tailscale AFTER you've already exposed services — chicken-and-egg, you've already been scanned by then

## Recovery if you lock yourself out

If you make a UFW mistake and lose access:
1. Hetzner Console (web UI) → your server → "Console" tab → opens a browser-based VNC session
2. Log in with root password (set in server creation, or reset via Hetzner UI)
3. Fix UFW rules from there
4. Reconnect via SSH

The Hetzner web console is your emergency backdoor — it doesn't go through the network.
