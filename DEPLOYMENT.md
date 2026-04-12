# Free Deployment Guide

## Architecture on Free Tier

```
Vercel (React Frontend)
        │
        ▼
Railway (API Gateway) ──► Railway (Auth Service) ──► Supabase (PostgreSQL)
        │
        ├──► Railway (Diagnosis Service) ──► Upstash Redis
        │                                ──► Upstash Kafka
        │                                ──► Railway (AI Service)
        │
        ├──► Railway (Patient Records) ──► MongoDB Atlas
        │                              ──► Upstash Kafka
        │
        └──► Railway (Notification Service) ──► Upstash Kafka
```

---

## Step 1 — Push code to GitHub

```bash
cd e:\Projects\Medical-diagnosis-using-ai
git init
git add .
git commit -m "initial commit"
# Create a new repo on github.com, then:
git remote add origin https://github.com/<your-username>/healthcare-ai.git
git push -u origin main
```

---

## Step 2 — Set up Supabase (PostgreSQL) — FREE

1. Go to https://supabase.com → Sign up → New Project
2. Choose a region close to you, set a strong DB password
3. Go to **Project Settings → Database → Connection string**
4. Select **URI** mode, copy the string — looks like:
   ```
   postgresql://postgres:<password>@db.xxxx.supabase.co:5432/postgres
   ```
5. Convert to JDBC format for Spring Boot:
   ```
   jdbc:postgresql://db.xxxx.supabase.co:5432/postgres?sslmode=require
   ```
6. Save these values — you'll need them for auth-service env vars

---

## Step 3 — Set up MongoDB Atlas — FREE (512 MB)

1. Go to https://cloud.mongodb.com → Sign up → Create Free Cluster (M0)
2. Choose any cloud provider + region
3. Create a database user: **Database Access → Add New User**
   - Username: `healthcare`
   - Password: generate a strong one, save it
4. Allow all IPs: **Network Access → Add IP Address → Allow Access from Anywhere** (0.0.0.0/0)
5. Get connection string: **Connect → Drivers → Node.js**
   - Copy the string, replace `<password>` with your DB user password
   - Change database name to `patient_records`:
   ```
   mongodb+srv://healthcare:<password>@cluster0.xxxxx.mongodb.net/patient_records?retryWrites=true&w=majority
   ```

---

## Step 4 — Set up Upstash Redis — FREE (10K req/day)

1. Go to https://upstash.com → Sign up → Create Database
2. Choose **Redis** → name it `healthcare-cache` → pick a region
3. Go to the database → **Connect** tab → copy:
   - **Endpoint** (host): `your-db.upstash.io`
   - **Port**: `6379`
   - **Password**: shown in the connect tab
4. Make sure **TLS/SSL** is enabled (it is by default on Upstash)

---

## Step 5 — Set up Upstash Kafka — FREE (10K msg/day)

1. Go to https://upstash.com → **Kafka** → Create Cluster
2. Name it `healthcare-kafka` → pick a region
3. Create a topic named `diagnosis-results` (1 partition, 1 replica)
4. Go to cluster → **Connect** tab → copy:
   - **Bootstrap Server**: `your-cluster.upstash.io:9092`
   - **SASL Username**
   - **SASL Password**
5. Security protocol: `SASL_SSL`, mechanism: `SCRAM-SHA-256`

> ⚠️ Update `KAFKA_SASL_MECHANISM=SCRAM-SHA-256` and `KAFKA_SECURITY_PROTOCOL=SASL_SSL`
> in the env vars for diagnosis-service, patient-records-service, and notification-service

---

## Step 6 — Deploy all services to Railway — FREE (500 hrs/month)

1. Go to https://railway.app → Sign up with GitHub
2. **New Project → Deploy from GitHub repo**
3. You will create **6 separate services** from the same repo, each pointing to a different folder

### For each service, do this:

**a) Create the service**
- New Project → GitHub Repo → select your repo
- Railway will auto-detect the Dockerfile

**b) Set the Root Directory**
- Go to service → **Settings → Source → Root Directory**
- Set it to the service folder (e.g. `healthcare-system/auth-service`)

**c) Add environment variables**
- Go to service → **Variables** tab
- Copy all variables from the `.env.example` file in that service folder
- Fill in the real values from the steps above

