package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;
import com.shopjoy.ecadminapi.base.sy.mapper.SyMenuMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyMenuRepository;
import com.shopjoy.ecadminapi.cache.redisstore.SyMenuRedisStore;
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
@Transactional(readOnly = true)
public class BoSyMenuService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final SyMenuMapper      syMenuMapper;
    private final SyMenuRepository  syMenuRepository;
    private final SyMenuRedisStore  menuCache;
    @PersistenceContext
    private EntityManager em;

    /** getList — 조회 */
    public List<SyMenuDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return syMenuMapper.selectList(p);
    }

    /** getPageData — 조회 */
    public PageResult<SyMenuDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(syMenuMapper.selectPageList(p), syMenuMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** getById — 조회 */
    public SyMenuDto getById(String id) {
        SyMenuDto dto = syMenuMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    /** create — 생성 */
    @Transactional
    public SyMenu create(SyMenu body) {
        body.setMenuId("MN" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyMenu saved = syMenuRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        menuCache.evictAll();
        return saved;
    }

    /** update — 수정 */
    @Transactional
    public SyMenuDto update(String id, SyMenu body) {
        SyMenu entity = syMenuRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "menuId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyMenu saved = syMenuRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        menuCache.evictAll();
        return getById(id);
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
        menuCache.evictAll();
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyMenu> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getMenuId() != null)
            .map(SyMenu::getMenuId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syMenuRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        List<SyMenu> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getMenuId() != null)
            .toList();
        for (SyMenu row : updateRows) {
            SyMenu entity = syMenuRepository.findById(row.getMenuId())
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + row.getMenuId()));
            VoUtil.voCopyExclude(row, entity, "menuId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syMenuRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        List<SyMenu> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyMenu row : insertRows) {
            row.setMenuId("MN" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syMenuRepository.save(row);
        }
        em.flush();
        em.clear();
        menuCache.evictAll();
    }
}