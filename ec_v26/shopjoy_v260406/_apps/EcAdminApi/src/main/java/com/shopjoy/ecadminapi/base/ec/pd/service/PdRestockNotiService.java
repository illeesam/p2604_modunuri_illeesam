package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdRestockNotiDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdRestockNoti;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdRestockNotiMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdRestockNotiRepository;
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
public class PdRestockNotiService {


    private final PdRestockNotiMapper mapper;
    private final PdRestockNotiRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdRestockNotiDto getById(String id) {
        // pd_restock_noti :: select one :: id [orm:mybatis]
        PdRestockNotiDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdRestockNotiDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_restock_noti :: select list :: p [orm:mybatis]
        List<PdRestockNotiDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdRestockNotiDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_restock_noti :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdRestockNoti entity) {
        // pd_restock_noti :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdRestockNoti create(PdRestockNoti entity) {
        entity.setRestockNotiId(CmUtil.generateId("pd_restock_noti"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_restock_noti :: insert or update :: [orm:jpa]
        PdRestockNoti result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdRestockNoti save(PdRestockNoti entity) {
        if (!repository.existsById(entity.getRestockNotiId()))
            throw new CmBizException("존재하지 않는 PdRestockNoti입니다: " + entity.getRestockNotiId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_restock_noti :: insert or update :: [orm:jpa]
        PdRestockNoti result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PdRestockNoti입니다: " + id);
        // pd_restock_noti :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    @Transactional
    public void saveList(List<PdRestockNoti> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PdRestockNoti row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setRestockNotiId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pd_restock_noti"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                repository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getRestockNotiId(), "restockNotiId must not be null");
                PdRestockNoti entity = repository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "restockNotiId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                repository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getRestockNotiId(), "restockNotiId must not be null");
                if (repository.existsById(id)) repository.deleteById(id);
            }
        }
    }
}