package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSkuDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSku;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdSkuMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdSkuRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PdProdSkuService {

    private final PdProdSkuMapper pdProdSkuMapper;
    private final PdProdSkuRepository pdProdSkuRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public PdProdSkuDto getById(String id) {
        // pd_prod_sku :: select one :: id [orm:mybatis]
        PdProdSkuDto result = pdProdSkuMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<PdProdSkuDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_prod_sku :: select list :: p [orm:mybatis]
        List<PdProdSkuDto> result = pdProdSkuMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<PdProdSkuDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_prod_sku :: select page :: [orm:mybatis]
        return PageResult.of(pdProdSkuMapper.selectPageList(p), pdProdSkuMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(PdProdSku entity) {
        // pd_prod_sku :: update :: [orm:mybatis]
        int result = pdProdSkuMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdProdSku create(PdProdSku entity) {
        entity.setSkuId(CmUtil.generateId("pd_prod_sku"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_sku :: insert or update :: [orm:jpa]
        PdProdSku result = pdProdSkuRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public PdProdSku save(PdProdSku entity) {
        if (!pdProdSkuRepository.existsById(entity.getSkuId()))
            throw new CmBizException("존재하지 않는 PdProdSku입니다: " + entity.getSkuId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_sku :: insert or update :: [orm:jpa]
        PdProdSku result = pdProdSkuRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!pdProdSkuRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PdProdSku입니다: " + id);
        // pd_prod_sku :: delete :: id [orm:jpa]
        pdProdSkuRepository.deleteById(id);
    }
    /** saveList — 저장 */
    @Transactional
    public void saveList(List<PdProdSku> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PdProdSku row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setSkuId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pd_prod_sku"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pdProdSkuRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getSkuId(), "skuId must not be null");
                PdProdSku entity = pdProdSkuRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "skuId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pdProdSkuRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getSkuId(), "skuId must not be null");
                if (pdProdSkuRepository.existsById(id)) pdProdSkuRepository.deleteById(id);
            }
        }
    }
}