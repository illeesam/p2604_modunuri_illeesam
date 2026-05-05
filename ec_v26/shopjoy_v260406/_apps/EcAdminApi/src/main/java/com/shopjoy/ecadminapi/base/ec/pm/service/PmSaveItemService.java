package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveItem;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmSaveItemMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmSaveItemRepository;
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
public class PmSaveItemService {


    private final PmSaveItemMapper      pmSaveItemMapper;
    private final PmSaveItemRepository  pmSaveItemRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmSaveItemDto getById(String id) {
        PmSaveItemDto result = pmSaveItemMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PmSaveItemDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return pmSaveItemMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<PmSaveItemDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(pmSaveItemMapper.selectPageList(p), pmSaveItemMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PmSaveItem entity) {
        return pmSaveItemMapper.updateSelective(entity);
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmSaveItem create(PmSaveItem entity) {
        entity.setSaveItemId(CmUtil.generateId("pm_save_item"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        return pmSaveItemRepository.save(entity);
    }

    @Transactional
    public PmSaveItem save(PmSaveItem entity) {
        if (!pmSaveItemRepository.existsById(entity.getSaveItemId()))
            throw new CmBizException("존재하지 않는 PmSaveItem입니다: " + entity.getSaveItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        return pmSaveItemRepository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        if (!pmSaveItemRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PmSaveItem입니다: " + id);
        pmSaveItemRepository.deleteById(id);
    }

    @Transactional
    public void saveList(List<PmSaveItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PmSaveItem row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setSaveItemId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pm_save_item"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmSaveItemRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getSaveItemId(), "saveItemId must not be null");
                PmSaveItem entity = pmSaveItemRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "saveItemId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pmSaveItemRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getSaveItemId(), "saveItemId must not be null");
                if (pmSaveItemRepository.existsById(id)) pmSaveItemRepository.deleteById(id);
            }
        }
    }
}