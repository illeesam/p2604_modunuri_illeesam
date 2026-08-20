package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItemData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CmDashboardItemDataRepository extends JpaRepository<CmDashboardItemData, String> {

    Optional<CmDashboardItemData> findByDashboardItemIdAndYyyymmdd(
            String dashboardItemId, String yyyymmdd);

    void deleteByDashboardItemIdAndYyyymmdd(
            String dashboardItemId, String yyyymmdd);

    List<CmDashboardItemData> findByDashboardItemIdAndYyyymmddBetweenOrderByYyyymmddAscDashboardItemDataIdAsc(
            String dashboardItemId, String yyyymmddStart, String yyyymmddEnd);

    List<CmDashboardItemData> findByDashboardItemIdOrderByYyyymmddAscDashboardItemDataIdAsc(
            String dashboardItemId);

    /**
     * 데이터관리 화면 조회 — 사이트+기간+차트들로 한 번에 가져온다.
     *
     * <p>상품·업체 조건은 일부러 여기서 걸지 않는다. "지정 안 함 = 컬럼도 NULL 인 행" 이라는
     * 3항 조건은 JPQL 의 {@code :param IS NULL} 로 쓰면 읽기 어렵고 방언별 동작 차이도 있어,
     * 호출부(CmDashboardDataGridService)에서 Java 로 거른다. 이 조회는 (한 대시보드 × 한 기간)
     * 이라 결과가 수십 건 수준이므로 애플리케이션 필터링으로 충분하다.</p>
     */
    List<CmDashboardItemData> findBySiteIdAndYyyymmddAndDashboardItemIdInOrderByDashboardItemIdAscSeriesNmAsc(
            String siteId, String yyyymmdd, List<String> dashboardItemIds);

    /**
     * 항목 트리의 3레벨 폴백용 — 차트들의 저장 데이터 전체.
     *
     * <p>{@code cols_json}(3레벨 정의)이 없는 구형 차트는 실제 데이터의 {@code col1_nm} 들이
     * 곧 항목 목록이다(한 행에 라벨 하나씩 쌓는 long 형식). 그 distinct 값을 3레벨로 쓴다.</p>
     */
    List<CmDashboardItemData> findByDashboardItemIdIn(List<String> dashboardItemIds);
}
