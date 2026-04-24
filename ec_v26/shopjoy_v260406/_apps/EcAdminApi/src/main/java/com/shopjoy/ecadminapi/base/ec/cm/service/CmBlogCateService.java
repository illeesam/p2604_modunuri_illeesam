package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogCateDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.vo.CmBlogCateReq;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogCate;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBlogCateMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogCateRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class CmBlogCateService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final CmBlogCateMapper mapper;
    private final CmBlogCateRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CmBlogCateDto getById(String id) {
        // cm_blog_cate :: select one :: id [orm:mybatis]
        CmBlogCateDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<CmBlogCateDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // cm_blog_cate :: select list :: p [orm:mybatis]
        List<CmBlogCateDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<CmBlogCateDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // cm_blog_cate :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(CmBlogCate entity) {
        // cm_blog_cate :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public CmBlogCate create(CmBlogCate entity) {
        entity.setBlogCateId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        // cm_blog_cate :: insert or update :: [orm:jpa]
        CmBlogCate result = repository.save(entity);
        return result;
    }

    @Transactional
    public CmBlogCate save(CmBlogCate entity) {
        if (!repository.existsById(entity.getBlogCateId())) {
            throw new CmBizException("존재하지 않는 카테고리입니다: " + entity.getBlogCateId());
        }
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_blog_cate :: insert or update :: [orm:jpa]
        CmBlogCate result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id)) {
            throw new CmBizException("존재하지 않는 카테고리입니다: " + id);
        }
        // cm_blog_cate :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    // ── _row_status 기반 저장 ────────────────────────────────────

    @Transactional
    public CmBlogCate saveByRowStatus(CmBlogCateReq req) {
        CmBlogCate result = doSaveByRowStatus(req);
        return result;
    }

    // D → U → I 순서로 처리: 삭제 후 수정, 마지막에 신규 등록하여 유니크 제약 충돌 방지
    @Transactional
    public List<CmBlogCate> saveListByRowStatus(List<CmBlogCateReq> list) {
        List<CmBlogCate> result = new ArrayList<>();
        for (CmBlogCateReq req : list.stream().filter(r -> "D".equals(r.getRowStatus())).toList()) result.add(doSaveByRowStatus(req));
        for (CmBlogCateReq req : list.stream().filter(r -> "U".equals(r.getRowStatus())).toList()) result.add(doSaveByRowStatus(req));
        for (CmBlogCateReq req : list.stream().filter(r -> "I".equals(r.getRowStatus())).toList()) result.add(doSaveByRowStatus(req));
        return result;
    }

    private CmBlogCate doSaveByRowStatus(CmBlogCateReq req) {
        return switch (req.getRowStatus()) {
            case "I" -> create(req.toEntity());
            case "U" -> {
                if (!repository.existsById(req.getBlogCateId()))
                    throw new CmBizException("존재하지 않는 카테고리입니다: " + req.getBlogCateId());
                yield save(req.toEntity());
            }
            case "D" -> {
                if (!repository.existsById(req.getBlogCateId()))
                    throw new CmBizException("존재하지 않는 카테고리입니다: " + req.getBlogCateId());
                // cm_blog_cate :: delete :: blogCateId [orm:jpa]
                repository.deleteById(req.getBlogCateId());
                yield null;
            }
            default -> throw new CmBizException("올바르지 않은 _row_status: " + req.getRowStatus());
        };
    }

    /**
     * ID 생성 규칙: {테이블prefix}{yyMMddHHmmss}{rand4}
     *
     * 테이블 prefix 산출 방법 (도메인 세그먼트 제외, 대문자):
     *   1. 첫 번째 세그먼트(도메인: cm/od/sy 등) 제외
     *   2. 두 번째 세그먼트(엔티티명) 앞 2자
     *   3. 세 번째 이후 세그먼트의 첫 글자
     *
     * 예시:
     *   cm_blog_cate       → BL(blog) + C(cate)            = BLC
     *   cm_order_item_hist → OR(order) + I(item) + H(hist)  = ORIH
     *   od_order           → OR(order)                      = OR
     *   od_order_item      → OR(order) + I(item)            = ORI
     */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int) (Math.random() * 10000));
        return "BLC" + ts + rand;
    }
}
