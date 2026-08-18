import { Module } from '@nestjs/common';
import { BranchesModule } from '../branches/branches.module';
import { BranchMenuItemsController } from './branch-menu-items.controller';
import { MenuItemsController } from './menu-items.controller';
import { MenuItemsService } from './menu-items.service';

@Module({
  imports: [BranchesModule],
  controllers: [BranchMenuItemsController, MenuItemsController],
  providers: [MenuItemsService],
  exports: [MenuItemsService],
})
export class MenuItemsModule {}
