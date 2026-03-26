const STORAGE_KEY = 'bgb-user-slug'

export function getUserSlug(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function setUserSlug(slug: string): void {
  localStorage.setItem(STORAGE_KEY, slug)
}
