package com.shopjoy.ecadminapi.base.ec.st.repository;

import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucherLine;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStErpVoucherLineRepository;

public interface StErpVoucherLineRepository extends JpaRepository<StErpVoucherLine, String>, QStErpVoucherLineRepository {
}
