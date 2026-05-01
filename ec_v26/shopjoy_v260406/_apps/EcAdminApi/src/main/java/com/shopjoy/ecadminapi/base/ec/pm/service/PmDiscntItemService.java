package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntItem;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmDiscntItemMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmDiscntItemRepository;
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

@Service
@RequiredArgsConstructor
public class PmDiscntItemService {


    private final PmDiscntItemMapper mapper;
    private final PmDiscntItemRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmDiscntItemDto getById(String id) {
        // pm_discnt_item :: select one :: id [orm:mybatis]
        PmDiscntItemDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PmDiscntItemDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pm_discnt_item :: select list :: p [orm:mybatis]
        List<PmDiscntItemDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PmDiscntItemDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pm_discnt_item :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PmDiscntItem entity) {
        // pm_discnt_item :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmDiscntItem create(PmDiscntItem entity) {
        entity.setDiscntItemId(CmUtil.generateId("pm_discnt_item"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_discnt_item :: insert or update :: [orm:jpa]
        PmDiscntItem result = repository.save(entity);
        return result;
    }

    @Transactional
    public PmDiscntItem save(PmDiscntItem entity) {
        if (!repository.existsById(entity.getDiscntItemId()))
            throw new CmBizException("존재하지 않는 PmDiscntItem입니다: " + entity.getDiscntItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_discnt_item :: insert or update :: [orm:jpa]
        PmDiscntItem result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PmDiscntItem입니다: " + id);
        // pm_discnt_item :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
