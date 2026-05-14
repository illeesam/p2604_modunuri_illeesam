package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpPanelRepository;
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
public class DpPanelService {

    private final DpPanelRepository dpPanelRepository;

    @PersistenceContext
    private EntityManager em;

    public DpPanelDto.Item getById(String id) {
        DpPanelDto.Item dto = dpPanelRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpPanelDto.Item getByIdOrNull(String id) {
        return dpPanelRepository.selectById(id).orElse(null);
    }

    public DpPanel findById(String id) {
        return dpPanelRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpPanel findByIdOrNull(String id) {
        return dpPanelRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return dpPanelRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!dpPanelRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<DpPanelDto.Item> getList(DpPanelDto.Request req) {
        return dpPanelRepository.selectList(req);
    }

    public DpPanelDto.PageResponse getPageData(DpPanelDto.Request req) {
        PageHelper.addPaging(req);
        return dpPanelRepository.selectPageList(req);
    }

    @Transactional
    public DpPanel create(DpPanel body) {
        body.setPanelId(CmUtil.generateId("dp_panel"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        DpPanel saved = dpPanelRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public DpPanel save(DpPanel entity) {
        if (!existsById(entity.getPanelId()))
            throw new CmBizException("존재하지 않는 DpPanel입니다: " + entity.getPanelId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpPanel saved = dpPanelRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public DpPanel update(String id, DpPanel body) {
        DpPanel entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "panelId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpPanel saved = dpPanelRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public DpPanel updateSelective(DpPanel entity) {
        if (entity.getPanelId() == null) throw new CmBizException("panelId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getPanelId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPanelId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = dpPanelRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        DpPanel entity = findById(id);
        dpPanelRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<DpPanel> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getPanelId() != null)
            .map(DpPanel::getPanelId)
            .toList();
        if (!deleteIds.isEmpty()) {
            dpPanelRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<DpPanel> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getPanelId() != null)
            .toList();
        for (DpPanel row : updateRows) {
            DpPanel entity = findById(row.getPanelId());
            VoUtil.voCopyExclude(row, entity, "panelId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            dpPanelRepository.save(entity);
        }
        em.flush();

        List<DpPanel> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (DpPanel row : insertRows) {
            row.setPanelId(CmUtil.generateId("dp_panel"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            dpPanelRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
