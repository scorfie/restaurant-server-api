import express from 'express';
import authRoutes from './auth.routes.js';
import branchRoutes from './branch.routes.js';
import customerRoutes from './customer.routes.js';
import * as menuItemRoutes from './menuItem.routes.js';
import * as orderRoutes from './order.routes.js';
import staffRoutes from './staff.routes.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy' });
});

router.use('/auth', authRoutes);
router.use('/staff', staffRoutes);
router.use('/customers', customerRoutes);

router.use('/branches/:branchId/menu-items', menuItemRoutes.branchScopedRouter);
router.use('/branches/:branchId/orders', orderRoutes.branchScopedRouter);
router.use('/branches', branchRoutes);

router.use('/menu-items', menuItemRoutes.flatRouter);
router.use('/orders', orderRoutes.flatRouter);

export default router;
