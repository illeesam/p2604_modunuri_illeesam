package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBltnCateDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.vo.CmBltnCateReq;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltnCate;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBltnCateMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBltnCateRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CmBltnCateService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final CmBltnCateMapper mapper;
    private final CmBltnCateRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CmBltnCateDto getById(String id) {
        CmBltnCateDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<CmBltnCateDto> getList(Map<String, Object> p) {
        List<CmBltnCateDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<CmBltnCateDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<CmBltnCateDto> pageList = mapper.selectPageList(p);
        PageResult<CmBltnCateDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(CmBltnCate entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public CmBltnCate create(CmBltnCate entity) {
        entity.setBlogCateId(generateId());
        entity.setRegBy(SecurityUtil.currentUserId());
        entity.setRegDate(LocalDateTime.now());
        CmBltnCate result = repository.save(entity);
        return result;
    }

    @Transactional
    public CmBltnCate save(CmBltnCate entity) {
        if (!repository.existsById(entity.getBlogCateId())) {
            throw new CmBizException("존재하지 않는 카테고리입니다: " + entity.getBlogCateId());
        }
        entity.setUpdBy(SecurityUtil.currentUserId());
        entity.setUpdDate(LocalDateTime.now());
        CmBltnCate result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id)) {
            throw new CmBizException("존재하지 않는 카테고리입니다: " + id);
        }
        repository.deleteById(id);
    }

    // ── _row_status 기반 저장 ────────────────────────────────────

    @Transactional
    public CmBltnCate saveByRowStatus(CmBltnCateReq req) {
        CmBltnCate result = doSaveByRowStatus(req);
        return result;
    }

    // D → U → I 순서로 처리: 삭제 후 수정, 마지막에 신규 등록하여 유니크 제약 충돌 방지
    @Transactional
    public List<CmBltnCate> saveListByRowStatus(List<CmBltnCateReq> list) {
        List<CmBltnCate> result = new ArrayList<>();
        for (CmBltnCateReq req : list.stream().filter(r -> "D".equals(r.getRowStatus())).toList()) result.add(doSaveByRowStatus(req));
        for (CmBltnCateReq req : list.stream().filter(r -> "U".equals(r.getRowStatus())).toList()) result.add(doSaveByRowStatus(req));
        for (CmBltnCateReq req : list.stream().filter(r -> "I".equals(r.getRowStatus())).toList()) result.add(doSaveByRowStatus(req));
        return result;
    }

    private CmBltnCate doSaveByRowStatus(CmBltnCateReq req) {
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
     *   cm_bltn_cate       → BL(bltn) + C(cate)            = BLC
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