### Service deployment order (deploy in this order):

| # | Service | Root Directory | Key Env Vars |
|---|---------|---------------|--------------|
| 1 | ai-service | `healthcare-system/ai-service` | `MODELS_DIR=./models` |
| 2 | auth-service | `healthcare-system/auth-service` | Supabase DB URL + JWT_SECRET |
| 3 | diagnosis-service | `healthcare-system/diagnosis-service` | Upstash Redis + Kafka + AI_SERVICE_URL |
| 4 | patient-records-service | `healthcare-system/patient-records-service` | MongoDB Atlas URI + Upstash Kafka |
| 5 | notification-service | `healthcare-system/notification-service` | Upstash Kafka |
| 6 | api-gateway | `healthcare-system/api-gateway` | All 4 service URLs + JWT_SECRET |

**d) Get the public URL**
- After deploy, go to service → **Settings → Networking → Generate Domain**
- Copy the URL (e.g. `https://auth-service-xxxx.up.railway.app`)
- Use this URL when setting env vars for api-gateway and diagnosis-service

### Generate JWT_SECRET (run this once, use same value everywhere):
```bash
# On Windows PowerShell:
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# On Mac/Linux:
openssl rand -hex 32
```

---

## Step 7 — Deploy Frontend to Vercel — FREE

1. Go to https://vercel.com → Sign up with GitHub
2. **New Project → Import** your GitHub repo
3. Set **Root Directory** to `healthcare-system/frontend`
4. Framework preset: **Create React App**
5. Add environment variables:
   ```
   REACT_APP_API_URL = https://api-gateway-xxxx.up.railway.app
   REACT_APP_WS_URL  = https://notification-service-xxxx.up.railway.app
   ```
6. Click **Deploy** — Vercel builds and gives you a free `.vercel.app` URL

---

## Step 8 — Verify everything works

```bash
# 1. Register a user
curl -X POST https://api-gateway-xxxx.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass1234","fullName":"Test User"}'

# 2. Login
curl -X POST https://api-gateway-xxxx.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass1234"}'
# → copy the token from response

# 3. Run a prediction
curl -X POST https://api-gateway-xxxx.up.railway.app/api/diagnosis/predict \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "diseaseType": "diabetes",
    "features": {
      "Pregnancies":2,"Glucose":120,"BloodPressure":70,
      "SkinThickness":20,"Insulin":80,"BMI":25.5,
      "DiabetesPedigreeFunction":0.5,"Age":35
    }
  }'

# 4. Check patient history
curl https://api-gateway-xxxx.up.railway.app/api/patients/me/history \
  -H "Authorization: Bearer <token>"
```

---

## Free Tier Limits Summary

| Platform | Service | Free Limit |
|----------|---------|-----------|
| Railway | All Spring Boot + Python services | 500 hrs/month (~20 days) |
| Supabase | PostgreSQL | 500 MB storage, 2 GB bandwidth |
| MongoDB Atlas | Patient records | 512 MB storage |
| Upstash | Redis | 10,000 requests/day |
| Upstash | Kafka | 10,000 messages/day |
| Vercel | React frontend | Unlimited for hobby projects |

> 💡 **Tip**: Railway's free tier resets monthly. To stay within limits, services
> sleep after 10 minutes of inactivity and wake up on the next request (~5s cold start).

---

## Troubleshooting

**Service won't start on Railway**
- Check logs: Railway dashboard → service → **Deployments → View Logs**
- Most common cause: missing env var — compare with `.env.example`

**Kafka connection refused**
- Make sure `KAFKA_SECURITY_PROTOCOL=SASL_SSL` and `KAFKA_SASL_MECHANISM=SCRAM-SHA-256`
- Upstash uses SCRAM-SHA-256, not PLAIN

**Redis SSL error**
- Make sure `SPRING_REDIS_SSL=true` is set for diagnosis-service

**CORS error in browser**
- The API Gateway already has `allowedOrigins: "*"` — if still failing,
  add your Vercel URL explicitly in `api-gateway/application.yml`

**Frontend shows blank page**
- Check browser console for the actual error
- Most likely `REACT_APP_API_URL` is not set in Vercel env vars
