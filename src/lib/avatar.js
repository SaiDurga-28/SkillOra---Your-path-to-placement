export function getInitials(name = "", email = "") {
  const source = name.trim() || email.trim();

  if (!source) {
    return "U";
  }

  const nameParts = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (nameParts.length > 1) {
    return nameParts.map((part) => part[0]).join("").toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function getAvatarSrc(user) {
  const photoUrl =
    user?.avatarUrl ||
    user?.photoUrl ||
    user?.photoURL ||
    user?.profileImage ||
    user?.profilePicture ||
    user?.imageUrl;

  if (photoUrl) {
    return photoUrl;
  }

  return getGeneratedAvatarSrc(user);
}

export function getGeneratedAvatarSrc(user) {
  const initials = getInitials(user?.name, user?.email);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="bg" x1="18" y1="18" x2="142" y2="142" gradientUnits="userSpaceOnUse">
          <stop stop-color="#7c3aed"/>
          <stop offset="0.55" stop-color="#2563eb"/>
          <stop offset="1" stop-color="#0891b2"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="80" fill="url(#bg)"/>
      <circle cx="80" cy="80" r="56" fill="#f8fafc" opacity="0.18"/>
      <text x="80" y="88" text-anchor="middle" dominant-baseline="middle" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif" font-size="62">👤</text>
      <circle cx="114" cy="116" r="24" fill="#f8fafc"/>
      <text x="114" y="124" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800" fill="#1e1b4b">${initials.slice(0, 2)}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
