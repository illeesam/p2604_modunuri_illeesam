package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogTagDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogTag;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogTagRepository;
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
public class CmBlogTagService {

    private final CmBlogTagRepository cmBlogTagRepository;

    @PersistenceContext
    private EntityManager em;

    /* 게시물 태그 키조회 */
    public CmBlogTagDto.Item getById(String id) {
        CmBlogTagDto.Item dto = cmBlogTagRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmBlogTagDto.Item getByIdOrNull(String id) {
        return cmBlogTagRepository.selectById(id).orElse(null);
    }

    /* 게시물 태그 상세조회 */
    public CmBlogTag findById(String id) {
        return cmBlogTagRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmBlogTag findByIdOrNull(String id) {
        return cmBlogTagRepository.findById(id).orElse(null);
    }

    /* 게시물 태그 키검증 */
    public boolean existsById(String id) {
        return cmBlogTagRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!cmBlogTagRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 게시물 태그 목록조회 */
    public List<CmBlogTagDto.Item> getList(CmBlogTagDto.Request req) {
        return cmBlogTagRepository.selectList(req);
    }

    /* 게시물 태그 페이지조회 */
    public CmBlogTagDto.PageResponse getPageData(CmBlogTagDto.Request req) {
        PageHelper.addPaging(req);
        return cmBlogTagRepository.selectPageList(req);
    }

    /* 게시물 태그 등록 */
    @Transactional
    public CmBlogTag create(CmBlogTag body) {
        body.setBlogTagId(CmUtil.generateId("cm_blog_tag"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmBlogTag saved = cmBlogTagRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 게시물 태그 수정 */
    @Transactional
    public CmBlogTag update(String id, CmBlogTag body) {
        CmUtil.requireId(id, "id", this);
        CmBlogTag entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "blogTagId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmBlogTag saved = cmBlogTagRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 게시물 태그 수정 */
    @Transactional
    public CmBlogTag updateSelective(CmBlogTag entity) {
        if (entity.getBlogTagId() == null) throw new CmBizException("blogTagId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getBlogTagId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getBlogTagId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = cmBlogTagRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 게시물 태그 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        CmBlogTag entity = findById(id);
        cmBlogTagRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public CmBlogTag save(String cmd, CmBlogTag entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getBlogTagId() == null || entity.getBlogTagId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getBlogTagId() == null)
                    throw new CmBizException("삭제 대상 blogTagId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!cmBlogTagRepository.existsById(entity.getBlogTagId()))
                    throw new CmBizException("존재하지 않는 CmBlogTag입니다: " + entity.getBlogTagId() + "::" + CmUtil.svcCallerInfo(this));
                cmBlogTagRepository.deleteById(entity.getBlogTagId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setBlogTagId(CmUtil.generateId("cm_blog_tag"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                CmBlogTag saved = cmBlogTagRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getBlogTagId() == null)
                    throw new CmBizException("수정 대상 blogTagId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = cmBlogTagRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 CmBlogTag입니다: " + entity.getBlogTagId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getBlogTagId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<CmBlogTag> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (CmBlogTag row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getBlogTagId() == null || row.getBlogTagId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, CmBlogTag::getBlogTagId, "U", "blogTagId", this);
            CmUtil.requireRowIds(rows, CmBlogTag::getBlogTagId, "D", "blogTagId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(CmBlogTag::getBlogTagId)
                .toList();
            if (!deleteIds.isEmpty()) {
                cmBlogTagRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<CmBlogTag> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (CmBlogTag row : updateRows) {
                row.setUpdBy(authId);
                int affected = cmBlogTagRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getBlogTagId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<CmBlogTag> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (CmBlogTag row : insertRows) {
                row.setBlogTagId(CmUtil.generateId("cm_blog_tag"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                cmBlogTagRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
