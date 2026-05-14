package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetLibDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidgetLib;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpWidgetLibRepository;
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
public class DpWidgetLibService {

    private final DpWidgetLibRepository dpWidgetLibRepository;

    @PersistenceContext
    private EntityManager em;

    public DpWidgetLibDto.Item getById(String id) {
        DpWidgetLibDto.Item dto = dpWidgetLibRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpWidgetLibDto.Item getByIdOrNull(String id) {
        return dpWidgetLibRepository.selectById(id).orElse(null);
    }

    public DpWidgetLib findById(String id) {
        return dpWidgetLibRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpWidgetLib findByIdOrNull(String id) {
        return dpWidgetLibRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return dpWidgetLibRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!dpWidgetLibRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<DpWidgetLibDto.Item> getList(DpWidgetLibDto.Request req) {
        return dpWidgetLibRepository.selectList(req);
    }

    public DpWidgetLibDto.PageResponse getPageData(DpWidgetLibDto.Request req) {
        PageHelper.addPaging(req);
        return dpWidgetLibRepository.selectPageList(req);
    }

    @Transactional
    public DpWidgetLib create(DpWidgetLib body) {
        body.setWidgetLibId(CmUtil.generateId("dp_widget_lib"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        DpWidgetLib saved = dpWidgetLibRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public DpWidgetLib save(DpWidgetLib entity) {
        if (!existsById(entity.getWidgetLibId()))
            throw new CmBizException("존재하지 않는 DpWidgetLib입니다: " + entity.getWidgetLibId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpWidgetLib saved = dpWidgetLibRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public DpWidgetLib update(String id, DpWidgetLib body) {
        DpWidgetLib entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "widgetLibId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpWidgetLib saved = dpWidgetLibRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public DpWidgetLib updateSelective(DpWidgetLib entity) {
        if (entity.getWidgetLibId() == null) throw new CmBizException("widgetLibId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getWidgetLibId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getWidgetLibId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = dpWidgetLibRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        DpWidgetLib entity = findById(id);
        dpWidgetLibRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<DpWidgetLib> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getWidgetLibId() != null)
            .map(DpWidgetLib::getWidgetLibId)
            .toList();
        if (!deleteIds.isEmpty()) {
            dpWidgetLibRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<DpWidgetLib> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getWidgetLibId() != null)
            .toList();
        for (DpWidgetLib row : updateRows) {
            DpWidgetLib entity = findById(row.getWidgetLibId());
            VoUtil.voCopyExclude(row, entity, "widgetLibId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            dpWidgetLibRepository.save(entity);
        }
        em.flush();

        List<DpWidgetLib> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (DpWidgetLib row : insertRows) {
            row.setWidgetLibId(CmUtil.generateId("dp_widget_lib"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            dpWidgetLibRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
