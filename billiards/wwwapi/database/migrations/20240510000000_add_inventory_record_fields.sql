ALTER TABLE `bi_busi_inventory_record` 
ADD COLUMN IF NOT EXISTS `before_stock` INT NOT NULL DEFAULT 0 AFTER `quantity`,
ADD COLUMN IF NOT EXISTS `after_stock` INT NOT NULL DEFAULT 0 AFTER `before_stock`;