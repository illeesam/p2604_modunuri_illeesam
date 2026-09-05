package com.shopjoy.ecBeBo.base.ec.st.repository;

import com.shopjoy.ecBeBo.base.ec.st.data.entity.StErpVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.st.repository.qrydsl.QStErpVoucherRepository;

public interface StErpVoucherRepository extends JpaRepository<StErpVoucher, String>, QStErpVoucherRepository {
}
