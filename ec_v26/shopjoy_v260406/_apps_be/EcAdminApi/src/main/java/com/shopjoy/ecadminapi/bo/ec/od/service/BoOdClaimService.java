package com.shopjoy.ecadminapi.bo.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimBulkDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdClaimRepository;
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

/**
 * BO 클레임 서비스 — base OdClaimService 위임 (thin wrapper) + 일괄 처리 메서드.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoOdClaimService {

    private final OdClaimService odClaimService;
    private final OdClaimRepository odClaimRepository;

    @PersistenceContext
    private EntityManager em;

    public OdClaimDto.Item getById(String id) { return odClaimService.getById(id); }
    public List<OdClaimDto.Item> getList(OdClaimDto.Request req) { return odClaimService.getList(req); }
    public OdClaimDto.PageResponse getPageData(OdClaimDto.Request req) { return odClaimService.getPageData(req); }

    @Transactional public OdClaim create(OdClaim body) { return odClaimService.create(body); }
    @Transactional public OdClaim update(String id, OdClaim body) { return odClaimService.update(id, body); }
    @Transactional public void delete(String id) { odClaimService.delete(id); }
    @Transactional public void saveList(List<OdClaim> rows) { odClaimService.saveList(rows); }

    /** changeStatus — claimStatusCd 변경 (이력 보존) */
    @Transactional
    public OdClaimDto.Item changeStatus(String id, String statusCd) {
        OdClaim entity = odClaimRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id));
        entity.setClaimStatusCdBefore(entity.getClaimStatusCd());
        entity.setClaimStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdClaim saved = odClaimRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
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
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
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
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
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
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
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
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
            });
        }
    }
}
