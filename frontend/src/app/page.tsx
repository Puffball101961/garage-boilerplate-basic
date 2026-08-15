import { redirect } from 'next/navigation'
import { POST_AUTH_REDIRECT } from '@/lib/routes'

/**
 * The index has no content of its own — it forwards to the team page, which is
 * the app's landing view. Unauthenticated visitors are then sent on to
 * /auth/signin by the proxy, so this stays a single unconditional redirect.
 */
export default function IndexPage() {
  redirect(POST_AUTH_REDIRECT)
}
