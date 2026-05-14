package com.shopjoy.ecadminapi.base.ec.st.repository;

import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleRaw;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleRawRepository;

public interface StSettleRawRepository extends JpaRepository<StSettleRaw, String>, QStSettleRawRepository {
}
