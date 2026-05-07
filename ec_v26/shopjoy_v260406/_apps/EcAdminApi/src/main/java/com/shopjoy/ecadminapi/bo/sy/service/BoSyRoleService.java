package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRole;
import com.shopjoy.ecadminapi.base.sy.mapper.SyRoleMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyRoleRepository;
import com.shopjoy.ecadminapi.cache.redisstore.SyRoleMenuRedisStore;
import com.shopjoy.ecadminapi.cache.redisstore.SyRoleRedisStore;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoSyRoleService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final SyRoleMapper        syRoleMapper;
    private final SyRoleRepository    syRoleRepository;
    private final SyRoleRedisStore    roleCache;
    private final SyRoleMenuRedisStore roleMenuCache;
    @PersistenceContext
    private EntityManager em;

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<SyRoleDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return syRoleMapper.selectList(p);
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<SyRoleDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(syRoleMapper.selectPageList(p), syRoleMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** getById — 조회 */
    @Transactional(readOnly = true)
    public SyRoleDto getById(String id) {
        SyRoleDto dto = syRoleMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    /** create — 생성 */
    @Transactional
    public SyRole create(SyRole body) {
        body.setRoleId("RL" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyRole saved = syRoleRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        roleCache.evictAll();
        return saved;
    }

    /** update — 수정 */
    @Transactional
    public SyRoleDto update(String id, SyRole body) {
        SyRole entity = syRoleRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "roleId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyRole saved = syRoleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        roleCache.evictAll();
        return getById(id);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyRole entity = syRoleRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syRoleRepository.delete(entity);
        em.flush();
        if (syRoleRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
        roleCache.evictAll();
        roleMenuCache.evict(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyRole> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리 (roleMenuCache도 함께 evict)
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getRoleId() != null)
            .map(SyRole::getRoleId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syRoleRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
            deleteIds.forEach(roleMenuCache::evict);
        }

        // 2단계: UPDATE 처리
        List<SyRole> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getRoleId() != null)
            .toList();
        for (SyRole row : updateRows) {
            SyRole entity = syRoleRepository.findById(row.getRoleId())
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + row.getRoleId()));
            VoUtil.voCopyExclude(row, entity, "roleId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syRoleRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        List<SyRole> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyRole row : insertRows) {
            row.setRoleId("RL" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syRoleRepository.save(row);
        }
        em.flush();
        em.clear();
        roleCache.evictAll();
    }
}
