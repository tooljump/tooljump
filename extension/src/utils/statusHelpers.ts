// Helper functions for status-based styling
export const getStatusColor = (status?: string, isLink: boolean = false) => {
  switch (status) {
    case 'important':
      return '#c92727'; // Updated red
    case 'relevant':
      return '#f59e0b'; // Softer orange
    case 'success':
      return '#10b981'; // Softer green
    default:
      return isLink ? '#6b7280' : '#6b7280'; // Subtle gray for links, gray for text
  }
};

export const getHoverBackground = (status?: string) => {
  switch (status) {
    case 'important':
      return 'rgba(201, 39, 39, 0.08)';
    case 'relevant':
      return 'rgba(245, 158, 11, 0.08)';
    case 'success':
      return 'rgba(16, 185, 129, 0.08)';
    default:
      return 'rgba(99, 102, 241, 0.08)';
  }
};

// Reusable function to get hover styles
export const getHoverStyles = (status?: string, isHovered: boolean = false) => ({
  background: isHovered ? getHoverBackground(status) : 'transparent',
  borderColor: isHovered ? getStatusColor(status) : 'transparent',
  transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
  boxShadow: isHovered ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
});
