package com.shopjoy.ecBeBo.base.ec.st.repository;

import com.shopjoy.ecBeBo.base.ec.st.data.entity.StSettleClose;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.st.repository.qrydsl.QStSettleCloseRepository;

public interface StSettleCloseRepository extends JpaRepository<StSettleClose, String>, QStSettleCloseRepository {
}
