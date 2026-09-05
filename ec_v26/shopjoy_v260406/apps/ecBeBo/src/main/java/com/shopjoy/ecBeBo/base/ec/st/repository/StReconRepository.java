package com.shopjoy.ecBeBo.base.ec.st.repository;

import com.shopjoy.ecBeBo.base.ec.st.data.entity.StRecon;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.st.repository.qrydsl.QStReconRepository;

public interface StReconRepository extends JpaRepository<StRecon, String>, QStReconRepository {
}
