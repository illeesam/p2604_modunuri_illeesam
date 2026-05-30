package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogReplyDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogReply;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogReplyRepository;
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
public class CmBlogReplyService {

    private final CmBlogReplyRepository cmBlogReplyRepository;

    @PersistenceContext
    private EntityManager em;

    /* 게시물 댓글 키조회 */
    public CmBlogReplyDto.Item getById(String id) {
        CmBlogReplyDto.Item dto = cmBlogReplyRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmBlogReplyDto.Item getByIdOrNull(String id) {
        return cmBlogReplyRepository.selectById(id).orElse(null);
    }

    /* 게시물 댓글 상세조회 */
    public CmBlogReply findById(String id) {
        return cmBlogReplyRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmBlogReply findByIdOrNull(String id) {
        return cmBlogReplyRepository.findById(id).orElse(null);
    }

    /* 게시물 댓글 키검증 */
    public boolean existsById(String id) {
        return cmBlogReplyRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!cmBlogReplyRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 게시물 댓글 목록조회 */
    public List<CmBlogReplyDto.Item> getList(CmBlogReplyDto.Request req) {
        return cmBlogReplyRepository.selectList(req);
    }

    /* 게시물 댓글 페이지조회 */
    public CmBlogReplyDto.PageResponse getPageData(CmBlogReplyDto.Request req) {
        PageHelper.addPaging(req);
        return cmBlogReplyRepository.selectPageList(req);
    }

    /* 게시물 댓글 등록 */
    @Transactional
    public CmBlogReply create(CmBlogReply body) {
        body.setCommentId(CmUtil.generateId("cm_blog_reply"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmBlogReply saved = cmBlogReplyRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 게시물 댓글 수정 */
    @Transactional
    public CmBlogReply update(String id, CmBlogReply body) {
        CmUtil.requireId(id, "id", this);
        CmBlogReply entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "commentId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmBlogReply saved = cmBlogReplyRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 게시물 댓글 수정 */
    @Transactional
    public CmBlogReply updateSelective(CmBlogReply entity) {
        if (entity.getCommentId() == null) throw new CmBizException("commentId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getCommentId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getCommentId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = cmBlogReplyRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 게시물 댓글 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        CmBlogReply entity = findById(id);
        cmBlogReplyRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public CmBlogReply save(String cmd, CmBlogReply entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getCommentId() == null || entity.getCommentId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getCommentId() == null)
                    throw new CmBizException("삭제 대상 commentId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!cmBlogReplyRepository.existsById(entity.getCommentId()))
                    throw new CmBizException("존재하지 않는 CmBlogReply입니다: " + entity.getCommentId() + "::" + CmUtil.svcCallerInfo(this));
                cmBlogReplyRepository.deleteById(entity.getCommentId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setCommentId(CmUtil.generateId("cm_blog_reply"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                CmBlogReply saved = cmBlogReplyRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getCommentId() == null)
                    throw new CmBizException("수정 대상 commentId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = cmBlogReplyRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 CmBlogReply입니다: " + entity.getCommentId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getCommentId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<CmBlogReply> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (CmBlogReply row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getCommentId() == null || row.getCommentId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, CmBlogReply::getCommentId, "U", "commentId", this);
            CmUtil.requireRowIds(rows, CmBlogReply::getCommentId, "D", "commentId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(CmBlogReply::getCommentId)
                .toList();
            if (!deleteIds.isEmpty()) {
                cmBlogReplyRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<CmBlogReply> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (CmBlogReply row : updateRows) {
                row.setUpdBy(authId);
                int affected = cmBlogReplyRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getCommentId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<CmBlogReply> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (CmBlogReply row : insertRows) {
                row.setCommentId(CmUtil.generateId("cm_blog_reply"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                cmBlogReplyRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
