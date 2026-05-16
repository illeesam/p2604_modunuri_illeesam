package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventBenefitDto;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmEventRepository;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmEventItemService;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmEventBenefitService;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import com.shopjoy.ecadminapi.common.util.CmUtil;

/**
 * FO 이벤트 서비스 — 진행 중 이벤트 조회
 * URL: /api/fo/ec/pm/event
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoPmEventService {

    private final PmEventRepository pmEventRepository;
    private final PmEventItemService pmEventItemService;
    private final PmEventBenefitService pmEventBenefitService;

    /** getList — 조회 */
    public List<PmEventDto.Item> getList(PmEventDto.Request req) {
        List<PmEventDto.Item> list = pmEventRepository.selectList(req);
        _listFillRelations(list);
        return list;
    }

    /** getPageData — 조회 */
    public PmEventDto.PageResponse getPageData(PmEventDto.Request req) {
        PageHelper.addPaging(req);
        PmEventDto.PageResponse res = pmEventRepository.selectPageList(req);
        _listFillRelations(res.getPageList());
        return res;
    }

    /** getById — 조회 */
    public PmEventDto.Item getById(String eventId) {
        PmEventDto.Item dto = pmEventRepository.selectById(eventId).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 이벤트입니다: " + eventId + "::" + CmUtil.svcCallerInfo(this));
        _itemFillRelations(dto);
        return dto;
    }

    /** _itemFillRelations — 단건 연관조회 (eventItems/benefits 채우기) */
    private void _itemFillRelations(PmEventDto.Item event) {
        if (event == null) return;

        // 하위 이벤트 대상상품 목록 조회 (eventId 기준)
        PmEventItemDto.Request eiReq = new PmEventItemDto.Request();
        eiReq.setEventId(event.getEventId());
        event.setEventItems(pmEventItemService.getList(eiReq)); // 이벤트상품목록

        // 하위 이벤트 혜택 목록 조회 (eventId 기준)
        PmEventBenefitDto.Request ebReq = new PmEventBenefitDto.Request();
        ebReq.setEventId(event.getEventId());
        event.setBenefits(pmEventBenefitService.getList(ebReq)); // 이벤트혜택목록
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (eventItems/benefits 를 각각 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하는 _itemFillRelations 와 달리, N개 행이라도 eventItem 1회 + benefit 1회만 조회한다.
     */
    private void _listFillRelations(List<PmEventDto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 부모 키 수집 (중복 제거)
        List<String> eventIds = list.stream()
            .map(PmEventDto.Item::getEventId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        if (eventIds.isEmpty()) return;

        // 이벤트 대상상품 일괄조회 → Map<eventId, List<eventItem>>
        PmEventItemDto.Request eiReq = new PmEventItemDto.Request();
        eiReq.setEventIds(eventIds);
        Map<String, List<PmEventItemDto.Item>> eiMap = pmEventItemService.getList(eiReq).stream()
            .collect(Collectors.groupingBy(PmEventItemDto.Item::getEventId));

        // 이벤트 혜택 일괄조회 → Map<eventId, List<benefit>>
        PmEventBenefitDto.Request ebReq = new PmEventBenefitDto.Request();
        ebReq.setEventIds(eventIds);
        Map<String, List<PmEventBenefitDto.Item>> ebMap = pmEventBenefitService.getList(ebReq).stream()
            .collect(Collectors.groupingBy(PmEventBenefitDto.Item::getEventId));

        // 각 항목에 분배
        for (PmEventDto.Item event : list) {
            String eid = event.getEventId();
            event.setEventItems(eiMap.getOrDefault(eid, List.of())); // 이벤트상품목록
            event.setBenefits(ebMap.getOrDefault(eid, List.of()));   // 이벤트혜택목록
        }
    }
}
