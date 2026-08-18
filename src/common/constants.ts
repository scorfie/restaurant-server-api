export const PHONE_REGEX = /^[0-9+\-\s()]{6,20}$/;
export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

export const ORDER_TYPES = ['dine_in', 'takeaway', 'delivery'] as const;
export const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'completed', 'cancelled'] as const;
export const BRANCH_STATUSES = ['active', 'inactive'] as const;
export const STAFF_ROLES = ['admin', 'manager', 'staff'] as const;
