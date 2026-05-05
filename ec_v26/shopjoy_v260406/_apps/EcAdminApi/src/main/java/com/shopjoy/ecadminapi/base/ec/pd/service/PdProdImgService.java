package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdImgDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdImg;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdImgMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdImgRepository;
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
public class PdProdImgService {

    private final PdProdImgMapper pdProdImgMapper;
    private final PdProdImgRepository pdProdImgRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdProdImgDto getById(String id) {
        // pd_prod_img :: select one :: id [orm:mybatis]
        PdProdImgDto result = pdProdImgMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdProdImgDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_prod_img :: select list :: p [orm:mybatis]
        List<PdProdImgDto> result = pdProdImgMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdProdImgDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_prod_img :: select page :: [orm:mybatis]
        return PageResult.of(pdProdImgMapper.selectPageList(p), pdProdImgMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdProdImg entity) {
        // pd_prod_img :: update :: [orm:mybatis]
        int result = pdProdImgMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdProdImg create(PdProdImg entity) {
        entity.setProdImgId(CmUtil.generateId("pd_prod_img"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_img :: insert or update :: [orm:jpa]
        PdProdImg result = pdProdImgRepository.save(entity);
        return result;
    }

    @Transactional
    public PdProdImg save(PdProdImg entity) {
        if (!pdProdImgRepository.existsById(entity.getProdImgId()))
            throw new CmBizException("존재하지 않는 PdProdImg입니다: " + entity.getProdImgId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_img :: insert or update :: [orm:jpa]
        PdProdImg result = pdProdImgRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!pdProdImgRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PdProdImg입니다: " + id);
        // pd_prod_img :: delete :: id [orm:jpa]
        pdProdImgRepository.deleteById(id);
    }
    @Transactional
    public void saveList(List<PdProdImg> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PdProdImg row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setProdImgId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pd_prod_img"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pdProdImgRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getProdImgId(), "prodImgId must not be null");
                PdProdImg entity = pdProdImgRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "prodImgId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pdProdImgRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getProdImgId(), "prodImgId must not be null");
                if (pdProdImgRepository.existsById(id)) pdProdImgRepository.deleteById(id);
            }
        }
    }
}