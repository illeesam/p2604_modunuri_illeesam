package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;
import com.shopjoy.ecadminapi.base.sy.mapper.SyMenuMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyMenuRepository;
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
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class SyMenuService {


    private final SyMenuMapper mapper;
    private final SyMenuRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyMenuDto getById(String id) {
        // sy_menu :: select one :: id [orm:mybatis]
        SyMenuDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyMenuDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_menu :: select list :: p [orm:mybatis]
        List<SyMenuDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyMenuDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_menu :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyMenu entity) {
        // sy_menu :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyMenu create(SyMenu entity) {
        entity.setMenuId(CmUtil.generateId("sy_menu"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_menu :: insert or update :: [orm:jpa]
        SyMenu result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyMenu save(SyMenu entity) {
        if (!repository.existsById(entity.getMenuId()))
            throw new CmBizException("존재하지 않는 SyMenu입니다: " + entity.getMenuId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_menu :: insert or update :: [orm:jpa]
        SyMenu result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        SyMenu entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

}
