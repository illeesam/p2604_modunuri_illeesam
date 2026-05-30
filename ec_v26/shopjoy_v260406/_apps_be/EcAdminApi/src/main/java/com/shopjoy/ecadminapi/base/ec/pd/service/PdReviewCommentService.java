package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewCommentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewComment;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdReviewCommentRepository;
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
public class PdReviewCommentService {

    private final PdReviewCommentRepository pdReviewCommentRepository;

    @PersistenceContext
    private EntityManager em;

    /* 리뷰 댓글 키조회 */
    public PdReviewCommentDto.Item getById(String id) {
        PdReviewCommentDto.Item dto = pdReviewCommentRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdReviewCommentDto.Item getByIdOrNull(String id) {
        return pdReviewCommentRepository.selectById(id).orElse(null);
    }

    /* 리뷰 댓글 상세조회 */
    public PdReviewComment findById(String id) {
        return pdReviewCommentRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdReviewComment findByIdOrNull(String id) {
        return pdReviewCommentRepository.findById(id).orElse(null);
    }

    /* 리뷰 댓글 키검증 */
    public boolean existsById(String id) {
        return pdReviewCommentRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdReviewCommentRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 리뷰 댓글 목록조회 */
    public List<PdReviewCommentDto.Item> getList(PdReviewCommentDto.Request req) {
        return pdReviewCommentRepository.selectList(req);
    }

    /* 리뷰 댓글 페이지조회 */
    public PdReviewCommentDto.PageResponse getPageData(PdReviewCommentDto.Request req) {
        PageHelper.addPaging(req);
        return pdReviewCommentRepository.selectPageList(req);
    }

    /* 리뷰 댓글 등록 */
    @Transactional
    public PdReviewComment create(PdReviewComment body) {
        body.setReviewCommentId(CmUtil.generateId("pd_review_comment"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdReviewComment saved = pdReviewCommentRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 리뷰 댓글 수정 */
    @Transactional
    public PdReviewComment update(String id, PdReviewComment body) {
        CmUtil.requireId(id, "id", this);
        PdReviewComment entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "reviewCommentId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdReviewComment saved = pdReviewCommentRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 리뷰 댓글 수정 */
    @Transactional
    public PdReviewComment updateSelective(PdReviewComment entity) {
        if (entity.getReviewCommentId() == null) throw new CmBizException("reviewCommentId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getReviewCommentId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getReviewCommentId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdReviewCommentRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 리뷰 댓글 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PdReviewComment entity = findById(id);
        pdReviewCommentRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PdReviewComment save(String cmd, PdReviewComment entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getReviewCommentId() == null || entity.getReviewCommentId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getReviewCommentId() == null)
                    throw new CmBizException("삭제 대상 reviewCommentId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!pdReviewCommentRepository.existsById(entity.getReviewCommentId()))
                    throw new CmBizException("존재하지 않는 PdReviewComment입니다: " + entity.getReviewCommentId() + "::" + CmUtil.svcCallerInfo(this));
                pdReviewCommentRepository.deleteById(entity.getReviewCommentId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setReviewCommentId(CmUtil.generateId("pd_review_comment"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                PdReviewComment saved = pdReviewCommentRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getReviewCommentId() == null)
                    throw new CmBizException("수정 대상 reviewCommentId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = pdReviewCommentRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 PdReviewComment입니다: " + entity.getReviewCommentId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getReviewCommentId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<PdReviewComment> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (PdReviewComment row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getReviewCommentId() == null || row.getReviewCommentId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, PdReviewComment::getReviewCommentId, "U", "reviewCommentId", this);
            CmUtil.requireRowIds(rows, PdReviewComment::getReviewCommentId, "D", "reviewCommentId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(PdReviewComment::getReviewCommentId)
                .toList();
            if (!deleteIds.isEmpty()) {
                pdReviewCommentRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<PdReviewComment> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (PdReviewComment row : updateRows) {
                row.setUpdBy(authId);
                int affected = pdReviewCommentRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getReviewCommentId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<PdReviewComment> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (PdReviewComment row : insertRows) {
                row.setReviewCommentId(CmUtil.generateId("pd_review_comment"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pdReviewCommentRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
