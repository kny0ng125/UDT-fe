const ROLE_RESTRICTIONS = {
  ROLE_GUEST: {
    allowed: ['/survey'],
    denied: [],
  },
  ROLE_USER: {
    allowed: [],
    denied: ['/survey'],
  },
} as const;

export const ALLOWED_ROLES = ['ROLE_USER', 'ROLE_GUEST'] as const;
export type AllowedRole = (typeof ALLOWED_ROLES)[number];

export function addMessageToUrl(url: URL, type: string, message: string): URL {
  const encodedMessage = Buffer.from(message, 'utf-8').toString('base64');
  url.searchParams.set('auth_msg', type);
  url.searchParams.set('auth_text', encodedMessage);
  return url;
}

export function isValidRole(role: string): role is AllowedRole {
  return ALLOWED_ROLES.includes(role as AllowedRole);
}

export function hasPermission(role: string, pathname: string): boolean {
  if (!isValidRole(role)) return false;

  const restrictions = ROLE_RESTRICTIONS[role];

  if (role === 'ROLE_GUEST') {
    return restrictions.allowed.some((path) => pathname.startsWith(path));
  }

  if (role === 'ROLE_USER') {
    const isDenied = restrictions.denied.some((path) =>
      pathname.startsWith(path),
    );
    return !isDenied;
  }

  return false;
}

export function getDefaultPath(role: string): string {
  switch (role) {
    case 'ROLE_GUEST':
      return '/survey';
    case 'ROLE_USER':
      return '/recommend';
    default:
      return '/';
  }
}
