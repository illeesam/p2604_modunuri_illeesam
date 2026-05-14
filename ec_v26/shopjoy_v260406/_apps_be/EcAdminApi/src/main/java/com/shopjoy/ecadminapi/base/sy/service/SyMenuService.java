package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;
import com.shopjoy.ecadminapi.base.sy.repository.SyMenuRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyMenuService {

    private final SyMenuRepository syMenuRepository;

    @PersistenceContext
    private EntityManager em;

    public SyMenuDto.Item getById(String id) {
        SyMenuDto.Item dto = syMenuRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyMenuDto.Item getByIdOrNull(String id) {
        return syMenuRepository.selectById(id).orElse(null);
    }

    public SyMenu findById(String id) {
        return syMenuRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyMenu findByIdOrNull(String id) {
        return syMenuRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return syMenuRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syMenuRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<SyMenuDto.Item> getList(SyMenuDto.Request req) {
        return syMenuRepository.selectList(req);
    }

    public SyMenuDto.PageResponse getPageData(SyMenuDto.Request req) {
        PageHelper.addPaging(req);
        return syMenuRepository.selectPageList(req);
    }

    @Transactional
    public SyMenu create(SyMenu body) {
        body.setMenuId(CmUtil.generateId("sy_menu"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyMenu saved = syMenuRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public SyMenu save(SyMenu entity) {
        if (!existsById(entity.getMenuId()))
            throw new CmBizException("존재하지 않는 SyMenu입니다: " + entity.getMenuId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyMenu saved = syMenuRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public SyMenu update(String id, SyMenu body) {
        SyMenu entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "menuId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyMenu saved = syMenuRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public SyMenu updateSelective(SyMenu entity) {
        if (entity.getMenuId() == null) throw new CmBizException("menuId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getMenuId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getMenuId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syMenuRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        SyMenu entity = findById(id);
        syMenuRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<SyMenu> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getMenuId() != null)
            .map(SyMenu::getMenuId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syMenuRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyMenu> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getMenuId() != null)
            .toList();
        for (SyMenu row : updateRows) {
            SyMenu entity = findById(row.getMenuId());
            VoUtil.voCopyExclude(row, entity, "menuId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syMenuRepository.save(entity);
        }
        em.flush();

        List<SyMenu> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyMenu row : insertRows) {
            row.setMenuId(CmUtil.generateId("sy_menu"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syMenuRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
