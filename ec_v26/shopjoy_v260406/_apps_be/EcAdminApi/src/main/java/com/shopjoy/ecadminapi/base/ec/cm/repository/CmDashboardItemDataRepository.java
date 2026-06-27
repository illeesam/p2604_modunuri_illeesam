package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItemData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CmDashboardItemDataRepository extends JpaRepository<CmDashboardItemData, String> {

    Optional<CmDashboardItemData> findBySiteIdAndDashboardItemIdAndYyyymmdd(
            String siteId, String dashboardItemId, String yyyymmdd);

    void deleteBySiteIdAndDashboardItemIdAndYyyymmdd(
            String siteId, String dashboardItemId, String yyyymmdd);

    List<CmDashboardItemData> findBySiteIdAndDashboardItemIdAndYyyymmddBetweenOrderByYyyymmddAscItemDataIdAsc(
            String siteId, String dashboardItemId, String yyyymmddStart, String yyyymmddEnd);

    List<CmDashboardItemData> findBySiteIdAndDashboardItemIdOrderByYyyymmddAscItemDataIdAsc(
            String siteId, String dashboardItemId);
}
