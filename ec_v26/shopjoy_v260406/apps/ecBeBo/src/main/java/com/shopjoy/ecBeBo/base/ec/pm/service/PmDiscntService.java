package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscnt;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmDiscntRepository;
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
public class PmDiscntService {

    private final PmDiscntRepository pmDiscntRepository;

    @PersistenceContext
    private EntityManager em;

    /* 할인 키조회 */
    public PmDiscntDto.Item getById(String id) {
        // [QueryDSL] 할인정책 단건 조회
        PmDiscntDto.Item dto = pmDiscntRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmDiscntDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 할인정책 단건 조회
        return pmDiscntRepository.selectById(id).orElse(null);
    }

    /* 할인 상세조회 */
    public PmDiscnt findById(String id) {
        // [쿼리 메서드] 할인정책 단건 조회
        return pmDiscntRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmDiscnt findByIdOrNull(String id) {
        // [쿼리 메서드] 할인정책 단건 조회
        return pmDiscntRepository.findById(id).orElse(null);
    }

    /* 할인 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 할인정책 존재 여부 확인
        return pmDiscntRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 할인정책 존재 여부 확인
        if (!pmDiscntRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 할인 목록조회 */
    public List<PmDiscntDto.Item> getList(PmDiscntDto.Request req) {
        // [QueryDSL] 할인정책 목록 조회
        return pmDiscntRepository.selectList(req);
    }

    /* 할인 페이지조회 */
    public BasePage<PmDiscntDto.Item> getPageData(PmDiscntDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 할인정책 페이지 조회
        return pmDiscntRepository.selectPageData(req);
    }

    /* 할인 등록 */
    @Transactional
    public PmDiscnt create(PmDiscnt body) {
        body.setDiscntId(CmUtil.generateId("pm_discnt"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 할인정책 저장
        PmDiscnt saved = pmDiscntRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 할인 수정 */
    @Transactional
    public PmDiscnt update(String id, PmDiscnt body) {
        CmUtil.requireId(id, "id", this);
        PmDiscnt entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "discntId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 할인정책 저장
        PmDiscnt saved = pmDiscntRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 할인 수정 */
    @Transactional
    public PmDiscnt updateSelective(PmDiscnt entity) {
        if (entity.getDiscntId() == null) throw new CmBizException("discntId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getDiscntId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDiscntId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 할인정책 선택적 필드 수정
        int affected = pmDiscntRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 할인 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PmDiscnt entity = findById(id);
        // [쿼리 메서드] 할인정책 삭제
        pmDiscntRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PmDiscnt saveOneBase(PmDiscnt entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getDiscntId());

        if ("D".equals(rowStatus)) {
            if (entity.getDiscntId() == null)
                throw new CmBizException("삭제 대상 discntId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 할인정책 존재 여부 확인
            if (!pmDiscntRepository.existsById(entity.getDiscntId()))
                throw new CmBizException("존재하지 않는 PmDiscnt입니다: " + entity.getDiscntId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 할인정책 ID 기준 삭제
            pmDiscntRepository.deleteById(entity.getDiscntId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setDiscntId(CmUtil.generateId("pm_discnt"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 할인정책 저장
            PmDiscnt saved = pmDiscntRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getDiscntId() == null)
                throw new CmBizException("수정 대상 discntId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 할인정책 선택적 필드 수정
            int affected = pmDiscntRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PmDiscnt입니다: " + entity.getDiscntId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getDiscntId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PmDiscnt> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PmDiscnt row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getDiscntId() == null || row.getDiscntId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PmDiscnt::getDiscntId, "U", "discntId", this);
        CmUtil.requireRowIds(rows, PmDiscnt::getDiscntId, "D", "discntId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PmDiscnt::getDiscntId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 할인정책 조건별 삭제
            pmDiscntRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PmDiscnt> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PmDiscnt row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 할인정책 선택적 필드 수정
            int affected = pmDiscntRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getDiscntId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PmDiscnt> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmDiscnt row : insertRows) {
            row.setDiscntId(CmUtil.generateId("pm_discnt"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 할인정책 저장
            pmDiscntRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
