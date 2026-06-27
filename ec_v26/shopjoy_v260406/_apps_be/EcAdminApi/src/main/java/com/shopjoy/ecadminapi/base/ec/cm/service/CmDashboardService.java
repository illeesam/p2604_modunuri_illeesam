package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmDashboardDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboard;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItemData;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardItemDataRepository;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardItemRepository;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * EC 종합 대시보드 서비스 — cm_dashboard + cm_dashboard_item + cm_dashboard_item_data 기반.
 *
 * <p>요청 목록 [{compId, siteId, uiNm, startYmd, endYmd, limit}] 를 받아
 * 각 항목을 병렬 조회하여 {@code info{NNNN}} 키로 Map에 담아 반환한다.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmDashboardService {

    private final CmDashboardRepository cmDashboardRepository;
    private final CmDashboardItemRepository cmDashboardItemRepository;
    private final CmDashboardItemDataRepository cmDashboardItemDataRepository;

    /**
     * 대시보드 데이터 조회.
     *
     * @param items [{compId: "COMP0101", siteId: "2604010000000001", uiNm: "DashboardBoEc01",
     *               startYmd: "20250501", endYmd: "20260624"}, ...]
     * @return {"info0101": [...], "info0202": [...], ...}
     */
    public Map<String, Object> getDashboard(List<Map<String, Object>> items) {
        Map<String, Object> result = new ConcurrentHashMap<>();
        List<CompletableFuture<Void>> futures = items.stream()
            .map(item -> CompletableFuture.runAsync(() -> {
                String compId = String.valueOf(item.get("compId"));
                String key = "info" + compId.substring(4); // COMP0101 → info0101
                result.put(key, queryOne(compId, item));
            }))
            .toList();
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        return result;
    }

    private List<CmDashboardDto> queryOne(String compId, Map<String, Object> p) {
        String siteId = str(p.get("siteId"));
        String uiNm   = str(p.get("uiNm"));

        // cm_dashboard 헤더로 dashboardId 조회
        String dashboardId = null;
        if (siteId != null && uiNm != null) {
            CmDashboard dash = cmDashboardRepository.findBySiteIdAndUiCompNm(siteId, uiNm).orElse(null);
            if (dash != null) dashboardId = dash.getDashboardId();
        }

        // 패널 목록 조회
        List<CmDashboardItem> itemList;
        if (dashboardId != null) {
            itemList = cmDashboardItemRepository.findByDashboardIdOrderBySortOrdAsc(dashboardId);
        } else if (siteId != null) {
            itemList = cmDashboardItemRepository.findBySiteIdOrderBySortOrdAsc(siteId);
        } else {
            itemList = cmDashboardItemRepository.findAll();
        }

        CmDashboardItem panel = itemList.stream()
            .filter(i -> compId.equals(i.getItemKey()))
            .findFirst().orElse(null);

        if (panel == null) return List.of();

        // cm_dashboard_item_data에서 해당 패널의 데이터 조회
        String startYmd = str(p.get("startYmd"));
        String endYmd   = str(p.get("endYmd"));
        Object limitObj = p.get("limit");

        List<CmDashboardItemData> rows;
        if (startYmd != null && endYmd != null) {
            rows = cmDashboardItemDataRepository
                .findBySiteIdAndDashboardItemIdAndYyyymmddBetweenOrderByYyyymmddAscItemDataIdAsc(
                    panel.getSiteId(), panel.getDashboardItemId(), startYmd, endYmd);
        } else {
            rows = cmDashboardItemDataRepository
                .findBySiteIdAndDashboardItemIdOrderByYyyymmddAscItemDataIdAsc(
                    panel.getSiteId(), panel.getDashboardItemId());
        }

        if (limitObj instanceof Number n) {
            rows = rows.stream().limit(n.longValue()).toList();
        }

        return rows.stream().map(this::toDto).toList();
    }

    private CmDashboardDto toDto(CmDashboardItemData d) {
        return CmDashboardDto.builder()
            .dashboardId(d.getItemDataId())
            .compId(d.getItemKey())
            .yyyymmdd(d.getYyyymmdd())
            .siteNo(d.getSiteId())
            .uiNm(d.getUiNm())
            .deptId(d.getDeptId())
            .userId(d.getUserId())
            .col1Nm(d.getCol1Nm()).col1Num(d.getCol1Num())
            .col2Nm(d.getCol2Nm()).col2Num(d.getCol2Num())
            .col3Nm(d.getCol3Nm()).col3Num(d.getCol3Num())
            .col4Nm(d.getCol4Nm()).col4Num(d.getCol4Num())
            .col5Nm(d.getCol5Nm()).col5Num(d.getCol5Num())
            .col6Nm(d.getCol6Nm()).col6Num(d.getCol6Num())
            .col7Nm(d.getCol7Nm()).col7Num(d.getCol7Num())
            .col8Nm(d.getCol8Nm()).col8Num(d.getCol8Num())
            .col9Nm(d.getCol9Nm()).col9Num(d.getCol9Num())
            .build();
    }

    private static String str(Object v) {
        if (v == null) return null;
        String s = v.toString().trim();
        return s.isBlank() ? null : s;
    }
}
