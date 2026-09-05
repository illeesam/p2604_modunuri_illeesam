package com.shopjoy.ecBeBo.base.ec.od.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdhClaimChgHistDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdhClaimChgHist;
import com.shopjoy.ecBeBo.base.ec.od.repository.OdhClaimChgHistRepository;
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
public class OdhClaimChgHistService {

    private final OdhClaimChgHistRepository odhClaimChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 클레임 변경 이력 키조회 */
    public OdhClaimChgHistDto.Item getById(String id) {
        // [QueryDSL] 클레임 변경 이력 단건 조회
        OdhClaimChgHistDto.Item dto = odhClaimChgHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhClaimChgHistDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 클레임 변경 이력 단건 조회
        return odhClaimChgHistRepository.selectById(id).orElse(null);
    }

    /* 클레임 변경 이력 상세조회 */
    public OdhClaimChgHist findById(String id) {
        // [쿼리 메서드] 클레임 변경 이력 단건 조회
        return odhClaimChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhClaimChgHist findByIdOrNull(String id) {
        // [쿼리 메서드] 클레임 변경 이력 단건 조회
        return odhClaimChgHistRepository.findById(id).orElse(null);
    }

    /* 클레임 변경 이력 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 클레임 변경 이력 존재 여부 확인
        return odhClaimChgHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 클레임 변경 이력 존재 여부 확인
        if (!odhClaimChgHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 클레임 변경 이력 목록조회 */
    public List<OdhClaimChgHistDto.Item> getList(OdhClaimChgHistDto.Request req) {
        // [QueryDSL] 클레임 변경 이력 목록 조회
        return odhClaimChgHistRepository.selectList(req);
    }

    /* 클레임 변경 이력 페이지조회 */
    public BasePage<OdhClaimChgHistDto.Item> getPageData(OdhClaimChgHistDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 클레임 변경 이력 페이지 조회
        return odhClaimChgHistRepository.selectPageData(req);
    }

    /* 클레임 변경 이력 등록 */
    @Transactional
    public OdhClaimChgHist create(OdhClaimChgHist body) {
        body.setClaimChgHistId(CmUtil.generateId("odh_claim_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 클레임 변경 이력 저장
        OdhClaimChgHist saved = odhClaimChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 클레임 변경 이력 수정 */
    @Transactional
    public OdhClaimChgHist update(String id, OdhClaimChgHist body) {
        CmUtil.requireId(id, "id", this);
        OdhClaimChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "claimChgHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 클레임 변경 이력 저장
        OdhClaimChgHist saved = odhClaimChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 클레임 변경 이력 수정 */
    @Transactional
    public OdhClaimChgHist updateSelective(OdhClaimChgHist entity) {
        if (entity.getClaimChgHistId() == null) throw new CmBizException("claimChgHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getClaimChgHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getClaimChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 클레임 변경 이력 선택적 필드 수정
        int affected = odhClaimChgHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 클레임 변경 이력 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        OdhClaimChgHist entity = findById(id);
        // [쿼리 메서드] 클레임 변경 이력 삭제
        odhClaimChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public OdhClaimChgHist saveOneBase(OdhClaimChgHist entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getClaimChgHistId());

        if ("D".equals(rowStatus)) {
            if (entity.getClaimChgHistId() == null)
                throw new CmBizException("삭제 대상 claimChgHistId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 클레임 변경 이력 존재 여부 확인
            if (!odhClaimChgHistRepository.existsById(entity.getClaimChgHistId()))
                throw new CmBizException("존재하지 않는 OdhClaimChgHist입니다: " + entity.getClaimChgHistId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 클레임 변경 이력 ID 기준 삭제
            odhClaimChgHistRepository.deleteById(entity.getClaimChgHistId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setClaimChgHistId(CmUtil.generateId("odh_claim_chg_hist"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 클레임 변경 이력 저장
            OdhClaimChgHist saved = odhClaimChgHistRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getClaimChgHistId() == null)
                throw new CmBizException("수정 대상 claimChgHistId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 클레임 변경 이력 선택적 필드 수정
            int affected = odhClaimChgHistRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 OdhClaimChgHist입니다: " + entity.getClaimChgHistId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getClaimChgHistId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<OdhClaimChgHist> rows) {
        /* 0단계: rowStatus 정규화 */
        for (OdhClaimChgHist row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getClaimChgHistId() == null || row.getClaimChgHistId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, OdhClaimChgHist::getClaimChgHistId, "U", "claimChgHistId", this);
        CmUtil.requireRowIds(rows, OdhClaimChgHist::getClaimChgHistId, "D", "claimChgHistId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(OdhClaimChgHist::getClaimChgHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 클레임 변경 이력 조건별 삭제
            odhClaimChgHistRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<OdhClaimChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (OdhClaimChgHist row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 클레임 변경 이력 선택적 필드 수정
            int affected = odhClaimChgHistRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getClaimChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<OdhClaimChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhClaimChgHist row : insertRows) {
            row.setClaimChgHistId(CmUtil.generateId("odh_claim_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 클레임 변경 이력 저장
            odhClaimChgHistRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
