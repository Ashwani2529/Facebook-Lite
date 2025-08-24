/**
 * Generate an SVG data URL for avatar placeholder
 * @param {string} name - User's name to get initials from
 * @param {number} size - Size of the SVG (width and height)
 * @param {string} bgColor - Background color (hex without #)
 * @param {string} textColor - Text color (hex without #)
 * @returns {string} - Data URL for the SVG
 */
export const generateAvatarPlaceholder = (name = 'U', size = 100, bgColor = '6366f1', textColor = 'ffffff') => {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const fontSize = Math.floor(size * 0.4);
  const textY = size / 2 + fontSize / 3;

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#${bgColor}"/>
      <text x="${size / 2}" y="${textY}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#${textColor}" text-anchor="middle" dominant-baseline="middle">
        ${initials}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

/**
 * Generate a default user icon SVG
 * @param {number} size - Size of the SVG
 * @param {string} bgColor - Background color (hex without #)
 * @param {string} iconColor - Icon color (hex without #)
 * @returns {string} - Data URL for the SVG
 */
export const generateUserIconPlaceholder = (size = 100, bgColor = '6366f1', iconColor = 'ffffff') => {
  const iconSize = Math.floor(size * 0.5);
  const centerX = size / 2;
  const centerY = size / 2;

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#${bgColor}" rx="${size * 0.1}"/>
      <g transform="translate(${centerX - iconSize / 2}, ${centerY - iconSize / 2})">
        <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 20 20" fill="#${iconColor}">
          <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
        </svg>
      </g>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}; 