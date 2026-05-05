package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItemDiscnt;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdOrderItemDiscntMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderItemDiscntRepository;
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
public class OdOrderItemDiscntService {

    private final OdOrderItemDiscntMapper odOrderItemDiscntMapper;
    private final OdOrderItemDiscntRepository odOrderItemDiscntRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdOrderItemDiscntDto getById(String id) {
        OdOrderItemDiscntDto result = odOrderItemDiscntMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<OdOrderItemDiscntDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdOrderItemDiscntDto> result = odOrderItemDiscntMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<OdOrderItemDiscntDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odOrderItemDiscntMapper.selectPageList(p), odOrderItemDiscntMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(OdOrderItemDiscnt entity) {
        int result = odOrderItemDiscntMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public OdOrderItemDiscnt create(OdOrderItemDiscnt entity) {
        entity.setItemDiscntId(CmUtil.generateId("od_order_item_discnt"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrderItemDiscnt result = odOrderItemDiscntRepository.save(entity);
        return result;
    }

    @Transactional
    public OdOrderItemDiscnt save(OdOrderItemDiscnt entity) {
        if (!odOrderItemDiscntRepository.existsById(entity.getItemDiscntId()))
            throw new CmBizException("존재하지 않는 OdOrderItemDiscnt입니다: " + entity.getItemDiscntId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrderItemDiscnt result = odOrderItemDiscntRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!odOrderItemDiscntRepository.existsById(id))
            throw new CmBizException("존재하지 않는 OdOrderItemDiscnt입니다: " + id);
        odOrderItemDiscntRepository.deleteById(id);
    }
    @Transactional
    public void saveList(List<OdOrderItemDiscnt> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (OdOrderItemDiscnt row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setItemDiscntId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("od_order_item_discnt"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                odOrderItemDiscntRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getItemDiscntId(), "itemDiscntId must not be null");
                OdOrderItemDiscnt entity = odOrderItemDiscntRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "itemDiscntId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                odOrderItemDiscntRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getItemDiscntId(), "itemDiscntId must not be null");
                if (odOrderItemDiscntRepository.existsById(id)) odOrderItemDiscntRepository.deleteById(id);
            }
        }
    }
}