/**
 * Where a signed-in user lands: after sign-in, after Google sign-up, when they
 * open an auth page while already authenticated, and when they hit the index.
 *
 * Kept in one place so changing the app's landing page is a one-line edit
 * rather than a hunt through the auth pages and the proxy.
 */
export const POST_AUTH_REDIRECT = '/team'
