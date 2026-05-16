package com.shopjoy.ecadminapi.bo.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;
import com.shopjoy.ecadminapi.base.ec.dp.service.DpAreaService;
import com.shopjoy.ecadminapi.base.ec.dp.service.DpAreaPanelService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * BO DpArea 서비스 — base DpAreaService 위임 (thin wrapper) + 연관정보 채움.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoDpAreaService {

    private final DpAreaService dpAreaService;
    private final DpAreaPanelService dpAreaPanelService;

    /* 키조회 */
    public DpAreaDto.Item getById(String id) {
        DpAreaDto.Item dto = dpAreaService.getById(id);
        _itemFillRelations(dto);
        return dto;
    }
    /* 목록조회 */
    public List<DpAreaDto.Item> getList(DpAreaDto.Request req) {
        List<DpAreaDto.Item> list = dpAreaService.getList(req);
        _listFillRelations(list);
        return list;
    }
    /* 페이지조회 */
    public DpAreaDto.PageResponse getPageData(DpAreaDto.Request req) {
        DpAreaDto.PageResponse res = dpAreaService.getPageData(req);
        _listFillRelations(res.getPageList());
        return res;
    }

    /** _itemFillRelations — 단건 연관조회 (panels 채우기) */
    private void _itemFillRelations(DpAreaDto.Item area) {
        if (area == null) return;

        // 하위 영역-패널 연결 목록 조회 (areaId 기준)
        DpAreaPanelDto.Request apReq = new DpAreaPanelDto.Request();
        apReq.setAreaId(area.getAreaId());
        area.setPanels(dpAreaPanelService.getList(apReq)); // 영역패널목록
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (panels 를 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하는 _itemFillRelations 와 달리, N개 행이라도 1회만 조회한다.
     */
    private void _listFillRelations(List<DpAreaDto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 부모 키 수집 (중복 제거)
        List<String> areaIds = list.stream()
            .map(DpAreaDto.Item::getAreaId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        if (areaIds.isEmpty()) return;

        // 영역-패널 연결 일괄조회 → Map<areaId, List<panel>>
        DpAreaPanelDto.Request apReq = new DpAreaPanelDto.Request();
        apReq.setAreaIds(areaIds);
        Map<String, List<DpAreaPanelDto.Item>> apMap = dpAreaPanelService.getList(apReq).stream()
            .collect(Collectors.groupingBy(DpAreaPanelDto.Item::getAreaId));

        // 각 항목에 분배
        for (DpAreaDto.Item area : list) {
            area.setPanels(apMap.getOrDefault(area.getAreaId(), List.of())); // 영역패널목록
        }
    }

    @Transactional public DpArea create(DpArea body) { return dpAreaService.create(body); }
    @Transactional public DpArea update(String id, DpArea body) { return dpAreaService.update(id, body); }
    @Transactional public void delete(String id) { dpAreaService.delete(id); }
    @Transactional public void saveList(List<DpArea> rows) { dpAreaService.saveList(rows); }
}
