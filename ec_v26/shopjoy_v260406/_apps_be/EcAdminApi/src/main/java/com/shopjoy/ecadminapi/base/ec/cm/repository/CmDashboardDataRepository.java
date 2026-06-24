package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CmDashboardDataRepository extends JpaRepository<CmDashboardData, String> {

    List<CmDashboardData> findBySiteIdAndUiNmAndYyyymmddOrderByDashboardItemIdAsc(
            String siteId, String uiNm, String yyyymmdd);

    Optional<CmDashboardData> findBySiteIdAndDashboardItemIdAndYyyymmdd(
            String siteId, String dashboardItemId, String yyyymmdd);

    void deleteBySiteIdAndDashboardItemIdAndYyyymmdd(
            String siteId, String dashboardItemId, String yyyymmdd);

    List<CmDashboardData> findBySiteIdAndDashboardItemIdAndYyyymmddBetweenOrderByYyyymmddAscDashboardDataIdAsc(
            String siteId, String dashboardItemId, String yyyymmddStart, String yyyymmddEnd);

    List<CmDashboardData> findBySiteIdAndDashboardItemIdOrderByYyyymmddAscDashboardDataIdAsc(
            String siteId, String dashboardItemId);
}
