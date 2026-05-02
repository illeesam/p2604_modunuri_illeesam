package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftCondDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftCond;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmGiftCondMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmGiftCondRepository;
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
public class PmGiftCondService {


    private final PmGiftCondMapper mapper;
    private final PmGiftCondRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmGiftCondDto getById(String id) {
        PmGiftCondDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PmGiftCondDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<PmGiftCondDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PmGiftCondDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PmGiftCond entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmGiftCond create(PmGiftCond entity) {
        entity.setGiftCondId(CmUtil.generateId("pm_gift_cond"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmGiftCond result = repository.save(entity);
        return result;
    }

    @Transactional
    public PmGiftCond save(PmGiftCond entity) {
        if (!repository.existsById(entity.getGiftCondId()))
            throw new CmBizException("존재하지 않는 PmGiftCond입니다: " + entity.getGiftCondId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmGiftCond result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PmGiftCond입니다: " + id);
        repository.deleteById(id);
    }

    @Transactional
    public void saveList(List<PmGiftCond> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PmGiftCond row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setGiftCondId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pm_gift_cond"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                repository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getGiftCondId(), "giftCondId must not be null");
                PmGiftCond entity = repository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "giftCondId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                repository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getGiftCondId(), "giftCondId must not be null");
                if (repository.existsById(id)) repository.deleteById(id);
            }
        }
    }
}