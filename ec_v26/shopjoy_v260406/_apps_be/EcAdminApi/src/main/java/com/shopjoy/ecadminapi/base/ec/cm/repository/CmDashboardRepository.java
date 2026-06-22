package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboard;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmDashboardRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CmDashboardRepository extends JpaRepository<CmDashboard, String>, QCmDashboardRepository {

    List<CmDashboard> findBySiteNoOrderByYyyymmddAsc(String siteNo);

    List<CmDashboard> findBySiteNoAndYyyymmddBetweenOrderByYyyymmddAsc(
            String siteNo, String startYmd, String endYmd);
}
