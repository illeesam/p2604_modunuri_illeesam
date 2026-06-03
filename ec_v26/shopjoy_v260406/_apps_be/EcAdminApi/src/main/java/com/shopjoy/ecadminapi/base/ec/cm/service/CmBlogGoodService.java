package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogGoodDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogGood;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogGoodRepository;
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
public class CmBlogGoodService {

    private final CmBlogGoodRepository cmBlogGoodRepository;

    @PersistenceContext
    private EntityManager em;

    /* 게시물 좋아요 키조회 */
    public CmBlogGoodDto.Item getById(String id) {
        CmBlogGoodDto.Item dto = cmBlogGoodRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmBlogGoodDto.Item getByIdOrNull(String id) {
        return cmBlogGoodRepository.selectById(id).orElse(null);
    }

    /* 게시물 좋아요 상세조회 */
    public CmBlogGood findById(String id) {
        return cmBlogGoodRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmBlogGood findByIdOrNull(String id) {
        return cmBlogGoodRepository.findById(id).orElse(null);
    }

    /* 게시물 좋아요 키검증 */
    public boolean existsById(String id) {
        return cmBlogGoodRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!cmBlogGoodRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 게시물 좋아요 목록조회 */
    public List<CmBlogGoodDto.Item> getList(CmBlogGoodDto.Request req) {
        return cmBlogGoodRepository.selectList(req);
    }

    /* 게시물 좋아요 페이지조회 */
    public CmBlogGoodDto.PageResponse getPageData(CmBlogGoodDto.Request req) {
        PageHelper.addPaging(req);
        return cmBlogGoodRepository.selectPageData(req);
    }

    /* 게시물 좋아요 등록 */
    @Transactional
    public CmBlogGood create(CmBlogGood body) {
        body.setLikeId(CmUtil.generateId("cm_blog_good"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmBlogGood saved = cmBlogGoodRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 게시물 좋아요 수정 */
    @Transactional
    public CmBlogGood update(String id, CmBlogGood body) {
        CmUtil.requireId(id, "id", this);
        CmBlogGood entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "likeId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmBlogGood saved = cmBlogGoodRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 게시물 좋아요 수정 */
    @Transactional
    public CmBlogGood updateSelective(CmBlogGood entity) {
        if (entity.getLikeId() == null) throw new CmBizException("likeId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getLikeId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getLikeId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = cmBlogGoodRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 게시물 좋아요 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        CmBlogGood entity = findById(id);
        cmBlogGoodRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public CmBlogGood saveOneBase(CmBlogGood entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getLikeId() == null || entity.getLikeId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getLikeId() == null)
                throw new CmBizException("삭제 대상 likeId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!cmBlogGoodRepository.existsById(entity.getLikeId()))
                throw new CmBizException("존재하지 않는 CmBlogGood입니다: " + entity.getLikeId() + "::" + CmUtil.svcCallerInfo(this));
            cmBlogGoodRepository.deleteById(entity.getLikeId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setLikeId(CmUtil.generateId("cm_blog_good"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            CmBlogGood saved = cmBlogGoodRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getLikeId() == null)
                throw new CmBizException("수정 대상 likeId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = cmBlogGoodRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 CmBlogGood입니다: " + entity.getLikeId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getLikeId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<CmBlogGood> rows) {
        /* 0단계: rowStatus 정규화 */
        for (CmBlogGood row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getLikeId() == null || row.getLikeId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, CmBlogGood::getLikeId, "U", "likeId", this);
        CmUtil.requireRowIds(rows, CmBlogGood::getLikeId, "D", "likeId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(CmBlogGood::getLikeId)
            .toList();
        if (!deleteIds.isEmpty()) {
            cmBlogGoodRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<CmBlogGood> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (CmBlogGood row : updateRows) {
            row.setUpdBy(authId);
            int affected = cmBlogGoodRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getLikeId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<CmBlogGood> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (CmBlogGood row : insertRows) {
            row.setLikeId(CmUtil.generateId("cm_blog_good"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            cmBlogGoodRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
