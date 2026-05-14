package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmPathDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPath;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmPathRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
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
import com.shopjoy.ecadminapi.common.util.CmUtil;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmPathService {

    private final CmPathRepository cmPathRepository;

    @PersistenceContext
    private EntityManager em;

    public CmPathDto.Item getById(String id) {
        CmPathDto.Item dto = cmPathRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmPathDto.Item getByIdOrNull(String id) {
        return cmPathRepository.selectById(id).orElse(null);
    }

    public CmPath findById(String id) {
        return cmPathRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmPath findByIdOrNull(String id) {
        return cmPathRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return cmPathRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!cmPathRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<CmPathDto.Item> getList(CmPathDto.Request req) {
        return cmPathRepository.selectList(req);
    }

    public CmPathDto.PageResponse getPageData(CmPathDto.Request req) {
        PageHelper.addPaging(req);
        return cmPathRepository.selectPageList(req);
    }

    @Transactional
    public CmPath create(CmPath body) {
        if (body.getBizCd() == null) throw new CmBizException("bizCd 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmPath saved = cmPathRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public CmPath save(CmPath entity) {
        if (!existsById(entity.getBizCd()))
            throw new CmBizException("존재하지 않는 CmPath입니다: " + entity.getBizCd() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmPath saved = cmPathRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public CmPath update(String id, CmPath body) {
        CmPath entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "bizCd^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmPath saved = cmPathRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public CmPath updateSelective(CmPath entity) {
        if (entity.getBizCd() == null) throw new CmBizException("bizCd 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getBizCd()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getBizCd() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = cmPathRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        CmPath entity = findById(id);
        cmPathRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<CmPath> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getBizCd() != null)
            .map(CmPath::getBizCd)
            .toList();
        if (!deleteIds.isEmpty()) {
            cmPathRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<CmPath> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getBizCd() != null)
            .toList();
        for (CmPath row : updateRows) {
            CmPath entity = findById(row.getBizCd());
            VoUtil.voCopyExclude(row, entity, "bizCd^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            cmPathRepository.save(entity);
        }
        em.flush();

        List<CmPath> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (CmPath row : insertRows) {
            if (row.getBizCd() == null) throw new CmBizException("bizCd 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            cmPathRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
