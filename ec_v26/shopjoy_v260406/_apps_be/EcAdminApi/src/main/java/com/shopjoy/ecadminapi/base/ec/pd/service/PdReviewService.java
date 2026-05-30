package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReview;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdReviewRepository;
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
public class PdReviewService {

    private final PdReviewRepository pdReviewRepository;

    @PersistenceContext
    private EntityManager em;

    /* 상품 리뷰 키조회 */
    public PdReviewDto.Item getById(String id) {
        PdReviewDto.Item dto = pdReviewRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdReviewDto.Item getByIdOrNull(String id) {
        return pdReviewRepository.selectById(id).orElse(null);
    }

    /* 상품 리뷰 상세조회 */
    public PdReview findById(String id) {
        return pdReviewRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdReview findByIdOrNull(String id) {
        return pdReviewRepository.findById(id).orElse(null);
    }

    /* 상품 리뷰 키검증 */
    public boolean existsById(String id) {
        return pdReviewRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdReviewRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 상품 리뷰 목록조회 */
    public List<PdReviewDto.Item> getList(PdReviewDto.Request req) {
        return pdReviewRepository.selectList(req);
    }

    /* 상품 리뷰 페이지조회 */
    public PdReviewDto.PageResponse getPageData(PdReviewDto.Request req) {
        PageHelper.addPaging(req);
        return pdReviewRepository.selectPageList(req);
    }

    /* 상품 리뷰 등록 */
    @Transactional
    public PdReview create(PdReview body) {
        body.setReviewId(CmUtil.generateId("pd_review"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdReview saved = pdReviewRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 상품 리뷰 수정 */
    @Transactional
    public PdReview update(String id, PdReview body) {
        CmUtil.requireId(id, "id", this);
        PdReview entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "reviewId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdReview saved = pdReviewRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 리뷰 수정 */
    @Transactional
    public PdReview updateSelective(PdReview entity) {
        if (entity.getReviewId() == null) throw new CmBizException("reviewId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getReviewId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getReviewId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdReviewRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 상품 리뷰 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PdReview entity = findById(id);
        pdReviewRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PdReview save(String cmd, PdReview entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getReviewId() == null || entity.getReviewId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getReviewId() == null)
                    throw new CmBizException("삭제 대상 reviewId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!pdReviewRepository.existsById(entity.getReviewId()))
                    throw new CmBizException("존재하지 않는 PdReview입니다: " + entity.getReviewId() + "::" + CmUtil.svcCallerInfo(this));
                pdReviewRepository.deleteById(entity.getReviewId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setReviewId(CmUtil.generateId("pd_review"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                PdReview saved = pdReviewRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getReviewId() == null)
                    throw new CmBizException("수정 대상 reviewId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = pdReviewRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 PdReview입니다: " + entity.getReviewId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getReviewId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<PdReview> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (PdReview row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getReviewId() == null || row.getReviewId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, PdReview::getReviewId, "U", "reviewId", this);
            CmUtil.requireRowIds(rows, PdReview::getReviewId, "D", "reviewId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(PdReview::getReviewId)
                .toList();
            if (!deleteIds.isEmpty()) {
                pdReviewRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<PdReview> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (PdReview row : updateRows) {
                row.setUpdBy(authId);
                int affected = pdReviewRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getReviewId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<PdReview> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (PdReview row : insertRows) {
                row.setReviewId(CmUtil.generateId("pd_review"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pdReviewRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
