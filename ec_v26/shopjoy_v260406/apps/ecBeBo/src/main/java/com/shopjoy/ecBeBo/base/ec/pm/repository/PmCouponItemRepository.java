package com.shopjoy.ecBeBo.base.ec.pm.repository;

import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmCouponItem;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl.QPmCouponItemRepository;

public interface PmCouponItemRepository extends JpaRepository<PmCouponItem, String>, QPmCouponItemRepository {
}
