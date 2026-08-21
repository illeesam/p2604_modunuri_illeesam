package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CmDashboardDataRepository extends JpaRepository<CmDashboardData, String> {

    Optional<CmDashboardData> findByDashboardItemIdAndYyyymmdd(
            String dashboardItemId, String yyyymmdd);

    void deleteByDashboardItemIdAndYyyymmdd(
            String dashboardItemId, String yyyymmdd);

    List<CmDashboardData> findByDashboardItemIdAndYyyymmddBetweenOrderByYyyymmddAscDashboardDataIdAsc(
            String dashboardItemId, String yyyymmddStart, String yyyymmddEnd);

    List<CmDashboardData> findByDashboardItemIdOrderByYyyymmddAscDashboardDataIdAsc(
            String dashboardItemId);

    /**
     * 데이터관리 화면 조회 — 사이트+기간+차트들로 한 번에 가져온다.
     *
     * <p>상품·업체 조건은 일부러 여기서 걸지 않는다. "지정 안 함 = 컬럼도 NULL 인 행" 이라는
     * 3항 조건은 JPQL 의 {@code :param IS NULL} 로 쓰면 읽기 어렵고 방언별 동작 차이도 있어,
     * 호출부(CmDashboardDataGridService)에서 Java 로 거른다. 이 조회는 (한 대시보드 × 한 기간)
     * 이라 결과가 수십 건 수준이므로 애플리케이션 필터링으로 충분하다.</p>
     */
    List<CmDashboardData> findBySiteIdAndYyyymmddAndDashboardItemIdInOrderByDashboardItemIdAscItemKeyAsc(
            String siteId, String yyyymmdd, List<String> dashboardItemIds);

    /** 좌표 조회 — (item_key, data_opts) 가 UNIQUE 라 최대 1건. 저장 시 upsert 판정에 쓴다 */
    Optional<CmDashboardData> findByItemKeyAndDataOpts(String itemKey, String dataOpts);

    /** 정의행이 사라질 때 그 자리에 있던 값도 함께 정리 */
    int deleteByItemKey(String itemKey);

    /** 키명 변경 시 데이터의 조립코드도 따라 바꾼다 (값은 그대로 유지) */
    @Modifying
    @Query("UPDATE CmDashboardData d SET d.itemKey = :newKey WHERE d.itemKey = :oldKey")
    int updateItemKey(@Param("oldKey") String oldKey, @Param("newKey") String newKey);

    /** 대시보드·기간 범위의 3레벨 데이터 전체 — 차트 렌더용 조인의 t02(데이터) 원천 */
    List<CmDashboardData> findByDashboardIdAndYyyymmddBetweenOrderByItemKeyAscYyyymmddAsc(
            String dashboardId, String yyyymmddStart, String yyyymmddEnd);
}
