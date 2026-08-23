package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscnt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmDiscntRepository;

import java.util.List;

public interface PmDiscntRepository extends JpaRepository<PmDiscnt, String>, QPmDiscntRepository {

    @Query("SELECT d FROM PmDiscnt d " +
           "WHERE d.useYn = 'Y' " +
           "AND d.discntStatusCd = 'ACTIVE'")
    List<PmDiscnt> findSyncTargets();
}
