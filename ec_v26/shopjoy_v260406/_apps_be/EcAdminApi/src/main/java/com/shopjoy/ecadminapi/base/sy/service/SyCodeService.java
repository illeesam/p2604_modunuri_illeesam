package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;
import com.shopjoy.ecadminapi.base.sy.repository.SyCodeRepository;
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
public class SyCodeService {

    private final SyCodeRepository syCodeRepository;

    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public SyCodeDto.Item getById(String id) {
        SyCodeDto.Item dto = syCodeRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyCodeDto.Item getByIdOrNull(String id) {
        return syCodeRepository.selectById(id).orElse(null);
    }

    /* 상세조회 */
    public SyCode findById(String id) {
        return syCodeRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyCode findByIdOrNull(String id) {
        return syCodeRepository.findById(id).orElse(null);
    }

    /* 키검증 */
    public boolean existsById(String id) {
        return syCodeRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syCodeRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 목록조회 */
    public List<SyCodeDto.Item> getList(SyCodeDto.Request req) {
        return syCodeRepository.selectList(req);
    }

    /* 페이지조회 */
    public SyCodeDto.PageResponse getPageData(SyCodeDto.Request req) {
        PageHelper.addPaging(req);
        return syCodeRepository.selectPageList(req);
    }

    /* 등록 */
    @Transactional
    public SyCode create(SyCode body) {
        body.setCodeId(CmUtil.generateId("sy_code"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyCode saved = syCodeRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 저장 */
    @Transactional
    public SyCode save(SyCode entity) {
        if (!existsById(entity.getCodeId()))
            throw new CmBizException("존재하지 않는 SyCode입니다: " + entity.getCodeId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyCode saved = syCodeRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 수정 */
    @Transactional
    public SyCode update(String id, SyCode body) {
        SyCode entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "codeId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyCode saved = syCodeRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 수정 */
    @Transactional
    public SyCode updateSelective(SyCode entity) {
        if (entity.getCodeId() == null) throw new CmBizException("codeId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getCodeId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getCodeId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syCodeRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 삭제 */
    @Transactional
    public void delete(String id) {
        SyCode entity = findById(id);
        syCodeRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 목록저장 */
    @Transactional
    public void saveList(List<SyCode> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getCodeId() != null)
            .map(SyCode::getCodeId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syCodeRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyCode> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getCodeId() != null)
            .toList();
        for (SyCode row : updateRows) {
            SyCode entity = findById(row.getCodeId());
            VoUtil.voCopyExclude(row, entity, "codeId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syCodeRepository.save(entity);
        }
        em.flush();

        List<SyCode> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyCode row : insertRows) {
            row.setCodeId(CmUtil.generateId("sy_code"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syCodeRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
