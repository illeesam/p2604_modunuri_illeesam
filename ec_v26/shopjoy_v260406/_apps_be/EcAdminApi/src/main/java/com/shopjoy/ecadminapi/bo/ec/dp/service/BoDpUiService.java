package com.shopjoy.ecadminapi.bo.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import com.shopjoy.ecadminapi.base.ec.dp.service.DpAreaService;
import com.shopjoy.ecadminapi.base.ec.dp.service.DpUiService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * BO DpUi 서비스 — base DpUiService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoDpUiService {

    private final DpUiService dpUiService;
    private final DpAreaService dpAreaService;

    /* 키조회 */
    public DpUiDto.Item getById(String id) {
        DpUiDto.Item dto = dpUiService.getById(id);
        _itemFillRelations(dto);
        return dto;
    }
    /* 목록조회 */
    public List<DpUiDto.Item> getList(DpUiDto.Request req) {
        List<DpUiDto.Item> list = dpUiService.getList(req);
        _listFillRelations(list);
        return list;
    }
    /* 페이지조회 */
    public DpUiDto.PageResponse getPageData(DpUiDto.Request req) {
        DpUiDto.PageResponse res = dpUiService.getPageData(req);
        _listFillRelations(res.getPageList());
        return res;
    }

    /** _itemFillRelations — 단건 연관조회 (areas 채우기) */
    private void _itemFillRelations(DpUiDto.Item ui) {
        if (ui == null) return;

        // 하위 영역 목록 조회 (uiId 기준)
        DpAreaDto.Request areaReq = new DpAreaDto.Request();
        areaReq.setUiId(ui.getUiId());
        ui.setAreas(dpAreaService.getList(areaReq)); // 영역목록
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (areas 를 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하는 _itemFillRelations 와 달리, N개 행이라도 area 1회만 조회한다.
     */
    private void _listFillRelations(List<DpUiDto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 부모 키 수집 (중복 제거)
        List<String> uiIds = list.stream()
            .map(DpUiDto.Item::getUiId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        if (uiIds.isEmpty()) return;

        // 영역 일괄조회 → Map<uiId, List<area>>
        DpAreaDto.Request areaReq = new DpAreaDto.Request();
        areaReq.setUiIds(uiIds);
        Map<String, List<DpAreaDto.Item>> areaMap = dpAreaService.getList(areaReq).stream()
            .collect(Collectors.groupingBy(DpAreaDto.Item::getUiId));

        // 각 항목에 분배
        for (DpUiDto.Item ui : list) {
            ui.setAreas(areaMap.getOrDefault(ui.getUiId(), List.of())); // 영역목록
        }
    }

    @Transactional public DpUi create(DpUi body) { return dpUiService.create(body); }
    @Transactional public DpUi update(String id, DpUi body) { return dpUiService.update(id, body); }
    @Transactional public void delete(String id) { dpUiService.delete(id); }
    @Transactional public void saveList(List<DpUi> rows) { dpUiService.saveList(rows); }
}
