package com.shopjoy.ecBeBo.base.ec.od.repository;

import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdClaimItem;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl.QOdClaimItemRepository;

public interface OdClaimItemRepository extends JpaRepository<OdClaimItem, String>, QOdClaimItemRepository {
}
