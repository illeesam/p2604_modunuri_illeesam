package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdTag;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdTagMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdTagRepository;
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
public class PdTagService {


    private final PdTagMapper pdTagMapper;
    private final PdTagRepository pdTagRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdTagDto getById(String id) {
        // pd_tag :: select one :: id [orm:mybatis]
        PdTagDto result = pdTagMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdTagDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_tag :: select list :: p [orm:mybatis]
        List<PdTagDto> result = pdTagMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdTagDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_tag :: select page :: [orm:mybatis]
        return PageResult.of(pdTagMapper.selectPageList(p), pdTagMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdTag entity) {
        // pd_tag :: update :: [orm:mybatis]
        int result = pdTagMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdTag create(PdTag entity) {
        entity.setTagId(CmUtil.generateId("pd_tag"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_tag :: insert or update :: [orm:jpa]
        PdTag result = pdTagRepository.save(entity);
        return result;
    }

    @Transactional
    public PdTag save(PdTag entity) {
        if (!pdTagRepository.existsById(entity.getTagId()))
            throw new CmBizException("존재하지 않는 PdTag입니다: " + entity.getTagId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_tag :: insert or update :: [orm:jpa]
        PdTag result = pdTagRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!pdTagRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PdTag입니다: " + id);
        // pd_tag :: delete :: id [orm:jpa]
        pdTagRepository.deleteById(id);
    }

    @Transactional
    public void saveList(List<PdTag> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PdTag row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setTagId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pd_tag"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pdTagRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getTagId(), "tagId must not be null");
                PdTag entity = pdTagRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "tagId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pdTagRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getTagId(), "tagId must not be null");
                if (pdTagRepository.existsById(id)) pdTagRepository.deleteById(id);
            }
        }
    }
}