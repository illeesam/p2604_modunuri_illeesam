package com.shopjoy.ecadminapi.bo.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimBulkDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdClaimRepository;
import com.shopjoy.ecadminapi.base.ec.od.service.OdClaimItemService;
import com.shopjoy.ecadminapi.base.ec.od.service.OdClaimService;
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
 * BO 클레임 서비스 — base OdClaimService 위임 (thin wrapper) + 일괄 처리 메서드.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoOdClaimService {

    private final OdClaimService odClaimService;
    private final OdClaimItemService odClaimItemService;
    private final OdClaimRepository odClaimRepository;

    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public OdClaimDto.Item getById(String id) {
        OdClaimDto.Item dto = odClaimService.getById(id);
        _itemFillRelations(dto);
        return dto;
    }
    /* 목록조회 */
    public List<OdClaimDto.Item> getList(OdClaimDto.Request req) {
        List<OdClaimDto.Item> list = odClaimService.getList(req);
        _listFillRelations(list);
        return list;
    }
    /* 페이지조회 */
    public OdClaimDto.PageResponse getPageData(OdClaimDto.Request req) {
        OdClaimDto.PageResponse res = odClaimService.getPageData(req);
        _listFillRelations(res.getPageList());
        return res;
    }

    /** _itemFillRelations — 단건 연관조회 (claimItems 채우기) */
    private void _itemFillRelations(OdClaimDto.Item claim) {
        if (claim == null) return;

        // 하위 클레임상품 목록 조회 (claimId 기준)
        OdClaimItemDto.Request itemReq = new OdClaimItemDto.Request();
        itemReq.setClaimId(claim.getClaimId());
        claim.setClaimItems(odClaimItemService.getList(itemReq)); // 클레임상품목록
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (claimItems 를 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하는 _itemFillRelations 와 달리, N개 행이라도 claimItem 1회만 조회한다.
     */
    private void _listFillRelations(List<OdClaimDto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 부모 키 수집 (중복 제거)
        List<String> claimIds = list.stream()
            .map(OdClaimDto.Item::getClaimId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        if (claimIds.isEmpty()) return;

        // 클레임상품 일괄조회 → Map<claimId, List<item>>
        OdClaimItemDto.Request itemReq = new OdClaimItemDto.Request();
        itemReq.setClaimIds(claimIds);
        Map<String, List<OdClaimItemDto.Item>> itemMap = odClaimItemService.getList(itemReq).stream()
            .collect(Collectors.groupingBy(OdClaimItemDto.Item::getClaimId));

        // 각 항목에 분배
        for (OdClaimDto.Item claim : list) {
            String cid = claim.getClaimId();
            claim.setClaimItems(itemMap.getOrDefault(cid, List.of())); // 클레임상품목록
        }
    }

    @Transactional public OdClaim create(OdClaim body) { return odClaimService.create(body); }
    @Transactional public OdClaim update(String id, OdClaim body) { return odClaimService.update(id, body); }
    @Transactional public void delete(String id) { odClaimService.delete(id); }
    @Transactional public void saveList(List<OdClaim> rows) { odClaimService.saveList(rows); }

    /** changeStatus — claimStatusCd 변경 (이력 보존) */
    @Transactional
    public OdClaimDto.Item changeStatus(String id, String statusCd) {
        OdClaim entity = odClaimRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        entity.setClaimStatusCdBefore(entity.getClaimStatusCd());
        entity.setClaimStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdClaim saved = odClaimRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return odClaimService.getById(id);
    }

    /** bulkStatus — 다건 상태 변경 (행별로 다른 statusCd 적용) */
    @Transactional
    public void bulkStatus(OdClaimBulkDto.Request req) {
        if (req == null || req.getChanges() == null) return;
        String updBy = SecurityUtil.getAuthUser().authId();
        for (OdClaimBulkDto.Change c : req.getChanges()) {
            odClaimRepository.findById(c.getId()).ifPresent(e -> {
                e.setClaimStatusCdBefore(e.getClaimStatusCd());
                e.setClaimStatusCd(c.getStatusCd());
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdClaim saved = odClaimRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            });
        }
    }

    /** bulkType — 다건 유형 변경 */
    @Transactional
    public void bulkType(OdClaimBulkDto.Request req) {
        if (req == null || req.getIds() == null || req.getType() == null) return;
        String updBy = SecurityUtil.getAuthUser().authId();
        for (String id : req.getIds()) {
            odClaimRepository.findById(id).ifPresent(e -> {
                e.setClaimTypeCd(req.getType());
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdClaim saved = odClaimRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            });
        }
    }

    /** bulkApproval — 다건 결재 처리 */
    @Transactional
    public void bulkApproval(OdClaimBulkDto.Request req) {
        if (req == null || req.getIds() == null) return;
        String updBy = SecurityUtil.getAuthUser().authId();
        for (String id : req.getIds()) {
            odClaimRepository.findById(id).ifPresent(e -> {
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdClaim saved = odClaimRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            });
        }
    }

    /** bulkApprovalReq — 다건 결재 요청 */
    @Transactional
    public void bulkApprovalReq(OdClaimBulkDto.Request req) {
        if (req == null || req.getIds() == null) return;
        String updBy = SecurityUtil.getAuthUser().authId();
        for (String id : req.getIds()) {
            odClaimRepository.findById(id).ifPresent(e -> {
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdClaim saved = odClaimRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            });
        }
    }
}
