package com.shopjoy.ecadminapi.bo.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdDlivMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdDlivRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class BoOdDlivService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final OdDlivMapper mapper;
    private final OdDlivRepository repository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<OdDlivDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<OdDlivDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public OdDlivDto getById(String id) {
        OdDlivDto dto = mapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public OdDliv create(OdDliv body) {
        if (body.getDlivStatusCd() == null) body.setDlivStatusCd("PENDING");
        body.setDlivId("DL" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdDliv saved = repository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    @Transactional
    public OdDlivDto update(String id, OdDliv body) {
        OdDliv entity = repository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "dlivId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdDliv saved = repository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        OdDliv entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public OdDlivDto changeStatus(String id, String statusCd) {
        OdDliv entity = repository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id));
        entity.setDlivStatusCdBefore(entity.getDlivStatusCd());
        entity.setDlivStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdDliv saved = repository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    @Transactional
    public void bulkStatus(Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("ids");
        String status = (String) body.get("status");
        if (ids == null || status == null) return;
        String updBy = SecurityUtil.getAuthUser().authId();
        for (String id : ids) {
            repository.findById(id).ifPresent(e -> {
                e.setDlivStatusCdBefore(e.getDlivStatusCd());
                e.setDlivStatusCd(status);
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdDliv saved = repository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
            });
        }
    }

    @Transactional
    public void bulkCourier(Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("ids");
        String courier = (String) body.get("courier");
        String trackingNo = (String) body.get("trackingNo");
        if (ids == null) return;
        String updBy = SecurityUtil.getAuthUser().authId();
        for (String id : ids) {
            repository.findById(id).ifPresent(e -> {
                if (courier != null) e.setOutboundCourierCd(courier);
                if (trackingNo != null) e.setOutboundTrackingNo(trackingNo);
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdDliv saved = repository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
            });
        }
    }

    @Transactional
    public void bulkApproval(Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("ids");
        if (ids == null) return;
        String updBy = SecurityUtil.getAuthUser().authId();
        for (String id : ids) {
            repository.findById(id).ifPresent(e -> {
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdDliv saved = repository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
            });
        }
    }

    @Transactional
    public void bulkApprovalReq(Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("ids");
        if (ids == null) return;
        String updBy = SecurityUtil.getAuthUser().authId();
        for (String id : ids) {
            repository.findById(id).ifPresent(e -> {
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdDliv saved = repository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
            });
        }
    }
}
