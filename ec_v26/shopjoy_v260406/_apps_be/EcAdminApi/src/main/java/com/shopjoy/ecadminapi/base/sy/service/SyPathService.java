package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPathDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyPath;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
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
public class SyPathService {

    private final SyPathRepository syPathRepository;

    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public SyPathDto.Item getById(String id) {
        SyPathDto.Item dto = syPathRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyPathDto.Item getByIdOrNull(String id) {
        return syPathRepository.selectById(id).orElse(null);
    }

    /* 상세조회 */
    public SyPath findById(String id) {
        return syPathRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyPath findByIdOrNull(String id) {
        return syPathRepository.findById(id).orElse(null);
    }

    /* 키검증 */
    public boolean existsById(String id) {
        return syPathRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syPathRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 목록조회 */
    public List<SyPathDto.Item> getList(SyPathDto.Request req) {
        return syPathRepository.selectList(req);
    }

    /* 페이지조회 */
    public SyPathDto.PageResponse getPageData(SyPathDto.Request req) {
        PageHelper.addPaging(req);
        return syPathRepository.selectPageList(req);
    }

    /* 등록 */
    @Transactional
    public SyPath create(SyPath body) {
        body.setPathId(CmUtil.generateId("sy_path"));
        body.setRegBy(CmUtil.nvl(SecurityUtil.getAuthUser().authId(), "system"));
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(CmUtil.nvl(SecurityUtil.getAuthUser().authId(), "system"));
        body.setUpdDate(LocalDateTime.now());
        SyPath saved = syPathRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 저장 */
    @Transactional
    public SyPath save(SyPath entity) {
        if (!existsById(entity.getPathId()))
            throw new CmBizException("존재하지 않는 SyPath입니다: " + entity.getPathId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(CmUtil.nvl(SecurityUtil.getAuthUser().authId(), "system"));
        entity.setUpdDate(LocalDateTime.now());
        SyPath saved = syPathRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 수정 */
    @Transactional
    public SyPath update(String id, SyPath body) {
        SyPath entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "pathId^regBy^regDate");
        entity.setUpdBy(CmUtil.nvl(SecurityUtil.getAuthUser().authId(), "system"));
        entity.setUpdDate(LocalDateTime.now());
        SyPath saved = syPathRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 수정 */
    @Transactional
    public SyPath updateSelective(SyPath entity) {
        if (entity.getPathId() == null) throw new CmBizException("pathId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getPathId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPathId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(CmUtil.nvl(SecurityUtil.getAuthUser().authId(), "system"));
        entity.setUpdDate(LocalDateTime.now());
        int affected = syPathRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 삭제 */
    @Transactional
    public void delete(String id) {
        SyPath entity = findById(id);
        syPathRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 목록저장 */
    @Transactional
    public void saveList(List<SyPath> rows) {
        String authId = CmUtil.nvl(SecurityUtil.getAuthUser().authId(), "system");
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getPathId() != null)
            .map(SyPath::getPathId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syPathRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyPath> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getPathId() != null)
            .toList();
        for (SyPath row : updateRows) {
            SyPath entity = findById(row.getPathId());
            VoUtil.voCopyExclude(row, entity, "pathId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syPathRepository.save(entity);
        }
        em.flush();

        List<SyPath> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyPath row : insertRows) {
            row.setPathId(CmUtil.generateId("sy_path"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syPathRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
