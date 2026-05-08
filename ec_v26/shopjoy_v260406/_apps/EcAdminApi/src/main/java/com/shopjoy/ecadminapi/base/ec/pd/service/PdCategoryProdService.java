package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategoryProd;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdCategoryProdMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdCategoryProdRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import com.shopjoy.ecadminapi.co.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PdCategoryProdService {


    private final PdCategoryProdMapper pdCategoryProdMapper;
    private final PdCategoryProdRepository pdCategoryProdRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public PdCategoryProdDto getById(String id) {
        // pd_category_prod :: select one :: id [orm:mybatis]
        PdCategoryProdDto result = pdCategoryProdMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<PdCategoryProdDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_category_prod :: select list :: p [orm:mybatis]
        List<PdCategoryProdDto> result = pdCategoryProdMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<PdCategoryProdDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_category_prod :: select page :: [orm:mybatis]
        return PageResult.of(pdCategoryProdMapper.selectPageList(p), pdCategoryProdMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(PdCategoryProd entity) {
        // pd_category_prod :: update :: [orm:mybatis]
        int result = pdCategoryProdMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdCategoryProd create(PdCategoryProd entity) {
        entity.setCategoryProdId(CmUtil.generateId("pd_category_prod"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_category_prod :: insert or update :: [orm:jpa]
        PdCategoryProd result = pdCategoryProdRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public PdCategoryProd save(PdCategoryProd entity) {
        if (!pdCategoryProdRepository.existsById(entity.getCategoryProdId()))
            throw new CmBizException("존재하지 않는 PdCategoryProd입니다: " + entity.getCategoryProdId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_category_prod :: insert or update :: [orm:jpa]
        PdCategoryProd result = pdCategoryProdRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!pdCategoryProdRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PdCategoryProd입니다: " + id);
        // pd_category_prod :: delete :: id [orm:jpa]
        pdCategoryProdRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<PdCategoryProd> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PdCategoryProd row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setCategoryProdId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pd_category_prod"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pdCategoryProdRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getCategoryProdId(), "categoryProdId must not be null");
                PdCategoryProd entity = pdCategoryProdRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "categoryProdId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pdCategoryProdRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getCategoryProdId(), "categoryProdId must not be null");
                if (pdCategoryProdRepository.existsById(id)) pdCategoryProdRepository.deleteById(id);
            }
        }
    }
}