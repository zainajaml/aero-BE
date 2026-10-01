#!/usr/bin/env bash
# Migration helper: rewrites source-app import paths to this repository's layout.
# Usage: scripts/port-imports.sh <file>...   (Supabase/Lovable call sites still need manual porting.)
set -euo pipefail
for f in "$@"; do
  sed -i -E \
    -e 's#"@/components/ui/#"@/shared/ui/#g' \
    -e 's#"@/components/glass/#"@/shared/ui/glass/#g' \
    -e 's#"@/components/icons/#"@/shared/ui/icons/#g' \
    -e 's#"@/components/theme-toggle"#"@/shared/ui/theme-toggle"#g' \
    -e 's#"@/lib/utils"#"@/shared/lib/utils"#g' \
    -e 's#"@/lib/cta"#"@/shared/lib/cta"#g' \
    -e 's#"@/hooks/use-mobile"#"@/shared/hooks/use-mobile"#g' \
    -e 's#"@/components/landing/#"@/features/marketing/components/#g' \
    -e 's#"@/lib/auth/auth-context"#"@/features/auth/auth-context"#g' \
    -e 's#"@/lib/auth/post-login-redirect"#"@/features/auth/lib/post-login-redirect"#g' \
    -e 's#"@/lib/auth/active-project-store"#"@/features/auth/lib/active-project-store"#g' \
    -e 's#"@/lib/auth/active-account-store"#"@/features/auth/lib/active-account-store"#g' \
    -e 's#"@/assets/access-revoked-illustration.png.asset.json"#"@/assets/access-revoked-illustration.jpg"#g' \
    -e 's#"@/assets/(.*)\.(png|jpg)\.asset\.json"#"@/assets/\1.\2"#g' \
    "$f"
done
