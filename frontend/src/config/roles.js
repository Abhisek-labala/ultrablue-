// FIXED PLATFORM ROLES CONFIGURATION
// UltraBlue+ strictly supports 3 fixed enterprise roles: Admin, Sales Operator, Distributor.

export const ROLES = Object.freeze({
  ADMIN: 'admin',
  OPERATOR: 'operator',
  DISTRIBUTOR: 'distributor'
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.ADMIN]: 'Admin',
  [ROLES.OPERATOR]: 'Sales Operator',
  [ROLES.DISTRIBUTOR]: 'Distributor'
});

export const FIXED_ROLES = Object.freeze([
  ROLES.ADMIN,
  ROLES.OPERATOR,
  ROLES.DISTRIBUTOR
]);

export const isValidRole = (role) => {
  return FIXED_ROLES.includes(role);
};
