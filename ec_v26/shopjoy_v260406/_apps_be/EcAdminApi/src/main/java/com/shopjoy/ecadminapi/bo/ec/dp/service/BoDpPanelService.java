package com.shopjoy.ecadminapi.bo.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelItemDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;
import com.shopjoy.ecadminapi.base.ec.dp.service.DpPanelService;
import com.shopjoy.ecadminapi.base.ec.dp.service.DpPanelItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * BO DpPanel 서비스 — base DpPanelService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoDpPanelService {

    private final DpPanelService dpPanelService;
    private final DpPanelItemService dpPanelItemService;

    /* 키조회 */
    public DpPanelDto.Item getById(String id) {
        DpPanelDto.Item dto = dpPanelService.getById(id);
        _itemFillRelations(dto);
        return dto;
    }
    /* 목록조회 */
    public List<DpPanelDto.Item> getList(DpPanelDto.Request req) {
        List<DpPanelDto.Item> list = dpPanelService.getList(req);
        _listFillRelations(list);
        return list;
    }
    /* 페이지조회 */
    public DpPanelDto.PageResponse getPageData(DpPanelDto.Request req) {
        DpPanelDto.PageResponse res = dpPanelService.getPageData(req);
        _listFillRelations(res.getPageList());
        return res;
    }

    /** _itemFillRelations — 단건 연관조회 (panelItems 채우기) */
    private void _itemFillRelations(DpPanelDto.Item panel) {
        if (panel == null) return;

        // 하위 패널 아이템 목록 조회 (panelId 기준)
        DpPanelItemDto.Request piReq = new DpPanelItemDto.Request();
        piReq.setPanelId(panel.getPanelId());
        panel.setPanelItems(dpPanelItemService.getList(piReq)); // 패널아이템목록
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (panelItems 를 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하는 _itemFillRelations 와 달리, N개 행이라도 panelItem 1회만 조회한다.
     */
    private void _listFillRelations(List<DpPanelDto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 부모 키 수집 (중복 제거)
        List<String> panelIds = list.stream()
            .map(DpPanelDto.Item::getPanelId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        if (panelIds.isEmpty()) return;

        // 패널 아이템 일괄조회 → Map<panelId, List<panelItem>>
        DpPanelItemDto.Request piReq = new DpPanelItemDto.Request();
        piReq.setPanelIds(panelIds);
        Map<String, List<DpPanelItemDto.Item>> piMap = dpPanelItemService.getList(piReq).stream()
            .collect(Collectors.groupingBy(DpPanelItemDto.Item::getPanelId));

        // 각 항목에 분배
        for (DpPanelDto.Item panel : list) {
            panel.setPanelItems(piMap.getOrDefault(panel.getPanelId(), List.of())); // 패널아이템목록
        }
    }

    @Transactional public DpPanel create(DpPanel body) { return dpPanelService.create(body); }
    @Transactional public DpPanel update(String id, DpPanel body) { return dpPanelService.update(id, body); }
    @Transactional public void delete(String id) { dpPanelService.delete(id); }
    @Transactional public void saveList(List<DpPanel> rows) { dpPanelService.saveList(rows); }
}
