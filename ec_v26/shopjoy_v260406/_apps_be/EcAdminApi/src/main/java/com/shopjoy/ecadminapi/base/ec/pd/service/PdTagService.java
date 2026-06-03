package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdTag;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdTagRepository;
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
public class PdTagService {

    private final PdTagRepository pdTagRepository;

    @PersistenceContext
    private EntityManager em;

    /* 태그 키조회 */
    public PdTagDto.Item getById(String id) {
        PdTagDto.Item dto = pdTagRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdTagDto.Item getByIdOrNull(String id) {
        return pdTagRepository.selectById(id).orElse(null);
    }

    /* 태그 상세조회 */
    public PdTag findById(String id) {
        return pdTagRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdTag findByIdOrNull(String id) {
        return pdTagRepository.findById(id).orElse(null);
    }

    /* 태그 키검증 */
    public boolean existsById(String id) {
        return pdTagRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdTagRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 태그 목록조회 */
    public List<PdTagDto.Item> getList(PdTagDto.Request req) {
        return pdTagRepository.selectList(req);
    }

    /* 태그 페이지조회 */
    public PdTagDto.PageResponse getPageData(PdTagDto.Request req) {
        PageHelper.addPaging(req);
        return pdTagRepository.selectPageData(req);
    }

    /* 태그 등록 */
    @Transactional
    public PdTag create(PdTag body) {
        body.setTagId(CmUtil.generateId("pd_tag"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdTag saved = pdTagRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 태그 수정 */
    @Transactional
    public PdTag update(String id, PdTag body) {
        CmUtil.requireId(id, "id", this);
        PdTag entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "tagId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdTag saved = pdTagRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 태그 수정 */
    @Transactional
    public PdTag updateSelective(PdTag entity) {
        if (entity.getTagId() == null) throw new CmBizException("tagId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getTagId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getTagId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdTagRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 태그 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PdTag entity = findById(id);
        pdTagRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PdTag saveOneBase(PdTag entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getTagId() == null || entity.getTagId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getTagId() == null)
                throw new CmBizException("삭제 대상 tagId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!pdTagRepository.existsById(entity.getTagId()))
                throw new CmBizException("존재하지 않는 PdTag입니다: " + entity.getTagId() + "::" + CmUtil.svcCallerInfo(this));
            pdTagRepository.deleteById(entity.getTagId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setTagId(CmUtil.generateId("pd_tag"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            PdTag saved = pdTagRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getTagId() == null)
                throw new CmBizException("수정 대상 tagId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = pdTagRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PdTag입니다: " + entity.getTagId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getTagId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PdTag> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PdTag row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getTagId() == null || row.getTagId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PdTag::getTagId, "U", "tagId", this);
        CmUtil.requireRowIds(rows, PdTag::getTagId, "D", "tagId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PdTag::getTagId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdTagRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PdTag> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PdTag row : updateRows) {
            row.setUpdBy(authId);
            int affected = pdTagRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getTagId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PdTag> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdTag row : insertRows) {
            row.setTagId(CmUtil.generateId("pd_tag"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdTagRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
