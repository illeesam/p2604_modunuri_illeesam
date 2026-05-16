package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpUiRepository;
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
public class DpUiService {

    private final DpUiRepository dpUiRepository;

    @PersistenceContext
    private EntityManager em;

    /* 전시 UI 키조회 */
    public DpUiDto.Item getById(String id) {
        DpUiDto.Item dto = dpUiRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpUiDto.Item getByIdOrNull(String id) {
        return dpUiRepository.selectById(id).orElse(null);
    }

    /* 전시 UI 상세조회 */
    public DpUi findById(String id) {
        return dpUiRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpUi findByIdOrNull(String id) {
        return dpUiRepository.findById(id).orElse(null);
    }

    /* 전시 UI 키검증 */
    public boolean existsById(String id) {
        return dpUiRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!dpUiRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 전시 UI 목록조회 */
    public List<DpUiDto.Item> getList(DpUiDto.Request req) {
        return dpUiRepository.selectList(req);
    }

    /* 전시 UI 페이지조회 */
    public DpUiDto.PageResponse getPageData(DpUiDto.Request req) {
        PageHelper.addPaging(req);
        return dpUiRepository.selectPageList(req);
    }

    /* 전시 UI 등록 */
    @Transactional
    public DpUi create(DpUi body) {
        body.setUiId(CmUtil.generateId("dp_ui"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        DpUi saved = dpUiRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 전시 UI 저장 */
    @Transactional
    public DpUi save(DpUi entity) {
        if (!existsById(entity.getUiId()))
            throw new CmBizException("존재하지 않는 DpUi입니다: " + entity.getUiId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpUi saved = dpUiRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 전시 UI 수정 */
    @Transactional
    public DpUi update(String id, DpUi body) {
        DpUi entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "uiId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpUi saved = dpUiRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 전시 UI 수정 */
    @Transactional
    public DpUi updateSelective(DpUi entity) {
        if (entity.getUiId() == null) throw new CmBizException("uiId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getUiId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getUiId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = dpUiRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 전시 UI 삭제 */
    @Transactional
    public void delete(String id) {
        DpUi entity = findById(id);
        dpUiRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 전시 UI 목록저장 */
    @Transactional
    public void saveList(List<DpUi> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getUiId() != null)
            .map(DpUi::getUiId)
            .toList();
        if (!deleteIds.isEmpty()) {
            dpUiRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<DpUi> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getUiId() != null)
            .toList();
        for (DpUi row : updateRows) {
            DpUi entity = findById(row.getUiId());
            VoUtil.voCopyExclude(row, entity, "uiId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            dpUiRepository.save(entity);
        }
        em.flush();

        List<DpUi> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (DpUi row : insertRows) {
            row.setUiId(CmUtil.generateId("dp_ui"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            dpUiRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
