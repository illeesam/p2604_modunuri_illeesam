package com.shopjoy.ecadminapi.base.ec.st.repository;

import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleClose;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleCloseRepository;

public interface StSettleCloseRepository extends JpaRepository<StSettleClose, String>, QStSettleCloseRepository {
}
