ALTER TABLE suppliers
    ADD COLUMN company_id BIGINT NOT NULL AFTER id,
    ADD CONSTRAINT fk_suppliers_company FOREIGN KEY (company_id) REFERENCES companies(id);

ALTER TABLE parts
    ADD COLUMN company_id BIGINT NOT NULL AFTER id,
    ADD CONSTRAINT fk_parts_company FOREIGN KEY (company_id) REFERENCES companies(id);

ALTER TABLE stock_movements
    ADD COLUMN company_id BIGINT NOT NULL AFTER id,
    ADD CONSTRAINT fk_stock_movements_company FOREIGN KEY (company_id) REFERENCES companies(id);

ALTER TABLE purchases
    ADD COLUMN company_id BIGINT NOT NULL AFTER id,
    ADD CONSTRAINT fk_purchases_company FOREIGN KEY (company_id) REFERENCES companies(id);