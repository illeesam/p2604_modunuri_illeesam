package com.shopjoy.ecBeBo.base.ec.pm.repository;

import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmPlanItem;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl.QPmPlanItemRepository;

public interface PmPlanItemRepository extends JpaRepository<PmPlanItem, String>, QPmPlanItemRepository {
}
