/**
 * User Validation Utility
 * Validation logic for user management
 */

export function isValidEmail(email: any) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isEmailUnique(email: any, users: any[], excludeUserId: any = null) {
  if (!email) return false;
  const normalizedEmail = email.trim().toLowerCase();
  return !users.some(user => {
    if (excludeUserId && user.id === excludeUserId) return false;
    return user.email.toLowerCase() === normalizedEmail;
  });
}

export function validateUserCreate(userData: any, existingUsers: any[] = []) {
  const errors: Record<string, string> = {};

  if (!userData.name || userData.name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (userData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!userData.email || userData.email.trim().length === 0) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(userData.email)) {
    errors.email = 'Invalid email format';
  } else if (!isEmailUnique(userData.email, existingUsers)) {
    errors.email = 'Email already exists';
  }

  if (!userData.role || userData.role.trim().length === 0) {
    errors.role = 'Role is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateUserUpdate(userData: any, existingUsers: any[] = [], userId: any = null) {
  const errors: Record<string, string> = {};

  if (!userData.name || userData.name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (userData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!userData.email || userData.email.trim().length === 0) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(userData.email)) {
    errors.email = 'Invalid email format';
  } else if (!isEmailUnique(userData.email, existingUsers, userId)) {
    errors.email = 'Email already exists';
  }

  if (!userData.role || userData.role.trim().length === 0) {
    errors.role = 'Role is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function sanitizeUserData(userData: any) {
  return {
    name: userData.name?.trim() || '',
    email: userData.email?.trim().toLowerCase() || '',
    role: userData.role?.trim() || '',
    active: typeof userData.active === 'boolean' ? userData.active : true
  };
}

export function validateName(name: any) {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }
  if (name.trim().length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  if (name.trim().length > 100) {
    return { valid: false, error: 'Name must be less than 100 characters' };
  }
  return { valid: true, error: null };
}

export function validateEmail(email: any) {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email is required' };
  }
  if (!isValidEmail(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true, error: null };
}

export function validateRole(role: any, availableRoles: any[] = []) {
  if (!role || role.trim().length === 0) {
    return { valid: false, error: 'Role is required' };
  }
  if (availableRoles.length > 0 && !availableRoles.includes(role)) {
    return { valid: false, error: 'Invalid role selected' };
  }
  return { valid: true, error: null };
}

export function canDeleteUser(userId: any, users: any[]) {
  const user = users.find(u => u.id === userId);
  if (!user) {
    return { canDelete: false, reason: 'User not found' };
  }
  if (user.role === 'owner') {
    const ownerCount = users.filter(u => u.role === 'owner' && u.active).length;
    if (ownerCount <= 1) {
      return { canDelete: false, reason: 'Cannot delete the only active owner' };
    }
  }
  return { canDelete: true, reason: null };
}

export function canDisableUser(userId: any, users: any[]) {
  const user = users.find(u => u.id === userId);
  if (!user) {
    return { canDisable: false, reason: 'User not found' };
  }
  if (!user.active) {
    return { canDisable: false, reason: 'User is already disabled' };
  }
  if (user.role === 'owner') {
    const activeOwnerCount = users.filter(u => u.role === 'owner' && u.active).length;
    if (activeOwnerCount <= 1) {
      return { canDisable: false, reason: 'Cannot disable the only active owner' };
    }
  }
  return { canDisable: true, reason: null };
}

export function validatePassword(password: any) {
  const errors: string[] = [];

  if (!password || password.length === 0) {
    errors.push('Password is required');
    return { valid: false, errors };
  }
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function getValidationSummary(errors: any) {
  const errorMessages = Object.values(errors).filter(Boolean);
  if (errorMessages.length === 0) return '';
  if (errorMessages.length === 1) return errorMessages[0];
  return `${errorMessages.length} validation errors: ${errorMessages.join(', ')}`;
}

export function isEmailDomainAllowed(email: any, allowedDomains: any[] = []) {
  if (!email || allowedDomains.length === 0) return true;
  const domain = email.split('@')[1]?.toLowerCase();
  return allowedDomains.includes(domain);
}
