package com.shopjoy.ecadminapi.base.ec.st.repository;

import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStErpVoucherRepository;

public interface StErpVoucherRepository extends JpaRepository<StErpVoucher, String>, QStErpVoucherRepository {
}
