import ApiError from '../utils/ApiError.js';
import { comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import * as customerService from './customer.service.js';
import * as staffService from './staff.service.js';

async function customerLogin(email, password) {
  const customer = await customerService.findByEmailWithPassword(email);
  if (!customer || !(await comparePassword(password, customer.password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = signToken({ sub: customer.id, type: 'customer' });
  return { token, customer: await customerService.getCustomerById(customer.id) };
}

async function staffLogin(email, password) {
  const staff = await staffService.findByEmailWithPassword(email);
  if (!staff || !(await comparePassword(password, staff.password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = signToken({ sub: staff.id, type: 'staff', role: staff.role });
  return { token, staff: await staffService.getStaffById(staff.id) };
}

export { customerLogin, staffLogin };
