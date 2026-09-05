package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponProd;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCouponProdRepository;

public interface PmCouponProdRepository extends JpaRepository<PmCouponProd, String>, QPmCouponProdRepository {
}
