package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmGiftRepository;

import java.util.List;

public interface PmGiftRepository extends JpaRepository<PmGift, String>, QPmGiftRepository {

    @Query("SELECT g FROM PmGift g " +
           "WHERE g.useYn = 'Y' " +
           "AND g.giftStatusCd = 'ACTIVE'")
    List<PmGift> findSyncTargets();
}
