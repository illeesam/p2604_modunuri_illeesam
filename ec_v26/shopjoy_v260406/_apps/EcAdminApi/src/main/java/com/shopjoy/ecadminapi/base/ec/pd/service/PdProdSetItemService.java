package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSetItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSetItem;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdSetItemMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdSetItemRepository;
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
public class PdProdSetItemService {

    private final PdProdSetItemMapper pdProdSetItemMapper;
    private final PdProdSetItemRepository pdProdSetItemRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdProdSetItemDto getById(String id) {
        // pd_prod_set_item :: select one :: id [orm:mybatis]
        PdProdSetItemDto result = pdProdSetItemMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<PdProdSetItemDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_prod_set_item :: select list :: p [orm:mybatis]
        List<PdProdSetItemDto> result = pdProdSetItemMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<PdProdSetItemDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_prod_set_item :: select page :: [orm:mybatis]
        return PageResult.of(pdProdSetItemMapper.selectPageList(p), pdProdSetItemMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(PdProdSetItem entity) {
        // pd_prod_set_item :: update :: [orm:mybatis]
        int result = pdProdSetItemMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdProdSetItem create(PdProdSetItem entity) {
        entity.setSetItemId(CmUtil.generateId("pd_prod_set_item"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_set_item :: insert or update :: [orm:jpa]
        PdProdSetItem result = pdProdSetItemRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public PdProdSetItem save(PdProdSetItem entity) {
        if (!pdProdSetItemRepository.existsById(entity.getSetItemId()))
            throw new CmBizException("존재하지 않는 PdProdSetItem입니다: " + entity.getSetItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_set_item :: insert or update :: [orm:jpa]
        PdProdSetItem result = pdProdSetItemRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!pdProdSetItemRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PdProdSetItem입니다: " + id);
        // pd_prod_set_item :: delete :: id [orm:jpa]
        pdProdSetItemRepository.deleteById(id);
    }
    /** saveList — 저장 */
    @Transactional
    public void saveList(List<PdProdSetItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PdProdSetItem row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setSetItemId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pd_prod_set_item"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pdProdSetItemRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getSetItemId(), "setItemId must not be null");
                PdProdSetItem entity = pdProdSetItemRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "setItemId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pdProdSetItemRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getSetItemId(), "setItemId must not be null");
                if (pdProdSetItemRepository.existsById(id)) pdProdSetItemRepository.deleteById(id);
            }
        }
    }
}