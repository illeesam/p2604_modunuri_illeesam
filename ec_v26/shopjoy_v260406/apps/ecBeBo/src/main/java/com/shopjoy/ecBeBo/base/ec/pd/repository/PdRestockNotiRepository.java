package com.shopjoy.ecBeBo.base.ec.pd.repository;

import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdRestockNoti;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.QPdRestockNotiRepository;

public interface PdRestockNotiRepository extends JpaRepository<PdRestockNoti, String>, QPdRestockNotiRepository {
}
