package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPropDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.repository.SyPropRepository;
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
public class SyPropService {

    private final SyPropRepository syPropRepository;

    @PersistenceContext
    private EntityManager em;

    /* 시스템 속성 키조회 */
    public SyPropDto.Item getById(String id) {
        SyPropDto.Item dto = syPropRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyPropDto.Item getByIdOrNull(String id) {
        return syPropRepository.selectById(id).orElse(null);
    }

    /* 시스템 속성 상세조회 */
    public SyProp findById(String id) {
        return syPropRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyProp findByIdOrNull(String id) {
        return syPropRepository.findById(id).orElse(null);
    }

    /* 시스템 속성 키검증 */
    public boolean existsById(String id) {
        return syPropRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syPropRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 시스템 속성 목록조회 */
    public List<SyPropDto.Item> getList(SyPropDto.Request req) {
        return syPropRepository.selectList(req);
    }

    /* 시스템 속성 페이지조회 */
    public SyPropDto.PageResponse getPageData(SyPropDto.Request req) {
        PageHelper.addPaging(req);
        return syPropRepository.selectPageList(req);
    }

    /* 시스템 속성 등록 */
    @Transactional
    public SyProp create(SyProp body) {
        body.setPropId(CmUtil.generateId("sy_prop"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyProp saved = syPropRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 시스템 속성 저장 */
    @Transactional
    public SyProp save(SyProp entity) {
        if (!existsById(entity.getPropId()))
            throw new CmBizException("존재하지 않는 SyProp입니다: " + entity.getPropId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyProp saved = syPropRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 시스템 속성 수정 */
    @Transactional
    public SyProp update(String id, SyProp body) {
        SyProp entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "propId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyProp saved = syPropRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 시스템 속성 수정 */
    @Transactional
    public SyProp updateSelective(SyProp entity) {
        if (entity.getPropId() == null) throw new CmBizException("propId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getPropId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPropId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syPropRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 시스템 속성 삭제 */
    @Transactional
    public void delete(String id) {
        SyProp entity = findById(id);
        syPropRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 시스템 속성 목록저장 */
    @Transactional
    public void saveList(List<SyProp> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getPropId() != null)
            .map(SyProp::getPropId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syPropRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyProp> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getPropId() != null)
            .toList();
        for (SyProp row : updateRows) {
            SyProp entity = findById(row.getPropId());
            VoUtil.voCopyExclude(row, entity, "propId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syPropRepository.save(entity);
        }
        em.flush();

        List<SyProp> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyProp row : insertRows) {
            row.setPropId(CmUtil.generateId("sy_prop"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syPropRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
