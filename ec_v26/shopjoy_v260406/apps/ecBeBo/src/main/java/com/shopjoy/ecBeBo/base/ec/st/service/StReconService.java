package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StReconDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StRecon;
import com.shopjoy.ecadminapi.base.ec.st.repository.StReconRepository;
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
public class StReconService {

    private final StReconRepository stReconRepository;

    @PersistenceContext
    private EntityManager em;

    /* 정산 대사(Reconciliation) 키조회 */
    public StReconDto.Item getById(String id) {
        // [QueryDSL] 정산 대사 (기대금액 vs 실제금액 불일치 관리) 단건 조회
        StReconDto.Item dto = stReconRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StReconDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 정산 대사 (기대금액 vs 실제금액 불일치 관리) 단건 조회
        return stReconRepository.selectById(id).orElse(null);
    }

    /* 정산 대사(Reconciliation) 상세조회 */
    public StRecon findById(String id) {
        // [쿼리 메서드] 정산 대사 (기대금액 vs 실제금액 불일치 관리) 단건 조회
        return stReconRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StRecon findByIdOrNull(String id) {
        // [쿼리 메서드] 정산 대사 (기대금액 vs 실제금액 불일치 관리) 단건 조회
        return stReconRepository.findById(id).orElse(null);
    }

    /* 정산 대사(Reconciliation) 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 정산 대사 (기대금액 vs 실제금액 불일치 관리) 존재 여부 확인
        return stReconRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 정산 대사 (기대금액 vs 실제금액 불일치 관리) 존재 여부 확인
        if (!stReconRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 정산 대사(Reconciliation) 목록조회 */
    public List<StReconDto.Item> getList(StReconDto.Request req) {
        // [QueryDSL] 정산 대사 (기대금액 vs 실제금액 불일치 관리) 목록 조회
        return stReconRepository.selectList(req);
    }

    /* 정산 대사(Reconciliation) 페이지조회 */
    public BasePage<StReconDto.Item> getPageData(StReconDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 정산 대사 (기대금액 vs 실제금액 불일치 관리) 페이지 조회
        return stReconRepository.selectPageData(req);
    }

    /* 정산 대사(Reconciliation) 등록 */
    @Transactional
    public StRecon create(StRecon body) {
        body.setReconId(CmUtil.generateId("st_recon"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 정산 대사 (기대금액 vs 실제금액 불일치 관리) 저장
        StRecon saved = stReconRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 정산 대사(Reconciliation) 수정 */
    @Transactional
    public StRecon update(String id, StRecon body) {
        CmUtil.requireId(id, "id", this);
        StRecon entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "reconId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 정산 대사 (기대금액 vs 실제금액 불일치 관리) 저장
        StRecon saved = stReconRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 정산 대사(Reconciliation) 수정 */
    @Transactional
    public StRecon updateSelective(StRecon entity) {
        if (entity.getReconId() == null) throw new CmBizException("reconId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getReconId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getReconId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 정산 대사 (기대금액 vs 실제금액 불일치 관리) 선택적 필드 수정
        int affected = stReconRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 정산 대사(Reconciliation) 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        StRecon entity = findById(id);
        // [쿼리 메서드] 정산 대사 (기대금액 vs 실제금액 불일치 관리) 삭제
        stReconRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public StRecon saveOneBase(StRecon entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getReconId());

        if ("D".equals(rowStatus)) {
            if (entity.getReconId() == null)
                throw new CmBizException("삭제 대상 reconId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 정산 대사 (기대금액 vs 실제금액 불일치 관리) 존재 여부 확인
            if (!stReconRepository.existsById(entity.getReconId()))
                throw new CmBizException("존재하지 않는 StRecon입니다: " + entity.getReconId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 정산 대사 (기대금액 vs 실제금액 불일치 관리) ID 기준 삭제
            stReconRepository.deleteById(entity.getReconId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setReconId(CmUtil.generateId("st_recon"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 정산 대사 (기대금액 vs 실제금액 불일치 관리) 저장
            StRecon saved = stReconRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getReconId() == null)
                throw new CmBizException("수정 대상 reconId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 정산 대사 (기대금액 vs 실제금액 불일치 관리) 선택적 필드 수정
            int affected = stReconRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 StRecon입니다: " + entity.getReconId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getReconId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<StRecon> rows) {
        /* 0단계: rowStatus 정규화 */
        for (StRecon row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getReconId() == null || row.getReconId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, StRecon::getReconId, "U", "reconId", this);
        CmUtil.requireRowIds(rows, StRecon::getReconId, "D", "reconId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(StRecon::getReconId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 정산 대사 (기대금액 vs 실제금액 불일치 관리) 조건별 삭제
            stReconRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<StRecon> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (StRecon row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 정산 대사 (기대금액 vs 실제금액 불일치 관리) 선택적 필드 수정
            int affected = stReconRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getReconId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<StRecon> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (StRecon row : insertRows) {
            row.setReconId(CmUtil.generateId("st_recon"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 정산 대사 (기대금액 vs 실제금액 불일치 관리) 저장
            stReconRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
