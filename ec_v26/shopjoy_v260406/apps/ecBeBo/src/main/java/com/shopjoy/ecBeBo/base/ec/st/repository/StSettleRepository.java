package com.shopjoy.ecadminapi.base.ec.st.repository;

import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettle;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleRepository;

public interface StSettleRepository extends JpaRepository<StSettle, String>, QStSettleRepository {
}
