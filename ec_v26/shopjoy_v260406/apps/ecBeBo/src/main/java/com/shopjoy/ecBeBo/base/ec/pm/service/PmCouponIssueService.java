package com.shopjoy.ecBeBo.base.ec.pm.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmCouponIssueDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmCouponIssue;
import com.shopjoy.ecBeBo.base.ec.pm.repository.PmCouponIssueRepository;
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
public class PmCouponIssueService {

    private final PmCouponIssueRepository pmCouponIssueRepository;

    @PersistenceContext
    private EntityManager em;

    /* 쿠폰 발행 키조회 */
    public PmCouponIssueDto.Item getById(String id) {
        // [QueryDSL] 쿠폰 발급 단건 조회
        PmCouponIssueDto.Item dto = pmCouponIssueRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmCouponIssueDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 쿠폰 발급 단건 조회
        return pmCouponIssueRepository.selectById(id).orElse(null);
    }

    /* 쿠폰 발행 상세조회 */
    public PmCouponIssue findById(String id) {
        // [쿼리 메서드] 쿠폰 발급 단건 조회
        return pmCouponIssueRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmCouponIssue findByIdOrNull(String id) {
        // [쿼리 메서드] 쿠폰 발급 단건 조회
        return pmCouponIssueRepository.findById(id).orElse(null);
    }

    /* 쿠폰 발행 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 쿠폰 발급 존재 여부 확인
        return pmCouponIssueRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 쿠폰 발급 존재 여부 확인
        if (!pmCouponIssueRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 쿠폰 발행 목록조회 */
    public List<PmCouponIssueDto.Item> getList(PmCouponIssueDto.Request req) {
        // [QueryDSL] 쿠폰 발급 목록 조회
        return pmCouponIssueRepository.selectList(req);
    }

    /* 쿠폰 발행 페이지조회 */
    public BasePage<PmCouponIssueDto.Item> getPageData(PmCouponIssueDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 쿠폰 발급 페이지 조회
        return pmCouponIssueRepository.selectPageData(req);
    }

    /* 쿠폰 발행 등록 */
    @Transactional
    public PmCouponIssue create(PmCouponIssue body) {
        body.setCouponIssueId(CmUtil.generateId("pm_coupon_issue"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 쿠폰 발급 저장
        PmCouponIssue saved = pmCouponIssueRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 쿠폰 발행 수정 */
    @Transactional
    public PmCouponIssue update(String id, PmCouponIssue body) {
        CmUtil.requireId(id, "id", this);
        PmCouponIssue entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "couponIssueId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 쿠폰 발급 저장
        PmCouponIssue saved = pmCouponIssueRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 쿠폰 발행 수정 */
    @Transactional
    public PmCouponIssue updateSelective(PmCouponIssue entity) {
        if (entity.getCouponIssueId() == null) throw new CmBizException("couponIssueId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getCouponIssueId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getCouponIssueId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 쿠폰 발급 선택적 필드 수정
        int affected = pmCouponIssueRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 쿠폰 발행 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PmCouponIssue entity = findById(id);
        // [쿼리 메서드] 쿠폰 발급 삭제
        pmCouponIssueRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PmCouponIssue saveOneBase(PmCouponIssue entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getCouponIssueId());

        if ("D".equals(rowStatus)) {
            if (entity.getCouponIssueId() == null)
                throw new CmBizException("삭제 대상 couponIssueId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 쿠폰 발급 존재 여부 확인
            if (!pmCouponIssueRepository.existsById(entity.getCouponIssueId()))
                throw new CmBizException("존재하지 않는 PmCouponIssue입니다: " + entity.getCouponIssueId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 쿠폰 발급 ID 기준 삭제
            pmCouponIssueRepository.deleteById(entity.getCouponIssueId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setCouponIssueId(CmUtil.generateId("pm_coupon_issue"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 쿠폰 발급 저장
            PmCouponIssue saved = pmCouponIssueRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getCouponIssueId() == null)
                throw new CmBizException("수정 대상 couponIssueId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 쿠폰 발급 선택적 필드 수정
            int affected = pmCouponIssueRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PmCouponIssue입니다: " + entity.getCouponIssueId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getCouponIssueId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PmCouponIssue> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PmCouponIssue row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getCouponIssueId() == null || row.getCouponIssueId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PmCouponIssue::getCouponIssueId, "U", "couponIssueId", this);
        CmUtil.requireRowIds(rows, PmCouponIssue::getCouponIssueId, "D", "couponIssueId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PmCouponIssue::getCouponIssueId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 쿠폰 발급 조건별 삭제
            pmCouponIssueRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PmCouponIssue> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PmCouponIssue row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 쿠폰 발급 선택적 필드 수정
            int affected = pmCouponIssueRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getCouponIssueId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PmCouponIssue> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmCouponIssue row : insertRows) {
            row.setCouponIssueId(CmUtil.generateId("pm_coupon_issue"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 쿠폰 발급 저장
            pmCouponIssueRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
