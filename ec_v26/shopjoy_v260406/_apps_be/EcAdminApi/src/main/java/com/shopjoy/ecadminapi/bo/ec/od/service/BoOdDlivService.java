package com.shopjoy.ecadminapi.bo.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdDlivRepository;
import com.shopjoy.ecadminapi.base.ec.od.service.OdDlivItemService;
import com.shopjoy.ecadminapi.base.ec.od.service.OdDlivService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import com.shopjoy.ecadminapi.common.util.CmUtil;

/**
 * BO 배송 서비스 — base OdDlivService 위임 (thin wrapper) + 일괄 처리 메서드.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoOdDlivService {

    private final OdDlivService odDlivService;
    private final OdDlivItemService odDlivItemService;
    private final OdDlivRepository odDlivRepository;

    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public OdDlivDto.Item getById(String id) {
        OdDlivDto.Item dto = odDlivService.getById(id);
        _itemFillRelations(dto);
        return dto;
    }
    /* 목록조회 */
    public List<OdDlivDto.Item> getList(OdDlivDto.Request req) {
        List<OdDlivDto.Item> list = odDlivService.getList(req);
        _listFillRelations(list);
        return list;
    }
    /* 페이지조회 */
    public OdDlivDto.PageResponse getPageData(OdDlivDto.Request req) {
        OdDlivDto.PageResponse res = odDlivService.getPageData(req);
        _listFillRelations(res.getPageList());
        return res;
    }

    /** _itemFillRelations — 단건 연관조회 (dlivItems 채우기) */
    private void _itemFillRelations(OdDlivDto.Item dliv) {
        if (dliv == null) return;

        // 하위 배송상품 목록 조회 (dlivId 기준)
        OdDlivItemDto.Request itemReq = new OdDlivItemDto.Request();
        itemReq.setDlivId(dliv.getDlivId());
        dliv.setDlivItems(odDlivItemService.getList(itemReq)); // 배송상품목록
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (dlivItems 를 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하는 _itemFillRelations 와 달리, N개 행이라도 dlivItem 1회만 조회한다.
     */
    private void _listFillRelations(List<OdDlivDto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 부모 키 수집 (중복 제거)
        List<String> dlivIds = list.stream()
            .map(OdDlivDto.Item::getDlivId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        if (dlivIds.isEmpty()) return;

        // 배송상품 일괄조회 → Map<dlivId, List<item>>
        OdDlivItemDto.Request itemReq = new OdDlivItemDto.Request();
        itemReq.setDlivIds(dlivIds);
        Map<String, List<OdDlivItemDto.Item>> itemMap = odDlivItemService.getList(itemReq).stream()
            .collect(Collectors.groupingBy(OdDlivItemDto.Item::getDlivId));

        // 각 항목에 분배
        for (OdDlivDto.Item dliv : list) {
            String did = dliv.getDlivId();
            dliv.setDlivItems(itemMap.getOrDefault(did, List.of())); // 배송상품목록
        }
    }

    @Transactional public OdDliv create(OdDliv body) {
        if (body.getDlivStatusCd() == null) body.setDlivStatusCd("PENDING");
        return odDlivService.create(body);
    }
    @Transactional public OdDliv update(String id, OdDliv body) { return odDlivService.update(id, body); }
    @Transactional public void delete(String id) { odDlivService.delete(id); }
    @Transactional public void saveListBase(List<OdDliv> rows) { odDlivService.saveListBase(rows); }

    /** saveOneStatus — 단건 dlivStatusCd 변경 (이력 보존). row: dlivId + dlivStatusCd */
    @Transactional
    public OdDlivDto.Item saveOneStatus(OdDliv row) {
        CmUtil.requireId(row == null ? null : row.getDlivId(), "dlivId", this);
        OdDliv entity = odDlivRepository.findById(row.getDlivId())
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + row.getDlivId() + "::" + CmUtil.svcCallerInfo(this)));
        entity.setDlivStatusCdBefore(entity.getDlivStatusCd());
        entity.setDlivStatusCd(row.getDlivStatusCd());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdDliv saved = odDlivRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return odDlivService.getById(row.getDlivId());
    }

    /** saveListStatus — 다건 상태 변경 (행별 dlivStatusCd, 이력 보존) */
    @Transactional
    public void saveListStatus(List<OdDliv> rows) {
        if (rows == null) return;
        CmUtil.requireRowIds(rows, OdDliv::getDlivId, "U", "dlivId", this);
        String updBy = SecurityUtil.getAuthUser().authId();
        for (OdDliv row : rows) {
            odDlivRepository.findById(row.getDlivId()).ifPresent(e -> {
                e.setDlivStatusCdBefore(e.getDlivStatusCd());
                e.setDlivStatusCd(row.getDlivStatusCd());
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdDliv saved = odDlivRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            });
        }
    }

    /** saveListCourier — 다건 택배사/송장 변경 (행별 outboundCourierCd/outboundTrackingNo) */
    @Transactional
    public void saveListCourier(List<OdDliv> rows) {
        if (rows == null) return;
        CmUtil.requireRowIds(rows, OdDliv::getDlivId, "U", "dlivId", this);
        String updBy = SecurityUtil.getAuthUser().authId();
        for (OdDliv row : rows) {
            odDlivRepository.findById(row.getDlivId()).ifPresent(e -> {
                if (row.getOutboundCourierCd() != null) e.setOutboundCourierCd(row.getOutboundCourierCd());
                if (row.getOutboundTrackingNo() != null) e.setOutboundTrackingNo(row.getOutboundTrackingNo());
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdDliv saved = odDlivRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            });
        }
    }

    /** saveListApproval — 다건 결재 처리 (updBy/updDate 갱신) */
    @Transactional
    public void saveListApproval(List<OdDliv> rows) {
        if (rows == null) return;
        CmUtil.requireRowIds(rows, OdDliv::getDlivId, "U", "dlivId", this);
        String updBy = SecurityUtil.getAuthUser().authId();
        for (OdDliv row : rows) {
            odDlivRepository.findById(row.getDlivId()).ifPresent(e -> {
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdDliv saved = odDlivRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            });
        }
    }

    /** saveListApprovalReq — 다건 결재 요청 (updBy/updDate 갱신) */
    @Transactional
    public void saveListApprovalReq(List<OdDliv> rows) {
        if (rows == null) return;
        CmUtil.requireRowIds(rows, OdDliv::getDlivId, "U", "dlivId", this);
        String updBy = SecurityUtil.getAuthUser().authId();
        for (OdDliv row : rows) {
            odDlivRepository.findById(row.getDlivId()).ifPresent(e -> {
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdDliv saved = odDlivRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            });
        }
    }
}
