package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderDiscnt;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdOrderDiscntMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderDiscntRepository;
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
public class OdOrderDiscntService {

    private final OdOrderDiscntMapper mapper;
    private final OdOrderDiscntRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdOrderDiscntDto getById(String id) {
        OdOrderDiscntDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<OdOrderDiscntDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdOrderDiscntDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<OdOrderDiscntDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(OdOrderDiscnt entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public OdOrderDiscnt create(OdOrderDiscnt entity) {
        entity.setOrderDiscntId(CmUtil.generateId("od_order_discnt"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrderDiscnt result = repository.save(entity);
        return result;
    }

    @Transactional
    public OdOrderDiscnt save(OdOrderDiscnt entity) {
        if (!repository.existsById(entity.getOrderDiscntId()))
            throw new CmBizException("존재하지 않는 OdOrderDiscnt입니다: " + entity.getOrderDiscntId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrderDiscnt result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 OdOrderDiscnt입니다: " + id);
        repository.deleteById(id);
    }
    @Transactional
    public void saveList(List<OdOrderDiscnt> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (OdOrderDiscnt row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setOrderDiscntId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("od_order_discnt"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                repository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getOrderDiscntId(), "orderDiscntId must not be null");
                OdOrderDiscnt entity = repository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "orderDiscntId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                repository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getOrderDiscntId(), "orderDiscntId must not be null");
                if (repository.existsById(id)) repository.deleteById(id);
            }
        }
    }
}