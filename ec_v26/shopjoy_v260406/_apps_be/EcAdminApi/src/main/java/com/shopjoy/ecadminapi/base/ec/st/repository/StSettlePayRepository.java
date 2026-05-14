package com.shopjoy.ecadminapi.base.ec.st.repository;

import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettlePay;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettlePayRepository;

public interface StSettlePayRepository extends JpaRepository<StSettlePay, String>, QStSettlePayRepository {
}
