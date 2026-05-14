package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdDlivTmpltDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdDlivTmplt;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdDlivTmpltRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PdDlivTmpltService {

    private final PdDlivTmpltRepository pdDlivTmpltRepository;

    @PersistenceContext
    private EntityManager em;

    public PdDlivTmpltDto.Item getById(String id) {
        PdDlivTmpltDto.Item dto = pdDlivTmpltRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdDlivTmpltDto.Item getByIdOrNull(String id) {
        return pdDlivTmpltRepository.selectById(id).orElse(null);
    }

    public PdDlivTmplt findById(String id) {
        return pdDlivTmpltRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdDlivTmplt findByIdOrNull(String id) {
        return pdDlivTmpltRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return pdDlivTmpltRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdDlivTmpltRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<PdDlivTmpltDto.Item> getList(PdDlivTmpltDto.Request req) {
        return pdDlivTmpltRepository.selectList(req);
    }

    public PdDlivTmpltDto.PageResponse getPageData(PdDlivTmpltDto.Request req) {
        PageHelper.addPaging(req);
        return pdDlivTmpltRepository.selectPageList(req);
    }

    @Transactional
    public PdDlivTmplt create(PdDlivTmplt body) {
        body.setDlivTmpltId(CmUtil.generateId("pd_dliv_tmplt"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdDlivTmplt saved = pdDlivTmpltRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdDlivTmplt save(PdDlivTmplt entity) {
        if (!existsById(entity.getDlivTmpltId()))
            throw new CmBizException("존재하지 않는 PdDlivTmplt입니다: " + entity.getDlivTmpltId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdDlivTmplt saved = pdDlivTmpltRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdDlivTmplt update(String id, PdDlivTmplt body) {
        PdDlivTmplt entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "dlivTmpltId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdDlivTmplt saved = pdDlivTmpltRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdDlivTmplt updateSelective(PdDlivTmplt entity) {
        if (entity.getDlivTmpltId() == null) throw new CmBizException("dlivTmpltId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getDlivTmpltId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDlivTmpltId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdDlivTmpltRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PdDlivTmplt entity = findById(id);
        pdDlivTmpltRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<PdDlivTmplt> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getDlivTmpltId() != null)
            .map(PdDlivTmplt::getDlivTmpltId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdDlivTmpltRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdDlivTmplt> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getDlivTmpltId() != null)
            .toList();
        for (PdDlivTmplt row : updateRows) {
            PdDlivTmplt entity = findById(row.getDlivTmpltId());
            VoUtil.voCopyExclude(row, entity, "dlivTmpltId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdDlivTmpltRepository.save(entity);
        }
        em.flush();

        List<PdDlivTmplt> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdDlivTmplt row : insertRows) {
            row.setDlivTmpltId(CmUtil.generateId("pd_dliv_tmplt"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdDlivTmpltRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
