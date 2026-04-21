package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveItem;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmSaveItemMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmSaveItemRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PmSaveItemService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final PmSaveItemMapper      mapper;
    private final PmSaveItemRepository  repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmSaveItemDto getById(String id) {
        PmSaveItemDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PmSaveItemDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<PmSaveItemDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PmSaveItem entity) {
        return mapper.updateSelective(entity);
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmSaveItem create(PmSaveItem entity) {
        entity.setSaveItemId(generateId());
        entity.setRegBy(SecurityUtil.currentUserId());
        entity.setRegDate(LocalDateTime.now());
        return repository.save(entity);
    }

    @Transactional
    public PmSaveItem save(PmSaveItem entity) {
        if (!repository.existsById(entity.getSaveItemId()))
            throw new CmBizException("존재하지 않는 PmSaveItem입니다: " + entity.getSaveItemId());
        entity.setUpdBy(SecurityUtil.currentUserId());
        entity.setUpdDate(LocalDateTime.now());
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PmSaveItem입니다: " + id);
        repository.deleteById(id);
    }

    /** ID 생성: prefix=SAI (pm_save_item) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "SAI" + ts + rand;
    }
}
