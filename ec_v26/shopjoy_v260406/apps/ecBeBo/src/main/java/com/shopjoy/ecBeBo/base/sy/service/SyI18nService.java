package com.shopjoy.ecBeBo.base.sy.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyI18nDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyI18n;
import com.shopjoy.ecBeBo.base.sy.repository.SyI18nRepository;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.util.PageHelper;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import com.shopjoy.ecBeBo.common.util.VoUtil;
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
public class SyI18nService {

    private final SyI18nRepository syI18nRepository;

    @PersistenceContext
    private EntityManager em;

    /* 다국어 키조회 */
    public SyI18nDto.Item getById(String id) {
        // [QueryDSL] 다국어 키 마스터 단건 조회
        SyI18nDto.Item dto = syI18nRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyI18nDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 다국어 키 마스터 단건 조회
        return syI18nRepository.selectById(id).orElse(null);
    }

    /* 다국어 상세조회 */
    public SyI18n findById(String id) {
        // [쿼리 메서드] 다국어 키 마스터 단건 조회
        return syI18nRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyI18n findByIdOrNull(String id) {
        // [쿼리 메서드] 다국어 키 마스터 단건 조회
        return syI18nRepository.findById(id).orElse(null);
    }

    /* 다국어 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 다국어 키 마스터 존재 여부 확인
        return syI18nRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 다국어 키 마스터 존재 여부 확인
        if (!syI18nRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 다국어 목록조회 */
    public List<SyI18nDto.Item> getList(SyI18nDto.Request req) {
        // [QueryDSL] 다국어 키 마스터 목록 조회
        return syI18nRepository.selectList(req);
    }

    /* 다국어 페이지조회 */
    public BasePage<SyI18nDto.Item> getPageData(SyI18nDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 다국어 키 마스터 페이지 조회
        return syI18nRepository.selectPageData(req);
    }

    /* 다국어 등록 */
    @Transactional
    public SyI18n create(SyI18n body) {
        body.setI18nId(CmUtil.generateId("sy_i18n"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 다국어 키 마스터 저장
        SyI18n saved = syI18nRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 다국어 수정 */
    @Transactional
    public SyI18n update(String id, SyI18n body) {
        CmUtil.requireId(id, "id", this);
        SyI18n entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "i18nId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 다국어 키 마스터 저장
        SyI18n saved = syI18nRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 다국어 수정 */
    @Transactional
    public SyI18n updateSelective(SyI18n entity) {
        if (entity.getI18nId() == null) throw new CmBizException("i18nId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getI18nId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getI18nId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 다국어 키 마스터 선택적 필드 수정
        int affected = syI18nRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 다국어 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyI18n entity = findById(id);
        // [쿼리 메서드] 다국어 키 마스터 삭제
        syI18nRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyI18n saveOneBase(SyI18n entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getI18nId());

        if ("D".equals(rowStatus)) {
            if (entity.getI18nId() == null)
                throw new CmBizException("삭제 대상 i18nId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 다국어 키 마스터 존재 여부 확인
            if (!syI18nRepository.existsById(entity.getI18nId()))
                throw new CmBizException("존재하지 않는 SyI18n입니다: " + entity.getI18nId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 다국어 키 마스터 ID 기준 삭제
            syI18nRepository.deleteById(entity.getI18nId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setI18nId(CmUtil.generateId("sy_i18n"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 다국어 키 마스터 저장
            SyI18n saved = syI18nRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getI18nId() == null)
                throw new CmBizException("수정 대상 i18nId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 다국어 키 마스터 선택적 필드 수정
            int affected = syI18nRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 SyI18n입니다: " + entity.getI18nId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getI18nId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<SyI18n> rows) {
        /* 0단계: rowStatus 정규화 */
        for (SyI18n row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getI18nId() == null || row.getI18nId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, SyI18n::getI18nId, "U", "i18nId", this);
        CmUtil.requireRowIds(rows, SyI18n::getI18nId, "D", "i18nId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(SyI18n::getI18nId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 다국어 키 마스터 조건별 삭제
            syI18nRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<SyI18n> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (SyI18n row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 다국어 키 마스터 선택적 필드 수정
            int affected = syI18nRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getI18nId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<SyI18n> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyI18n row : insertRows) {
            row.setI18nId(CmUtil.generateId("sy_i18n"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 다국어 키 마스터 저장
            syI18nRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
