package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogFileDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogFile;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogFileRepository;
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
public class CmBlogFileService {

    private final CmBlogFileRepository cmBlogFileRepository;

    @PersistenceContext
    private EntityManager em;

    /* 게시물 첨부파일 키조회 */
    public CmBlogFileDto.Item getById(String id) {
        CmBlogFileDto.Item dto = cmBlogFileRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmBlogFileDto.Item getByIdOrNull(String id) {
        return cmBlogFileRepository.selectById(id).orElse(null);
    }

    /* 게시물 첨부파일 상세조회 */
    public CmBlogFile findById(String id) {
        return cmBlogFileRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmBlogFile findByIdOrNull(String id) {
        return cmBlogFileRepository.findById(id).orElse(null);
    }

    /* 게시물 첨부파일 키검증 */
    public boolean existsById(String id) {
        return cmBlogFileRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!cmBlogFileRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 게시물 첨부파일 목록조회 */
    public List<CmBlogFileDto.Item> getList(CmBlogFileDto.Request req) {
        return cmBlogFileRepository.selectList(req);
    }

    /* 게시물 첨부파일 페이지조회 */
    public CmBlogFileDto.PageResponse getPageData(CmBlogFileDto.Request req) {
        PageHelper.addPaging(req);
        return cmBlogFileRepository.selectPageData(req);
    }

    /* 게시물 첨부파일 등록 */
    @Transactional
    public CmBlogFile create(CmBlogFile body) {
        body.setBlogImgId(CmUtil.generateId("cm_blog_file"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmBlogFile saved = cmBlogFileRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 게시물 첨부파일 수정 */
    @Transactional
    public CmBlogFile update(String id, CmBlogFile body) {
        CmUtil.requireId(id, "id", this);
        CmBlogFile entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "blogImgId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmBlogFile saved = cmBlogFileRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 게시물 첨부파일 수정 */
    @Transactional
    public CmBlogFile updateSelective(CmBlogFile entity) {
        if (entity.getBlogImgId() == null) throw new CmBizException("blogImgId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getBlogImgId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getBlogImgId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = cmBlogFileRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 게시물 첨부파일 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        CmBlogFile entity = findById(id);
        cmBlogFileRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public CmBlogFile saveOneBase(CmBlogFile entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getBlogImgId() == null || entity.getBlogImgId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getBlogImgId() == null)
                throw new CmBizException("삭제 대상 blogImgId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!cmBlogFileRepository.existsById(entity.getBlogImgId()))
                throw new CmBizException("존재하지 않는 CmBlogFile입니다: " + entity.getBlogImgId() + "::" + CmUtil.svcCallerInfo(this));
            cmBlogFileRepository.deleteById(entity.getBlogImgId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setBlogImgId(CmUtil.generateId("cm_blog_file"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            CmBlogFile saved = cmBlogFileRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getBlogImgId() == null)
                throw new CmBizException("수정 대상 blogImgId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = cmBlogFileRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 CmBlogFile입니다: " + entity.getBlogImgId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getBlogImgId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<CmBlogFile> rows) {
        /* 0단계: rowStatus 정규화 */
        for (CmBlogFile row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getBlogImgId() == null || row.getBlogImgId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, CmBlogFile::getBlogImgId, "U", "blogImgId", this);
        CmUtil.requireRowIds(rows, CmBlogFile::getBlogImgId, "D", "blogImgId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(CmBlogFile::getBlogImgId)
            .toList();
        if (!deleteIds.isEmpty()) {
            cmBlogFileRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<CmBlogFile> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (CmBlogFile row : updateRows) {
            row.setUpdBy(authId);
            int affected = cmBlogFileRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getBlogImgId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<CmBlogFile> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (CmBlogFile row : insertRows) {
            row.setBlogImgId(CmUtil.generateId("cm_blog_file"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            cmBlogFileRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
