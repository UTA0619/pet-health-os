terraform {
  required_version = ">= 1.7.0"
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 2.0"
    }
  }

  backend "remote" {
    organization = "pet-health-os"
    workspaces {
      name = "pet-health-os-prod"
    }
  }
}

provider "vercel" {
  # Set VERCEL_API_TOKEN env var
  api_token = var.vercel_api_token
  team      = var.vercel_team_id
}

# ─── Variables ────────────────────────────────────────────────────────────────

variable "vercel_api_token" {
  description = "Vercel API token"
  type        = string
  sensitive   = true
}

variable "vercel_team_id" {
  description = "Vercel team ID (slug or ID)"
  type        = string
  default     = ""
}

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
}

variable "supabase_anon_key" {
  description = "Supabase anon (public) key"
  type        = string
  sensitive   = true
}

variable "supabase_service_role_key" {
  description = "Supabase service role key"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook signing secret"
  type        = string
  sensitive   = true
}

variable "cron_secret" {
  description = "Secret token for cron job authentication"
  type        = string
  sensitive   = true
}

# ─── Vercel Project ───────────────────────────────────────────────────────────

resource "vercel_project" "web" {
  name      = "pet-health-os-web"
  framework = "nextjs"

  git_repository = {
    type              = "github"
    repo              = "your-org/pet-health-os"
    production_branch = "main"
  }

  build_command    = "cd ../.. && npm run build --workspace=apps/web"
  output_directory = "apps/web/.next"
  install_command  = "npm install"
  root_directory   = "apps/web"

  serverless_function_region = "nrt1" # Tokyo

  environment = [
    {
      key    = "NEXT_PUBLIC_SUPABASE_URL"
      value  = var.supabase_url
      target = ["production", "preview", "development"]
    },
    {
      key    = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
      value  = var.supabase_anon_key
      target = ["production", "preview", "development"]
    },
    {
      key    = "SUPABASE_SERVICE_ROLE_KEY"
      value  = var.supabase_service_role_key
      target = ["production"]
    },
    {
      key    = "OPENAI_API_KEY"
      value  = var.openai_api_key
      target = ["production"]
    },
    {
      key    = "STRIPE_SECRET_KEY"
      value  = var.stripe_secret_key
      target = ["production"]
    },
    {
      key    = "STRIPE_WEBHOOK_SECRET"
      value  = var.stripe_webhook_secret
      target = ["production"]
    },
    {
      key    = "CRON_SECRET"
      value  = var.cron_secret
      target = ["production"]
    },
  ]
}

# ─── Domains ──────────────────────────────────────────────────────────────────

resource "vercel_project_domain" "production" {
  project_id = vercel_project.web.id
  domain     = "pethealthos.app"
}

resource "vercel_project_domain" "www" {
  project_id = vercel_project.web.id
  domain     = "www.pethealthos.app"
  redirect   = "pethealthos.app"
}

# ─── Outputs ──────────────────────────────────────────────────────────────────

output "project_id" {
  description = "Vercel project ID"
  value       = vercel_project.web.id
}

output "production_url" {
  description = "Production deployment URL"
  value       = "https://pethealthos.app"
}
