package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogCateDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogCate;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogCateRepository;
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
public class CmBlogCateService {

    private final CmBlogCateRepository cmBlogCateRepository;

    @PersistenceContext
    private EntityManager em;

    /* 게시판 카테고리 키조회 */
    public CmBlogCateDto.Item getById(String id) {
        // [QueryDSL] 블로그 카테고리 단건 조회
        CmBlogCateDto.Item dto = cmBlogCateRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmBlogCateDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 블로그 카테고리 단건 조회
        return cmBlogCateRepository.selectById(id).orElse(null);
    }

    /* 게시판 카테고리 상세조회 */
    public CmBlogCate findById(String id) {
        // [쿼리 메서드] 블로그 카테고리 단건 조회
        return cmBlogCateRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmBlogCate findByIdOrNull(String id) {
        // [쿼리 메서드] 블로그 카테고리 단건 조회
        return cmBlogCateRepository.findById(id).orElse(null);
    }

    /* 게시판 카테고리 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 블로그 카테고리 존재 여부 확인
        return cmBlogCateRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 블로그 카테고리 존재 여부 확인
        if (!cmBlogCateRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 게시판 카테고리 목록조회 */
    public List<CmBlogCateDto.Item> getList(CmBlogCateDto.Request req) {
        // [QueryDSL] 블로그 카테고리 목록 조회
        return cmBlogCateRepository.selectList(req);
    }

    /* 게시판 카테고리 페이지조회 */
    public BasePage<CmBlogCateDto.Item> getPageData(CmBlogCateDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 블로그 카테고리 페이지 조회
        return cmBlogCateRepository.selectPageData(req);
    }

    /* 게시판 카테고리 등록 */
    @Transactional
    public CmBlogCate create(CmBlogCate body) {
        body.setBlogCateId(CmUtil.generateId("cm_blog_cate"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 블로그 카테고리 저장
        CmBlogCate saved = cmBlogCateRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 게시판 카테고리 수정 */
    @Transactional
    public CmBlogCate update(String id, CmBlogCate body) {
        CmUtil.requireId(id, "id", this);
        CmBlogCate entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "blogCateId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 블로그 카테고리 저장
        CmBlogCate saved = cmBlogCateRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 게시판 카테고리 수정 */
    @Transactional
    public CmBlogCate updateSelective(CmBlogCate entity) {
        if (entity.getBlogCateId() == null) throw new CmBizException("blogCateId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getBlogCateId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getBlogCateId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 블로그 카테고리 선택적 필드 수정
        int affected = cmBlogCateRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 게시판 카테고리 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        CmBlogCate entity = findById(id);
        // [쿼리 메서드] 블로그 카테고리 삭제
        cmBlogCateRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public CmBlogCate saveOneBase(CmBlogCate entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getBlogCateId());

        if ("D".equals(rowStatus)) {
            if (entity.getBlogCateId() == null)
                throw new CmBizException("삭제 대상 blogCateId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 블로그 카테고리 존재 여부 확인
            if (!cmBlogCateRepository.existsById(entity.getBlogCateId()))
                throw new CmBizException("존재하지 않는 CmBlogCate입니다: " + entity.getBlogCateId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 블로그 카테고리 ID 기준 삭제
            cmBlogCateRepository.deleteById(entity.getBlogCateId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setBlogCateId(CmUtil.generateId("cm_blog_cate"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 블로그 카테고리 저장
            CmBlogCate saved = cmBlogCateRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getBlogCateId() == null)
                throw new CmBizException("수정 대상 blogCateId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 블로그 카테고리 선택적 필드 수정
            int affected = cmBlogCateRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 CmBlogCate입니다: " + entity.getBlogCateId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getBlogCateId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<CmBlogCate> rows) {
        /* 0단계: rowStatus 정규화 */
        for (CmBlogCate row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getBlogCateId() == null || row.getBlogCateId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, CmBlogCate::getBlogCateId, "U", "blogCateId", this);
        CmUtil.requireRowIds(rows, CmBlogCate::getBlogCateId, "D", "blogCateId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(CmBlogCate::getBlogCateId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 블로그 카테고리 조건별 삭제
            cmBlogCateRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<CmBlogCate> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (CmBlogCate row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 블로그 카테고리 선택적 필드 수정
            int affected = cmBlogCateRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getBlogCateId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<CmBlogCate> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (CmBlogCate row : insertRows) {
            row.setBlogCateId(CmUtil.generateId("cm_blog_cate"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 블로그 카테고리 저장
            cmBlogCateRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
