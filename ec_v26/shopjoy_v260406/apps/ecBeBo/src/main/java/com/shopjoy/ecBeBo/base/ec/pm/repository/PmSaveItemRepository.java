package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveItem;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmSaveItemRepository;

public interface PmSaveItemRepository extends JpaRepository<PmSaveItem, String>, QPmSaveItemRepository {
}
