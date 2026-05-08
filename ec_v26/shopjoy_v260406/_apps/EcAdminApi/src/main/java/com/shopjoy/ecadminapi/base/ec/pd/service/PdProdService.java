package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdRepository;
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
public class PdProdService {

    private final PdProdMapper pdProdMapper;
    private final PdProdRepository pdProdRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public PdProdDto getById(String id) {
        // pd_prod :: select one :: id [orm:mybatis]
        PdProdDto result = pdProdMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<PdProdDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_prod :: select list :: p [orm:mybatis]
        List<PdProdDto> result = pdProdMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<PdProdDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_prod :: select page :: [orm:mybatis]
        return PageResult.of(pdProdMapper.selectPageList(p), pdProdMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(PdProd entity) {
        // pd_prod :: update :: [orm:mybatis]
        int result = pdProdMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdProd create(PdProd entity) {
        entity.setProdId(CmUtil.generateId("pd_prod"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod :: insert or update :: [orm:jpa]
        PdProd result = pdProdRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public PdProd save(PdProd entity) {
        if (!pdProdRepository.existsById(entity.getProdId()))
            throw new CmBizException("존재하지 않는 PdProd입니다: " + entity.getProdId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod :: insert or update :: [orm:jpa]
        PdProd result = pdProdRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!pdProdRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PdProd입니다: " + id);
        // pd_prod :: delete :: id [orm:jpa]
        pdProdRepository.deleteById(id);
    }
    /** saveList — 저장 */
    @Transactional
    public void saveList(List<PdProd> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PdProd row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setProdId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pd_prod"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pdProdRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getProdId(), "prodId must not be null");
                PdProd entity = pdProdRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "prodId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pdProdRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getProdId(), "prodId must not be null");
                if (pdProdRepository.existsById(id)) pdProdRepository.deleteById(id);
            }
        }
    }
}