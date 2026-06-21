export function sanitizeUser<T extends { passwordHash?: string | null }>(user: T): Omit<T, 'passwordHash'> {
  const { passwordHash: _, ...safe } = user;
  return safe;
}
