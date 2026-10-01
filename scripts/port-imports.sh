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
    -e 's#"@/lib/(date-validation|email-normalize|format|invite-expiry|job-titles|role-labels|ticket-description)"#"@/shared/lib/\1"#g' \
    -e 's#"@/components/(confirm-delete|timezone-switcher)"#"@/shared/ui/\1"#g' \
    -e 's#"@/components/media/user-avatar"#"@/features/users/components/user-avatar"#g' \
    -e 's#"@/components/media/media-image"#"@/shared/ui/media-image"#g' \
    -e 's#"@/lib/timezone"#"@/features/users/lib/timezone"#g' \
    -e 's#"@/lib/project-context"#"@/features/projects/project-context"#g' \
    -e 's#"@/lib/auth/use-can-write"#"@/features/auth/hooks/use-can-write"#g' \
    -e 's#"@/components/tickets/(comment-editor|mention-textarea)"#"@/features/rich-text/components/\1"#g' \
    -e 's#"@/components/documents/(rich-text-editor|link-bubble|document-tags|doc-tag-textarea)"#"@/features/rich-text/components/\1"#g' \
    -e 's#"@/components/documents/document-viewer-bus"#"@/features/rich-text/lib/document-viewer-bus"#g' \
    -e 's#"@/lib/(document-images|tiptap-upload-image|tiptap-loading-image|tiptap-link|user-mentions)"#"@/features/rich-text/lib/\1"#g' \
    -e 's#"@/components/projects/use-archive-project"#"@/features/projects/hooks/use-archive-project"#g' \
    -e 's#"@/components/projects/(archived-project-banner|no-project-empty-state)"#"@/features/projects/components/\1"#g' \
    "$f"
done
# Ticket domain (tickets / backlog / board slice).
for f in "$@"; do
  sed -i -E \
    -e 's#"@/components/tickets/(ticket-card|ticket-code|complexity-bars)"#"@/features/tickets/components/\1"#g' \
    -e 's#"@/components/tickets/epic-tag-input"#"@/features/tickets/components/epics/epic-tag-input"#g' \
    -e 's#"@/components/epics/manage-epics-dialog"#"@/features/tickets/components/epics/manage-epics-dialog"#g' \
    -e 's#"@/components/tickets/ticket-dialog"#"@/features/tickets/components/ticket-dialog/ticket-dialog"#g' \
    -e 's#"@/components/tickets/create-ticket-dialog"#"@/features/tickets/components/create-ticket/create-ticket-dialog"#g' \
    -e 's#"@/components/tickets/bulk-edit-tickets-dialog"#"@/features/tickets/components/bulk-edit/bulk-edit-tickets-dialog"#g' \
    -e 's#"@/lib/rate-card-roles"#"@/features/tickets/hooks/use-rate-card-roles"#g' \
    "$f"
done
