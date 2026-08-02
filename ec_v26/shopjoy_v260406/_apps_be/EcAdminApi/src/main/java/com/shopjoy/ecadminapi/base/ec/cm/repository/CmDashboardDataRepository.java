package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CmDashboardDataRepository extends JpaRepository<CmDashboardData, String> {

    List<CmDashboardData> findByUiNmAndYyyymmddOrderByDashboardItemIdAsc(
            String uiNm, String yyyymmdd);

    Optional<CmDashboardData> findByDashboardItemIdAndYyyymmdd(
            String dashboardItemId, String yyyymmdd);

    void deleteByDashboardItemIdAndYyyymmdd(
            String dashboardItemId, String yyyymmdd);

    List<CmDashboardData> findByDashboardItemIdAndYyyymmddBetweenOrderByYyyymmddAscDashboardDataIdAsc(
            String dashboardItemId, String yyyymmddStart, String yyyymmddEnd);

    List<CmDashboardData> findByDashboardItemIdOrderByYyyymmddAscDashboardDataIdAsc(
            String dashboardItemId);
}
