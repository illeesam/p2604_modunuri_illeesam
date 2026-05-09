package com.shopjoy.ecadminapi.bo.ec.od.service;

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
import java.util.Map;

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

    public OdDlivDto.Item getById(String id) { return odDlivService.getById(id); }
    public List<OdDlivDto.Item> getList(OdDlivDto.Request req) { return odDlivService.getList(req); }
    public OdDlivDto.PageResponse getPageData(OdDlivDto.Request req) { return odDlivService.getPageData(req); }

    @Transactional public OdDliv create(OdDliv body) {
        if (body.getDlivStatusCd() == null) body.setDlivStatusCd("PENDING");
        return odDlivService.create(body);
    }
    @Transactional public OdDliv update(String id, OdDliv body) { return odDlivService.update(id, body); }
    @Transactional public void delete(String id) { odDlivService.delete(id); }
    @Transactional public List<OdDliv> saveList(List<OdDliv> rows) { return odDlivService.saveList(rows); }

    /** changeStatus — dlivStatusCd 변경 (이력 보존) */
    @Transactional
    public OdDlivDto.Item changeStatus(String id, String statusCd) {
        OdDliv entity = odDlivRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id));
        entity.setDlivStatusCdBefore(entity.getDlivStatusCd());
        entity.setDlivStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdDliv saved = odDlivRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return odDlivService.getById(id);
    }

    /** bulkStatus — 다건 상태 변경 */
    @Transactional
    public void bulkStatus(Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("ids");
        String status = (String) body.get("status");
        if (ids == null || status == null) return;
        String updBy = SecurityUtil.getAuthUser().authId();
        for (String id : ids) {
            odDlivRepository.findById(id).ifPresent(e -> {
                e.setDlivStatusCdBefore(e.getDlivStatusCd());
                e.setDlivStatusCd(status);
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdDliv saved = odDlivRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
            });
        }
    }

    /** bulkCourier — 다건 택배사/송장 변경 */
    @Transactional
    public void bulkCourier(Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("ids");
        String courier = (String) body.get("courier");
        String trackingNo = (String) body.get("trackingNo");
        if (ids == null) return;
        String updBy = SecurityUtil.getAuthUser().authId();
        for (String id : ids) {
            odDlivRepository.findById(id).ifPresent(e -> {
                if (courier != null) e.setOutboundCourierCd(courier);
                if (trackingNo != null) e.setOutboundTrackingNo(trackingNo);
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdDliv saved = odDlivRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
            });
        }
    }

    /** bulkApproval — 다건 결재 처리 */
    @Transactional
    public void bulkApproval(Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("ids");
        if (ids == null) return;
        String updBy = SecurityUtil.getAuthUser().authId();
        for (String id : ids) {
            odDlivRepository.findById(id).ifPresent(e -> {
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdDliv saved = odDlivRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
            });
        }
    }

    /** bulkApprovalReq — 다건 결재 요청 */
    @Transactional
    public void bulkApprovalReq(Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("ids");
        if (ids == null) return;
        String updBy = SecurityUtil.getAuthUser().authId();
        for (String id : ids) {
            odDlivRepository.findById(id).ifPresent(e -> {
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdDliv saved = odDlivRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
            });
        }
    }
}
