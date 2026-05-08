package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRoleMenu;
import com.shopjoy.ecadminapi.base.sy.mapper.SyRoleMenuMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyRoleMenuRepository;
import com.shopjoy.ecadminapi.cache.redisstore.SyRoleMenuRedisStore;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyRoleMenuService {

    private final SyRoleMenuMapper     syRoleMenuMapper;
    private final SyRoleMenuRepository syRoleMenuRepository;
    private final SyRoleMenuRedisStore roleMenuCache;

    @PersistenceContext
    private EntityManager em;

    /** getList — 조회 */
    public List<SyRoleMenuDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return syRoleMenuMapper.selectList(p);
    }

    /** getPageData — 조회 */
    public PageResult<SyRoleMenuDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(syRoleMenuMapper.selectPageList(p), syRoleMenuMapper.selectPageCount(p),
            PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** getById — 조회 */
    public SyRoleMenuDto getById(String id) {
        SyRoleMenuDto dto = syRoleMenuMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    /** create — 생성 */
    @Transactional
    public SyRoleMenu create(SyRoleMenu body) {
        body.setRoleMenuId(CmUtil.generateId("sy_role_menu"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyRoleMenu saved = syRoleMenuRepository.save(body);
        evictIfPresent(saved.getRoleId());
        return saved;
    }

    /** update — 수정 */
    @Transactional
    public SyRoleMenuDto update(String id, SyRoleMenu body) {
        SyRoleMenu entity = syRoleMenuRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        if (body.getRoleId()    != null) entity.setRoleId(body.getRoleId());
        if (body.getMenuId()    != null) entity.setMenuId(body.getMenuId());
        if (body.getPermLevel() != null) entity.setPermLevel(body.getPermLevel());
        if (body.getSiteId()    != null) entity.setSiteId(body.getSiteId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        syRoleMenuRepository.save(entity);
        em.flush();
        evictIfPresent(entity.getRoleId());
        return getById(id);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyRoleMenu entity = syRoleMenuRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        String roleId = entity.getRoleId();
        syRoleMenuRepository.delete(entity);
        em.flush();
        if (syRoleMenuRepository.existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
        evictIfPresent(roleId);
    }

    /** evictIfPresent */
    private void evictIfPresent(String roleId) {
        if (roleId != null) roleMenuCache.evict(roleId);
    }
    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyRoleMenu> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getRoleMenuId() != null)
            .map(SyRoleMenu::getRoleMenuId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syRoleMenuRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        List<SyRoleMenu> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getRoleMenuId() != null)
            .toList();
        for (SyRoleMenu row : updateRows) {
            SyRoleMenu entity = syRoleMenuRepository.findById(row.getRoleMenuId())
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + row.getRoleMenuId()));
            VoUtil.voCopyExclude(row, entity, "roleMenuId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syRoleMenuRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        List<SyRoleMenu> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyRoleMenu row : insertRows) {
            row.setRoleMenuId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_role_menu"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syRoleMenuRepository.save(row);
        }
        em.flush();
        em.clear();
        rows.stream().map(SyRoleMenu::getRoleId).filter(java.util.Objects::nonNull).distinct().forEach(this::evictIfPresent);
    }
}