# VPS Security Setup

How we lock down our Hetzner VPS so it's invisible to the public internet, and how we add new services to it without breaking that.

## The Convention: "Private Box" Model

Every service we run on this VPS follows one strict pattern:

> **The VPS is a private box.** Tailscale is the admin back door. Cloudflare Tunnel is the only traffic front door. Each service runs in its own Docker container bound to `127.0.0.1`, addressed by its own subdomain.

This is a hard convention. **Do not deviate from it for any reason.** If you catch yourself opening a public port "just for a minute", stop — there is always a tunnel-based alternative.

Credit to **[@levelsio](https://twitter.com/levelsio)** for the core pattern:

> When I set up a new Hetzner VPS, first thing I do is install Tailscale. Once I'm in via Tailscale, I lock down the firewall to only accept web traffic on HTTPS 443 for Cloudflare IPs and SSH 22 for Tailscale IPs. That way nobody can get in.
>
> A VPS is just like your laptop or desktop computer, but now imagine if it's connected to the entire internet with 8 billion people that can access it and try to hack it. You only want it to be accessible to you. And if you want to host a website on your VPS, you should only let Cloudflare access your VPS, so it can stand in front and block any hack attempts. Never expose VPS to the world wide web — which realistically is the world wild web.

## The Pattern

```
                    Public Internet
                          │
                          X  (everything blocked)
                          │
            ┌─────────────┴─────────────┐
            │         THE VPS            │
            │                            │
            │  Docker containers,        │
            │  all bound to 127.0.0.1:   │
            │                            │
            │    ┌─ browserless :3000    │
            │    ├─ n8n         :5678    │
            │    ├─ plausible   :8000    │
            │    └─ side-api    :8080    │
            │                            │
            └────┬────────────────┬──────┘
                 │                │
       ┌─────────┘                └──────────┐
       │                                     │
   Tailscale                          Cloudflare Tunnel
   (admin back door)                  (traffic front door)
       │                                     │
       ▼                                     ▼
   ssh 100.84.198.108                 browser.cheetahping.com
   (you SSH in)                       n8n.cheetahping.com
                                      plausible.cheetahping.com
                                      (each service = own subdomain)
```

## Security Layers

Four layers of defense, any one of which would block the public internet on its own. Stacked, they're redundant and paranoid.

1. **Hetzner Cloud Firewall** — at Hetzner's network edge, *before* traffic reaches the VPS. Default deny everything inbound. Blocks port scans before they see the box.
2. **UFW (Linux firewall on the VPS)** — default deny, allow only on `tailscale0` interface. Second line of defense if Hetzner firewall is misconfigured.
3. **Docker localhost bind** — every container uses `-p 127.0.0.1:PORT:PORT` so services aren't bound to public interfaces at all.
4. **Cloudflare Tunnel** — outbound-only connection. The VPS initiates, Cloudflare never pokes inbound. Workers and users reach services via public subdomains that route through this tunnel.

Result: nothing on the VPS is reachable directly from the public internet. Even if someone discovers your IP, every port is closed to them.

## Admin and traffic paths

| Need | Path | Why |
|---|---|---|
| SSH into the VPS | `ssh root@<tailscale-ip>` (the `100.x.x.x` one) | Tailscale is the only admin path |
| Access a service from Workers/Vercel | `https://<service>.cheetahping.com` | Cloudflare Tunnel routes to localhost |
| Access a service from your browser | `https://<service>.cheetahping.com` (optionally behind Cloudflare Access) | Same tunnel |
| Emergency access (locked out) | Hetzner web console (VNC in browser) | Out-of-band, doesn't depend on network |

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

### 4. Lock down UFW (OS-level firewall)
```bash
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow in on tailscale0 to any port 22
ufw --force enable
```

**Critical:** Only allow port 22 on the `tailscale0` interface — not on `eth0`. Public SSH is now blocked.

### 5. Add Hetzner Cloud Firewall (network-edge firewall)
In the Hetzner dashboard:
1. Cloud Firewalls → Create Firewall
2. Name: `<project>-public-block`
3. **Inbound rules: leave EMPTY** — empty = deny all inbound at the edge
4. **Outbound rules: leave EMPTY** — empty = allow all outbound (the comment literally says this)
5. Apply to the server

This is a second layer in front of UFW. Tailscale still works because it's outbound-only (UDP 41641 outbound to DERP relays). Cloudflare Tunnel still works because it's outbound-only HTTPS.

### 6. Verify lockdown works
- From a different network (or with Tailscale disconnected), try `ssh root@<public-ip>` → should TIMEOUT
- With Tailscale connected, try `ssh root@<tailscale-ip>` → should connect

### 7. Bind services to localhost only
When running Docker containers, always use `127.0.0.1:PORT:PORT`:
```bash
docker run -p 127.0.0.1:3000:3000 ...   # GOOD — loopback only
docker run -p 3000:3000 ...              # BAD — exposes to all interfaces
```

Even if UFW rules are wrong, the bind prevents public exposure.

### 8. Use Cloudflare Tunnel for public-facing services
Don't expose ports. Use Cloudflare Tunnel to create an outbound connection:
```bash
cloudflared tunnel create <name>
cloudflared tunnel route dns <name> <subdomain>.cheetahping.com
cloudflared service install
```

Workers and Vercel reach `<subdomain>.cheetahping.com`, which routes through Cloudflare → tunnel → localhost on the VPS. No inbound port needed.

## Adding a New Service (follow this every time)

Say you want to run N8N on the same VPS. Here's the exact process — follow it as a checklist every time you add a new service:

### Step 1: Run it in Docker, bound to localhost
```bash
# Pick a unique localhost port (check existing containers first: docker ps)
docker run -d \
  --name n8n \
  --restart always \
  -p 127.0.0.1:5678:5678 \
  -v n8n-data:/home/node/.n8n \
  n8nio/n8n
```

**Always:**
- `-p 127.0.0.1:PORT:PORT` (loopback bind, not public)
- `--restart always` (survives reboots)
- `--name` (so you can reference it)
- Named volume for persistent data

### Step 2: Add a Cloudflare Tunnel ingress rule
Edit `/etc/cloudflared/config.yml` and add your service ABOVE the catch-all:
```yaml
tunnel: <existing-tunnel-uuid>
credentials-file: /root/.cloudflared/<uuid>.json

ingress:
  - hostname: browser.cheetahping.com
    service: http://localhost:3000
  - hostname: n8n.cheetahping.com        # ← new
    service: http://localhost:5678        # ← new
  - service: http_status:404
```

### Step 3: Route the DNS
```bash
cloudflared tunnel route dns <tunnel-name> n8n.cheetahping.com
```
This adds an orange-cloud CNAME in Cloudflare DNS pointing to the tunnel.

### Step 4: Reload cloudflared
```bash
systemctl restart cloudflared
systemctl status cloudflared
```

### Step 5: (Optional but recommended) Put it behind Cloudflare Access
For admin UIs like N8N, Grafana, etc. that only you should see:
1. Cloudflare dashboard → Zero Trust → Access → Applications
2. Add application → Self-hosted → `n8n.cheetahping.com`
3. Policy: allow only emails in your personal list (or your Google Workspace)

Now `n8n.cheetahping.com` requires login via Cloudflare Access before the tunnel even forwards the request. Your app doesn't need to worry about auth at all.

### Step 6: Test from your browser
Open `https://n8n.cheetahping.com` — should work. Check that `curl http://<vps-public-ip>:5678` from outside still **fails** (bound to localhost, firewalled, tunnel is outbound-only).

## What this VPS can run

A single Hetzner CX23 (4 GB RAM, 2 vCPU) can comfortably run multiple services using this pattern. Rough sizing:

| Service | RAM at idle | RAM at peak | Notes |
|---|---|---|---|
| Browserless (Chromium) | 200 MB | 1.5-2 GB | Primary workload for Cheetah Ping |
| N8N | 200 MB | 400 MB | Workflow automation, great for drip emails/webhooks |
| Plausible Analytics | 300 MB | 500 MB | Lightweight privacy-first analytics |
| Umami Analytics | 100 MB | 200 MB | Even lighter alternative to Plausible |
| Meilisearch | 100 MB | 300 MB | Full-text search |
| A Discord/Telegram bot | 50 MB | 100 MB | No port exposure needed at all |
| Small side API (Node/Go) | 100 MB | 300 MB | Personal project |

**With Browserless + N8N + Umami you're using ~2 GB, leaving ~2 GB headroom.** Plenty for MVP.

**Don't run on CX23:**
- PostHog self-hosted (needs 4+ GB just for itself)
- Large Postgres/MySQL databases (use Neon instead)
- Anything with aggressive memory needs (ML models, etc.)

If you outgrow CX23, upgrade to CX33 (8 GB) with one click — Hetzner resizes without rebuilding.

## Pricing model (Hetzner)

Billing is **hourly, capped at monthly**:
- CX23 costs €3.49/mo OR €0.0056/hour, whichever is LESS
- Run for 5 days? ~€0.67 charged
- Run for 30 days? €3.49 charged (monthly cap kicks in around day 26)
- Run for 365 days? €3.49 × 12 = ~€42/year

You do NOT pay extra for CPU/RAM/disk usage within your plan limits. You DO pay extra for:
- Traffic over 20 TB (EU) / 1 TB (US) — €1.00/TB
- Backups (+20%)
- Extra IPv4 addresses
- Object Storage, Load Balancers (separate products)

**For SaaS backend workloads that run 24/7, this flat rate is the main reason VPS beats serverless.** Railway, Vercel, AWS Lambda all charge per invocation or GB-hour. Hetzner charges only for "server exists" hours, capped at monthly.

## IPv4 vs IPv6

Every Hetzner VPS comes with one IPv6 address included (free) and optionally one IPv4 address (~€0.60/mo).

- **IPv6** is the "new" internet protocol. It has way more addresses but not every client supports it. If you only have IPv6, some home networks, older routers, and some corporate firewalls can't reach you.
- **IPv4** is the legacy protocol that every device on earth supports. Costs a tiny bit extra because IPv4 addresses are scarce/exhausted.

**For us:** Keep IPv4 enabled. Cloudflare's edge network uses IPv4 to reach your tunnel endpoint, and you want maximum compatibility for SSH fallback. The ~$0.65/mo IPv4 fee is the cost we've seen in your monthly estimate.

You don't need to manage any of this — Hetzner enables both by default when you create a server.

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
