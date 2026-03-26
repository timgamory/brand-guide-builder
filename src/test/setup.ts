import '@testing-library/jest-dom'

// Set env vars for tests so supabase client doesn't throw
;(import.meta as unknown as { env: Record<string, string> }).env = {
  ...(import.meta as unknown as { env: Record<string, string> }).env,
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
}
