package com.shopjoy.ecadminapi.bo.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivBulkDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdDlivRepository;
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
import com.shopjoy.ecadminapi.common.util.CmUtil;

/**
 * BO 배송 서비스 — base OdDlivService 위임 (thin wrapper) + 일괄 처리 메서드.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoOdDlivService {

    private final OdDlivService odDlivService;
    private final OdDlivRepository odDlivRepository;

    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public OdDlivDto.Item getById(String id) { return odDlivService.getById(id); }
    /* 목록조회 */
    public List<OdDlivDto.Item> getList(OdDlivDto.Request req) { return odDlivService.getList(req); }
    /* 페이지조회 */
    public OdDlivDto.PageResponse getPageData(OdDlivDto.Request req) { return odDlivService.getPageData(req); }

    @Transactional public OdDliv create(OdDliv body) {
        if (body.getDlivStatusCd() == null) body.setDlivStatusCd("PENDING");
        return odDlivService.create(body);
    }
    @Transactional public OdDliv update(String id, OdDliv body) { return odDlivService.update(id, body); }
    @Transactional public void delete(String id) { odDlivService.delete(id); }
    @Transactional public void saveList(List<OdDliv> rows) { odDlivService.saveList(rows); }

    /** changeStatus — dlivStatusCd 변경 (이력 보존) */
    @Transactional
    public OdDlivDto.Item changeStatus(String id, String statusCd) {
        OdDliv entity = odDlivRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        entity.setDlivStatusCdBefore(entity.getDlivStatusCd());
        entity.setDlivStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdDliv saved = odDlivRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return odDlivService.getById(id);
    }

    /** bulkStatus — 다건 상태 변경 */
    @Transactional
    public void bulkStatus(OdDlivBulkDto.Request req) {
        if (req == null || req.getIds() == null || req.getStatus() == null) return;
        String status = req.getStatus();
        String updBy = SecurityUtil.getAuthUser().authId();
        for (String id : req.getIds()) {
            odDlivRepository.findById(id).ifPresent(e -> {
                e.setDlivStatusCdBefore(e.getDlivStatusCd());
                e.setDlivStatusCd(status);
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdDliv saved = odDlivRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            });
        }
    }

    /** bulkCourier — 다건 택배사/송장 변경 */
    @Transactional
    public void bulkCourier(OdDlivBulkDto.Request req) {
        if (req == null || req.getIds() == null) return;
        String courier = req.getCourier();
        String trackingNo = req.getTrackingNo();
        String updBy = SecurityUtil.getAuthUser().authId();
        for (String id : req.getIds()) {
            odDlivRepository.findById(id).ifPresent(e -> {
                if (courier != null) e.setOutboundCourierCd(courier);
                if (trackingNo != null) e.setOutboundTrackingNo(trackingNo);
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdDliv saved = odDlivRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            });
        }
    }

    /** bulkApproval — 다건 결재 처리 */
    @Transactional
    public void bulkApproval(OdDlivBulkDto.Request req) {
        if (req == null || req.getIds() == null) return;
        String updBy = SecurityUtil.getAuthUser().authId();
        for (String id : req.getIds()) {
            odDlivRepository.findById(id).ifPresent(e -> {
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdDliv saved = odDlivRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            });
        }
    }

    /** bulkApprovalReq — 다건 결재 요청 */
    @Transactional
    public void bulkApprovalReq(OdDlivBulkDto.Request req) {
        if (req == null || req.getIds() == null) return;
        String updBy = SecurityUtil.getAuthUser().authId();
        for (String id : req.getIds()) {
            odDlivRepository.findById(id).ifPresent(e -> {
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdDliv saved = odDlivRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            });
        }
    }
}
