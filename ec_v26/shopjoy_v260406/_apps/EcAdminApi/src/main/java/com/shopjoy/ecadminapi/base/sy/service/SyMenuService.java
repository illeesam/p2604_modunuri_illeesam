package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;
import com.shopjoy.ecadminapi.base.sy.mapper.SyMenuMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyMenuRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
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
@Transactional(readOnly = true)
public class SyMenuService {


    private final SyMenuMapper syMenuMapper;
    private final SyMenuRepository syMenuRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public SyMenuDto getById(String id) {
        // sy_menu :: select one :: id [orm:mybatis]
        SyMenuDto result = syMenuMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<SyMenuDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_menu :: select list :: p [orm:mybatis]
        List<SyMenuDto> result = syMenuMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<SyMenuDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_menu :: select page :: p [orm:mybatis]
        return PageResult.of(syMenuMapper.selectPageList(p), syMenuMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyMenu entity) {
        // sy_menu :: update :: entity [orm:mybatis]
        int result = syMenuMapper.updateSelective(entity);
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
        SyMenu result = syMenuRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public SyMenu save(SyMenu entity) {
        if (!syMenuRepository.existsById(entity.getMenuId()))
            throw new CmBizException("존재하지 않는 SyMenu입니다: " + entity.getMenuId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_menu :: insert or update :: [orm:jpa]
        SyMenu result = syMenuRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyMenu entity = syMenuRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syMenuRepository.delete(entity);
        em.flush();
        if (syMenuRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyMenu> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyMenu row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setMenuId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_menu"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syMenuRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getMenuId(), "menuId must not be null");
                SyMenu entity = syMenuRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "menuId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                syMenuRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getMenuId(), "menuId must not be null");
                if (syMenuRepository.existsById(id)) syMenuRepository.deleteById(id);
            }
        }
        em.flush();
    }
}