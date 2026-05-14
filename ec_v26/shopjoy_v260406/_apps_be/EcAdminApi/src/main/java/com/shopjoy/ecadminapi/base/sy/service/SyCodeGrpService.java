package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCodeGrp;
import com.shopjoy.ecadminapi.base.sy.repository.SyCodeGrpRepository;
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
public class SyCodeGrpService {

    private final SyCodeGrpRepository syCodeGrpRepository;

    @PersistenceContext
    private EntityManager em;

    public SyCodeGrpDto.Item getById(String id) {
        SyCodeGrpDto.Item dto = syCodeGrpRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyCodeGrpDto.Item getByIdOrNull(String id) {
        return syCodeGrpRepository.selectById(id).orElse(null);
    }

    public SyCodeGrp findById(String id) {
        return syCodeGrpRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyCodeGrp findByIdOrNull(String id) {
        return syCodeGrpRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return syCodeGrpRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syCodeGrpRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<SyCodeGrpDto.Item> getList(SyCodeGrpDto.Request req) {
        return syCodeGrpRepository.selectList(req);
    }

    public SyCodeGrpDto.PageResponse getPageData(SyCodeGrpDto.Request req) {
        PageHelper.addPaging(req);
        return syCodeGrpRepository.selectPageList(req);
    }

    @Transactional
    public SyCodeGrp create(SyCodeGrp body) {
        body.setCodeGrpId(CmUtil.generateId("sy_code_grp"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyCodeGrp saved = syCodeGrpRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public SyCodeGrp save(SyCodeGrp entity) {
        if (!existsById(entity.getCodeGrpId()))
            throw new CmBizException("존재하지 않는 SyCodeGrp입니다: " + entity.getCodeGrpId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyCodeGrp saved = syCodeGrpRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public SyCodeGrp update(String id, SyCodeGrp body) {
        SyCodeGrp entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "codeGrpId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyCodeGrp saved = syCodeGrpRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public SyCodeGrp updateSelective(SyCodeGrp entity) {
        if (entity.getCodeGrpId() == null) throw new CmBizException("codeGrpId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getCodeGrpId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getCodeGrpId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syCodeGrpRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        SyCodeGrp entity = findById(id);
        syCodeGrpRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<SyCodeGrp> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getCodeGrpId() != null)
            .map(SyCodeGrp::getCodeGrpId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syCodeGrpRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyCodeGrp> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getCodeGrpId() != null)
            .toList();
        for (SyCodeGrp row : updateRows) {
            SyCodeGrp entity = findById(row.getCodeGrpId());
            VoUtil.voCopyExclude(row, entity, "codeGrpId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syCodeGrpRepository.save(entity);
        }
        em.flush();

        List<SyCodeGrp> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyCodeGrp row : insertRows) {
            row.setCodeGrpId(CmUtil.generateId("sy_code_grp"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syCodeGrpRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
